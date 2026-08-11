# Feature: API Treasury Domain

## Meta

- **Feature**: Treasury domain
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1058](https://linear.app/didx/issue/YOM-1058/api-treasury-domain)
- **Owner**: Adrian
- **Areas**: api
- **Status**: review
- **Started**: 2026-03-04

## Problem / Goal

Own financial-year configuration, ZLTO reward and USD payout pools, lifetime/current-year
cumulatives, balances, conversion and rollover in one locked domain service.

## Out of Scope

- Provider payout initiation or status handling.
- Dynamic reward assets and currencies.

## Plan

The implementation uses the Treasury aggregate, guarded service operations, a daily distributed-lock
rollover job and OrganizationService batch reset. See the [epic contract](../README.md) for the
financial rules and Web-visible figures.

## Tasks

- [x] Complete entity, models, repository, validators and controller.
- [x] Add lifetime and current-financial-year reward/payout cumulatives.
- [x] Add conversion preview and funds-available response.
- [x] Add pending-payout-aware available balance.
- [x] Add daily rollover plus inline financial-year guards.
- [x] Preserve lifetime totals and reset current-year Treasury/Organization totals.
- [x] Add migration seeding/recalculation for affected cumulatives.
- [x] Debug rollover, admin updates, conversion and audit behavior locally.

## Decisions

- 2026-07-21: Payout pool stays nullable in storage but is required by API validation.
- 2026-08-05: Pending payouts reserve capacity at initiation; completed payouts increase lifetime and the current financial year at completion.
- 2026-08-05: A payout accepted earlier may complete after pool depletion; finalization is not blocked again.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1058](https://linear.app/didx/issue/YOM-1058/api-treasury-domain)
- Parent: [YOM-1053](../YOM-1053-admin-treasury-capability/feature.md)
