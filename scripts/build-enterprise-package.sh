#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# Cerberus Enterprise — Package Builder
#
# Builds a self-contained tarball that customers download after purchasing.
# The tarball contains only what the customer needs — no source code, no tests,
# no dev tooling. The Cerberus gateway runs as a pre-built Docker image pulled
# from GHCR.
#
# Usage:  ./scripts/build-enterprise-package.sh [version]
# Output: dist/cerberus-enterprise-<version>.tar.gz
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

VERSION="${1:-$(node -p "require('./package.json').version")}"
DIST_DIR="dist"
PKG_DIR="${DIST_DIR}/cerberus-enterprise-${VERSION}"

echo "Building Cerberus Enterprise package v${VERSION}..."

# Clean
rm -rf "${PKG_DIR}" "${DIST_DIR}/cerberus-enterprise-${VERSION}.tar.gz"
mkdir -p "${PKG_DIR}"

# ── Customer-facing files ──────────────────────────────────────────────────

# Docker Compose — rewrite for customer's flat directory layout:
#   1. Replace build: block with pre-built GHCR image
#   2. Fix ../monitoring/ → ./monitoring/ (tarball has monitoring/ at root level)
sed \
  -e 's|build:|# build:|' \
  -e 's|context: \.\.|# context: ..|' \
  -e 's|dockerfile: enterprise/gateway/Dockerfile|# dockerfile: enterprise/gateway/Dockerfile|' \
  -e "/# dockerfile: enterprise\/gateway\/Dockerfile/a\\
\\    image: ghcr.io/odingard/cerberus-gateway:v${VERSION}" \
  -e "s|\.\./monitoring/|./monitoring/|g" \
  enterprise/docker-compose.yml > "${PKG_DIR}/docker-compose.yml"

# Config templates
cp enterprise/.env.example        "${PKG_DIR}/.env.example"
cp enterprise/cerberus.config.yml.example "${PKG_DIR}/cerberus.config.yml.example"

# Setup script
cp enterprise/setup.sh            "${PKG_DIR}/setup.sh"
chmod +x "${PKG_DIR}/setup.sh"

# Monitoring configs (Grafana, Prometheus, Alertmanager, OTel)
mkdir -p "${PKG_DIR}/monitoring/grafana/provisioning/datasources"
mkdir -p "${PKG_DIR}/monitoring/grafana/provisioning/dashboards"
mkdir -p "${PKG_DIR}/monitoring/grafana/dashboards"
cp monitoring/otel-collector.yml   "${PKG_DIR}/monitoring/"
cp monitoring/prometheus.yml       "${PKG_DIR}/monitoring/"
cp monitoring/alerts.yml           "${PKG_DIR}/monitoring/"
cp monitoring/alertmanager.yml     "${PKG_DIR}/monitoring/"
cp -r monitoring/grafana/provisioning/ "${PKG_DIR}/monitoring/grafana/provisioning/"
cp -r monitoring/grafana/dashboards/   "${PKG_DIR}/monitoring/grafana/dashboards/"

# Documentation
mkdir -p "${PKG_DIR}/docs"
cp enterprise/README.md            "${PKG_DIR}/README.md"
cp docs/enterprise-deployment.md   "${PKG_DIR}/docs/deployment.md"
cp docs/enterprise-configuration.md "${PKG_DIR}/docs/configuration.md"
cp docs/troubleshooting.md         "${PKG_DIR}/docs/troubleshooting.md" 2>/dev/null || true
cp docs/capacity-planning.md       "${PKG_DIR}/docs/capacity-planning.md" 2>/dev/null || true

# Legal
mkdir -p "${PKG_DIR}/legal"
for f in EULA.md MSA.md SLA.md PRIVACY.md DPA.md COMPLIANCE.md; do
  cp "legal/${f}" "${PKG_DIR}/legal/${f}" 2>/dev/null || true
done

# Runbooks
if [ -d docs/runbooks ]; then
  mkdir -p "${PKG_DIR}/docs/runbooks"
  cp docs/runbooks/*.md "${PKG_DIR}/docs/runbooks/" 2>/dev/null || true
fi

# Version stamp
echo "${VERSION}" > "${PKG_DIR}/VERSION"
echo "Built: $(date -u '+%Y-%m-%dT%H:%M:%SZ')" >> "${PKG_DIR}/VERSION"

# ── Build tarball ──────────────────────────────────────────────────────────

cd "${DIST_DIR}"
tar czf "cerberus-enterprise-${VERSION}.tar.gz" "cerberus-enterprise-${VERSION}/"
cd ..

# Checksum
sha256sum "${DIST_DIR}/cerberus-enterprise-${VERSION}.tar.gz" > "${DIST_DIR}/cerberus-enterprise-${VERSION}.tar.gz.sha256" 2>/dev/null || \
  shasum -a 256 "${DIST_DIR}/cerberus-enterprise-${VERSION}.tar.gz" > "${DIST_DIR}/cerberus-enterprise-${VERSION}.tar.gz.sha256"

# Clean up expanded dir
rm -rf "${PKG_DIR}"

SIZE=$(du -h "${DIST_DIR}/cerberus-enterprise-${VERSION}.tar.gz" | cut -f1)
echo ""
echo "Package built successfully:"
echo "  ${DIST_DIR}/cerberus-enterprise-${VERSION}.tar.gz  (${SIZE})"
echo "  ${DIST_DIR}/cerberus-enterprise-${VERSION}.tar.gz.sha256"
echo ""
echo "Customer receives this tarball + their license key via email."
echo "They extract, set CERBERUS_LICENSE_KEY in .env, and run ./setup.sh"
