# Cerberus Enterprise — Compliance Statement

**Effective Date:** March 10, 2026
**Version:** 1.0

This document describes the compliance posture of Cerberus Enterprise and Six Sense Enterprise Services LLC ("Provider").

---

## 1. ARCHITECTURE OVERVIEW — COMPLIANCE BY DESIGN

Cerberus Enterprise is **self-hosted**. The software runs entirely within the customer's infrastructure:

- All AI tool call data stays in the customer's environment
- Detection processing (L1-L4 layers, 7 sub-classifiers) runs locally
- Audit logs are stored locally in the customer's filesystem
- Grafana metrics and dashboards run locally
- **No customer data is transmitted to Provider's servers**

The only external communication is license key validation (a single HTTPS POST containing the license key string — no customer data, no PII, no tool call content).

This architecture is intentionally designed to minimize compliance burden: **the customer's data never leaves their control.**

---

## 2. SOC 2

### Current Status

Provider is **pre-SOC 2**. We have not yet completed a SOC 2 Type II audit.

### Controls Already Implemented

| SOC 2 Trust Principle | Controls in Place |
|----------------------|-------------------|
| **Security** | TLS encryption in transit, AES-256 at rest, non-root Docker containers, read-only filesystem, no-new-privileges, cap_drop:ALL, rate limiting, API key authentication |
| **Availability** | Grace mode (gateway operates during license server downtime), Docker health checks, automatic restarts, 99.9% uptime SLA |
| **Processing Integrity** | Tamper-evident chained-hash audit log, SHA-256 chain verification, cosign-signed container images, SBOM generation |
| **Confidentiality** | License keys encrypted at rest, minimal data collection, no customer data transmission, confidentiality agreements with all personnel |
| **Privacy** | Self-hosted architecture (zero customer data collection), Privacy Policy, Data Processing Agreement |

### Roadmap

| Milestone | Target Date |
|-----------|-------------|
| Formal security policies documentation | Q2 2026 |
| Independent penetration test | Q2 2026 |
| SOC 2 Type I readiness assessment | Q3 2026 |
| SOC 2 Type II audit engagement | Q4 2026 |
| SOC 2 Type II report available | Q1 2027 |

Customers requiring SOC 2 compliance before our audit completes may request our current security controls documentation and penetration test results.

---

## 3. GDPR (EU/EEA)

### Applicability

Cerberus Enterprise processes **minimal personal data** on Provider's servers:
- License key (pseudonymous identifier)
- Customer contact email (for license delivery and support)
- Payment information (processed by Stripe as sub-processor)

### Compliance Measures

| Requirement | How We Comply |
|-------------|---------------|
| **Lawful basis** | Contract performance (Art. 6(1)(b)) and legitimate interest (Art. 6(1)(f)) |
| **Data minimization** | Only license key and contact email; no customer operational data |
| **Purpose limitation** | License validation and support only |
| **Data subject rights** | Privacy Policy documents process; requests via privacy@sixsenseenterprise.com |
| **Data Processing Agreement** | Available in `legal/DPA.md`; includes SCCs for international transfers |
| **Sub-processor management** | Listed in DPA; 30-day notice before changes |
| **Breach notification** | 72-hour notification commitment in DPA |
| **Privacy by design** | Self-hosted architecture eliminates customer data exposure |

### Customer's GDPR Obligations

Because the software runs in the customer's infrastructure, the customer is the Data Controller for all data processed by Cerberus (AI tool calls, detection signals, audit logs). Customer is responsible for:
- Conducting Data Protection Impact Assessments (DPIAs) if required
- Maintaining records of processing activities
- Implementing appropriate security measures in their environment
- Responding to data subject requests related to their operational data

---

## 4. CCPA (California)

### Provider's Role

Provider is a **Service Provider** under the CCPA. We:
- Do NOT sell personal information
- Do NOT share personal information for cross-context behavioral advertising
- Process personal information only for the business purposes specified in the DPA
- Certify understanding of and compliance with CCPA obligations

### Customer's CCPA Obligations

