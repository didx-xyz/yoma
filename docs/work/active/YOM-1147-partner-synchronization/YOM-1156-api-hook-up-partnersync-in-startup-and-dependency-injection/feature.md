# Feature: PartnerSync Startup and DI

## Meta

- **Feature**: PartnerSync Startup and DI
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1156](https://linear.app/didx/issue/YOM-1156/api-hook-up-partnersync-in-startup-and-dependency-injection)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-20

## Problem / Goal

Register shared orchestration and provider factories consistently.

## Out of Scope

- Provider-specific transport and mapping unless explicitly owned by this ticket.

## Plan

Completed startup, DI and provider-resolution wiring. Shared lifecycle rules are documented in the [epic README](../README.md).

## Tasks

- [x] Implement the ticket scope in the shared PartnerSync capability.
- [x] Preserve existing production push behaviour.
- [x] Integrate with shared validation, persistence and logging where applicable.

## Decisions

- 2026-05-11: Provider clients resolve through keyed factories; domain code does not instantiate integrations.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1156](https://linear.app/didx/issue/YOM-1156/api-hook-up-partnersync-in-startup-and-dependency-injection)
