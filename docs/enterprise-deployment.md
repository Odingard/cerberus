# Cerberus Enterprise — Deployment Guide

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Docker Engine | 24+ |
| Docker Compose | v2 (bundled with Docker Desktop) |
| RAM available | 512 MB minimum for gateway |
| OS | Linux (recommended) or macOS |

## Quick start

```bash
git clone https://github.com/Odingard/cerberus.git
cd cerberus/enterprise
./setup.sh
```

The setup script:
1. Checks Docker prerequisites
2. Generates `.env` with secure random passwords
3. Validates your license key
4. Copies `cerberus.config.yml.example` if config is missing
5. Starts the 5-container stack
6. Polls the gateway health endpoint until ready
7. Prints the Grafana URL and admin password

## Manual deployment

```bash
cd enterprise

# 1. Configure tools
cp cerberus.config.yml.example cerberus.config.yml
# Edit cerberus.config.yml — see docs/enterprise-configuration.md

# 2. Configure environment
cp .env.example .env
# Set: CERBERUS_LICENSE_KEY, GRAFANA_ADMIN_PASSWORD, GRAFANA_SECRET_KEY

# 3. Start
docker compose up -d

# 4. Verify
curl http://localhost:4000/health
# → { "status": "ok", "sessions": 0 }
```

## Ports

| Port | Service | Exposed to |
|------|---------|-----------|
| 4000 | Cerberus Gateway | Your AI agent |
| 3000 | Grafana | Dashboard users |

All other ports (OTel, Prometheus, Alertmanager) are internal-only.

## Production hardening

### TLS termination (recommended)

Add nginx in front of the gateway:

```nginx
server {
  listen 443 ssl http2;
  server_name cerberus.yourcompany.com;

  ssl_certificate     /etc/ssl/certs/cerberus.crt;
  ssl_certificate_key /etc/ssl/private/cerberus.key;

  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header Referrer-Policy "no-referrer" always;
  add_header Content-Security-Policy "default-src 'none'" always;

  server_tokens off;
  client_max_body_size 2m;

  limit_req_zone $binary_remote_addr zone=cerberus:10m rate=60r/m;
  limit_req zone=cerberus burst=20 nodelay;

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $host;
    proxy_read_timeout 60s;
  }
}
```

### AWS deployment

```bash
# Launch EC2 instance (t3.small recommended)
# Security group: allow 443 inbound from your agent servers

# SSH in
ssh -i key.pem ec2-user@<instance-ip>

# Install Docker
sudo yum update -y && sudo yum install -y docker
sudo systemctl start docker && sudo usermod -aG docker ec2-user

# Clone and deploy
git clone https://github.com/Odingard/cerberus.git
cd cerberus/enterprise
./setup.sh
```

### GCP deployment

```bash
# Create VM
gcloud compute instances create cerberus-enterprise \
  --machine-type=e2-small \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --tags=cerberus-gateway

# Firewall rule (restrict to your agent's VPC IP range)
gcloud compute firewall-rules create cerberus-gateway \
  --target-tags=cerberus-gateway \
  --allow=tcp:4000 \
  --source-ranges=10.0.0.0/8
```

### Azure deployment

Use Azure Container Instances with the enterprise docker-compose.yml or deploy to AKS using the provided container image.

## Environment variables reference

| Variable | Required | Description |
|----------|----------|-------------|
| `CERBERUS_LICENSE_KEY` | Yes | Enterprise license key (`cbr_ent_...`) |
| `CERBERUS_API_KEY` | No | If set, gateway requires `X-Cerberus-Api-Key` header |
| `CERBERUS_CONFIG` | No | Path to config file (default: `/app/cerberus.config.yml`) |
| `CERBERUS_AUDIT_LOG` | No | Audit log path (default: `/var/log/cerberus/audit.jsonl`) |
| `CERBERUS_AUDIT_ALL` | No | Set `true` to log all calls, not just blocked ones |
| `GRAFANA_ADMIN_PASSWORD` | Yes | Grafana admin login password |
| `GRAFANA_SECRET_KEY` | Yes | Grafana session signing key (32+ random chars) |
| `OTEL_ENDPOINT` | No | OTel collector URL (default: `http://otel-collector:4318`) |

## Upgrading

```bash
cd enterprise
git pull
docker compose pull
docker compose up -d --build
```

The gateway performs a zero-downtime rolling restart.

## Audit log

Blocked calls are written to a tamper-evident append-only log:

```
/var/log/cerberus/audit.jsonl
```

Each entry is SHA-256 chained to the previous. Any modification breaks the chain.

**Verify chain integrity:**
```typescript
import { verifyAuditChain } from './enterprise/gateway/audit-log.js';
const result = verifyAuditChain();
// → { valid: true } or { valid: false, brokenAtLine: 42 }
```

**SIEM integration:** Mount the audit log volume and ship `audit.jsonl` to your SIEM (Splunk, Elastic, Datadog, etc.).

## Troubleshooting

**Gateway won't start — license error:**
```
[Cerberus] CERBERUS_LICENSE_KEY is not set.
```
→ Set `CERBERUS_LICENSE_KEY` in `enterprise/.env`

**Gateway won't start — config error:**
```
[Cerberus] cerberus.config.yml is invalid
```
→ Check `cerberus.config.yml` syntax against [docs/enterprise-configuration.md](enterprise-configuration.md)

**Tool calls returning 401:**
→ Check `CERBERUS_API_KEY` in `.env` and ensure your agent sends `X-Cerberus-Api-Key` header

**Tool calls returning 429 / rate limited:**
→ Gateway enforces 100 req/min per IP. Increase `RATE_LIMIT` or add your agent's IP to an allow-list at the nginx layer.

**Check logs:**
```bash
docker compose logs cerberus-gateway --tail=50
docker compose logs cerberus-grafana --tail=20
```

## Support

`enterprise@sixsenseenterprise.com`
