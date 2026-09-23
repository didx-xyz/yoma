# Feature: completed referral progress reflects terminal status

## Meta

- Owner: Adrian
- Area: API
- Status: review
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
- [ ] Review locally, then PR into `current`, release, and apply to `master`.

## Decisions

- 2026-09-23: Use the stored terminal Completed status as the sole source of truth for completion percentage, irrespective of pathway dates. Keep pathway detail and pending calculations unchanged.
- 2026-09-23: `origin/current` was force-updated but the local `current` branch was an ancestor. Fast-forwarded local `current` to the refreshed tip before branching. Robbie confirmed `current` reflects the production code base.
