/**
 * Cerberus Enterprise Gateway — main entry point.
 *
 * Reads cerberus.config.yml, validates it, checks the enterprise license,
 * then starts the Cerberus proxy server with full security hardening:
 *
 *   - Rate limiting (100 req/min per IP)
 *   - Request size limit (1 MB)
 *   - Security response headers (HSTS, CSP, X-Content-Type-Options, etc.)
 *   - Connection timeout (30s — prevents slow-loris attacks)
 *   - Input validation (unknown tool names → 404)
 *   - Optional API key authentication (X-Cerberus-Api-Key header)
 *   - Tamper-evident append-only audit log
 *   - Background license re-validation every 24h
 *
 * Environment variables:
 *   CERBERUS_CONFIG       Path to cerberus.config.yml (default: /app/cerberus.config.yml)
 *   CERBERUS_LICENSE_KEY  Enterprise license key (required)
 *   OTEL_ENDPOINT         OTel collector endpoint (default: http://otel-collector:4318)
 */

import * as http from 'node:http';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { createProxy } from '../../src/proxy/server.js';
import { EnterpriseConfigSchema } from './config-schema.js';
import { validateLicense, scheduleLicenseRenewalCheck, isDegraded } from './license-client.js';
import { appendAuditEntry } from './audit-log.js';

// ── Load + validate config ─────────────────────────────────────────────────

const CONFIG_PATH = process.env['CERBERUS_CONFIG'] ?? '/app/cerberus.config.yml';

let raw: unknown;
try {
  raw = parse(readFileSync(CONFIG_PATH, 'utf8'));
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[Cerberus] Failed to read cerberus.config.yml at ${CONFIG_PATH}:\n  ${msg}`);
  process.exit(1);
}

const result = EnterpriseConfigSchema.safeParse(raw);
if (!result.success) {
  console.error(
    '[Cerberus] cerberus.config.yml is invalid:\n',
    JSON.stringify(result.error.format(), null, 2),
  );
  process.exit(1);
}
const cfg = result.data;

// ── License validation ─────────────────────────────────────────────────────

const licenseKey = process.env['CERBERUS_LICENSE_KEY'];
await validateLicense(licenseKey);
if (licenseKey) scheduleLicenseRenewalCheck(licenseKey);

// ── Rate limiter ───────────────────────────────────────────────────────────
// Defense-in-depth: nginx also enforces rate limits at the network layer.

interface RateBucket {
  count: number;
  resetAt: number;
}
const rateLimiter = new Map<string, RateBucket>();
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  let bucket = rateLimiter.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateLimiter.set(ip, bucket);
  }
  bucket.count++;
  return bucket.count > RATE_LIMIT;
}

// Clean up rate limiter buckets periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of rateLimiter.entries()) {
    if (now >= bucket.resetAt) rateLimiter.delete(ip);
  }
}, 60_000).unref();

// ── Build proxy ────────────────────────────────────────────────────────────

const tools = Object.fromEntries(
  Object.entries(cfg.tools).map(([name, t]) => [
    name,
    {
      ...(t.target !== undefined ? { target: t.target } : {}),
      ...(t.trustLevel !== undefined ? { trustLevel: t.trustLevel } : {}),
      ...(t.outbound !== undefined ? { outbound: t.outbound } : {}),
    },
  ]),
);

// API key auth — from config or env var
const apiKey = cfg.gateway?.apiKey ?? process.env['CERBERUS_API_KEY'];

// Combined auth middleware: degraded mode check + rate limiting + optional API key
function gatewayAuthMiddleware(req: http.IncomingMessage): boolean {
  // Reject when license has become invalid mid-operation
  if (isDegraded()) return false;

  // Rate limit per source IP
  const ip = req.socket.remoteAddress ?? 'unknown';
  if (isRateLimited(ip)) return false;

  // Optional API key check
  if (apiKey && req.headers['x-cerberus-api-key'] !== apiKey) return false;

  return true;
}

const proxy = createProxy({
  port: cfg.gateway?.port ?? 4000,
  sessionTtlMs: (cfg.gateway?.sessionTtlMinutes ?? 30) * 60_000,
  cerberus: {
    alertMode: cfg.cerberus.alertMode ?? 'interrupt',
    ...(cfg.cerberus.threshold !== undefined ? { threshold: cfg.cerberus.threshold } : {}),
    ...(cfg.cerberus.memoryTracking !== undefined
      ? { memoryTracking: cfg.cerberus.memoryTracking }
      : {}),
    ...(cfg.cerberus.authorizedDestinations !== undefined
      ? { authorizedDestinations: cfg.cerberus.authorizedDestinations }
      : {}),
    opentelemetry: true,
    onAssessment: (assessment) => {
      // Write to tamper-evident audit log
      appendAuditEntry({
        timestamp: new Date().toISOString(),
        turnId: assessment.turnId,
        toolName: assessment.toolName,
        score: assessment.score,
        action: assessment.action,
        signals: assessment.signals,
        blocked: assessment.action === 'interrupt',
      });
    },
  },
  tools,
  authMiddleware: gatewayAuthMiddleware,
});

// ── Start ──────────────────────────────────────────────────────────────────

await proxy.listen();

const port = cfg.gateway?.port ?? 4000;
console.log(`[Cerberus Enterprise] Gateway listening on :${port}`);
console.log(`[Cerberus Enterprise] ${Object.keys(tools).length} tool(s) configured`);
if (apiKey) console.log('[Cerberus Enterprise] API key authentication enabled');

// Graceful shutdown
process.on('SIGTERM', () => {
  // eslint-disable-next-line no-console
  console.log('[Cerberus Enterprise] Shutting down...');
  void proxy.close().then(() => process.exit(0));
});

process.on('SIGINT', () => {
  void proxy.close().then(() => process.exit(0));
});
