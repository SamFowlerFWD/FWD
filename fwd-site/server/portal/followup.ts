// Following up with clients: what they have looked at, and reminders.
//
// Views: the first and latest time a client opened their project page, the
// Statement of Work and the Terms of Business, so Sam can tell "has not looked"
// from "has read it and not signed". Only clients are recorded, never Sam.
//
// Reminders: one button each for an unsigned agreement, a missing brief,
// content still to send and a payment still to make. Each emails the client a
// fresh sign-in link. Nothing is ever sent without Sam pressing the button.

import { HttpError, clean, json, now, pounds, readJson } from './core';
import { sendEmail } from './email';
import { notify } from './payments';
import { type Ctx, type Handler, type Route, clientLogin, getContract, getProject, loginLink, record } from './router';

const DAY = 24 * 60 * 60 * 1000;
const ID = '([0-9a-f-]{36})';

// ---------- what the client has looked at ----------

export type Seen = 'opened' | 'sow' | 'terms';

// Never throws: recording a view must not stop the client seeing the thing.
export async function sawIt(c: Ctx, projectId: string, what: Seen): Promise<void> {
  if (c.user?.role !== 'client') return;
  try {
    const first = await c.db
      .prepare('INSERT OR IGNORE INTO views (project_id, what, first_at, last_at) VALUES (?, ?, ?, ?)')
      .bind(projectId, what, now(), now())
      .run();
    if (!first.meta?.changes) {
      await c.db.prepare('UPDATE views SET last_at = ? WHERE project_id = ? AND what = ?').bind(now(), projectId, what).run();
      return;
    }
    // The first time they open the Statement of Work is worth knowing about.
    if (what !== 'sow') return;
    const contract = await getContract(c, projectId);
    if (contract?.status !== 'sent') return;
    const project = await c.db.prepare('SELECT name FROM projects WHERE id = ?').bind(projectId).first<{ name: string }>();
    await notify(c, projectId, `Opened: ${project?.name ?? 'project'}`, `${c.user.name || c.user.email} has opened the Statement of Work. It is not signed yet.`);
  } catch (err) {
    console.error('Could not record view', err);
  }
}

// The Terms are one file for everyone, so a client opening them counts for
// each of their projects that is waiting to be signed with that version.
export async function sawTerms(c: Ctx, termsId: string): Promise<void> {
  if (c.user?.role !== 'client' || !c.user.client_id) return;
  try {
    const rows = await c.db
      .prepare("SELECT p.id FROM projects p JOIN contracts k ON k.project_id = p.id WHERE p.client_id = ? AND k.terms_id = ? AND k.status = 'sent'")
      .bind(c.user.client_id, termsId)
      .all<{ id: string }>();
    for (const row of rows.results) await sawIt(c, row.id, 'terms');
  } catch (err) {
    console.error('Could not record view', err);
  }
}

export async function viewsFor(c: Ctx, projectId: string): Promise<Record<string, { first_at: string; last_at: string }>> {
  const rows = await c.db.prepare('SELECT what, first_at, last_at FROM views WHERE project_id = ?').bind(projectId).all<{ what: string; first_at: string; last_at: string }>();
  return Object.fromEntries(rows.results.map((r) => [r.what, { first_at: r.first_at, last_at: r.last_at }]));
}

// ---------- reminders ----------

// When each reminder was last sent: { sign: '2026-...', 'pay:<payment id>': '...' }
export async function remindersFor(c: Ctx, projectId: string): Promise<Record<string, string>> {
  const prefix = `remind:${projectId}:`;
  const rows = await c.db.prepare('SELECT key, created_at FROM notices WHERE key LIKE ?').bind(`${prefix}%`).all<{ key: string; created_at: string }>();
  return Object.fromEntries(rows.results.map((r) => [r.key.slice(prefix.length), r.created_at]));
}

