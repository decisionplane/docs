# Audit-Log Retention

_Anchored in [Compliance Posture](/governance/compliance). This is the buyer-facing extract._

## Core position

The SDK keeps every audit record **forever** by default. This is intentional — an audit chain you can trim is not an audit chain.

"Forever in one SQLite file" is operationally unrealistic at scale, so the retention model is tiered. Tiering does not break the chain: every tier carries chain continuity via shard manifests.

## Tier model

| Tier | Where | Default | Purpose |
| --- | --- | --- | --- |
| **Hot** | SQLite WAL (library) or Postgres (daemon) | Indefinite | Sub-millisecond reads for `getDecision`, `verifyChain` |
| **Warm** | Customer-controlled object storage (S3 / GCS / Azure Blob). Per-day NDJSON.gz shards with manifest hashes. | Indefinite | Cheap, auditable, forensic reads |
| **Cold / Legal hold** | Customer-managed (e.g. S3 Glacier + object lock + compliance retention) | Customer-set | WORM-equivalent for regulated obligations |

## Regulatory floors

Decision records are never deleted or updated: Postgres triggers refuse it in daemon mode, so every floor below is met for decisions by construction. In daemon mode, `AUDIT_RETENTION_DAYS` copies older decisions into an append-only archive table; it never deletes them.

For traces, a Postgres trigger refuses to delete a trace tagged `sox`, `hipaa` or `pci` before its floor, counted from when it was recorded. The library-level check (`checkRetentionFloor`) is not yet wired into a delete path.

| Scope tag | Floor | Source |
| --- | --- | --- |
| `scope: "sox"` | **7 years** in warm or cold | Sarbanes-Oxley §802/§1102 |
| `scope: "hipaa"` | **6 years** from creation (last access is not tracked) | 45 CFR §164.530(j) |
| `scope: "pci"` | **1 year hot, 1 year accessible** | PCI-DSS v4.0 §10.5.1 |
| `scope: "gdpr"` | No floor. Customer-defined. | — |
| No tag | No floor on traces; decisions are kept forever | — |

## Shard format and manifest integrity

Warm-tier shards are written as gzip-compressed NDJSON files (`traces.jsonl.gz`) under date-partitioned object storage keys. Each record is a full `TraceRecord` JSON line including `prev_hash` / `hash` for cross-tier chain continuity.

Each day's shard file is accompanied by a `manifest.json` containing:
- Per-shard metadata: `record_count`, `first_hash`, `last_hash`, `shard_hash` (SHA-256 of raw bytes)
- A `manifest_hash` (HMAC-SHA256 over the canonical shard list) keyed by `WARM_MANIFEST_SECRET`
- A `chain_tip_hash` linking the last warm-tier record into any subsequent cold-tier or hot-tier chain

`WARM_MANIFEST_SECRET` is a **platform-controlled secret** (≥ 32 characters, high-entropy random) set by DecisionPlane ops at deploy time. It is not per-customer; all tenant manifests are signed by the same platform key.

### What auditors can verify without the secret

An auditor with access to a shard export can verify:
1. **Record-level hash chain** — every record's `prev_hash` → `hash` chain from genesis via `dp audit verify-chain --warm-dir <export-dir>`
2. **Per-shard byte integrity** — decompress the `.jsonl.gz` and compute SHA-256 of the raw bytes against `shard_record.shard_hash` in the manifest

What requires `WARM_MANIFEST_SECRET`:
- That the shard *list* in a manifest has not been altered (shard added or removed). For regulated-industry audits, the operator discloses `WARM_MANIFEST_SECRET` to the auditor under NDA.

A future enhancement will add asymmetric manifest signing (Ed25519 public key published) to allow public-key verification without sharing the secret.

## GDPR erasure

Audit records are never deleted in response to a right-to-erasure request.

**Not yet supported: crypto-shredding.** The planned pattern encrypts sensitive fields at write time with a per-org key and destroys the key to make the plaintext unrecoverable while the chain stays intact. Today, decision inputs (including actor identifiers) are stored unencrypted, so they cannot be erased. Send pseudonymous identifiers rather than personal data in decision requests.

## `dp audit verify-chain`

Walks the full hash chain across hot and warm tiers and reports any break.

```
# Hot tier only (SQLite export)
dp audit verify-chain --db audit.db

# Warm tier from a local directory (offline auditor use — no credentials needed)
dp audit verify-chain --warm-dir /path/to/shard/export

# Hot + warm tiers with manifest integrity check
dp audit verify-chain --db audit.db --warm-dir /path/to/shards \
  --verify-manifests --manifest-secret-env WARM_MANIFEST_SECRET

# Warm tier from S3
dp audit verify-chain --s3-bucket my-audit-shards --s3-prefix shards/

# Output
PASS  hot=0  warm=10000000  total=10000000  lastHash=<hex>  elapsed=48230ms
```

## What ships today

- **Hot tier** — SQLite WAL and Postgres, indefinite retention. Decisions are append-only.
- **Scope-tag floors for traces** — enforced by a Postgres trigger (migration 0003).
- **Shard format and verification** — the warm-tier shard and manifest format, the `WarmTierWriter` library class and `dp audit verify-chain` (hot and warm, offline or from S3).

## Not yet built

- **Automatic warm-tier export.** Nothing in the daemon writes shards on a schedule yet; the S3 adapter works, and the GCS and Azure adapters need optional packages.
- **Cold tier events.** `buildArchivalEvent` exists, but nothing emits `decision.archived` yet.
- **Application-level floor checks** on delete paths, and HIPAA last-access tracking.
- **Crypto-shredding** for GDPR erasure (see above).
