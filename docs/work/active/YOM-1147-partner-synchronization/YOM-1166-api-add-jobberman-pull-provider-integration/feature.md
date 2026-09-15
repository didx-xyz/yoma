# Feature: API Jobberman Pull Provider Integration

## Meta

- **Feature**: Jobberman Opportunity pull
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1166](https://linear.app/didx/issue/YOM-1166/api-add-jobberman-pull-provider-integration)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-28

## Problem / Goal

Import and maintain provider-managed Jobberman job opportunities from its RSS feed through the
shared PartnerSync pull capability.

## Out of Scope

- Jobberman verification or user-authentication flows.
- Final custom-field mappings pending the shared field map.

## Plan

Refresh and cache the complete feed, map valid entries to Yoma Job opportunities, protect existing
data on empty/invalid snapshots, and let the shared domain apply create/update/terminal-delete
actions.

## Tasks

- [x] Add RSS retrieval, parsing, cache persistence and migration.
- [x] Add Job Opportunity content, category, language and keyword mappings.
- [x] Add duplicate suppression and complete-snapshot deletion handling.
- [x] Add embedded/local behavior, scheduling and retention.
- [x] Deploy to production.
- [ ] Revisit provider metadata when final custom-field definitions are approved.

## Decisions

- 2026-05-07: A valid complete snapshot may infer deletion by omission; an empty/invalid feed may not.
- 2026-05-29: Duplicate feed items are suppressed before shared processing.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1166](https://linear.app/didx/issue/YOM-1166/api-add-jobberman-pull-provider-integration)
