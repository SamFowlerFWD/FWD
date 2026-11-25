// The client area API: everything under /api/portal/*.
// Sam (admin) manages clients and projects; clients see only their own.

import {
  type D1, type Env, type User, HttpError, EMAIL_RE,
  adminEmail, clean, json, later, now, randomToken, readJson, sha256, ukDateTime,
} from './core';
import { ensureSchema } from './db';
import { sendEmail, toBase64 } from './email';
import { signedPack } from './pdf';
import { bankDetails, paymentLines, paymentRoutes, requestOnSigning, syncProject, syncStale } from './payments';
import { paymentsEnabled } from './revolut';
import { bankRoutes, bankStatus, syncBank } from './bank';
import { BRIEF_QUESTIONS, DEFAULT_ITEMS, MAX_UPLOAD_BYTES, STAGES } from '../../src/data/portal';

const COOKIE = 'fwd_portal';
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const SESSION_MS = 30 * DAY;
const LOGIN_LINK_MS = 30 * MINUTE;
const INVITE_LINK_MS = 7 * DAY;

export interface Ctx {
  request: Request;
  env: Env;
  db: D1;
  url: URL;
  user: User | null;
}
export type Handler = (c: Ctx, params: string[]) => Promise<Response>;
type Access = 'public' | 'user' | 'admin';
export type Route = [string, RegExp, Access, Handler];

interface Project { id: string; client_id: string; name: string; stage: string; notes: string; created_at: string; updated_at: string }
interface Client { id: string; name: string; company: string }
interface Contract {
  project_id: string; status: 'draft' | 'sent' | 'signed';
  sow_key: string | null; sow_filename: string | null; sow_hash: string | null; sow_size: number | null;
  terms_id: string | null; sent_at: string | null; sent_by: string | null;
  signed_at: string | null; signer_name: string | null; signer_position: string | null; signer_email: string | null;
  signer_ip: string | null; signer_ua: string | null; signed_key: string | null;
}
interface Terms { id: string; label: string; r2_key: string; filename: string; hash: string; size: number; created_at: string }

// ---------- sessions ----------

