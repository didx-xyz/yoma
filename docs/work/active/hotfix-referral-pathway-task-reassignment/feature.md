# Feature: Retained referral task opportunity swaps

## Meta

- **Owner**: Adrian
- **Areas**: api
- **Status**: review — ready for Adrian's commit and Stage PR
- **Started**: 2026-10-21
- **Ticket**: intentionally omitted at Adrian's request

## Problem / Goal

Two retained task IDs can request a valid swap but the first immediate repository save collides with the other task's still-saved assignment. Deleting absent IDs first does not resolve a retained cycle. Reconcile the intermediate state without replacing live tasks.

## Plan

Within the existing ProgramService transaction, read retained assignment snapshots, temporarily clear only changing opportunity assignments, then retain the normal update/insert and final completeness validation flow. Opt this update into the existing central execution strategy's tracking cleanup; do not duplicate EF state handling in repositories. The task repository and shared execution strategy remain unchanged.

## Tasks

- [x] Verify nullable FK, immediate uniqueness and references.
- [x] Implement two-phase assignment reconciliation preserving task IDs.
- [x] Reproduce and verify two-task/longer cycles on PostgreSQL.
- [x] Cover replacements, ordering, remove/add, duplicates, rollback and retained references.
- [x] Build, regression test and record isolated staging/backport guidance.

## Decisions

- 2026-10-21: Keep the unique index unchanged. Its default null-distinct behavior permits transaction-local temporary nulls; final requests still require distinct non-empty opportunity IDs.
- 2026-10-21: Do not delete/recreate retained tasks or use placeholder opportunity IDs. No incoming task FK exists in the current model; progress is calculated by task ID from current pathway data. Tests will include a restrictive canary reference to prove identity preservation.
- 2026-10-21: Leave Linear untouched per Adrian. Keep this ticketless hotfix context separate from analytics documentation and commit scope.
- 2026-10-21: Reuse central tracking cleanup, not per-property `IsModified` flags. Stage already includes the per-attempt cleanup fix. A later Production backport must include that existing shared-helper fix if `current` still has the old end-of-all-retries cleanup timing; do not cherry-pick unrelated SSI/CF work.

## Links

- [Scope and release boundary](./README.md)
- [Verification and backport handoff](./handoffs/2026-10-21-a.md)
