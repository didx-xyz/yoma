# Feature: API Alison Pull Provider Integration

## Meta

- **Feature**: Alison Opportunity pull
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1167](https://linear.app/didx/issue/YOM-1167/api-add-alison-pull-provider-integration)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-30

## Problem / Goal

Import and maintain Alison learning opportunities, then provide the provider boundary later reused
for authenticated course navigation and completion verification.

## Out of Scope

- Final custom-field mappings pending the shared field map.

## Plan

Authenticate to Alison, refresh/cache its complete catalogue, normalize course metadata and map it
to provider-managed Learning opportunities. Verification and user-auth extensions are tracked under
YOM-1202.

## Tasks

- [x] Add client authentication, catalogue paging/cache and migration.
- [x] Map course content, category, difficulty, commitment and searchable metadata.
- [x] Add omission-based deletion with empty-catalogue protection and retention.
- [x] Add embedded resources and scheduled refresh.
- [x] Deploy Opportunity pull to production.
- [ ] Revisit provider metadata when final custom-field definitions are approved.

## Decisions

- 2026-05-15: Absence from a valid complete catalogue marks deletion; tombstones retain retry safety before purge.
- 2026-05-18: Provider HTML is normalized into Yoma-compatible Markdown at ingestion.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1167](https://linear.app/didx/issue/YOM-1167/api-add-alison-pull-provider-integration)
- Verification: [YOM-1202](../YOM-1202-partner-synchronization-verification/feature.md)
