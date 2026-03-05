# Cerberus — Architecture

## Module Map

### Core Detection Layers

| Module            | Path                          | Purpose                                                                      |
| ----------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| **L1 Classifier** | `src/layers/l1-classifier.ts` | Tags tool calls by data trust level. Extracts PII from trusted tool results. |
| **L2 Tagger**     | `src/layers/l2-tagger.ts`     | Estimates token provenance for untrusted tool results.                       |
| **L3 Classifier** | `src/layers/l3-classifier.ts` | Detects PII in outbound tool arguments via substring correlation.            |
| **L4 Memory**     | `src/layers/l4-memory.ts`     | Tracks memory writes/reads. Detects cross-session contamination.             |

### Advanced Sub-Classifiers

| Module                    | Path                                   | Enhances | Purpose                                                                                                  |
| ------------------------- | -------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| **Secrets Detector**      | `src/classifiers/secrets-detector.ts`  | L1       | Detects leaked credentials (AWS keys, JWTs, private keys, connection strings)                            |
| **Injection Scanner**     | `src/classifiers/injection-scanner.ts` | L2       | Weighted heuristic prompt injection detection (role override, authority spoofing, exfiltration commands) |
| **Encoding Detector**     | `src/classifiers/encoding-detector.ts` | L2       | Detects encoded/obfuscated injection bypasses (base64, hex, unicode, URL encoding, ROT13)                |
| **MCP Poisoning Scanner** | `src/classifiers/mcp-scanner.ts`       | L2       | Scans MCP tool descriptions for hidden instructions, cross-tool manipulation, obfuscation                |
| **Domain Classifier**     | `src/classifiers/domain-classifier.ts`    | L3    | Flags suspicious outbound destinations: disposable emails, webhook services, IP addresses, social-engineering keyword domains (audit-partner.io, compliance-verify.net) |
| **Outbound Correlator**   | `src/classifiers/outbound-correlator.ts`  | L3    | Catches summarized/transformed exfiltration: fires when untrusted context + trusted data access + outbound to non-authorized destination, without requiring verbatim PII match |
| **Drift Detector**        | `src/classifiers/drift-detector.ts`       | L2/L3 | Detects behavioral drift after injection (outbound calls, privilege escalation, repeated exfiltration)   |

### Engine & Infrastructure

| Module                  | Path                         | Purpose                                                                                                     |
| ----------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Contamination Graph** | `src/graph/contamination.ts` | In-memory directed graph with BFS taint propagation and cycle detection.                                    |
| **Provenance Ledger**   | `src/graph/ledger.ts`        | SQLite-backed provenance store. Persists write history for audit.                                           |
| **Correlation Engine**  | `src/engine/correlation.ts`  | Aggregates signals into 4-bit risk vector, computes score, resolves action.                                 |
| **Interceptor**         | `src/engine/interceptor.ts`  | Wraps a single tool executor. Runs L1-L4 + sub-classifiers, feeds correlation engine.                       |
| **Session**             | `src/engine/session.ts`      | Per-session state container. Tracks PII, untrusted sources, secrets, injection patterns, tool call history. |
| **Guard API**           | `src/middleware/wrap.ts`     | Developer-facing `guard()` entry point. Manages lifecycle.                                                  |

## Data Flow

```
Tool call arrives
  → Interceptor executes the tool
  → L1: classify data source (trusted → extract PII → session.privilegedValues)
  → Secrets Detector: scan trusted result for leaked credentials (AWS keys, JWTs, etc.)
  → L2: tag token provenance (untrusted → session.untrustedSources)
  → Injection Scanner: scan untrusted content for prompt injection patterns
  → Encoding Detector: scan untrusted content for encoded/obfuscated payloads
  → MCP Scanner: check tool description for poisoning (if toolDescriptions configured)
  → L3: classify outbound intent (outbound + PII match → EXFILTRATION_RISK)
  → Domain Classifier: flag suspicious outbound destinations (known-bad lists + keyword heuristics)
  → Outbound Correlator: flag injection-correlated outbound to non-authorized dest (no verbatim match needed)
  → L4: check memory contamination (read tainted cross-session node → CONTAMINATED_MEMORY_ACTIVE)
  → Drift Detector: check for post-injection behavioral patterns (reads all session state)
  → Collect all session signals (cumulative across turns)
  → Correlation Engine: build vector, compute score, resolve action
  → If action=interrupt: return "[Cerberus] Tool call blocked" instead of result
  → Otherwise: return original tool result
```

## Key Design Decisions

- **Session-cumulative scoring**: The risk vector is built from ALL signals across the session, not just the current turn. This ensures multi-turn attacks (L1 on turn 0, L2 on turn 1, L3 on turn 2) are caught.
- **Sub-classifiers use existing layer tags**: All 7 sub-classifiers emit signals with L1/L2/L3 layer tags. The correlation engine's `buildRiskVector()` handles them via `signal.layer` switch — no changes needed to the scoring logic.
- **Sub-classifiers are pure functions**: Each receives `ToolCallContext` + `DetectionSession` and returns a typed signal or null. No side effects beyond session state updates.
- **Drift detector runs last**: It reads accumulated session state from all prior classifiers to detect behavioral patterns (post-injection outbound, privilege escalation, repeated exfiltration).
- **MCP scanner has two modes**: Standalone `scanToolDescriptions()` for registration-time scanning, and runtime `checkToolCallPoisoning()` triggered when `config.toolDescriptions` is set.
- **Graph does not persist to SQLite**: The contamination graph lives in-memory for process lifetime. The ledger handles persistence for audit. `reset()` preserves both; `destroy()` cleans up.
- **Trust classification is explicit**: Tools must be listed in `trustOverrides` as `'trusted'` or `'untrusted'` to trigger L1/L2. Unknown tools are ignored by default.
- **L4 is opt-in**: Memory tracking requires `config.memoryTracking: true` AND `memoryOptions.memoryTools` to be provided. Without both, L4 is completely skipped.

See the [README](../README.md) for the visual architecture diagram.
