# Feature: JobJack Feed Mappings and Business Rules

## Meta

- **Feature**: JobJack feed mappings
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1272](https://linear.app/didx/issue/YOM-1272/feed-mappings-and-business-rules)
- **Owner**: Adrian and Product
- **Areas**: api
- **Status**: in-progress
- **Started**: 2026-08-03

## Problem / Goal

Define how JobJack feed values become Yoma opportunity content and lookup values without silently
discarding useful partner metadata.

## Out of Scope

- Creating partner-specific Web presentation.

## Plan

Mappings live in the JobJack client and remain explicit and fail-safe. Unknown categories fall back
to Other; raw partner terms remain searchable where useful.

## Tasks

- [x] Map the confirmed sector list to Yoma categories.
- [x] Confirm South Africa-only country behavior.
- [x] Normalize salaries, positions, contract types and requirements.
- [x] Align searchable keyword rules with Jobberman, Alison and IXO.
- [ ] Reassess partner-specific fields through Custom Fields after final definitions exist.

## Decisions

- 2026-08-04: Organization-name suffixes in supplied category examples were informative and not part of category names.
- 2026-08-04: Unknown/missing sectors safely map to Other.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1272](https://linear.app/didx/issue/YOM-1272/feed-mappings-and-business-rules)
