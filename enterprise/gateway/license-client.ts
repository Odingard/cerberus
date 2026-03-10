/**
 * License validation client for Cerberus Enterprise Gateway.
 *
 * Validates the CERBERUS_LICENSE_KEY against the Cerberus license API on
 * startup. Hard-fails (process.exit) if the key is absent or invalid.
 * Falls back to grace mode if the license server is unreachable (network
 * outage, maintenance) to avoid outages for legitimate customers.
 *
 * Also schedules a background re-check every 24h. If the license becomes
 * invalid mid-operation (revoked, expired), the gateway enters degraded
 * mode and returns 503 on tool calls rather than hard-stopping.
 */

import { createHmac } from 'node:crypto';

const LICENSE_API =
  process.env['LICENSE_API_URL'] ??
  'https://api.cerberus.sixsenseenterprise.com/v1/license/validate';

const KEY_PATTERN = /^cbr_ent_[0-9a-f]{32}$/;

let degraded = false;

interface ValidateResponse {
  valid: boolean;
  plan?: string;
  expiresAt?: string;
  warningDaysLeft?: number;
}

/** Validate the license key against the license API. */
export async function validateLicense(key: string | undefined): Promise<void> {
  if (!key) {
    console.error(
      '[Cerberus] CERBERUS_LICENSE_KEY is not set.\n' +
        '           Contact enterprise@sixsenseenterprise.com to obtain a license.',
    );
    process.exit(1);
  }

  if (!KEY_PATTERN.test(key)) {
    console.error(
      '[Cerberus] CERBERUS_LICENSE_KEY format is invalid.\n' +
        '           Expected: cbr_ent_<32 hex chars>',
    );
    process.exit(1);
  }

  try {
    const res = await fetch(LICENSE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: key }),
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) {
      console.error(`[Cerberus] License server returned HTTP ${res.status}.`);
      process.exit(1);
    }

    const data = (await res.json()) as ValidateResponse;

    if (!data.valid) {
      console.error(
        '[Cerberus] License key is invalid or has been revoked.\n' +
          '           Contact enterprise@sixsenseenterprise.com for assistance.',
      );
      process.exit(1);
    }

    degraded = false;

    if (data.warningDaysLeft !== undefined && data.warningDaysLeft <= 30) {
      console.warn(
        `[Cerberus] License expires in ${data.warningDaysLeft} day(s). ` +
          'Contact enterprise@sixsenseenterprise.com to renew.',
      );
    }

    console.log(
      `[Cerberus] License valid — plan: ${data.plan ?? 'enterprise'}` +
        (data.expiresAt ? `, expires: ${data.expiresAt}` : ''),
    );
  } catch {
    // Network error — grace mode. Do not block legitimate customers on network issues.
    console.warn(
      '[Cerberus] License server unreachable — running in grace mode.\n' +
        '           License will be re-validated when connectivity is restored.',
    );
  }
}

/** Returns true if the gateway is in degraded (license invalid) mode. */
export function isDegraded(): boolean {
  return degraded;
}

/**
 * Schedule background re-validation every 24h.
 * If license becomes invalid, sets degraded=true so tool calls return 503.
 */
export function scheduleLicenseRenewalCheck(key: string): void {
  const intervalMs = 24 * 60 * 60 * 1_000;

  const checkLicense = (): void => {
    void (async () => {
      try {
        const res = await fetch(LICENSE_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ licenseKey: key }),
          signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) return;
        const data = (await res.json()) as ValidateResponse;
        if (!data.valid) {
          degraded = true;
          console.error('[Cerberus] License has become invalid. Gateway entering degraded mode.');
        } else {
          degraded = false;
          if (data.warningDaysLeft !== undefined && data.warningDaysLeft <= 30) {
            console.warn(
              `[Cerberus] License expires in ${data.warningDaysLeft} day(s). Renew soon.`,
            );
          }
        }
      } catch {
        // Network error — stay in current state
      }
    })();
  };

  const timer = setInterval(checkLicense, intervalMs);

  // Don't keep process alive if server is closed
  timer.unref();
}

/**
 * Derive an HMAC fingerprint for a license key payload.
 * Used by the license server to generate tamper-evident keys.
 * Exported for use in tests and the license server.
 */
export function deriveKeyHmac(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}
