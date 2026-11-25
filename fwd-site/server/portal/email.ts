import type { Env } from './core';
import { COMPANY } from './company';

interface Email {
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: { filename: string; content: string }[]; // content is base64
}

const SIGN_OFF = ['', 'Sam', COMPANY.shortName, COMPANY.url];
// Company details the law expects on business emails, under every message.
const LEGAL = `${COMPANY.name}. ${COMPANY.registered}. Registered office: ${COMPANY.address}.`;

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FONT = "font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

// The same words as the plain email, set out with the logo, a button for any
// link on a line of its own, and the company details underneath. Every
// message is written as plain text first, so the two can never disagree.
export function brandedHtml(body: string): string {
  const paragraphs = body.trim().split(/\n\s*\n/).map((block) => {
    const line = block.trim();
    if (/^https?:\/\/\S+$/.test(line)) {
      const label = line.includes('/portal#/signin/') ? 'Open the client area' : line.includes('/portal') ? 'Go to the client area' : 'Open link';
      return `<p style="margin:0 0 20px"><a href="${escapeHtml(line)}" style="display:inline-block;background:${COMPANY.purple};color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px">${label}</a></p>`;
    }
    const html = escapeHtml(line)
      .replace(/https?:\/\/[^\s<]+[^\s<.,)]/g, (url) => `<a href="${url}" style="color:${COMPANY.purple}">${url}</a>`)
      .replace(/\n/g, '<br>');
    return `<p style="margin:0 0 16px">${html}</p>`;
  });
  return `<!doctype html><html lang="en"><body style="margin:0;padding:0;background:#f3f4f6">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb">
<tr><td style="padding:24px 32px 16px;border-bottom:3px solid ${COMPANY.purple}">
<img src="${COMPANY.logoUrl}" width="132" alt="${COMPANY.shortName}" style="display:block;border:0;${FONT};font-size:20px;font-weight:700;color:${COMPANY.ink}">
<div style="${FONT};font-size:13px;color:#4b5563;margin-top:6px">${COMPANY.shortName}</div>
</td></tr>
<tr><td style="padding:28px 32px 12px;${FONT};font-size:16px;line-height:1.55;color:${COMPANY.ink}">
${paragraphs.join('\n')}
<p style="margin:24px 0 16px">Sam<br><span style="color:#4b5563">${COMPANY.shortName}</span></p>
</td></tr>
<tr><td style="padding:16px 32px 24px;border-top:1px solid #e5e7eb;${FONT};font-size:12px;line-height:1.5;color:#6b7280">
${escapeHtml(LEGAL)}<br>
<a href="mailto:${COMPANY.email}" style="color:#6b7280">${COMPANY.email}</a> &nbsp;|&nbsp; <a href="${COMPANY.url}" style="color:#6b7280">${COMPANY.website}</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

// Returns true if the email was handed to Resend. Never throws: a failed
// email must not undo the thing that triggered it (a signature, an upload).
export async function sendEmail(env: Env, email: Email): Promise<boolean> {
  const text = [email.text, ...SIGN_OFF, '', LEGAL].join('\n');
  const html = brandedHtml(email.text);
  if (!env.RESEND_API_KEY) {
    console.log(`[portal email, not sent: no RESEND_API_KEY] to=${email.to.join(',')} subject=${email.subject}`);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.PORTAL_FROM || 'FWD <website@f-w-d.co.uk>',
        to: email.to,
        reply_to: email.replyTo || COMPANY.email,
        subject: email.subject,
        text,
        html,
        attachments: email.attachments,
      }),
    });
    if (!res.ok) {
      console.error('Resend error', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('Resend request failed', err);
    return false;
  }
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