Customers subject to the CCPA are responsible for CCPA compliance for data processed within their Cerberus deployment.

---

## 5. HIPAA

### Provider's Position

Provider **does not create, receive, maintain, or transmit Protected Health Information (PHI)**.

Cerberus Enterprise runs within the customer's infrastructure. Provider has no access to:
- Patient records
- Health information
- Any data flowing through the Cerberus gateway

### For Healthcare Customers

If you deploy Cerberus in a HIPAA-regulated environment:

1. **Cerberus processes data locally** — PHI never leaves your infrastructure via Cerberus
2. **Audit log** — The tamper-evident audit log supports HIPAA audit trail requirements (45 CFR § 164.312(b))
3. **Access controls** — API key authentication and Docker security hardening support access control requirements (45 CFR § 164.312(a))
4. **Encryption** — TLS in transit + encrypted Docker volumes at rest support encryption requirements (45 CFR § 164.312(a)(2)(iv) and § 164.312(e)(1))

If a Business Associate Agreement (BAA) is required for ancillary services (e.g., support involving log review), contact legal@sixsenseenterprise.com to negotiate.

---

## 6. PCI DSS

### Applicability

Cerberus Enterprise does **not** process, store, or transmit payment card data. PCI DSS is not directly applicable to the software.

If your AI agents handle payment card data and route calls through the Cerberus gateway, the gateway inspects tool call arguments for detection purposes. In this scenario:
- Data remains within your PCI environment (self-hosted)
- Cerberus does not persist card data (it is processed in-memory only)
- The audit log records detection signals, not tool call content
- Consult your QSA regarding inclusion of Cerberus in your CDE scope

---

## 7. ISO 27001

Provider is **not currently ISO 27001 certified**. We are evaluating certification as part of our security maturity roadmap (target: 2027).

Current alignment with ISO 27001 Annex A controls:

| Control Area | Status |
|-------------|--------|
| A.5 Information security policies | Documented |
| A.6 Organization of information security | In progress |
| A.8 Asset management | Implemented (SBOM, dependency tracking) |
| A.9 Access control | Implemented (API keys, non-root containers) |
| A.10 Cryptography | Implemented (TLS, SHA-256 audit chain, AES-256) |
| A.12 Operations security | Implemented (monitoring, logging, change management) |
| A.14 System acquisition | Implemented (CI/CD with security checks, signed images) |
| A.16 Incident management | Documented (SLA, escalation matrix) |
| A.18 Compliance | This document |

---

## 8. SUPPLY CHAIN SECURITY

| Measure | Implementation |
|---------|---------------|
| **Container image signing** | All Docker images signed with cosign (Sigstore OIDC) |
| **SBOM** | Software Bill of Materials generated for every release (SPDX format) |
| **npm provenance** | Published with `--provenance` flag (npm verifiable) |
| **Dependency scanning** | `npm audit` in CI pipeline |
| **Minimal base image** | `node:20-alpine` (reduced attack surface) |
| **Pinned dependencies** | `package-lock.json` committed; `npm ci` in builds |
| **Pre-commit hooks** | Husky hooks enforce typecheck + lint + test before commit |

---

## 9. PENETRATION TESTING

### Current Status

Internal security validation completed (N=285 test runs across 3 AI providers). No external penetration test has been conducted yet.

### Roadmap

| Activity | Target |
|----------|--------|
| Internal security review | Complete |
| Automated DAST scanning | Q2 2026 |
| Independent penetration test | Q2 2026 |
| Annual penetration testing program | Q3 2026 onward |

Penetration test results will be shared with enterprise customers under NDA upon request.

---

## 10. REQUESTING COMPLIANCE DOCUMENTATION

Enterprise customers may request:

- Current security controls documentation
- Sub-processor list with DPA status
- Penetration test results (when available, under NDA)
- SOC 2 report (when available)
- Custom security questionnaire responses

Contact: **legal@sixsenseenterprise.com**

---

**Six Sense Enterprise Services LLC**
Copyright 2017-2026. All rights reserved.
