// Website enquiries. The contact form (functions/api/contact.ts) still emails
// Sam; it also saves each enquiry here so it shows in the client area, and
// sends it to his phone. Kept small on purpose: the contact form loads this
// file, so it must not pull in the rest of the client area.

import { type D1, json, now } from './core';
import { ensureSchema } from './db';
import { sendPush } from './push';
import type { Ctx, Handler, Route } from './router';

// How many things are waiting for Sam: the number on the app icon.
export async function waitingCount(db: D1): Promise<number> {
  const row = await db
    .prepare(
      `SELECT (SELECT COUNT(*) FROM notifications WHERE done_at IS NULL)
            + (SELECT COUNT(*) FROM enquiries WHERE done_at IS NULL) AS n`,
    )
    .first<{ n: number }>();
  return row?.n ?? 0;
}

// Never throws: a problem here must not stop the enquiry email going.
export async function saveEnquiry(db: D1, enquiry: { name: string; email: string; message: string; page: string }): Promise<void> {
  try {
    await ensureSchema(db);
    await db
      .prepare('INSERT INTO enquiries (id, name, email, message, page, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), enquiry.name, enquiry.email, enquiry.message, enquiry.page, now())
      .run();
    await sendPush({ db }, {
      title: `New enquiry: ${enquiry.name}`,
      body: enquiry.message || '(No message)',
      url: '/portal#/',
      count: await waitingCount(db),
    });
  } catch (err) {
    console.error('Could not save enquiry', err);
  }
}

export const openEnquiries = async (c: Ctx) =>
  (await c.db.prepare('SELECT id, name, email, message, page, created_at FROM enquiries WHERE done_at IS NULL ORDER BY created_at DESC LIMIT 50').all()).results;

const done: Handler = async (c, [id]) => {
  await c.db.prepare('UPDATE enquiries SET done_at = ? WHERE id = ? AND done_at IS NULL').bind(now(), id).run();
  return json({ ok: true });
};

export const enquiryRoutes: Route[] = [['POST', /^\/enquiries\/([0-9a-f-]{36})\/done$/, 'admin', done]];
