# Cerberus Demo Storyboard

Date: 2026-03-27

This storyboard defines the upgraded Cerberus demo as a guided runtime story
that grows from Core to Gateway to Intelligence to Enterprise / Control Plane.

The design goal is not "more alerts." The design goal is one clear attack story
that produces one clear security outcome and one valuable next step.

## Demo Principles

1. Show one believable attack, not a noisy dashboard.
2. Make the runtime path understandable in seconds.
3. Let Core provide the proof moment.
4. Let Gateway show scale.
5. Let Intelligence provide explanation and recommendation.
6. Let Enterprise show governance gravity without turning the demo into an
   admin console tour.

## Scene 1: Opening Risk

### Layer Highlighted

- Core

### Message

An agent with trusted data, untrusted content, and outbound actions is exposed
to runtime attack.

### What The User Sees

- agent goal
- trusted internal data source
- untrusted external content source
- outbound tool available to the agent
- simple protection mode toggle

### Why It Matters

This scene teaches the Lethal Trifecta visually without overwhelming the user.

## Scene 2: Attack Setup

### Layer Highlighted

- Core

### Message

The task looks ordinary before the runtime behavior changes.

### What The User Sees

- task prompt
- selected scenario
- tools in scope
- allowed / expected destination context
- a visible "run attack" call to action

### Why It Matters

This grounds the attack in a realistic operator workflow rather than a toy
prompt.

## Scene 3: Live Execution Timeline

### Layer Highlighted

- Core

### Message

Cerberus observes the exact tool path where content becomes action.

### What The User Sees

- step-by-step timeline
- private data read
- external content fetch
- hidden injection influence
- attempted outbound send
- inline L1 / L2 / L3 / L4 signal markers attached to the exact relevant step

### Why It Matters

This is where Cerberus proves runtime visibility rather than abstract policy.

## Scene 4: Decision Moment

### Layer Highlighted

- Core

### Message

Cerberus interrupts the outbound action before execution.

### What The User Sees

- outbound attempt
- unauthorized destination or correlated exfiltration condition
- interrupt fired
- protected vs unprotected comparison

### Why It Matters

This is the proof moment. The entire demo must be built to make this moment
clear and credible.

## Scene 5: Scale Story

### Layer Highlighted

- Gateway

### Message

The same protection does not have to be wired one service at a time.

### What The User Sees

- first, one app protected in-process
- then, multiple services or agents connected through a shared gateway
- one central enforcement surface protecting more than one workflow

### Why It Matters

This scene converts Cerberus from a library into a platform-worthy deployment
surface without changing the core story.

## Scene 6: Intelligence Summary

### Layer Highlighted

- Intelligence

### Message

Stopping the action is good. Explaining what happened and what to do next is
where value compounds.

### What The User Sees

One clean incident summary card or panel containing:

- what happened
- why Cerberus blocked it
- what data was at risk
- what destination or action was suspicious
- what policy or config change is recommended
- whether this resembles prior behavior

### Why It Matters

This is the premium upsell moment. It should feel like clarity and action, not
telemetry overload.

## Scene 7: Enterprise Outcome

### Layer Highlighted

- Enterprise / Control Plane

### Message

Policy, evidence, and oversight can scale across the organization.

### What The User Sees

- a concise governance snapshot
- policy status or rollout status
- evidence summary
- cross-team visibility flavor

### Why It Matters

This shows organizational gravity without burying the user in admin workflows.

## Recommended UX Structure

Instead of four separate noisy "views," structure the upgraded demo as one main
runtime canvas with one contextual side panel.

### Main Canvas

- scenario setup
- live execution timeline
- interrupt / block moment

### Contextual Side Panel

Adapts by demo step:

- setup context
- signal context
- intelligence explanation
- enterprise outcome summary

This keeps the demo focused and avoids alert-wall behavior.

## Intelligence Panel Design Rules

The Intelligence layer should provide only three high-value outputs:

1. Explain
   What happened and why it mattered.

2. Recommend
   What policy or config should change next.

3. Connect
   Whether the event is isolated or part of a broader pattern.

If the demo stays inside those three outputs, it will feel premium.

## Product-Layer Mapping

- Core = attack visibility + interrupt proof
- Gateway = scale and centralized enforcement
- Intelligence = explanation and next-best action
- Enterprise / Control Plane = policy, evidence, and organizational adoption

## Demo Outcome

The viewer should leave with this understanding:

1. AI agents can look normal while behaving dangerously at runtime.
2. Cerberus stops the action at the control point.
3. Cerberus scales from one app to many through Gateway.
4. Cerberus Intelligence explains the event and recommends hardening.
5. Cerberus Enterprise / Control Plane turns runtime protection into an
   organizational security capability.
