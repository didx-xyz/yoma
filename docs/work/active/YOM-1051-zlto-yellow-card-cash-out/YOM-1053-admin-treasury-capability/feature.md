# Feature: Admin Treasury Capability

## Meta

- **Feature**: Admin Treasury capability
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1053](https://linear.app/didx/issue/YOM-1053/admin-treasury-capability)
- **Owner**: Adrian and Jason
- **Areas**: both
- **Status**: in-progress
- **Started**: 2026-03-04

## Problem / Goal

Provide the financial-year Treasury capability that owns reward and payout pools, cumulative totals,
conversion and rollover, then expose it through the Admin UI.

## Out of Scope

- Yellow Card payout execution and reconciliation.
- Multi-currency or multi-reward-asset Treasury modelling.

## Plan

The API work is implemented in YOM-1058 and the Web surface in YOM-1072. Shared financial rules
and validation are authoritative in the [epic README](../README.md).

## Tasks

- [x] Implement and migrate the Treasury domain.
- [x] Add financial-year rollover and distributed-lock background processing.
- [x] Recalculate seeded lifetime/current-financial-year totals.
- [x] Expose provider-neutral reward/payout contracts and conversion.
- [x] Build the Admin Treasury UI.
- [ ] Complete final browser validation and release hardening.

## Decisions

- 2026-07-21: Treasury audit identity tracks admin configuration; automated cumulative increments do not replace it.
- 2026-07-21: Organization current-financial-year reset belongs to OrganizationService and supports admin/system callers.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1053](https://linear.app/didx/issue/YOM-1053/admin-treasury-capability)
- API: [YOM-1058](../YOM-1058-api-treasury-domain/feature.md)
- Web: [YOM-1072](../YOM-1072-ui-treasury-admin/feature.md)
