# Feature: UI — Admin Credential Schema Management by Type

## Meta

- **Feature**: Admin credential schema management by type
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1281](https://linear.app/didx/issue/YOM-1281/ui-admin-credential-schema-management-by-type)
- **Owner**: Jason
- **Areas**: web
- **Status**: planning
- **Started**: 2026-08-13

## Problem / Goal

Extend the Admin credential schema management UI so multiple named generic and
Opportunity-type-specific schemas can be created and maintained. Creation gains an optional
Opportunity Type selector (Opportunity schemas only); the list shows Schema Name and Opportunity
Type as separate columns; editing keeps identity fields read-only and changes attributes only.
Available fields load from the selected schema context and render dynamically using API-provided
entity, grouping and ordering metadata — no hardcoded custom-field keys or type-specific
combinations anywhere.

## Out of Scope

- Schema-specific attribute ordering, drag-and-drop or credential layout configuration.
- Version selection or version-management controls — the API/provider versions internally.
- Managing or clearing `IsSystem` protection from the UI.
- Parsing, constructing or displaying provider full names — the UI works with Schema Name and
  the API-provided context only.
- Changes to YoID schema creation and editing.

## Plan

To be written by the implementation session after reading the web repo. Constraints already
settled: the shared naming/context/protection contract and the schema-context notes are in the
[epic README](../README.md#credential-schema-context); API behaviour is implemented under
[YOM-1278](../YOM-1278-api-admin-credential-schema-management-by-type/feature.md). Available
fields must be reloaded and selected attributes reconciled when Opportunity Type changes during
creation. Applicable fields are selectable but never auto-mapped. Structured Skills remain one
selectable complex list field.

## Tasks

- [ ] Create flow: optional Opportunity Type selector for Opportunity schema type; hidden and
      cleared for other schema types; no defaulted Schema Name.
- [ ] Schema list: Schema Name and Opportunity Type as separate columns from API context
      (empty for generic schemas).
- [ ] Edit flow: Schema Type, Artifact Type, Schema Name and Opportunity Type read-only;
      attributes editable through the existing edit flow.
- [ ] Available fields: render the API collection dynamically, split by owning entity
      (Opportunity / MyOpportunity), Core Fields grouping for statics, Group/SubGroup/SortOrder/
      Title metadata for custom fields; submit stable technical identifiers.
- [ ] Reload available fields and reconcile selected attributes on Opportunity Type change
      during creation.
- [ ] Existing mappings: visible when editing, removable (next version drops the attribute);
      only active applicable custom fields newly selectable; surface API validation errors.
- [ ] Regression: YoID schemas and existing generic `Opportunity|Default` schemas display and
      edit unchanged.
- [ ] Verify against a running API on `feature/custom-fields-framework` with a representative
      type-specific schema.

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-08-13: Folder created ahead of implementation as a lean planning stub; the Plan section is
  owed by the first implementation session after reading the repo.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1281](https://linear.app/didx/issue/YOM-1281/ui-admin-credential-schema-management-by-type)
- Parent capability: [YOM-1277](../YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/feature.md)
- API counterpart: [YOM-1278](../YOM-1278-api-admin-credential-schema-management-by-type/feature.md)
- Siblings: [YOM-1282](../YOM-1282-ui-opportunity-credential-schema-selection/feature.md) ·
  [YOM-1283](../YOM-1283-ui-youth-opportunity-credential-display/feature.md)
