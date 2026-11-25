// The daily check. A small timer (cron-worker/) calls this once a day so that
// payments are noticed, ticked and invoiced even when nobody has opened the
// client area. It also tells Sam when a standing order payment is late.
//
// It is not a page anyone visits: the caller must send the shared CRON_SECRET.

import { HttpError, json, now, pounds, sha256 } from './core';
import { syncBank } from './bank';
import { type PaymentLine, syncAllCards, systemNote, tellSam } from './payments';
import type { Ctx, Handler, Route } from './router';

const DAY = 24 * 60 * 60 * 1000;
const GRACE_DAYS = 5; // how long after the usual day before a month counts as late
const FIRST_PAYMENT_DAYS = 14;

const ukDay = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/London' }); // YYYY-MM-DD
const monthName = (period: string) => new Date(`${period}-15`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const shiftMonth = (period: string, by: number) =>
  new Date(Date.UTC(Number(period.slice(0, 4)), Number(period.slice(5, 7)) - 1 + by, 15)).toISOString().slice(0, 7);

// True the first time a given thing is reported, so Sam is told once, not daily.
async function firstTime(c: Ctx, key: string): Promise<boolean> {
  const made = await c.db.prepare('INSERT OR IGNORE INTO notices (key, created_at) VALUES (?, ?)').bind(key, now()).run();
  return Boolean(made.meta?.changes);
}

// Which months of a running standing order are late today. The usual day is
// taken from the most recent payment (capped at the 28th so it exists in
// every month). Only this month and last month are looked at.
export function lateMonths(ticked: { period: string; received_at: string }[], today: string): string[] {
  if (!ticked.length) return [];
  const sorted = [...ticked].sort((a, b) => a.period.localeCompare(b.period));
  const first = sorted[0].period;
  const usualDay = Math.min(28, Number(ukDay(sorted[sorted.length - 1].received_at).slice(8, 10)));
  const have = new Set(sorted.map((t) => t.period));
  const thisMonth = today.slice(0, 7);
  return [shiftMonth(thisMonth, -1), thisMonth].filter((period) => {
    if (period <= first || have.has(period)) return false;
    const due = new Date(`${period}-${String(usualDay).padStart(2, '0')}T00:00:00Z`).getTime();
    return new Date(`${today}T00:00:00Z`).getTime() >= due + GRACE_DAYS * DAY;
  });
}

async function lateStandingOrders(c: Ctx): Promise<number> {
  let told = 0;
  const today = ukDay(now());
  const lines = (
    await c.db.prepare("SELECT * FROM payments WHERE method = 'standing_order' AND status IN ('requested','active')").all<PaymentLine>()
  ).results;
  for (const line of lines) {
    const amount = `${pounds(line.amount)} a month`;
    if (line.status === 'requested') {
      const waiting = Date.now() - new Date(line.requested_at || line.created_at).getTime();
      if (waiting < FIRST_PAYMENT_DAYS * DAY || !(await firstTime(c, `no-first:${line.id}`))) continue;
      told++;
      await systemNote(c, line.project_id, `${line.label}: no standing order payment seen after ${FIRST_PAYMENT_DAYS} days`).run();
      await tellSam(c, line.project_id, `No first payment yet: ${line.label}`, `The client chose to pay ${line.label} (${amount}) by standing order, reference ${line.reference}, but nothing has arrived after ${FIRST_PAYMENT_DAYS} days. They may not have set it up. The client has not been contacted.`, 'action');
      continue;
    }
    const ticked = (await c.db.prepare('SELECT period, received_at FROM payment_receipts WHERE payment_id = ?').bind(line.id).all<{ period: string; received_at: string }>()).results;
    for (const period of lateMonths(ticked, today)) {
      if (!(await firstTime(c, `late:${line.id}:${period}`))) continue;
      told++;
      await systemNote(c, line.project_id, `${line.label}: ${monthName(period)} payment is late`).run();
      await tellSam(c, line.project_id, `Late payment: ${line.label}, ${monthName(period)}`, `The ${monthName(period)} standing order payment for ${line.label} (${amount}), reference ${line.reference}, has not arrived. It is more than ${GRACE_DAYS} days past the usual day. The client has not been contacted. If it did arrive with a different reference, tick the month by hand.`, 'action');
    }
  }
  return told;
}

const daily: Handler = async (c) => {
  // Compare fingerprints rather than the passwords themselves, so the time
  // taken gives nothing away about how close a guess was.
  const sent = (c.request.headers.get('Authorization') || '').replace(/^Bearer /, '');
  if (!c.env.CRON_SECRET || !sent || (await sha256(sent)) !== (await sha256(c.env.CRON_SECRET))) throw new HttpError(404, 'not_found');

  const bank = await syncBank(c, true).catch(() => null);
  const cards = await syncAllCards(c);
  const late = await lateStandingOrders(c).catch((err) => {
    console.error('Late payment check failed', err);
    return 0;
  });
  await c.db
    .prepare("INSERT INTO settings (key, value) VALUES ('daily_check_at', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value")
    .bind(now())
    .run();
  return json({ ok: true, bank: bank ? { ticked: bank.ticked, flagged: bank.flagged } : null, cards, late });
};

export const dailyRoutes: Route[] = [['POST', /^\/cron$/, 'public', daily]];
