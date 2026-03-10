# Cerberus Enterprise — End User License Agreement (EULA)

**Effective Date:** March 10, 2026
**Version:** 1.0

This End User License Agreement ("Agreement") is a legal agreement between you or the entity you represent ("Customer", "you") and **Six Sense Enterprise Services LLC** ("Licensor", "we", "us") for the use of Cerberus Enterprise software ("Software").

By downloading, installing, or using the Software, you agree to be bound by the terms of this Agreement. If you do not agree, do not download, install, or use the Software.

---

## 1. DEFINITIONS

**1.1 "Software"** means the Cerberus Enterprise self-hosted security platform, including the Cerberus Gateway Docker image, configuration templates, monitoring stack configurations, documentation, and any updates or patches provided under this Agreement.

**1.2 "License Key"** means the unique alphanumeric string (format: `cbr_ent_[0-9a-f]{32}`) issued to Customer upon purchase, required to activate and operate the Software.

**1.3 "Instance"** means a single running deployment of the Cerberus Gateway Docker container within Customer's infrastructure.

**1.4 "Authorized Users"** means Customer's employees, contractors, and agents who are authorized to access and operate the Software on Customer's behalf.

**1.5 "Term"** means the license period specified in the Order Form, typically twelve (12) months from the date of purchase.

---

## 2. LICENSE GRANT

**2.1 Grant.** Subject to Customer's compliance with this Agreement and payment of applicable fees, Licensor grants Customer a non-exclusive, non-transferable, non-sublicensable license to:

(a) Install and operate the Software within Customer's own infrastructure (on-premises or private cloud);

(b) Use the Software solely for Customer's internal business purposes to secure Customer's own agentic AI systems;

(c) Deploy up to the number of Instances specified in the Order Form;

(d) Make copies of the Software solely for reasonable backup and disaster recovery purposes.

**2.2 Open Source Components.** The Cerberus core detection engine (`@cerberus-ai/core`) is separately licensed under the MIT License. This Agreement governs only the enterprise components: gateway server, license client, audit log system, enterprise Docker configurations, and monitoring stack integrations.

---

## 3. RESTRICTIONS

Customer shall NOT:

(a) Sublicense, sell, resell, rent, lease, or distribute the Software or License Key to any third party;

(b) Share, publish, or disclose License Keys to unauthorized parties;

(c) Use a single License Key across multiple unrelated organizations or business entities;

(d) Modify, reverse engineer, decompile, or disassemble the Software, except to the extent expressly permitted by applicable law;

(e) Remove, alter, or obscure any proprietary notices, labels, or marks on the Software;

(f) Use the Software to provide a managed security service, SaaS offering, or similar service to third parties without a separate OEM agreement;

(g) Circumvent, disable, or interfere with the license validation mechanism;

(h) Use the Software in violation of any applicable law, regulation, or third-party right.

---

## 4. LICENSE KEY AND VALIDATION

**4.1 Activation.** The Software requires a valid License Key for operation. The License Key is validated against Licensor's license server on startup and periodically during operation.

**4.2 Grace Mode.** If the license server is temporarily unreachable, the Software continues operating in full capacity. This grace period does not extend the Term.

**4.3 Expiration.** Upon expiration of the Term, the Software enters degraded mode. Customer must renew the license to restore full functionality.

**4.4 Revocation.** Licensor may revoke a License Key if Customer materially breaches this Agreement. Licensor will provide written notice and a thirty (30) day cure period before revocation, except in cases of security compromise or fraud.

---

## 5. FEES AND PAYMENT

**5.1 Fees.** Customer shall pay the fees specified in the Order Form or invoice. All fees are quoted in US dollars unless otherwise specified.

**5.2 Payment Terms.** Invoices are due within thirty (30) days of the invoice date. Late payments accrue interest at the lesser of 1.5% per month or the maximum rate permitted by law.

**5.3 Taxes.** Fees are exclusive of all taxes. Customer is responsible for all applicable taxes, excluding taxes based on Licensor's net income.

**5.4 No Refunds.** All fees are non-refundable once paid, except as required by applicable law or as expressly stated in the Order Form.

---

## 6. SUPPORT AND MAINTENANCE

**6.1 Support.** During the Term, Licensor provides technical support via email at enterprise@sixsenseenterprise.com. Response times and support scope are defined in the Service Level Agreement (SLA).

**6.2 Updates.** Licensor may provide updates, patches, and new versions of the Software during the Term. Updates are provided at Licensor's discretion and may include security fixes, bug fixes, and feature enhancements.

**6.3 Maintenance Windows.** Licensor may perform maintenance on the license validation server with reasonable advance notice. The Software's grace mode ensures uninterrupted operation during maintenance.

---

## 7. DATA AND PRIVACY

**7.1 Customer Data.** The Software operates entirely within Customer's infrastructure. Customer data is processed locally and never transmitted to Licensor's servers.

**7.2 License Telemetry.** The only data transmitted to Licensor is: (a) the License Key for validation, and (b) a heartbeat signal confirming the instance is active. No customer data, tool call content, detection results, or audit logs are transmitted.

**7.3 Data Processing.** If Customer is subject to GDPR, CCPA, HIPAA, or similar regulations, the Data Processing Agreement (DPA) supplement governs data processing obligations. See `legal/DPA.md`.

---

## 8. INTELLECTUAL PROPERTY

**8.1 Ownership.** Licensor retains all right, title, and interest in and to the Software, including all intellectual property rights. This Agreement does not transfer any ownership rights to Customer.

