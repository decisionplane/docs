# Architecture

DecisionPlane is an **audited AI decisioning engine**. Every action your AI agents, services, or users request passes through a policy engine that produces a tamper-evident audit record before allowing, denying, or escalating the request.

## Core Concepts

| Concept | What it does |
|---------|-------------|
| **Decision** | A single allow/deny/escalate verdict on an action request |
| **Policy** | YAML rule that matches requests by actor, action, and context |
| **Audit Chain** | Append-only log of decisions, each linked to the previous by hash (HMAC-SHA256 when `CHAIN_HMAC_KEY_HEX` is set) |
| **Actor** | The entity making the request — agent, human, or service |
| **Org** | An isolated tenant — separate tokens, audit log, and metrics; optionally its own policy directory |

## Architecture Diagram

The diagram below shows the full system: your application (left), the daemon (centre), and the storage layer (right). The bottom row shows the four deployment modes.

<!-- diagram rendered at /guide/architecture -->

**Data flow for a single decision:**

```
Your App
  └─▶ SDK / HTTP / MCP / Envoy
        └─▶ Auth Middleware  (token → org_id + role)
              └─▶ Policy Engine  (first-matching rule wins)
                    └─▶ Audit Chain  (hash-chained append)
                          └─▶ Postgres  (forced, fail-closed RLS per org)
                                └─▶ Decision record returned
```

## Components

### Policy Engine

Evaluates requests against YAML policies. Two formats are supported:

- **Rules format** — explicit conditions with operators (`eq`, `matches`, `in`, `lte`, etc.)
- **Plan DSL format** — risk-factor scoring with thresholds (`allow_below`, `approval_below`, `deny_above`)

Policies are loaded from YAML files. All orgs share the daemon's policy directory (`POLICY_DIR`) unless an org is given its own `policy_dir`.

### Audit Chain

Every decision writes an append-only record linked to the previous by hash:

```
GENESIS (0x000...000)
  └─▶ Record #1  prevHash=GENESIS  hash=HMAC(key, prevHash + record)
        └─▶ Record #2  prevHash=hash#1  hash=HMAC(key, prevHash + record)
              └─▶ ...
```

`GET /v1/audit/chain` walks the caller's chains and returns `{ ok, length, headHash }`. A change to a recorded decision breaks the chain. The hash does not yet cover the request snapshot; see [What the hash covers](/guide/audit-chain#what-the-hash-covers).

The daemon's `CHAIN_HMAC_KEY_HEX` turns on HMAC-SHA256 keying; set it in production. Without it the chain uses plain SHA-256. (The org setting `chainHmacKeyHex` verifies signed actor claims and does not key the chain.)

### Approval Flow

When a policy outcome is `escalate`, the decision enters an approval hold:

```
escalate → POST /v1/approvals/:id/approve  (or /reject)
         → webhook fired on resolution
         → original caller receives final verdict
```

Approvals expire after a configurable timeout (default 1 hour). An approval can name required roles; these are enforced when it is resolved in Slack. The REST API checks only the `approvals:write` scope today.

### Org RBAC

Every API token is scoped to an organization. Row-Level Security in Postgres ensures queries from one org never see another org's data.

Built-in roles: `owner` → `admin` → `member` → `viewer`.

---

## Deployment Modes

### Library Mode (in-process)

The engine, policy evaluator, and audit log run **in-process** against a local SQLite database. No daemon, no Postgres, no network hop in the decision path.

```bash
npm install @decisionplane/sdk
```

Best for: single-service deployments, local dev, serverless functions.

### Daemon Mode (HTTP)

Fastify server on port 3000. Postgres-backed. All features enabled: multi-org RBAC, approval flow, webhooks, telemetry, retention.

```bash
# Docker
docker run -p 3000:3000 \
  -e AUDIT_BACKEND=postgres -e TOKEN_BACKEND=postgres \
  -e AUDIT_DSN=postgres://dp_app:...@db:5432/decisionplane?sslmode=require \
  -e TRACE_DSN=postgres://dp_app:...@db:5432/decisionplane?sslmode=require \
  -e CHAIN_HMAC_KEY_HEX=<64 hex chars; generate once and reuse> \
  <decisionplane-image>:<version>   # provided with access

# Kubernetes — see k8s/manifest.yaml in the repo
```

Best for: multi-service, multi-org, or production deployments.

Tenant isolation in daemon mode is enforced by Postgres, not only by the application. Every tenant table has row-level security that is forced and has no exceptions for a missing tenant. Each request runs in a transaction scoped to the caller's org, and background jobs process one org at a time. The daemon connects as a role that cannot bypass these policies, and it refuses to start otherwise. See [Library vs Daemon Mode](/guide/deployment-modes#postgres-roles) for the database roles.

### MCP Mode (AI Agents)

Exposes decisioning as MCP tools so Claude, Copilot, Cursor, and other AI agents can call them directly.

```bash
npx @decisionplane/mcp
```

Tools available to the agent: `evaluate`, `simulate`, `await-approval`, `explain`, `list-policies`.

Best for: giving AI agents governed, auditable access to actions.

### Envoy Ext-AuthZ (Service Mesh)

A gRPC adapter that plugs into Envoy's `ext_authz` filter. Every HTTP request to your services passes through DecisionPlane for policy evaluation — zero application code change required.

```bash
helm install decisionplane-envoy ./adapters/envoy-ext-authz/helm
```

Best for: k8s service meshes, API gateways, zero-trust architectures.
