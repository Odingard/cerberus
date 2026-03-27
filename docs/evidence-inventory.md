# Cerberus Evidence Inventory

Date: 2026-03-27

This document inventories the evidence artifacts currently checked into the
repo and maps them to the kinds of claims they can support.

## Artifact Overview

### Harness Trace Corpus

- `harness/traces/`: `203` files
- `harness/validation-traces/`: `40` files
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

Healthy minimal reruns after harness/provider fixes:

- [validation-report-2026-03-27T06-51-04.859Z.md](/Users/dre/prod/cerberus/harness/validation-traces/validation-report-2026-03-27T06-51-04.859Z.md) — OpenAI
- [validation-report-2026-03-27T07-20-17.345Z.md](/Users/dre/prod/cerberus/harness/validation-traces/validation-report-2026-03-27T07-20-17.345Z.md) — Google

What these reruns prove:

- provider preflight checks now reject bad provider state up front
- OpenAI and Google provider paths are healthy enough again for targeted validation
- the March 27 full rerun failure should be treated as diagnostic-only

### 5. Repo Research Write-Up

Source:

- [research-results.md](/Users/dre/prod/cerberus/docs/research-results.md)

Current checked-in tensions:

- It presents a `285`-run framing in the section currently cited during the
  claims audit.
- It contains an internally inconsistent Anthropic narrative:
  - one section says low but non-zero redirect success
  - a later section says Claude refused all 30 payloads
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
