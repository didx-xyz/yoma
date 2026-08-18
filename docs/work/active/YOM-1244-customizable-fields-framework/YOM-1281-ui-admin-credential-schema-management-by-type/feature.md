# Feature: UI — Admin Credential Schema Management by Type

## Meta

- **Feature**: Admin credential schema management by type
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1281](https://linear.app/didx/issue/YOM-1281/ui-admin-credential-schema-management-by-type)
- **Owner**: Jason
- **Areas**: web
- **Status**: in-progress — dev complete behind a mock; browser pass owed, and the live-API pass is
  blocked on the credential provider (Aries CloudAPI, 503)
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

Everything is driven off two API-provided collections and nothing else: the schema itself
(`GET /ssi/schema/{fullName}`, whose `entities[]` carry only the attributes that schema maps) and
schema-entity discovery (`GET /ssi/schema/entity?schemaType&typeContext`, which returns the
statics plus the active custom fields applicable to that type and context).

Files:

| Purpose                                             | File                                                      |
| --------------------------------------------------- | --------------------------------------------------------- |
| Models (`typeContext`, `customFields[]`)            | `src/web/src/api/models/credential.ts`                    |
| Service (`typeContext` params, split request types) | `src/web/src/api/services/credentials.ts`                 |
| Data-source façade + mock flag                      | `src/web/src/api/services/credentialSchemaAdmin.ts`       |
| Mock fixtures (temporary)                           | `src/web/src/lib/credentials/schemaAdminMockApi.ts`       |
| Mock banner (temporary)                             | `src/web/src/components/Schema/SchemaAdminMockBanner.tsx` |
| Attribute picker                                    | `src/web/src/components/Schema/SchemaAttributesEdit.tsx`  |
| List                                                | `src/web/src/pages/admin/schemas/[[...query]]/index.tsx`  |
| Create / edit wizard                                | `src/web/src/pages/admin/schemas/[id]/index.tsx`          |

The shared naming/context/protection contract is in the
[epic README](../README.md#credential-schema-context); the API is
[YOM-1278](../YOM-1278-api-admin-credential-schema-management-by-type/feature.md).

**All schema-management traffic is mocked for now** — reads _and_ mutations — because publishing a
provider schema cannot be undone. It lives behind one façade, `credentialSchemaAdmin.ts`. See the
[handoff](./handoffs/2026-08-14-a.md) for the removal list; note that the switch it describes as a
hand-edited boolean has since become environment-gated (below).

**Scope grew on 2026-08-17.** That façade is no longer admin-only: the Opportunity wizard's schema
selector reads through it too, because the credential provider went offline and every server-side
schema resolution reaches it. The flag is now gated on `NEXT_PUBLIC_ENVIRONMENT === "local"`, so the
mock cannot reach a deployed build, and **which source is serving locally is a per-session choice** —
the banner carries a mocked/live switch, so the real API can be exercised without a rebuild. The
removal list now also covers
`useOpportunitySchemasQuery` and the Credential step's notice — see
[YOM-1282's handoff](../YOM-1282-ui-opportunity-credential-schema-selection/handoffs/2026-08-17-a.md).

## Tasks

- [x] Create flow: optional Opportunity Type selector for Opportunity schema type; hidden and
      cleared for other schema types; no defaulted Schema Name.
- [x] Schema list: Schema Name and Opportunity Type as separate columns from API context
      (empty for generic schemas).
- [x] Edit flow: Schema Type, Artifact Type, Schema Name and Opportunity Type read-only;
      attributes editable through the existing edit flow.
- [x] Available fields: render the API collection dynamically, split by owning entity
      (Opportunity / MyOpportunity), Core Fields grouping for statics, Group/SubGroup/SortOrder/
      Title metadata for custom fields; submit stable technical identifiers.
- [x] Reload available fields and reconcile selected attributes on Opportunity Type change
      during creation.
- [x] Existing mappings: visible when editing, removable (next version drops the attribute);
      only active applicable custom fields newly selectable; surface API validation errors.
- [x] Mock layer for every schema-management read and mutation, behind one flag.
- [ ] Regression: YoID schemas and existing generic `Opportunity|Default` schemas display and
      edit unchanged. _(fixtures cover both; browser pass owed)_
- [ ] Verify against a running API on `feature/custom-fields-framework` with a representative
      type-specific schema. _(blocked on flipping the mock flag)_

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-08-13: Folder created ahead of implementation as a lean planning stub; the Plan section is
  owed by the first implementation session after reading the repo.
- 2026-08-14: **All schema-management calls are mocked during development, mutations included.**
  Creating or updating a schema publishes a provider version that cannot be withdrawn, so a
  read-only mock would still leave the dev loop capable of polluting the tenant. The mock is one
  module plus a one-line flag; the real service is untouched and still used by every other surface.
- 2026-08-14: ~~The attribute picker is a grouped checkbox list, replacing the (Datasource,
  Attribute) dropdown repeater.~~ **Superseded the same day — see the 2026-08-14 entry below.**
- 2026-08-14: **Mappings that discovery no longer offers are shown in a flagged "No longer
  available" section and excluded from the submitted attribute list.** `SSISchemaService.Update`
  validates against the _active, in-context_ discovery set, so resubmitting a deactivated custom
  field is rejected outright — keeping it selectable would only produce an unfixable save error.
  They are shown rather than hidden so nothing disappears without the admin seeing it.
- 2026-08-14: **`GET /opportunity/type` is not mocked.** It is an anonymous Opportunity-domain
  lookup that reaches no credential provider, and the Opportunity Type _names_ the fixtures key
  off stay real that way.
- 2026-08-14: The web `ArtifactType` enum member was renamed `AnonCreds` → `ACR` to match the API
  enum, with `ARTIFACT_TYPE_LABELS` carrying the friendly text. The API returns the enum _name_
  (`"ACR"`), so `ArtifactType[schema.artifactType]` was resolving to `undefined` and AnonCreds
  schemas rendered a blank artifact type.
- 2026-08-14: The list's "Attributes" column now shows `propertyCount` (the attribute count) rather
  than `entities.length` (the datasource count), which is what the header always claimed.
- 2026-08-14: **The attributes step is a single `Data Source | Attribute` table** — read-only core
  rows for the system statics, then one row per additional attribute with a Datasource dropdown and
  an Attribute dropdown, plus remove/add. This keeps the original interaction and drops the
  "System attributes" / "Available attributes" headers. The grouped-checkbox rewrite tried earlier
  the same day was rejected: the two-column table is the shape the admin surface should keep.
  System rows are still excluded from the submitted list; the API prefixes them itself.
- 2026-08-14: **Group/SubGroup metadata rides in the Attribute dropdown's optgroups**, in the order
  the API returned. That is how the ticket's "render dynamically using API-provided grouping and
  ordering metadata" requirement is met inside a two-column table; the component still knows no
  field key, group name or opportunity type.
- 2026-08-14: **Static properties are grouped from `property.group`, not a hardcoded heading, and
  are merged with custom fields into one ordered space.** Adrian's `60a7a8b4` added
  `Group`/`SubGroup`/`SortOrder` to `SSISchemaEntityProperty` and seeded them (Opportunity Details,
  Completion Details, Youth Details, Contact Details, Personal Details), and
  `SSIAttributePresentationHelper` now orders statics, custom fields and wallet attributes through
  one rule. Our picker had hardcoded `"Core fields"` for every static and listed statics before
  custom fields in a separate namespace — which would render a shared group twice. The client
  comparator mirrors the helper: configured groups first, then Group → SubGroup → SortOrder →
  display label → attribute name.
- 2026-08-14: **The reserved-character rule on Schema Name applies to creation only.** On edit the
  field holds the _full_ provider name, which legitimately contains `|`, so the rule rejected every
  existing schema while pointing at an input that displays the friendly name. Any future validation
  on that field must be scoped the same way.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1281](https://linear.app/didx/issue/YOM-1281/ui-admin-credential-schema-management-by-type)
- Parent capability: [YOM-1277](../YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/feature.md)
- API counterpart: [YOM-1278](../YOM-1278-api-admin-credential-schema-management-by-type/feature.md)
- Siblings: [YOM-1282](../YOM-1282-ui-opportunity-credential-schema-selection/feature.md) ·
  [YOM-1283](../YOM-1283-ui-youth-opportunity-credential-display/feature.md)
- Handoffs: [2026-08-14-a](./handoffs/2026-08-14-a.md)
