# Feature: API ZLTO Wallet Reservation Capability

## Meta

- **Feature**: ZLTO wallet reservation
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1049](https://linear.app/didx/issue/YOM-1049/api-zlto-wallet-reservation-capability)
- **Owner**: Adrian
- **Areas**: api
- **Status**: in-progress
- **Started**: 2026-07-28

## Problem / Goal

Reserve a specified ZLTO amount before payout, then commit the burn on success or release it on a
terminal failure, with correlation and expiry controlled by Yoma.

## Out of Scope

- Payout-provider orchestration.
- Recovery lookup by external reference; ZLTO currently exposes lookup by reservation ID only.

## Plan

The ZLTO provider client implements reserve, commit and release using provider-neutral Reward
contracts. The reservation ID is persisted in Yoma's reward transaction ledger.

## Tasks

- [x] Add provider-neutral request/response models.
- [x] Implement reserve, commit and release with Flurl.
- [x] Supply correlation/idempotency and Yellow Card/Yoma actor values.
- [x] Expose reserved balance separately from available wallet balance.
- [x] Document automatic expiry and rare lost-reservation recovery behavior.
- [x] Set the final reservation expiry to 30 hours for the confirmed IXO lifecycle.
- [ ] Validate against the final end-to-end provider flow.

## Decisions

- 2026-08-11: `expires_at` is a threshold; ZLTO releases after expiry processing, not necessarily at the exact instant.
- 2026-08-11: If local persistence and inline release both fail, the user waits for ZLTO automatic expiry; no unsupported lookup is assumed.
- 2026-08-27: IXO keeps unconfirmed payouts active for 24 hours and may take up to six additional hours
  after confirmation to reach a terminal state. The ZLTO reservation is fixed at 30 hours as a safety net;
  webhooks and reconciliation still commit or release immediately when a terminal outcome arrives.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1049](https://linear.app/didx/issue/YOM-1049/api-zlto-wallet-reservation-capability)
- Integration: [YOM-1056](../YOM-1056-api-zlto-infrastructure-integration/feature.md)
