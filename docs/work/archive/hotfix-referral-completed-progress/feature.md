# Feature: completed referral progress reflects terminal status

> Archive citation note, 2026-10-14: commit objects were checked locally. Historical branch/source references
> below are preserved; use the [RECONSTRUCTED context pack](CONTEXT-PACK.md) for verified merged delivery anchors
> and current scope.

## Meta

- Owner: Adrian
- Area: API
- Status: shipped
- Started: 2026-09-23
- Branch: `hotfix/referral-completed-progress`, from `origin/current` at `9b18b25a4`
- Tracking: no Linear ticket assigned

## Problem / Goal

The referral usage's stored Completed status is terminal. The detail API currently recalculates its percentage using today's programme definition. A pathway added after completion produces 33.33%, although it did not apply to that claim.

## Plan

- In the computed detail response, report 100% for a stored Completed usage. Preserve the stored status, rewards and existing participation rules.
- Keep the existing pathway detail response unchanged; do not use pathway creation dates to decide whether a Completed usage is complete.
- Pending usages continue to use the weighted live calculation. No data migration or web response shape change.

## Tasks

- [x] Verify the clean, refreshed `current` branch and create the hotfix branch.
- [x] Implement the completed usage response fix.
- [x] Add focused completed-before-pathway and pending regression tests.
- [x] Build and format verification.
- [x] Review locally, PR into `current`, release as v3.12.12, and merge the forward-port to master (#1957); verified at archive on 2026-10-14.

## Decisions

- 2026-10-14: Reconstruct and archive the completed hotfix. Use `9ddefa76f` (#1956, v3.12.12) and `40ad184c5` (#1957) as stable delivery anchors; original preparation notes remain historical evidence.

- 2026-09-23: Use the stored terminal Completed status as the sole source of truth for completion percentage, irrespective of pathway dates. Keep pathway detail and pending calculations unchanged.
- 2026-09-23: `origin/current` was force-updated but the local `current` branch was an ancestor. Fast-forwarded local `current` to the refreshed tip before branching. Robbie confirmed `current` reflects the production code base.