**8.2 Feedback.** If Customer provides feedback, suggestions, or improvement ideas, Licensor may use such feedback without obligation to Customer.

**8.3 Customer Data.** As between the parties, Customer retains all right, title, and interest in Customer's data processed by the Software.

---

## 9. WARRANTIES AND DISCLAIMERS

**9.1 Limited Warranty.** Licensor warrants that during the Term: (a) the Software will materially perform in accordance with the documentation; and (b) the Software will not contain any intentionally introduced malicious code.

**9.2 Warranty Remedy.** If the Software fails to conform to the warranty in Section 9.1, Licensor will, at its option: (a) repair or replace the non-conforming Software, or (b) refund the fees paid for the current Term. This is Customer's sole remedy for breach of warranty.

**9.3 Disclaimer.** EXCEPT AS EXPRESSLY SET FORTH IN SECTION 9.1, THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. LICENSOR DISCLAIMS ALL OTHER WARRANTIES, EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.

**9.4 Security Disclaimer.** THE SOFTWARE IS A DETECTION AND MITIGATION TOOL. LICENSOR DOES NOT WARRANT THAT THE SOFTWARE WILL DETECT OR PREVENT ALL SECURITY THREATS. CUSTOMER ACKNOWLEDGES THAT NO SECURITY SOLUTION PROVIDES ABSOLUTE PROTECTION.

---

## 10. LIMITATION OF LIABILITY

**10.1 Exclusion.** IN NO EVENT SHALL LICENSOR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR DAMAGES FOR LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITIES, REGARDLESS OF THE CAUSE OF ACTION OR THEORY OF LIABILITY.

**10.2 Cap.** LICENSOR'S TOTAL AGGREGATE LIABILITY UNDER THIS AGREEMENT SHALL NOT EXCEED THE FEES PAID BY CUSTOMER TO LICENSOR DURING THE TWELVE (12) MONTHS PRECEDING THE CLAIM.

**10.3 Exceptions.** The limitations in Sections 10.1 and 10.2 do not apply to: (a) breach of Section 3 (Restrictions); (b) Licensor's indemnification obligations; or (c) liability that cannot be excluded under applicable law.

---

## 11. INDEMNIFICATION

**11.1 By Licensor.** Licensor will defend Customer against any third-party claim that the Software infringes a US patent or copyright, and will indemnify Customer for damages finally awarded or settlements approved in writing. This obligation does not apply if the claim arises from: (a) Customer's modification of the Software; (b) combination with non-Licensor products; or (c) use after Licensor provides a non-infringing alternative.

**11.2 By Customer.** Customer will defend and indemnify Licensor against any claim arising from: (a) Customer's use of the Software in violation of this Agreement; (b) Customer's data; or (c) Customer's violation of applicable law.

---

## 12. TERM AND TERMINATION

**12.1 Term.** This Agreement is effective from the date Customer first activates the License Key and continues for the Term specified in the Order Form.

**12.2 Renewal.** The Term automatically renews for successive twelve (12) month periods unless either party provides written notice of non-renewal at least thirty (30) days before the end of the current Term.

**12.3 Termination for Cause.** Either party may terminate this Agreement if the other party materially breaches and fails to cure within thirty (30) days of written notice.

**12.4 Effect of Termination.** Upon termination: (a) all licenses granted hereunder terminate; (b) Customer must cease using the Software and destroy all copies; (c) Sections 3, 7, 8, 9.3, 10, 11, 13, and 14 survive termination.

---

## 13. CONFIDENTIALITY

**13.1 Confidential Information.** Each party agrees to maintain the confidentiality of the other party's confidential information, including License Keys, pricing, and proprietary technology.

**13.2 Exceptions.** Confidentiality obligations do not apply to information that: (a) is publicly available; (b) was known before disclosure; (c) is independently developed; or (d) is required to be disclosed by law.

---

## 14. GENERAL

**14.1 Governing Law.** This Agreement is governed by the laws of the State of Georgia, USA, without regard to conflict of law principles.

**14.2 Dispute Resolution.** Any dispute arising from this Agreement shall be resolved by binding arbitration under the rules of the American Arbitration Association, conducted in Atlanta, Georgia. Either party may seek injunctive relief in any court of competent jurisdiction.

**14.3 Entire Agreement.** This Agreement, together with the Order Form, SLA, and DPA (if applicable), constitutes the entire agreement between the parties. No modification is effective unless in writing and signed by both parties.

**14.4 Severability.** If any provision is held unenforceable, the remaining provisions continue in full force.

**14.5 Assignment.** Customer may not assign this Agreement without Licensor's prior written consent, except in connection with a merger or acquisition of substantially all of Customer's assets.

**14.6 Force Majeure.** Neither party is liable for delays caused by events beyond its reasonable control, including natural disasters, war, pandemic, or government action.

**14.7 Notices.** All notices must be in writing and sent to:

**Six Sense Enterprise Services LLC**
Email: legal@sixsenseenterprise.com

---

## 15. CONTACT

For questions about this Agreement:

- **Sales:** enterprise@sixsenseenterprise.com
- **Legal:** legal@sixsenseenterprise.com
- **Support:** enterprise@sixsenseenterprise.com

---

*By installing or using Cerberus Enterprise, you acknowledge that you have read, understood, and agree to be bound by this End User License Agreement.*

**Six Sense Enterprise Services LLC**
Copyright 2017-2026. All rights reserved.
