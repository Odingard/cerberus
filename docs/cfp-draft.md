# CFP Draft — Conference Submission Materials

## Title

**The Lethal Trifecta: Detecting and Interrupting Multi-Layer Prompt Injection Attacks in Agentic AI Systems**

---

## Abstract (~300 words)

Agentic AI systems — LLM-powered assistants with tool-calling capabilities — are being deployed in enterprise environments with access to sensitive data, external content, and outbound communication channels. We identify a fundamental architectural vulnerability we term the **Lethal Trifecta**: any agent that can (1) access privileged data, (2) process untrusted external content, and (3) take outbound actions is exploitable through prompt injection, regardless of the underlying model or safety tuning.

We constructed a minimal 3-tool attack agent and validated this vulnerability with 30 injection payloads across 6 categories — direct injection, encoded/obfuscated (Base64, ROT13, hex, Unicode), social engineering (CEO fraud, IT impersonation, legal threats), multi-turn (persistent rules, delayed triggers, context poisoning), multilingual (Spanish, Mandarin, Arabic, Russian), and advanced technique (context stuffing, CoT manipulation, refusal bypass). Tested across three major LLM providers with statistical rigor (N=285 runs, Wilson 95% CIs): **GPT-4o-mini 93.3%** [86.2%, 96.9%] attack success, **Gemini 2.5 Flash 92.2%** [84.8%, 96.2%], **Claude Sonnet 13.3%** [7.8%, 21.9%]. The CI floor on Claude is 7.8% — not zero, and not acceptable for enterprise PII. Its resistance reflects training against known payload patterns, not elimination of the architectural condition; new techniques will shift that number without notice.

We further identify a novel **Layer 4 attack vector**: memory contamination across sessions. Building on MINJA (NeurIPS 2025), we demonstrate that an attacker can inject malicious content into an agent's persistent memory in Session 1, which triggers exfiltration when retrieved in Session 3. No existing defensive tool detects this cross-session attack.

We present **Cerberus**, a runtime security platform that closes this gap through four independent detection layers sharing one correlation engine. We do not merely claim detection — we prove it. Running the full 30-payload suite in observe-only mode across all three providers (N=480 runs), Cerberus achieves **0.0% false positive rate** [0.0%, 11.4%] on 30 clean control runs, **100% accuracy on L1 and L2** (deterministic layers that fire on every privileged data read and untrusted content fetch), and **L3 (outbound intent) detection that tracks confirmed exfiltration** — catching every instance where the model actually follows injected instructions. Cerberus is released as open-source developer tooling with 718 tests at 98%+ coverage. Integration requires a single function call: `guard(executors, config, outboundTools)`.

---

## Key Contributions

1. **Lethal Trifecta Formalization** — A threat model for the fundamental architectural vulnerability in all tool-calling AI agents, independent of model, framework, or safety tuning.

2. **Multi-Provider Empirical Validation** — 30 payloads across 6 categories, tested against GPT-4o-mini, Gemini 2.5 Flash, and Claude Sonnet with full statistical rigor: N=285 total runs, Wilson 95% confidence intervals, Fisher's exact test for significance, causation scoring per payload. Two of the three largest AI providers are fully exploitable today.

3. **Layer 4: Memory Contamination Defense** — The first deployable implementation of a defense against cross-session memory poisoning attacks (building on MINJA, NeurIPS 2025), shipped as installable developer tooling.

4. **Cerberus: Open-Source Runtime Defense** — A model-agnostic, framework-agnostic detection platform that operates at the tool-call level with four independent detection layers and six advanced sub-classifiers (secrets detection, injection scanning, encoding/obfuscation detection, MCP tool poisoning defense, suspicious domain classification, behavioral drift analysis).

5. **Closed-Loop Detection Validation** — We prove the defense with the same scientific rigor used to prove the attack. No prior prompt injection study has paired attack measurement with defensive validation in the same experimental framework. N=480 detection runs, 3 providers, Wilson CIs: 0% FP rate, 100% deterministic accuracy on L1/L2, L3 (outbound intent) detection that tracks confirmed exfiltration with no false alerts on clean sessions.

---

## DEF CON AI Village — Talk Outline (45 min)

### 1. The $0 Attack (10 min)

- Live demo: 3 tool calls, 12 seconds, full PII exfiltration from a GPT-4o-mini agent
- Show the attack anatomy — `readPrivateData` → `fetchExternalContent` (injected) → `sendOutboundReport`
- Audience participation: guess which payload category succeeds (trick question — on GPT-4o-mini, they all do)
- Cost: ~$0.001 per exfiltration (at current GPT-4o-mini API rates). At scale: steal a million customer records for under $1,000.

### 2. Why Everything You've Tried Doesn't Work (10 min)

