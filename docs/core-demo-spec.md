# Cerberus Core Demo Spec

Date: 2026-03-27

This spec defines what the Core-only Cerberus demo should show, without Gateway
or Intelligence layered on top.

The goal is simple:

Show that Cerberus Core sits inside the agent runtime and stops a dangerous
action before it executes.

## Demo Goal

The viewer should leave understanding three things:

1. The agent workflow looks normal until runtime behavior shifts.
2. Cerberus Core observes the exact tool path where that risk accumulates.
3. Cerberus Core interrupts the consequential outbound action before execution.

## Scope

The Core demo should not try to show:

- centralized policy management
- multi-service scale
- AI explanation workflows
- enterprise governance

Those belong to later product layers.

## Core Demo Flow

### Scene 1: Setup

Show:

- one agent task
- one trusted internal data source
- one untrusted external content source
- one outbound reporting or send tool

Goal:

Teach the runtime setup in under 10 seconds.

### Scene 2: Unprotected Run

Show:

- agent reads sensitive internal data
- agent fetches external content
- hidden injection influences subsequent behavior
- agent attempts outbound action
- exfiltration succeeds

Goal:

Make the risk concrete before Cerberus is introduced.

### Scene 3: Protected Run With Core

Show:

- same task
- same tools
- same data
- Core wrapping the runtime path
- inline L1 / L2 / L3 signals as the flow unfolds

Goal:

Demonstrate that Cerberus sees the runtime path, not just final output.

### Scene 4: Interrupt Moment

Show:

- outbound action attempted
- Cerberus interrupt triggered
- outbound executor prevented from running

Goal:

Deliver the proof moment clearly and without clutter.

### Scene 5: Minimal Outcome Summary

Show:

- what data was in scope
- what untrusted content influenced the flow
- what outbound action was stopped

Goal:

Provide enough explanation to close the loop without turning the Core demo into
an Intelligence demo.

## Recommended UX Structure

Use one main runtime canvas with one compact detail panel.

### Main Canvas

- scenario setup
- execution timeline
- interrupt moment

### Detail Panel

- active step context
- inline signal context
- final blocked-action summary

## Required Visual Moments

The Core demo must make these moments unmistakable:

1. trusted data entered runtime context
2. untrusted content entered runtime context
3. outbound action became risky
4. interrupt happened before execution

## Minimal Copy Prompts

Opening:

- The agent looked normal. The runtime behavior was not.

Proof moment:

- Consequential outbound action interrupted before execution.

Close:

- Cerberus Core protects the runtime path where agent behavior becomes action.

## Implementation Notes

- keep the flow focused on one agent and one attack story
- do not add unrelated telemetry panels
- use side-by-side unprotected vs protected comparison only where it sharpens
  the proof moment
- reserve recommendations, clustering, and broader insight for Intelligence
