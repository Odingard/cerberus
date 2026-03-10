# Cerberus Enterprise — Self-Hosted

Deploy the full Cerberus AI Runtime Security stack inside your own VPC.
Your data never leaves your infrastructure.

## What's included

| Component | Purpose |
|-----------|---------|
| **Cerberus Gateway** | HTTP proxy on port 4000 — intercepts agent tool calls, runs detection, blocks attacks |
| **OpenTelemetry Collector** | Receives telemetry from the gateway |
| **Prometheus** | Metrics storage |
| **Alertmanager** | Routes alerts to Slack, PagerDuty, or email |
| **Grafana** | 16-panel security dashboard on port 3000 |
| **Audit Log** | Tamper-evident chained-hash log at `/var/log/cerberus/audit.jsonl` |

## Prerequisites

- Docker Engine 24+ and Docker Compose v2
- `CERBERUS_LICENSE_KEY` from `enterprise@sixsenseenterprise.com`
- Linux or macOS host with 512 MB RAM available for the gateway

## Quick start

```bash
cd enterprise

# 1. Run the setup script — generates .env, starts the stack, verifies health
./setup.sh
```

That's it. The gateway starts on port 4000, Grafana on port 3000.

### Manual setup

```bash
cd enterprise

# Copy and edit config
cp cerberus.config.yml.example cerberus.config.yml
# → Edit cerberus.config.yml with your tool URLs

# Copy and edit env
cp .env.example .env
# → Set CERBERUS_LICENSE_KEY, GRAFANA_ADMIN_PASSWORD, GRAFANA_SECRET_KEY

# Start
docker compose up -d

# Verify
curl http://localhost:4000/health
```

## Routing tool calls

Point your AI agent's tool calls at the gateway:

```
POST http://localhost:4000/tool/<toolName>
Content-Type: application/json
X-Cerberus-Session: <session-id>    # optional — tracks state across turns

{ "args": { "param1": "value1" } }
```

**Response — allowed (200):**
```json
{ "result": "..." }
```

**Response — blocked (403):**
```json
{ "blocked": true, "message": "[Cerberus] Lethal Trifecta detected..." }
```

## Configuration

Edit `cerberus.config.yml`:

```yaml
cerberus:
  alertMode: interrupt   # log | alert | interrupt
  threshold: 3           # blocks at score >= 3 (full Lethal Trifecta)

tools:
  readDatabase:
    target: http://your-api:3001/read
    trustLevel: trusted

  fetchWebContent:
    target: http://your-api:3001/fetch
    trustLevel: untrusted

  sendReport:
    target: http://your-api:3001/email
    outbound: true
```

Full reference: [docs/enterprise-configuration.md](../docs/enterprise-configuration.md)

## Monitoring

Grafana dashboard: `http://localhost:3000` (login: admin / see .env)

Key panels:
- Total tool calls and block rate
- Risk score distribution
- Blocked calls per session
- Detection signal breakdown (L1/L2/L3/L4)

## Audit log

Every blocked call is written to a tamper-evident audit log:

```
/var/log/cerberus/audit.jsonl
```

Each entry is SHA-256 chained to the previous — any modification breaks the chain.
Ship this log to your SIEM for compliance.

## Upgrading

```bash
cd enterprise
git pull
docker compose pull
docker compose up -d --build
```

## Support

`enterprise@sixsenseenterprise.com`
