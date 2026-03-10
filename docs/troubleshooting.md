# Cerberus Enterprise — Troubleshooting Guide

## Quick Diagnostics

```bash
# Check all containers are running
docker compose ps

# Gateway health
curl -s http://localhost:4000/health | jq .

# Gateway logs (last 50 lines)
docker compose logs cerberus-gateway --tail=50

# Grafana health
curl -s http://localhost:3000/api/health

# Check audit log chain integrity
docker compose exec cerberus-gateway cat /var/log/cerberus/audit.jsonl | tail -5
```

---

## Startup Issues

### Gateway won't start — "CERBERUS_LICENSE_KEY is not set"

**Cause:** The `.env` file is missing or the license key is not configured.

**Fix:**
```bash
# Check .env exists
cat .env | grep CERBERUS_LICENSE_KEY

# Set your license key
# CERBERUS_LICENSE_KEY=cbr_ent_<your-32-hex-chars>
```

### Gateway won't start — "cerberus.config.yml is invalid"

**Cause:** YAML syntax error or schema validation failure.

**Fix:**
```bash
# Validate YAML syntax
docker compose exec cerberus-gateway cat /app/cerberus.config.yml

# Common issues:
# - Indentation (YAML requires spaces, not tabs)
# - Missing required fields (cerberus.alertMode, tools section)
# - Invalid enum values (alertMode must be: log, alert, or interrupt)
# - threshold must be integer 1-4
```

### Gateway won't start — "License validation failed"

**Cause:** License key is invalid, expired, or revoked.

**Fix:**
1. Verify the key format: `cbr_ent_` followed by exactly 32 hex characters
2. Check expiration: contact enterprise@sixsenseenterprise.com
3. Check network: the gateway needs HTTPS access to `api.cerberus.sixsenseenterprise.com`
4. If the license server is down, the gateway starts in **grace mode** (fully functional with a warning)

### Containers keep restarting

**Cause:** Resource limits too low, port conflicts, or volume permissions.

**Fix:**
```bash
# Check restart reasons
docker compose logs --tail=20

# Check resource usage
docker stats --no-stream

# Check port conflicts
lsof -i :4000
lsof -i :3000

# Fix volume permissions (if audit log fails)
docker compose exec cerberus-gateway ls -la /var/log/cerberus/
```

---

## Runtime Issues

### Tool calls returning 401 Unauthorized

**Cause:** API key mismatch or missing header.

**Fix:**
1. Check if `CERBERUS_API_KEY` is set in `.env`
2. If set, your agent must include: `X-Cerberus-Api-Key: <value>` in every request
3. Health endpoint (`GET /health`) is always exempt from API key checks

```bash
# Test with API key
curl -X POST http://localhost:4000/tool/readDatabase \
  -H "Content-Type: application/json" \
  -H "X-Cerberus-Api-Key: your-key-here" \
  -d '{"args": {"query": "test"}}'
```

### Tool calls returning 404 Not Found

**Cause:** Tool name in URL doesn't match any tool in `cerberus.config.yml`.

**Fix:**
```bash
# List configured tools
grep -A1 "^  [a-zA-Z]" cerberus.config.yml

# Request URL must match: POST /tool/<toolName>
# Tool names are case-sensitive
```

### Tool calls returning 429 Too Many Requests

**Cause:** Rate limit exceeded (100 requests per minute per IP).

**Fix:**
- Reduce request rate from your agent
- If your agent legitimately needs higher throughput, deploy multiple gateway instances behind a load balancer
- Rate limiting is also enforced at the nginx layer if configured

### Legitimate tool calls being blocked (false positives)

**Cause:** Risk score exceeds threshold for non-malicious calls.

**Fix:**
1. **Check what's triggering:** Look at the response body — it includes which layers fired
2. **Add authorized destinations:** If L3 fires on legitimate outbound domains:
   ```yaml
   cerberus:
     authorizedDestinations:
       - reports.yourcompany.com
       - api.internal-service.com
   ```
3. **Adjust threshold:** Increase from 3 to 4 if you want to only block when all 4 layers fire:
   ```yaml
   cerberus:
     threshold: 4
   ```
4. **Use observe mode first:** Set `alertMode: log` to monitor without blocking:
   ```yaml
   cerberus:
     alertMode: log
   ```

### Gateway responding slowly (high latency)

**Cause:** Tool backend is slow, or gateway resource constraints.

**Fix:**
```bash
# Check gateway resource usage
docker stats cerberus-gateway --no-stream

# Check tool backend response times
# The gateway adds ~50-200μs overhead per call
# If total latency is high, the bottleneck is likely the tool backend

# Increase container resources if needed (in docker-compose.yml):
# deploy:
#   resources:
#     limits:
#       cpus: '4'
#       memory: 1G
```

