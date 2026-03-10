# Runbook: Emergency License Revocation

**Severity:** P1
**Owner:** Provider operations team

## When to Use

- Customer reports license key compromise (key leaked publicly, ex-employee access)
- Fraud or payment dispute on a license
- Customer requests immediate termination

## Steps

### 1. Verify the request

- Confirm requester identity (must be a named contact on the account)
- Document the reason for revocation
- If key was leaked publicly, note the exposure URL

### 2. Revoke the key

```bash
# SSH into license server
ssh root@137.184.69.104

# Connect to SQLite
docker compose exec cerberus-license-server npx tsx -e "
  const { getDb } = require('./src/db.js');
  const db = getDb();
  const key = 'cbr_ent_XXXXXX';  // the compromised key
  db.prepare('UPDATE license_keys SET revoked = 1 WHERE key = ?').run(key);
  console.log('Key revoked:', key);
"
```

### 3. Verify revocation

```bash
curl -X POST https://api.cerberus.sixsenseenterprise.com/v1/license/validate \
  -H "Content-Type: application/json" \
  -d '{"licenseKey": "cbr_ent_XXXXXX"}'
# Expected: {"valid": false, "reason": "Key has been revoked"}
```

### 4. Issue replacement key

If the customer needs a new key:
- Generate via the license server admin endpoint or manually insert into DB
- Send new key to the customer's verified email
- Customer updates `.env` and restarts: `docker compose restart cerberus-gateway`

### 5. Customer communication

Email the customer:
- Confirm old key is revoked
- Provide new key (if applicable)
- Recommend: rotate any API keys that were co-located with the license key

### 6. Post-incident

- Document in incident log
- If publicly leaked, check if any unauthorized instances were activated (review license server access logs)
