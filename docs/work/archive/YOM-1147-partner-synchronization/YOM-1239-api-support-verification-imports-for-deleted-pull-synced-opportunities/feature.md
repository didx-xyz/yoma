# Feature: Verification for Deleted Pull-Synced Opportunities

## Meta

- **Feature**: Deleted Opportunity verification import
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1239](https://linear.app/didx/issue/YOM-1239/api-support-verification-imports-for-deleted-pull-synced-opportunities)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-06-19

## Problem / Goal

Allow a valid external completion to finalize an existing user journey even after the provider has
terminally removed the underlying Opportunity from discovery.

## Out of Scope

- Reactivating or recreating the deleted Opportunity.

## Plan

Verification resolution may locate the terminally deleted provider-managed Opportunity for an
existing MyOpportunity while normal opportunity synchronization continues to enforce deletion.

## Tasks

- [x] Resolve eligible deleted pull-synced Opportunities during verification import.
- [x] Preserve terminal Opportunity deletion.
- [x] Keep completion processing idempotent.

## Decisions

- 2026-06-19: Opportunity catalogue terminality and a user's valid completion are separate concerns.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1239](https://linear.app/didx/issue/YOM-1239/api-support-verification-imports-for-deleted-pull-synced-opportunities)
