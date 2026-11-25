// Small helpers and types shared by the client area API.

export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta?: { changes?: number } }>;
}
export interface D1 {
  prepare(sql: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown[]>;
}
export interface R2Object {
  body: ReadableStream;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}
export interface R2 {
  put(key: string, value: ArrayBuffer | Uint8Array | ReadableStream, options?: Record<string, unknown>): Promise<unknown>;
  get(key: string): Promise<R2Object | null>;
  delete(key: string | string[]): Promise<void>;
}

// Settings (Cloudflare Pages > fwd-site > Settings):
//   DB                  D1 database binding (required)
//   FILES               R2 bucket binding (required for uploads)
//   RESEND_API_KEY      secret, already used by the contact form
//   PORTAL_ADMIN_EMAIL  optional, defaults to thinking@f-w-d.co.uk
//   PORTAL_FROM         optional, defaults to "FWD <website@f-w-d.co.uk>"
//   REVOLUT_API_KEY     secret: Revolut Business > Merchant > API, the secret key.
//                       Without it, payment lines still show but cannot be paid online.
//   REVOLUT_API_BASE    optional: https://sandbox-merchant.revolut.com to test
//   REVOLUT_BANK_API_KEY      secret, optional: a second Revolut key that can read
//                             transactions, used to tick off bank payments automatically
//   REVOLUT_BANK_SIGNING_KEY  secret: the Ed25519 private key that signs those requests
//                             (the long line from private.pem, without the BEGIN/END lines)
//   REVOLUT_BANK_API_BASE     optional: https://sandbox-b2b.revolut.com to test
//   PORTAL_DEV          local testing only: "1" returns sign-in links in the
//                       response instead of emailing them. Never set this live.
export interface Env {
  DB?: D1;
  FILES?: R2;
  RESEND_API_KEY?: string;
  PORTAL_ADMIN_EMAIL?: string;
  PORTAL_FROM?: string;
  PORTAL_DEV?: string;
  REVOLUT_API_KEY?: string;
  REVOLUT_API_BASE?: string;
  REVOLUT_BANK_API_KEY?: string;
  REVOLUT_BANK_SIGNING_KEY?: string;
  REVOLUT_BANK_API_BASE?: string;
  CRON_SECRET?: string; // shared with the daily timer in cron-worker/
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'client';
  client_id: string | null;
}

export class HttpError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });

export const now = () => new Date().toISOString();
export const later = (ms: number) => new Date(Date.now() + ms).toISOString();
export const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const adminEmail = (env: Env) => (env.PORTAL_ADMIN_EMAIL || 'thinking@f-w-d.co.uk').toLowerCase();

export async function sha256(input: string | ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', typeof input === 'string' ? new TextEncoder().encode(input) : input);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const data = await request.json();
    if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>;
  } catch {
    // fall through
  }
  throw new HttpError(400, 'bad_request');
}

export const ukDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'long', timeStyle: 'short' });

export const pounds = (pence: number) =>
  `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
