/**
 * SQLite database for Cerberus Enterprise license keys.
 *
 * Schema:
 *   license_keys — one row per issued license
 *
 * Database path: LICENSE_DB_PATH env var or /app/data/licenses.db
 */

import Database from 'better-sqlite3';
import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

const DB_PATH = process.env['LICENSE_DB_PATH'] ?? '/app/data/licenses.db';

let db: Database.Database;

export function getDb(): Database.Database {
  if (db) return db;

  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS license_keys (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      key              TEXT    UNIQUE NOT NULL,
      plan             TEXT    NOT NULL DEFAULT 'enterprise',
      stripe_session_id TEXT,
      customer_email   TEXT    NOT NULL,
      created_at       TEXT    NOT NULL,
      expires_at       TEXT,
      revoked          INTEGER NOT NULL DEFAULT 0
    )
  `);

  return db;
}

export interface LicenseRow {
  id: number;
  key: string;
  plan: string;
  stripe_session_id: string | null;
  customer_email: string;
  created_at: string;
  expires_at: string | null;
  revoked: number;
}

/** Generate a new license key: cbr_ent_<32 hex chars> */
export function generateKey(): string {
  return `cbr_ent_${randomBytes(16).toString('hex')}`;
}

/** Derive HMAC fingerprint (for tamper-evidence on the key). */
export function deriveKeyHmac(key: string): string {
  const secret = process.env['LICENSE_SIGNING_SECRET'] ?? 'dev-secret';
  return createHash('sha256').update(secret + key).digest('hex').slice(0, 8);
}

/** Insert a new license key row. */
export function insertLicense(opts: {
  key: string;
  plan: string;
  stripeSessionId: string | null;
  customerEmail: string;
  expiresAt: string | null;
}): void {
  getDb()
    .prepare(
      `INSERT INTO license_keys (key, plan, stripe_session_id, customer_email, created_at, expires_at)
       VALUES (?, ?, ?, ?, datetime('now'), ?)`,
    )
    .run(opts.key, opts.plan, opts.stripeSessionId, opts.customerEmail, opts.expiresAt);
}

/** Look up a license key. Returns null if not found. */
export function findLicense(key: string): LicenseRow | null {
  return (
    (getDb().prepare('SELECT * FROM license_keys WHERE key = ?').get(key) as LicenseRow | undefined) ??
    null
  );
}

/** Revoke a license key. */
export function revokeLicense(key: string): void {
  getDb().prepare('UPDATE license_keys SET revoked = 1 WHERE key = ?').run(key);
}
