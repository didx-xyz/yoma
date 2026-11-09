# Feature: Protect pending submissions from opportunity type changes

## Meta

- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1312](https://linear.app/didx/issue/YOM-1312/opportunity-approval-workflow-allowing-changes-to-submitted)
- **Parent ticket**: [YOM-1278](https://linear.app/didx/issue/YOM-1278)
- **Owner**: Adrian
- **Areas**: api
- **Status**: review
- **Started**: 2026-11-09

## Problem / Goal

A pending youth submission was captured for an opportunity type. Changing that type can
change applicable custom fields, skills-awarding behaviour and credential schema compatibility.
Reject type changes while submissions await approval without freezing ordinary opportunity edits.

## Out of Scope

- Blocking other fields, changing approval behaviour or snapshotting opportunity versions.
- Withdrawing submissions or requiring resubmission automatically.
- Locking types permanently after completed/rejected submissions.
- Redesigning concurrent submission/update transactions.

## Plan

`OpportunityService.Update` checks pending Verification actions for the same opportunity only
when `request.TypeId` differs from the stored type. It uses the existing lookup services and
MyOpportunity repository, before schema resolution, opportunity writes or custom-field changes.
Manual management, CSV updates and partner sync share this path. There is no schema migration,
request-shape change or new dependency package.

The existing validation response reports:
“The opportunity type cannot be changed while submissions are awaiting approval”.
An import/sync item attempting this change fails through its existing error handling; it does
not silently ignore the requested type or apply only the other fields.

## Tasks

- [x] Guard changed types in the shared update flow.
- [x] Cover manual/import/sync options, unchanged types and non-pending submissions.
- [x] Build and run focused regressions.
- [ ] Adrian reviews the uncommitted changes.
- [ ] Commit/push and update Linear after approval.
- [ ] Retest the editor and import feedback on Stage after deployment.

## Decisions

- 2026-11-09: Adrian approved type-only protection. Approval continues reading the current
  opportunity for other values, as before; custom fields and type-aware behaviour justify this
  narrow exception. This supersedes the ticket's broader freeze/withdrawal suggestions.
- 2026-11-09: No frontend implementation required for API enforcement. Jason should confirm
  the editor displays the validation message and still saves non-type edits while submissions
  are pending. No new UI flag or disabled-field contract is introduced.

## Links

- Working PR: [PR #2013](https://github.com/didx-xyz/yoma/pull/2013)
- [Session handoff](./handoffs/2026-11-09-a.md)
