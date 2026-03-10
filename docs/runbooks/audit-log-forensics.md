# Runbook: Audit Log Forensics

**Severity:** P2
**Owner:** Customer security team (Provider assists if requested)

## When to Use

- Customer suspects an attack was detected and wants to analyze the audit trail
- Compliance audit requires audit log review
- Customer reports audit chain integrity failure
- SIEM alert triggered from audit log data

## Understanding the Audit Log

Each entry in `/var/log/cerberus/audit.jsonl` is a JSON object:

```json
{
  "timestamp": "2026-03-10T15:30:22.123Z",
  "turnId": "turn_abc123",
  "toolName": "sendEmail",
  "score": 3,
  "action": "interrupt",
  "signals": ["PRIVILEGED_DATA_ACCESSED", "UNTRUSTED_TOKENS_IN_CONTEXT", "EXFILTRATION_RISK"],
  "blocked": true,
  "prevHash": "a1b2c3...",
  "hash": "d4e5f6..."
}
```

## Steps

### 1. Verify chain integrity

```bash
# If using the gateway container
docker compose exec cerberus-gateway npx tsx -e "
  import { verifyAuditChain } from './enterprise/gateway/audit-log.js';
  const result = verifyAuditChain();
  console.log(JSON.stringify(result, null, 2));
"
```

Expected: `{"valid": true}`
If broken: `{"valid": false, "brokenAtLine": 42}` — the log was tampered with at line 42.

### 2. Extract blocked calls

```bash
# All blocked calls
cat /var/log/cerberus/audit.jsonl | jq 'select(.blocked == true)'

# Blocked calls in a time range
cat /var/log/cerberus/audit.jsonl | jq 'select(.blocked == true and .timestamp >= "2026-03-10T00:00:00" and .timestamp <= "2026-03-10T23:59:59")'

# Blocked calls by tool
cat /var/log/cerberus/audit.jsonl | jq 'select(.blocked == true and .toolName == "sendEmail")'

# High-score calls (score >= 3)
cat /var/log/cerberus/audit.jsonl | jq 'select(.score >= 3)'
```

### 3. Analyze attack patterns

```bash
# Count blocked calls per tool
cat /var/log/cerberus/audit.jsonl | jq -r 'select(.blocked == true) | .toolName' | sort | uniq -c | sort -rn

# Count by signal type
cat /var/log/cerberus/audit.jsonl | jq -r 'select(.blocked == true) | .signals[]' | sort | uniq -c | sort -rn

# Timeline of blocked calls (hourly buckets)
cat /var/log/cerberus/audit.jsonl | jq -r 'select(.blocked == true) | .timestamp[:13]' | sort | uniq -c
```

### 4. Correlate with session data

```bash
# Group blocked calls by session (if X-Cerberus-Session was used)
# Note: session ID is in the turnId prefix if formatted as session_turn
cat /var/log/cerberus/audit.jsonl | jq -r 'select(.blocked == true) | .turnId' | sort | uniq -c | sort -rn
```

### 5. Ship to SIEM

Mount the audit log volume and configure your SIEM to ingest `/var/log/cerberus/audit.jsonl`:

- **Splunk:** Use the `monitor` input on the JSONL file
- **Elastic:** Use Filebeat with JSON parsing
- **Datadog:** Use the log agent with a JSON parser
- **Custom:** Each line is a standalone JSON object, newline-delimited

### 6. Preserve evidence

If the audit log is needed for legal or compliance purposes:

```bash
# Create a timestamped backup
cp /var/log/cerberus/audit.jsonl /secure-storage/audit-$(date +%Y%m%d_%H%M%S).jsonl

# Verify integrity of the backup
# Run verifyAuditChain() against the backup file
```

## Chain Integrity Failure

If `verifyAuditChain()` reports a broken chain:

1. **Preserve the tampered file** — do not delete or modify it
2. **Identify the break point** — the `brokenAtLine` tells you which entry was modified
3. **Compare with SIEM** — if you ship logs to a SIEM, compare the SIEM copy with the local file
4. **Investigate access** — check Docker logs and host access logs for who accessed the container or volume
5. **Report** — this may indicate an insider threat or container compromise
