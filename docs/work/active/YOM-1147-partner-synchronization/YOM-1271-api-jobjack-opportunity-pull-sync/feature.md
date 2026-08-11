# Feature: API JobJack Opportunity Pull Sync

## Meta

- **Feature**: JobJack XML pull integration
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1271](https://linear.app/didx/issue/YOM-1271/api-jobjack-opportunity-pull-sync)
- **Owner**: Adrian
- **Areas**: api
- **Status**: review
- **Started**: 2026-08-03

## Problem / Goal

Fetch, parse, cache and synchronize JobJack XML jobs through the shared pull domain while preserving
useful partner content and protecting Yoma from malformed or empty snapshots.

## Out of Scope

- JobJack Phase 2 user and verification flows.
- Final custom-field mappings.

## Plan

The provider infrastructure parses unreliable XML fields explicitly, persists the complete feed,
maps to Yoma Job opportunities and exposes the local catalogue through the shared provider client.

## Tasks

- [x] Add JobJack project, options, DI, recurring job, context and migration.
- [x] Add XML retrieval, paging/state tracking, explicit parsing and embedded sample mode.
- [x] Add content/Markdown, dates, salary, requirements and title normalization.
- [x] Add category, keyword, country and lookup mappings.
- [x] Add omission-based terminal deletion with empty-feed protection and retention.
- [x] Merge implementation to master.
- [ ] Complete final environment validation and release.
- [ ] Revisit custom-field mappings after YOM-1244 field approval.

## Decisions

- 2026-08-03: Explicit XML parsing is preferred because individual malformed fields must not reject the complete feed.
- 2026-08-04: Provider and city are appended to titles only when absent; Yoma-compatible Markdown is produced at ingestion.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1271](https://linear.app/didx/issue/YOM-1271/api-jobjack-opportunity-pull-sync)
