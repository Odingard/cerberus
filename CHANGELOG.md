# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.1] — 2026-03-04
<!-- Grafana dashboard + Prometheus alerting + Alertmanager -->

### Added

- **Prometheus alerting rules** (`monitoring/alerts.yml`) — 6 rules: `CerberusLethalTrifectaDetected` (critical, any blocked call), `CerberusBlockRateCritical` (critical, >50% for 1 min), `CerberusBlockRateHigh` (warning, >10% for 2 min), `CerberusRiskScoreElevated` (warning, avg score ≥2 for 10 min), `CerberusHighCallVolume` (warning, >100 calls/sec for 5 min), `CerberusMetricsMissing` (warning, no metrics for 5 min)
- **Alertmanager** (`monitoring/alertmanager.yml`) — routes alerts; log-only by default; commented templates for Slack, PagerDuty, email; severity-based routing; critical security alerts repeat every hour
- **Alertmanager datasource** auto-provisioned in Grafana — alerts visible in Grafana Alerting tab
- **Grafana monitoring dashboard** — pre-built dashboard with 14 panels covering call rate, block rate, risk score distribution, per-tool breakdown, and action classification; auto-provisioned via `monitoring/docker-compose.yml` (OTel Collector + Prometheus + Grafana); no login required; one-command start: `docker compose -f monitoring/docker-compose.yml up -d`

## [0.3.0] — 2026-03-04

### Added

- **OpenTelemetry instrumentation** — opt-in via `opentelemetry: true` in `CerberusConfig`; emits one `cerberus.tool_call` span per tool call with attributes (tool name, session/turn IDs, risk score, action, blocked flag, signals detected, duration ms) and updates three metrics (`cerberus.tool_calls.total`, `cerberus.tool_calls.blocked` counters; `cerberus.risk_score` histogram); zero overhead when disabled; `@opentelemetry/api` is a no-op singleton when no SDK is configured; 14 new tests (747 total)
- **Proxy/gateway mode** (`createProxy`) — HTTP server that wraps tool backends with Cerberus detection; agents route calls to `POST /tool/:toolName` with no changes to agent source code; session state tracked via `X-Cerberus-Session` header; supports both HTTP upstream targets and local handler functions; `GET /health` endpoint; `X-Cerberus-Blocked: true` response header on 403 blocked responses; 15 new tests

## [0.2.1] — 2026-03-03

### Added

