# Compliance Posture

_Current-state position, last reviewed 2026-10-13. Written to be handed to a regulated-industry buyer's diligence team without amendment. Where the honest answer is "we don't have that," we say so and name the owner who will close it._

## SOC 2

**No SOC 2 Type 1 attestation exists. No auditor is engaged.**

We will not characterise SOC 2 work as "in flight" until those things are literally true.

**Timing commitment:** Type 1 kickoff ≤ 90 days after first paid design partner signs. Type 1 letter: 6 months from kickoff.

**Compensating controls today:**
- Deny-by-default policy engine
- Append-only, hash-chained audit log: Postgres triggers refuse UPDATE, DELETE and TRUNCATE on decision records. The hash covers each decision's outcome, reason, policy version and decider, but not yet the request inputs ([what the hash covers](/guide/audit-chain#what-the-hash-covers))
- All writes through Zod-validated schema boundaries
- Every change lands through a pull request that must pass CI: build, unit and Postgres integration tests, tenant-isolation tests and a secret scan. DecisionPlane has one maintainer today, so changes are not independently reviewed and `main` is not branch-protected
- No production hosted system to breach

→ [Full SOC 2 scope →](/governance/soc2)

## HIPAA

**We do not sign BAAs. We do not knowingly accept PHI today.**

In library mode, DecisionPlane is not a Business Associate — the decision and its inputs never leave the customer's process. This is the recommended pattern for healthcare prospects through end-of-2026.

If you want to use the hosted daemon with PHI, we will decline until BAA-ready.

## GDPR

**We are not a data controller or processor by default.**

In library mode: you run the engine, you own the data. We never see it.

In daemon mode: you host the daemon. We do not have access to your data unless you grant it.

**Right to erasure (Art. 17):** Audit records are never deleted — the hash chain is the product. Decision inputs, including actor identifiers, are stored unencrypted in append-only tables, so they cannot be erased today. Until per-org encryption with key destruction (crypto-shredding) ships, send pseudonymous identifiers rather than personal data in decision requests.

## Encryption

**SQLite (library mode):** not encrypted at rest by default. Customer is responsible for disk-level encryption in their environment.

**Postgres (daemon mode):** TLS-only DSNs enforced in code. `assertTlsOnlyDsn()` rejects every service DSN without `sslmode=require`, `verify-ca` or `verify-full`. The only override is `DECISIONPLANE_ALLOW_INSECURE_DSN=1`, which is meant for development and test environments; production deployments must keep TLS on. `sslmode=require` encrypts the connection but does not verify the server certificate: use `verify-full` in production.

## Tenant isolation

**Daemon mode:** each org's data is separated by Postgres row-level security that is forced on every tenant table and fails closed: without a tenant context a query returns no rows and cannot write. Services connect as roles that are not superusers, cannot bypass RLS and own no tables, and each service checks this at startup. Isolation is tested in CI on every change: a catalog check of every table, policy and grant, a per-table isolation matrix, and a cross-org API suite.

## What we tell buyers today

> Our library-first architecture means your decisioning data does not leave your environment, which is a stronger confidentiality posture than most SaaS vendors' SOC 2 Type 2 reports. We will begin SOC 2 Type 1 work within 90 days of you signing as a design partner.

Questions: [security@decisionplane.dev](mailto:security@decisionplane.dev)
