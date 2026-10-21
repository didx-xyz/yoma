# Feature: Retained referral task opportunity swaps

## Meta

- **Owner**: Adrian
- **Areas**: api
- **Status**: review — merged to master; Production backport prepared, release approval pending
- **Started**: 2026-10-21
- **Ticket**: intentionally omitted at Adrian's request

## Problem / Goal

Two retained task IDs can request a valid swap but the first immediate repository save collides with the other task's still-saved assignment. Deleting absent IDs first does not resolve a retained cycle. Reconcile the intermediate state without replacing live tasks.

## Plan

Within the existing ProgramService transaction, read retained assignment snapshots, temporarily clear only changing opportunity assignments, then retain the normal update/insert and final completeness validation flow. Opt this update into the existing central execution strategy's tracking cleanup; do not duplicate EF state handling in repositories. The task repository remains unchanged. The Production backport also includes the already-reviewed shared-helper cleanup fix because `current` did not yet contain it.

## Tasks

- [x] Verify nullable FK, immediate uniqueness and references.
- [x] Implement two-phase assignment reconciliation preserving task IDs.
- [x] Reproduce and verify two-task/longer cycles on PostgreSQL.
- [x] Cover replacements, ordering, remove/add, duplicates, rollback and retained references.
- [x] Build, regression test and record isolated staging/backport guidance.
- [x] Align local `current` with the latest successful Production release using a fast-forward only.
- [x] Prepare the isolated referral and central-helper backport without analytics, SSI replay or CF.
- [x] Build and verify the actual Production-baseline backport on disposable PostgreSQL.
- [ ] Adrian's Stage acceptance, Production hotfix review/commit and release approval.

## Decisions

- 2026-10-21: Keep the unique index unchanged. Its default null-distinct behavior permits transaction-local temporary nulls; final requests still require distinct non-empty opportunity IDs.
- 2026-10-21: Do not delete/recreate retained tasks or use placeholder opportunity IDs. No incoming task FK exists in the current model; progress is calculated by task ID from current pathway data. Tests will include a restrictive canary reference to prove identity preservation.
- 2026-10-21: Leave Linear untouched per Adrian. Keep this ticketless hotfix context separate from analytics documentation and commit scope.
- 2026-10-21: Reuse central tracking cleanup, not per-property `IsModified` flags. Stage already includes the per-attempt cleanup fix. A later Production backport must include that existing shared-helper fix if `current` still has the old end-of-all-retries cleanup timing; do not cherry-pick unrelated SSI/CF work.
- 2026-10-21: At Adrian's request, prepare a hotfix branch from the deployed Production release baseline. Apply the referral commit without committing, and copy only the shared-helper hunk from the SSI replay release. Drop the test-only NetTopologySuite setup absent from Production; add no dependency. Default tracking and nested ambient execution remain unchanged and are covered by six focused probes.
- 2026-10-21: Adrian reports Stage looks good and approved adding analytics to this same branch as a separate commit. Combined Production-baseline verification passed 356 tests, including the million-completion analytics case and all referral/retry cases; see the linked analytics handoff in the README. No change to the referral implementation.

## Links

- [Scope and release boundary](./README.md)
- [Verification and backport handoff](./handoffs/2026-10-21-a.md)
- [Prepared Production backport](./handoffs/2026-10-21-b.md)
