# Cerberus Customer Deployment Model

Date: 2026-03-27

This document defines how Cerberus is introduced into customer environments
across the four product layers:

- Core
- Gateway
- Intelligence
- Enterprise / Control Plane

For the canonical product-tier definition that complements this deployment
model, see [product-tiers.md](/Users/dre/prod/cerberus/docs/product-tiers.md).

The goal is simple: Cerberus should not "install itself." It should be deployed
into known customer control points with a clear ownership model.

## Deployment Principles

1. Cerberus deploys into existing customer runtime paths.
2. Each layer has a distinct deployment model.
3. Customers should be able to start small and expand without replacing their
   existing agent stack.
4. The product should become more centralized as customer maturity increases.

## Layer 1: Core

### What It Is

Cerberus Core is the embeddable runtime enforcement engine.

### Delivery Model

- `npm` package
- `PyPI` package

### How It Enters The Environment

The customer installs Core into the application or service that already runs
their agent workflow and wraps tool execution in code.

### Typical Owner

- application developer
- staff engineer
- security engineer embedded with a product team

### Where It Runs

- local development
- CI / staging
- production service process
- serverless function or worker

### Why Customers Adopt It

- lowest-friction path
- easiest way to prove runtime protection value
- best fit for one app, one service, or one risky workflow

### What Makes It Sticky

- lives directly in the execution path
- customer policy begins here
- difficult to remove once trusted in production

## Layer 2: Gateway

### What It Is

Cerberus Gateway is the centralized runtime enforcement surface for teams that
do not want to wire every application independently.

### Delivery Model

- Docker image
- Helm chart
- Kubernetes deployment manifests
- optional Terraform / cloud deployment examples

### How It Enters The Environment

The customer deploys Gateway into a known routing point:

- reverse proxy
- tool-routing service
- service-to-service enforcement point
- VPC or cluster-local security service

### Typical Owner

- platform engineering
- application security
- cloud security

### Where It Runs

- customer VPC
- Kubernetes cluster
- shared services environment
- on-prem or private cloud deployment

### Why Customers Adopt It

- centralizes enforcement
- reduces per-application integration burden
- creates a consistent control point across services

### What Makes It Sticky

- becomes the policy choke point
- scales across multiple services and teams
- easier to expand once one service is protected

## Layer 3: Intelligence

### What It Is

Cerberus Intelligence is the AI-assisted incident interpretation and hardening
layer built on top of runtime events, policy, and evidence already produced by
Core and Gateway.

### Delivery Model

- SaaS service
- private SaaS
- self-hosted service or enterprise add-on

### How It Enters The Environment

Intelligence does not replace the enforcement path. It consumes Cerberus event
data, sessions, evidence, and policy signals from Core and Gateway.

### Typical Owner

- security operations
- security engineering
- incident response
- platform security leadership

### Where It Runs

- vendor-hosted service
- customer-controlled VPC service
- enterprise self-hosted analytics tier

### Why Customers Adopt It

- incident explanation
- policy recommendations
- pattern discovery
- higher analyst productivity

### What Makes It Sticky

- customers begin to rely on Cerberus for understanding, not just blocking
- recommendations improve the local policy model over time
- incident knowledge accumulates inside the product

## Layer 4: Enterprise / Control Plane

### What It Is

Cerberus Enterprise / Control Plane is the management layer for policy,
evidence, reporting, and organization-wide runtime governance.

### Delivery Model

- SaaS control plane
- private SaaS
- self-hosted enterprise deployment
- on-prem deployment package where required

### How It Enters The Environment

The control plane is adopted after Core and/or Gateway are already generating
runtime data and policy needs have grown beyond a single team.

### Typical Owner

- CISO organization
- platform leadership
- GRC
- central application security team

### Where It Runs

- centralized management environment
- vendor SaaS or customer-hosted management plane

### Why Customers Adopt It

- shared policy management
- evidence and reporting
- governance workflows
- organization-wide visibility

### What Makes It Sticky

- becomes the system of record for runtime policy and evidence
- creates organizational dependencies beyond one app team
- aligns security, engineering, and governance stakeholders

## Customer-Environment Adoption Map

### Stage 1: Developer-Led Entry

Product:

- Core

Environment:

- one service
- one workflow
- development or staging first

Goal:

- prove Cerberus can detect or block consequential runtime behavior

Success Signal:

- first real protected workflow

### Stage 2: Production Service Rollout

Product:

- Core
- optional Gateway

Environment:

- one production service
- one business-critical workflow

Goal:

- prove Cerberus is stable in production

Success Signal:

- policy is stable and trusted

### Stage 3: Platform Expansion

Product:

- Gateway

Environment:

- multiple agent services
- shared platform or security ownership

Goal:

- centralize enforcement across services

Success Signal:

- one shared enforcement model adopted across teams

### Stage 4: Security Operations Adoption

Product:

- Gateway
- Intelligence

Environment:

- production across teams
- operational security involvement

Goal:

- explain incidents, tune policy, and reduce runtime risk over time

Success Signal:

- security teams use Cerberus during investigation and tuning workflows

### Stage 5: Enterprise Governance Adoption

Product:

- Enterprise / Control Plane

Environment:

- multi-team
- regulated or high-governance environments

Goal:

- make Cerberus part of AI runtime governance and evidence workflows

Success Signal:

- Cerberus becomes a standard control for agent runtime deployment

## Recommended Packaging Story

- Core = installable runtime enforcement engine
- Gateway = deployable enforcement surface
- Intelligence = AI-assisted security service layer
- Enterprise / Control Plane = management and governance system

This packaging keeps product boundaries clear and gives customers a natural
land-and-expand path.
