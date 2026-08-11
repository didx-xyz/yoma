# Feature: PartnerSync Migration and Seeds

## Meta

- **Feature**: PartnerSync Migration and Seeds
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1162](https://linear.app/didx/issue/YOM-1162/api-add-partnersync-schema-migration-and-seed-updates)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-20

## Problem / Goal

Persist the renamed/expanded synchronization model and capability lookups.

## Out of Scope

- Provider-specific transport and mapping unless explicitly owned by this ticket.

## Plan

Added application migration, lookup data and seed updates. Shared lifecycle rules are documented in the [epic README](../README.md).

## Tasks

- [x] Implement the ticket scope in the shared PartnerSync capability.
- [x] Preserve existing production push behaviour.
- [x] Integrate with shared validation, persistence and logging where applicable.

## Decisions

- 2026-05-11: Historical processing identity is preserved through the forward migration.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1162](https://linear.app/didx/issue/YOM-1162/api-add-partnersync-schema-migration-and-seed-updates)
