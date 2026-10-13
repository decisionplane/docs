# Inspect the Audit Chain

Every decision — including overrides — is appended to a hash chain. Each record's `hash` covers the decision's fields plus the previous record's `hash`, so changing a recorded decision breaks every later link. [What the hash covers](#what-the-hash-covers) and [its limits](#limits) are listed below.

## Verify chain integrity

```typescript
const result = await client.verifyChain()

console.log(result.ok)        // true = no tampering detected
console.log(result.length)    // number of records in the chain
console.log(result.headHash)  // SHA-256 of the most recent record
console.log(result.verifiedAt)// ISO timestamp of the verification run

if (!result.ok) {
  console.error(`Chain broken at record #${result.brokenAt}: ${result.message}`)
}
```

`verifyChain()` calls `GET /v1/audit/chain` on the daemon, which re-computes the hash chain across every record in the audit store and returns the first broken link if any exists.

## What the chain proves

| Property | How it's enforced |
| --- | --- |
| **Append-only** | All writes go through the engine. In Postgres, triggers refuse UPDATE, DELETE and TRUNCATE on decision records, and the service role can only SELECT and INSERT. |
| **Tamper-evidence** | Each `hash` covers the prior `prevHash` and the decision fields listed below. |
| **Override visibility** | Overrides are separate records referencing `requestId`, not edits to the original. |
| **Chain continuity** | `verifyChain()` reads all records in insert order and recomputes. |

## What the hash covers

The hash covers `id`, `requestId`, `outcome`, `reason`, `decidedAt`, `decidedBy`, `policyVersion`, `prevHash`, `chainKey`, `actorSignature` and the latency fields.

It does **not** cover the `request` snapshot (action, actor, resource, context). The snapshot is stored with the record, but a change to it does not break the chain. Binding a digest of the request into the hash is planned.

## Limits

- **Unkeyed chains.** Without `CHAIN_HMAC_KEY_HEX` the chain uses plain SHA-256: anyone who can write to the database can rewrite a record and recompute every later hash. Set the key in production (see below).
- **Truncation.** Removing the newest records leaves a valid shorter chain. External anchoring of chain heads is planned.
- **Database owner.** The triggers stop the application, not the schema owner or a superuser, who can disable them.

## Reading individual records

```typescript
// Fetch a single decision by its record ID
const record = await client.getDecision(recordId)

if (record) {
  console.log(record.outcome)
  console.log(record.reason)
  console.log(record.policyVersion)
  console.log(record.prevHash)  // links to the previous record
  console.log(record.hash)      // this record's position in the chain
}
```

## CLI shortcut

```bash
# From the repo root, after pnpm dev is running
curl -s -H "Authorization: Bearer $(cat .dev-api-key)" \
  http://localhost:3000/v1/audit/chain | jq .
```

Expected output:

```json
{
  "ok": true,
  "length": 3,
  "headHash": "abc123...",
  "verifiedAt": "2026-05-23T12:00:00.000Z"
}
```

---

## HMAC keying for production deployments

The chain key is set on the daemon, not per org: `CHAIN_HMAC_KEY_HEX`, 64 hex characters (32 bytes). With it, every chain hash is HMAC-SHA256 under that key, so someone with database access but without the key cannot forge a valid chain. Without it the chain uses plain SHA-256.

```bash
openssl rand -hex 32   # generate once, store in your secret manager
```

- Pass the same key on every start. Records written under one key only verify with that key, so a lost key means existing records can no longer be verified — back it up externally.
- There is one key per daemon today; per-org keys and rotation are planned.

### The `chainHmacKeyHex` org setting

Despite its name, the org setting `chainHmacKeyHex` (**Org Admin → Generate** in the UI) does **not** key the audit chain. It verifies the optional `X-Actor-Claim-Sig` header: an HMAC over the token prefix and the request's agent, delegated-by and session IDs. The value is write-only through the API: `GET /v1/orgs/:orgId/settings` returns only `chainHmacKeyHexConfigured`.

---

You have now completed the tutorial path. The three questions the chain answers:

1. **What was decided?** — `DecisionRecord.outcome` + `reason`
2. **Why?** — `policyVersion` + input snapshot in `request`
3. **By whose authority?** — `actor` in the request, `overriddenBy` if overridden
4. **What if wrong?** — override record appended, original intact, chain verifiable

→ Dive deeper: [The Four Pillars →](/guide/four-pillars)
