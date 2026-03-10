# Runbook: Gateway Performance Degradation

**Severity:** P2
**Owner:** Customer operations team

## When to Use

- Gateway response latency exceeds normal thresholds (>10ms per call)
- Grafana shows elevated p99 latency
- Tool calls timing out
- Container approaching resource limits

## Diagnostics

### 1. Check container health

```bash
# Container status and uptime
docker compose ps

# Resource usage (CPU, memory, network)
docker stats cerberus-gateway --no-stream

# Health endpoint response time
time curl -s http://localhost:4000/health
```

### 2. Check tool backend response times

The gateway adds ~50-200 microseconds of detection overhead. If total latency is high, the bottleneck is almost always the tool backend:

```bash
# Test tool backend directly (bypass gateway)
time curl -s http://your-tools-service:3001/read \
  -H "Content-Type: application/json" \
  -d '{"args": {"query": "test"}}'
```

### 3. Check rate limiting

```bash
# If getting 401s, may be rate-limited (100 req/min/IP)
docker compose logs cerberus-gateway | grep -i "rate"

# Check current request rate in Grafana or Prometheus
curl -s 'http://localhost:9090/api/v1/query?query=rate(tool_calls_total[1m])' | jq '.data.result[0].value[1]'
```

### 4. Check memory pressure

```bash
# If the container is hitting memory limits, detection may slow down
docker compose logs cerberus-gateway | grep -i "memory\|oom\|heap"

# Check session count (many concurrent sessions consume more memory)
curl -s http://localhost:4000/health | jq .sessions
```

## Remediation

### Increase resources

Edit `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '4'       # was '2'
      memory: 1G      # was 512M
```

Then: `docker compose up -d`

### Reduce session TTL

If many sessions are accumulating, reduce TTL in `cerberus.config.yml`:
```yaml
gateway:
  sessionTtlMinutes: 15  # was 30
```

### Scale horizontally

For high-throughput deployments, run multiple gateway instances behind a load balancer:

```yaml
# docker-compose.yml
cerberus-gateway:
  # ... existing config ...
  deploy:
    replicas: 3
```

Use a load balancer (nginx, HAProxy, or cloud ALB) with sticky sessions based on `X-Cerberus-Session` header.

### Disable non-critical features

If detection latency is the concern:
```yaml
cerberus:
  memoryTracking: false  # Disable L4 (saves memory and CPU)
```

## Escalation

If diagnostics show the gateway itself (not tool backends) is the bottleneck:

1. Collect: `docker stats`, `docker compose logs --tail=200`, Grafana screenshot
2. Email enterprise@sixsenseenterprise.com with `[P2] Gateway performance degradation`
