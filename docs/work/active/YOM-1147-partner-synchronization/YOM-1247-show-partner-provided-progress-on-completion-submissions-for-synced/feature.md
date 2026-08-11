# Feature: Partner-Provided Completion Progress

## Meta

- **Feature**: Partner-provided progress for synced opportunities
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1247](https://linear.app/didx/issue/YOM-1247/show-partner-provided-progress-on-completion-submissions-for-synced)
- **Owners**: Adrian (api) · Jason (web)
- **Areas**: api, web
- **Status**: shipped
- **Started**: 2026-06-29

## Problem / Goal

Show partner-provided progress for pending, externally managed completion submissions without
changing the lifecycle of normal Yoma-managed opportunities.

## Out of Scope

- Calculating progress for Yoma-managed opportunities.
- Allowing youth or admins to override partner-managed submissions.

## Plan

The API imports and protects provider-managed progress through YOM-1248. The Web displays the
normalized progress through YOM-1249. Shared lifecycle rules are documented in the
[epic contract](../README.md).

## Tasks

- [x] Import, update and cancel partner-managed progress safely.
- [x] Exclude partner-managed pending submissions from normal expiry/rejection.
- [x] Prevent manual youth/admin lifecycle changes.
- [x] Display normalized progress in YoID.

## Decisions

- 2026-07-07: Explicit partner cancellation is authoritative; stale-record purge is fallback.
- 2026-07-07: Progress never implies terminal completion until the partner reports completion.

## Links

- Epic: [YOM-1147](../README.md)
- API: [YOM-1248](../YOM-1248-api-support-partner-provided-progress-sync-for-myopportunity/feature.md)
- Ticket: [YOM-1247](https://linear.app/didx/issue/YOM-1247/show-partner-provided-progress-on-completion-submissions-for-synced)
