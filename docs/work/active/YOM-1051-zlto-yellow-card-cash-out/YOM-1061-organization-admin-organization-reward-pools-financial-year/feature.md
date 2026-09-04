# Feature: Organization Reward Pools (Financial Year)

## Meta

- **Feature**: Organization reward pools
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1061](https://linear.app/didx/issue/YOM-1061/organization-admin-organization-reward-pools-financial-year)
- **Owner**: Adrian and Jason
- **Areas**: both
- **Status**: in-progress
- **Started**: 2026-03-04

## Problem / Goal

Give each organization a current-financial-year ZLTO pool and cumulative totals aligned with
Treasury rollover while preserving lifetime reward totals.

## Out of Scope

- Opportunity-level financial-year rollover; Opportunity pools remain lifetime scoped.

## Plan

The API work is in YOM-1062 and the Web surface in YOM-1063. Shared pool semantics and rollover
rules are documented in the [epic README](../README.md).

## Tasks

- [x] Add current-financial-year pool/cumulative fields and balances.
- [x] Reset organization current-year cumulatives during Treasury rollover.
- [x] Preserve lifetime totals.
- [x] Keep existing API consumers backward compatible.
- [x] Build Organization/Opportunity Admin UI surfaces.
- [ ] Complete final browser validation.

## Decisions

- 2026-07-21: Batch reset remains owned by OrganizationService even when invoked by Treasury rollover.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1061](https://linear.app/didx/issue/YOM-1061/organization-admin-organization-reward-pools-financial-year)
- API: [YOM-1062](../YOM-1062-api-organization-domain/feature.md)
- Web: [YOM-1063](../YOM-1063-ui-organization-and-opportunity-admin/feature.md)
