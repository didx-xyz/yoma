# Hotfix: Referral pathway task reassignment

## Meta

- **Owner**: Adrian (api)
- **Status**: review; see [feature.md](./feature.md)
- **Started**: 2026-10-21
- **Stage source branch**: `fix/analytics-engagement-memory` (merged through PR #1994)
- **Production hotfix branch**: `fix/referral-pathway-task-reassignment`, based on `current` / `v3.13.3`
- **Ticket**: none — Adrian explicitly requested leaving Linear alone for this hotfix.

## Scope

Fix retained referral tasks swapping opportunities without deleting/recreating tasks, weakening uniqueness or changing API contracts. Keep this independently reviewable and cherry-pickable to `current`, separate from the already committed analytics work.

## Contract and Boundary

The current `(StepId, EntityType, OpportunityId)` unique index and request duplicate validation remain. Reconcile changing assignments inside the existing transaction using the nullable opportunity FK, then apply final assignments. Preserve IDs, creation dates and dependent records. No migration, frontend, CF, analytics or live-data changes.

Validate in Stage first. The Production backport is prepared locally at Adrian's request; commit, PR, merge and release remain separate review gates.

The Production hotfix includes the exact central per-attempt tracking-cleanup fix already on master, without copying SSI replay or CF. Local `current`, `origin/current`, the `v3.13.3` tag and the Production web ref matched the latest successful Production release. See the [backport handoff](./handoffs/2026-10-21-b.md) for verification and pending release steps.

Adrian subsequently approved adding the separately scoped analytics fix to the same branch after reporting Stage looks good. Keep it in a separate commit; see the [combined verification handoff](../YOM-1301-keep-engagement-analytics-reliable-as-usage-grows/YOM-1301-keep-engagement-analytics-reliable-as-usage-grows/handoffs/2026-10-21-b.md). No CF, SSI replay or migration is included.

## Feature

- [Plan and decisions](./feature.md)
- Session handoffs: `handoffs/`
