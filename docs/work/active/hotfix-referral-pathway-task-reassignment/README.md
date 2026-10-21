# Hotfix: Referral pathway task reassignment

## Meta

- **Owner**: Adrian (api)
- **Status**: review; see [feature.md](./feature.md)
- **Started**: 2026-10-21
- **Branch**: `fix/analytics-engagement-memory`
- **Ticket**: none — Adrian explicitly requested leaving Linear alone for this hotfix.

## Scope

Fix retained referral tasks swapping opportunities without deleting/recreating tasks, weakening uniqueness or changing API contracts. Keep this independently reviewable and cherry-pickable to `current`, separate from the already committed analytics work.

## Contract and Boundary

The current `(StepId, EntityType, OpportunityId)` unique index and request duplicate validation remain. Reconcile changing assignments inside the existing transaction using the nullable opportunity FK, then apply final assignments. Preserve IDs, creation dates and dependent records. No migration, frontend, CF, analytics or live-data changes.

Validate in Stage first. No commit/push until Adrian reviews; a Production cherry-pick is a later explicitly coordinated action.

For the later Production backport, retain the existing central per-attempt tracking-cleanup behavior. `origin/current` inspected this session still clears only after all retries. See the handoff for the isolated prerequisite; do not copy unrelated CF/SSI changes.

## Feature

- [Plan and decisions](./feature.md)
- Session handoffs: `handoffs/`