---

## Monitoring Issues

### Grafana shows "No data"

**Cause:** OTel collector not receiving metrics, or Prometheus not scraping.

**Fix:**
```bash
# Check OTel collector is running
docker compose logs otel-collector --tail=20

# Check Prometheus targets
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Verify gateway is sending telemetry
# The gateway sends to OTEL_ENDPOINT (default: http://otel-collector:4318)
docker compose exec cerberus-gateway env | grep OTEL

# Force a test call and check if metrics appear
curl -X POST http://localhost:4000/tool/readDatabase \
  -H "Content-Type: application/json" \
  -d '{"args": {"query": "test"}}'
```

### Alerts not firing (Slack/PagerDuty/email)

**Cause:** Alertmanager not configured, or webhook URLs incorrect.

**Fix:**
```bash
# Check Alertmanager is running
docker compose logs alertmanager --tail=10

# Check alerting rules in Prometheus
curl -s http://localhost:9090/api/v1/rules | jq '.data.groups[].rules[] | {name: .name, state: .state}'

# Test alertmanager directly
curl -X POST http://localhost:9093/api/v2/alerts \
  -H "Content-Type: application/json" \
  -d '[{"labels":{"alertname":"TestAlert","severity":"critical"},"annotations":{"summary":"Test alert"}}]'

# Verify webhook in alertmanager.yml (uncomment and configure)
```

---

## Audit Log Issues

### Audit log not writing

**Cause:** Permission denied on `/var/log/cerberus/` or disk full.

**Fix:**
```bash
# Check permissions
docker compose exec cerberus-gateway ls -la /var/log/cerberus/

# Check disk space
docker compose exec cerberus-gateway df -h /var/log/cerberus/

# The audit log is non-fatal — write failures don't stop the gateway
# Check gateway logs for warnings:
docker compose logs cerberus-gateway | grep "Audit log write failed"
```

### Audit chain verification fails

**Cause:** Log file was manually edited or corrupted.

**Fix:**
```bash
# Find the broken line
# The verifyAuditChain() function reports which line broke the chain

# If corruption is limited to recent entries, you can:
# 1. Backup the current log
# 2. Remove corrupted lines from the end
# 3. Restart gateway (it re-seeds the chain from the last valid entry)

# For compliance purposes, preserve the corrupted file as evidence
```

### Audit log growing too large

**Fix:**
```bash
# By default, only blocked calls are logged
# If CERBERUS_AUDIT_ALL=true, ALL calls are logged — disable for high-volume deployments

# Rotate logs with logrotate:
cat > /etc/logrotate.d/cerberus << 'EOF'
/var/log/cerberus/audit.jsonl {
    daily
    rotate 90
    compress
    missingok
    notifempty
    copytruncate
}
EOF
```

---

## License Issues

### "Gateway entering degraded mode"

**Cause:** License was revoked or expired during operation.

**Fix:**
1. Check license expiration date in your purchase email
2. Contact enterprise@sixsenseenterprise.com for renewal
3. In degraded mode, tool calls return 401 — the gateway blocks all requests as a safety measure

### "License validation failed — continuing in grace mode"

**Cause:** License server is unreachable (network issue or maintenance).

**Action:** This is informational, not an error. The gateway continues operating normally. License validation will retry automatically every 24 hours. No action needed unless the warning persists for more than 48 hours.

---

## Docker Issues

### "Permission denied" errors

**Cause:** The gateway container runs as non-root user `cerberus` (UID 100).

**Fix:**
```bash
# Fix volume ownership
docker compose exec --user root cerberus-gateway chown -R cerberus:cerberus /var/log/cerberus

# Or set ownership on the host
sudo chown -R 100:100 /path/to/audit-log-volume
```

### Container runs out of memory

**Fix:**
```bash
# Increase memory limit in docker-compose.yml
# deploy:
#   resources:
#     limits:
#       memory: 1G

# Check current usage
docker stats cerberus-gateway --no-stream
```

---

## Getting Help

If this guide doesn't resolve your issue:

1. **Collect diagnostics:**
   ```bash
   docker compose ps > diagnostics.txt
   docker compose logs --tail=100 >> diagnostics.txt
   curl -s http://localhost:4000/health >> diagnostics.txt
   cat cerberus.config.yml >> diagnostics.txt  # remove sensitive values
   ```

2. **Email support:** enterprise@sixsenseenterprise.com
   - Include severity level in subject: `[P1] Gateway down after upgrade`
   - Attach `diagnostics.txt`
   - Describe: what happened, when, what you expected, what you tried

3. **Response times:** See [SLA](../legal/SLA.md) for response commitments
