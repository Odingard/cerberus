# Runbook: Upgrade and Rollback Procedure

**Severity:** P3
**Owner:** Customer operations team

## Pre-Upgrade Checklist

- [ ] Read release notes for the new version
- [ ] Backup current `cerberus.config.yml` and `.env`
- [ ] Backup audit log: `cp /var/log/cerberus/audit.jsonl audit-backup-$(date +%Y%m%d).jsonl`
- [ ] Verify current stack is healthy: `curl http://localhost:4000/health`
- [ ] Schedule maintenance window (recommended, not required)

## Upgrade Procedure

### Option A: Tarball-based upgrade

```bash
# 1. Download new version
wget https://releases.cerberus.sixsenseenterprise.com/cerberus-enterprise-<new-version>.tar.gz

# 2. Verify checksum
sha256sum -c cerberus-enterprise-<new-version>.tar.gz.sha256

# 3. Extract alongside current deployment
tar xzf cerberus-enterprise-<new-version>.tar.gz

# 4. Copy your config into new directory
cp current-dir/.env cerberus-enterprise-<new-version>/
cp current-dir/cerberus.config.yml cerberus-enterprise-<new-version>/

# 5. Switch to new version
cd cerberus-enterprise-<new-version>

# 6. Pull new images and restart
docker compose pull
docker compose up -d

# 7. Verify health
curl http://localhost:4000/health
```

### Option B: Image tag-based upgrade

If using GHCR images directly:

```bash
# 1. Update image tag in docker-compose.yml
# image: ghcr.io/odingard/cerberus-gateway:v1.0.0
# → image: ghcr.io/odingard/cerberus-gateway:v1.1.0

# 2. Pull and restart
docker compose pull cerberus-gateway
docker compose up -d cerberus-gateway

# 3. Verify
curl http://localhost:4000/health
```

## Rollback Procedure

If the new version has issues:

```bash
# Option A: Switch back to previous directory
cd ../cerberus-enterprise-<old-version>
docker compose up -d

# Option B: Revert image tag
# Edit docker-compose.yml back to old version tag
docker compose pull cerberus-gateway
docker compose up -d cerberus-gateway

# Verify rollback
curl http://localhost:4000/health
```

## Post-Upgrade Verification

```bash
# 1. Health check
curl -s http://localhost:4000/health | jq .

# 2. Send a test tool call
curl -X POST http://localhost:4000/tool/<your-tool> \
  -H "Content-Type: application/json" \
  -d '{"args": {"test": true}}'

# 3. Check Grafana for metrics
# Open http://localhost:3000 — panels should show new data points

# 4. Verify audit log chain is intact
# New entries should chain correctly from pre-upgrade entries

# 5. Check container versions
docker compose exec cerberus-gateway cat /app/VERSION 2>/dev/null
```

## Zero-Downtime Upgrades

The gateway supports zero-downtime restarts. Docker Compose's default restart behavior stops the old container and starts the new one. For true zero-downtime:

1. Run a second gateway instance on a different port
2. Shift load balancer traffic to the new instance
3. Drain and stop the old instance
4. Update the primary to the new version
