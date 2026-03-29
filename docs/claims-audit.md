# Cerberus Claims Audit

Date: 2026-03-28

Current branch reference for this audit:

- commit `98b871b836af400913571bef80d2660fa8e32aae`

This document audits Cerberus public claims against the current repository,
tests, and checked-in evidence artifacts. The goal is simple: only claim what
the codebase and reproducible artifacts support today.

Primary sources reviewed in this pass:

- Current repository code and tests
- `docs/research-results.md`
- `docs/social-media-posts.md`
- `Documents/Lethal Trifecta Research Paper.pdf`
- `docs/evidence-inventory.md`

## Validation Baseline Status

Current branch validation should be interpreted in three buckets:

1. Historical evidence sets
   - the March 2026 paper
   - the March 13, 2026 525-run observe-only validation report

2. Diagnostic failure evidence
   - the March 27, 2026 full rerun at
     `harness/validation-traces/validation-report-2026-03-27T06-09-45.330Z.md`
   - this run is useful for debugging provider-state and harness reporting issues
   - it is not suitable as a benchmark citation

3. Post-fix provider sanity reruns
   - OpenAI minimal rerun at
     `harness/validation-traces/validation-report-2026-03-27T06-51-04.859Z.md`
   - Google minimal rerun at
     `harness/validation-traces/validation-report-2026-03-27T07-20-17.345Z.md`
   - Anthropic targeted reruns at
     `harness/validation-traces/validation-report-2026-03-27T08-02-40.373Z.md` and
     `harness/validation-traces/validation-report-2026-03-27T08-35-20.137Z.md`
   - these runs confirm the provider paths are healthy enough for targeted
     validation again after fixing quota/key issues and the Gemini preflight bug,
     but they still do not replace a fresh full current-branch benchmark set

4. Fresh current-branch stamped reruns
   - OpenAI attack-behavior rerun at
     `harness/validation-traces/validation-report-2026-03-28T13-35-35.359Z.md`
   - OpenAI observe-only detection rerun at
     `harness/validation-traces/validation-report-2026-03-28T13-52-25.775Z.md`
   - Google attack-behavior rerun at
     `harness/validation-traces/validation-report-2026-03-29T02-13-17.893Z.md`
   - Google observe-only detection rerun at
     `harness/validation-traces/validation-report-2026-03-29T02-37-47.733Z.md`
   - these runs are tied to commit `98b871b836af400913571bef80d2660fa8e32aae`
   - they improve the current-branch evidence story materially for OpenAI and
     Google, but they are still not the full refreshed benchmark set

Canonical index for these buckets:

- [evidence-inventory.md](/Users/dre/prod/cerberus/docs/evidence-inventory.md)

## Current State

Cerberus is strongest today as a runtime detection and enforcement layer for
agent tool use:

- It can wrap tool executors and correlate session-cumulative L1/L2/L3/L4 state.
- It can preflight-block outbound tool calls before side effects occur.
- It has a real proxy mode, adapter layer, startup validation, and regression tests.
- It now buffers stream-like tool results to a full turn boundary before inspection.

Cerberus is not yet a full agent inventory / identity plane / immutable audit
platform in the sense implied by some broader industry posts. It has parts of
that direction, but not the complete product surface today.

## Claim Matrix

| Claim | Current Status | Evidence / Notes | Recommended Public Framing |
|-------|----------------|------------------|----------------------------|
| Cerberus blocks outbound tool calls before side effects occur | Supported | `src/engine/interceptor.ts`, `tests/engine/interceptor.test.ts`, `tests/proxy/server.test.ts` | Safe to claim for guarded outbound execution paths |
| Cerberus maintains session-aware cumulative risk across tool calls | Supported | `src/engine/session.ts`, `src/engine/correlation.ts`, test coverage in middleware and proxy suites | Safe to claim |
| Cerberus offers zero-code gateway deployment | Supported | `src/proxy/server.ts`, `tests/proxy/server.test.ts` | Safe to claim |
| Cerberus supports OpenAI Agents SDK, LangChain, and Vercel AI integration | Supported | `src/adapters/`, adapter test suites | Safe to claim as adapter-level integration |
| Cerberus supports cross-session memory contamination detection | Supported with configuration caveat | L4 code exists and is tested, but requires explicit configuration and memory tooling alignment | Claim as "supports L4 memory contamination detection when enabled" |
| Cerberus prevents all data from ever leaving every deployment | Partially supported | Strong for tested guarded outbound flows; not universal across every integration shape or side effect outside wrapped tools | Use scenario-bounded language like "in the guarded demo / validated path" |
| Cerberus achieved 100% detection across 285 validated attack scenarios | Paper claim only until repo evidence is normalized | Present in the March 2026 paper, but not reconciled with `docs/research-results.md` or packaged repo artifacts yet | Keep as paper-specific claim until rerun evidence and artifact indexing are complete |
| Cerberus achieved N=525 provider benchmark results | Not normalized | Present in `docs/social-media-posts.md`, but not aligned with the current paper or repo docs | Do not use until evidence is reconciled and artifacts are indexed |
| Cerberus is a complete agent inventory / identity plane | Unsupported | Repo does not show discovery across environments or principal mapping | Do not claim |
| Cerberus provides immutable or on-chain runtime proof | Unsupported | No on-chain or cryptographic proof system in current product | Do not claim |
| Cerberus provides kernel-level sandboxing / process isolation | Unsupported | No seccomp, Landlock, or OS-level confinement in current repo | Do not claim |

