/**
 * Email delivery via Resend API.
 *
 * Sends the license key to the customer after successful payment.
 * Requires RESEND_API_KEY env var.
 */

const RESEND_API_KEY = process.env['RESEND_API_KEY'] ?? '';
const FROM_EMAIL = 'noreply@cerberus.sixsenseenterprise.com';

export async function sendLicenseEmail(opts: {
  to: string;
  licenseKey: string;
  plan: string;
  expiresAt: string | null;
}): Promise<void> {
  const expiryLine = opts.expiresAt ? `Expires: ${opts.expiresAt}` : 'License: Annual (contact us to renew)';

  const html = `
<h2>Your Cerberus Enterprise License</h2>
<p>Thank you for purchasing Cerberus Enterprise. Your license key is below.</p>

<table>
  <tr><td><strong>License Key</strong></td><td><code>${opts.licenseKey}</code></td></tr>
  <tr><td><strong>Plan</strong></td><td>${opts.plan}</td></tr>
  <tr><td><strong>${expiryLine.split(':')[0]}</strong></td><td>${expiryLine.split(':').slice(1).join(':').trim()}</td></tr>
</table>

<h3>Getting started</h3>
<ol>
  <li>Clone or download the Cerberus Enterprise package</li>
  <li>Set in <code>enterprise/.env</code>:<br>
      <code>CERBERUS_LICENSE_KEY=${opts.licenseKey}</code></li>
  <li>Run: <code>./enterprise/setup.sh</code></li>
</ol>

<p>
  Documentation: <a href="https://github.com/Odingard/cerberus/blob/main/docs/enterprise-deployment.md">enterprise-deployment.md</a><br>
  Support: <a href="mailto:enterprise@sixsenseenterprise.com">enterprise@sixsenseenterprise.com</a>
</p>
`;

  const text = `
Your Cerberus Enterprise License Key
=====================================

License Key: ${opts.licenseKey}
Plan:        ${opts.plan}
${expiryLine}

Getting started:
1. Set in enterprise/.env:
   CERBERUS_LICENSE_KEY=${opts.licenseKey}

2. Run: ./enterprise/setup.sh

Documentation: docs/enterprise-deployment.md
Support: enterprise@sixsenseenterprise.com
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
