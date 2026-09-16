# Feature: API Partner-Provided MyOpportunity Progress

## Meta

- **Feature**: Verification progress synchronization
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1248](https://linear.app/didx/issue/YOM-1248/api-support-partner-provided-progress-sync-for-myopportunity)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-06-30

## Problem / Goal

Track partner-reported progress and explicit cancellation/pending lifecycle changes before terminal
completion, without creating duplicate completion records.

## Out of Scope

- Provider-specific UI presentation; YOM-1249 owns Web display.

## Plan

Extend verification mapping and MyOpportunity persistence with progress/status updates, stale pending
purge and retry-safe delete/update handling.

## Tasks

- [x] Add progress fields to shared verification models and MyOpportunity flow.
- [x] Add explicit cancellation and stale pending purge behavior.
- [x] Correct delete logging and retry reuse.
- [x] Extend Alison embedded verification samples.

## Decisions

- 2026-07-02: Provider progress updates remain non-terminal until a mapped completion/placement outcome arrives.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1248](https://linear.app/didx/issue/YOM-1248/api-support-partner-provided-progress-sync-for-myopportunity)
