// Cloudflare Pages Function: POST /api/contact
// Emails contact form enquiries to Sam through Resend.
//
// Settings (Cloudflare Pages > fwd-site > Settings > Variables and Secrets):
//   RESEND_API_KEY  (secret, required)  a Resend API key with sending access
//   CONTACT_TO      (optional)          defaults to thinking@f-w-d.co.uk
//   CONTACT_FROM    (optional)          defaults to "FWD website <website@f-w-d.co.uk>";
//                                       the domain must be verified in Resend

import type { D1 } from '../../server/portal/core';
import { saveEnquiry } from '../../server/portal/enquiries';

interface Env {
  DB?: D1; // the client area's database: enquiries also show there and on Sam's phone
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}

interface Context {
  request: Request;
  env: Env;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);

export const onRequestPost = async ({ request, env }: Context) => {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // Spam traps. Bots get a normal-looking success so they don't retry.
  // 1. A hidden field real people never see or fill in.
  if (clean(data.company_website, 200)) return json({ ok: true });
  // 2. Submitted faster than a person could type (time measured in the browser).
  const elapsedMs = Number(data.elapsedMs);
  if (Number.isFinite(elapsedMs) && elapsedMs < 2000) return json({ ok: true });

  const name = clean(data.name, 100);
  const email = clean(data.email, 200);
  const message = clean(data.message, 5000);
  const page = clean(data.page, 200);

  if (!name || !EMAIL_RE.test(email)) return json({ ok: false, error: 'invalid' }, 422);
  // Saved before the email is tried, so an enquiry is not lost if the email fails.
  if (env.DB) await saveEnquiry(env.DB, { name, email, message, page });
  if (!env.RESEND_API_KEY) return json({ ok: false, error: 'not_configured' }, 503);

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    ...(page ? [`Sent from: https://f-w-d.co.uk${page}`] : []),
    '',
    message || '(No message)',
    '',
    'Reply to this email to answer them directly.',
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM || 'FWD website <website@f-w-d.co.uk>',
      to: [env.CONTACT_TO || 'thinking@f-w-d.co.uk'],
      reply_to: email,
      subject: `New enquiry from ${name}`,
      text,
    }),
  });

  if (!res.ok) {
    console.error('Resend error', res.status, await res.text());
    return json({ ok: false, error: 'send_failed' }, 502);
  }

  return json({ ok: true });
};
