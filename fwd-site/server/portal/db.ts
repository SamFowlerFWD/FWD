import type { D1 } from './core';

// The tables are created on first use, so there is no separate migration step.
// To change the schema later, add statements to the end of this list
// (use "ALTER TABLE ... ADD COLUMN" wrapped in a new version check).
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, company TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL CHECK (role IN ('admin','client')), client_id TEXT,
    created_at TEXT NOT NULL, last_login_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS login_tokens (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL, used_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY, client_id TEXT NOT NULL, name TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'onboarding', notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  // One agreement per project: the client's Statement of Work (a PDF) plus the
  // version of the Terms of Business that was current when it was sent.
  `CREATE TABLE IF NOT EXISTS contracts (
    project_id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','signed')),
    sow_key TEXT, sow_filename TEXT, sow_hash TEXT, sow_size INTEGER,
    terms_id TEXT, sent_at TEXT, sent_by TEXT,
    signed_at TEXT, signer_name TEXT, signer_position TEXT, signer_email TEXT, signer_ip TEXT,
    signer_ua TEXT, signed_key TEXT, updated_at TEXT NOT NULL)`,
  // Every version of the Terms of Business is kept, because a signed SOW stays
  // on the version it was signed with. The newest one is used for new SOWs.
  `CREATE TABLE IF NOT EXISTS terms (
    id TEXT PRIMARY KEY, label TEXT NOT NULL, r2_key TEXT NOT NULL, filename TEXT NOT NULL,
    hash TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS briefs (
    project_id TEXT PRIMARY KEY, answers TEXT NOT NULL DEFAULT '{}', submitted_at TEXT, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, kind TEXT NOT NULL CHECK (kind IN ('upload','access')),
    label TEXT NOT NULL, help TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'todo',
    note TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, item_id TEXT NOT NULL, r2_key TEXT NOT NULL,
    filename TEXT NOT NULL, size INTEGER NOT NULL, content_type TEXT NOT NULL DEFAULT '',
    uploaded_by TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, title TEXT NOT NULL, due TEXT,
    done INTEGER NOT NULL DEFAULT 0, client_visible INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL, done_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT, project_id TEXT NOT NULL, actor TEXT NOT NULL,
    action TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_projects_client ON projects (client_id)`,
  `CREATE INDEX IF NOT EXISTS idx_items_project ON items (project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_files_project ON files (project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks (project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_activity_project ON activity (project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_login_tokens_user ON login_tokens (user_id)`,
];

// Changes made after the client area first went live. Each entry runs once, in
// order, and the database remembers how far it has got. Only ever add to the end.
const MIGRATIONS: string[][] = [
  // 2: payments through Revolut
  [
    `CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('one_off','monthly')),
      label TEXT NOT NULL, amount INTEGER NOT NULL, months INTEGER, min_months INTEGER,
      due_on TEXT NOT NULL DEFAULT 'manual' CHECK (due_on IN ('signing','manual')),
      status TEXT NOT NULL DEFAULT 'planned',
      invoice_no TEXT, order_id TEXT, checkout_url TEXT, subscription_id TEXT,
      requested_at TEXT, paid_at TEXT, ended_at TEXT, paid_how TEXT, synced_at TEXT,
      position INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_payments_project ON payments (project_id)`,
    `ALTER TABLE clients ADD COLUMN revolut_customer_id TEXT`,
  ],
];

let ready = false;

export async function ensureSchema(db: D1): Promise<void> {
  if (ready) return;
  await db.batch(SCHEMA.map((sql) => db.prepare(sql)));
  const row = await db.prepare("SELECT value FROM settings WHERE key = 'schema_version'").first<{ value: string }>();
  for (let version = Number(row?.value ?? 1); version - 1 < MIGRATIONS.length; version++) {
    await db.batch([
      ...MIGRATIONS[version - 1].map((sql) => db.prepare(sql)),
      db
        .prepare("INSERT INTO settings (key, value) VALUES ('schema_version', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value")
        .bind(String(version + 1)),
    ]);
  }
  ready = true;
}
