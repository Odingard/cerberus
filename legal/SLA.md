# Cerberus Enterprise — Service Level Agreement (SLA)

**Effective Date:** March 10, 2026
**Version:** 1.0

This Service Level Agreement ("SLA") is part of the Master Services Agreement between **Six Sense Enterprise Services LLC** ("Provider") and Customer.

---

## 1. SCOPE

This SLA covers:
- Technical support for Cerberus Enterprise software
- License validation server availability
- Incident response and escalation

This SLA does **not** cover:
- The open-source `@cerberus-ai/core` library (community support via GitHub Issues)
- Customer's own infrastructure (Docker hosts, networks, DNS)
- Third-party integrations not provided by Provider
- Issues caused by Customer modifications to the Software

---

## 2. SUPPORT TIERS

### Standard Support (included with all licenses)

| Attribute | Commitment |
|-----------|------------|
| **Channel** | Email: enterprise@sixsenseenterprise.com |
| **Hours** | Monday–Friday, 9 AM – 6 PM ET (excluding US holidays) |
| **Response time — Critical** | 4 business hours |
| **Response time — High** | 8 business hours |
| **Response time — Normal** | 1 business day |
| **Response time — Low** | 2 business days |
| **Named contacts** | Up to 3 per organization |

### Premium Support (add-on, contact sales)

| Attribute | Commitment |
|-----------|------------|
| **Channel** | Email + dedicated Slack channel |
| **Hours** | 24/7 for Critical; business hours for all others |
| **Response time — Critical** | 1 hour |
| **Response time — High** | 4 hours |
| **Response time — Normal** | 8 business hours |
| **Response time — Low** | 1 business day |
| **Named contacts** | Up to 10 per organization |
| **Dedicated account manager** | Yes |
| **Quarterly security review** | Yes |

---

## 3. SEVERITY DEFINITIONS

### Critical (P1)
- Cerberus Gateway is down and cannot be restarted
- License validation failure blocking all tool calls
- Security vulnerability actively being exploited
- Data integrity issue in audit log

**Expected action:** Provider acknowledges, begins investigation immediately, and provides status updates every 2 hours until resolved.

### High (P2)
- Gateway is operational but detection accuracy is degraded
- Significant performance degradation (>10x normal latency)
- Alerting pipeline failure (Slack/PagerDuty/email not firing)
- License renewal failure approaching expiration

**Expected action:** Provider acknowledges, assigns engineer, provides resolution plan within 1 business day.

### Normal (P3)
- Configuration assistance
- Dashboard customization questions
- Non-urgent feature requests
- Documentation clarification

**Expected action:** Provider acknowledges and provides response within SLA timeframe.

### Low (P4)
- General product questions
- Enhancement suggestions
- Documentation typo reports

**Expected action:** Provider acknowledges and addresses in next scheduled update.

---

## 4. LICENSE SERVER AVAILABILITY

**4.1 Uptime Commitment.** Provider targets 99.9% monthly uptime for the license validation server (`api.cerberus.sixsenseenterprise.com`).

**4.2 Measurement.** Uptime is measured as: `(total minutes - downtime minutes) / total minutes * 100`. Scheduled maintenance (with 48-hour notice) is excluded.

**4.3 Grace Mode.** The Cerberus Gateway is designed to operate normally when the license server is unreachable. License validation failures are non-blocking — the gateway continues processing tool calls. This architecture ensures Customer's security is not degraded by Provider infrastructure issues.

**4.4 Service Credits.** If monthly uptime falls below the target:

| Monthly Uptime | Service Credit |
|----------------|---------------|
| 99.0% – 99.9% | 5% of monthly fee |
| 95.0% – 99.0% | 10% of monthly fee |
| Below 95.0% | 25% of monthly fee |

Service credits are applied to future invoices. Maximum credit per month: 25% of monthly fee. Credits must be requested within thirty (30) days of the incident.

---

## 5. INCIDENT RESPONSE

### 5.1 Incident Reporting

Customer reports incidents via:
- **Email:** enterprise@sixsenseenterprise.com
- **Subject line format:** `[P1/P2/P3/P4] Brief description`
- Include: severity, description, impact, steps to reproduce, relevant logs

### 5.2 Incident Lifecycle

| Phase | Description |
|-------|-------------|
| **Acknowledged** | Provider confirms receipt and assigns severity |
| **Investigating** | Engineer assigned, root cause analysis in progress |
| **Identified** | Root cause found, working on fix |
| **Monitoring** | Fix deployed, monitoring for recurrence |
| **Resolved** | Issue confirmed fixed, customer notified |

### 5.3 Post-Incident Review

For P1 and P2 incidents, Provider delivers a Root Cause Analysis (RCA) within five (5) business days of resolution, including:
- Timeline of events
- Root cause
- Corrective actions taken
- Preventive measures implemented

---

## 6. ESCALATION MATRIX

| Level | When | Contact |
|-------|------|---------|
| **L1 — Support** | Initial contact | enterprise@sixsenseenterprise.com |
| **L2 — Engineering** | No progress within SLA response time | Automatic escalation |
| **L3 — Management** | P1 unresolved >4 hours, P2 unresolved >24 hours | Request via email with "ESCALATION" in subject |

---

## 7. CUSTOMER RESPONSIBILITIES

To receive support, Customer agrees to:

**(a)** Designate named support contacts who are technically qualified;

**(b)** Provide reasonable access to logs, configuration files, and environment details when reporting issues;

**(c)** Apply recommended patches and updates in a timely manner;

**(d)** Maintain a supported environment (Docker 24+, 512MB+ RAM for gateway);

**(e)** Not modify the Software in ways that prevent Provider from diagnosing issues.

---

## 8. SOFTWARE UPDATES

**8.1 Security Patches.** Critical security patches are released as soon as available. Customer is notified via email.

**8.2 Bug Fixes.** Non-critical bug fixes are included in the next minor release, typically monthly.

**8.3 Feature Releases.** Major feature releases are delivered quarterly. Release notes are published with each release.

**8.4 Version Support.** Provider supports the current major version and one prior major version. Customers on unsupported versions must upgrade to receive support.

---

## 9. MAINTENANCE WINDOWS

**9.1** Provider performs scheduled maintenance on the license server during low-traffic hours (Saturday 2 AM – 6 AM ET).

**9.2** Customer receives at least 48 hours advance notice for scheduled maintenance.

**9.3** Emergency maintenance may be performed without advance notice for critical security issues. Customer is notified as soon as practicable.

**9.4** The gateway's grace mode ensures zero impact to Customer's operations during license server maintenance.

---

## 10. EXCLUSIONS

This SLA does not apply to:

- Issues caused by Customer's infrastructure, network, or configuration
- Force majeure events (natural disasters, war, pandemic, government action)
- Beta, preview, or experimental features
- Free or trial licenses
- Issues arising from Customer's modification of the Software
- Third-party software, tools, or services not provided by Provider

---

## 11. CONTACT

- **Support:** enterprise@sixsenseenterprise.com
- **Sales:** enterprise@sixsenseenterprise.com
- **Escalation:** Include "ESCALATION" in email subject line

---

**Six Sense Enterprise Services LLC**
Copyright 2017-2026. All rights reserved.
