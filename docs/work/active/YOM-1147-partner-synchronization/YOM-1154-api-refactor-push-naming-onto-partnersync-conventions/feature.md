# Feature: Refactor Push Naming

## Meta

- **Feature**: Refactor Push Naming
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1154](https://linear.app/didx/issue/YOM-1154/api-refactor-push-naming-onto-partnersync-conventions)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-20

## Problem / Goal

Align push models and methods with the shared PartnerSync vocabulary.

## Out of Scope

- Provider-specific transport and mapping unless explicitly owned by this ticket.

## Plan

Refactored push contracts and handlers while preserving outbound behaviour. Shared lifecycle rules are documented in the [epic README](../README.md).

## Tasks

- [x] Implement the ticket scope in the shared PartnerSync capability.
- [x] Preserve existing production push behaviour.
- [x] Integrate with shared validation, persistence and logging where applicable.

## Decisions

- 2026-05-11: Push remains a SyncType inside PartnerSync rather than a separate domain.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1154](https://linear.app/didx/issue/YOM-1154/api-refactor-push-naming-onto-partnersync-conventions)
