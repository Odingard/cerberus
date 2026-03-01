# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-03-01

### Added

- **L1 Data Source Classifier** — tags tool calls by data trust level, extracts PII (emails, SSNs, phone numbers) from trusted tool results
- **L2 Token Provenance Tagger** — estimates token provenance for untrusted tool results, labels context tokens by origin
- **L3 Outbound Intent Classifier** — detects PII exfiltration in outbound tool arguments via substring correlation
- **L4 Memory Contamination Graph** — tracks taint propagation through persistent memory across sessions with BFS traversal and cycle detection (novel research contribution)
- **Correlation Engine** — aggregates L1-L4 signals into a 4-bit risk vector, computes score (0-4), resolves action (none/log/alert/interrupt)
- **`guard()` API** — single-function developer entry point that wraps tool executors with the full detection pipeline
- **Interceptor** — per-tool-call wrapper that runs L1-L4 and feeds the correlation engine
- **Session management** — per-session state container tracking PII, untrusted sources, and cumulative signals
- **Provenance Ledger** — SQLite-backed (better-sqlite3) audit trail for memory write history
- **Attack harness** — 3-tool agent with 21 injection payloads across 5 categories (direct injection, encoded/obfuscated, social engineering, multi-turn, multilingual)
- **Research validation** — 100% attack success rate on GPT-4o-mini, all payloads complete the full Lethal Trifecta kill chain
- **Stress testing framework** — multi-trial runs with configurable system prompts, temperature, and seed
- **326 tests** at 99.7% code coverage
- **npm SDK packaging** — ESM exports, TypeScript declarations, `tsconfig.build.json`
- **Examples** — `basic-guard.ts` (Lethal Trifecta detection) and `memory-tracking.ts` (L4 cross-session contamination)
- **Documentation** — API reference, architecture guide, research results

[0.1.0]: https://github.com/YOUR_ORG/cerberus/releases/tag/v0.1.0
