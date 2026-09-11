# Feature: Opportunity Push Hooks

## Meta

- **Feature**: Opportunity Push Hooks
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1161](https://linear.app/didx/issue/YOM-1161/api-update-opportunity-event-and-service-hooks-for-partnersync-push-scheduling)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-20

## Problem / Goal

Schedule outbound synchronization from Opportunity domain events using PartnerSync.

## Out of Scope

- Provider-specific transport and mapping unless explicitly owned by this ticket.

## Plan

Updated Opportunity event/service hooks to the shared contracts. Shared lifecycle rules are documented in the [epic README](../README.md).

## Tasks

- [x] Implement the ticket scope in the shared PartnerSync capability.
- [x] Preserve existing production push behaviour.
- [x] Integrate with shared validation, persistence and logging where applicable.

## Decisions

- 2026-05-11: Domain events trigger scheduling; they do not call provider clients directly.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1161](https://linear.app/didx/issue/YOM-1161/api-update-opportunity-event-and-service-hooks-for-partnersync-push-scheduling)
