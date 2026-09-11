# Feature: Pull Action and Persistence

## Meta

- **Feature**: Pull Action and Persistence
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1168](https://linear.app/didx/issue/YOM-1168/api-finalize-pull-action-resolution-and-opportunity-persistence-flow)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-20

## Problem / Goal

Resolve create/update/delete/skip actions and apply them through OpportunityService.

## Out of Scope

- Provider-specific transport and mapping unless explicitly owned by this ticket.

## Plan

Completed action resolution and provider-managed Opportunity persistence. Shared lifecycle rules are documented in the [epic README](../README.md).

## Tasks

- [x] Implement the ticket scope in the shared PartnerSync capability.
- [x] Preserve existing production push behaviour.
- [x] Integrate with shared validation, persistence and logging where applicable.

## Decisions

- 2026-05-11: Provider deletion is terminal; omission is considered only after a valid complete snapshot.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1168](https://linear.app/didx/issue/YOM-1168/api-finalize-pull-action-resolution-and-opportunity-persistence-flow)
