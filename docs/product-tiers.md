# Cerberus Product Tiers

Date: 2026-03-28

This document defines the canonical Cerberus product ladder.

Use it when writing product copy, demos, roadmap docs, pricing language, and
deployment guidance. The rule is simple:

- prove Core first
- show Gateway as the deployment multiplier
- show Intelligence as the explanation layer
- show Enterprise / Control Plane as the governance layer

## Why This Exists

Cerberus becomes confusing when product copy blends the layers together.

This tier definition keeps the boundaries sharp so that:

- Core stays easy to adopt
- Gateway does not sound like a different security claim
- Intelligence does not sound like the live enforcement authority
- Enterprise / Control Plane does not get confused with the SDK

## Tier 1: Core

### What It Is

Cerberus Core is the embeddable runtime enforcement engine.

It is the product people should understand first:

- wrap tool execution
- detect the Lethal Trifecta at runtime
- interrupt guarded outbound actions before they execute

### Delivery

- `npm` package
- `PyPI` package

### Primary Buyer / User

- application developer
- staff engineer
- product security engineer

### Product Promise

Two lines of code. One risky workflow. One clear blocked outcome.

### Demo Role

The demo should always prove Core first:

- one believable attack story
- one runtime control point
- one protected vs unprotected contrast

### What Core Is Not

Core is not:

- a centralized routing plane
- an incident-analysis product
- an enterprise management console

## Tier 2: Gateway

### What It Is

Cerberus Gateway is the deployable enforcement surface for customers who want
centralized protection without wiring every application independently.

### Delivery

- Docker image
- cluster deployment
- VPC deployment
- future Helm / infra packaging where useful

### Primary Buyer / User

- platform engineering
- cloud security
- application security

### Product Promise

Same Core behavior, easier insertion into shared runtime paths.

### Demo Role

Gateway should appear as the scale-up story after Core:

- same runtime logic
- more services
- more centralized policy

### What Gateway Is Not

Gateway is not a new detection claim. It is the deployment multiplier for Core.

## Tier 3: Intelligence

### What It Is

Cerberus Intelligence is the explanation and tuning layer built on top of
runtime evidence produced by Core and Gateway.

Its job is to:

- explain what happened
- summarize the kill chain
- recommend policy or configuration improvements
- connect lightweight related-incident patterns

### Primary Buyer / User

- security operations
- incident response
- security engineering

### Product Promise

Turn runtime evidence into operator clarity.

### Demo Role

Intelligence should show up as a focused explanation panel, not a wall of
alerts.

### Guardrail

Intelligence must not own the final enforcement decision path.

### What Intelligence Is Not

Intelligence is not:

- the thing that blocks the live action
- a full SOC platform
- a full case-management suite in v1

## Tier 4: Enterprise / Control Plane

### What It Is

Cerberus Enterprise / Control Plane is the management and governance layer for
policy, evidence, reporting, and organization-wide runtime oversight.

### Primary Buyer / User

- CISO organization
- central security engineering
- GRC
- platform leadership

### Product Promise

Make Cerberus the system of record for runtime policy and evidence across the
organization.

### Demo Role

Enterprise / Control Plane should be framed as the organizational adoption
layer:

- policy management
- evidence workflows
- reporting and governance

### What Enterprise / Control Plane Is Not

It is not the first thing most customers need to understand or buy.

## Canonical Packaging Story

- Core = installable runtime enforcement engine
- Gateway = deployable enforcement surface
- Intelligence = AI-assisted explanation and tuning layer
- Enterprise / Control Plane = management and governance system

## Canonical Sequencing

1. Prove Core
2. Package Gateway
3. Add Intelligence
4. Grow into Enterprise / Control Plane

## Writing Rules

When describing Cerberus publicly:

- start with Core unless the audience already understands the base product
- do not imply Intelligence belongs inside Core
- do not imply Enterprise / Control Plane is the same thing as Gateway
- do not let the demo skip the Core proof moment
- do not let roadmap language blur current product boundaries

## Companion Docs

- [customer-deployment-model.md](/Users/dre/prod/cerberus/docs/customer-deployment-model.md)
- [workback-timeline.md](/Users/dre/prod/cerberus/docs/workback-timeline.md)
- [demo-storyboard.md](/Users/dre/prod/cerberus/docs/demo-storyboard.md)
