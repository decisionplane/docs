# The Four Pillars

Every automated decision must answer four durable questions to be legally defensible, auditable, and overridable. DecisionPlane is built around these four pillars — they are not a UX choice, they are the schema.

## 1. What was decided?

The `DecisionRecord` captures the outcome (`approve`, `deny`, or `escalate`) and a `reason` string from the policy that matched. The full request snapshot is embedded in the record so there is never any ambiguity about what inputs produced the outcome.

```typescript
record.outcome      // "approve" | "deny" | "escalate"
record.reason       // "Refund amount within low-risk threshold (≤$100)"
record.decidedAt    // ISO timestamp
```

## 2. Why?

The `policyVersion` field names the policy and the version its author declared. The `request` snapshot captures every input the engine saw — amount, customer tier, actor roles — so you can re-run the same inputs against that policy.

```typescript
record.policyVersion   // "refund-safety@3"
record.request         // full DecisionRequest snapshot
```

In the DSL evaluator, risk factors and weights are recorded alongside the score that crossed the threshold. The outcome is never a black box.

## 3. By whose authority?

The `actor` field in every `DecisionRequest` carries provenance end-to-end: kind (`human`, `agent`, `system`), principal ID, roles, delegation chain depth, and MFA attestation. For overrides, `overriddenBy` names the human who intervened.

The daemon binds each decision to the org of the authenticated API token. The actor fields themselves are supplied by the caller and are not verified against the token, except for the optional signed claim (`X-Actor-Claim-Sig`) over the agent, delegated-by and session IDs. Deriving the actor from the authenticated principal is planned.

```typescript
record.request.actor.kind              // "agent"
record.request.actor.principal.id     // "support-bot-v2"
record.request.actor.principal.roles  // ["support"]
record.decidedBy                       // engine / policy ID
```

The `delegated_by_human_with_mfa` policy condition lets you require that an MFA-authenticated human is somewhere in the delegation chain before certain actions are approved.

## 4. What if it was wrong?

The override path appends a new `DecisionRecord` to the audit chain. It references the original `requestId` and records who overrode it, why, and with what new outcome. The original record is never mutated.

The hash chain makes a change to any recorded outcome, reason, policy version or decider — original or override — detectable with `verifyChain()`. The request snapshot is stored with the record but is not yet covered by the hash; see [the audit chain's limits](/guide/audit-chain#limits).

```typescript
// Override appends a new record. Original is unchanged.
const override = await client.applyOverride(record.id, {
  outcome: 'approve',
  reason: 'Supervisor manual review confirmed.',
  overriddenBy: 'alice@example.com',
}, idempotencyKey)
```

---

These four pillars are why the evidence for every automated decision is always recorded, the decision itself is tamper-evident, and the human override path is always open.
