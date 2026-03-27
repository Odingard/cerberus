# Cerberus Enterprise — Configuration Reference

All configuration lives in `enterprise/cerberus.config.yml`.

## Full example

```yaml
cerberus:
  alertMode: interrupt
  threshold: 3
  memoryTracking: false
  authorizedDestinations:
    - reports.yourcompany.com
    - internal-siem.yourcompany.com

tools:
  readDatabase:
    target: http://your-tools-service:3001/read
    trustLevel: trusted

  fetchWebContent:
    target: http://your-tools-service:3001/fetch
    trustLevel: untrusted

  sendReport:
    target: http://your-tools-service:3001/email
    outbound: true

gateway:
  port: 4000
  sessionTtlMinutes: 30
  apiKey: ${CERBERUS_API_KEY}

alerts:
  slack:
    webhook: ${SLACK_WEBHOOK_URL}
  pagerduty:
    integrationKey: ${PAGERDUTY_KEY}
  email:
    smtp: ${SMTP_HOST}
    from: security-alerts@yourcompany.com
    to: ${ALERT_EMAIL_TO}
```

---

## `cerberus` — Detection settings

### `alertMode`

| Value | Behavior |
|-------|---------|
| `log` | Detect and log — never block. Use for tuning/observation. |
| `alert` | Detect and emit alert — never block. |
| `interrupt` | Detect and **block** (403 response). **Recommended for production.** |

Default: `interrupt`

### `threshold`

Integer 1–4. The risk score required to trigger the `alertMode` action.

| Score | Meaning |
|-------|---------|
| 1 | L1 alone (privileged data accessed) |
| 2 | L1+L2 (data + injection) |
| 3 | **Lethal Trifecta** — L1+L2+L3 (full attack chain). **Recommended.** |
| 4 | All 4 layers (includes L4 memory contamination) |

Default: `3`

### `memoryTracking`

Enable L4 cross-session memory contamination detection. Tracks whether contaminated data from a previous session influences actions in a new session.

Default: `false`

### `authorizedDestinations`

List of domains that are **not** flagged as exfiltration destinations. Use for known-legitimate outbound services.

```yaml
authorizedDestinations:
  - reports.yourcompany.com   # exact domain
  - *.yourcompany.com         # subdomain wildcard
```

Default: `[]` (all outbound destinations are monitored)

---

## `tools` — Tool definitions

Each key under `tools` becomes a route at `POST /tool/<toolName>`.

### `target`

HTTP URL of the tool's backend service. The gateway forwards:
```
POST <target>
{ "args": { ...args } }
```

Mutually exclusive with `handler` (handler is code-only, not available in YAML config).

### `trustLevel`

| Value | Effect |
|-------|--------|
| `trusted` | Tool output is treated as internal trusted data. L1 scans output for PII and secrets. |
| `untrusted` | Tool output is scanned for prompt injection patterns (L2). |

Default: none (neutral — no L1/L2 signal emitted for this tool's output)

### `outbound`

Mark this tool as outbound. L3 exfiltration detection monitors all calls to outbound tools, checking whether the arguments contain data from L1 (trusted/privileged) sources that appeared after L2 (untrusted) input.

Default: `false`

---

## `gateway` — Server settings

### `port`

TCP port for the gateway HTTP server.

Default: `4000`

### `sessionTtlMinutes`

How long a session remains active after its last tool call. Sessions maintain cumulative L1/L2/L3 state across multiple HTTP requests from the same agent run.

Default: `30`

### `apiKey`

If set, every tool request must include:
```
X-Cerberus-Api-Key: <value>
```

Health checks (`GET /health`) are always exempt.

Can reference environment variables: `apiKey: ${CERBERUS_API_KEY}`

---

## `alerts` — Alert routing

These settings configure where Cerberus sends alert notifications when `alertMode` is `alert` or `interrupt`.

### `alerts.slack`

```yaml
alerts:
  slack:
    webhook: https://hooks.slack.com/services/T.../B.../...
```

### `alerts.pagerduty`

```yaml
alerts:
  pagerduty:
    integrationKey: your-integration-key
```

### `alerts.email`

```yaml
alerts:
  email:
    smtp: smtp.yourcompany.com:587
    from: security-alerts@yourcompany.com
    to: oncall@yourcompany.com
```

---

## Session tracking

The gateway maintains per-session state via the `X-Cerberus-Session` request header:

```
X-Cerberus-Session: <unique-session-id>
```

If the header is absent, Cerberus creates a fresh isolated session for that request and returns it in the response header:

```http
X-Cerberus-Session: anon-<generated-id>
```

**Best practice:** Set `X-Cerberus-Session` to your agent's run/conversation ID. This ensures:
- L1+L2+L3 signals accumulate correctly across multiple tool calls in the same agent run
- Different agent runs don't interfere with each other's detection state
- Anonymous requests do not accidentally contaminate each other

---

## Request format

```
POST http://localhost:4000/tool/<toolName>
Content-Type: application/json
X-Cerberus-Session: <session-id>
X-Cerberus-Api-Key: <api-key>    (if configured)

{ "args": { "param1": "value1", "param2": "value2" } }
```

### Success response (200)

```json
{ "result": "<tool output>" }
```

### Blocked response (403)

```json
{
  "blocked": true,
  "message": "[Cerberus] Lethal Trifecta detected: L1 privileged data accessed, L2 injection in context, L3 outbound destination matches untrusted input"
}
```

The `X-Cerberus-Blocked: true` header is also set on blocked responses.
Successful responses also include `X-Cerberus-Session`, allowing clients to reuse a generated session ID explicitly.

---

## Startup validation

Cerberus now fails fast on startup for configurations that materially weaken protection in production:

- `alertMode: interrupt` with outbound tools but without both trusted and untrusted tool classification
- `memoryTracking: true` without configured memory tools
- duplicate `trustOverrides` for the same tool
- invalid `threshold` values outside `0..4`

This is intentional. Cerberus prefers an explicit startup failure over silently running with reduced coverage.

### Error responses

| Status | Meaning |
|--------|---------|
| 400 | Invalid JSON body |
| 401 | Missing or invalid API key |
| 404 | Unknown tool name |
| 405 | Method not allowed (use POST) |
| 502 | Tool backend error |
