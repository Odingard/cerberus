/**
 * Tamper-evident append-only audit log for Cerberus Enterprise.
 *
 * Each log entry contains a SHA-256 hash chained from the previous entry.
 * Any modification to a past entry breaks the chain, making tampering
 * detectable. Customers can ship this log to their SIEM for compliance.
 *
 * Log file: /var/log/cerberus/audit.jsonl (one JSON object per line)
 * Format:
 *   { timestamp, sessionId, turnId, toolName, score, action, signals, prevHash, hash }
 */

import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

export interface AuditEntry {
  timestamp: string;
  turnId: string;
  toolName: string;
  score: number;
  action: string;
  signals: readonly string[];
  blocked: boolean;
}

interface AuditRecord extends AuditEntry {
  prevHash: string;
  hash: string;
}

const AUDIT_LOG_PATH = process.env['CERBERUS_AUDIT_LOG'] ?? '/var/log/cerberus/audit.jsonl';

let lastHash = '0000000000000000000000000000000000000000000000000000000000000000';
let initialized = false;

function ensureLogDir(): void {
  if (initialized) return;
  const dir = dirname(AUDIT_LOG_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  // Read last entry to seed the chain hash
  if (existsSync(AUDIT_LOG_PATH)) {
    const lines = readFileSync(AUDIT_LOG_PATH, 'utf8').trim().split('\n').filter(Boolean);
    if (lines.length > 0) {
      const last = lines[lines.length - 1];
      try {
        const parsed = JSON.parse(last) as { hash?: string };
        if (parsed.hash) lastHash = parsed.hash;
      } catch {
        // Malformed last line — chain broken at that point, continue from genesis
      }
    }
  }
  initialized = true;
}

/**
 * Append a tamper-evident entry to the audit log.
 * Only writes entries with action 'interrupt' (blocked calls) by default.
 * Set CERBERUS_AUDIT_ALL=true to log all calls.
 */
export function appendAuditEntry(entry: AuditEntry): void {
  const logAll = process.env['CERBERUS_AUDIT_ALL'] === 'true';
  if (!logAll && entry.action !== 'interrupt') return;

  try {
    ensureLogDir();

    const content = JSON.stringify({
      timestamp: entry.timestamp,
      turnId: entry.turnId,
      toolName: entry.toolName,
      score: entry.score,
      action: entry.action,
      signals: entry.signals,
      blocked: entry.blocked,
    });

    const hash = createHash('sha256')
      .update(lastHash + content)
      .digest('hex');

    const record: AuditRecord = {
      ...entry,
      prevHash: lastHash,
      hash,
    };

    appendFileSync(AUDIT_LOG_PATH, JSON.stringify(record) + '\n', 'utf8');
    lastHash = hash;
  } catch {
    // Audit log write failure is non-fatal — gateway continues operating
    // eslint-disable-next-line no-console
    console.warn('[Cerberus] Audit log write failed — check permissions on', AUDIT_LOG_PATH);
  }
}

/**
 * Verify audit log chain integrity.
 * Returns { valid: true } if chain is intact, or { valid: false, brokenAtLine } if tampered.
 * Exported for use in health checks and CLI tools.
 */
export function verifyAuditChain(): { valid: boolean; brokenAtLine?: number } {
  if (!existsSync(AUDIT_LOG_PATH)) return { valid: true };

  const lines = readFileSync(AUDIT_LOG_PATH, 'utf8').trim().split('\n').filter(Boolean);
  let prev = '0000000000000000000000000000000000000000000000000000000000000000';

  for (let i = 0; i < lines.length; i++) {
    try {
      const record = JSON.parse(lines[i]) as AuditRecord;
      const { prevHash, hash, ...entry } = record;
      if (prevHash !== prev) return { valid: false, brokenAtLine: i + 1 };
      const expected = createHash('sha256')
        .update(prevHash + JSON.stringify(entry))
        .digest('hex');
      if (hash !== expected) return { valid: false, brokenAtLine: i + 1 };
      prev = hash;
    } catch {
      return { valid: false, brokenAtLine: i + 1 };
    }
  }

  return { valid: true };
}
