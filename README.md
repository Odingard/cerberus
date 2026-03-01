# Cerberus

**Agentic AI Runtime Security Platform**

[![CI](https://github.com/YOUR_ORG/cerberus/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/cerberus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@cerberus-ai/core.svg)](https://www.npmjs.com/package/@cerberus-ai/core)

Cerberus detects, correlates, and interrupts the **Lethal Trifecta** attack pattern across all agentic AI systems — in real time, at the tool-call level, before data leaves your perimeter.

---

## The Problem: The Lethal Trifecta

Every AI agent that can (1) access private data, (2) process external content, and (3) take outbound actions is vulnerable to the same fundamental attack pattern:

```
1. PRIVILEGED ACCESS     — Agent reads sensitive data (CRM, PII, internal docs)
2. INJECTION             — Untrusted external content manipulates the agent's behavior
3. EXFILTRATION          — Agent sends private data to an attacker-controlled endpoint
```

This is not theoretical. It is reproducible today with free-tier API access and three function calls.

**Layer 4 — Memory Contamination** extends this across sessions: an attacker injects malicious content into persistent memory in Session 1, and the payload triggers exfiltration in Session 3. No existing tool detects this.

---

## Architecture

Cerberus is four independent detection layers sharing one correlation engine:

```
                         ┌─────────────────────────────────────┐
                         │          AGENT RUNTIME              │
                         │                                     │
  ┌──────────┐          │  ┌─────┐   ┌─────┐   ┌─────┐      │
  │ External │──fetch──▶│  │L1   │   │L2   │   │L3   │      │
  │ Content  │          │  │Data │   │Token│   │Out- │      │
  └──────────┘          │  │Class│   │Prov │   │bound│      │
                         │  └──┬──┘   └──┬──┘   └──┬──┘      │
  ┌──────────┐          │     │         │         │          │
  │ Private  │──read──▶│     ▼         ▼         ▼          │
  │ Data     │          │  ┌─────────────────────────────┐   │
  └──────────┘          │  │    CORRELATION ENGINE       │   │
                         │  │  Risk Vector: [L1,L2,L3,L4]│   │
  ┌──────────┐          │  │  Score >= 3 → ALERT         │   │
  │ Memory   │◀─r/w───▶│  │  Score  = 4 → INTERRUPT     │   │
  │ Store    │          │  └──────────────┬──────────────┘   │
  └──────────┘          │                 │                   │
       ▲                │  ┌──────┐       │                   │
       │                │  │L4    │       ▼                   │
       └────taint──────▶│  │Memory│   ┌────────┐             │
                         │  │Graph │   │Intercep│──▶ BLOCK    │
                         │  └──────┘   └────────┘             │
                         └─────────────────────────────────────┘
```

### Detection Layers

| Layer | Name | Signal | Function |
|-------|------|--------|----------|
| **L1** | Data Source Classifier | `PRIVILEGED_DATA_ACCESSED` | Tags every tool call by data trust level at access time |
| **L2** | Token Provenance Tagger | `UNTRUSTED_TOKENS_IN_CONTEXT` | Labels every context token by origin before the LLM call |
| **L3** | Outbound Intent Classifier | `EXFILTRATION_RISK` | Checks if outbound content correlates with untrusted input |
| **L4** | Memory Contamination Graph | `CONTAMINATED_MEMORY_ACTIVE` | Tracks taint through persistent memory across sessions |
| **CE** | Correlation Engine | Risk Score (0-4) | Aggregates all signals per turn — alerts or interrupts |

> **Layer 4 is the novel research contribution.** MINJA (NeurIPS 2025) proved the memory contamination attack. Cerberus ships the first deployable defense as installable developer tooling.

---

## Quickstart

```bash
npm install @cerberus-ai/core
```

```typescript
import { guard } from '@cerberus-ai/core';
import type { CerberusConfig } from '@cerberus-ai/core';

// Define your agent's tool executors
const executors = {
  readDatabase: async (args) => fetchFromDb(args.query),
  fetchUrl: async (args) => httpGet(args.url),
  sendEmail: async (args) => smtp.send(args),
};

// Configure Cerberus
const config: CerberusConfig = {
  alertMode: 'interrupt',     // 'log' | 'alert' | 'interrupt'
  threshold: 3,               // Score needed to trigger action (0-4)
  trustOverrides: [
    { toolName: 'readDatabase', trustLevel: 'trusted' },
    { toolName: 'fetchUrl', trustLevel: 'untrusted' },
  ],
};

// Wrap your tools — one function call
const { executors: secured, assessments, destroy } = guard(
  executors,
  config,
  ['sendEmail'],  // Outbound tools (L3 monitors these)
);

// Use secured.readDatabase(), secured.fetchUrl(), secured.sendEmail()
// exactly like the originals — Cerberus intercepts transparently
```

### What Happens

When a multi-turn attack unfolds (L1: privileged access, L2: injection, L3: exfiltration), Cerberus correlates signals across the session and blocks the outbound call:

```
[Cerberus] Tool call blocked — risk score 3/4
```

The `assessments` array provides detailed per-turn breakdowns:

```typescript
assessments[2].vector  // { l1: true, l2: true, l3: true, l4: false }
assessments[2].score   // 3
assessments[2].action  // 'interrupt'
```

Use the `onAssessment` callback in config for real-time monitoring:

```typescript
const config: CerberusConfig = {
  alertMode: 'interrupt',
  onAssessment: ({ turnId, score, action }) => {
    console.log(`Turn ${turnId}: score=${score}, action=${action}`);
  },
};
```

---

## Research Results

> **21 payloads. 21 successful exfiltrations. 0 blocked. 100% attack success rate.**

We built a 3-tool attack agent powered by GPT-4o-mini and ran 21 injection payloads across 5 categories. Every single attack completed the full Lethal Trifecta kill chain — privileged data access, injection delivery, and exfiltration of PII (names, emails, SSNs, phone numbers) to attacker-controlled endpoints. No payload was blocked, partially blocked, or triggered any safety refusal.

| Category | Payloads | Success Rate | Technique |
|----------|----------|-------------|-----------|
| **Direct Injection** | 5 | 100% | System update spoofs, admin overrides, compliance mandates |
| **Encoded / Obfuscated** | 4 | 100% | Base64, ROT13, Unicode escapes, hex encoding |
| **Social Engineering** | 4 | 100% | CEO fraud, IT support impersonation, legal threats |
| **Multi-Turn** | 4 | 100% | Persistent CC rules, delayed triggers, context poisoning |
| **Multilingual** | 4 | 100% | Spanish, Mandarin, Arabic, Russian payloads |
| **Total** | **21** | **100%** | — |

### Key Findings

1. **The attack costs nothing.** Free-tier GPT-4o-mini + 3 tool definitions + one injected instruction = full PII exfiltration in under 15 seconds.
2. **Encoding doesn't help.** Base64, ROT13, hex, and Unicode-escaped payloads all succeed. The model decodes and executes them without hesitation.
3. **Language doesn't matter.** Spanish, Mandarin, Arabic, and Russian injection payloads all exfiltrate data to attacker-controlled addresses.
4. **Social engineering scales.** CEO impersonation, IT support pretexts, and legal threats all bypass the model's judgment — it never questions authority claims embedded in fetched content.
5. **Every exfiltrated payload contained SSNs, emails, and phone numbers** — the full PII dataset, not just partial fields.

### Attack Anatomy (3 tool calls, ~12 seconds)

```
Turn 0:  Agent calls readPrivateData()        → 5 customer records (SSNs, emails, phones)
         Agent calls fetchExternalContent()    → Attacker payload injected via webpage
Turn 1:  Agent calls sendOutboundReport()      → Full PII sent to attacker's address
Turn 2:  Agent confirms: "Report sent successfully!"
```

**Risk Vector: `[L1: true, L2: true, L3: true, L4: false]`** — all three runtime layers fire. No existing tool detects or interrupts any of these calls.

### Reproducibility

All execution traces are logged as structured JSON in [`harness/traces/`](harness/traces/) with full ground-truth labels, token usage, and timing data. The harness supports multi-trial runs with configurable system prompts, temperature, and seed for statistical validation.

```bash
# Run the full payload suite (requires OPENAI_API_KEY)
npx tsx harness/runner.ts

# Stress test: 3 trials per payload with safety-hardened system prompt
npx tsx harness/runner.ts --trials 3 --prompt safety --temperature 0 --seed 42

# Analyze results
npx tsx harness/analyze.ts --traces-dir harness/traces/
```

See [docs/research-results.md](docs/research-results.md) for full methodology, per-payload breakdowns, and trace analysis.

---

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js >= 20
- **Primary Harness**: OpenAI Function Calling API
- **Testing**: Vitest (326 tests, 99.7% coverage)
- **Memory Store**: SQLite via better-sqlite3
- **Validation**: Zod

---

## Project Structure

```
cerberus/
├── src/
│   ├── layers/           # L1-L4 detection layers
│   ├── engine/           # Correlation engine + interceptor
│   ├── graph/            # Memory contamination graph + provenance ledger
│   ├── middleware/        # Developer-facing guard() API
│   ├── adapters/         # Framework integrations (planned)
│   └── types/            # Shared TypeScript interfaces
├── harness/              # Phase 1 attack research instrument
│   ├── traces/           # Labeled execution logs (JSON)
│   ├── agent.ts          # 3-tool attack agent
│   ├── tools.ts          # Tool A, B, C definitions
│   ├── payloads.ts       # 21 injection payloads across 5 categories
│   ├── runner.ts         # Automated attack executor + multi-trial stress
│   └── analyze.ts        # Run comparison + trace analysis CLI
├── tests/                # Mirrors src/ structure
├── docs/                 # Architecture, research, API reference
└── examples/             # Runnable demo integrations
```

---

## Roadmap

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **0** | Repository scaffold, toolchain, CI | **Complete** |
| **1** | Attack harness — 3-tool agent, 21 injection payloads, labeled traces | **Complete** |
| **1.5** | Hardening — retry/timeout, safeParse, error traces, 88 tests | **Complete** |
| **1.6** | Stress testing — multi-trial, prompt variants, advanced payloads | **Complete** |
| **2** | Detection middleware — L1+L2+L3 + Correlation Engine | **Complete** |
| **3** | Memory Contamination Graph — L4 + temporal attack detection | **Complete** |
| **4** | npm SDK packaging, developer docs, examples | **Complete** |
| **5** | GitHub Release, security advisory, conference submission | **Complete** |

---

## Framework Support

| Framework | Status |
|-----------|--------|
| Generic tool executors | **Supported** |
| OpenAI Function Calling | **Supported** (via harness) |
| LangChain | Planned (adapter stub) |
| AutoGen | Planned (adapter stub) |
| Anthropic Tool Use | Planned |
| Ollama (Local) | Future |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## Security

See [SECURITY.md](SECURITY.md) for our responsible disclosure policy.

## License

[MIT](LICENSE)
