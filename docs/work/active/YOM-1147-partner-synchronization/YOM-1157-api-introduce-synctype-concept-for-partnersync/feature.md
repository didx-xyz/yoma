# Feature: Introduce SyncType

## Meta

- **Feature**: Introduce SyncType
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1157](https://linear.app/didx/issue/YOM-1157/api-introduce-synctype-concept-for-partnersync)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-20

## Problem / Goal

Represent push and pull explicitly in shared contracts and persistence.

## Out of Scope

- Provider-specific transport and mapping unless explicitly owned by this ticket.

## Plan

Added SyncType lookup/model use across capability and processing flows. Shared lifecycle rules are documented in the [epic README](../README.md).

## Tasks

- [x] Implement the ticket scope in the shared PartnerSync capability.
- [x] Preserve existing production push behaviour.
- [x] Integrate with shared validation, persistence and logging where applicable.

## Decisions

- 2026-05-11: Direction is configuration and data, not a provider-specific branch.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1157](https://linear.app/didx/issue/YOM-1157/api-introduce-synctype-concept-for-partnersync)
