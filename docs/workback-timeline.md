# Cerberus Workback Timeline

Date: 2026-03-27

This document turns the current Cerberus strategy into an execution sequence
across evidence, packaging, demo, and Intelligence.

The goal is to keep building regardless of external meeting dates while still
respecting dependencies.

## Phase 0: Current Critical Path

Status:

- validation rerun in progress
- claims audit and evidence inventory started
- customer deployment model defined
- demo storyboard defined
- moat roadmap issues created on the board

Immediate dependency:

- fresh validation evidence from the hardened branch

## Phase 1: Evidence And Truth Alignment

Target Window:

- now through the next 1-2 weeks

Goals:

- finish the live validation rerun
- normalize public numbers across repo, docs, and website
- fix broken demo references and the live demo surface
- create one current benchmark table and one current evidence summary

Why First:

- product trust depends on this
- all outward-facing product work becomes easier once the evidence base is clean

Primary outputs:

- updated claim set
- current benchmark summary
- repaired or replaced demo URL
- analyst-safe and customer-safe truth baseline

## Phase 2: Packaging And Deployment Definition

Target Window:

- next 1-3 weeks

Goals:

- formalize product boundaries across Core, Gateway, Intelligence, and
  Enterprise / Control Plane
- define deployment topology options for each layer
- align buyer, operator, and environment ownership by layer
- make the land-and-expand path explicit

Why This Matters:

- packaging affects implementation choices
- deployment model affects customer adoption
- demo and Intelligence UX should reflect the real product layers

Primary outputs:

- product-layer definition
- deployment model
- customer-environment adoption map
- packaging alignment narrative

## Phase 3: Demo Upgrade Design To Build Plan

Target Window:

- next 2-4 weeks

Goals:

- convert the storyboard into a real implementation plan
- keep the demo focused on one runtime story, not alert sprawl
- map current product reality to future-layer representation
- decide what is fully functional versus illustrative in the upgraded demo

Why This Matters:

- the demo becomes the clearest expression of the product ladder
- it can sell Core, Gateway, and future Intelligence value in one flow

Primary outputs:

- scene-by-scene implementation plan
- component/state model
- demo copy and proof moments
- clear separation between current build and roadmap visualization

## Phase 4: Gateway And Demo Execution

Target Window:

- next 3-6 weeks

Goals:

- improve the production deployment story around Gateway
- implement the upgraded demo runtime flow
- ensure the demo reflects the hardened product accurately
- keep the demo stable enough for repeated customer use

Why This Matters:

- Gateway is the easiest enterprise insertion point
- demo execution must support actual selling, not just storytelling

Primary outputs:

- stronger Gateway deployment story
- upgraded demo build
- stable demo environment and fallback recorded flow

## Phase 5: First Intelligence-Layer MVP

Target Window:

- next 6-10 weeks

Goals:

- deliver the first real Intelligence-layer value on top of Cerberus evidence
- keep enforcement deterministic
- add explanation, recommendation, and pattern context

MVP recommendation:

- incident explanation
- kill-chain summary
- recommended policy/config improvements
- limited similar-incident or related-pattern context

Why This Matters:

- this is the first true upsell beyond blocking
- it increases operational dependence and product stickiness

Primary outputs:

- Intelligence MVP definition
- UX surface choice
- evidence input contract
- first implementation milestone

## Phase 6: Policy, Evidence, And System-Of-Record Growth

Target Window:

- next 8-12 weeks

Goals:

- make Cerberus the place where runtime policy and evidence accumulate
- create durable switching costs through history, policy, and exported proof

Primary outputs:

- saved policy profiles
- evidence bundles
- searchable incident/session lineage
- improved governance story

## Phase 7: Enterprise Gravity

Target Window:

- next 10-16+ weeks

Goals:

- build the management and governance layer that makes Cerberus an
  organizational control, not just an engineering tool

Primary outputs:

- control-plane foundations
- multi-team policy management
- reporting and evidence workflows
- clearer enterprise expansion path

## Recommended Execution Order

1. finish evidence alignment
2. finalize packaging and deployment definitions
3. turn demo storyboard into implementation plan
4. upgrade the demo and Gateway story
5. define and build Intelligence MVP
6. deepen policy/evidence system-of-record value
7. expand enterprise control-plane gravity

## Critical Dependencies

- fresh current-branch validation evidence should inform claim cleanup
- packaging decisions should inform the demo representation
- the upgraded demo should be designed before Intelligence MVP implementation
- Intelligence MVP should depend on stable runtime evidence inputs
- enterprise gravity should build on policy and evidence, not precede them

## Board Mapping

Use the board to track:

- evidence cleanup and claim normalization
- deployment model definition
- demo storyboard and implementation
- Intelligence MVP planning
- moat roadmap phases

This keeps strategy and execution connected.
