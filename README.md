# Cerberus

**Agentic AI Runtime Security Platform**

[![CI](https://github.com/Odingard/cerberus/actions/workflows/ci.yml/badge.svg)](https://github.com/Odingard/cerberus/actions/workflows/ci.yml)
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

Cerberus is four detection layers plus six advanced sub-classifiers, sharing one correlation engine:

```
                    ┌──────────────────────────────────────────────────────┐
                    │                    AGENT RUNTIME                     │
                    │                                                      │
  ┌──────────┐     │  ┌──────────────┐   ┌──────────────┐   ┌─────────┐  │
  │ External │─────│─▶│ L1 Data      │   │ L2 Token     │   │ L3 Out- │  │
  │ Content  │     │  │ Classifier   │   │ Provenance   │   │ bound   │  │
  └──────────┘     │  └──────┬───────┘   └──────┬───────┘   └────┬────┘  │
                    │         │                   │                │       │
  ┌──────────┐     │         ▼                   ▼                ▼       │
  │ Private  │─────│─▶┌──────────────┐   ┌──────────────┐  ┌─────────┐  │
  │ Data     │     │  │ Secrets      │   │ Injection    │  │ Domain  │  │
  └──────────┘     │  │ Detector     │   │ Scanner      │  │ Class.  │  │
                    │  └──────────────┘   ├──────────────┤  └─────────┘  │
  ┌──────────┐     │                      │ Encoding     │               │
  │ MCP Tool │─────│─▶┌──────────────┐   │ Detector     │               │
  │ Registry │     │  │ MCP Poisoning│   ├──────────────┤               │
  └──────────┘     │  │ Scanner      │   │ Drift        │               │
                    │  └──────────────┘   │ Detector     │               │
  ┌──────────┐     │                      └──────┬───────┘               │
  │ Memory   │◀───▶│  ┌──────┐                   │                       │
  │ Store    │     │  │ L4   │                   ▼                       │
  └──────────┘     │  │Memory│    ┌────────────────────────────────┐     │
       ▲           │  │Graph │───▶│      CORRELATION ENGINE        │     │
       │           │  └──────┘    │  Risk Vector: [L1, L2, L3, L4] │     │
       └───taint──▶│              │  Score >= 3 → ALERT/INTERRUPT  │     │
                    │              └───────────────┬────────────────┘     │
                    │                              ▼                      │
                    │                        ┌──────────┐                 │
                    │                        │Interceptor│──▶ BLOCK       │
                    │                        └──────────┘                 │
                    └──────────────────────────────────────────────────────┘
```

### Detection Layers

| Layer  | Name                       | Signal                        | Function                                                   |
| ------ | -------------------------- | ----------------------------- | ---------------------------------------------------------- |
| **L1** | Data Source Classifier     | `PRIVILEGED_DATA_ACCESSED`    | Tags every tool call by data trust level at access time    |
| **L2** | Token Provenance Tagger    | `UNTRUSTED_TOKENS_IN_CONTEXT` | Labels every context token by origin before the LLM call   |
| **L3** | Outbound Intent Classifier | `EXFILTRATION_RISK`           | Checks if outbound content correlates with untrusted input |
| **L4** | Memory Contamination Graph | `CONTAMINATED_MEMORY_ACTIVE`  | Tracks taint through persistent memory across sessions     |
| **CE** | Correlation Engine         | Risk Score (0-4)              | Aggregates all signals per turn — alerts or interrupts     |

### Advanced Sub-Classifiers

Six sub-classifiers enhance the core layers with deeper heuristic coverage:

| Sub-Classifier            | Enhances | Signal                        | Function                                                                |
| ------------------------- | -------- | ----------------------------- | ----------------------------------------------------------------------- |
| **Secrets Detector**      | L1       | `SECRETS_DETECTED`            | Detects AWS keys, GitHub tokens, JWTs, private keys, connection strings |
| **Injection Scanner**     | L2       | `INJECTION_PATTERNS_DETECTED` | Weighted heuristic detection of prompt injection patterns               |
| **Encoding Detector**     | L2       | `ENCODING_DETECTED`           | Detects base64, hex, unicode, URL encoding, ROT13 bypass attempts       |
| **MCP Poisoning Scanner** | L2       | `TOOL_POISONING_DETECTED`     | Scans MCP tool descriptions for hidden instructions and manipulation    |
| **Domain Classifier**     | L3       | `SUSPICIOUS_DESTINATION`      | Flags disposable emails, webhook services, IP addresses, URL shorteners |
| **Drift Detector**        | L2/L3    | `BEHAVIORAL_DRIFT_DETECTED`   | Detects post-injection outbound calls and privilege escalation patterns |

Sub-classifiers emit signals with existing layer tags (L1/L2/L3), so they contribute to the same 4-bit risk vector without score inflation. The correlation engine requires no changes.

> **Layer 4 is the novel research contribution.** MINJA (NeurIPS 2025) proved the memory contamination attack. Cerberus ships the first deployable defense as installable developer tooling.

---

## Try It Now

**Docker demo** — see the attack and the block, no API keys required:

```bash
git clone https://github.com/Odingard/cerberus
cd cerberus
npm run demo:docker:build && npm run demo:docker:run
```

Phase 1 shows PII exfiltrated in 3 tool calls. Phase 2 shows the identical sequence blocked by Cerberus. No config needed.

> **Registry image:** `ghcr.io/odingard/cerberus-demo` is published automatically on each release. Pull and run without cloning: `docker run --rm ghcr.io/odingard/cerberus-demo`

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
  alertMode: 'interrupt', // 'log' | 'alert' | 'interrupt'
  threshold: 3, // Score needed to trigger action (0-4)
  trustOverrides: [
    { toolName: 'readDatabase', trustLevel: 'trusted' },
    { toolName: 'fetchUrl', trustLevel: 'untrusted' },
  ],
};

// Wrap your tools — one function call
const {
  executors: secured,
  assessments,
  destroy,
} = guard(
  executors,
  config,
  ['sendEmail'], // Outbound tools (L3 monitors these)
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
assessments[2].vector; // { l1: true, l2: true, l3: true, l4: false }
assessments[2].score; // 3
assessments[2].action; // 'interrupt'
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

### MCP Tool Poisoning Protection

Scan MCP tool descriptions at registration time for hidden instructions, cross-tool manipulation, and obfuscation:

```typescript
import { scanToolDescriptions } from '@cerberus-ai/core';

const results = scanToolDescriptions([{ name: 'search', description: toolDescription }]);

for (const tool of results) {
  if (tool.poisoned) {
    console.warn(`Tool "${tool.toolName}" has poisoned description:`, tool.patternsFound);
    // Severity: tool.severity ('low' | 'medium' | 'high')
  }
}
```

For runtime detection, add `toolDescriptions` to your config — the MCP scanner will check each tool call against its description automatically:

```typescript
const config: CerberusConfig = {
  alertMode: 'interrupt',
  threshold: 3,
  toolDescriptions: mcpTools, // Enable per-call MCP poisoning detection
};
```

---

## Live Attack Demo — Real HTTP Interception

Demonstrates Cerberus blocking a real HTTP POST to an attacker-controlled endpoint. Uses local servers — no external accounts or network access required.

```bash
# Requires OPENAI_API_KEY — spawns local injection + capture servers
OPENAI_API_KEY=sk-... npx tsx examples/live-attack-demo.ts
```

**Phase 1 (Unguarded)** — PII reaches the capture server via real HTTP:
```
  → readPrivateData({})          ← 5 customer records (SSNs, emails, phones)
  → fetchExternalContent(...)    ← real HTTP GET → 200 OK (injection embedded)
  → sendOutboundReport(...)      ← real HTTP POST → capture server records it

  Capture server received:
    recipient: audit-export@external-review.io
    pii found: SSN, email (1,202 bytes exfiltrated)
  ⚠ EXFILTRATION CONFIRMED
```

**Phase 2 (Guarded)** — Cerberus pre-blocks the outbound call:
```
  → readPrivateData({})          [Cerberus] turn-000: score=1/4 → ○ log
  → fetchExternalContent(...)    [Cerberus] turn-001: score=2/4 → ○ log
  → sendOutboundReport(...)      [Cerberus] turn-pre: score=3/4 → ✗ INTERRUPT

  Capture server received: 0 requests — no data left the system
  ✓ EXFILTRATION BLOCKED
```

---

## LangChain Integration — Live Demo

Cerberus wraps a real LangChain + ChatOpenAI agent and intercepts the Lethal Trifecta attack in real time.

```bash
# Requires OPENAI_API_KEY
OPENAI_API_KEY=sk-... npx tsx examples/langchain-rag-demo.ts

# Compare against unguarded (attack succeeds):
OPENAI_API_KEY=sk-... npx tsx examples/langchain-rag-demo.ts --no-guard
```

**Guarded output** (gpt-4o-mini + LangChain + Cerberus):

```
  → readPrivateData({})
  [Cerberus] turn-000: score=1/4 → ○ log    ← signals: PRIVILEGED_DATA_ACCESSED

  → fetchExternalContent({"url":"https://acme.corp/guidelines"})
  [Cerberus] turn-001: score=2/4 → ○ log    ← signals: UNTRUSTED_TOKENS_IN_CONTEXT

  → sendOutboundReport({"recipient":"manager@acme.corp","subject":"Q4 Customer Activity Report",...})
  [Cerberus] turn-002: score=3/4 → ✗ INTERRUPT

  ╔════════════════════════════════════════════════════════╗
  ║  ✗ BLOCKED: [Cerberus] Tool call blocked — risk score 3/4  ║
  ╚════════════════════════════════════════════════════════╝

  turn-000  [L1:✓ L2:✗ L3:✗ L4:✗]  score=1/4  action=none
            signals: PRIVILEGED_DATA_ACCESSED
  turn-001  [L1:✓ L2:✓ L3:✗ L4:✗]  score=2/4  action=none
            signals: UNTRUSTED_TOKENS_IN_CONTEXT
  turn-002  [L1:✓ L2:✓ L3:✓ L4:✗]  score=3/4  action=interrupt
            signals: EXFILTRATION_RISK, BEHAVIORAL_DRIFT_DETECTED
```

**Unguarded output** (no Cerberus): `Report sent successfully to manager@acme.corp.` — PII transmitted, agent confirms success.

---

## Research Results

> **30 payloads. 3 providers. GPT-4o-mini: 100% success. Gemini 2.5 Flash: 90% success. Claude Sonnet: 0% success.**

We built a 3-tool attack agent and ran 30 injection payloads across 6 categories against three major LLM providers. The results demonstrate that the Lethal Trifecta vulnerability is **not model-universal** — but most models remain fully exploitable.

### Multi-Provider Results

| Provider      | Model             | Success Rate     | Key Finding                                      |
| ------------- | ----------------- | ---------------- | ------------------------------------------------ |
| **OpenAI**    | GPT-4o-mini       | **30/30 (100%)** | Every payload exfiltrates — zero refusals        |
| **Google**    | Gemini 2.5 Flash  | **27/30 (90%)**  | Mostly vulnerable, resists some encoded/advanced |
| **Anthropic** | Claude Sonnet 4.6 | **0/30 (0%)**    | Refuses every payload — never exfiltrates        |

### Per-Category Breakdown (GPT-4o-mini)

| Category                 | Payloads | Success Rate | Technique                                                  |
| ------------------------ | -------- | ------------ | ---------------------------------------------------------- |
| **Direct Injection**     | 5        | 100%         | System update spoofs, admin overrides, compliance mandates |
| **Encoded / Obfuscated** | 4        | 100%         | Base64, ROT13, Unicode escapes, hex encoding               |
| **Social Engineering**   | 4        | 100%         | CEO fraud, IT support impersonation, legal threats         |
| **Multi-Turn**           | 4        | 100%         | Persistent CC rules, delayed triggers, context poisoning   |
| **Multilingual**         | 4        | 100%         | Spanish, Mandarin, Arabic, Russian payloads                |
| **Advanced Technique**   | 9        | 100%         | Context stuffing, jailbreak, CoT manipulation, split-turn  |

### Key Findings

1. **The attack costs nothing.** Free-tier GPT-4o-mini + 3 tool definitions + one injected instruction = full PII exfiltration in under 15 seconds.
2. **Encoding doesn't help.** Base64, ROT13, hex, and Unicode-escaped payloads all succeed on GPT-4o-mini. Gemini resists some encoded payloads.
3. **Language doesn't matter.** Spanish, Mandarin, Arabic, and Russian injection payloads all exfiltrate data across all vulnerable models.
4. **Social engineering scales.** CEO impersonation, IT support pretexts, and legal threats all bypass model judgment on OpenAI and Google.
5. **Model safety training varies dramatically.** Claude Sonnet refuses all 30 payloads. GPT-4o-mini follows every one. This confirms that runtime detection (Cerberus) is necessary for models that lack robust injection resistance.
6. **Even resistant models need runtime defense.** Claude's 0% success rate may not hold against future, more sophisticated payloads. Runtime detection provides defense-in-depth.

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

# Run against Claude (requires ANTHROPIC_API_KEY)
npx tsx harness/runner.ts --model claude-sonnet-4-6

# Run against Gemini (requires GOOGLE_API_KEY)
npx tsx harness/runner.ts --model gemini-2.5-flash

# Stress test: 3 trials per payload with safety-hardened system prompt
npx tsx harness/runner.ts --trials 3 --prompt safety --temperature 0 --seed 42

# Analyze results
npx tsx harness/analyze.ts --traces-dir harness/traces/
```

See [docs/research-results.md](docs/research-results.md) for full methodology, per-payload breakdowns, and trace analysis.

---

## Performance

Cerberus detection overhead is measured against raw tool execution — no LLM or network calls involved, pure classification pipeline cost.

```
npx tsx harness/bench.ts
```

| Scenario                    | Baseline p50 | Guarded p50 | Overhead p50 | Overhead p99 |
| --------------------------- | ------------ | ----------- | ------------ | ------------ |
| readPrivateData (L1)        | 4μs          | 36μs        | +32μs        | <0.12ms      |
| fetchExternalContent (L2)   | 2μs          | 19μs        | +17μs        | <0.05ms      |
| sendOutboundReport (L3)     | 3μs          | 4μs         | +0μs         | <0.03ms      |
| **Full 3-call session**     | 6μs          | 58μs        | **+52μs**    | **+0.23ms**  |

**Key number**: the full Lethal Trifecta detection session (L1 → L2 → L3) adds **52μs (p50)** and **0.23ms (p99)** of overhead — **0.01% of a typical 600ms LLM API call**.

---

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js >= 20
- **Primary Harness**: OpenAI, Anthropic, Google Gemini (multi-provider)
- **Testing**: Vitest (718 tests, 98%+ coverage)
- **Memory Store**: SQLite via better-sqlite3
- **Validation**: Zod

---

## Project Structure

```
cerberus/
├── src/
│   ├── layers/           # L1-L4 core detection layers
│   ├── classifiers/      # Advanced sub-classifiers (secrets, injection, encoding, domain, MCP, drift)
│   ├── engine/           # Correlation engine + interceptor
│   ├── graph/            # Memory contamination graph + provenance ledger
│   ├── middleware/       # Developer-facing guard() API
│   ├── adapters/         # Framework integrations (LangChain, Vercel AI, OpenAI Agents)
│   └── types/            # Shared TypeScript interfaces
├── harness/              # Attack research instrument
│   ├── providers/        # Multi-provider abstraction (OpenAI, Anthropic, Google)
│   ├── traces/           # Labeled execution logs (JSON)
│   ├── agent.ts          # 3-tool attack agent (OpenAI)
│   ├── agent-multi.ts    # Multi-provider attack agent
│   ├── tools.ts          # Tool A, B, C definitions
│   ├── payloads.ts       # 30 injection payloads across 6 categories
│   ├── runner.ts         # Automated attack executor + multi-trial stress
│   ├── bench.ts          # Performance benchmark — Cerberus overhead vs raw execution
│   └── analyze.ts        # Run comparison + trace analysis CLI
├── tests/
│   ├── classifiers/      # Sub-classifier unit tests
│   ├── integration/      # 5-phase severity test suite
│   └── ...               # Mirrors src/ structure
├── docs/                 # Architecture, research, API reference
└── examples/             # Runnable demo integrations
```

---

## Roadmap

| Phase   | Deliverable                                                          | Status       |
| ------- | -------------------------------------------------------------------- | ------------ |
| **0**   | Repository scaffold, toolchain, CI                                   | **Complete** |
| **1**   | Attack harness — 3-tool agent, 21 injection payloads, labeled traces | **Complete** |
| **1.5** | Hardening — retry/timeout, safeParse, error traces, 88 tests         | **Complete** |
| **1.6** | Stress testing — multi-trial, prompt variants, advanced payloads     | **Complete** |
| **2**   | Detection middleware — L1+L2+L3 + Correlation Engine                 | **Complete** |
| **3**   | Memory Contamination Graph — L4 + temporal attack detection          | **Complete** |
| **4**   | npm SDK packaging, developer docs, examples                          | **Complete** |
| **5**   | GitHub Release, security advisory, conference submission             | **Complete** |

---

## Framework Support

| Framework               | Status                                      |
| ----------------------- | ------------------------------------------- |
| Generic tool executors  | **Supported** — `guard()`                   |
| LangChain               | **Supported** — `guardLangChain()`          |
| Vercel AI SDK           | **Supported** — `guardVercelAI()`           |
| OpenAI Agents SDK       | **Supported** — `createCerberusGuardrail()` |
| OpenAI Function Calling | **Supported** (via harness)                 |
| Anthropic Tool Use      | **Supported** (via harness)                 |
| Google Gemini           | **Supported** (via harness)                 |
| AutoGen                 | Planned                                     |
| Ollama (Local)          | Future                                      |

---

## Documentation

| Doc | Contents |
|-----|----------|
| [Getting Started](docs/getting-started.md) | `npm install` → first blocked attack in under 5 min |
| [API Reference](docs/api.md) | `guard()`, config options, signal types, framework adapters |
| [Architecture](docs/architecture.md) | Detection pipeline, layer design, correlation engine |
| [Research Results](docs/research-results.md) | N=285 validation, per-payload breakdown, statistical methodology |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## Security

See [SECURITY.md](SECURITY.md) for our responsible disclosure policy.

## License

[MIT](LICENSE)