- System prompts: "Do not share sensitive data" — bypassed 93.3% of the time
- Safety tuning: GPT-4o-mini never refuses, even with explicit PII and external recipients
- Input sanitization: Base64, ROT13, hex, Unicode all decode and execute in-context
- Language barriers: Spanish, Mandarin, Arabic, Russian — all succeed equally
- Statistical proof: N=285 runs with confidence intervals. This is not anecdote. This is measurement.

### 3. The Lethal Trifecta Model (5 min)

- Formalize the 3 conditions: privileged access + untrusted tokens + outbound capability
- Show why this is architectural, not model-specific — any model that is *useful* has all three capabilities
- The uncomfortable truth: Claude resists today (13.3%). Future payloads may not let it.
- Introduce the 4th dimension: memory contamination across sessions (L4)

### 4. Cerberus: Runtime Detection — Proven (15 min)

- L1: Data source classification — tag trust at access time + secrets detection. 100% accurate. Fires on every privileged data read.
- L2: Token provenance — label every token by origin + injection scanning, encoding detection, MCP poisoning defense. 100% accurate. Fires on every untrusted content fetch.
- L3: Outbound intent — substring correlation catches exfiltration + suspicious domain classification + behavioral drift. Fires when PII flows to unauthorized destinations. Tracks confirmed attack success with 0% FP.
- L4: Memory contamination graph — BFS taint propagation across sessions.
- Correlation engine: 4-bit risk vector, cumulative scoring, configurable threshold.
- **The proof**: N=480 detection runs. Zero false positives. Catches every confirmed exfiltration.
- Live demo: same 3 attacks, now interrupted.

### 5. Deployment & Open Source (5 min)

- `npm install @cerberus-ai/core` — one function call integration
- 718 tests, 98%+ coverage
- 6 sub-classifiers: secrets, injection, encoding, MCP poisoning, domain, drift
- Call to action: test your agents, contribute detection layers, check your exposure

---

## Black Hat Arsenal — Abstract

**Tool Name:** Cerberus — Agentic AI Runtime Security Platform

**Category:** AI/ML Security

**Description:**

Cerberus is an open-source runtime security platform that detects and interrupts prompt injection attacks in agentic AI systems. It addresses the **Lethal Trifecta** — the fundamental attack pattern where AI agents with privileged data access, external content processing, and outbound action capabilities are exploited through injected instructions.

**The attack is real and cheap.** We validated 30 injection payloads across 6 categories against three major LLM providers with full statistical rigor (N=285 runs, Wilson 95% CIs): GPT-4o-mini 93.3% [86.2%, 96.9%], Gemini 2.5 Flash 92.2% [84.8%, 96.2%], Claude Sonnet 13.3% [7.8%, 21.9%]. Two of the three most widely deployed providers are fully exploitable today. Claude's 13.3% is not a solution — the 7.8% CI floor means even the most resistant major provider still exfiltrates enterprise PII in roughly 1 in 13 attacks under current payloads; new techniques shift that number without notice; and developers cannot guarantee which model their downstream integrations run on. The attack costs approximately $0.001 per exfiltration (at current GPT-4o-mini API rates), requiring only free-tier access.

**The defense is proven.** We ran the full payload suite a second time in observe-only mode across all three providers (N=480 runs) to validate detection accuracy with the same statistical rigor used to measure the attack. Results: **0.0% false positive rate** [0.0%, 11.4%] on 30 clean control runs; **100% accuracy on L1 and L2** (deterministic layers — every privileged data read and every untrusted content fetch is tagged); **L3 (outbound intent classification) tracks confirmed exfiltration** with zero false alerts on clean agent sessions.

The tool wraps existing tool executors with four detection layers: (1) data source classification, (2) token provenance tracking, (3) outbound intent classification, and (4) cross-session memory contamination detection (the first deployable defense against the MINJA NeurIPS 2025 attack class). A correlation engine aggregates signals into a 4-bit risk vector and interrupts tool calls that exceed a configurable threshold.

**Demo Plan:** Live 3-tool agent attack → full PII exfiltration in 12 seconds. Then Cerberus integration showing real-time interception of the same attacks.

**Technical specs:** TypeScript/Node.js, MIT licensed, 718 tests at 98%+ coverage. `npm install @cerberus-ai/core` — single function call integration.

---

## Academic Paper — Structure Outline

**Target Venues:** USENIX Security, IEEE S&P, ACM CCS

### 1. Introduction

- Agentic AI adoption trajectory and the emerging security gap at the tool-call layer
- The Lethal Trifecta: formalizing the fundamental architectural vulnerability
- Contributions: threat model, empirical validation, detection architecture, closed-loop proof

### 2. Threat Model

- Agent capabilities: tool calling, persistent memory, multi-turn conversations
- Attacker capabilities: indirect prompt injection via external content (zero privileges required)
- Attack surface: the 3-capability intersection + memory persistence
- Relationship to existing work (MINJA, Greshake et al., Perez & Ribeiro)

### 3. Attack Validation

