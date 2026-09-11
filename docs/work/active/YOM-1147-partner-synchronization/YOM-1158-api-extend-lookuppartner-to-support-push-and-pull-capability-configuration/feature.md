# Feature: Partner Capability Configuration

## Meta

- **Feature**: Partner Capability Configuration
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1158](https://linear.app/didx/issue/YOM-1158/api-extend-lookuppartner-to-support-push-and-pull-capability-configuration)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-20

## Problem / Goal

Allow a partner to declare supported push/pull entity capabilities.

## Out of Scope

- Provider-specific transport and mapping unless explicitly owned by this ticket.

## Plan

Extended Partner lookup projections, configuration and seeding. Shared lifecycle rules are documented in the [epic README](../README.md).

## Tasks

- [x] Implement the ticket scope in the shared PartnerSync capability.
- [x] Preserve existing production push behaviour.
- [x] Integrate with shared validation, persistence and logging where applicable.

## Decisions

- 2026-05-11: A partner may support different entity/scope combinations; capability is not inferred from a client existing.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1158](https://linear.app/didx/issue/YOM-1158/api-extend-lookuppartner-to-support-push-and-pull-capability-configuration)
