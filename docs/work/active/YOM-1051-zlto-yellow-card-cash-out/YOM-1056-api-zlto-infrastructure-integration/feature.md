# Feature: API ZLTO Infrastructure Integration

## Meta

- **Feature**: ZLTO payout integration
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1056](https://linear.app/didx/issue/YOM-1056/api-zlto-infrastructure-integration)
- **Owner**: Adrian
- **Areas**: api
- **Status**: in-progress
- **Started**: 2026-07-28

## Problem / Goal

Extend the existing ZLTO reward provider client with the wallet and reservation operations needed
by payout without coupling the payout domain to ZLTO infrastructure models.

## Out of Scope

- Yellow Card hosted-session integration.
- Domain orchestration and reconciliation policy.

## Plan

Keep ZLTO resolution internal to the reward provider implementation. Public provider contracts use
request/response models and action-first method names; validation and Flurl behavior follow existing
wallet client patterns.

## Tasks

- [x] Refactor existing reward-provider methods to request/response models.
- [x] Preserve existing wallet creation/update behavior.
- [x] Implement reservation create, commit and release.
- [x] Apply an explicit transport timeout to payout reservation, commit and release calls.
- [x] Extend wallet balance with provider reserved balance.
- [x] Align confirmed provider/actor values with ZLTO guidance.
- [ ] End-to-end staging validation with the complete payout flow.

## Decisions

- 2026-07-28: Reward provider interfaces stay reward-scoped; payout orchestration belongs to Payout.
- 2026-07-28: Action-first method naming is retained (`Reserve`, `Commit`, `Release`, `Create`).
- 2026-08-27: ZLTO payout operations use a dedicated 30-second transport timeout. This is separate
  from the configurable reservation expiration threshold that controls how long funds remain reserved.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1056](https://linear.app/didx/issue/YOM-1056/api-zlto-infrastructure-integration)
- Reservation capability: [YOM-1049](../YOM-1049-api-zlto-wallet-reservation-capability/feature.md)
