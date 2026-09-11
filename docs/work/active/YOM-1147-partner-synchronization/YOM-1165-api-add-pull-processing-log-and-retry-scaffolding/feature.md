# Feature: Pull Processing and Retry

## Meta

- **Feature**: Pull Processing and Retry
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1165](https://linear.app/didx/issue/YOM-1165/api-add-pull-processing-log-and-retry-scaffolding)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-20

## Problem / Goal

Persist pull item state and provide retry/idempotency scaffolding.

## Out of Scope

- Provider-specific transport and mapping unless explicitly owned by this ticket.

## Plan

Added pull processing-log creation, status updates and retry selection. Shared lifecycle rules are documented in the [epic README](../README.md).

## Tasks

- [x] Implement the ticket scope in the shared PartnerSync capability.
- [x] Preserve existing production push behaviour.
- [x] Integrate with shared validation, persistence and logging where applicable.

## Decisions

- 2026-05-11: Repeated provider snapshots must not duplicate domain entities.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1165](https://linear.app/didx/issue/YOM-1165/api-add-pull-processing-log-and-retry-scaffolding)
