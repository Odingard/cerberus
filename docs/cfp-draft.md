# CFP Draft — Conference Submission Materials

## Title

**The Lethal Trifecta: Detecting and Interrupting Multi-Layer Prompt Injection Attacks in Agentic AI Systems**

---

## Abstract (~300 words)

Agentic AI systems — LLM-powered assistants with tool-calling capabilities — are rapidly deployed in enterprise environments with access to sensitive data, external content, and outbound communication channels. We identify a fundamental architectural vulnerability we term the **Lethal Trifecta**: any agent that can (1) access privileged data, (2) process untrusted external content, and (3) take outbound actions is exploitable through prompt injection, regardless of the underlying model or safety tuning.

We constructed a minimal 3-tool attack agent and validated this vulnerability with 21 injection payloads across 5 categories: direct injection, encoded/obfuscated (Base64, ROT13, hex, Unicode), social engineering (CEO fraud, IT impersonation, legal threats), multi-turn (persistent rules, delayed triggers, context poisoning), and multilingual (Spanish, Mandarin, Arabic, Russian). Testing against GPT-4o-mini with free-tier API access, **every payload achieved 100% attack success** — completing the full kill chain from privileged data access through PII exfiltration in under 15 seconds at zero cost. No payload triggered a safety refusal.

We further identify a novel **Layer 4 attack vector**: memory contamination across sessions. Building on MINJA (NeurIPS 2025), we demonstrate that an attacker can inject malicious content into an agent's persistent memory in Session 1, which triggers exfiltration when retrieved in Session 3. No existing defensive tool detects this cross-session attack.

We present **Cerberus**, a runtime security platform that addresses these vulnerabilities through four independent detection layers sharing one correlation engine. Cerberus operates at the tool-call level, is model-agnostic, and requires no changes to agent frameworks — a single `guard()` function wraps existing tool executors. The system builds a 4-bit risk vector per turn, correlates signals cumulatively across the session, and interrupts tool calls that exceed a configurable risk threshold. We release Cerberus as open-source developer tooling with 591 tests at 98.69% coverage, featuring four core detection layers and six advanced sub-classifiers covering secrets detection, prompt injection scanning, encoding/obfuscation detection, MCP tool poisoning defense, suspicious domain classification, and behavioral drift analysis.

---

## Key Contributions

1. **Lethal Trifecta Formalization** — A threat model for the fundamental architectural vulnerability in all tool-calling AI agents, independent of model, framework, or safety tuning.

2. **Empirical Validation** — 21 attack payloads across 5 categories with 100% success rate, demonstrating that encoding, language, social engineering, and multi-turn techniques all bypass model safety.

3. **Layer 4: Memory Contamination Defense** — The first deployable implementation of a defense against cross-session memory poisoning attacks (building on MINJA, NeurIPS 2025).

4. **Cerberus: Open-Source Runtime Defense** — A model-agnostic, framework-agnostic detection platform that operates at the tool-call level with four independent detection layers and a correlation engine.

---

## DEF CON AI Village — Talk Outline (45 min)

### 1. The $0 Attack (10 min)

- Live demo: 3 tool calls, 12 seconds, full PII exfiltration
- Show the attack anatomy — readPrivateData → fetchExternalContent (injected) → sendOutboundReport
- Audience participation: guess which payload category succeeds (trick question — they all do)

### 2. Why Everything You've Tried Doesn't Work (10 min)

- System prompts: "Do not share sensitive data" — bypassed by every payload
- Safety tuning: model never refuses, even with explicit PII
- Input sanitization: Base64, ROT13, hex, Unicode all decode and execute
- Language barriers: Spanish, Mandarin, Arabic, Russian — all succeed

### 3. The Lethal Trifecta Model (5 min)

- Formalize the 3 conditions: privileged access + untrusted tokens + outbound capability
- Show why this is architectural, not model-specific
- Introduce the 4th dimension: memory contamination across sessions

### 4. Cerberus: Runtime Detection (15 min)

- L1: Data source classification — tag trust at access time + secrets detection
- L2: Token provenance — label every token by origin + injection scanning, encoding detection, MCP poisoning defense
- L3: Outbound intent — substring correlation catches exfiltration + suspicious domain classification
- L4: Memory contamination graph — BFS taint propagation across sessions
- Behavioral drift detector — catches post-injection pattern changes across turns
- Correlation engine: 4-bit risk vector, cumulative scoring, configurable threshold
- Live demo: same 3 attacks, now intercepted

### 5. Deployment & Open Source (5 min)

