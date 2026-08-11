# Feature: Opportunity Credential Schemas by Type and Custom Fields

## Meta

- **Feature**: Opportunity credential schemas by type
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1277](https://linear.app/didx/issue/YOM-1277/opportunity-credential-schemas-by-type-and-custom-fields)
- **Owner**: Adrian and Jason
- **Areas**: both
- **Status**: in-progress
- **Started**: 2026-08-06

## Problem / Goal

Allow multiple generic and Opportunity-type-specific credential schemas, expose custom fields as
schema attributes, require an applicable schema on credential-enabled opportunities, and issue and
render credentials from the latest selected schema.

## Out of Scope

- Final schema composition before the BA-approved custom-field map exists.
- A cross-framework skill identifier; structured Skills carry names only for now.
- Automatic schema selection or fallback during Opportunity management.

## Plan

The shared naming, context and protection contract is in the [epic README](../README.md). Delivery
is split across admin schema management (YOM-1278), Opportunity selection (YOM-1279), issuance
(YOM-1280), and three Web tickets (YOM-1281–1283).

## Tasks

- [x] Establish type-context naming, parsing and validation groundwork.
- [x] Add Opportunity Type stable names and separate display names.
- [x] Expose type-aware static and custom-field schema attributes.
- [x] Persist and self-heal schema-mapped custom-field protection.
- [ ] Complete explicit Opportunity schema selection and compatibility rules.
- [ ] Resolve and persist the latest schema metadata when issuance is processed.
- [ ] Map custom-field values and structured Skills into issued credentials.
- [ ] Complete the three Web surfaces.
- [ ] Configure startup seeds after the final field/schema matrix is approved.

## Decisions

- 2026-08-06: Opportunity Type `Name` is a fixed technical code; `DisplayName` may change.
- 2026-08-06: Generic `Opportunity|Default` is an explicit selectable schema, not an automatic fallback.
- 2026-08-06: Changing an Opportunity type requires explicit schema reselection.
- 2026-08-06: Issuance resolves the latest selected schema at processing time, not scheduling time.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1277](https://linear.app/didx/issue/YOM-1277/opportunity-credential-schemas-by-type-and-custom-fields)
- API children: [YOM-1278](../YOM-1278-api-admin-credential-schema-management-by-type/feature.md) · [YOM-1279](https://linear.app/didx/issue/YOM-1279) · [YOM-1280](https://linear.app/didx/issue/YOM-1280)
