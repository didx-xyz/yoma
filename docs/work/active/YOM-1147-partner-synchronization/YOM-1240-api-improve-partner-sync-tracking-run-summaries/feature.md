# Feature: API Partner Sync Run Summaries

## Meta

- **Feature**: PartnerSync run summaries
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1240](https://linear.app/didx/issue/YOM-1240/api-improve-partner-sync-tracking-run-summaries)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-06-04

## Problem / Goal

Persist actionable totals for each synchronization run instead of relying only on application logs.

## Out of Scope

- A partner-facing detailed skipped-record reporting endpoint.

## Plan

Extend PartnerSync tracking with processed, succeeded, skipped and failed action counts populated by
the shared background service.

## Tasks

- [x] Add run action counts to tracking persistence and models.
- [x] Populate counts across shared sync processes.
- [x] Keep individual skip reasons in application logs.

## Decisions

- 2026-06-04: Run aggregates are persisted; detailed skip reporting remains an operational log concern.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1240](https://linear.app/didx/issue/YOM-1240/api-improve-partner-sync-tracking-run-summaries)