## Supported Claims

These claims are supported by the current code and tests:

1. Cerberus blocks outbound tool calls before side effects occur when the
   correlated risk score triggers `interrupt`.
   Evidence:
   - `src/engine/interceptor.ts`
   - `tests/engine/interceptor.test.ts`
   - `tests/proxy/server.test.ts`

2. Cerberus maintains per-session cumulative detection state and can detect
   multi-turn sequences across multiple tool calls.
   Evidence:
   - `src/engine/session.ts`
   - `src/engine/correlation.ts`
   - `tests/middleware/wrap.test.ts`
   - `tests/proxy/server.test.ts`

3. Cerberus supports zero-code gateway deployment for tool routing via HTTP.
   Evidence:
   - `src/proxy/server.ts`
   - `tests/proxy/server.test.ts`

4. Cerberus provides framework adapters for LangChain, Vercel AI, and OpenAI
   Agents SDK.
   Evidence:
   - `src/adapters/`
   - adapter test suites under `tests/adapters/`

5. Cerberus supports L4 memory contamination tracking when explicitly enabled
   and configured.
   Evidence:
   - `src/layers/l4-memory.ts`
   - `src/graph/`
   - `tests/layers/l4-memory.test.ts`
   - `tests/middleware/wrap.test.ts`

6. Cerberus now handles stream-like tool output more safely by reconstructing a
   full turn before inspection.
   Evidence:
   - `src/engine/streaming.ts`
   - `tests/middleware/wrap.test.ts`

7. Cerberus now fails closed on several materially unsafe startup and proxy
   configuration states.
   Evidence:
   - `src/engine/config-validation.ts`
   - `src/middleware/wrap.ts`
   - `src/proxy/server.ts`
   - `tests/middleware/wrap.test.ts`
   - `tests/proxy/server.test.ts`

## Partially Supported Claims

These claims are directionally true but should be framed carefully:

1. "Zero bytes left the system."
   Status: supported for the guarded outbound execution paths we tested after
   the preflight-blocking hardening work. Not yet a universal claim across
   every possible integration shape, customer tool contract, or external side
   effect outside the wrapped outbound path.

2. "Runtime security for AI agents."
   Status: supported if defined as runtime detection/enforcement around tool
   execution, session state, proxy routing, and memory contamination. Too broad
   if interpreted as covering sandboxing, IAM privilege minimization, agent
   inventory, or universal response/orchestration controls.

3. "Works with OpenAI Agents SDK."
   Status: supported at the adapter level. Should be described as a tool
   guardrail integration backed by Cerberus runtime state, not a full
   platform-native enforcement model.

4. "Enterprise-ready observability / auditability."
   Status: partially supported. The repo includes telemetry, monitoring, and
   deployment material, but the strongest claims about immutable audit,
   enterprise-grade proof, or complete operational evidence should be tied to
   the actual shipped enterprise components and verified deployment paths.

5. "Cerberus validated 285 attack scenarios with 100% detection."
   Status: present in the March 2026 paper, but not yet normalized with the
   repo's other published numbers or cleanly mapped to a checked-in artifact
   index that makes the exact claim easy to verify from the repo alone.

## Unsupported Or Overstated Claims

These are the main areas where public language currently outpaces the checked-in
 evidence or current product scope:

1. The repo currently does not support treating Cerberus as a full agent
   inventory or identity-plane product.
   Not supported today:
   - discovering all agents across environments
   - mapping every agent to user principal / cloud identity
   - stripping standing privileges
   - full principal-to-action identity-plane enforcement

2. The repo does not support describing Cerberus as immutable/on-chain logging
   infrastructure.
   Not supported today:
   - on-chain state
   - cryptographic third-party verification of every runtime decision
   - protocol-native compliance proofs in the sense claimed by blockchain-first products

