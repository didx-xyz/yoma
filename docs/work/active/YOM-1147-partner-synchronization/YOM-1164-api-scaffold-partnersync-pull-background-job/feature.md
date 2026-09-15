# Feature: Pull Background Job

## Meta

- **Feature**: Pull Background Job
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1164](https://linear.app/didx/issue/YOM-1164/api-scaffold-partnersync-pull-background-job)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-20

## Problem / Goal

Add scheduled, locked pull orchestration parallel to push.

## Out of Scope

- Provider-specific transport and mapping unless explicitly owned by this ticket.

## Plan

Implemented the pull background process and recurring-job wiring. Shared lifecycle rules are documented in the [epic README](../README.md).

## Tasks

- [x] Implement the ticket scope in the shared PartnerSync capability.
- [x] Preserve existing production push behaviour.
- [x] Integrate with shared validation, persistence and logging where applicable.

## Decisions

- 2026-05-11: Pull orchestration is batch/retry driven and provider-neutral.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1164](https://linear.app/didx/issue/YOM-1164/api-scaffold-partnersync-pull-background-job)
