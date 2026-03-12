#!/usr/bin/env bash
# Cerberus Enterprise — Interactive Setup
#
# Checks prerequisites, generates secure .env, validates config, starts the
# stack, and verifies health endpoints.
#
# Usage: ./setup.sh

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

info()    { echo -e "${BOLD}[Cerberus]${RESET} $*"; }
success() { echo -e "${GREEN}[Cerberus] ✓ $*${RESET}"; }
warn()    { echo -e "${YELLOW}[Cerberus] ⚠ $*${RESET}"; }
error()   { echo -e "${RED}[Cerberus] ✗ $*${RESET}" >&2; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── 1. Prerequisites ──────────────────────────────────────────────────────

info "Checking prerequisites..."

if ! command -v docker &>/dev/null; then
  error "Docker is not installed. Install from https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker compose version &>/dev/null; then
  error "Docker Compose v2 is required. Update Docker Desktop or install the compose plugin."
  exit 1
fi

success "Docker $(docker --version | awk '{print $3}' | tr -d ',')"
success "Docker Compose $(docker compose version --short)"

# ── 2. Generate .env if missing ───────────────────────────────────────────

if [ ! -f .env ]; then
  info "Generating .env from template..."
  cp .env.example .env

  # Generate secure random values
  GRAFANA_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
  GRAFANA_SECRET=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 48)

  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/GRAFANA_ADMIN_PASSWORD=changeme/GRAFANA_ADMIN_PASSWORD=${GRAFANA_PASS}/" .env
    sed -i '' "s/GRAFANA_SECRET_KEY=changeme32charrandombytesgohere!!/GRAFANA_SECRET_KEY=${GRAFANA_SECRET}/" .env
  else
    sed -i "s/GRAFANA_ADMIN_PASSWORD=changeme/GRAFANA_ADMIN_PASSWORD=${GRAFANA_PASS}/" .env
    sed -i "s/GRAFANA_SECRET_KEY=changeme32charrandombytesgohere!!/GRAFANA_SECRET_KEY=${GRAFANA_SECRET}/" .env
  fi

  success ".env generated with secure passwords"
  echo ""
  warn "Grafana admin password: ${BOLD}${GRAFANA_PASS}${RESET}"
  warn "Save this password — it will not be shown again."
  echo ""
fi

# ── 3. Check license key ──────────────────────────────────────────────────

LICENSE_KEY=$(grep '^CERBERUS_LICENSE_KEY=' .env | cut -d= -f2- | tr -d '"' | xargs)

if [ -z "$LICENSE_KEY" ] || [ "$LICENSE_KEY" = "cbr_ent_" ]; then
  error "CERBERUS_LICENSE_KEY is not set in .env"
  echo ""
  echo "  Contact us to obtain a license key:"
  echo "  → enterprise@sixsenseenterprise.com"
  echo ""
  echo "  Then edit .env and set:"
  echo "  CERBERUS_LICENSE_KEY=cbr_ent_<your-key>"
  echo ""
  exit 1
fi

success "License key found"

# ── 4. Check config ───────────────────────────────────────────────────────

if [ ! -f cerberus.config.yml ]; then
  warn "cerberus.config.yml not found — creating from example..."
  cp cerberus.config.yml.example cerberus.config.yml
  echo ""
  error "Edit cerberus.config.yml to configure your tools, then re-run ./setup.sh"
  echo ""
  echo "  Quick reference:"
  echo "  → docs/enterprise-configuration.md"
  echo ""
  exit 1
fi

success "cerberus.config.yml found"

# ── 5. Wire alerting from .env ────────────────────────────────────────────

SLACK_URL=$(grep '^SLACK_WEBHOOK_URL=' .env 2>/dev/null | cut -d= -f2- | tr -d '"' | xargs 2>/dev/null || true)
PD_KEY=$(grep '^PAGERDUTY_KEY=' .env 2>/dev/null | cut -d= -f2- | tr -d '"' | xargs 2>/dev/null || true)
SMTP_H=$(grep '^SMTP_HOST=' .env 2>/dev/null | cut -d= -f2- | tr -d '"' | xargs 2>/dev/null || true)
SMTP_U=$(grep '^SMTP_USER=' .env 2>/dev/null | cut -d= -f2- | tr -d '"' | xargs 2>/dev/null || true)
SMTP_P=$(grep '^SMTP_PASS=' .env 2>/dev/null | cut -d= -f2- | tr -d '"' | xargs 2>/dev/null || true)
ALERT_TO=$(grep '^ALERT_EMAIL_TO=' .env 2>/dev/null | cut -d= -f2- | tr -d '"' | xargs 2>/dev/null || true)

