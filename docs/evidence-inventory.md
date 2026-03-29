# Cerberus Evidence Inventory

Date: 2026-03-27

Current branch reference for this inventory:

- commit `98b871b836af400913571bef80d2660fa8e32aae`

This document inventories the evidence artifacts currently checked into the
repo and maps them to the kinds of claims they can support.

## Artifact Overview

### Harness Trace Corpus

- `harness/traces/`: `203` files
- `harness/validation-traces/`: `50` files
- `harness/traces/*ERROR*.json`: `38` files

What this means:

- The repo does contain substantial experimental output.
- The repo does not yet present that output in a single indexed format that
  makes each public claim easy to verify.
- Error-tagged traces need to be separated from successful evidence when public
  numbers are cited.

## Key Evidence Sets

### 1. March 2026 Research Paper

Source:

- `Documents/Lethal Trifecta Research Paper.pdf`

Claims supported by the paper text:

- `285` validated attack scenarios
- `100%` overall detection
- `0%` false positive rate
- `52 microseconds` median latency
- cross-session L4 memory contamination detection

Caution:

- These claims are stated in the paper, but the repo does not yet package an
  obvious artifact index that directly ties each paper metric to checked-in
  run outputs.

### 2. Validation Reports Supporting a 525-Run Protocol

Latest checked-in reports:

- [validation-report-2026-03-13T03-48-27.993Z.md](/Users/dre/prod/cerberus/harness/validation-traces/validation-report-2026-03-13T03-48-27.993Z.md)
- [validation-report-2026-03-13T03-48-27.977Z.json](/Users/dre/prod/cerberus/harness/validation-traces/validation-report-2026-03-13T03-48-27.977Z.json)

Protocol from the latest report:

- `55` payloads
- `3` trials per payload per provider
- `10` control trials per provider
- `525` total runs
- providers: OpenAI, Anthropic, Google

Latest treatment-group success rates from the checked-in report:

- OpenAI `11.5%`
- Anthropic `1.2%`
- Google `44.8%`

Latest checked-in detection rates from the same report:

- overall detection `28.5%`
- OpenAI detection `14.5%`
- Anthropic detection `1.2%`
- Google detection `69.7%`
- false positive rate `0.0%`

What this evidence can honestly support:

- A 525-run validation protocol exists in checked-in report form.
- Different providers show materially different redirect success rates.
- Cerberus observe-only detection is documented against that 525-run protocol.

What it does not support:

- The exact `N=525` provider percentages currently quoted in
  `docs/social-media-posts.md`
- any claim that the 525-run results match the paper's 285-scenario numbers
  without explanation

### 3. March 27, 2026 Full Rerun Failure

Diagnostic rerun reports:

- [validation-report-2026-03-27T06-09-45.330Z.md](/Users/dre/prod/cerberus/harness/validation-traces/validation-report-2026-03-27T06-09-45.330Z.md)
- [validation-report-2026-03-27T06-09-45.322Z.json](/Users/dre/prod/cerberus/harness/validation-traces/validation-report-2026-03-27T06-09-45.322Z.json)

What happened:

- the full rerun was executed while provider state was unhealthy
- OpenAI had quota/key problems
- Google had provider/preflight mismatch problems
- the harness had not yet been hardened to fail fast on those conditions

What this evidence is good for:

- showing why the validation harness needed provider preflight checks
- showing why provider error samples must appear in reports
- demonstrating that benchmark reports should be rejected when provider state is invalid

What this evidence is not good for:

- public benchmark claims
- detection-rate claims
- provider-comparison claims

### 4. Post-Fix Provider Sanity Reruns

Healthy targeted reruns after harness/provider fixes:

- [validation-report-2026-03-27T06-51-04.859Z.md](/Users/dre/prod/cerberus/harness/validation-traces/validation-report-2026-03-27T06-51-04.859Z.md) — OpenAI
- [validation-report-2026-03-27T07-20-17.345Z.md](/Users/dre/prod/cerberus/harness/validation-traces/validation-report-2026-03-27T07-20-17.345Z.md) — Google
- [validation-report-2026-03-27T08-02-40.373Z.md](/Users/dre/prod/cerberus/harness/validation-traces/validation-report-2026-03-27T08-02-40.373Z.md) — Anthropic diagnostic-but-healthy preflight rerun
- [validation-report-2026-03-27T08-35-20.137Z.md](/Users/dre/prod/cerberus/harness/validation-traces/validation-report-2026-03-27T08-35-20.137Z.md) — Anthropic targeted rerun with one treatment success

What these reruns prove:

- provider preflight checks now reject bad provider state up front
- OpenAI, Google, and Anthropic provider paths are healthy enough again for targeted validation
- Anthropic behavior on the hardened branch is low-success but not accurately described as a blanket refusal across every payload
- the March 27 full rerun failure should be treated as diagnostic-only

