# Cerberus Execution Packages

Date: 2026-03-27

This document consolidates the current buildable work packages across three
critical lanes:

- Core truthfulness and package/release hardening
- upgraded demo implementation
- Intelligence MVP planning

It is intended to bridge strategy docs and board execution.

## Package 1: Core Truthfulness And Validation Reliability

### Goal

Make Cerberus Core and its public/research surface behave exactly the way the
product says it behaves.

### Why This Exists

The March 27 validation run proved that provider failures can make a benchmark
report unusable while still looking superficially like evidence.

### Immediate Scope

- provider preflight before validation runs
- surfaced provider error diagnostics in reports
- classify diagnostic failed runs separately from benchmark evidence
- normalize README, site, demo, and research claims to current evidence
- lock the Core boundary so higher-layer claims do not leak into Core

### Current Anchors

- [#27](https://github.com/Odingard/cerberus/issues/27)
- [#26](https://github.com/Odingard/cerberus/issues/26)
- [#9](https://github.com/Odingard/cerberus/issues/9)
- [#10](https://github.com/Odingard/cerberus/issues/10)
- [#11](https://github.com/Odingard/cerberus/issues/11)

### Buildable Tasks

1. Keep provider preflight mandatory by default.
2. Surface sample provider errors in console and markdown reports.
3. Require provider-by-provider sanity runs before any broad rerun.
4. Mark failed benchmark runs as diagnostic artifacts, not publishable evidence.
5. Clean Core-facing copy across README, site, demo, and release surfaces.
6. Fix broken demo references and public surface inconsistencies.

### Exit Criteria

- validation does not waste time on broken provider state
- Core claims are tied to current evidence
- package/release/install surfaces are aligned

## Package 2: Core Demo Upgrade

### Goal

Ship a stronger Core-first demo that proves the runtime control point clearly
before layering Gateway, Intelligence, or Enterprise messaging on top.

### Why This Exists

The current product story is strongest when it shows one believable attack, one
runtime control point, and one clear interrupted action.

### Current Anchors

- [#22](https://github.com/Odingard/cerberus/issues/22)
- [#25](https://github.com/Odingard/cerberus/issues/25)
- [demo-storyboard.md](/Users/dre/prod/cerberus/docs/demo-storyboard.md)
- [core-demo-spec.md](/Users/dre/prod/cerberus/docs/core-demo-spec.md)
- [demo-work-packages.md](/Users/dre/prod/cerberus/docs/demo-work-packages.md)

### Buildable Phases

**Phase 1: Canonical Core demo path**
- pick one scenario
- make unprotected vs protected contrast deterministic
- ensure the interrupt moment maps to current Core behavior

Likely files:
- [playground/src/scenarios.ts](/Users/dre/prod/cerberus/playground/src/scenarios.ts)
- [playground/src/server.ts](/Users/dre/prod/cerberus/playground/src/server.ts)
- [playground/public/index.html](/Users/dre/prod/cerberus/playground/public/index.html)
- [examples/demo-capture.ts](/Users/dre/prod/cerberus/examples/demo-capture.ts)

**Phase 2: Guided runtime canvas**
- one main runtime canvas
- one contextual detail panel
- inline L1/L2/L3 markers
- concise proof-driven copy

**Phase 3: Scene/state model**
- `setup`
- `unprotected_running`
- `unprotected_outcome`
- `protected_running`
- `blocked`
- `summary`

**Phase 4: Demo operational reliability**
- fix live demo surface
- keep recorded fallback
- unify references across repo/site/docs

**Later Layers**
- Gateway scale scene
- Intelligence explanation panel
- Enterprise outcome scene

### Exit Criteria

- Core-only demo is clear, stable, and believable
- demo can be shown live or as a reliable recorded fallback
- later product layers can be added without muddying the Core proof

## Package 3: Intelligence MVP

### Goal

Define and then build the first Intelligence layer that adds real value without
putting AI in the final enforcement loop.

### Why This Exists

Cerberus becomes more valuable when it can explain, recommend, and connect
incidents, not just block them.

### Current Anchors

- [#23](https://github.com/Odingard/cerberus/issues/23)
- [#20](https://github.com/Odingard/cerberus/issues/20)
- [customer-deployment-model.md](/Users/dre/prod/cerberus/docs/customer-deployment-model.md)
- [workback-timeline.md](/Users/dre/prod/cerberus/docs/workback-timeline.md)
- [intelligence-mvp-spec.md](/Users/dre/prod/cerberus/docs/intelligence-mvp-spec.md)

### MVP Scope

- incident summary
- kill-chain summary
- policy recommendation
- limited similar-incident linkage
- exportable explanation payload

### Explicit Non-Goals

- no AI-owned block decisions
- no full natural-language SOC console
- no identity or inventory features
- no full enterprise case management

### Required Inputs

- session id
- turn id
- per-turn signals
- final risk assessment
- execution outcome
- tool order
- trusted/untrusted context
- outbound destination
- matched exfiltration fields
- memory markers where present

### Recommended Build Sequence

1. define normalized incident/evidence contract
2. build explanation generator
3. build recommendation generator
4. build limited related-incident matcher
5. surface it in demo and minimal API/UI

### Exit Criteria

- Intelligence can explain one incident well
- recommendations are concrete and useful
- the feature is a clean upsell on top of Core/Gateway evidence

## Recommended Unified Execution Order

1. finish Core truthfulness lane
2. build canonical Core demo path
3. stabilize demo operations and references
4. define Intelligence incident/evidence contract
5. add Gateway scale and Intelligence panel to demo
6. build first Intelligence MVP service/UI slice

## Practical Rule

Do not let future-layer visuals or claims get ahead of current Core truth.

Core must stay accurate.
Gateway must stay believable.
Intelligence must add value without becoming noise.
