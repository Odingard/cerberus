/**
 * Cerberus Enterprise License Server
 *
 * Endpoints:
 *   POST /v1/license/validate    — validate a license key
 *   POST /v1/webhooks/stripe     — Stripe invoice.payment_succeeded webhook
 *   GET  /health                 — health check
 *
 * Environment variables:
 *   LICENSE_DB_PATH         Path to SQLite DB (default: /app/data/licenses.db)
 *   LICENSE_SIGNING_SECRET  Secret for HMAC key derivation
 *   STRIPE_SECRET_KEY       Stripe API key
 *   STRIPE_WEBHOOK_SECRET   Stripe webhook signing secret
 *   RESEND_API_KEY          Resend API key for email delivery
 *   PORT                    Listen port (default: 8080)
 */

import * as http from 'node:http';
import Stripe from 'stripe';
import { findLicense, insertLicense, generateKey } from './db.js';
import { sendLicenseEmail } from './mailer.js';

const PORT = parseInt(process.env['PORT'] ?? '8080', 10);

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'] ?? '', {
  apiVersion: '2023-10-16',
});

const WEBHOOK_SECRET = process.env['STRIPE_WEBHOOK_SECRET'] ?? '';

// ── Request helpers ───────────────────────────────────────────────────────

async function readBody(req: http.IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

function json(res: http.ServerResponse, status: number, body: unknown): void {
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(status).end(JSON.stringify(body));
}

// ── Route handlers ────────────────────────────────────────────────────────

function handleHealth(res: http.ServerResponse): void {
  json(res, 200, { status: 'ok' });
}

async function handleValidate(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const body = await readBody(req);
  let parsed: { licenseKey?: unknown };
  try {
    parsed = JSON.parse(body.toString()) as { licenseKey?: unknown };
  } catch {
    json(res, 400, { error: 'Invalid JSON' });
    return;
  }

  const key = parsed.licenseKey;
  if (typeof key !== 'string' || !/^cbr_ent_[0-9a-f]{32}$/.test(key)) {
    json(res, 200, { valid: false, reason: 'Invalid key format' });
    return;
  }

  const row = findLicense(key);
  if (!row) {
    json(res, 200, { valid: false, reason: 'Key not found' });
    return;
  }

  if (row.revoked) {
    json(res, 200, { valid: false, reason: 'Key has been revoked' });
    return;
  }

  // Check expiry
  let warningDaysLeft: number | undefined;
  if (row.expires_at) {
    const expiresAt = new Date(row.expires_at);
    const now = new Date();
    if (expiresAt < now) {
      json(res, 200, { valid: false, reason: 'License has expired' });
      return;
    }
    const daysLeft = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) warningDaysLeft = daysLeft;
  }

  json(res, 200, {
    valid: true,
    plan: row.plan,
    ...(row.expires_at ? { expiresAt: row.expires_at } : {}),
    ...(warningDaysLeft !== undefined ? { warningDaysLeft } : {}),
  });
}

async function handleStripeWebhook(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const body = await readBody(req);
  const sig = req.headers['stripe-signature'];

  if (typeof sig !== 'string') {
    json(res, 400, { error: 'Missing stripe-signature header' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    json(res, 400, { error: `Webhook signature invalid: ${msg}` });
    return;
  }

  if (event.type !== 'invoice.payment_succeeded') {
    json(res, 200, { received: true, ignored: true });
    return;
  }

  const invoice = event.data.object as Stripe.Invoice;
  const customerEmail = invoice.customer_email;

  if (!customerEmail) {
    console.error('[License] invoice.payment_succeeded missing customer_email', invoice.id);
    json(res, 200, { received: true, error: 'No customer email on invoice' });
    return;
  }

  // Generate license key — annual license, expires 365 days from now
  const key = generateKey();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? null;

  insertLicense({
    key,
    plan: 'enterprise',
    stripeSessionId: invoice.id,
    customerEmail,
    expiresAt,
  });

  try {
    const version = process.env['CERBERUS_VERSION'] ?? '1.0.0';
    await sendLicenseEmail({
      to: customerEmail,
      licenseKey: key,
      plan: 'enterprise',
      expiresAt,
      version,
    });
    console.log(`[License] Key issued and emailed to ${customerEmail}`);
  } catch (err) {
    console.error(`[License] Email delivery failed for ${customerEmail}:`, err);
    // Key is still in DB — support can resend manually
  }

  json(res, 200, { received: true });
}

// ── Server ────────────────────────────────────────────────────────────────

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse): void => {
  void handleRequest(req, res);
});

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET' && req.url === '/health') {
    handleHealth(res);
    return;
  }

  if (req.method === 'POST' && req.url === '/v1/license/validate') {
    await handleValidate(req, res);
    return;
  }

  if (req.method === 'POST' && req.url === '/v1/webhooks/stripe') {
    await handleStripeWebhook(req, res);
    return;
  }

  json(res, 404, { error: 'Not found' });
}

server.listen(PORT, () => {
  console.log(`[License Server] Listening on :${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
