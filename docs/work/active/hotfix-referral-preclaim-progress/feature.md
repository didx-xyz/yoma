# Feature: referral detail reads before onboarding

## Meta

- Owner: Adrian
- Area: API
- Status: review
- Branch: `fix/referral-preclaim-progress`
- Baseline: released `v3.13.7`, commit `740c7c183a505945eebb4fd00ccd6d3e63e7694d`

## Problem / Goal

Referral intent can legitimately precede profile onboarding. Computed detail reads incorrectly
require onboarding for every status and return 500 for an unonboarded Initiated/Abandoned record.
Allow these records to be read without weakening claim eligibility or reward processing.

## Tasks

- [x] Verify remote current, local current and released version agree; branch from current.
- [x] Restrict the onboarding invariant to non-intent usage states.
- [x] Count onboarding progress only when complete and retain it as an effective-completion prerequisite.
- [x] Cover status/onboarding/requirement combinations, ownership and no-reward behavior.
- [x] Build and review the scoped diff.
- [ ] Adrian reviews, commits and opens the Production hotfix PR.
- [ ] Release through current; forward-port to master and validate on Stage.

## Decisions

- 2026-11-03: Initiated and Abandoned are intent states, not successful claims. Missing onboarding
  is legitimate there. Pending, Completed and Expired retain the existing consistency exception.
- Keep live POP/pathway progress and existing onboarded behavior. Do not award the onboarding
  portion for null/false flags, or report effective completion without onboarding.
- No data repair, migration, provider operation, claim eligibility change or reward change.
- No package, frontend, middleware, timeout or infrastructure changes in this hotfix.
