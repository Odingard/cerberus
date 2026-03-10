# Cerberus Enterprise — Data Processing Agreement (DPA)

**Effective Date:** March 10, 2026
**Version:** 1.0

This Data Processing Agreement ("DPA") supplements the Master Services Agreement ("MSA") between **Six Sense Enterprise Services LLC** ("Provider") and the entity identified in the Order Form ("Customer").

---

## 1. SCOPE AND APPLICABILITY

**1.1** This DPA applies when Customer is subject to data protection laws including the EU General Data Protection Regulation (GDPR), UK GDPR, California Consumer Privacy Act (CCPA), or similar legislation.

**1.2 Architecture Note.** Cerberus Enterprise is a **self-hosted** product. The software runs entirely within Customer's infrastructure. Provider does **not** process Customer's end-user data, AI tool call data, detection results, or audit logs. This DPA primarily governs the minimal data exchanged for license validation.

---

## 2. DEFINITIONS

**"Personal Data"** means any information relating to an identified or identifiable natural person, as defined under applicable data protection law.

**"Processing"** means any operation performed on Personal Data, including collection, storage, use, transmission, and deletion.

**"Data Controller"** means the party that determines the purposes and means of Processing.

**"Data Processor"** means the party that Processes Personal Data on behalf of the Data Controller.

**"Sub-processor"** means a third party engaged by the Data Processor to Process Personal Data.

---

## 3. ROLES

**3.1** For data processed within Customer's infrastructure by the Cerberus software: **Customer is the sole Data Controller and Processor.** Provider has no access to this data.

**3.2** For license validation and account management data: **Customer is the Data Controller** and **Provider is the Data Processor.**

---

## 4. DATA PROCESSED BY PROVIDER

| Category | Data Elements | Purpose | Retention |
|----------|---------------|---------|-----------|
| License validation | License Key, instance heartbeat | Validate active license | Duration of license + 1 year |
| Account management | Contact name, email, company name | Deliver license, provide support | Duration of agreement + 2 years |
| Payment | Name, email, payment method | Process payment (via Stripe) | 7 years (legal requirement) |

**Provider does NOT process:** tool call data, detection signals, risk scores, audit logs, end-user PII, or any data flowing through the Cerberus gateway.

---

## 5. PROVIDER OBLIGATIONS

Provider shall:

**(a)** Process Personal Data only on Customer's documented instructions and solely for the purposes specified in this DPA;

**(b)** Ensure that persons authorized to Process Personal Data are bound by confidentiality obligations;

**(c)** Implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk, including:
- TLS 1.2+ encryption in transit
- AES-256 encryption at rest
- Access controls with principle of least privilege
- Regular security testing
- Incident response procedures

**(d)** Not engage a Sub-processor without Customer's prior written authorization (see Section 7);

**(e)** Assist Customer in fulfilling data subject rights requests (access, rectification, deletion, portability);

**(f)** Assist Customer with data protection impact assessments and prior consultations with supervisory authorities, where required;

**(g)** Delete or return all Personal Data upon termination of the Agreement, at Customer's choice, unless retention is required by law;

**(h)** Make available all information necessary to demonstrate compliance and allow for audits (see Section 8).

---

## 6. CUSTOMER OBLIGATIONS

Customer shall:

**(a)** Ensure it has a lawful basis for transferring Personal Data to Provider;

**(b)** Ensure that data subjects are informed about the Processing;

**(c)** Provide documented instructions for Processing;

**(d)** Manage all data within the Cerberus software deployment in compliance with applicable data protection law (as Provider has no access to this data).

---

## 7. SUB-PROCESSORS

**7.1 Current Sub-processors:**

| Sub-processor | Purpose | Location |
|---------------|---------|----------|
| Stripe, Inc. | Payment processing | United States |
| Resend, Inc. | Transactional email | United States |
| DigitalOcean, LLC | License server hosting | United States |

**7.2** Provider will notify Customer at least thirty (30) days before engaging a new Sub-processor. Customer may object in writing within fifteen (15) days. If the objection cannot be resolved, Customer may terminate the affected Order Form.

**7.3** Provider ensures Sub-processors are bound by data protection obligations no less protective than this DPA.

---

## 8. AUDITS

**8.1** Customer may audit Provider's compliance with this DPA once per year, with thirty (30) days written notice.

**8.2** Audits are conducted during business hours, at Customer's expense, and subject to reasonable confidentiality obligations.

**8.3** Provider may satisfy audit requests by providing: (a) SOC 2 Type II report (when available); (b) results of independent security assessments; or (c) written responses to Customer's reasonable questions.

---

## 9. DATA BREACH NOTIFICATION

**9.1** Provider will notify Customer without undue delay (and in any event within seventy-two (72) hours) after becoming aware of a Personal Data breach affecting Customer's data.

**9.2** Notification will include: (a) nature of the breach; (b) categories and approximate number of data subjects affected; (c) likely consequences; (d) measures taken or proposed to mitigate.

**9.3** Provider will cooperate with Customer's investigation and remediation efforts.

---

## 10. INTERNATIONAL TRANSFERS

**10.1** Provider's servers are located in the United States.

**10.2** For transfers from the EU/EEA/UK to the US, the parties rely on the EU Standard Contractual Clauses (SCCs), Module 2 (Controller to Processor), which are incorporated by reference.

**10.3** Provider implements supplementary measures including encryption, access controls, and data minimization.

---

## 11. GDPR-SPECIFIC PROVISIONS

**11.1 Legal Basis.** Provider processes Personal Data as necessary for the performance of the contract (Article 6(1)(b) GDPR) and Provider's legitimate interests in license management (Article 6(1)(f) GDPR).

**11.2 Data Protection Officer.** Customer may contact Provider's privacy team at privacy@sixsenseenterprise.com.

**11.3 Records of Processing.** Provider maintains records of processing activities as required by Article 30 GDPR.

---

## 12. CCPA-SPECIFIC PROVISIONS

**12.1** Provider is a "Service Provider" under the CCPA. Provider does not "sell" or "share" Personal Information as defined by the CCPA.

**12.2** Provider processes Personal Information only for the business purposes specified in this DPA.

**12.3** Provider certifies it understands the restrictions in this DPA and will comply with them.

---

## 13. HIPAA-SPECIFIC PROVISIONS

**13.1 Self-Hosted Architecture.** Because Cerberus Enterprise runs within Customer's infrastructure, Provider does **not** create, receive, maintain, or transmit Protected Health Information (PHI) as defined by HIPAA.

**13.2** If Customer requires a Business Associate Agreement (BAA) for any ancillary services, the parties will negotiate separately.

**13.3** Customer is responsible for configuring the Cerberus software in compliance with HIPAA requirements within their own environment, including access controls, audit logging, and encryption.

---

## 14. TERM

This DPA is effective for the duration of the MSA. Sections 5(g), 9, and 10 survive termination.

---

## 15. CONTACT

**Privacy inquiries:** privacy@sixsenseenterprise.com

---

**Six Sense Enterprise Services LLC**
Copyright 2017-2026. All rights reserved.
