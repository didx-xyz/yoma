# Feature: Shared Push Scheduling

## Meta

- **Feature**: Shared Push Scheduling
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1160](https://linear.app/didx/issue/YOM-1160/api-refactor-push-scheduling-and-processing-onto-shared-sync-model)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-20

## Problem / Goal

Run existing outbound scheduling and processing through PartnerSync.

## Out of Scope

- Provider-specific transport and mapping unless explicitly owned by this ticket.

## Plan

Refactored push scheduling/processing without changing provider behaviour. Shared lifecycle rules are documented in the [epic README](../README.md).

## Tasks

- [x] Implement the ticket scope in the shared PartnerSync capability.
- [x] Preserve existing production push behaviour.
- [x] Integrate with shared validation, persistence and logging where applicable.

## Decisions

- 2026-05-11: The shared background service owns orchestration; provider infrastructure owns transport.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1160](https://linear.app/didx/issue/YOM-1160/api-refactor-push-scheduling-and-processing-onto-shared-sync-model)