- **Scientific validation protocol** — causation scoring, negative controls, statistical rigor with Wilson CIs; 11 validation modules, 127 validation tests
- **Detection engine validation** (`--detect` flag) — wraps harness tool executors with `guard()` in `alertMode: 'log'`, measures TP/FP/FN/TN per layer across control and treatment groups, reports detection rate, block rate, and false positive rate with Wilson CIs
- **`authorizedDestinations`** config option — `CerberusConfig.authorizedDestinations?: readonly string[]` allows declaring expected outbound domain allowlist; L3 and drift detector skip for authorized destinations (mirrors production DLP/CASB patterns)
- 718 tests (127 additional since v0.2.0)
- **CFP draft updated** — Black Hat Arsenal abstract, DEF CON talk outline, and academic paper structure updated with multi-provider attack results (N=285 runs, Wilson 95% CIs), detection engine validation results (N=285 runs, 0% FP, L1/L2 100%), and 718 test count; status table added with March 13 Black Hat deadline
- **Multi-provider scientific validation results** (N=285 API calls, 3 trials × 30 payloads × 3 providers + 15 control): **Any exfiltration ~100%** across all three providers (all models send PII outbound under permissive prompts); **Full injection compliance** (injection redirects agent to attacker's address): OpenAI 17.8% [11.2%, 26.9%], Anthropic 2.2% [0.6%, 7.7%], Google 48.9% [38.8%, 59.0%]; 0 control exfiltrations; Wilson CIs; detection: L1/L2 100%, L3: 22.1% (OpenAI) / 2.1% (Anthropic) / 66.3% (Google), FP 0.0%

- **Live attack demo with real HTTP interception** (`examples/live-attack-demo.ts` + `harness/demo-servers.ts`) — spawns local injection server (attacker page with payload) and capture server (records exfiltration attempts); Phase 1 unguarded: 2 real HTTP POSTs captured including SSN+email; Phase 2 guarded: Cerberus pre-blocks outbound call via accumulated risk score — 0 requests reach capture server; confirmed with real GPT-4o-mini API calls
- **`demo:live` script** — `npm run demo:live` / `OPENAI_API_KEY=sk-... npx tsx examples/live-attack-demo.ts`
- **LangChain RAG agent demo** (`examples/langchain-rag-demo.ts`) — real-target integration using `@langchain/core` DynamicStructuredTool + `@langchain/openai` ChatOpenAI; demonstrates guard() intercepting a live GPT-4o-mini agent following an injection payload; `--no-guard` flag shows unguarded attack succeeding; confirmed on real API call: L1+L2+L3+drift → score 3/4 → BLOCKED
- **Performance benchmark harness** (`harness/bench.ts`) — measures Cerberus detection overhead vs raw tool execution across all 3 tools and the full 3-call L1→L2→L3 sequence; 1000 iterations + 100 warmup; results: p50=52μs overhead per session, p99=0.23ms, 0.01% of typical LLM call latency

### Changed

- Updated Gemini model from deprecated `gemini-2.0-flash` to `gemini-2.5-flash` in CLI examples
- L3 `classifyOutboundIntent()` accepts optional `authorizedDestinations` — returns null when destination domain is in the allowlist
- Drift detector `detectBehavioralDrift()` accepts optional `authorizedDestinations` — `checkPostInjectionOutbound` skips authorized destinations
- Interceptor passes `config.authorizedDestinations` to both L3 and drift detector

## [0.2.0] — 2026-03-02

### Added

- **Secrets Detector** (L1 sub-classifier) — detects AWS keys, GitHub tokens, JWTs, private keys, connection strings, and generic API keys leaked in trusted tool results
- **Prompt Injection Scanner** (L2 sub-classifier) — weighted heuristic detection of role overrides, authority spoofing, instruction injection, exfiltration commands, and encoded payloads in untrusted content
- **Encoding/Obfuscation Detector** (L2 sub-classifier) — detects base64, hex, unicode, URL encoding, HTML entities, and ROT13 bypass attempts with decode verification
- **Suspicious Domain Classifier** (L3 sub-classifier) — flags disposable email providers, webhook/exfil services, IP addresses, URL shorteners, and non-standard ports in outbound destinations
- **MCP Tool Poisoning Scanner** (L2 + standalone) — scans MCP tool descriptions for hidden instructions, sensitive file references, cross-tool manipulation, data routing commands, and zero-width char obfuscation. Standalone `scanToolDescriptions()` API for registration-time scanning + runtime `checkToolCallPoisoning()` per-call
- **Behavioral Drift Detector** (L2/L3 sub-classifier) — detects post-injection outbound calls, repeated exfiltration attempts, and privilege escalation patterns across session history
- **5-phase integration test suite** — 48 tests covering integration, adversarial payloads, stress/edge cases, and maximum hardness full-pipeline regression
- **`toolDescriptions`** config option for runtime MCP tool poisoning detection
- **Session state extensions** — `detectedSecrets`, `injectionPatternsFound`, `toolCallHistory` fields for cross-turn sub-classifier correlation
- **591 tests** at 98.69% statement coverage, 94.7% branch coverage, 100% function coverage

### Changed

- **Interceptor pipeline** — wired all 6 sub-classifiers after their parent layers (L1→Secrets, L2→Injection+Encoding+MCP, L3→Domain, then Drift after all layers)
- Sub-classifiers emit signals with existing layer tags (L1/L2/L3) — correlation engine and risk vector unchanged

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

[0.2.0]: https://github.com/Odingard/cerberus/releases/tag/v0.2.0
[0.1.0]: https://github.com/Odingard/cerberus/releases/tag/v0.1.0