3. The repo does not support claiming kernel-level sandboxing or infrastructure
   isolation like OpenShell-style runtime confinement.
   Not supported today:
   - seccomp/Landlock sandboxing
   - kernel-level file/process/network isolation
   - credential injection boundaries enforced by OS isolation

## Evidence Mismatches In Public Materials

These should be corrected before strong public amplification:

1. The paper and repo docs currently describe materially different validation
   stories.
   - `Documents/Lethal Trifecta Research Paper.pdf` says:
     - `285` validated scenarios
     - `100%` overall detection
     - `0%` false positives
     - `52 microseconds` median latency
     - pre-exfiltration interruption in `100%` of Lethal Trifecta events
   - `docs/research-results.md` says:
     - same `N=285` run suite in observe-only mode
     - `31.9%` overall detection
     - `0%` false positives on `15` clean controls
     - `100%` L1 and L2 accuracy, with L3 only firing on unauthorized
       destinations

   These are not necessarily impossible to reconcile, but they currently read
   as different evaluation definitions and should not be mixed in public copy
   without explicit explanation.

2. `docs/research-results.md` contains internally inconsistent Anthropic claims:
   one section says Anthropic still showed low redirect success, while a later
   section says Claude refused all payloads. The latest March 27 targeted
   Anthropic rerun shows a mixed result profile instead: `1/55` success,
   `1/55` refusal, and `53/55` partial outcomes.

3. `docs/social-media-posts.md` cites `N=525` controlled runs with specific
   provider outcomes that are not aligned to the paper's `N=285` framing.

4. The checked-in artifact volume does not obviously back the strongest public
  numbers without additional explanation:
   - `harness/traces/` currently contains about 203 files
   - `harness/validation-traces/` currently contains about 42 files
   - multiple trace files are `ERROR` runs

This does not prove the research claims are false, but it does mean the repo is
not yet self-evident as the source of truth for those exact published numbers.

5. The March 27, 2026 full rerun should be treated as a diagnostic failure, not
   as benchmark evidence.
   - OpenAI and Google provider state were broken at the time of the run
   - the harness did not yet fail fast on bad provider conditions
   - subsequent targeted reruns on March 27 validated healthy OpenAI, Google,
     and Anthropic provider paths after fixes

## Research-Paper Deep Dive

The March 2026 "Lethal Trifecta" paper is much more coherent than the social
copy, and it should probably be treated as the current strongest research
source until the repo evidence is repackaged.

What the paper supports clearly:

- Cerberus is framed as a runtime security architecture for agentic AI.
- The Lethal Trifecta model is clearly defined.
- L1-L4 are described as a layered detection pipeline.
- The paper claims cross-session memory contamination detection as a novel L4
  primitive.
- The paper is explicit about limitations:
  - controlled environment with synthetic data
  - production validation still ongoing
  - multi-agent trust-boundary laundering only partially validated

Where caution is still warranted:

- The paper's `100% detection` language is stronger than the repo's current
  `observe-only` detection writeup.
- The paper's latency numbers are not currently tied to an obvious checked-in
  benchmark artifact set.
- The paper claims `immediate interrupt before the outbound action completes`,
  which now aligns better with the hardened interceptor semantics, but still
  needs current-branch evidence packaging if used in product claims.

## Industry Post Deep Dive

Below is the short version of how Cerberus aligns with the themes in the posts
you shared.

### Strong Alignment

- Indirect prompt injection as a structural runtime problem
- Need for deterministic enforcement rather than prompt-only defenses
- Need for runtime visibility into agent execution paths
- Need for guardrails around outbound actions and data movement

Cerberus is genuinely in this lane.

### Partial Alignment

- Logging, traceability, and execution-flow visibility
- Multi-agent coordination risk
- Runtime observability and operator visibility

Cerberus has meaningful pieces here, but should not yet present itself as the
single end-to-end answer to all of them.

### Weak Or No Alignment Today

- Global agent discovery / inventory across environments
- Identity-plane mapping of agents to human/cloud principals
- Standing-privilege stripping
- Immutable/on-chain proof systems
- Kernel sandboxing / infra confinement

Those are adjacent product categories, not current Cerberus core capabilities.

## Recommendation Order

1. Normalize all public numbers across `README`, `research-results`, social
   posts, website copy, and future papers.
   Tracking: issue `#9`
2. Inventory every trace artifact and map it to the claims it supports.
   Tracking: issue `#10`
3. Re-run the current validation harness on the current branch and stamp all
   outputs with date, model, version, config, and commit SHA.
   Tracking: issue `#11`
4. Rewrite external-facing claims so every number and guarantee is reproducible
   from repo or release artifacts.
