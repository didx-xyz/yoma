# Feature: API Yellow Card Payout Status Integration

## Meta

- **Feature**: Yellow Card payout status integration
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1059](https://linear.app/didx/issue/YOM-1059/api-yellow-card-payout-status-integration)
- **Owner**: Adrian
- **Areas**: api
- **Status**: blocked
- **Started**: 2026-07-28

## Problem / Goal

Translate Yellow Card webhook outcomes—and a polling fallback if supported—into provider-neutral
Payout status updates that finalize or release the ZLTO reservation exactly once.

## Out of Scope

- Provider polling when Yellow Card does not expose transaction lookup.
- Treating admin transaction views as direct provider queries.

## Plan

The webhook controller receives provider JSON and passes a high-level event to the Yellow Card
client boundary. The provider adapter maps it to the Payout domain; reconciliation owns idempotent
state transitions and fallback polling.

## Tasks

- [x] Add webhook route and high-level event shell.
- [x] Add provider status/reconciliation interfaces.
- [x] Add local reconciliation selection and retry state.
- [x] Keep admin/user status reads backed by Yoma's transaction log.
- [ ] Implement webhook authentication and payload parsing.
- [ ] Map actual provider statuses and terminal outcomes.
- [ ] Implement polling only if provider lookup is confirmed.

## Decisions

- 2026-07-28: Webhooks are primary; polling is an optional resilience fallback.
- 2026-08-05: Provider-specific parsing stays in IXO Yellow Card infrastructure, not the Payout domain.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1059](https://linear.app/didx/issue/YOM-1059/api-yellow-card-payout-status-integration)
- Blocker: [YOM-1079](https://linear.app/didx/issue/YOM-1079)
