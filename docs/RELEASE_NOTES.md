# Cerberus v0.1.0 — Release Notes

> First public release of the Cerberus Agentic AI Runtime Security Platform.

## What Is Cerberus?

Cerberus detects, correlates, and interrupts the **Lethal Trifecta** attack pattern — the fundamental vulnerability in every AI agent that can access private data, process external content, and take outbound actions.

It ships as a single `guard()` function that wraps your existing tool executors. No agent framework changes. No model swaps. One function call.

## What's Included

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

## Installation

```bash
npm install @cerberus-ai/core
```

## Quick Usage

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

## Key Research Findings

1. **The attack costs nothing.** Free-tier GPT-4o-mini + 3 tool definitions + one injected instruction = full PII exfiltration.
2. **Encoding doesn't help.** Base64, ROT13, hex, and Unicode-escaped payloads all succeed.
3. **Language doesn't matter.** Spanish, Mandarin, Arabic, and Russian payloads all exfiltrate data.
4. **Social engineering scales.** CEO impersonation, IT support pretexts, and legal threats all bypass model judgment.
5. **Layer 4 is novel.** No existing tool detects cross-session memory contamination attacks. Cerberus ships the first deployable defense.

## Documentation

- [API Reference](docs/api.md)
- [Architecture](docs/architecture.md)
- [Research Results](docs/research-results.md)
- [Security Policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)

## Examples

```bash
npx tsx examples/basic-guard.ts       # Lethal Trifecta detection demo
npx tsx examples/memory-tracking.ts   # L4 cross-session contamination demo
```

## Tech Stack

- TypeScript (strict mode), Node.js >= 20
- 326 tests, 99.7% coverage (Vitest)
- SQLite via better-sqlite3 (L4 provenance ledger)
- Zero runtime dependencies beyond better-sqlite3

## Breaking Changes

N/A — first release.

## License

[MIT](LICENSE)
