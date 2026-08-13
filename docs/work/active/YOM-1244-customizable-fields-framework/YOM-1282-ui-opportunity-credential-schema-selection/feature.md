# Feature: UI — Opportunity Credential Schema Selection

## Meta

- **Feature**: Opportunity credential schema selection
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1282](https://linear.app/didx/issue/YOM-1282/ui-opportunity-credential-schema-selection)
- **Owner**: Jason
- **Areas**: web
- **Status**: planning
- **Started**: 2026-08-13

## Problem / Goal

Let Organization Admins explicitly select the named credential schema for an Opportunity when
credential issuance is enabled. The selector shows all generic Opportunity schemas plus schemas
matching the selected Opportunity type, clearly distinguishing generic from type-specific options
by API-provided name and context metadata. Selection is required; there is no automatic selection,
substitution or fallback — a schema named `Default` is an ordinary option.

## Out of Scope

- Parsing the provider full schema name — the UI submits the API-provided full name verbatim and
  renders API-provided name/context metadata.
- Server-side compatibility validation — implemented in
  [YOM-1279](../YOM-1279-api-opportunity-management-credential-schema-selection/feature.md); the
  UI presents its validation messages.
- Credential issuance processing and wallet display (YOM-1280 / YOM-1283).

## Plan

To be written by the implementation session after reading the web repo. Constraints already
settled: schema discovery and validation are live in YOM-1279 (optional `typeContext` on
latest-schema discovery, stable Opportunity Type `Name`); the shared contract is in the
[epic README](../README.md#credential-schema-context). Type-change reselection is shared
behaviour by decision (2026-08-11 in YOM-1279): the UI clears the old selection on every
Opportunity type change — including a generic selection — and the API validates the resubmission.
The likely surface is the Opportunity create/edit wizard already extended for custom fields
(YOM-1255), which refetches on type change.

## Tasks

- [ ] Load applicable schemas by selected Opportunity type when issuance is enabled: all generic
      plus matching type-specific; other types excluded.
- [ ] Distinguish generic vs type-specific options and show the Admin-defined schema name from
      API metadata.
- [ ] Require explicit selection when issuance is enabled; submit the selected full name; no
      default or fallback behaviour for any schema, including `Default`.
- [ ] Clear the selection and reload options on every Opportunity type change; require
      reselection even when the previous schema reappears in the refreshed options.
- [ ] Editing: populate the current selection when the type is unchanged; apply clear-and-reselect
      when it changes; existing `Opportunity|Default` selections display correctly.
- [ ] Present API validation messages clearly.
- [ ] Verify against a running API on `feature/custom-fields-framework`, including type-change
      and generic-reselection paths.

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-08-13: Folder created ahead of implementation as a lean planning stub; the Plan section is
  owed by the first implementation session after reading the repo.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1282](https://linear.app/didx/issue/YOM-1282/ui-opportunity-credential-schema-selection)
- Parent capability: [YOM-1277](../YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/feature.md)
- API counterpart: [YOM-1279](../YOM-1279-api-opportunity-management-credential-schema-selection/feature.md)
- Siblings: [YOM-1281](../YOM-1281-ui-admin-credential-schema-management-by-type/feature.md) ·
  [YOM-1283](../YOM-1283-ui-youth-opportunity-credential-display/feature.md)