if [ -n "$SLACK_URL" ] || [ -n "$PD_KEY" ] || [ -n "$SMTP_H" ]; then
  info "Generating alertmanager.yml with configured notification channels..."

  CRITICAL_RECEIVER="log"
  RECEIVER_BLOCK=""

  if [ -n "$SLACK_URL" ]; then
    CRITICAL_RECEIVER="slack"
    RECEIVER_BLOCK="${RECEIVER_BLOCK}
  - name: 'slack'
    slack_configs:
      - api_url: '${SLACK_URL}'
        channel: '#cerberus-alerts'
        title: '[{{ .Status | toUpper }}] {{ .CommonAnnotations.summary }}'
        text: '{{ .CommonAnnotations.description }}'
        send_resolved: true"
    success "Slack alerts enabled"
  fi

  if [ -n "$PD_KEY" ]; then
    CRITICAL_RECEIVER="pagerduty"
    RECEIVER_BLOCK="${RECEIVER_BLOCK}
  - name: 'pagerduty'
    pagerduty_configs:
      - routing_key: '${PD_KEY}'
        description: '{{ .CommonAnnotations.summary }}'
        details:
          description: '{{ .CommonAnnotations.description }}'"
    success "PagerDuty alerts enabled"
  fi

  if [ -n "$SMTP_H" ] && [ -n "$ALERT_TO" ]; then
    RECEIVER_BLOCK="${RECEIVER_BLOCK}
  - name: 'email'
    email_configs:
      - to: '${ALERT_TO}'
        from: 'cerberus-alerts@cerberus.local'
        smarthost: '${SMTP_H}:587'
        auth_username: '${SMTP_U}'
        auth_password: '${SMTP_P}'"
    success "Email alerts enabled → ${ALERT_TO}"
  fi

  cat > monitoring/alertmanager.yml <<AMEOF
# Generated by setup.sh — do not edit manually. Re-run ./setup.sh to update.
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'log'

  routes:
    - matchers:
        - severity = critical
        - team = security
      receiver: '${CRITICAL_RECEIVER}'
      group_wait: 0s
      repeat_interval: 1h

    - matchers:
        - team = platform
      receiver: 'log'

receivers:
  - name: 'log'
    webhook_configs: []
${RECEIVER_BLOCK}
AMEOF
else
  info "No alert channels configured — alerts visible in Grafana/Alertmanager UI only."
  info "To enable Slack/PagerDuty/email, set env vars in .env and re-run ./setup.sh"
fi

# ── 6. Authenticate to GitHub Container Registry ──────────────────────────

info "Authenticating to GitHub Container Registry..."
echo ""
echo "  The Cerberus gateway image is hosted at ghcr.io/odingard/cerberus-gateway"
echo "  You need a GitHub account with access to pull it."
echo ""
echo "  Option A — GitHub Personal Access Token (recommended):"
echo "    Create one at: https://github.com/settings/tokens  (scope: read:packages)"
echo "    Then run:  echo YOUR_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin"
echo ""
echo "  Option B — GitHub CLI (if installed):"
echo "    gh auth token | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin"
echo ""

if ! docker login ghcr.io --get-login &>/dev/null 2>&1; then
  warn "Not logged in to ghcr.io. Please authenticate using one of the options above, then re-run ./setup.sh"
  exit 1
fi
success "Authenticated to ghcr.io"

# ── 7. Start the stack ────────────────────────────────────────────────────

info "Pulling images and starting Cerberus Enterprise stack..."
docker compose pull --quiet 2>/dev/null || true
docker compose up -d

success "Stack started"

# ── 8. Health check ───────────────────────────────────────────────────────

info "Waiting for gateway to be ready..."
GATEWAY_PORT=$(grep 'port:' cerberus.config.yml 2>/dev/null | awk '{print $2}' | head -1)
GATEWAY_PORT="${GATEWAY_PORT:-4000}"

for i in $(seq 1 12); do
  if curl -sf "http://localhost:${GATEWAY_PORT}/health" &>/dev/null; then
    break
  fi
  if [ "$i" -eq 12 ]; then
    error "Gateway did not become healthy after 60s"
    echo ""
    echo "  Check logs with: docker compose logs cerberus-gateway"
    echo ""
    exit 1
  fi
  sleep 5
done

HEALTH=$(curl -s "http://localhost:${GATEWAY_PORT}/health")
success "Gateway healthy: ${HEALTH}"

# ── 9. Summary ────────────────────────────────────────────────────────────

GRAFANA_PASS=$(grep '^GRAFANA_ADMIN_PASSWORD=' .env | cut -d= -f2- | tr -d '"' | xargs)

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════${RESET}"
echo -e "${GREEN}${BOLD}  Cerberus Enterprise is running!${RESET}"
echo -e "${BOLD}═══════════════════════════════════════════════════════${RESET}"
echo ""
echo -e "  Gateway:  ${BOLD}http://localhost:${GATEWAY_PORT}${RESET}"
echo -e "  Grafana:  ${BOLD}http://localhost:3000${RESET}  (admin / ${GRAFANA_PASS})"
echo ""
echo "  Route your AI agent's tool calls through the gateway:"
echo "    POST http://localhost:${GATEWAY_PORT}/tool/<toolName>"
echo "         { \"args\": { ... } }"
echo ""
echo "  Full documentation:"
echo "    docs/enterprise-deployment.md"
echo "    docs/enterprise-configuration.md"
echo ""
