// Payments for a project, collected through Revolut.
//
// A project has payment lines. Each line is either:
//   one_off  a single payment, such as a deposit or the balance of a build
//   monthly  a monthly payment that rolls on until cancelled (months = null)
//            or stops after a set number of payments (months = N)
//
// A line starts as "planned". It becomes "requested" (the client can pay it)
// either automatically when the client signs, or when Sam asks for it.
// Nothing is created at Revolut until the client presses Pay.

import { HttpError, adminEmail, clean, json, now, pounds, readJson } from './core';
import { sendEmail, toBase64 } from './email';
import { invoicePdf } from './pdf';
import * as revolut from './revolut';
import { type Ctx, type Handler, type Route, clientLogin, getProject, loginLink, record } from './router';

export interface PaymentLine {
  id: string; project_id: string; kind: 'one_off' | 'monthly'; label: string; amount: number;
  months: number | null; min_months: number | null; due_on: 'signing' | 'manual';
  status: 'planned' | 'requested' | 'paid' | 'active' | 'overdue' | 'cancelled' | 'finished';
  invoice_no: string | null; order_id: string | null; checkout_url: string | null; subscription_id: string | null;
  requested_at: string | null; paid_at: string | null; ended_at: string | null; paid_how: string | null;
  synced_at: string | null; created_at: string;
  method: 'standing_order' | null; reference: string | null;
}

export interface BankDetails { accountName: string; sortCode: string; accountNumber: string }

// Sam's own bank details, typed in by him on the projects page. Shown to a
// client only when they have something to pay by bank transfer.
export async function bankDetails(c: Ctx): Promise<BankDetails | null> {
  const row = await c.db.prepare("SELECT value FROM settings WHERE key = 'bank_details'").first<{ value: string }>();
  if (!row) return null;
  try {
    const bank = JSON.parse(row.value) as BankDetails;
    return bank.accountName && bank.sortCode && bank.accountNumber ? bank : null;
  } catch {
    return null;
  }
}

const DAY = 24 * 60 * 60 * 1000;
const ID = '([0-9a-f-]{36})';

async function getLine(c: Ctx, id: string): Promise<PaymentLine> {
  const line = await c.db.prepare('SELECT * FROM payments WHERE id = ?').bind(id).first<PaymentLine>();
  if (!line) throw new HttpError(404, 'not_found');
  await getProject(c, line.project_id); // checks the caller may see this project
  return line;
}

export const systemNote = (c: Ctx, projectId: string, action: string) =>
  c.db.prepare("INSERT INTO activity (project_id, actor, action, created_at) VALUES (?, 'Revolut', ?, ?)").bind(projectId, action, now());

// Invoice numbers and standing order references come from a counter, but the
// counter is scrambled into a five-digit number so nobody can tell from
// "0003" how many there have been. Each counter value gives a different
// number (7919 shares no factor with 90,000), so they never repeat.
const scramble = (count: number, shift: number) =>
  count > 90_000 ? String(100_000 + count) : String(10_000 + ((count * 7919 + shift) % 90_000));

async function nextInvoiceNo(c: Ctx): Promise<string> {
  const row = await c.db
    .prepare(
      `INSERT INTO settings (key, value) VALUES ('invoice_seq', '1')
       ON CONFLICT (key) DO UPDATE SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) RETURNING value`,
    )
    .first<{ value: string }>();
  return `FWD-INV-${scramble(Number(row?.value ?? 1), 30_011)}`;
}

// Makes a planned line payable. One-off lines get their invoice number here.
async function makePayable(c: Ctx, line: PaymentLine): Promise<void> {
  const invoiceNo = line.kind === 'one_off' ? await nextInvoiceNo(c) : null;
  await c.db
    .prepare("UPDATE payments SET status = 'requested', requested_at = ?, invoice_no = ? WHERE id = ? AND status = 'planned'")
    .bind(now(), invoiceNo, line.id)
    .run();
}

// Called when the client signs: anything set to "due on signing" becomes payable.
export async function requestOnSigning(c: Ctx, projectId: string): Promise<void> {
  const lines = await c.db
    .prepare("SELECT * FROM payments WHERE project_id = ? AND status = 'planned' AND due_on = 'signing'")
    .bind(projectId)
    .all<PaymentLine>();
  for (const line of lines.results) await makePayable(c, line);
}

// ---------- an invoice for each month of a monthly payment ----------

