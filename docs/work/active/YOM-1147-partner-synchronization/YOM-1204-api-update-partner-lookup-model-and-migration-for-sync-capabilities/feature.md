# Feature: Partner capability lookup persistence

## Meta

- **Feature**: Partner capability lookup persistence
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1204](https://linear.app/didx/issue/YOM-1204/api-update-partner-lookup-model-and-migration-for-sync-capabilities)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-05-19

## Problem / Goal

Persist the expanded synchronization capability lookup and seed existing partners safely.

## Out of Scope

- Provider-specific behavior beyond this ticket's contract.

## Plan

This shipped as part of the YOM-1202 verification track. Shared lifecycle rules are documented in the [epic contract](../README.md).

## Tasks

- [x] Migration and seed changes preserve existing capabilities.
- [x] Integrate the change with the shared PartnerSync verification flow.

## Decisions

- 2026-05-21: Existing partner capability data is upgraded rather than recreated.

## Links

- Epic: [YOM-1147](../README.md)
- Parent track: [YOM-1202](../YOM-1202-partner-synchronization-verification/feature.md)
- Ticket: [YOM-1204](https://linear.app/didx/issue/YOM-1204/api-update-partner-lookup-model-and-migration-for-sync-capabilities)
