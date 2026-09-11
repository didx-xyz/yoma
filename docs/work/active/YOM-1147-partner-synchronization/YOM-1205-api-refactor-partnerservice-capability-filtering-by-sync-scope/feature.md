# Feature: Partner capability filtering

## Meta

- **Feature**: Partner capability filtering
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1205](https://linear.app/didx/issue/YOM-1205/api-refactor-partnerservice-capability-filtering-by-sync-scope)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-05-19

## Problem / Goal

Resolve enabled partners by sync type, entity type and scope.

## Out of Scope

- Provider-specific behavior beyond this ticket's contract.

## Plan

This shipped as part of the YOM-1202 verification track. Shared lifecycle rules are documented in the [epic contract](../README.md).

## Tasks

- [x] Partner selection supports the complete capability key.
- [x] Integrate the change with the shared PartnerSync verification flow.

## Decisions

- 2026-05-21: Filtering remains provider-neutral.

## Links

- Epic: [YOM-1147](../README.md)
- Parent track: [YOM-1202](../YOM-1202-partner-synchronization-verification/feature.md)
- Ticket: [YOM-1205](https://linear.app/didx/issue/YOM-1205/api-refactor-partnerservice-capability-filtering-by-sync-scope)