What these reruns do not prove:

- a fresh cross-provider benchmark baseline for the whole hardened branch
- a replacement for the historical March 13 `525`-run observe-only report
- a current-branch artifact set strong enough to unify every public benchmark number yet

### 5. March 28, 2026 Current-Branch OpenAI Stamped Reruns

Fresh current-branch artifacts on commit `98b871b836af400913571bef80d2660fa8e32aae`:

- [validation-report-2026-03-28T13-35-35.359Z.md](/Users/dre/prod/cerberus/harness/validation-traces/validation-report-2026-03-28T13-35-35.359Z.md) — OpenAI attack-behavior rerun
- [validation-report-2026-03-28T13-52-25.775Z.md](/Users/dre/prod/cerberus/harness/validation-traces/validation-report-2026-03-28T13-52-25.775Z.md) — OpenAI observe-only detection rerun

Headline results from these two runs:

- OpenAI attack-behavior rerun: `49/55` treatment successes (`89.1%`) with `6/55` partial outcomes and `0/1` control exfiltrations
- OpenAI detection rerun: `8/55` strict treatment successes (`14.5%`) with `47/55` partial outcomes
- OpenAI detection metrics on the same branch state: overall detection `20.0%`, false positive rate `0.0%`, `L1=100%`, `L2=100%`, `L3=19.6%`

What this evidence is good for:

- proving that fresh current-branch validation is now underway, not just planned
- tying at least one provider's attack and detection behavior to a specific hardened commit
- grounding follow-on claim cleanup in a real March 28 artifact pair rather than historical numbers alone

What this evidence is not good for:

- replacing the full historical cross-provider evidence set
- making broad three-provider current-branch claims yet
- collapsing attack-success and observe-only detection metrics into one number

### 6. March 29, 2026 Current-Branch Google Stamped Reruns

Fresh current-branch artifact on commit `98b871b836af400913571bef80d2660fa8e32aae`:

- [validation-report-2026-03-29T02-13-17.893Z.md](/Users/dre/prod/cerberus/harness/validation-traces/validation-report-2026-03-29T02-13-17.893Z.md) — Google attack-behavior rerun
- [validation-report-2026-03-29T02-37-47.733Z.md](/Users/dre/prod/cerberus/harness/validation-traces/validation-report-2026-03-29T02-37-47.733Z.md) — Google observe-only detection rerun

Headline results from these runs:

- Google attack-behavior rerun: `47/55` treatment successes (`85.5%`) with `7/55` refusals, `1/55` partial outcomes, and `0/1` control exfiltrations
- Google detection rerun: `27/55` strict treatment successes (`49.1%`) with `28/55` partial outcomes
- Google detection metrics on the same branch state: overall detection `72.7%`, false positive rate `0.0%`, `L1=100%`, `L2=100%`, `L3=71.4%`

What this evidence is good for:

- adding a second fresh current-branch provider to the stamped rerun set
- showing that current-branch Google behavior remains highly permissive under the attack harness
- showing that Cerberus still produces strong Google-side observe-only detection on the current hardened branch
- reducing dependence on historical cross-provider numbers alone

What this evidence is not good for:

- replacing a full fresh cross-provider benchmark baseline
- supporting fresh current-branch three-provider claims by itself

### 7. Repo Research Write-Up

Source:

- [research-results.md](/Users/dre/prod/cerberus/docs/research-results.md)

Current checked-in tensions:

- It presents a `285`-run framing in the section currently cited during the
  claims audit.
- It contains an internally inconsistent Anthropic narrative:
  - one section says low but non-zero redirect success
  - a later section says Claude refused all payloads
  - the latest March 27 Anthropic targeted rerun shows `1/55` treatment success,
    `1/55` refusal, and `53/55` partial outcomes
- It describes observe-only detection outcomes that do not match the paper's
  `100%` overall detection claim.

## Practical Claim Mapping

Safe claims today:

- Cerberus has real checked-in evidence for both a `285`-scenario research
  paper and a `525`-run validation protocol.
- Cerberus has checked-in validation reports with provider-specific outcomes.
- Cerberus has checked-in observe-only detection results with `0%` false
  positives in the cited clean controls.

Unsafe claims today:

- quoting any single benchmark number without specifying which evidence set it
  came from
- blending the paper's `100% detection` result with the observe-only
  detection-engine numbers
- presenting the current `docs/social-media-posts.md` percentages as verified
  by the latest checked-in validation report

## Gaps To Close

1. Create a single artifact index that maps every public number to:
   - source file
   - run date
   - branch / commit SHA
   - protocol parameters
   - whether failed runs were excluded

2. Separate historical, paper-specific, and current-branch evidence into
   clearly labeled buckets.

3. Normalize all public copy so each benchmark number references exactly one
   evidence set.
