# Feature: API Custom Fields Framework for Opportunity and MyOpportunity

## Meta

- **Feature**: API custom-fields framework
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1254](https://linear.app/didx/issue/YOM-1254/api-custom-fields-framework-for-opportunity-and-myopportunity)
- **Owner**: Adrian
- **Areas**: api
- **Status**: in-progress
- **Started**: 2026-07-08

## Problem / Goal

Provide typed, definition-driven custom fields for Opportunity and MyOpportunity without expanding
the core models for every opportunity type. The framework must cover discovery, validation,
persistence, hydration, filtering, CSV imports and partner-sync inputs while remaining independent
of the temporary seeded field set.

## Out of Scope

- User-level custom fields and User Presets.
- BA approval of the final definitions and options.
- Credential schema selection and issuance; see YOM-1277 and its children.

## Plan

The shared contract is documented in the [epic README](../README.md). The implementation is owned
by the Core custom-field services and repositories, then composed into Opportunity,
MyOpportunity, CSV import and PartnerSync flows. Final scripted definitions remain pending until
the BA field map is approved.

## Tasks

- [x] Add definition, option and value entities, mappings, indexes and migrations.
- [x] Add definition discovery for generic and Opportunity-type contexts.
- [x] Add typed validation, normalization and lookup-backed options.
- [x] Add Opportunity and MyOpportunity persistence and hydrated projections.
- [x] Add replacement semantics for API writes and patch semantics for imports/integrations.
- [x] Add database-side Opportunity and MyOpportunity filtering.
- [x] Add dynamic CSV import columns and validation.
- [x] Add PartnerSync request support.
- [ ] Replace temporary sample definitions with the BA-approved field map.
- [ ] Re-run end-to-end API, CSV and partner mapping validation against the final definitions.

## Decisions

- 2026-07-08: Definitions and values are relational and indexed; values are not stored as a JSON blob.
- 2026-07-14: API writes are full replacement, while CSV and PartnerSync use partial-update semantics.
- 2026-07-15: Numeric and DateTime filters use typed indexed projections rather than runtime text casts.
- 2026-08-11: The branch and running API are authoritative; Linear still contains implementation detail that now belongs here.
- 2026-08-25: Synced master’s production JobJack and official IXO providers into the branch’s
  `OpportunityRequestCreate` custom-field pipeline. Existing description suffixes remain compatible
  output; final structured mappings remain blocked on the YOM-1264 field/core metadata matrix.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1254](https://linear.app/didx/issue/YOM-1254/api-custom-fields-framework-for-opportunity-and-myopportunity)
- Related: [YOM-1277](../YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/feature.md)