function cookieToken(request: Request): string | null {
  const match = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)fwd_portal=([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

function cookie(url: URL, value: string, maxAgeSeconds: number): string {
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

async function currentUser(db: D1, request: Request): Promise<User | null> {
  const token = cookieToken(request);
  if (!token) return null;
  return db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.client_id FROM sessions s
       JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .bind(await sha256(token), now())
    .first<User>();
}

export async function loginLink(c: Ctx, userId: string, lifetimeMs: number): Promise<string> {
  const token = randomToken();
  await c.db
    .prepare('INSERT INTO login_tokens (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256(token), userId, now(), later(lifetimeMs))
    .run();
  // The token sits after the # so it never reaches server logs or referrers.
  return `${c.url.origin}/portal#/signin/${token}`;
}

const publicUser = (u: User) => ({ email: u.email, name: u.name, role: u.role });

// ---------- auth routes ----------

const login: Handler = async (c) => {
  const body = await readJson(c.request);
  const email = clean(body.email, 200).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new HttpError(422, 'invalid');

  await c.db.batch([
    c.db.prepare('DELETE FROM login_tokens WHERE expires_at < ?').bind(now()),
    c.db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now()),
  ]);

  let user = await c.db.prepare('SELECT id, email, name, role, client_id FROM users WHERE email = ?').bind(email).first<User>();
  if (!user && email === adminEmail(c.env)) {
    user = { id: crypto.randomUUID(), email, name: 'Sam', role: 'admin', client_id: null };
    await c.db
      .prepare("INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, ?, 'admin', ?)")
      .bind(user.id, email, user.name, now())
      .run();
  }
  // Same answer whether or not the address is known, so nobody can fish for client emails.
  if (!user) return json({ ok: true });

  const recent = await c.db
    .prepare('SELECT COUNT(*) AS n FROM login_tokens WHERE user_id = ? AND created_at > ?')
    .bind(user.id, new Date(Date.now() - 15 * MINUTE).toISOString())
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= 5) return json({ ok: true });

  const link = await loginLink(c, user.id, LOGIN_LINK_MS);
  await sendEmail(c.env, {
    to: [user.email],
    subject: 'Your FWD sign-in link',
    text: [
      `Hi${user.name ? ` ${user.name.split(' ')[0]}` : ''},`,
      '',
      'Here is your link to sign in to the FWD client area:',
      '',
      link,
      '',
      'It works once and expires in 30 minutes. If you did not ask for this, you can ignore this email.',
    ].join('\n'),
  });
  return json({ ok: true, ...(c.env.PORTAL_DEV === '1' ? { devLink: link } : {}) });
};

const verify: Handler = async (c) => {
  const body = await readJson(c.request);
  const token = clean(body.token, 100);
  if (!token) throw new HttpError(400, 'bad_request');
  const hash = await sha256(token);
  const row = await c.db
    .prepare('SELECT user_id, expires_at, used_at FROM login_tokens WHERE token_hash = ?')
    .bind(hash)
    .first<{ user_id: string; expires_at: string; used_at: string | null }>();
  if (!row || row.used_at || row.expires_at < now()) throw new HttpError(401, 'link_expired');

  const user = await c.db.prepare('SELECT id, email, name, role, client_id FROM users WHERE id = ?').bind(row.user_id).first<User>();
  if (!user) throw new HttpError(401, 'link_expired');

  const session = randomToken();
  await c.db.batch([
    c.db.prepare('UPDATE login_tokens SET used_at = ? WHERE token_hash = ?').bind(now(), hash),
    c.db
      .prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .bind(await sha256(session), user.id, now(), later(SESSION_MS)),
    c.db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').bind(now(), user.id),
  ]);
  return json({ ok: true, user: publicUser(user) }, 200, { 'Set-Cookie': cookie(c.url, session, SESSION_MS / 1000) });
};

const logout: Handler = async (c) => {
  const token = cookieToken(c.request);
  if (token) await c.db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  return json({ ok: true }, 200, { 'Set-Cookie': cookie(c.url, '', 0) });
};

const me: Handler = async (c) => json({ ok: true, user: c.user ? publicUser(c.user) : null });

// ---------- shared helpers ----------

export async function getProject(c: Ctx, id: string): Promise<Project> {
  const project = await c.db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first<Project>();
  // A client asking for someone else's project gets the same answer as a missing one.
  if (!project || (c.user!.role !== 'admin' && project.client_id !== c.user!.client_id)) {
    throw new HttpError(404, 'not_found');
  }
  return project;
}

async function getContract(c: Ctx, projectId: string): Promise<Contract | null> {
  return c.db.prepare('SELECT * FROM contracts WHERE project_id = ?').bind(projectId).first<Contract>();
}

const currentTerms = (c: Ctx) => c.db.prepare('SELECT * FROM terms ORDER BY created_at DESC LIMIT 1').first<Terms>();

// A draft goes out with the newest Terms of Business. Once sent, the contract
// is pinned to the version the client was shown.
async function termsFor(c: Ctx, contract: Contract): Promise<Terms | null> {
  if (contract.status === 'draft' || !contract.terms_id) return currentTerms(c);
  return c.db.prepare('SELECT * FROM terms WHERE id = ?').bind(contract.terms_id).first<Terms>();
}

// What the browser sends back when signing, to prove which two files it showed.
const signingHash = (contract: Contract, terms: Terms | null) =>
  contract.sow_hash && terms ? `${contract.sow_hash}:${terms.hash}` : '';

export async function clientLogin(c: Ctx, clientId: string): Promise<User | null> {
  return c.db
    .prepare("SELECT id, email, name, role, client_id FROM users WHERE client_id = ? AND role = 'client' ORDER BY created_at LIMIT 1")
    .bind(clientId)
    .first<User>();
}

export function record(c: Ctx, projectId: string, action: string) {
  const actor = c.user!.role === 'admin' ? 'Sam' : c.user!.name || c.user!.email;
  return [
    c.db.prepare('INSERT INTO activity (project_id, actor, action, created_at) VALUES (?, ?, ?, ?)').bind(projectId, actor, action, now()),
    c.db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').bind(now(), projectId),
  ];
}

async function projectPayload(c: Ctx, project: Project) {
  const admin = c.user!.role === 'admin';
  await syncProject(c, project.id); // pick up anything paid at Revolut since last time
  await syncBank(c); // and any bank payments that have arrived
  const [client, contract, brief, items, files, tasks, activity, login] = await Promise.all([
    c.db.prepare('SELECT id, name, company FROM clients WHERE id = ?').bind(project.client_id).first<Client>(),
    getContract(c, project.id),
    c.db.prepare('SELECT answers, submitted_at FROM briefs WHERE project_id = ?').bind(project.id).first<{ answers: string; submitted_at: string | null }>(),
    c.db.prepare('SELECT id, kind, label, help, status, note FROM items WHERE project_id = ? ORDER BY position, rowid').bind(project.id).all(),
    c.db.prepare('SELECT id, item_id, filename, size, created_at FROM files WHERE project_id = ? ORDER BY created_at').bind(project.id).all(),
    c.db
      .prepare(`SELECT id, title, due, done, client_visible FROM tasks WHERE project_id = ? ${admin ? '' : 'AND client_visible = 1'} ORDER BY done, (due IS NULL OR due = ''), due, created_at`)
      .bind(project.id)
      .all(),
    admin
      ? c.db.prepare('SELECT actor, action, created_at FROM activity WHERE project_id = ? ORDER BY id DESC LIMIT 40').bind(project.id).all()
      : Promise.resolve({ results: [] }),
    admin ? clientLogin(c, project.client_id) : Promise.resolve(null),
  ]);

  const payments = await paymentLines(c, project.id);
  // Clients never see a contract that is still a draft.
  const showContract = contract && (admin || contract.status !== 'draft');
  const terms = contract ? await termsFor(c, contract) : null;
  return {
    project: {
      id: project.id, name: project.name, stage: project.stage,
      ...(admin ? { notes: project.notes, created_at: project.created_at } : {}),
    },
    client: client && { ...client, ...(admin && login ? { email: login.email } : {}) },
    contract: showContract
      ? {
          status: contract.status,
          sow: contract.sow_key ? { filename: contract.sow_filename, size: contract.sow_size } : null,
          terms: terms ? { id: terms.id, label: terms.label } : null,
          hash: signingHash(contract, terms),
          sent_at: contract.sent_at, signed_at: contract.signed_at,
          signer_name: contract.signer_name, signer_position: contract.signer_position,
          ...(admin ? { signer_email: contract.signer_email, signer_ip: contract.signer_ip } : {}),
        }
      : null,
    brief: { answers: JSON.parse(brief?.answers || '{}'), submitted_at: brief?.submitted_at ?? null },
    items: items.results,
    files: files.results,
    tasks: tasks.results,
    payments,
    paymentsEnabled: paymentsEnabled(c.env),
    // A client only sees the bank details when there is something to pay into them.
    bank: admin || payments.some((p) => p.status === 'requested' || p.method === 'standing_order') ? await bankDetails(c) : null,
    activity: activity.results,
  };
}

// ---------- projects ----------

const listProjects: Handler = async (c) => {
  if (c.user!.role === 'admin') {
    await syncStale(c);
    await syncBank(c);
    const [projects, clients, terms] = await Promise.all([
      c.db
        .prepare(
          `SELECT p.id, p.name, p.stage, p.updated_at, p.client_id, c.name AS client_name, c.company,
            (SELECT status FROM contracts WHERE project_id = p.id) AS contract_status,
            (SELECT submitted_at FROM briefs WHERE project_id = p.id) AS brief_submitted_at,
            (SELECT COUNT(*) FROM items WHERE project_id = p.id) AS items_total,
            (SELECT COUNT(*) FROM items WHERE project_id = p.id AND status = 'done') AS items_done,
            (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND done = 0) AS tasks_open,
            (SELECT COUNT(*) FROM payments WHERE project_id = p.id AND status = 'requested') AS payments_due,
            (SELECT COUNT(*) FROM payments WHERE project_id = p.id AND status = 'overdue') AS payments_overdue,
            (SELECT COUNT(*) FROM payments y WHERE y.project_id = p.id AND y.method = 'standing_order' AND y.status IN ('requested','active')
              AND NOT EXISTS (SELECT 1 FROM payment_receipts r WHERE r.payment_id = y.id AND r.period = strftime('%Y-%m', 'now'))) AS standing_orders_to_check,
            (SELECT MIN(due) FROM tasks WHERE project_id = p.id AND done = 0 AND due IS NOT NULL AND due != '') AS next_due
           FROM projects p JOIN clients c ON c.id = p.client_id ORDER BY p.updated_at DESC`,
        )
        .all(),
      c.db
        .prepare(
          `SELECT c.id, c.name, c.company, u.email, u.last_login_at FROM clients c
           LEFT JOIN users u ON u.client_id = c.id AND u.role = 'client' ORDER BY c.name COLLATE NOCASE`,
        )
        .all(),
      currentTerms(c),
    ]);
    return json({ ok: true, projects: projects.results, clients: clients.results,
      terms: terms && { id: terms.id, label: terms.label, filename: terms.filename, created_at: terms.created_at },
      paymentsEnabled: paymentsEnabled(c.env),
      bank: await bankDetails(c),
      bankMatching: await bankStatus(c),
    });
  }
  const projects = await c.db
    .prepare('SELECT id, name, stage FROM projects WHERE client_id = ? ORDER BY created_at DESC')
    .bind(c.user!.client_id)
    .all();
  return json({ ok: true, projects: projects.results });
};

const showProject: Handler = async (c, [id]) => json({ ok: true, ...(await projectPayload(c, await getProject(c, id))) });

const createClient: Handler = async (c) => {
  const body = await readJson(c.request);
  const name = clean(body.name, 100);
  const company = clean(body.company, 150);
  const email = clean(body.email, 200).toLowerCase();
  if (!name || !EMAIL_RE.test(email)) throw new HttpError(422, 'invalid');
  if (await c.db.prepare('SELECT 1 FROM users WHERE email = ?').bind(email).first()) throw new HttpError(409, 'email_in_use');
  const id = crypto.randomUUID();
  await c.db.batch([
    c.db.prepare('INSERT INTO clients (id, name, company, created_at) VALUES (?, ?, ?, ?)').bind(id, name, company, now()),
    c.db
      .prepare("INSERT INTO users (id, email, name, role, client_id, created_at) VALUES (?, ?, ?, 'client', ?, ?)")
      .bind(crypto.randomUUID(), email, name, id, now()),
  ]);
  return json({ ok: true, id });
};

const updateClient: Handler = async (c, [id]) => {
  const body = await readJson(c.request);
  const name = clean(body.name, 100);
  const company = clean(body.company, 150);
  const email = clean(body.email, 200).toLowerCase();
  if (!name || !EMAIL_RE.test(email)) throw new HttpError(422, 'invalid');
  const login = await clientLogin(c, id);
  if (!login) throw new HttpError(404, 'not_found');
  const clash = await c.db.prepare('SELECT 1 FROM users WHERE email = ? AND id != ?').bind(email, login.id).first();
  if (clash) throw new HttpError(409, 'email_in_use');
  const statements = [
    c.db.prepare('UPDATE clients SET name = ?, company = ? WHERE id = ?').bind(name, company, id),
    c.db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').bind(name, email, login.id),
  ];
  // A changed address signs the old one out everywhere.
  if (email !== login.email) {
    statements.push(
      c.db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(login.id),
      c.db.prepare('DELETE FROM login_tokens WHERE user_id = ?').bind(login.id),
    );
  }
  await c.db.batch(statements);
  return json({ ok: true });
};

const createProject: Handler = async (c) => {
  const body = await readJson(c.request);
  const name = clean(body.name, 150);
  const clientId = clean(body.clientId, 60);
  if (!name) throw new HttpError(422, 'invalid');
  if (!(await c.db.prepare('SELECT 1 FROM clients WHERE id = ?').bind(clientId).first())) throw new HttpError(422, 'invalid');
  const id = crypto.randomUUID();
  const t = now();
  await c.db.batch([
    c.db.prepare('INSERT INTO projects (id, client_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').bind(id, clientId, name, t, t),
    c.db.prepare('INSERT INTO contracts (project_id, updated_at) VALUES (?, ?)').bind(id, t),
    c.db.prepare('INSERT INTO briefs (project_id, updated_at) VALUES (?, ?)').bind(id, t),
    ...DEFAULT_ITEMS.map((item, i) =>
      c.db
        .prepare('INSERT INTO items (id, project_id, kind, label, help, position, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), id, item.kind, item.label, item.help, i, t),
    ),
    c.db.prepare("INSERT INTO activity (project_id, actor, action, created_at) VALUES (?, 'Sam', 'Project created', ?)").bind(id, t),
  ]);
  return json({ ok: true, id });
};

const updateProject: Handler = async (c, [id]) => {
  const project = await getProject(c, id);
  const body = await readJson(c.request);
  const name = body.name === undefined ? project.name : clean(body.name, 150);
  const stage = body.stage === undefined ? project.stage : clean(body.stage, 30);
  const notes = body.notes === undefined ? project.notes : clean(body.notes, 20000);
  if (!name || !STAGES.some((s) => s.id === stage)) throw new HttpError(422, 'invalid');
  const statements = [c.db.prepare('UPDATE projects SET name = ?, stage = ?, notes = ?, updated_at = ? WHERE id = ?').bind(name, stage, notes, now(), id)];
  if (stage !== project.stage) {
    statements.push(...record(c, id, `Stage changed to ${STAGES.find((s) => s.id === stage)!.label}`));
  }
  await c.db.batch(statements);
  return json({ ok: true });
};

const deleteProject: Handler = async (c, [id]) => {
  await getProject(c, id);
  // A monthly payment would carry on being taken with nothing here to show for it.
  const running = await c.db.prepare("SELECT 1 FROM payments WHERE project_id = ? AND status IN ('active','overdue')").bind(id).first();
  if (running) throw new HttpError(409, 'payments_running');
  const files = await c.db.prepare('SELECT r2_key FROM files WHERE project_id = ?').bind(id).all<{ r2_key: string }>();
  const contract = await getContract(c, id);
  const keys = [...files.results.map((f) => f.r2_key), contract?.sow_key, contract?.signed_key].filter((k): k is string => Boolean(k));
  if (keys.length && c.env.FILES) await c.env.FILES.delete(keys);
  await c.db.batch(
    ['contracts', 'briefs', 'items', 'files', 'tasks', 'activity', 'payments', 'payment_receipts', 'bank_matches']
      .map((table) => c.db.prepare(`DELETE FROM ${table} WHERE project_id = ?`).bind(id))
      .concat(c.db.prepare('DELETE FROM projects WHERE id = ?').bind(id)),
  );
  return json({ ok: true });
};

const invite: Handler = async (c, [id]) => {
  const project = await getProject(c, id);
  const login = await clientLogin(c, project.client_id);
  if (!login) throw new HttpError(404, 'not_found');
  const link = await loginLink(c, login.id, INVITE_LINK_MS);
  const sent = await sendEmail(c.env, {
    to: [login.email],
    subject: `Getting started on ${project.name}`,
    text: [
      `Hi ${login.name.split(' ')[0]},`,
      '',
      `I have set up a private area for ${project.name}. It is where you can read and sign the agreement, tell me about the project, and send me your logo, photos and text.`,
      '',
      'This link signs you in. It works once and lasts 7 days:',
      '',
      link,
      '',
      'After that, go to https://f-w-d.co.uk/portal and enter this email address to get a new link. There is no password to remember.',
    ].join('\n'),
  });
  await c.db.batch(record(c, id, `Sign-in link sent to ${login.email}`));
  return json({ ok: true, sent, ...(c.env.PORTAL_DEV === '1' ? { devLink: link } : {}) });
};

// ---------- contract: Statement of Work + Terms of Business ----------

const MAX_PDF_BYTES = 15 * 1024 * 1024;

async function readPdf(c: Ctx): Promise<{ form: FormData; filename: string; bytes: ArrayBuffer }> {
  if (!c.env.FILES) throw new HttpError(503, 'storage_not_configured');
  if (Number(c.request.headers.get('Content-Length') || 0) > MAX_PDF_BYTES + 1024 * 1024) throw new HttpError(413, 'too_large');
  let form: FormData;
  try {
    form = await c.request.formData();
  } catch {
    throw new HttpError(400, 'bad_request');
  }
  const file = form.get('file');
  if (!file || typeof file === 'string') throw new HttpError(400, 'bad_request');
  const upload = file as File;
  if (upload.size > MAX_PDF_BYTES) throw new HttpError(413, 'too_large');
  const bytes = await upload.arrayBuffer();
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') throw new HttpError(422, 'not_pdf');
  const filename = clean(upload.name, 150).replace(/[\\/\u0000-\u001f"]/g, '_') || 'document.pdf';
  return { form, filename, bytes };
}

const inlinePdf = (body: ReadableStream | Uint8Array, filename: string, download = false) =>
  new Response(body as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  });

const uploadTerms: Handler = async (c) => {
  const { form, filename, bytes } = await readPdf(c);
  const label = clean(form.get('label'), 100);
  if (!label) throw new HttpError(422, 'invalid');
  const id = crypto.randomUUID();
  const key = `terms/${id}.pdf`;
  await c.env.FILES!.put(key, bytes, { httpMetadata: { contentType: 'application/pdf' } });
  await c.db
    .prepare('INSERT INTO terms (id, label, r2_key, filename, hash, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, label, key, filename, await sha256(bytes), bytes.byteLength, now())
    .run();
  return json({ ok: true, id });
};

// The Terms of Business are the same for every client, so any signed-in user may read any version.
const downloadTerms: Handler = async (c, [termsId]) => {
  const terms = await c.db.prepare('SELECT * FROM terms WHERE id = ?').bind(termsId).first<Terms>();
  const object = terms && c.env.FILES ? await c.env.FILES.get(terms.r2_key) : null;
  if (!terms || !object) throw new HttpError(404, 'not_found');
  return inlinePdf(object.body, `FWD Terms of Business, ${terms.label}.pdf`);
};

const uploadSow: Handler = async (c, [id]) => {
  await getProject(c, id);
  const contract = await getContract(c, id);
  if (!contract) throw new HttpError(404, 'not_found');
  if (contract.status === 'signed') throw new HttpError(409, 'already_signed');
  const { filename, bytes } = await readPdf(c);
  const key = `projects/${id}/sow-${crypto.randomUUID()}.pdf`;
  await c.env.FILES!.put(key, bytes, { httpMetadata: { contentType: 'application/pdf' } });
  await c.db.batch([
    c.db
      .prepare('UPDATE contracts SET sow_key = ?, sow_filename = ?, sow_hash = ?, sow_size = ?, updated_at = ? WHERE project_id = ?')
      .bind(key, filename, await sha256(bytes), bytes.byteLength, now(), id),
    ...record(c, id, `Statement of Work uploaded (${filename})`),
  ]);
  if (contract.sow_key) await c.env.FILES!.delete(contract.sow_key);
  return json({ ok: true });
};

const downloadSow: Handler = async (c, [id]) => {
  await getProject(c, id);
  const contract = await getContract(c, id);
  if (!contract?.sow_key || (contract.status === 'draft' && c.user!.role !== 'admin')) throw new HttpError(404, 'not_found');
  const object = c.env.FILES ? await c.env.FILES.get(contract.sow_key) : null;
  if (!object) throw new HttpError(404, 'not_found');
  return inlinePdf(object.body, contract.sow_filename || 'Statement of Work.pdf');
};

const sendContract: Handler = async (c, [id]) => {
  const project = await getProject(c, id);
  const contract = await getContract(c, id);
  if (!contract?.sow_key) throw new HttpError(422, 'no_sow');
  if (contract.status === 'signed') throw new HttpError(409, 'already_signed');
  const terms = await currentTerms(c);
  if (!terms) throw new HttpError(422, 'no_terms');
  const login = await clientLogin(c, project.client_id);
  if (!login) throw new HttpError(404, 'not_found');
  const link = await loginLink(c, login.id, INVITE_LINK_MS);
  await c.db.batch([
    c.db
      .prepare("UPDATE contracts SET status = 'sent', terms_id = ?, sent_at = ?, sent_by = ?, updated_at = ? WHERE project_id = ?")
      .bind(terms.id, now(), c.user!.email, now(), id),
    ...record(c, id, `Statement of Work sent for signature with Terms of Business ${terms.label}`),
  ]);
  const sent = await sendEmail(c.env, {
    to: [login.email],
    subject: `Ready to sign: ${project.name}`,
    text: [
      `Hi ${login.name.split(' ')[0]},`,
      '',
      `The Statement of Work for ${project.name} is ready for you to read and sign, along with our Terms of Business. Signing takes a couple of minutes:`,
      '',
      link,
      '',
      'The link signs you in, works once and lasts 7 days. Any questions before you sign, just reply to this email.',
    ].join('\n'),
  });
  return json({ ok: true, sent, ...(c.env.PORTAL_DEV === '1' ? { devLink: link } : {}) });
};

const unsendContract: Handler = async (c, [id]) => {
  await getProject(c, id);
  const contract = await getContract(c, id);
  if (contract?.status !== 'sent') throw new HttpError(409, 'not_sent');
  await c.db.batch([
    c.db.prepare("UPDATE contracts SET status = 'draft', terms_id = NULL, sent_at = NULL, sent_by = NULL WHERE project_id = ?").bind(id),
    ...record(c, id, 'Statement of Work withdrawn for changes'),
  ]);
  return json({ ok: true });
};

// Joins the SOW, the Terms and the signature record into one PDF and keeps it.
async function buildSignedPack(c: Ctx, project: Project, contract: Contract): Promise<Uint8Array> {
  const terms = await termsFor(c, contract);
  if (!c.env.FILES || !contract.sow_key || !terms) throw new HttpError(404, 'not_found');
  const [sow, termsFile, client] = await Promise.all([
    c.env.FILES.get(contract.sow_key),
    c.env.FILES.get(terms.r2_key),
    c.db.prepare('SELECT id, name, company FROM clients WHERE id = ?').bind(project.client_id).first<Client>(),
  ]);
  if (!sow || !termsFile) throw new HttpError(404, 'not_found');
  const pdf = await signedPack(await sow.arrayBuffer(), await termsFile.arrayBuffer(), {
    projectName: project.name, clientName: client?.name ?? '', company: client?.company ?? '',
    sowFilename: contract.sow_filename ?? '', sowHash: contract.sow_hash ?? '',
    termsLabel: terms.label, termsHash: terms.hash,
    sentBy: contract.sent_by ?? adminEmail(c.env), sentAt: contract.sent_at ?? contract.signed_at!,
    signerName: contract.signer_name ?? '', signerPosition: contract.signer_position ?? '',
    signerEmail: contract.signer_email ?? '', signerIp: contract.signer_ip ?? '',
    signerUa: contract.signer_ua ?? '', signedAt: contract.signed_at!,
  });
  const key = `projects/${project.id}/signed-${crypto.randomUUID()}.pdf`;
  await c.env.FILES.put(key, pdf, { httpMetadata: { contentType: 'application/pdf' } });
  await c.db.prepare('UPDATE contracts SET signed_key = ? WHERE project_id = ?').bind(key, project.id).run();
  return pdf;
}

const signContract: Handler = async (c, [id]) => {
  if (c.user!.role !== 'client') throw new HttpError(403, 'clients_only');
  const project = await getProject(c, id);
  const contract = await getContract(c, id);
  if (!contract || contract.status === 'draft') throw new HttpError(404, 'not_found');
  if (contract.status === 'signed') throw new HttpError(409, 'already_signed');

  const body = await readJson(c.request);
  const name = clean(body.name, 100);
  const position = clean(body.position, 100);
  if (name.length < 2 || !position || body.agree !== true) throw new HttpError(422, 'invalid');
  // The browser sends back the fingerprints of the two files it showed. If the
  // SOW has been replaced since, the client must read the new one before signing.
  const hash = signingHash(contract, await termsFor(c, contract));
  if (!hash || clean(body.hash, 200) !== hash) throw new HttpError(409, 'contract_changed');

  const signedAt = now();
  const ip = c.request.headers.get('CF-Connecting-IP') || '';
  const ua = clean(c.request.headers.get('User-Agent'), 300);
  await c.db.batch([
    c.db
      .prepare(
        `UPDATE contracts SET status = 'signed', signed_at = ?, signer_name = ?, signer_position = ?, signer_email = ?,
         signer_ip = ?, signer_ua = ?, updated_at = ? WHERE project_id = ? AND status = 'sent'`,
      )
      .bind(signedAt, name, position, c.user!.email, ip, ua, signedAt, id),
    ...record(c, id, `Statement of Work signed by ${name}, ${position}`),
  ]);

  // Anything set to be paid on signing can now be paid.
  await requestOnSigning(c, id).catch((err) => console.error('Could not request payments on signing', err));

  // The signature is saved at this point. Making the PDF and sending the email
  // must never undo it, so a failure here is only logged.
  let emailed = false;
  try {
    const pdf = await buildSignedPack(c, project, {
      ...contract, status: 'signed', signed_at: signedAt, signer_name: name, signer_position: position,
      signer_email: c.user!.email, signer_ip: ip, signer_ua: ua,
    });
    emailed = await sendEmail(c.env, {
      to: [c.user!.email, adminEmail(c.env)],
      subject: `Signed: ${project.name}`,
      text: [
        `${name} signed the Statement of Work for ${project.name} on ${ukDateTime(signedAt)}.`,
        '',
        'The signed copy is attached: the Statement of Work, our Terms of Business and the signature record in one PDF. You can also download it from the client area at any time:',
        `${c.url.origin}/portal`,
      ].join('\n'),
      attachments: [{ filename: 'signed-agreement.pdf', content: toBase64(pdf) }],
    });
  } catch (err) {
    console.error('Signed pack or email failed', err);
  }
  return json({ ok: true, emailed });
};

const downloadSigned: Handler = async (c, [id]) => {
  const project = await getProject(c, id);
  const contract = await getContract(c, id);
  if (!contract || contract.status !== 'signed') throw new HttpError(404, 'not_found');
  const stored = contract.signed_key && c.env.FILES ? await c.env.FILES.get(contract.signed_key) : null;
  return inlinePdf(stored ? stored.body : await buildSignedPack(c, project, contract), `Signed agreement - ${project.name}.pdf`, true);
};

// ---------- brief ----------

const saveBrief: Handler = async (c, [id]) => {
  if (c.user!.role !== 'client') throw new HttpError(403, 'clients_only');
  const project = await getProject(c, id);
  const body = await readJson(c.request);
  const given = (body.answers && typeof body.answers === 'object' ? body.answers : {}) as Record<string, unknown>;
  const answers: Record<string, string> = {};
  for (const q of BRIEF_QUESTIONS) answers[q.key] = clean(given[q.key], 5000);

  const existing = await c.db.prepare('SELECT submitted_at FROM briefs WHERE project_id = ?').bind(id).first<{ submitted_at: string | null }>();
  const firstSubmit = body.submit === true && !existing?.submitted_at;
  const statements = [
    c.db
      .prepare('UPDATE briefs SET answers = ?, submitted_at = COALESCE(submitted_at, ?), updated_at = ? WHERE project_id = ?')
      .bind(JSON.stringify(answers), body.submit === true ? now() : null, now(), id),
  ];
  if (firstSubmit) statements.push(...record(c, id, 'Project brief sent'));
  await c.db.batch(statements);

  if (firstSubmit) {
    await sendEmail(c.env, {
      to: [adminEmail(c.env)],
      replyTo: c.user!.email,
      subject: `Brief received: ${project.name}`,
      text: [
        `${c.user!.name || c.user!.email} has filled in the brief for ${project.name}.`,
        '',
        ...BRIEF_QUESTIONS.flatMap((q) => [q.label, answers[q.key] || '(left blank)', '']),
        `${c.url.origin}/portal#/p/${id}`,
      ].join('\n'),
    });
  }
  return json({ ok: true });
};

// ---------- checklist items and files ----------

async function getItem(c: Ctx, itemId: string) {
  const item = await c.db.prepare('SELECT id, project_id, kind, label, status, note, help FROM items WHERE id = ?').bind(itemId).first<{
    id: string; project_id: string; kind: string; label: string; status: string; note: string; help: string;
  }>();
  if (!item) throw new HttpError(404, 'not_found');
  await getProject(c, item.project_id); // checks the caller may see this project
  return item;
}

const addItem: Handler = async (c, [id]) => {
  await getProject(c, id);
  const body = await readJson(c.request);
  const label = clean(body.label, 150);
  const kind = body.kind === 'access' ? 'access' : 'upload';
  if (!label) throw new HttpError(422, 'invalid');
  const position = await c.db.prepare('SELECT COALESCE(MAX(position), 0) + 1 AS n FROM items WHERE project_id = ?').bind(id).first<{ n: number }>();
  await c.db
    .prepare('INSERT INTO items (id, project_id, kind, label, help, position, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), id, kind, label, clean(body.help, 500), position?.n ?? 0, now())
    .run();
  return json({ ok: true });
};

const updateItem: Handler = async (c, [itemId]) => {
  const item = await getItem(c, itemId);
  const body = await readJson(c.request);
  const admin = c.user!.role === 'admin';
  const status = body.status === undefined ? item.status : body.status === 'done' ? 'done' : 'todo';
  const note = body.note === undefined ? item.note : clean(body.note, 2000);
  // Only Sam can reword an item; clients tick it off and leave a note.
  const label = admin && body.label !== undefined ? clean(body.label, 150) || item.label : item.label;
  const help = admin && body.help !== undefined ? clean(body.help, 500) : item.help;
  const statements = [
    c.db.prepare('UPDATE items SET status = ?, note = ?, label = ?, help = ?, updated_at = ? WHERE id = ?').bind(status, note, label, help, now(), itemId),
  ];
  if (status !== item.status) statements.push(...record(c, item.project_id, `"${item.label}" marked ${status === 'done' ? 'done' : 'not done'}`));
  await c.db.batch(statements);
  return json({ ok: true });
};

const deleteItem: Handler = async (c, [itemId]) => {
  const item = await getItem(c, itemId);
  const files = await c.db.prepare('SELECT r2_key FROM files WHERE item_id = ?').bind(itemId).all<{ r2_key: string }>();
  if (files.results.length && c.env.FILES) await c.env.FILES.delete(files.results.map((f) => f.r2_key));
  await c.db.batch([
    c.db.prepare('DELETE FROM files WHERE item_id = ?').bind(itemId),
    c.db.prepare('DELETE FROM items WHERE id = ?').bind(itemId),
    ...record(c, item.project_id, `Removed "${item.label}" from the checklist`),
  ]);
  return json({ ok: true });
};

const uploadFile: Handler = async (c, [itemId]) => {
  const item = await getItem(c, itemId);
  if (item.kind !== 'upload') throw new HttpError(422, 'invalid');
  if (!c.env.FILES) throw new HttpError(503, 'storage_not_configured');
  if (Number(c.request.headers.get('Content-Length') || 0) > MAX_UPLOAD_BYTES + 1024 * 1024) throw new HttpError(413, 'too_large');

  let file: unknown;
  try {
    file = (await c.request.formData()).get('file');
  } catch {
    throw new HttpError(400, 'bad_request');
  }
  if (!file || typeof file === 'string') throw new HttpError(400, 'bad_request');
  const upload = file as File;
  if (upload.size === 0) throw new HttpError(422, 'empty_file');
  if (upload.size > MAX_UPLOAD_BYTES) throw new HttpError(413, 'too_large');

  const id = crypto.randomUUID();
  const filename = clean(upload.name, 150).replace(/[\\/\u0000-\u001f"]/g, '_') || 'file';
  const key = `projects/${item.project_id}/${id}`;
  await c.env.FILES.put(key, await upload.arrayBuffer(), { httpMetadata: { contentType: upload.type || 'application/octet-stream' } });
  await c.db.batch([
    c.db
      .prepare('INSERT INTO files (id, project_id, item_id, r2_key, filename, size, content_type, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, item.project_id, itemId, key, filename, upload.size, clean(upload.type, 100), c.user!.id, now()),
    ...record(c, item.project_id, `Uploaded ${filename} to "${item.label}"`),
  ]);
  return json({ ok: true, id });
};

async function getFile(c: Ctx, fileId: string) {
  const file = await c.db.prepare('SELECT id, project_id, r2_key, filename FROM files WHERE id = ?').bind(fileId).first<{
    id: string; project_id: string; r2_key: string; filename: string;
  }>();
  if (!file) throw new HttpError(404, 'not_found');
  await getProject(c, file.project_id);
  return file;
}

const downloadFile: Handler = async (c, [fileId]) => {
  const file = await getFile(c, fileId);
  const object = c.env.FILES ? await c.env.FILES.get(file.r2_key) : null;
  if (!object) throw new HttpError(404, 'not_found');
  // Always sent as a download, never shown in the browser, so an uploaded
  // HTML or SVG file cannot run scripts on this site.
  return new Response(object.body, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  });
};

const deleteFile: Handler = async (c, [fileId]) => {
  const file = await getFile(c, fileId);
  if (c.env.FILES) await c.env.FILES.delete(file.r2_key);
  await c.db.batch([
    c.db.prepare('DELETE FROM files WHERE id = ?').bind(fileId),
    ...record(c, file.project_id, `Deleted ${file.filename}`),
  ]);
  return json({ ok: true });
};

// ---------- tasks ----------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const addTask: Handler = async (c, [id]) => {
  await getProject(c, id);
  const body = await readJson(c.request);
  const title = clean(body.title, 200);
  const due = clean(body.due, 10);
  if (!title || (due && !DATE_RE.test(due))) throw new HttpError(422, 'invalid');
  await c.db
    .prepare('INSERT INTO tasks (id, project_id, title, due, client_visible, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), id, title, due || null, body.clientVisible ? 1 : 0, now())
    .run();
  return json({ ok: true });
};

const updateTask: Handler = async (c, [taskId]) => {
  const task = await c.db.prepare('SELECT * FROM tasks WHERE id = ?').bind(taskId).first<{
    id: string; project_id: string; title: string; due: string | null; done: number; client_visible: number;
  }>();
  if (!task) throw new HttpError(404, 'not_found');
  const body = await readJson(c.request);
  const title = body.title === undefined ? task.title : clean(body.title, 200) || task.title;
  const due = body.due === undefined ? task.due : clean(body.due, 10) || null;
  if (due && !DATE_RE.test(due)) throw new HttpError(422, 'invalid');
  const done = body.done === undefined ? task.done : body.done ? 1 : 0;
  const visible = body.clientVisible === undefined ? task.client_visible : body.clientVisible ? 1 : 0;
  await c.db.batch([
    c.db
      .prepare('UPDATE tasks SET title = ?, due = ?, done = ?, client_visible = ?, done_at = ? WHERE id = ?')
      .bind(title, due, done, visible, done ? now() : null, taskId),
    c.db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').bind(now(), task.project_id),
  ]);
  return json({ ok: true });
};

const deleteTask: Handler = async (c, [taskId]) => {
  await c.db.prepare('DELETE FROM tasks WHERE id = ?').bind(taskId).run();
  return json({ ok: true });
};

// ---------- routing ----------

const ID = '([0-9a-f-]{36})';
const routes: Route[] = [
  ...paymentRoutes,
  ...bankRoutes,
  ['POST', /^\/login$/, 'public', login],
  ['POST', /^\/verify$/, 'public', verify],
  ['POST', /^\/logout$/, 'public', logout],
  ['GET', /^\/me$/, 'public', me],

  ['GET', /^\/projects$/, 'user', listProjects],
  ['POST', /^\/projects$/, 'admin', createProject],
  ['GET', new RegExp(`^/projects/${ID}$`), 'user', showProject],
  ['PATCH', new RegExp(`^/projects/${ID}$`), 'admin', updateProject],
  ['DELETE', new RegExp(`^/projects/${ID}$`), 'admin', deleteProject],
  ['POST', new RegExp(`^/projects/${ID}/invite$`), 'admin', invite],

  ['POST', new RegExp(`^/projects/${ID}/contract/sow$`), 'admin', uploadSow],
  ['GET', new RegExp(`^/projects/${ID}/contract/sow\\.pdf$`), 'user', downloadSow],
  ['POST', new RegExp(`^/projects/${ID}/contract/send$`), 'admin', sendContract],
  ['POST', new RegExp(`^/projects/${ID}/contract/unsend$`), 'admin', unsendContract],
  ['POST', new RegExp(`^/projects/${ID}/contract/sign$`), 'user', signContract],
  ['GET', new RegExp(`^/projects/${ID}/contract\\.pdf$`), 'user', downloadSigned],
  ['POST', /^\/terms$/, 'admin', uploadTerms],
  ['GET', new RegExp(`^/terms/${ID}$`), 'user', downloadTerms],

  ['PUT', new RegExp(`^/projects/${ID}/brief$`), 'user', saveBrief],

  ['POST', new RegExp(`^/projects/${ID}/items$`), 'admin', addItem],
  ['PATCH', new RegExp(`^/items/${ID}$`), 'user', updateItem],
  ['DELETE', new RegExp(`^/items/${ID}$`), 'admin', deleteItem],
  ['POST', new RegExp(`^/items/${ID}/files$`), 'user', uploadFile],
  ['GET', new RegExp(`^/files/${ID}$`), 'user', downloadFile],
  ['DELETE', new RegExp(`^/files/${ID}$`), 'user', deleteFile],

  ['POST', new RegExp(`^/projects/${ID}/tasks$`), 'admin', addTask],
  ['PATCH', new RegExp(`^/tasks/${ID}$`), 'admin', updateTask],
  ['DELETE', new RegExp(`^/tasks/${ID}$`), 'admin', deleteTask],

  ['POST', /^\/clients$/, 'admin', createClient],
  ['PUT', new RegExp(`^/clients/${ID}$`), 'admin', updateClient],
];

export async function handle(context: { request: Request; env: Env; params: { path?: string | string[] } }): Promise<Response> {
  const { request, env } = context;
  try {
    if (!env.DB) throw new HttpError(503, 'not_configured');
    const url = new URL(request.url);
    const path = '/' + [context.params.path ?? []].flat().join('/');

    // Anything that changes data must come from this site's own pages.
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const origin = request.headers.get('Origin');
      if (!origin || new URL(origin).host !== url.host) throw new HttpError(403, 'bad_origin');
    }

    for (const [method, pattern, access, handler] of routes) {
      if (method !== request.method) continue;
      const match = path.match(pattern);
      if (!match) continue;
      await ensureSchema(env.DB);
      const user = await currentUser(env.DB, request);
      if (access !== 'public' && !user) throw new HttpError(401, 'signed_out');
      if (access === 'admin' && user!.role !== 'admin') throw new HttpError(403, 'forbidden');
      return await handler({ request, env, db: env.DB, url, user }, match.slice(1));
    }
    throw new HttpError(404, 'not_found');
  } catch (err) {
    if (err instanceof HttpError) return json({ ok: false, error: err.code }, err.status);
    console.error('Portal API error', err);
    return json({ ok: false, error: 'server_error' }, 500);
  }
}
