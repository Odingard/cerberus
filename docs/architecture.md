# Cerberus — Architecture

## Module Map

| Module | Path | Purpose |
|--------|------|---------|
| **L1 Classifier** | `src/layers/l1-classifier.ts` | Tags tool calls by data trust level. Extracts PII from trusted tool results. |
| **L2 Tagger** | `src/layers/l2-tagger.ts` | Estimates token provenance for untrusted tool results. |
| **L3 Classifier** | `src/layers/l3-classifier.ts` | Detects PII in outbound tool arguments via substring correlation. |
| **L4 Memory** | `src/layers/l4-memory.ts` | Tracks memory writes/reads. Detects cross-session contamination. |
| **Contamination Graph** | `src/graph/contamination.ts` | In-memory directed graph with BFS taint propagation and cycle detection. |
| **Provenance Ledger** | `src/graph/ledger.ts` | SQLite-backed provenance store. Persists write history for audit. |
| **Correlation Engine** | `src/engine/correlation.ts` | Aggregates signals into 4-bit risk vector, computes score, resolves action. |
| **Interceptor** | `src/engine/interceptor.ts` | Wraps a single tool executor. Runs L1-L4, feeds correlation engine. |
| **Session** | `src/engine/session.ts` | Per-session state container. Tracks PII, untrusted sources, signals. |
| **Guard API** | `src/middleware/wrap.ts` | Developer-facing `guard()` entry point. Manages lifecycle. |

## Data Flow

```
Tool call arrives
  → Interceptor executes the tool
  → L1: classify data source (trusted → extract PII → session.privilegedValues)
  → L2: tag token provenance (untrusted → session.untrustedSources)
  → L3: classify outbound intent (outbound + PII match → EXFILTRATION_RISK)
  → L4: check memory contamination (read tainted cross-session node → CONTAMINATED_MEMORY_ACTIVE)
  → Collect all session signals (cumulative across turns)
  → Correlation Engine: build vector, compute score, resolve action
  → If action=interrupt: return "[Cerberus] Tool call blocked" instead of result
  → Otherwise: return original tool result
```

## Key Design Decisions

- **Session-cumulative scoring**: The risk vector is built from ALL signals across the session, not just the current turn. This ensures multi-turn attacks (L1 on turn 0, L2 on turn 1, L3 on turn 2) are caught.
- **Graph does not persist to SQLite**: The contamination graph lives in-memory for process lifetime. The ledger handles persistence for audit. `reset()` preserves both; `destroy()` cleans up.
- **Trust classification is explicit**: Tools must be listed in `trustOverrides` as `'trusted'` or `'untrusted'` to trigger L1/L2. Unknown tools are ignored by default.
- **L4 is opt-in**: Memory tracking requires `config.memoryTracking: true` AND `memoryOptions.memoryTools` to be provided. Without both, L4 is completely skipped.

See the [README](../README.md) for the visual architecture diagram.