export interface MonthlyInvoice {
  invoice_no: string; payment_id: string; project_id: string; ref: string; period: string; amount: number;
  paid_at: string; paid_how: string; emailed_at: string | null; void_at: string | null; created_at: string;
}

const monthLong = (period: string) => new Date(`${period}-15`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

async function monthlyPdf(c: Ctx, line: PaymentLine, inv: MonthlyInvoice): Promise<Uint8Array> {
  const project = await c.db.prepare('SELECT name, client_id FROM projects WHERE id = ?').bind(line.project_id).first<{ name: string; client_id: string }>();
  const client = project && (await c.db.prepare('SELECT name, company FROM clients WHERE id = ?').bind(project.client_id).first<{ name: string; company: string }>());
  return invoicePdf({
    number: inv.invoice_no, issued: inv.paid_at, projectName: project?.name ?? '', clientName: client?.name ?? '',
    company: client?.company ?? '', description: `${line.label}, ${monthLong(inv.period)}`, amount: inv.amount,
    paidAt: inv.paid_at, paidHow: inv.paid_how,
  });
}

// Called whenever a month is paid, by card or by standing order. Makes the
// invoice once and emails it to the client. Never throws: a problem here
// must not undo the payment being recorded.
export async function monthlyInvoice(
  c: Ctx, line: PaymentLine, m: { ref: string; period: string; amount: number; paidAt: string; paidHow: string },
): Promise<void> {
  try {
    const existing = await c.db.prepare('SELECT * FROM monthly_invoices WHERE payment_id = ? AND ref = ?').bind(line.id, m.ref).first<MonthlyInvoice>();
    if (existing) {
      // A month that was unticked and ticked again keeps its invoice, and is not emailed twice.
      if (existing.void_at) await c.db.prepare('UPDATE monthly_invoices SET void_at = NULL WHERE invoice_no = ?').bind(existing.invoice_no).run();
      return;
    }
    const inv: MonthlyInvoice = {
      invoice_no: await nextInvoiceNo(c), payment_id: line.id, project_id: line.project_id, ref: m.ref, period: m.period,
      amount: m.amount, paid_at: m.paidAt, paid_how: m.paidHow, emailed_at: null, void_at: null, created_at: now(),
    };
    const made = await c.db
      .prepare('INSERT OR IGNORE INTO monthly_invoices (invoice_no, payment_id, project_id, ref, period, amount, paid_at, paid_how, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(inv.invoice_no, inv.payment_id, inv.project_id, inv.ref, inv.period, inv.amount, inv.paid_at, inv.paid_how, inv.created_at)
      .run();
    if (!made.meta?.changes) return; // another page load got here first

    const project = await c.db.prepare('SELECT name, client_id FROM projects WHERE id = ?').bind(line.project_id).first<{ name: string; client_id: string }>();
    const login = project && (await clientLogin(c, project.client_id));
    if (!project || !login) return;
    const pdf = await monthlyPdf(c, line, inv);
    const sent = await sendEmail(c.env, {
      to: [login.email],
      subject: `Invoice ${inv.invoice_no}: ${line.label}, ${monthLong(inv.period)}`,
      text: [
        `Hi ${login.name.split(' ')[0]},`, '',
        `Thank you for your payment of ${pounds(inv.amount)} for ${line.label} (${project.name}), ${monthLong(inv.period)}.`,
        'Your invoice is attached, marked as paid. There is nothing more to do.', '',
        `All your invoices are also in the client area: ${c.url.origin}/portal`,
      ].join('\n'),
      attachments: [{ filename: `${inv.invoice_no}.pdf`, content: toBase64(pdf) }],
    });
    if (sent) await c.db.prepare('UPDATE monthly_invoices SET emailed_at = ? WHERE invoice_no = ?').bind(now(), inv.invoice_no).run();
  } catch (err) {
    console.error('Monthly invoice failed', line.id, m.ref, err);
  }
}

const ukMonth = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/London' }).slice(0, 7);

// Card payments: Revolut has one billing cycle per month, each with its own
// order. A cycle whose order has completed is a month that has been paid.
async function cardInvoices(c: Ctx, line: PaymentLine): Promise<void> {
  try {
    const cycles = await revolut.getCycles(c.env, line.subscription_id!);
    if (!cycles.length) return;
    const done = new Set(
      (await c.db.prepare('SELECT ref FROM monthly_invoices WHERE payment_id = ?').bind(line.id).all<{ ref: string }>()).results.map((r) => r.ref),
    );
    const fresh = cycles.filter((cy) => cy.order_id && !done.has(cy.id)).sort((a, b) => a.number - b.number);
    for (const cycle of fresh) {
      const order = await revolut.getOrder(c.env, cycle.order_id!);
      if (order.state !== 'completed') continue;
      await monthlyInvoice(c, line, {
        ref: cycle.id, period: ukMonth(cycle.start_date), amount: order.amount ?? line.amount,
        paidAt: order.updated_at || cycle.start_date, paidHow: 'Revolut',
      });
    }
  } catch (err) {
    console.error('Card invoices failed', line.id, err);
  }
}

// ---------- keeping in step with Revolut ----------

export async function tellSam(c: Ctx, projectId: string, subject: string, text: string) {
  const project = await c.db.prepare('SELECT name FROM projects WHERE id = ?').bind(projectId).first<{ name: string }>();
  await sendEmail(c.env, {
    to: [adminEmail(c.env)],
    subject: `${subject}: ${project?.name ?? 'project'}`,
    text: [text, '', `${c.url.origin}/portal#/p/${projectId}`].join('\n'),
  });
}

// Asks Revolut where one line has got to and records any change. The status
// test in each UPDATE means two people loading the page at once cannot both
// record (and email) the same change.
async function syncLine(c: Ctx, line: PaymentLine): Promise<void> {
  const stamp = c.db.prepare('UPDATE payments SET synced_at = ? WHERE id = ?').bind(now(), line.id);

  if (line.kind === 'one_off') {
    if (line.status !== 'requested' || !line.order_id) return;
    const order = await revolut.getOrder(c.env, line.order_id);
    if (order.state !== 'completed') {
      await stamp.run();
      return;
    }
    const done = await c.db
      .prepare("UPDATE payments SET status = 'paid', paid_at = ?, paid_how = 'Revolut', synced_at = ? WHERE id = ? AND status = 'requested'")
      .bind(now(), now(), line.id)
      .run();
    if (done.meta?.changes) {
      await systemNote(c, line.project_id, `${line.label} paid (${pounds(line.amount)})`).run();
      await tellSam(c, line.project_id, `Paid: ${line.label}`, `${line.label} of ${pounds(line.amount)} has been paid through Revolut.`);
    }
    return;
  }

  if (!line.subscription_id || !['requested', 'active', 'overdue'].includes(line.status)) return;
  const sub = await revolut.getSubscription(c.env, line.subscription_id);
  let next: PaymentLine['status'] = line.status;
  if (sub.state === 'active') next = 'active';
  else if (sub.state === 'overdue') next = 'overdue';
  else if (sub.state === 'finished') next = 'finished';
  else if (sub.state === 'cancelled') next = line.status === 'requested' ? 'requested' : 'cancelled';

  if (sub.state === 'cancelled' && line.status === 'requested') {
    // Never completed the first payment and Revolut gave up waiting. Clear it
    // so the client can start again with a fresh checkout.
    await c.db.prepare('UPDATE payments SET subscription_id = NULL, order_id = NULL, checkout_url = NULL, synced_at = ? WHERE id = ?').bind(now(), line.id).run();
    return;
  }
  if (['active', 'overdue', 'finished', 'cancelled'].includes(sub.state)) await cardInvoices(c, line);
  if (next === line.status) {
    await stamp.run();
    return;
  }
  const ended = next === 'cancelled' || next === 'finished';
  const changed = await c.db
    .prepare('UPDATE payments SET status = ?, paid_at = COALESCE(paid_at, ?), ended_at = ?, synced_at = ? WHERE id = ? AND status = ?')
    .bind(next, next === 'active' ? sub.start_date || now() : null, ended ? now() : null, now(), line.id, line.status)
    .run();
  if (!changed.meta?.changes) return;

  const amount = `${pounds(line.amount)} a month`;
  const news =
    next === 'active' && line.status === 'requested' ? [`Started: ${line.label}`, `${line.label} (${amount}) is set up and the first payment has been taken.`]
    : next === 'active' ? [`Back on track: ${line.label}`, `The overdue payment for ${line.label} (${amount}) has now gone through.`]
    : next === 'overdue' ? [`Payment failed: ${line.label}`, `A monthly payment for ${line.label} (${amount}) failed. Revolut will retry it. If it keeps failing, Revolut cancels the monthly payment at the end of the month.`]
    : next === 'finished' ? [`Finished: ${line.label}`, `${line.label} (${amount}) has taken its last payment.`]
    : [`Cancelled: ${line.label}`, `${line.label} (${amount}) has been cancelled at Revolut, so no more payments will be taken.`];
  await systemNote(c, line.project_id, news[0]).run();
  await tellSam(c, line.project_id, news[0], news[1]);
}

// Checks every line on a project that could have changed. Never throws: a
// problem talking to Revolut must not stop the project page from loading.
export async function syncProject(c: Ctx, projectId: string): Promise<void> {
  if (!revolut.paymentsEnabled(c.env)) return;
  const lines = await c.db
    .prepare("SELECT * FROM payments WHERE project_id = ? AND status IN ('requested','active','overdue') AND (order_id IS NOT NULL OR subscription_id IS NOT NULL)")
    .bind(projectId)
    .all<PaymentLine>();
  const recently = new Date(Date.now() - 4_000).toISOString();
  for (const line of lines.results) {
    if (line.synced_at && line.synced_at > recently) continue;
    try {
      await syncLine(c, line);
    } catch (err) {
      console.error('Payment sync failed', line.id, err);
    }
  }
}

// For the daily check: every card payment that could have changed.
export async function syncAllCards(c: Ctx): Promise<number> {
  if (!revolut.paymentsEnabled(c.env)) return 0;
  const lines = await c.db
    .prepare("SELECT * FROM payments WHERE status IN ('requested','active','overdue') AND (order_id IS NOT NULL OR subscription_id IS NOT NULL) ORDER BY synced_at LIMIT 40")
    .all<PaymentLine>();
  for (const line of lines.results) {
    try {
      await syncLine(c, line);
    } catch (err) {
      console.error('Payment sync failed', line.id, err);
    }
  }
  return lines.results.length;
}

// For the projects list: a few of the monthly payments that have not been
// checked for a while, so a failed payment shows up without opening each project.
export async function syncStale(c: Ctx): Promise<void> {
  if (!revolut.paymentsEnabled(c.env)) return;
  const stale = await c.db
    .prepare("SELECT * FROM payments WHERE kind = 'monthly' AND status IN ('active','overdue') AND subscription_id IS NOT NULL AND (synced_at IS NULL OR synced_at < ?) ORDER BY synced_at LIMIT 5")
    .bind(new Date(Date.now() - DAY / 4).toISOString())
    .all<PaymentLine>();
  for (const line of stale.results) {
    try {
      await syncLine(c, line);
    } catch (err) {
      console.error('Payment sync failed', line.id, err);
    }
  }
}

export async function paymentLines(c: Ctx, projectId: string) {
  const admin = c.user!.role === 'admin';
  const [lines, receipts, invoices] = await Promise.all([
    c.db.prepare('SELECT * FROM payments WHERE project_id = ? ORDER BY position, created_at').bind(projectId).all<PaymentLine>(),
    c.db.prepare('SELECT payment_id, period, source FROM payment_receipts WHERE project_id = ? ORDER BY period').bind(projectId).all<{ payment_id: string; period: string; source: string }>(),
    c.db.prepare('SELECT * FROM monthly_invoices WHERE project_id = ? AND void_at IS NULL ORDER BY paid_at DESC').bind(projectId).all<MonthlyInvoice>(),
  ]);
  // Payments that arrived but were not ticked, for Sam to look at.
  const flagged = admin
    ? (await c.db.prepare("SELECT payment_id, detail FROM bank_matches WHERE project_id = ? AND outcome IN ('wrong_amount','extra') ORDER BY created_at DESC").bind(projectId).all<{ payment_id: string; detail: string }>()).results
    : [];
  return lines.results.map((l) => ({
    method: l.method, reference: l.reference,
    received: receipts.results.filter((r) => r.payment_id === l.id).map((r) => r.period),
    auto: receipts.results.filter((r) => r.payment_id === l.id && r.source === 'revolut').map((r) => r.period),
    ...(admin ? { flagged: flagged.filter((f) => f.payment_id === l.id).map((f) => f.detail) } : {}),
    invoices: invoices.results.filter((i) => i.payment_id === l.id).map((i) => ({
      number: i.invoice_no, period: i.period, amount: i.amount, ...(admin ? { emailed: Boolean(i.emailed_at) } : {}),
    })),
    id: l.id, kind: l.kind, label: l.label, amount: l.amount, months: l.months, min_months: l.min_months,
    due_on: l.due_on, status: l.status, invoice_no: l.invoice_no, requested_at: l.requested_at,
    paid_at: l.paid_at, ended_at: l.ended_at,
    ...(admin ? { paid_how: l.paid_how, at_revolut: Boolean(l.order_id || l.subscription_id) } : {}),
  }));
}

// ---------- Sam: setting up and managing lines ----------

function penceFrom(value: unknown): number {
  const amount = Math.round(Number(String(value ?? '').replace(/[£,\s]/g, '')) * 100);
  if (!Number.isFinite(amount) || amount < 100 || amount > 5_000_000) throw new HttpError(422, 'bad_amount');
  return amount;
}

function wholeMonths(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const months = Number(value);
  if (!Number.isInteger(months) || months < 1 || months > 120) throw new HttpError(422, 'invalid');
  return months;
}

const addLine: Handler = async (c, [id]) => {
  await getProject(c, id);
  const body = await readJson(c.request);
  const kind = body.kind === 'monthly' ? 'monthly' : 'one_off';
  const label = clean(body.label, 100);
  if (!label) throw new HttpError(422, 'invalid');
  const position = await c.db.prepare('SELECT COALESCE(MAX(position), 0) + 1 AS n FROM payments WHERE project_id = ?').bind(id).first<{ n: number }>();
  await c.db
    .prepare('INSERT INTO payments (id, project_id, kind, label, amount, months, min_months, due_on, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(
      crypto.randomUUID(), id, kind, label, penceFrom(body.amount),
      kind === 'monthly' ? wholeMonths(body.months) : null,
      kind === 'monthly' ? wholeMonths(body.minMonths) : null,
      body.dueOn === 'signing' ? 'signing' : 'manual',
      position?.n ?? 0, now(),
    )
    .run();
  return json({ ok: true });
};

const removeLine: Handler = async (c, [lineId]) => {
  const line = await getLine(c, lineId);
  if (!['planned', 'requested'].includes(line.status)) throw new HttpError(409, 'payment_started');
  if (line.order_id || line.subscription_id) {
    // The client has opened a checkout. Make sure it has not been paid, then close it.
    await syncLine(c, line);
    const fresh = await getLine(c, lineId);
    if (fresh.status !== 'requested') throw new HttpError(409, 'payment_started');
    if (fresh.subscription_id) await revolut.cancelSubscription(c.env, fresh.subscription_id);
    else if (fresh.order_id) await revolut.cancelOrder(c.env, fresh.order_id).catch(() => undefined);
  }
  await c.db.batch([
    c.db.prepare('DELETE FROM payments WHERE id = ?').bind(lineId),
    ...record(c, line.project_id, `Removed payment: ${line.label}`),
  ]);
  return json({ ok: true });
};

const requestLine: Handler = async (c, [lineId]) => {
  const line = await getLine(c, lineId);
  if (line.status !== 'planned') throw new HttpError(409, 'payment_started');
  const project = await getProject(c, line.project_id);
  const login = await clientLogin(c, project.client_id);
  if (!login) throw new HttpError(404, 'not_found');
  await makePayable(c, line);
  await c.db.batch(record(c, line.project_id, `Payment requested: ${line.label} (${pounds(line.amount)}${line.kind === 'monthly' ? ' a month' : ''})`));

  const link = await loginLink(c, login.id, 7 * DAY);
  const what =
    line.kind === 'monthly'
      ? `It is time to set up the monthly payment for ${project.name}: ${line.label}, ${pounds(line.amount)} a month. The first payment is taken when you set it up, then on the same day each month.`
      : `A payment is now due for ${project.name}: ${line.label}, ${pounds(line.amount)}. The invoice is in the client area.`;
  const sent = await sendEmail(c.env, {
    to: [login.email],
    subject: line.kind === 'monthly' ? `Set up your monthly payment: ${project.name}` : `Payment due: ${line.label}`,
    text: [
      `Hi ${login.name.split(' ')[0]},`, '', what, '',
      'You pay securely by card through Revolut. This link signs you in, works once and lasts 7 days:', '', link,
    ].join('\n'),
  });
  return json({ ok: true, sent, ...(c.env.PORTAL_DEV === '1' ? { devLink: link } : {}) });
};

// For a one-off payment that arrived another way, such as a bank transfer.
const markPaid: Handler = async (c, [lineId]) => {
  const line = await getLine(c, lineId);
  if (line.kind !== 'one_off' || !['planned', 'requested'].includes(line.status)) throw new HttpError(409, 'payment_started');
  if (line.status === 'planned') await makePayable(c, line); // gives it an invoice number
  if (line.order_id) await revolut.cancelOrder(c.env, line.order_id).catch(() => undefined);
  const body = await readJson(c.request);
  await c.db.batch([
    c.db.prepare("UPDATE payments SET status = 'paid', paid_at = ?, paid_how = ? WHERE id = ?").bind(now(), clean(body.how, 60) || 'bank transfer', lineId),
    ...record(c, line.project_id, `${line.label} marked as paid`),
  ]);
  return json({ ok: true });
};

const cancelMonthly: Handler = async (c, [lineId]) => {
  const line = await getLine(c, lineId);
  const standingOrder = line.method === 'standing_order';
  if (line.kind !== 'monthly' || !['active', 'overdue'].includes(line.status)) throw new HttpError(409, 'invalid');
  if (line.subscription_id) await revolut.cancelSubscription(c.env, line.subscription_id);
  await c.db.batch([
    c.db.prepare("UPDATE payments SET status = 'cancelled', ended_at = ? WHERE id = ?").bind(now(), lineId),
    ...record(c, line.project_id, standingOrder ? `Monthly payment ended: ${line.label}. The client must cancel their standing order at their bank` : `Monthly payment cancelled: ${line.label}`),
  ]);
  return json({ ok: true });
};

// ---------- monthly payments by standing order ----------
//
// The client sets the standing order up at their own bank, so nothing here
// takes money. Sam ticks each month off when he sees it arrive.

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

async function nextReference(c: Ctx): Promise<string> {
  const row = await c.db
    .prepare(
      `INSERT INTO settings (key, value) VALUES ('standing_order_seq', '1')
       ON CONFLICT (key) DO UPDATE SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) RETURNING value`,
    )
    .first<{ value: string }>();
  return `FWD-SO-${scramble(Number(row?.value ?? 1), 61_403)}`;
}

// The client (or Sam on their behalf) chooses to pay a monthly line by standing order.
const chooseStandingOrder: Handler = async (c, [lineId]) => {
  let line = await getLine(c, lineId);
  if (line.kind !== 'monthly') throw new HttpError(422, 'invalid');
  if (!(await bankDetails(c))) throw new HttpError(422, 'no_bank_details');
  if (line.subscription_id) {
    // A card checkout was opened. Make sure it was not completed, then close it.
    await syncLine(c, line).catch(() => undefined);
    line = await getLine(c, lineId);
    if (line.status === 'requested' && line.subscription_id) await revolut.cancelSubscription(c.env, line.subscription_id).catch(() => undefined);
  }
  if (line.status !== 'requested') throw new HttpError(409, 'payment_started');
  await c.db.batch([
    c.db
      .prepare("UPDATE payments SET method = 'standing_order', reference = COALESCE(reference, ?), subscription_id = NULL, order_id = NULL, checkout_url = NULL WHERE id = ?")
      .bind(await nextReference(c), lineId),
    ...record(c, line.project_id, `${line.label}: paying by standing order`),
  ]);
  if (c.user!.role === 'client') {
    await tellSam(c, line.project_id, `Standing order chosen: ${line.label}`, `${c.user!.name || c.user!.email} has chosen to pay ${line.label} (${pounds(line.amount)} a month) by standing order. Tick each month off in the client area when it arrives.`);
  }
  return json({ ok: true });
};

// Back to paying by card, as long as no month has been ticked off yet.
const chooseCard: Handler = async (c, [lineId]) => {
  const line = await getLine(c, lineId);
  if (line.method !== 'standing_order' || line.status !== 'requested') throw new HttpError(409, 'payment_started');
  await c.db.batch([
    c.db.prepare('UPDATE payments SET method = NULL WHERE id = ?').bind(lineId),
    ...record(c, line.project_id, `${line.label}: paying by card instead of standing order`),
  ]);
  return json({ ok: true });
};

// Sam ticks (or unticks) a month as received.
const setReceipt: Handler = async (c, [lineId]) => {
  const line = await getLine(c, lineId);
  if (line.method !== 'standing_order' || !['requested', 'active', 'finished'].includes(line.status)) throw new HttpError(409, 'invalid');
  const body = await readJson(c.request);
  const period = clean(body.period, 7);
  // A month that has not started cannot be ticked, but any tick can be removed.
  if (!PERIOD_RE.test(period) || (body.received !== false && period > now().slice(0, 7))) throw new HttpError(422, 'invalid');
  const month = new Date(`${period}-15`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  if (body.received === false) {
    await c.db.batch([
      c.db.prepare('DELETE FROM payment_receipts WHERE payment_id = ? AND period = ?').bind(lineId, period),
      // The invoice number is kept, never reused, and comes back if the month is ticked again.
      c.db.prepare('UPDATE monthly_invoices SET void_at = ? WHERE payment_id = ? AND ref = ?').bind(now(), lineId, period),
      ...record(c, line.project_id, `${line.label}: ${month} unticked`),
    ]);
  } else {
    await c.db.batch([
      c.db.prepare('INSERT OR IGNORE INTO payment_receipts (payment_id, project_id, period, received_at) VALUES (?, ?, ?, ?)').bind(lineId, line.project_id, period, now()),
      ...record(c, line.project_id, `${line.label}: ${month} received`),
    ]);
    await monthlyInvoice(c, line, { ref: period, period, amount: line.amount, paidAt: now(), paidHow: 'standing order' });
  }
  await refreshStandingOrder(c, line);
  return json({ ok: true });
};

// A standing order line is running once any month has arrived, and finished
// once a fixed term has had all its payments.
export async function refreshStandingOrder(c: Ctx, line: PaymentLine): Promise<void> {
  const count = (await c.db.prepare('SELECT COUNT(*) AS n FROM payment_receipts WHERE payment_id = ?').bind(line.id).first<{ n: number }>())?.n ?? 0;
  const status = count === 0 ? 'requested' : line.months && count >= line.months ? 'finished' : 'active';
  await c.db
    .prepare('UPDATE payments SET status = ?, paid_at = CASE WHEN ? = 0 THEN NULL ELSE COALESCE(paid_at, ?) END, ended_at = ? WHERE id = ?')
    .bind(status, count, now(), status === 'finished' ? now() : null, line.id)
    .run();
}

const saveBank: Handler = async (c) => {
  const body = await readJson(c.request);
  const accountName = clean(body.accountName, 100);
  const sortCode = clean(body.sortCode, 20).replace(/[^0-9]/g, '');
  const accountNumber = clean(body.accountNumber, 20).replace(/[^0-9]/g, '');
  if (!accountName || sortCode.length !== 6 || accountNumber.length !== 8) throw new HttpError(422, 'bad_bank_details');
  const value = JSON.stringify({ accountName, sortCode: sortCode.replace(/(\d{2})(\d{2})(\d{2})/, '$1-$2-$3'), accountNumber });
  await c.db
    .prepare("INSERT INTO settings (key, value) VALUES ('bank_details', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value")
    .bind(value)
    .run();
  return json({ ok: true });
};

// ---------- client: paying ----------

async function revolutCustomer(c: Ctx, clientId: string): Promise<string> {
  const client = await c.db.prepare('SELECT revolut_customer_id FROM clients WHERE id = ?').bind(clientId).first<{ revolut_customer_id: string | null }>();
  if (client?.revolut_customer_id) return client.revolut_customer_id;
  const login = await clientLogin(c, clientId);
  if (!login) throw new HttpError(404, 'not_found');
  const customer = await revolut.createCustomer(c.env, login.email, login.name);
  await c.db.prepare('UPDATE clients SET revolut_customer_id = ? WHERE id = ?').bind(customer.id, clientId).run();
  return customer.id;
}

// Returns the address of Revolut's checkout page for one line. The amount
// always comes from the database, never from the browser.
const checkout: Handler = async (c, [lineId]) => {
  if (c.user!.role !== 'client') throw new HttpError(403, 'clients_only');
  let line = await getLine(c, lineId);
  const project = await getProject(c, line.project_id);

  // A checkout may already be open, or already paid in another tab.
  if (line.order_id || line.subscription_id) {
    await syncLine(c, line);
    line = await getLine(c, lineId);
  }
  if (line.status !== 'requested') return json({ ok: true, paid: line.status === 'paid' || line.status === 'active' });
  if (line.method === 'standing_order') throw new HttpError(409, 'payment_started');
  if (line.order_id && line.checkout_url) {
    const open = await revolut.getOrder(c.env, line.order_id);
    if (open.state === 'pending') return json({ ok: true, url: line.checkout_url });
  }

  const customerId = await revolutCustomer(c, project.client_id);
  // A plain address with no # in it, because Revolut adds its own details to the end.
  // Revolut refuses localhost and bare IP addresses here, so when testing
  // locally the customer simply stays on Revolut's "paid" screen.
  const local = /^(localhost|[\d.]+|\[.*\])$/.test(c.url.hostname);
  const redirectUrl = local ? undefined : `${c.url.origin}/portal?project=${project.id}`;
  let order: revolut.Order;
  let subscriptionId: string | null = null;

  if (line.kind === 'one_off') {
    order = await revolut.createOrder(c.env, {
      amount: line.amount, description: `${line.label}: ${project.name}`, customerId, redirectUrl,
      reference: line.invoice_no || line.id,
    });
  } else {
    const variationId = await revolut.createMonthlyPlan(c.env, `${project.name}: ${line.label}`, line.amount, line.months);
    const sub = await revolut.createSubscription(c.env, { variationId, customerId, reference: line.id, redirectUrl });
    if (!sub.setup_order_id) throw new HttpError(502, 'payment_provider_error');
    subscriptionId = sub.id;
    order = await revolut.getOrder(c.env, sub.setup_order_id);
  }
  if (!order.checkout_url) throw new HttpError(502, 'payment_provider_error');

  await c.db
    .prepare('UPDATE payments SET order_id = ?, checkout_url = ?, subscription_id = ?, synced_at = NULL WHERE id = ?')
    .bind(order.id, order.checkout_url, subscriptionId, lineId)
    .run();
  return json({ ok: true, url: order.checkout_url });
};

const invoice: Handler = async (c, [lineId]) => {
  const line = await getLine(c, lineId);
  if (line.kind !== 'one_off' || !line.invoice_no) throw new HttpError(404, 'not_found');
  const project = await getProject(c, line.project_id);
  const client = await c.db.prepare('SELECT name, company FROM clients WHERE id = ?').bind(project.client_id).first<{ name: string; company: string }>();
  const pdf = await invoicePdf({
    number: line.invoice_no, issued: line.requested_at || line.created_at, projectName: project.name,
    clientName: client?.name ?? '', company: client?.company ?? '', description: line.label, amount: line.amount,
    paidAt: line.status === 'paid' ? line.paid_at : null, paidHow: line.paid_how,
  });
  return new Response(pdf as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${line.invoice_no}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
};

const monthlyInvoiceFile: Handler = async (c, [number]) => {
  const inv = await c.db.prepare('SELECT * FROM monthly_invoices WHERE invoice_no = ? AND void_at IS NULL').bind(number).first<MonthlyInvoice>();
  if (!inv) throw new HttpError(404, 'not_found');
  const line = await getLine(c, inv.payment_id); // checks the caller may see this project
  return new Response((await monthlyPdf(c, line, inv)) as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${inv.invoice_no}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
};

export const paymentRoutes: Route[] = [
  ['POST', new RegExp(`^/projects/${ID}/payments$`), 'admin', addLine],
  ['DELETE', new RegExp(`^/payments/${ID}$`), 'admin', removeLine],
  ['POST', new RegExp(`^/payments/${ID}/request$`), 'admin', requestLine],
  ['POST', new RegExp(`^/payments/${ID}/mark-paid$`), 'admin', markPaid],
  ['POST', new RegExp(`^/payments/${ID}/cancel$`), 'admin', cancelMonthly],
  ['POST', new RegExp(`^/payments/${ID}/checkout$`), 'user', checkout],
  ['POST', new RegExp(`^/payments/${ID}/standing-order$`), 'user', chooseStandingOrder],
  ['POST', new RegExp(`^/payments/${ID}/card$`), 'user', chooseCard],
  ['POST', new RegExp(`^/payments/${ID}/receipts$`), 'admin', setReceipt],
  ['PUT', /^\/settings\/bank$/, 'admin', saveBank],
  ['GET', new RegExp(`^/payments/${ID}/invoice\\.pdf$`), 'user', invoice],
  ['GET', /^\/invoices\/(FWD-INV-\d{4,6})\.pdf$/, 'user', monthlyInvoiceFile],
];
