# Feature: API Opportunity Management Credential Schema Selection

## Meta

- **Feature**: Opportunity credential schema selection
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1279](https://linear.app/didx/issue/YOM-1279/api-opportunity-management-credential-schema-selection)
- **Owner**: Adrian
- **Areas**: api
- **Status**: review
- **Started**: 2026-08-11

## Problem / Goal

Let Organization Admins explicitly select a generic or Opportunity-type-specific credential schema
while creating or updating an Opportunity, without allowing incompatible schemas or server-selected
fallbacks.

## Out of Scope

- Clearing the selection in the UI when an Opportunity type changes (YOM-1282).
- Processing-time schema version resolution and credential value mapping (YOM-1280).
- Automatically selecting/replacing a schema on a manual admin save, or silently falling back
  when a selected/expected schema is missing. CSV/partner default naming and the one-time existing
  Default migration are now part of YOM-1277's approved stage 2, not manual fallback behaviour.

## Plan

Extend latest-schema discovery with an optional type context. With a context, return every generic
Opportunity schema plus schemas matching the selected Opportunity Type's stable name. Validate the
submitted full schema name against the target Opportunity type during both create and update.
Shared naming and compatibility rules live in the [epic README](../README.md).

## Tasks

- [x] Return every generic Opportunity schema plus schemas matching the selected type context.
- [x] Exclude schemas scoped to other Opportunity types.
- [x] Preserve unfiltered schema listing when no context is supplied.
- [x] Require a concrete schema when credential issuance is enabled.
- [x] Validate that the selected schema exists and is generic or matches the target Opportunity type.
- [x] Preserve compatible explicit manual selections; stage 2 migrates existing generic Defaults
  on distinct types once, without replacing named custom schemas or queued issuance.
- [x] Keep schema context explicit in the response model.
- [x] Build the complete API solution with no warnings or errors.
- [ ] Complete the UI selection and type-change clearing behavior in YOM-1282.

## Decisions

- 2026-08-11: Schema discovery uses the existing optional `typeContext` concept and stable Opportunity Type `Name`.
- 2026-08-11: Type-change reselection is shared behavior: the UI clears the old selection; the API requires and validates the submitted selection against the new type.
- 2026-08-11: No additional confirmation flag is introduced because it would describe a UI interaction rather than a domain fact.
- 2026-08-11: No migration is required; the selected full schema name is already persisted on Opportunity.
- 2026-10-08: Manual explicit-selection and type applicability remain unchanged. YOM-1277 stage 2
  adds shared canonical naming for CSV/pull paths and one-time reassignment of credential-enabled
  existing generic Defaults in the undeployed CF migration. No repository/DI extension or repeated
  startup reassignment remains. The provider schemas are seeded by the existing startup job afterwards.
  For a UI recommendation, use existing discovery's `displayName: "Default"` and matching
  `typeContext`, or the generic Default for Learning/Other; submit its full `name`. Do not choose
  the first returned schema, override a custom selection or silently substitute a missing scoped
  default. See the consolidated [credential handoff](../YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/handoffs/2026-10-07-a.md).

## Links

- Epic: [YOM-1244](../README.md)
- Parent capability: [YOM-1277](../YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/feature.md)
- Ticket: [YOM-1279](https://linear.app/didx/issue/YOM-1279/api-opportunity-management-credential-schema-selection)
