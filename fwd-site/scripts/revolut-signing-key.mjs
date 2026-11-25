// Makes the signing key pair Revolut needs for a key that can read bank
// transactions. Run with: npm run revolut:keys
//
// It writes two files into .revolut-keys/ (which git ignores):
//   public.pem   paste this into the Revolut API Console when it asks for a
//                public signing key
//   private.pem  keep this secret. The long middle line is the value for the
//                REVOLUT_BANK_SIGNING_KEY secret
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const dir = new URL('../.revolut-keys/', import.meta.url);
if (existsSync(new URL('private.pem', dir))) {
  console.error('There is already a key in .revolut-keys/. Delete that folder first if you really want a new one.');
  process.exit(1);
}
mkdirSync(dir, { recursive: true });
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const publicPem = publicKey.export({ type: 'spki', format: 'pem' });
writeFileSync(new URL('private.pem', dir), privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
writeFileSync(new URL('public.pem', dir), publicPem);

console.log('Done. Paste this public key into the Revolut API Console:\n');
console.log(publicPem);
console.log('The private key is in .revolut-keys/private.pem. Do not share it or commit it.');
