# Cerberus — Privacy Policy

**Effective Date:** March 10, 2026
**Last Updated:** March 10, 2026

Six Sense Enterprise Services LLC ("we", "us", "Provider") is committed to protecting the privacy of our customers and users. This Privacy Policy explains what data we collect, how we use it, and your rights.

---

## 1. WHO WE ARE

**Six Sense Enterprise Services LLC**
Email: privacy@sixsenseenterprise.com

We provide Cerberus, an agentic AI runtime security platform, as both an open-source library and a self-hosted enterprise product.

---

## 2. DATA WE COLLECT

### 2.1 Open Source (`@cerberus-ai/core`)

The open-source library runs entirely in your environment. **We collect zero data.** No telemetry, no analytics, no phone-home. The library has no network calls to our servers.

### 2.2 Cerberus Enterprise (Self-Hosted)

The enterprise product runs in your infrastructure. The only data transmitted to our servers is:

| Data | Purpose | Destination |
|------|---------|-------------|
| License Key | Validate active license | api.cerberus.sixsenseenterprise.com |
| Instance heartbeat | Confirm active deployment (boolean) | api.cerberus.sixsenseenterprise.com |

**We do NOT collect:**
- Your AI agent's tool calls or responses
- Detection results, risk scores, or signals
- Audit log contents
- Grafana metrics or dashboard data
- Any data processed by your AI systems
- IP addresses of your end users
- Any personally identifiable information (PII) from your systems

### 2.3 Website and Sales

When you visit our website or contact sales, we may collect:

| Data | Purpose | Legal Basis |
|------|---------|-------------|
| Name and email | Sales inquiries, license delivery | Legitimate interest / contract |
| Company name | Account management | Legitimate interest |
| Payment information | Process purchases (via Stripe) | Contract performance |
| Website analytics | Improve our website | Consent (cookie banner) |

---

## 3. HOW WE USE YOUR DATA

We use collected data solely to:

- **Deliver the product:** License validation, software updates, package delivery
- **Provide support:** Respond to technical support requests
- **Process payments:** Invoice generation and payment processing (via Stripe)
- **Improve our products:** Aggregate, anonymized usage patterns (e.g., "X% of customers use alertMode: interrupt")
- **Legal compliance:** Respond to lawful requests from authorities

We do NOT:
- Sell your data to third parties
- Use your data for advertising
- Share data with data brokers
- Train AI models on your data

---

## 4. DATA PROCESSORS

We use the following third-party processors:

| Processor | Purpose | Data Shared |
|-----------|---------|-------------|
| **Stripe** | Payment processing | Name, email, payment method |
| **Resend** | Transactional email (license delivery) | Email address |
| **GitHub** | Source code hosting, container registry | Public repo data only |
| **DigitalOcean** | License server hosting | License keys (encrypted at rest) |

All processors are bound by data processing agreements and comply with applicable data protection laws.

---

## 5. DATA RETENTION

| Data | Retention Period |
|------|-----------------|
| License keys | Duration of license + 1 year |
| Payment records | 7 years (legal requirement) |
| Support correspondence | 3 years after last contact |
| Website analytics | 26 months |
| Sales inquiries | 2 years after last contact |

Customer data processed by the Cerberus software within your infrastructure is entirely under your control and subject to your own retention policies.

---

## 6. YOUR RIGHTS

Depending on your jurisdiction, you may have the right to:

- **Access:** Request a copy of your personal data
- **Rectification:** Correct inaccurate personal data
- **Deletion:** Request deletion of your personal data
- **Portability:** Receive your data in a portable format
- **Object:** Object to processing based on legitimate interest
- **Restrict:** Restrict processing in certain circumstances
- **Withdraw consent:** Where processing is based on consent

To exercise any right, email: **privacy@sixsenseenterprise.com**

We respond to requests within thirty (30) days.

---

## 7. INTERNATIONAL TRANSFERS

Our servers are located in the United States. If you are located outside the US, your data is transferred to the US for processing. We rely on:

- Standard Contractual Clauses (SCCs) for EU/EEA transfers
- Adequacy decisions where applicable
- Your explicit consent where required

---

## 8. SECURITY

We implement appropriate technical and organizational measures to protect your data:

- TLS 1.2+ encryption in transit
- AES-256 encryption at rest for license database
- Access controls and audit logging on our infrastructure
- Regular security reviews of our license server
- Non-root Docker containers with read-only filesystems

---

## 9. CHILDREN

Our products are not directed at individuals under 18. We do not knowingly collect data from children.

---

## 10. CHANGES

We may update this Privacy Policy from time to time. Material changes will be communicated via email to active customers at least thirty (30) days before taking effect.

---

## 11. CONTACT

**Six Sense Enterprise Services LLC**
Email: privacy@sixsenseenterprise.com

For EU/EEA inquiries, you may also contact your local data protection authority.

---

*Last updated: March 10, 2026*
