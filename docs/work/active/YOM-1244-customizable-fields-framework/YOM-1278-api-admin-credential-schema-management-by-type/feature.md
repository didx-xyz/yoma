# Feature: API Admin Credential Schema Management by Type

## Meta

- **Feature**: Admin credential schema management by type
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1278](https://linear.app/didx/issue/YOM-1278/api-admin-credential-schema-management-by-type)
- **Owner**: Adrian
- **Areas**: api
- **Status**: in-progress
- **Started**: 2026-08-06

## Problem / Goal

Extend SSI administration so an admin can create generic or Opportunity-type-specific schemas and
select static or custom-field attributes applicable to that context, without changing the existing
provider versioning model.

## Out of Scope

- Opportunity schema selection and compatibility enforcement (YOM-1279).
- Credential value mapping and wallet rendering (YOM-1280/YOM-1283).
- Final startup schema composition pending the BA field list.

## Plan

Use `TypeContext` only for Opportunity schemas, construct the provider full name in the API, and
keep the schema entity service responsible for attribute discovery. Persist schema mapping
protection in the custom-field domain after provider upsert. Shared rules are in the
[epic README](../README.md).

## Tasks

- [x] Add optional `TypeContext` to schema create and response models.
- [x] Validate Opportunity contexts against the stable Opportunity Type name.
- [x] Construct and parse two- and three-part schema full names.
- [x] Add Opportunity Type `DisplayName` while preserving stable `Name` lookup behavior.
- [x] Return applicable custom fields separately from static entity properties.
- [x] Persist `IsSchemaMapped` and expose aggregate `IsProtected`.
- [x] Repair missing local protection when provider schemas are listed.
- [x] Keep existing generic schema creation, update and issuance backward compatible.
- [ ] Exercise create/update/list with a representative type-specific schema.
- [ ] Configure final startup seeds after BA approval.

## Decisions

- 2026-08-06: Schema Type, Artifact Type, Name and Type Context are immutable identity; updates change attributes only.
- 2026-08-07: Provider persistence and the application database cannot share a transaction; schema listing performs one-way protection repair.
- 2026-08-07: `IsSystem` is controlled by developers; schema administration manages only `IsSchemaMapped`.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1278](https://linear.app/didx/issue/YOM-1278/api-admin-credential-schema-management-by-type)
- Parent capability: [YOM-1277](../YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/feature.md)