const remind: Handler = async (c, [id]) => {
  const project = await getProject(c, id);
  const body = await readJson(c.request);
  const what = clean(body.what, 20);
  const login = await clientLogin(c, project.client_id);
  if (!login) throw new HttpError(404, 'not_found');

  let key = what;
  let subject = '';
  let lines: string[] = [];
  let logged = '';
  if (what === 'sign') {
    if ((await getContract(c, id))?.status !== 'sent') throw new HttpError(409, 'nothing_to_remind');
    subject = `Reminder: ${project.name} is ready to sign`;
    lines = [`A quick nudge: the Statement of Work for ${project.name} is still waiting for your signature. It only takes a couple of minutes:`];
    logged = 'to sign the agreement';
  } else if (what === 'brief') {
    const brief = await c.db.prepare('SELECT submitted_at FROM briefs WHERE project_id = ?').bind(id).first<{ submitted_at: string | null }>();
    if (brief?.submitted_at) throw new HttpError(409, 'nothing_to_remind');
    subject = `Reminder: the brief for ${project.name}`;
    lines = [`I still need the brief for ${project.name} before I can get going. It is a short set of questions and you can save it and come back to it:`];
    logged = 'to send the brief';
  } else if (what === 'items') {
    const todo = await c.db.prepare("SELECT label FROM items WHERE project_id = ? AND status = 'todo' ORDER BY position, rowid").bind(id).all<{ label: string }>();
    if (!todo.results.length) throw new HttpError(409, 'nothing_to_remind');
    subject = `Reminder: a few things I need for ${project.name}`;
    lines = [`I am still waiting on a few things for ${project.name}:`, todo.results.map((item) => `- ${item.label}`).join('\n'), 'You can send them here:'];
    logged = 'about the content and access still to send';
  } else if (what === 'pay') {
    const line = await c.db
      .prepare('SELECT id, kind, label, amount, status FROM payments WHERE id = ? AND project_id = ?')
      .bind(clean(body.paymentId, 36), id)
      .first<{ id: string; kind: string; label: string; amount: number; status: string }>();
    if (!line || (line.status !== 'requested' && line.status !== 'overdue')) throw new HttpError(409, 'nothing_to_remind');
    key = `pay:${line.id}`;
    const monthly = line.kind === 'monthly';
    subject = `Reminder: ${line.label} for ${project.name}`;
    lines = [
      line.status === 'overdue'
        ? `The last payment for ${line.label} (${pounds(line.amount)}${monthly ? ' a month' : ''}) on ${project.name} did not go through. You can sort it out here:`
        : monthly
          ? `A quick nudge: the monthly payment for ${project.name} (${line.label}, ${pounds(line.amount)} a month) still needs setting up. It takes a minute:`
          : `A quick nudge: ${line.label} (${pounds(line.amount)}) for ${project.name} is still to pay. You can pay it here:`,
    ];
    logged = `to pay ${line.label}`;
  } else {
    throw new HttpError(422, 'invalid');
  }

  const link = await loginLink(c, login.id, 7 * DAY);
  const sent = await sendEmail(c.env, {
    to: [login.email],
    subject,
    text: [
      `Hi ${login.name.split(' ')[0]},`,
      '',
      ...lines.flatMap((line) => [line, '']),
      link,
      '',
      'The link signs you in, works once and lasts 7 days. Any questions, just reply to this email.',
    ].join('\n'),
  });
  const dev = c.env.PORTAL_DEV === '1';
  if (sent || dev) {
    await c.db.batch([
      ...record(c, id, `Reminder emailed to ${login.email} ${logged}`),
      c.db.prepare('INSERT OR REPLACE INTO notices (key, created_at) VALUES (?, ?)').bind(`remind:${id}:${key}`, now()),
    ]);
  }
  return json({ ok: true, sent, ...(dev ? { devLink: link } : {}) });
};

export const followupRoutes: Route[] = [['POST', new RegExp(`^/projects/${ID}/remind$`), 'admin', remind]];