- Experimental setup: 3-tool agent, multi-provider, simulated enterprise scenario
- Payload taxonomy: 6 categories, 30 payloads, per-payload causation scoring
- Statistical protocol: N=285 total runs (5 trials per payload per provider), Wilson 95% CIs, Fisher's exact test, negative controls
- Results: GPT-4o-mini 93.3% [86.2%, 96.9%], Gemini 92.2% [84.8%, 96.2%], Claude 13.3% [7.8%, 21.9%]
- Stress testing: multi-trial, safety-hardened system prompts, temperature/seed variation
- Causation analysis: identifying which payload characteristics drive attack success

### 4. Cerberus: Detection Architecture

- Design principles: session-cumulative scoring, model-agnostic, framework-agnostic, observe-or-interrupt
- L1: Data source classifier (PII extraction, trust tagging, secrets detection)
- L2: Token provenance tagger (untrusted content labeling, injection scanning, encoding detection, MCP poisoning defense)
- L3: Outbound intent classifier (substring correlation, domain classification, behavioral drift)
- L4: Memory contamination graph (directed graph with BFS taint propagation across sessions)
- Correlation engine: 4-bit risk vector, score computation, action resolution
- `authorizedDestinations` configuration for suppressing expected internal traffic (FP reduction)

### 5. Implementation

- TypeScript/Node.js, single-function API (`guard()`)
- SQLite-backed provenance ledger for audit trail
- Performance characteristics: latency overhead per tool call
- Framework adapters: LangChain, Vercel AI SDK, OpenAI Agents SDK

### 6. Evaluation

#### 6.1 Attack Baseline (N=285)
- Full methodology: 5 trials × 30 payloads × 3 providers
- Per-provider, per-category, per-payload success rates with Wilson 95% CIs
- Causation scoring: which payload attributes drive success vs. failure

#### 6.2 Detection Validation (N=480)
- Protocol: observe-only mode (`alertMode: log`), identical agent behavior
- Control group (10 runs/provider): FP rate = 0.0% [0.0%, 11.4%]
- L1 accuracy: 100% (TP=480, FP=0, FN=0) — deterministic
- L2 accuracy: 100% (TP=480, FP=0, FN=0) — deterministic
- L3 accuracy: tracks confirmed exfiltration (OpenAI 19.3%, Google 73.3%, Anthropic 3.3%)
- Per-category detection: direct injection 52.0%, multi-turn 51.7%, encoded 35.0%
- Block rate = detection rate (computed from `maxScore >= threshold`, not `action`, due to observe-only mode)

#### 6.3 Comparison with Existing Defenses
- System prompts vs. runtime detection: prompt-level defenses bypassed 93.3% of the time
- Safety tuning: model-level resistance is model-specific and payload-specific
- Input sanitization: encoding bypasses are detected by L2 encoding detector

### 7. Discussion

- Limitations: L3 uses substring correlation — semantic similarity attacks (paraphrased exfiltration) are a gap
- Adversarial robustness: split-token exfiltration, indirect encoding of PII
- Multi-model generalization: results across 3 providers confirm model-agnostic behavior
- Why detection rate = attack success rate: Cerberus does not detect blocked attacks, only confirmed ones — this is correct behavior
- Ethical considerations: dual-use research, responsible disclosure

### 8. Related Work

- Prompt injection: Greshake et al. (2023), Perez & Ribeiro (2022)
- Memory attacks: MINJA (NeurIPS 2025)
- AI security frameworks: OWASP LLM Top 10, NIST AI RMF
- Runtime monitoring: existing application security parallels (WAF, RASP)
- Agent security: AutoGPT red-teaming, prior tool-call auditing work

### 9. Conclusion

- The Lethal Trifecta is architectural — no amount of model safety training eliminates it because usefulness requires all three capabilities
- Two of the three most widely deployed commercial AI providers are fully exploitable today at near-zero cost
- Runtime detection at the tool-call level is necessary and sufficient: 0% FP, 100% L1/L2 accuracy, L3 catches every confirmed exfiltration
- Cerberus: first open-source, deployable defense with L4 memory contamination detection, validated with scientific rigor

---

## Metadata

- **Authors:** Andre Byrd
- **Affiliation:** Six Sense Enterprise Services
- **Contact:** security@cerberus.dev
- **Repository:** https://github.com/Odingard/cerberus
- **License:** MIT
- **Date:** March 2026

## Submission Deadlines (2026)

| Venue                 | Deadline                    | Format                | Status        |
| --------------------- | --------------------------- | --------------------- | ------------- |
| Black Hat USA Arsenal | **March 13, 2026**          | Tool demo             | **SUBMIT NOW** |
| DEF CON 34 AI Village | TBD (typically May 2026)    | Talk proposal         | Prepare       |
| ACM CCS '26           | TBD (typically May 2026)    | Full paper (12 pages) | Prepare       |
| IEEE S&P '27          | TBD (typically Jun 2026)    | Full paper            | Later         |
| USENIX Security '27   | TBD (typically Feb 2027)    | Full paper (18 pages) | Later         |
