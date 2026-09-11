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
render credentials from the schema identity committed at scheduling and exact version used at issuance.

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
- [x] Complete explicit Opportunity schema selection and compatibility rules.
- [ ] Assign approved schemas and issuance behavior across Alison, Jobberman, JobJack and IXO after the final field/schema matrix is approved.
- [ ] Resolve the approved type-compatible schema automatically for CSV imports after the final matrix is approved.
- [x] Resolve and persist the latest version of the scheduled schema when issuance is processed.
- [x] Map custom-field values and structured Skills into issued credentials.
- [x] Render scalar and structured attributes from the exact issued schema version through an API-prepared wallet contract.
- [ ] Complete the three Web surfaces.
- [ ] Configure startup seeds after the final field/schema matrix is approved.

## Decisions

- 2026-08-06: Opportunity Type `Name` is a fixed technical code; `DisplayName` may change.
- 2026-08-06: Generic `Opportunity|Default` is an explicit selectable schema, not an automatic fallback.
- 2026-08-06: Changing an Opportunity type requires explicit schema reselection.
- 2026-08-13: The schema full name, type and artifact are committed at scheduling. Processing resolves
  the latest version of that scheduled schema, and wallet retrieval renders the exact issued version.
- 2026-08-12: Alison and IXO retain `Opportunity|Default` temporarily; Jobberman and JobJack intentionally keep verification and issuance disabled while their scope remains Opportunity sync only.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1277](https://linear.app/didx/issue/YOM-1277/opportunity-credential-schemas-by-type-and-custom-fields)
- API children: [YOM-1278](../YOM-1278-api-admin-credential-schema-management-by-type/feature.md) · [YOM-1279](../YOM-1279-api-opportunity-management-credential-schema-selection/feature.md) · [YOM-1280](https://linear.app/didx/issue/YOM-1280)
