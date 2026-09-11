# Feature: Verification pull orchestration

## Meta

- **Feature**: Verification pull orchestration
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1210](https://linear.app/didx/issue/YOM-1210/api-add-partnersync-verification-pull-orchestration)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-05-19

## Problem / Goal

Schedule, lock and process verification synchronization through the shared domain.

## Out of Scope

- Provider-specific behavior beyond this ticket's contract.

## Plan

This shipped as part of the YOM-1202 verification track. Shared lifecycle rules are documented in the [epic contract](../README.md).

## Tasks

- [x] Enabled partners are processed with checkpoints, retries and run outcomes.
- [x] Integrate the change with the shared PartnerSync verification flow.

## Decisions

- 2026-05-21: Shared orchestration owns lifecycle; providers own mapping.

## Links

- Epic: [YOM-1147](../README.md)
- Parent track: [YOM-1202](../YOM-1202-partner-synchronization-verification/feature.md)
- Ticket: [YOM-1210](https://linear.app/didx/issue/YOM-1210/api-add-partnersync-verification-pull-orchestration)
