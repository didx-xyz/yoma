# Feature: Referral Reward Pools and Treasury Alignment

## Meta

- **Feature**: Referral rewards and Treasury alignment
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1095](https://linear.app/didx/issue/YOM-1095/referrals-admin-reward-pools-and-treasury-financial-year-alignment)
- **Owner**: Adrian and Jason
- **Areas**: both
- **Status**: in-progress
- **Started**: 2026-03-09

## Problem / Goal

Align referral reward allocation with Treasury current-financial-year capacity while preserving
Referral Program lifetime pool/cumulative semantics and exposing the controls in Admin UI.

## Out of Scope

- Resetting Referral Program lifetime cumulatives at Treasury rollover.

## Plan

Referral allocation checks Treasury current-year capacity and Program lifetime capacity under the
existing locking model. The Web work lives in YOM-1073; shared rules are in the
[epic README](../README.md).

## Tasks

- [x] Integrate referral awards with Treasury cumulative allocation.
- [x] Preserve Program lifetime pools and cumulatives.
- [x] Seed/recalculate affected totals.
- [x] Build the Referral Admin reward surface.
- [ ] Complete final browser validation.

## Decisions

- 2026-03-09: Referral Program values remain lifetime scoped; only Treasury is financial-year scoped.
- 2026-08-07: A null configured pool means uncapped, not blocked.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1095](https://linear.app/didx/issue/YOM-1095/referrals-admin-reward-pools-and-treasury-financial-year-alignment)
- Web: [YOM-1073](../YOM-1073-ui-referral-program-rewards-create-update-info/feature.md)
