# Cerberus

**Agentic AI Runtime Security Platform**

[![CI](https://github.com/YOUR_ORG/cerberus/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/cerberus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@cerberus/core.svg)](https://www.npmjs.com/package/@cerberus/core)

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
npm install @cerberus/core
```

```typescript
import { cerberus } from '@cerberus/core';

// One line to secure your agent
const securedAgent = cerberus.guard(myAgent, {
  alertMode: 'interrupt',    // 'log' | 'alert' | 'interrupt'
  memoryTracking: true,      // Enable Layer 4
  logDestination: 'console'  // 'console' | 'file' | 'webhook'
});
```

### What You See

```
[Cerberus] ⚠️  ALERT — Turn 7
  Risk Score: 4/4 (CRITICAL)
  L1: PRIVILEGED_DATA_ACCESSED (customer_records.json)
  L2: UNTRUSTED_TOKENS_IN_CONTEXT (source: external_fetch)
  L3: EXFILTRATION_RISK (outbound content matches private field 'email')
  L4: CONTAMINATED_MEMORY_ACTIVE (session_2026-02-15, node: ext_fetch_3)
  Action: OUTBOUND TOOL CALL INTERRUPTED
  Trace: ./traces/turn-007-2026-02-28T14:32:00Z.json
```

---

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js >= 20
- **Primary Harness**: OpenAI Function Calling API
- **Testing**: Vitest
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
│   ├── middleware/        # Developer-facing cerberus.guard() API
│   ├── adapters/         # LangChain, AutoGen integrations
│   └── types/            # Shared TypeScript interfaces
├── harness/              # Phase 1 attack research instrument
│   ├── traces/           # Labeled execution logs (JSON)
│   ├── agent.ts          # 3-tool attack agent
│   ├── tools.ts          # Tool A, B, C definitions
│   ├── payloads.ts       # 20+ injection payload variants
│   └── runner.ts         # Automated attack executor
├── tests/                # Mirrors src/ structure
├── docs/                 # Architecture, research, API reference
└── examples/             # Runnable demo integrations
```

---

## Roadmap

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **0** | Repository scaffold, toolchain, CI | **Active** |
| 1 | Attack harness — 3-tool agent + injection runner + labeled traces | Planned |
| 2 | Detection middleware — L1+L2+L3 + Correlation Engine | Planned |
| 3 | Memory Contamination Graph — L4 + temporal attack detection | Planned |
| 4 | npm-installable SDK, developer docs, examples | Planned |
| 5 | GitHub Release, security advisory, DEF CON submission | Planned |

---

## Framework Support

| Framework | Status |
|-----------|--------|
| OpenAI Function Calling | Primary (Phase 1+) |
| Anthropic Tool Use | Phase 4 |
| LangChain | Phase 4 |
| AutoGen | Phase 4 |
| Ollama (Local) | Future |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## Security

See [SECURITY.md](SECURITY.md) for our responsible disclosure policy.

## License

[MIT](LICENSE)
