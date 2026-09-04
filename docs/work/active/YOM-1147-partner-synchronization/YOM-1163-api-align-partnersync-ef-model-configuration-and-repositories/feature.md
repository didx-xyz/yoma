# Feature: PartnerSync EF and Repositories

## Meta

- **Feature**: PartnerSync EF and Repositories
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1163](https://linear.app/didx/issue/YOM-1163/api-align-partnersync-ef-model-configuration-and-repositories)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-20

## Problem / Goal

Align EF configuration, repositories and projections with the shared model.

## Out of Scope

- Provider-specific transport and mapping unless explicitly owned by this ticket.

## Plan

Completed entity configuration, repository mapping and DI alignment. Shared lifecycle rules are documented in the [epic README](../README.md).

## Tasks

- [x] Implement the ticket scope in the shared PartnerSync capability.
- [x] Preserve existing production push behaviour.
- [x] Integrate with shared validation, persistence and logging where applicable.

## Decisions

- 2026-05-11: Persistence concerns remain behind domain repository contracts.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1163](https://linear.app/didx/issue/YOM-1163/api-align-partnersync-ef-model-configuration-and-repositories)
