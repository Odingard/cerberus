# Cerberus Demo Work Packages

Date: 2026-03-27

This document translates the upgraded demo storyboard into buildable
implementation slices.

The rule for this demo is simple:

- prove Core first
- keep the attack story singular and believable
- treat Gateway, Intelligence, and Enterprise as expansion layers

## Demo Objective

Show one reproducible attack path twice:

1. unprotected: the outbound action succeeds
2. protected with Cerberus Core: the guarded outbound action is interrupted

Everything else is secondary.

## Package 1: Canonical Core Scenario

### Outcome

One scenario becomes the canonical Cerberus proof path across the local demo,
playground, recorded fallback, and analyst briefing.

### User Story

An agent reads sensitive internal data, ingests untrusted external content, and
tries to send the resulting report outbound. Without Cerberus, the send
executes. With Cerberus, the guarded outbound action is interrupted before
execution.

### Likely Files

- [playground/src/scenarios.ts](/Users/dre/prod/cerberus/playground/src/scenarios.ts)
- [playground/src/server.ts](/Users/dre/prod/cerberus/playground/src/server.ts)
- [examples/demo-capture.ts](/Users/dre/prod/cerberus/examples/demo-capture.ts)
- [examples/live-attack-demo.ts](/Users/dre/prod/cerberus/examples/live-attack-demo.ts)

### Tasks

1. Pick one canonical scenario and freeze its inputs.
2. Make the protected and unprotected runs use the same story path.
3. Ensure the blocked moment is driven by current Core behavior, not extra UI logic.
4. Standardize scenario naming and narrative copy across scripts and playground.

### Exit Criteria

- one scenario is clearly the default Cerberus demo
- protected vs unprotected contrast is deterministic
- the scenario can be replayed locally without explanation drift

## Package 2: Guided Runtime Canvas

### Outcome

The demo UI shows one runtime timeline with inline security meaning instead of
an alert wall.

### Likely Files

- [playground/public/index.html](/Users/dre/prod/cerberus/playground/public/index.html)
- [playground/src/server.ts](/Users/dre/prod/cerberus/playground/src/server.ts)

### Tasks

1. Add a single main runtime canvas for tool-call progression.
2. Add a compact detail panel for current tool, signal, and destination context.
3. Show L1/L2/L3/L4 inline on the timeline where they fire.
4. Keep copy short and proof-driven.

### Exit Criteria

- the viewer can understand what happened in under 30 seconds
- the UI highlights action flow, not generic telemetry
- the interruption point is visually obvious

## Package 3: Scene And State Model

### Outcome

The demo runs as a controlled narrative rather than a loose collection of
widgets.

### Proposed States

- `setup`
- `unprotected_running`
- `unprotected_outcome`
- `protected_running`
- `blocked`
- `summary`

### Tasks

1. Define demo state transitions explicitly.
2. Make both script and playground reflect the same state progression.
3. Add reset/replay behavior so the demo can be shown repeatedly without drift.

### Exit Criteria

- demo progression is predictable
- replay behavior is stable
- recorded and live versions follow the same narrative sequence

## Package 4: Demo Operations

### Outcome

The demo remains credible even if the hosted surface is temporarily unstable.

### Tasks

1. Fix the hosted demo surface and deployment path.
2. Keep a recorded fallback that matches the live canonical scenario.
3. Remove or update any repo/site references that point to stale or broken demo surfaces.
4. Make the live and recorded demo reference the same product behavior.

### Exit Criteria

- no public link points to a broken or stale Cerberus demo
- there is always a reliable fallback for live sessions
- demo references are consistent across README, docs, and site copy

## Package 5: Gateway Upgrade Layer

### Outcome

The demo can show how the same Core behavior scales beyond a single in-process
integration.

### Tasks

1. Add a short scale scene after the Core proof.
2. Show multiple services or agents feeding one enforcement point.
3. Keep the message focused on deployment simplicity, not new security claims.

### Exit Criteria

- Gateway feels like a deployment multiplier, not a different product

## Package 6: Intelligence Upgrade Layer

### Outcome

The demo shows one high-value explanation panel instead of a dashboard full of
noise.

### Tasks

1. Add one incident summary panel after the blocked action.
2. Include:
   - what happened
   - why it mattered
   - what to change
   - whether related patterns exist
3. Keep the layer clearly framed as an upgrade on top of Core evidence.

### Exit Criteria

- Intelligence feels like clarity and action, not alert volume

## Recommended Build Order

1. Canonical Core scenario
2. Guided runtime canvas
3. Scene and state model
4. Demo operations
5. Gateway upgrade layer
6. Intelligence upgrade layer
