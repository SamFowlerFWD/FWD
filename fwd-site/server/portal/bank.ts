// Ticks off bank payments automatically by reading what has arrived in the
// Revolut business account (Revolut Business API, read-only).
//
// It only acts on a payment whose reference contains one of our own codes:
// a standing order reference (FWD-SO-48213) or an invoice number
// (FWD-INV-37930). Everything else in the account is ignored and never stored.
//
// A payment is only ticked when the amount is exactly right. Anything else is
// recorded and emailed to Sam to look at, and he can always tick by hand.

import { type Env, HttpError, json, now, pounds } from './core';
import { type PaymentLine, monthlyInvoice, refreshStandingOrder, systemNote, tellSam } from './payments';
import type { Ctx, Handler, Route } from './router';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export const bankEnabled = (env: Env) => Boolean(env.REVOLUT_BANK_API_KEY && env.REVOLUT_BANK_SIGNING_KEY);

// ---------- talking to Revolut ----------

interface Leg { amount: number; currency: string; description?: string | null }
interface Transaction { id: string; type: string; state: string; reference?: string | null; created_at: string; completed_at?: string | null; legs?: Leg[] }

let signingKey: Promise<CryptoKey> | null = null;

// Every request is signed with an Ed25519 key, as Revolut requires for keys
// that can see account data. The secret holds the key without its PEM header.
function loadSigningKey(env: Env): Promise<CryptoKey> {
  if (!signingKey) {
    const der = Uint8Array.from(atob(env.REVOLUT_BANK_SIGNING_KEY!.replace(/-----[^-]+-----|\s/g, '')), (ch) => ch.charCodeAt(0));
    signingKey = crypto.subtle.importKey('pkcs8', der, { name: 'Ed25519' }, false, ['sign']);
  }
  return signingKey;
}

async function get<T>(env: Env, path: string, query: string): Promise<T> {
  const base = (env.REVOLUT_BANK_API_BASE || 'https://b2b.revolut.com').replace(/\/$/, '');
  const timestamp = Date.now().toString();
  const message = new TextEncoder().encode(`${timestamp}GET${path}${query}`);
  const signature = new Uint8Array(await crypto.subtle.sign('Ed25519', await loadSigningKey(env), message));
  let res: Response;
  try {
    res = await fetch(`${base}${path}${query ? `?${query}` : ''}`, {
      headers: {
        Authorization: `Bearer ${env.REVOLUT_BANK_API_KEY}`,
        'Revolut-Api-Timestamp': timestamp,
        'Revolut-Api-Signature': btoa(String.fromCharCode(...signature)),
        Accept: 'application/json',
      },
    });
  } catch (err) {
    console.error('Revolut bank request failed', path, err);
    throw new HttpError(502, 'payment_provider_error');
  }
  if (!res.ok) {
    console.error('Revolut bank error', path, res.status, (await res.text()).slice(0, 300));
    throw new HttpError(502, 'payment_provider_error');
  }
  return (await res.json()) as T;
}

// Newest first, up to 1,000 a page. A few pages is far more than a small
// business account produces between checks.
async function transactionsSince(env: Env, from: string): Promise<Transaction[]> {
  const all: Transaction[] = [];
  let to = '';
  for (let page = 0; page < 5; page++) {
    const query = `from=${encodeURIComponent(from)}&count=1000${to ? `&to=${encodeURIComponent(to)}` : ''}`;
    const batch = await get<Transaction[]>(env, '/api/1.0/transactions', query);
    all.push(...batch);
    if (batch.length < 1000) break;
    to = batch[batch.length - 1].created_at;
  }
  const unique = new Map(all.map((t) => [t.id, t]));
  return [...unique.values()].sort((a, b) => (a.completed_at || a.created_at).localeCompare(b.completed_at || b.created_at));
}

// ---------- matching ----------

// "fwd so 48213", "FWD-SO-48213" and "FWDSO48213" all count as the same code.
const squash = (text: string) => text.toUpperCase().replace(/[^A-Z0-9]/g, '');

