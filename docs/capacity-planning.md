# Cerberus Enterprise — Capacity Planning Guide

## Performance Characteristics

The Cerberus gateway detection pipeline adds minimal overhead to tool calls:

| Metric | Value |
|--------|-------|
| **Detection latency (p50)** | 52 microseconds per call |
| **Detection latency (p99)** | 230 microseconds per call |
| **Detection latency (worst)** | <1 millisecond |
| **LLM call latency (typical)** | 500ms – 5,000ms |
| **Cerberus overhead as % of LLM** | 0.01% – 0.05% |

Detection latency is measured for a complete 3-call session (L1 + L2 + L3 + all sub-classifiers + correlation).

## Resource Requirements

### Minimum (development / low traffic)

| Resource | Requirement |
|----------|-------------|
| CPU | 1 vCPU |
| Memory | 256 MB for gateway |
| Disk | 1 GB (audit logs, config) |
| Network | HTTPS to license server (startup only) |

### Recommended (production)

| Resource | Requirement |
|----------|-------------|
| CPU | 2 vCPU |
| Memory | 512 MB for gateway |
| Disk | 10 GB (audit logs, Prometheus data, Grafana) |
| Network | HTTPS to license server + tool backends |

### Full stack (gateway + monitoring)

| Container | CPU | Memory | Disk |
|-----------|-----|--------|------|
| cerberus-gateway | 2 vCPU | 512 MB | 2 GB (audit log) |
| otel-collector | 0.5 vCPU | 128 MB | — |
| prometheus | 0.5 vCPU | 512 MB | 5 GB (metrics, 15-day retention) |
| alertmanager | 0.25 vCPU | 64 MB | 100 MB |
| grafana | 0.5 vCPU | 256 MB | 500 MB |
| **Total** | **~4 vCPU** | **~1.5 GB** | **~8 GB** |

## Throughput Estimates

### Single gateway instance

| Concurrent sessions | Calls per second | Memory | CPU |
|---------------------|------------------|--------|-----|
| 10 | 50 | 256 MB | 0.5 vCPU |
| 50 | 200 | 384 MB | 1 vCPU |
| 100 | 500 | 512 MB | 2 vCPU |
| 500 | 1,000 | 1 GB | 4 vCPU |

Estimates assume average session with 5 turns, 30-minute TTL.

### Scaling factors

**Memory scales with:**
- Number of concurrent sessions (each session stores signal history)
- Session TTL (longer TTL = more sessions in memory)
- L4 memory tracking (if enabled, adds graph storage per session)

**CPU scales with:**
- Calls per second (each call runs the full detection pipeline)
- Tool call argument size (larger payloads = more scanning time)
- Number of configured tools (more tools = larger routing table)

**Disk scales with:**
- Audit log volume (depends on block rate and `CERBERUS_AUDIT_ALL` setting)
- Prometheus retention period (default: 15 days)
- Grafana dashboard count

## Sizing Recommendations

### Small team (1-5 AI agents, <100 calls/day)

```
Instance: t3.small (2 vCPU, 2 GB RAM)
Disk: 20 GB gp3
Expected cost: ~$15/month (AWS)
```

### Medium (5-20 agents, <10,000 calls/day)

```
Instance: t3.medium (2 vCPU, 4 GB RAM)
Disk: 50 GB gp3
Expected cost: ~$30/month (AWS)
```

### Large (20-100 agents, <100,000 calls/day)

```
Instance: m6i.large (2 vCPU, 8 GB RAM)
Disk: 100 GB gp3
Consider: horizontal scaling with load balancer
Expected cost: ~$70/month (AWS)
```

### Enterprise (100+ agents, >100,000 calls/day)

```
Multiple gateway instances behind ALB
Instance: m6i.xlarge × 2-4 (4 vCPU, 16 GB each)
Disk: 200 GB gp3 per instance
Dedicated Prometheus + Grafana on separate instance
Expected cost: ~$200-400/month (AWS)
```

## Horizontal Scaling

For deployments exceeding single-instance capacity:

1. **Run multiple gateway replicas** behind a load balancer
2. **Sticky sessions required** — route requests with the same `X-Cerberus-Session` header to the same instance (detection state is per-instance)
3. **Shared monitoring** — all instances export to the same OTel collector
4. **Independent audit logs** — each instance writes its own audit log (merge at SIEM level)

```yaml
# docker-compose.yml for multi-instance
cerberus-gateway:
  deploy:
    replicas: 3
    resources:
      limits:
        cpus: '2'
        memory: 512M
```

Load balancer (nginx example):
```nginx
upstream cerberus {
    hash $http_x_cerberus_session consistent;
    server gateway-1:4000;
    server gateway-2:4000;
    server gateway-3:4000;
}
```

## Audit Log Sizing

| Block rate | Calls/day | Log growth/day | 90-day retention |
|-----------|-----------|----------------|-----------------|
| 1% (typical) | 1,000 | ~50 KB | ~4.5 MB |
| 1% | 10,000 | ~500 KB | ~45 MB |
| 1% | 100,000 | ~5 MB | ~450 MB |
| All logged | 100,000 | ~500 MB | ~45 GB |

Default behavior: only blocked calls are logged. Set `CERBERUS_AUDIT_ALL=true` to log all calls (significantly increases disk usage).

## Prometheus Data Sizing

With default 15-day retention:

| Calls/day | Prometheus disk |
|-----------|----------------|
| 1,000 | ~50 MB |
| 10,000 | ~200 MB |
| 100,000 | ~1 GB |
| 1,000,000 | ~5 GB |

Adjust retention in `prometheus.yml`:
```yaml
# Default: 15 days
storage.tsdb.retention.time: 15d
# For longer retention:
storage.tsdb.retention.time: 90d
```

## Monitoring Your Deployment

Key Grafana panels for capacity monitoring:

- **Tool calls per second** — trending upward? plan to scale
- **Risk score histogram** — are detection signals stable?
- **Container CPU/memory** — approaching limits?
- **Session count** — how many concurrent sessions?

Set Prometheus alerts for capacity thresholds:
```yaml
# Example: alert when gateway memory > 80% of limit
- alert: CerberusGatewayMemoryHigh
  expr: container_memory_usage_bytes{name="cerberus-gateway"} / container_spec_memory_limit_bytes{name="cerberus-gateway"} > 0.8
  for: 5m
  labels:
    severity: warning
```
