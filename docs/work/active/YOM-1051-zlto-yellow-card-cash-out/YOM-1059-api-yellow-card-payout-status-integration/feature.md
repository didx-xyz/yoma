# Feature: API Yellow Card Payout Status Integration

## Meta

- **Feature**: Yellow Card payout status integration
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1059](https://linear.app/didx/issue/YOM-1059/api-yellow-card-payout-status-integration)
- **Owner**: Adrian
- **Areas**: api
- **Status**: in-progress — implemented, sandbox E2E pending
- **Started**: 2026-07-28

## Problem / Goal

Translate Yellow Card webhook outcomes—and a polling fallback if supported—into provider-neutral
Payout status updates that finalize or release the ZLTO reservation exactly once.

## Out of Scope

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
- [x] Implement webhook authentication and payload parsing.
- [x] Map actual provider statuses and terminal outcomes.
- [x] Implement polling only if provider lookup is confirmed.

## Decisions

- 2026-07-28: Webhooks are primary; polling is an optional resilience fallback.
- 2026-08-05: Provider-specific parsing stays in IXO Yellow Card infrastructure, not the Payout domain.
- 2026-08-27: IXO confirms GET by Yoma payout reference as the reconciliation fallback. Provider
  initiated and processing normalize to Yoma Processing; terminal statuses map directly.
- 2026-08-27: Authenticate the exact raw request body using
  HMAC-SHA256(secret, webhook-id + "." + webhook-timestamp + "." + body) and compare signatures
  in constant time. A configurable five-minute timestamp tolerance is the initial replay window
  and must be confirmed during sandbox delivery testing.
- 2026-08-27: Replay markers are volatile. Remove a newly created marker when processing fails so
  IXO can retry immediately; payout-level locking and persisted status transitions remain the
  authoritative idempotency boundary.
- 2026-08-27: Prefer the signed Yoma transaction reference when locating the processing record,
  then verify the provider transaction reference. This safely handles a webhook racing local
  persistence of the provider reference.
- 2026-08-27: Ignore duplicate terminal outcomes and stale Processing events after a terminal
  outcome. Treat conflicting terminal outcomes as data inconsistencies.
- 2026-08-31: Sanitize externally supplied webhook and idempotency values only at the logging
  boundary. Persisted values and authentication inputs remain exact; the shared sanitizer removes
  both CR and LF characters to prevent log forging across operating systems.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1059](https://linear.app/didx/issue/YOM-1059/api-yellow-card-payout-status-integration)
- Provider readiness: [YOM-1079](https://linear.app/didx/issue/YOM-1079)