function mentions(text: string, code: string): boolean {
  const at = text.indexOf(squash(code));
  if (at < 0) return false;
  const next = text[at + squash(code).length];
  return !(next >= '0' && next <= '9'); // FWD-SO-4821 must not match FWD-SO-48213
}

const ukDay = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/London' }); // YYYY-MM-DD
const monthName = (period: string) => new Date(`${period}-15`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const shiftMonth = (period: string, by: number) => {
  const d = new Date(Date.UTC(Number(period.slice(0, 4)), Number(period.slice(5, 7)) - 1 + by, 15));
  return d.toISOString().slice(0, 7);
};

// Which month a standing order payment counts for: the month it arrived.
// One exception. A payment due at the very end of a month can land on the
// first working day of the next, so a payment in the first three days counts
// for the month before when that month is the only gap in an otherwise
// ticked run. Anything else that lands on a ticked month is left for Sam.
function monthFor(paidOn: string, ticked: string[]): string | null {
  const month = paidOn.slice(0, 7);
  const before = shiftMonth(month, -1);
  const late = Number(paidOn.slice(8, 10)) <= 3 && !ticked.includes(before) && ticked.includes(shiftMonth(month, -2));
  if (late) return before;
  return ticked.includes(month) ? null : month;
}

interface Summary { looked: number; ticked: number; flagged: number }

async function handle(c: Ctx, line: PaymentLine, txn: Transaction, leg: Leg, summary: Summary): Promise<void> {
  const amount = Math.round(leg.amount * 100);
  const paidOn = ukDay(txn.completed_at || txn.created_at);
  const save = (outcome: string, period: string | null, detail: string) =>
    c.db
      .prepare('INSERT OR IGNORE INTO bank_matches (txn_id, payment_id, project_id, outcome, period, amount, paid_on, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(txn.id, line.id, line.project_id, outcome, period, amount, paidOn, detail, now())
      .run();
  const flag = async (outcome: string, detail: string) => {
    const saved = await save(outcome, null, detail);
    if (!saved.meta?.changes) return; // someone else's page load got here first
    summary.flagged++;
    await systemNote(c, line.project_id, `${line.label}: ${detail}`).run();
    await tellSam(c, line.project_id, `Check a payment: ${line.label}`, `${detail}\n\nNothing has been ticked. Have a look in Revolut, then tick or mark it by hand if it is right.`);
  };
  const wanted = `${pounds(line.amount)}${line.kind === 'monthly' ? ' a month' : ''}`;

  if (amount !== line.amount) {
    return flag('wrong_amount', `${pounds(amount)} arrived on ${paidOn} with reference ${line.reference || line.invoice_no}, but ${wanted} was expected`);
  }

  if (line.kind === 'one_off') {
    const saved = await save('paid', null, '');
    if (!saved.meta?.changes) return;
    const done = await c.db
      .prepare("UPDATE payments SET status = 'paid', paid_at = ?, paid_how = 'bank transfer' WHERE id = ? AND status = 'requested'")
      .bind(txn.completed_at || now(), line.id)
      .run();
    if (!done.meta?.changes) return;
    summary.ticked++;
    await systemNote(c, line.project_id, `${line.label} paid by bank transfer (${pounds(amount)}), matched from the bank account`).run();
    await tellSam(c, line.project_id, `Paid: ${line.label}`, `${line.label} of ${pounds(amount)} arrived by bank transfer on ${paidOn} and has been marked as paid.`);
    return;
  }

  const ticked = (await c.db.prepare('SELECT period FROM payment_receipts WHERE payment_id = ?').bind(line.id).all<{ period: string }>()).results.map((r) => r.period);
  const period = monthFor(paidOn, ticked);
  if (!period) {
    return flag('extra', `a second payment of ${pounds(amount)} arrived on ${paidOn} with reference ${line.reference}, and ${monthName(paidOn.slice(0, 7))} was already ticked`);
  }
  const saved = await save('ticked', period, '');
  if (!saved.meta?.changes) return;
  await c.db
    .prepare("INSERT OR IGNORE INTO payment_receipts (payment_id, project_id, period, received_at, source) VALUES (?, ?, ?, ?, 'revolut')")
    .bind(line.id, line.project_id, period, txn.completed_at || now())
    .run();
  await refreshStandingOrder(c, line);
  await monthlyInvoice(c, line, { ref: period, period, amount, paidAt: txn.completed_at || now(), paidHow: 'standing order' });
  summary.ticked++;
  await systemNote(c, line.project_id, `${line.label}: ${monthName(period)} received (${pounds(amount)} on ${paidOn}), ticked automatically`).run();
  await tellSam(c, line.project_id, `Received: ${line.label}, ${monthName(period)}`, `${pounds(amount)} arrived on ${paidOn} with reference ${line.reference}. ${monthName(period)} has been ticked.`);
}

// Looks for new payments. Runs at most every 10 minutes unless forced, and
// never throws: a problem at Revolut must not stop a page from loading.
export async function syncBank(c: Ctx, force = false): Promise<Summary | null> {
  if (!bankEnabled(c.env)) return null;
  try {
    const state = await c.db.prepare("SELECT key, value FROM settings WHERE key IN ('bank_checked_at', 'bank_ok_at')").all<{ key: string; value: string }>();
    const checkedAt = state.results.find((r) => r.key === 'bank_checked_at')?.value;
    const okAt = state.results.find((r) => r.key === 'bank_ok_at')?.value;
    if (!force && checkedAt && checkedAt > new Date(Date.now() - 10 * MINUTE).toISOString()) return null;
    const stamp = (key: string) =>
      c.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value').bind(key, now()).run();
    await stamp('bank_checked_at'); // claimed before the slow part, so two page loads do not both go

    const lines = (
      await c.db
        .prepare(
          `SELECT * FROM payments WHERE
             (method = 'standing_order' AND status IN ('requested','active') AND reference IS NOT NULL)
             OR (kind = 'one_off' AND status = 'requested' AND invoice_no IS NOT NULL)`,
        )
        .all<PaymentLine>()
    ).results;
    const summary: Summary = { looked: 0, ticked: 0, flagged: 0 };
    if (lines.length) {
      // Go back a little before the last good check, in case a payment was
      // slow to show as completed. First time, go back to the oldest open line.
      const oldest = lines.map((l) => l.requested_at || l.created_at).sort()[0];
      const start = okAt ? new Date(new Date(okAt).getTime() - 10 * DAY) : new Date(new Date(oldest).getTime() - 3 * DAY);
      const earliest = new Date(Date.now() - 90 * DAY);
      const from = (start < earliest ? earliest : start).toISOString().slice(0, 10);
      const seen = new Set((await c.db.prepare('SELECT txn_id FROM bank_matches WHERE created_at > ?').bind(new Date(Date.now() - 120 * DAY).toISOString()).all<{ txn_id: string }>()).results.map((r) => r.txn_id));

      for (const txn of await transactionsSince(c.env, from)) {
        if (txn.state !== 'completed' || seen.has(txn.id)) continue;
        const leg = (txn.legs || []).find((l) => l.amount > 0 && l.currency === 'GBP');
        if (!leg) continue;
        summary.looked++;
        // The payer's reference can arrive in either place, depending on how the payment was sent.
        const text = squash(`${txn.reference || ''} ${(txn.legs || []).map((l) => l.description || '').join(' ')}`);
        const line = lines.find((l) => mentions(text, (l.kind === 'one_off' ? l.invoice_no : l.reference)!));
        if (line) await handle(c, line, txn, leg, summary);
      }
    }
    await stamp('bank_ok_at');
    return summary;
  } catch (err) {
    console.error('Bank check failed', err);
    if (force) throw err instanceof HttpError ? err : new HttpError(502, 'payment_provider_error');
    return null;
  }
}

export async function bankStatus(c: Ctx) {
  const row = await c.db.prepare("SELECT value FROM settings WHERE key = 'bank_ok_at'").first<{ value: string }>();
  return { enabled: bankEnabled(c.env), checkedAt: row?.value ?? null };
}

const checkNow: Handler = async (c) => json({ ok: true, ...(await syncBank(c, true)) });

export const bankRoutes: Route[] = [['POST', /^\/bank\/check$/, 'admin', checkNow]];
