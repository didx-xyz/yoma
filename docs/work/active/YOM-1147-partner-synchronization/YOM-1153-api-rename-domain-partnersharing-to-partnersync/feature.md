# Feature: Rename PartnerSharing to PartnerSync

## Meta

- **Feature**: Rename PartnerSharing to PartnerSync
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1153](https://linear.app/didx/issue/YOM-1153/api-rename-domain-partnersharing-to-partnersync)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-20

## Problem / Goal

Replace push-only naming with the provider-neutral PartnerSync domain without changing shipped push behaviour.

## Out of Scope

- Provider-specific transport and mapping unless explicitly owned by this ticket.

## Plan

Renamed domain contracts, namespaces and consumers onto PartnerSync. Shared lifecycle rules are documented in the [epic README](../README.md).

## Tasks

- [x] Implement the ticket scope in the shared PartnerSync capability.
- [x] Preserve existing production push behaviour.
- [x] Integrate with shared validation, persistence and logging where applicable.

## Decisions

- 2026-05-11: The capability name describes synchronization direction-neutral orchestration.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1153](https://linear.app/didx/issue/YOM-1153/api-rename-domain-partnersharing-to-partnersync)
