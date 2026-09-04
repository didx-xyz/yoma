# Feature: API Organization Domain Financial-Year Alignment

## Meta

- **Feature**: Organization financial-year rewards
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1062](https://linear.app/didx/issue/YOM-1062/api-organization-domain)
- **Owner**: Adrian
- **Areas**: api
- **Status**: review
- **Started**: 2026-03-04

## Problem / Goal

Persist, validate and reset organization current-financial-year reward pools and cumulatives while
retaining lifetime totals and existing Organization behavior.

## Out of Scope

- Treasury configuration itself.
- Opportunity lifetime pool semantics.

## Plan

OrganizationService owns both single-organization updates and the batched current-year cumulative
reset. The rollover caller supplies system identity when no admin request context exists.

## Tasks

- [x] Add financial-year pool, cumulative and derived balance fields.
- [x] Validate pool floors against current-year cumulative allocation.
- [x] Add batched reset with admin-or-system audit resolution.
- [x] Integrate with Treasury rollover.
- [x] Recalculate seeded organization totals.

## Decisions

- 2026-07-21: The Organization service, not Treasury, owns Organization repository mutation.
- 2026-07-21: Admin calls retain the incoming user; the background job falls back to the system user.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1062](https://linear.app/didx/issue/YOM-1062/api-organization-domain)
- Parent: [YOM-1061](../YOM-1061-organization-admin-organization-reward-pools-financial-year/feature.md)
