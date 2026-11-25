// Notifications on Sam's phone. Everything that goes on the projects page
// (notify in payments.ts) is also pushed to each device he has turned
// notifications on for. This is standard Web Push: the message is encrypted
// for the device (RFC 8291) and signed with our own key pair (RFC 8292).
// The key pair is made on first use and kept in the settings table, so there
// is nothing to set up in Cloudflare.

import { type D1, HttpError, clean, json, now, readJson } from './core';
import { COMPANY } from './company';
import type { Ctx, Handler, Route } from './router';

interface Keys { publicKey: string; privateJwk: JsonWebKey }
interface Subscription { endpoint: string; p256dh: string; auth: string }
export interface PushMessage { title: string; body: string; url: string; count?: number }

type Bytes = Uint8Array<ArrayBuffer>;
const encoder = new TextEncoder();
const utf8 = (text: string) => encoder.encode(text) as Bytes;

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return btoa(String.fromCharCode(...view)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(text: string): Bytes {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}

function join(...parts: Uint8Array[]): Bytes {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

// ---------- our key pair ----------

let cached: Keys | null = null;

async function keys(db: D1): Promise<Keys> {
  if (cached) return cached;
  const read = () => db.prepare("SELECT value FROM settings WHERE key = 'push_keys'").first<{ value: string }>();
  let row = await read();
  if (!row) {
    const pair = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
    const fresh: Keys = {
      publicKey: b64url((await crypto.subtle.exportKey('raw', pair.publicKey)) as ArrayBuffer),
      privateJwk: (await crypto.subtle.exportKey('jwk', pair.privateKey)) as JsonWebKey,
    };
    // If two requests get here together, the first one wins and both use its keys.
    await db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('push_keys', ?)").bind(JSON.stringify(fresh)).run();
    row = await read();
  }
  cached = JSON.parse(row!.value) as Keys;
  return cached;
}

// Proves to the push service (Apple, Google, Mozilla) that the message is from us.
async function authorisation(k: Keys, endpoint: string): Promise<string> {
  const header = b64url(utf8(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64url(
    utf8(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: `mailto:${COMPANY.email}` })),
  );
  const key = await crypto.subtle.importKey('jwk', k.privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, utf8(`${header}.${claims}`));
  return `vapid t=${header}.${claims}.${b64url(signature)}, k=${k.publicKey}`;
}

// ---------- encrypting for one device ----------

async function hkdf(salt: Bytes, secret: Bytes, info: Bytes, bytes: number): Promise<Bytes> {
  const key = await crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8));
}

export async function encrypt(sub: Subscription, payload: string): Promise<Bytes> {
  const theirPublic = fromB64url(sub.p256dh);
  const authSecret = fromB64url(sub.auth);
  if (theirPublic.length !== 65 || authSecret.length !== 16) throw new Error('bad subscription keys');

  const ours = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair;
  const ourPublic = new Uint8Array((await crypto.subtle.exportKey('raw', ours.publicKey)) as ArrayBuffer);
  const theirKey = await crypto.subtle.importKey('raw', theirPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: theirKey } as unknown as AlgorithmIdentifier, ours.privateKey, 256));

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const material = await hkdf(authSecret, shared, join(utf8('WebPush: info\0'), theirPublic, ourPublic), 32);
  const contentKey = await hkdf(salt, material, utf8('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, material, utf8('Content-Encoding: nonce\0'), 12);

  const aes = await crypto.subtle.importKey('raw', contentKey, 'AES-GCM', false, ['encrypt']);
  // 0x02 marks the end of the (only) record.
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, join(utf8(payload), new Uint8Array([2]))));

  // Header: salt, record size (4096), length of our public key, our public key.
  return join(salt, new Uint8Array([0, 0, 16, 0, ourPublic.length]), ourPublic, sealed);
}

// ---------- sending ----------

// Sends one message to every device Sam has switched on. Never throws, and
// gives up on a slow push service after a few seconds, so a notification can
// never hold up or undo the thing that caused it. Returns how many went.
export async function sendPush(c: Pick<Ctx, 'db'>, message: PushMessage): Promise<number> {
  try {
    const subs = (await c.db.prepare('SELECT endpoint, p256dh, auth FROM push_subscriptions').all<Subscription>()).results;
    if (!subs.length) return 0;
    const k = await keys(c.db);
    const payload = JSON.stringify({ ...message, title: message.title.slice(0, 120), body: message.body.slice(0, 300) });
    const results = await Promise.all(
      subs.map(async (sub) => {
        try {
          const res = await fetch(sub.endpoint, {
            method: 'POST',
            headers: {
              Authorization: await authorisation(k, sub.endpoint),
              'Content-Encoding': 'aes128gcm',
              'Content-Type': 'application/octet-stream',
              TTL: '86400',
              Urgency: 'high',
            },
            body: await encrypt(sub, payload),
            signal: AbortSignal.timeout(6000),
          });
          // The device has turned notifications off or removed the app.
          if (res.status === 404 || res.status === 410) {
            await c.db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(sub.endpoint).run();
          } else if (!res.ok) {
            console.error('Push refused', res.status, new URL(sub.endpoint).host, (await res.text()).slice(0, 200));
          }
          return res.ok;
        } catch (err) {
          console.error('Push failed', err);
          return false;
        }
      }),
    );
    return results.filter(Boolean).length;
  } catch (err) {
    console.error('Could not send push', err);
    return 0;
  }
}

// ---------- routes (Sam only) ----------

const publicKey: Handler = async (c) => json({ ok: true, key: (await keys(c.db)).publicKey });

const subscribe: Handler = async (c) => {
  const body = await readJson(c.request);
  const given = (body.keys && typeof body.keys === 'object' ? body.keys : {}) as Record<string, unknown>;
  const endpoint = clean(body.endpoint, 1000);
  const p256dh = clean(given.p256dh, 200);
  const auth = clean(given.auth, 100);
  if (!/^https:\/\/[^\s]+$/.test(endpoint) || !/^[A-Za-z0-9_-]+$/.test(p256dh) || !/^[A-Za-z0-9_-]+$/.test(auth)) throw new HttpError(422, 'invalid');
  await c.db
    .prepare(
      `INSERT INTO push_subscriptions (endpoint, user_id, p256dh, auth, device, created_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`,
    )
    .bind(endpoint, c.user!.id, p256dh, auth, clean(c.request.headers.get('User-Agent'), 300), now())
    .run();
  return json({ ok: true });
};

// Public on purpose: it runs as Sam signs out, and knowing the long random
// address of a device is the only way to remove it.
const unsubscribe: Handler = async (c) => {
  const body = await readJson(c.request);
  await c.db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(clean(body.endpoint, 1000)).run();
  return json({ ok: true });
};

const test: Handler = async (c) => {
  const sent = await sendPush(c, { title: 'Test from the FWD client area', body: 'Notifications are working on this device.', url: '/portal' });
  if (!sent) throw new HttpError(502, 'push_failed');
  return json({ ok: true, sent });
};

export const pushRoutes: Route[] = [
  ['GET', /^\/push\/key$/, 'admin', publicKey],
  ['POST', /^\/push\/subscribe$/, 'admin', subscribe],
  ['POST', /^\/push\/unsubscribe$/, 'public', unsubscribe],
  ['POST', /^\/push\/test$/, 'admin', test],
];
