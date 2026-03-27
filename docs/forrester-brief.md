# Cerberus Forrester Brief

Date: 2026-03-27
Audience: Forrester analyst briefing preparation for April 22, 2026

## What Cerberus Is Today

Cerberus is a runtime security layer for AI agents focused on:

- tool-use monitoring and enforcement
- outbound exfiltration control
- session-aware risk correlation
- cross-session memory contamination detection

Cerberus works by instrumenting tool execution, correlating L1/L2/L3/L4
signals across a session, and interrupting guarded outbound actions before the
wrapped executor runs.

It supports:

- library integration
- HTTP gateway deployment
- adapters for LangChain, Vercel AI SDK, and OpenAI Agents SDK

## What Cerberus Is Not Yet

Cerberus should not currently be presented as:

- a complete identity plane for AI agents
- a global cross-environment agent inventory platform
- immutable or on-chain proof infrastructure
- a kernel sandbox or OS-level confinement product

Those are adjacent categories, not the current product core.

## Evidence To Anchor On

Use these evidence buckets carefully and label them explicitly:

1. March 2026 Lethal Trifecta paper
   - `285` validated scenarios
   - paper-specific research framing

2. Checked-in 525-run validation report
   - latest report in `harness/validation-traces/`
   - provider-specific success and observe-only detection results

3. Current hardened branch behavior
   - preflight blocking for guarded outbound tools
   - safer proxy session isolation
   - startup validation and fail-closed behavior
   - streaming-safe inspection buffering

Do not blend these evidence sets casually.

## Safe Talking Points

- The core Cerberus wedge is runtime security for agentic tool use.
- Cerberus focuses on the execution path where prompt injection becomes action.
- It is strongest when discussed in terms of tool interception, outbound
  controls, session correlation, and memory contamination.
- The right contrast is not "better prompt filtering." It is runtime detection
  and enforcement at the point of action.

## Avoid These Claims Unless Revalidated

- exact benchmark percentages from older social copy
- blanket "zero bytes left the system" language across all deployment shapes
- universal "0% false positives" claims without naming the study
- any suggestion that the live demo or website numbers are the single source of
  truth

## Pre-Meeting Checklist

- rerun validation on the current hardened branch
- normalize paper, repo, and website benchmark copy
- restore or replace the live demo URL
- keep one benchmark table and one evidence summary for the briefing
