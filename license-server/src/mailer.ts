/**
 * Email delivery via Resend API.
 *
 * Sends the license key to the customer after successful payment.
 * Requires RESEND_API_KEY env var.
 */

const RESEND_API_KEY = process.env['RESEND_API_KEY'] ?? '';
const FROM_EMAIL = 'noreply@cerberus.sixsenseenterprise.com';

const DOWNLOAD_BASE = process.env['DOWNLOAD_BASE'] ?? process.env['DOWNLOAD_BASE_URL'] ?? 'https://releases.cerberus.sixsenseenterprise.com';

export async function sendLicenseEmail(opts: {
  to: string;
  licenseKey: string;
  plan: string;
  expiresAt: string | null;
  version: string;
}): Promise<void> {
  const expiryLine = opts.expiresAt ? `Expires: ${opts.expiresAt}` : 'License: Annual (contact us to renew)';
  const downloadUrl = `${DOWNLOAD_BASE}/cerberus-enterprise-${opts.version}.tar.gz`;
  const checksumUrl = `${downloadUrl}.sha256`;

  const html = `
<h2>Welcome to Cerberus Enterprise</h2>
<p>Thank you for purchasing Cerberus Enterprise. Your license key and download link are below.</p>

<table style="border-collapse:collapse;margin:1.5rem 0">
  <tr><td style="padding:8px 16px;border:1px solid #ddd"><strong>License Key</strong></td><td style="padding:8px 16px;border:1px solid #ddd"><code style="background:#f5f5f5;padding:2px 6px;border-radius:3px">${opts.licenseKey}</code></td></tr>
  <tr><td style="padding:8px 16px;border:1px solid #ddd"><strong>Plan</strong></td><td style="padding:8px 16px;border:1px solid #ddd">${opts.plan}</td></tr>
  <tr><td style="padding:8px 16px;border:1px solid #ddd"><strong>${expiryLine.split(':')[0]}</strong></td><td style="padding:8px 16px;border:1px solid #ddd">${expiryLine.split(':').slice(1).join(':').trim()}</td></tr>
</table>

<h3>Download</h3>
<p>
  <a href="${downloadUrl}" style="display:inline-block;padding:12px 24px;background:#1a73e8;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">
    Download Cerberus Enterprise v${opts.version}
  </a>
</p>
<p style="font-size:0.85em;color:#666">
  <a href="${checksumUrl}">SHA-256 checksum</a> &middot; Verify: <code>sha256sum -c cerberus-enterprise-${opts.version}.tar.gz.sha256</code>
</p>

<h3>Setup (3 steps)</h3>
<ol>
  <li>Extract: <code>tar xzf cerberus-enterprise-${opts.version}.tar.gz</code></li>
  <li>Configure: <code>cd cerberus-enterprise-${opts.version} && cp .env.example .env</code><br>
      Set <code>CERBERUS_LICENSE_KEY=${opts.licenseKey}</code> in <code>.env</code></li>
  <li>Start: <code>./setup.sh</code></li>
</ol>

<p>The setup script validates your license, starts the 5-container Docker stack, and verifies health. Gateway runs on <strong>:4000</strong>, Grafana dashboard on <strong>:3000</strong>.</p>

<h3>Included</h3>
<ul>
  <li>Cerberus Gateway — runtime detection proxy (L1-L4 + 7 sub-classifiers)</li>
  <li>Grafana dashboard — 16 security panels, pre-configured</li>
  <li>Prometheus + Alertmanager — metrics + alert routing (Slack, PagerDuty, email)</li>
  <li>OpenTelemetry Collector — spans + metrics pipeline</li>
  <li>Tamper-evident audit log — SHA-256 chained, SIEM-ready</li>
</ul>

<h3>Documentation</h3>
<p>
  <a href="https://cerberus.sixsenseenterprise.com/enterprise-deployment.md">Deployment Guide</a> &middot;
  <a href="https://cerberus.sixsenseenterprise.com/enterprise-configuration.md">Configuration Reference</a> &middot;
  <a href="https://cerberus.sixsenseenterprise.com/troubleshooting.md">Troubleshooting</a>
</p>

<h3>Support</h3>
<p>
  Priority email: <a href="mailto:enterprise@sixsenseenterprise.com">enterprise@sixsenseenterprise.com</a><br>
  Response SLA: 4 hours (critical) / 24 hours (standard)<br>
  See <code>legal/SLA.md</code> in your package for full terms.
</p>

<p style="font-size:0.8em;color:#999;margin-top:2rem;border-top:1px solid #eee;padding-top:1rem">
  Cerberus Enterprise is licensed under the terms in <code>legal/EULA.md</code> included in your download.<br>
  &copy; ${new Date().getFullYear()} Six Sense Enterprise Services LLC. All rights reserved.
</p>
`;

  const text = `Welcome to Cerberus Enterprise
===============================

License Key: ${opts.licenseKey}
Plan:        ${opts.plan}
${expiryLine}

DOWNLOAD
--------
${downloadUrl}
Checksum: ${checksumUrl}

SETUP (3 steps)
---------------
1. Extract:    tar xzf cerberus-enterprise-${opts.version}.tar.gz
2. Configure:  cd cerberus-enterprise-${opts.version} && cp .env.example .env
               Set CERBERUS_LICENSE_KEY=${opts.licenseKey} in .env
3. Start:      ./setup.sh

The setup script validates your license, starts the 5-container Docker stack,
and verifies health. Gateway on :4000, Grafana on :3000.

INCLUDED
--------
- Cerberus Gateway (L1-L4 + 7 sub-classifiers)
- Grafana dashboard (16 security panels)
- Prometheus + Alertmanager
- OpenTelemetry Collector
- Tamper-evident audit log (SHA-256 chained)

DOCUMENTATION
-------------
- Deployment Guide:       docs/deployment.md
- Configuration Reference: docs/configuration.md
- Troubleshooting:        docs/troubleshooting.md

SUPPORT
-------
Priority email: enterprise@sixsenseenterprise.com
Response SLA:   4 hours (critical) / 24 hours (standard)
Full terms:     legal/SLA.md in your package

(c) ${new Date().getFullYear()} Six Sense Enterprise Services LLC. All rights reserved.
Licensed under the terms in legal/EULA.md.
`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [opts.to],
      subject: 'Your Cerberus Enterprise License Key',
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error ${response.status}: ${body}`);
  }
}
