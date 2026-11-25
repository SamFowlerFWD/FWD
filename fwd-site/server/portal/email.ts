import type { Env } from './core';

interface Email {
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: { filename: string; content: string }[]; // content is base64
}

const SIGN_OFF = ['', 'Sam', 'FWD Thinking Solutions', 'https://f-w-d.co.uk'];

// Returns true if the email was handed to Resend. Never throws: a failed
// email must not undo the thing that triggered it (a signature, an upload).
export async function sendEmail(env: Env, email: Email): Promise<boolean> {
  const text = [email.text, ...SIGN_OFF].join('\n');
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
        reply_to: email.replyTo || 'thinking@f-w-d.co.uk',
        subject: email.subject,
        text,
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
