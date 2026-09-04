# Feature: Provider-Managed Opportunity Rules

## Meta

- **Feature**: Provider-Managed Opportunity Rules
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1171](https://linear.app/didx/issue/YOM-1171/api-enforce-provider-managed-opportunity-rules-for-pull-synchronization)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-20

## Problem / Goal

Prevent Yoma admin actions from overriding provider-managed pull Opportunities.

## Out of Scope

- Provider-specific transport and mapping unless explicitly owned by this ticket.

## Plan

Enforced domain update/status/delete restrictions for pull-synced records. Shared lifecycle rules are documented in the [epic README](../README.md).

## Tasks

- [x] Implement the ticket scope in the shared PartnerSync capability.
- [x] Preserve existing production push behaviour.
- [x] Integrate with shared validation, persistence and logging where applicable.

## Decisions

- 2026-05-11: The external provider is authoritative until it removes the Opportunity terminally.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1171](https://linear.app/didx/issue/YOM-1171/api-enforce-provider-managed-opportunity-rules-for-pull-synchronization)
