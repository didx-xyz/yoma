# Feature: API IXO Full Partner Pull Sync

## Meta

- **Feature**: IXO PartnerSync provider
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1275](https://linear.app/didx/issue/YOM-1275/api-ixo-yie-full-partner-pull-sync)
- **Owner**: Adrian
- **Areas**: api
- **Status**: review
- **Started**: 2026-08-04

## Problem / Goal

Implement IXO transport, catalogue persistence, mapping, user hand-off and verification clients
behind the existing provider-neutral PartnerSync contracts.

## Out of Scope

- Yellow Card payout; it is a separate IXO infrastructure project and epic.
- Final custom-field mappings.

## Plan

Use client-credentials authentication and cached bearer tokens, persist complete catalogue snapshots,
map Learning/Job records, and support permanent user links plus verification paging/checkpoints.

## Tasks

- [x] Add `Yoma.Core.Infrastructure.IXO.PartnerSync`, configuration, context and migration.
- [x] Add token authentication, opportunity paging/cache and embedded resources.
- [x] Map Learning and Job opportunities, categories, keywords and terminal removals.
- [x] Add user hand-off/linking and verification mapping.
- [x] Add startup/recurring catalogue refresh and shared provider registration.
- [x] Merge implementation to master and then into the Custom Fields branch.
- [x] Validate embedded feeds, tenant creation, completions and credential issuance locally/Stage.
- [ ] Validate minor contract differences against IXO's provisioned environments.
- [ ] Revisit custom-field mappings after YOM-1244 field approval.

## Decisions

- 2026-08-04: `removed: true` is authoritative; omission from a valid full snapshot is fallback.
- 2026-08-04: User resolution prefers the permanent partner link, then documented Yoma ID, then current username.
- 2026-08-06: IXO PartnerSync and IXO Yellow Card remain separate .NET projects; database schema naming may be shared without coupling clients.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1275](https://linear.app/didx/issue/YOM-1275/api-ixo-yie-full-partner-pull-sync)
