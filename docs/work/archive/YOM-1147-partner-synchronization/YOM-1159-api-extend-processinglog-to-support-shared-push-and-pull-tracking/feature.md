# Feature: Shared Processing Log

## Meta

- **Feature**: Shared Processing Log
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1159](https://linear.app/didx/issue/YOM-1159/api-extend-processinglog-to-support-shared-push-and-pull-tracking)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-20

## Problem / Goal

Track both push and pull item lifecycles in the existing processing model.

## Out of Scope

- Provider-specific transport and mapping unless explicitly owned by this ticket.

## Plan

Extended processing persistence and mappings for shared synchronization. Shared lifecycle rules are documented in the [epic README](../README.md).

## Tasks

- [x] Implement the ticket scope in the shared PartnerSync capability.
- [x] Preserve existing production push behaviour.
- [x] Integrate with shared validation, persistence and logging where applicable.

## Decisions

- 2026-05-11: Item processing state remains permanent enough to enforce idempotency and terminal deletion.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1159](https://linear.app/didx/issue/YOM-1159/api-extend-processinglog-to-support-shared-push-and-pull-tracking)