- `npm install @cerberus-ai/core` — one function call integration
- 591 tests, 98.69% coverage
- 6 sub-classifiers: secrets, injection, encoding, MCP poisoning, domain, drift
- Call to action: test your agents, contribute detection layers

---

## Black Hat Arsenal — Abstract

**Tool Name:** Cerberus — Agentic AI Runtime Security Platform

**Category:** AI/ML Security

**Description:**

Cerberus is an open-source runtime security platform that detects and interrupts prompt injection attacks in agentic AI systems. It addresses the Lethal Trifecta vulnerability — the fundamental attack pattern where AI agents with privileged data access, external content processing, and outbound action capabilities are exploited through injected instructions.

The tool wraps existing tool executors with four detection layers: (1) data source classification, (2) token provenance tracking, (3) outbound intent classification, and (4) cross-session memory contamination detection. A correlation engine aggregates signals into a 4-bit risk vector and interrupts tool calls that exceed a configurable threshold.

Validated against 21 attack payloads with 100% baseline attack success rate. Features four core detection layers and six advanced sub-classifiers including MCP tool poisoning defense. TypeScript/Node.js, MIT licensed, 591 tests at 98.69% coverage.

**Demo Plan:** Live 3-tool agent attack followed by Cerberus integration showing real-time interception.

---

## Academic Paper — Structure Outline

**Target Venues:** USENIX Security, IEEE S&P, ACM CCS

### 1. Introduction

- Agentic AI adoption trajectory and security gap
- The Lethal Trifecta: formalizing the fundamental vulnerability
- Contributions and paper structure

### 2. Threat Model

- Agent capabilities: tool calling, persistent memory, multi-turn conversations
- Attacker capabilities: indirect prompt injection via external content
- Attack surface: the 3-capability intersection + memory persistence
- Relationship to existing work (MINJA, Greshake et al., Perez & Ribeiro)

### 3. Attack Validation

- Experimental setup: 3-tool agent, GPT-4o-mini, simulated enterprise scenario
- Payload taxonomy: 5 categories, 21 payloads
- Results: 100% success rate across all categories
- Stress testing: multi-trial, safety-hardened prompts, temperature/seed variation
- Statistical analysis: zero variance in attack outcomes

### 4. Cerberus: Detection Architecture

- Design principles: session-cumulative scoring, model-agnostic, framework-agnostic
- L1: Data source classifier (PII extraction, trust tagging)
- L2: Token provenance tagger (untrusted content labeling)
- L3: Outbound intent classifier (substring correlation for exfiltration detection)
- L4: Memory contamination graph (directed graph with BFS taint propagation)
- Correlation engine: 4-bit risk vector, score computation, action resolution

### 5. Implementation

- TypeScript/Node.js, single-function API
- SQLite-backed provenance ledger for audit
- Performance characteristics: latency overhead per tool call

### 6. Evaluation

- Detection rate against all 21 payloads
- False positive analysis with benign tool-call sequences
- Cross-session L4 detection timing
- Comparison with existing defenses (system prompts, safety tuning, input filters)

### 7. Discussion

- Limitations: substring correlation vs. semantic similarity
- Adversarial robustness: paraphrased exfiltration, split-token attacks
- Multi-model generalization (future work)
- Ethical considerations: dual-use research

### 8. Related Work

- Prompt injection: Greshake et al. (2023), Perez & Ribeiro (2022)
- Memory attacks: MINJA (NeurIPS 2025)
- AI security frameworks: OWASP LLM Top 10
- Runtime monitoring: existing application security parallels

### 9. Conclusion

- The Lethal Trifecta is architectural — no amount of model safety training eliminates it
- Runtime detection at the tool-call level is necessary and sufficient
- Cerberus: first open-source, deployable defense with L4 memory contamination detection

---

## Metadata

- **Authors:** [To be filled]
- **Affiliation:** [To be filled]
- **Contact:** security@cerberus.dev
- **Repository:** https://github.com/Odingard/cerberus
- **License:** MIT
- **Date:** March 2026

## Submission Deadlines (2026)

| Venue                 | Deadline                 | Format                |
| --------------------- | ------------------------ | --------------------- |
| DEF CON 34 AI Village | TBD (typically May)      | Talk proposal         |
| Black Hat USA Arsenal | TBD (typically April)    | Tool demo             |
| USENIX Security '27   | TBD (typically Feb 2027) | Full paper (18 pages) |
| IEEE S&P '27          | TBD (typically Jun 2026) | Full paper            |
| ACM CCS '26           | TBD (typically May 2026) | Full paper (12 pages) |
