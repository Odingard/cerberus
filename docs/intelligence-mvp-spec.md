# Cerberus Intelligence MVP Spec

Date: 2026-03-27

Cerberus Intelligence should make runtime evidence easier to understand and act
on. It should not own final enforcement decisions.

## Product Role

Cerberus Intelligence is an interpretation layer on top of Core and Gateway
runtime evidence.

Its job is to:

- explain what happened
- recommend how to harden policy or configuration
- connect related incidents at a lightweight level

Its job is not to:

- decide whether to block a live action
- replace deterministic runtime enforcement
- become a full SOC or case-management platform in v1

## MVP Outcome

For one blocked or high-risk runtime incident, Cerberus Intelligence should be
able to generate a useful operator-facing summary from structured evidence.

## MVP Capabilities

### 1. Incident Summary

Generate a concise explanation of:

- what the agent was trying to do
- what untrusted content influenced the flow
- what sensitive data was in scope
- what outbound action was attempted
- what Cerberus did

### 2. Kill-Chain Summary

Turn tool-call evidence into a simple attack narrative:

- privileged data read
- untrusted content ingested
- risk accumulated across the session
- outbound attempt triggered
- interrupt or log outcome recorded

### 3. Policy Recommendation

Generate one or more targeted recommendations such as:

- mark a tool as trusted or untrusted
- tighten outbound destinations
- enable memory tracking
- change session handling
- review a threshold or alert mode

### 4. Limited Related-Incident Linkage

For v1, this can stay simple:

- same destination family
- same payload family
- same tool sequence
- same risk pattern

## Required Evidence Contract

Before Intelligence can work well, Cerberus needs a normalized incident
envelope.

### Minimum Required Fields

- `incidentId`
- `sessionId`
- `turnId`
- `timestamp`
- `toolSequence`
- `trustedSources`
- `untrustedSources`
- `signals`
- `riskVector`
- `riskScore`
- `action`
- `executionOutcome`
- `outboundDestination`
- `exfiltrationFields`
- `memoryMarkers`

### Nice-To-Have Fields

- tenant or environment id
- framework/adapter id
- scenario label
- matched heuristic patterns
- original policy snapshot

## Proposed Output Shape

```ts
type IntelligenceSummary = {
  incidentId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  summary: string;
  killChain: string[];
  recommendations: string[];
  relatedSignals: string[];
};
```

## Build Sequence

### Phase 1: Incident Envelope

Add or normalize the structured data required to describe one incident cleanly.

### Phase 2: Explanation Generator

Build deterministic or bounded-AI generation for:

- title
- summary
- kill-chain bullets

### Phase 3: Recommendation Generator

Map evidence patterns to configuration and policy suggestions.

### Phase 4: Related-Incident Matcher

Start with simple deterministic linking against prior evidence.

### Phase 5: Surface Integration

Show the output in:

- the upgraded demo
- a minimal API response
- later, Gateway or Enterprise views

## Implementation Guardrails

1. Do not let Intelligence become the live enforcement authority.
2. Prefer structured evidence over inferred free text.
3. Keep the output short, useful, and operator-oriented.
4. Treat explanation quality as product value, not alert volume.
5. Keep v1 narrow and excellent.

## Exit Criteria

- one incident can be explained clearly from Cerberus evidence
- recommendations are concrete and plausibly useful
- the feature feels like an upgrade on top of Core, not a distraction from it
