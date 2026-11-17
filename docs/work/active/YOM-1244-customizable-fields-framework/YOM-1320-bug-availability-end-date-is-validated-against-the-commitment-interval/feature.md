# Feature: Job availability independent of commitment

## Meta

- **Ticket**: [YOM-1320](https://linear.app/didx/issue/YOM-1320/bug-availability-end-date-is-validated-against-the-commitment-interval)
- **Epic**: [YOM-1244](../README.md)
- **Linear parent**: YOM-1278
- **Owner**: Adrian
- **Areas**: api
- **Status**: review — tested, uncommitted and parked for user review
- **Started**: 2026-11-17

## Problem / Goal

Job availability is an application window, but OpportunityService.Create and Update require it to contain the full advertised commitment. Confirmed against current master and the ticket's reported error; no Stage mutation or live reproduction performed.

## Implementation

- Exempt Job from the commitment-derived minimum end date in both create and update; retain the rule for all other types. Both operations use the private AssertAvailabilityDates concern in OpportunityService.
- Preserve the existing request validation: end cannot precede start; manual Jobs require a deadline. Same-day windows remain valid, as clarified in the latest ticket comment (the original acceptance criteria conflict).
- Format the remaining minimum-date error as yyyy-MM-dd; preserve existing interval calculations (month = 30 days; start day counts as day one).
- No migration, API shape change or historical data update. Shared service covers manual management, CSV imports and partner sync.

## Tasks

- [x] Read ticket/comment and trace create/update, imports, sync and submission timing.
- [x] Confirm proposal with user before implementation, as requested.
- [x] Implement focused validation change and regression tests for Jobs, other types, same-day/reversed dates and create/update.
- [x] Allow Job placement timing after applications close; default missing manual timing to today and retain explicit timing/future-date/start-boundary checks.
- [x] Verify affected caller paths and format/build/tests; leave uncommitted for review.

## Validation

- Solution build passed with zero warnings/errors.
- Core, PartnerSync and OpportunitySearch suites: 1,184 passed; zero failed/skipped. Includes 37 new regression cases.
- Targeted dotnet format verification and git diff --check passed.
- Direct xUnit runner used because this checkout's .NET 10 test packages reject the legacy VSTest dotnet test target. No runner/configuration changes made.
- No live Stage or browser verification performed; deployment smoke tests remain for the tester.

## Job Placement Timing

MyOpportunityService.PerformActionSendForVerificationApplyDefaults now defaults a missing manual Job request.DateEnd to now, rather than capping it at the application deadline. PerformActionSendForVerificationParseCommitment exempts Jobs from the opportunity-end cap, retaining the future-date and opportunity-start checks. Explicit supplied timing remains authoritative. Non-Job defaults/limits are unchanged. Auto-finalized imports, sync and instant flows still bypass timing defaults; supplied dates pass through the shared validation. This is the submission participation-end field, distinct from finalization DateCompleted. Expired opportunities can already receive verification requests; eligibility, finalization, rewards and credential scheduling are unchanged.

## UI Handoff

No API payload or UI implementation change is required for the reported create/update error. Same-day application windows remain valid (the original ticket acceptance wording needs to follow the later clarification). When testing placements, allow reporting a past/today placement date after applications close; an omitted manual Job date defaults to today. Finalization DateCompleted retains its existing meaning. No historical submissions or advertised dates are rewritten. UI smoke testing on Stage is still required after deployment.

## Decisions

- 2026-11-17: Investigation first per user request. No application code changed. Branch created from fetched, matching master: fix/yom-1320-job-availability-validation.
- 2026-11-17: User approved implementation of the proposed corrections, uncommitted for review. Changes remain Job-specific and share existing service flows; no new dependencies, configuration or migrations.

## Out of Scope

- Changes to other opportunity types' date/commitment semantics, rewards, credentials, status transitions or stored dates.
- Frontend edits and Linear writes during this investigation.
