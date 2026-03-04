# Cerberus — Release Notes

## v0.2.1 — 2026-03-03

> Scientific validation + real-world attack demonstrations — N=285 API calls, live HTTP interception, LangChain integration, and performance benchmarks.

### Highlights

- **N=285 real API calls** — full scientific validation across 3 providers, negative controls, 6-factor causation scoring, Wilson 95% CIs
- **Any exfiltration ~100%** across all three providers (GPT-4o-mini, Gemini 2.5 Flash, Claude Sonnet) under permissive prompts
- **Full injection compliance**: OpenAI 17.8%, Google 48.9%, Anthropic 2.2% (injection redirects agent to attacker's address)
- **0% false positives** — 15 clean control runs, 0 alerts
- **L1/L2 100% detection accuracy** — deterministic layer coverage confirmed at scale
- **Live HTTP interception demo** — real GPT-4o-mini captures 2 POSTs with SSN+email in Phase 1; 0 requests in guarded Phase 2
- **718 tests** — 127 additional since v0.2.0
- **52μs p50 / 0.23ms p99** overhead — measured via 1,000-iteration benchmark

### Attack Validation Results

Scientific protocol: 30 payloads × 3 trials = 90 treatment runs per provider, 5 negative control runs per provider.

| Provider | Model | Any Exfiltration | Full Injection Compliance | 95% CI |
|----------|-------|-----------------|--------------------------|--------|
| OpenAI | gpt-4o-mini | **100%** (90/90) | 17.8% (16/90) | [11.2%, 26.9%] |
| Anthropic | claude-sonnet-4-20250514 | **100%** (90/90) | 2.2% (2/90) | [0.6%, 7.7%] |
| Google | gemini-2.5-flash | **98.9%** (89/90) | 48.9% (44/90) | [38.8%, 59.0%] |

- **Any exfiltration**: PII leaves the system (success + partial outcomes)
- **Full injection compliance**: injection additionally overrides the destination to the attacker's address
- **0/15 control exfiltrations** — baseline confirmed clean

### Detection Engine Validation

Same N=285 run suite with Cerberus in observe-only mode (`alertMode: log`):

| Provider | Detection Rate | Block Rate | FP Rate | L1 | L2 | L3 |
|----------|---------------|------------|---------|-----|-----|-----|
| OpenAI | 23.3% | 23.3% | 0.0% | 100% | 100% | 22.1% |
| Anthropic | 2.2% | 2.2% | 0.0% | 100% | 100% | 2.1% |
| Google | 70.0% | 70.0% | 0.0% | 100% | 100% | 66.3% |

L1 and L2 are deterministic — 100% accuracy across all 285 runs, zero FPs, zero FNs.

### New Features

- **`authorizedDestinations`** config option — domain allowlist for L3 and drift detector; matches production DLP/CASB patterns
- **Detection validation CLI** (`--detect` flag) — observe-only mode wraps harness with `guard()`, measures TP/FP/FN/TN per layer with Wilson CIs
- **Live attack demo** (`examples/live-attack-demo.ts`, `harness/demo-servers.ts`) — local injection server + capture server; demonstrates real HTTP exfiltration interception
- **LangChain RAG demo** (`examples/langchain-rag-demo.ts`) — real ChatOpenAI agent blocked at score 3/4
- **Performance benchmark** (`harness/bench.ts`) — p50=52μs, p99=0.23ms, 0.01% of typical LLM call latency

### New npm Scripts

```bash
npm run demo:live       # Real HTTP interception demo
npm run demo:langchain  # LangChain agent attack demo
npm run bench          # Performance benchmark (1000 iterations)
```

### Testing

- 718 total tests (up from 591 in v0.2.0)
- 127 new tests covering detection validation, providers, and integration

---

## v0.2.0 — 2026-03-02

> Advanced sub-classifiers + MCP runtime security — 6 detection modules enhancing L1/L2/L3.

### Highlights

- **6 new sub-classifiers** that deepen heuristic coverage without changing the correlation engine or risk vector
- **MCP Tool Poisoning Scanner** — standalone + runtime defense against tool description manipulation
- **Behavioral Drift Detector** — catches post-injection behavioral pattern changes
- **591 tests** at 98.69% statement coverage, 94.7% branch, 100% function

### New Detection Modules

| Sub-Classifier            | Enhances | Signal                        | Function                                                                |
| ------------------------- | -------- | ----------------------------- | ----------------------------------------------------------------------- |
| **Secrets Detector**      | L1       | `SECRETS_DETECTED`            | Detects AWS keys, GitHub tokens, JWTs, private keys, connection strings |
| **Injection Scanner**     | L2       | `INJECTION_PATTERNS_DETECTED` | Weighted heuristic detection of prompt injection patterns               |
| **Encoding Detector**     | L2       | `ENCODING_DETECTED`           | Detects base64, hex, unicode, URL encoding, ROT13 bypass attempts       |
| **MCP Poisoning Scanner** | L2       | `TOOL_POISONING_DETECTED`     | Scans MCP tool descriptions for hidden instructions and manipulation    |
| **Domain Classifier**     | L3       | `SUSPICIOUS_DESTINATION`      | Flags disposable emails, webhook services, IP addresses, URL shorteners |
| **Drift Detector**        | L2/L3    | `BEHAVIORAL_DRIFT_DETECTED`   | Detects post-injection outbound calls and privilege escalation patterns |

### New APIs

- **`scanToolDescriptions(tools)`** — Standalone MCP tool description scanner for registration-time scanning
- **`toolDescriptions`** config option — Enables runtime per-call MCP poisoning detection

### Pipeline

Sub-classifiers are wired after their parent layers in the interceptor pipeline:

```
L1 → Secrets → L2 → Injection + Encoding + MCP → L3 → Domain → L4 → Drift → Correlation
```

All sub-classifiers emit signals with existing layer tags (L1/L2/L3), so the correlation engine and 4-bit risk vector are unchanged.

### Testing

- 5-phase integration test suite covering baseline, adversarial, stress, edge cases, and maximum-hardness regression
- 591 total tests (up from 326 in v0.1.0)

---

## v0.1.0 — 2026-03-01

> First public release of the Cerberus Agentic AI Runtime Security Platform.

### What Is Cerberus?

Cerberus detects, correlates, and interrupts the **Lethal Trifecta** attack pattern — the fundamental vulnerability in every AI agent that can access private data, process external content, and take outbound actions.

It ships as a single `guard()` function that wraps your existing tool executors. No agent framework changes. No model swaps. One function call.

### Detection Layers

| Layer  | Signal                        | What It Does                                                           |
| ------ | ----------------------------- | ---------------------------------------------------------------------- |
| **L1** | `PRIVILEGED_DATA_ACCESSED`    | Tags tool calls by data trust level, extracts PII from trusted sources |
| **L2** | `UNTRUSTED_TOKENS_IN_CONTEXT` | Labels context tokens by origin, flags untrusted injection vectors     |
| **L3** | `EXFILTRATION_RISK`           | Detects PII in outbound tool calls via substring correlation           |
| **L4** | `CONTAMINATED_MEMORY_ACTIVE`  | Tracks cross-session taint through persistent memory (novel)           |

### Correlation Engine

All four layers feed a single correlation engine that builds a 4-bit risk vector per turn, computes a score (0-4), and resolves an action based on your configured threshold and alert mode.

Default threshold: **3** (the Lethal Trifecta — L1+L2+L3 firing together).

### Attack Harness + Research Results

- 21 injection payloads across 5 categories
- 100% attack success rate on GPT-4o-mini
- Every payload completes the full kill chain in ~12 seconds at $0 cost
- Structured JSON traces with ground-truth labels

### Installation

```bash
npm install @cerberus-ai/core
```

### Quick Usage

```typescript
import { guard } from '@cerberus-ai/core';

const { executors: secured, destroy } = guard(
  {
    readDatabase: async (args) => db.query(args.sql),
    fetchUrl: async (args) => fetch(args.url).then((r) => r.text()),
    sendEmail: async (args) => mailer.send(args),
  },
  {
    alertMode: 'interrupt',
    threshold: 3,
    trustOverrides: [
      { toolName: 'readDatabase', trustLevel: 'trusted' },
      { toolName: 'fetchUrl', trustLevel: 'untrusted' },
    ],
  },
  ['sendEmail'],
);

// Use secured.readDatabase(), secured.fetchUrl(), secured.sendEmail()
// exactly like the originals — Cerberus intercepts transparently

destroy(); // Clean up when done
```

### Key Research Findings

1. **The attack costs nothing.** Free-tier GPT-4o-mini + 3 tool definitions + one injected instruction = full PII exfiltration.
2. **Encoding doesn't help.** Base64, ROT13, hex, and Unicode-escaped payloads all succeed.
3. **Language doesn't matter.** Spanish, Mandarin, Arabic, and Russian payloads all exfiltrate data.
4. **Social engineering scales.** CEO impersonation, IT support pretexts, and legal threats all bypass model judgment.
5. **Layer 4 is novel.** No existing tool detects cross-session memory contamination attacks. Cerberus ships the first deployable defense.

### Documentation

- [API Reference](api.md)
- [Architecture](architecture.md)
- [Research Results](research-results.md)
- [Security Policy](../SECURITY.md)
- [Contributing](../CONTRIBUTING.md)

### Examples

```bash
npx tsx examples/basic-guard.ts       # Lethal Trifecta detection demo
npx tsx examples/memory-tracking.ts   # L4 cross-session contamination demo
```

### Tech Stack

- TypeScript (strict mode), Node.js >= 20
- 326 tests, 99.7% coverage (Vitest)
- SQLite via better-sqlite3 (L4 provenance ledger)
- Zero runtime dependencies beyond better-sqlite3

## License

[MIT](../LICENSE)
