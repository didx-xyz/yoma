# Feature: UI — Opportunity Credential Schema Selection

## Meta

- **Feature**: Opportunity credential schema selection
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1282](https://linear.app/didx/issue/YOM-1282/ui-opportunity-credential-schema-selection)
- **Owner**: Jason
- **Areas**: web
- **Status**: review — pending live API create/edit
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

The whole feature is step 7 (Credential) of the existing Opportunity create/edit wizard, driven by
one API call: `GET /ssi/schema?schemaType=Opportunity&typeContext={OpportunityType.Name}`, which
returns every generic Opportunity schema plus those scoped to that type and excludes the rest
(`SSISchemaService.List`). `SSISchema.typeContext` being null is what makes a schema generic;
`displayName` is the admin-defined name on its own and `name` is the full provider name that gets
submitted back verbatim. `OpportunityService.AssertSSISchemaApplicable` re-validates on save.

The wizard already resolves the selected Opportunity type for the custom-field definitions query
(YOM-1255); that resolution now yields the whole type object, and both queries key off its stable
`name`.

Files:

| Purpose                                                | File                                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Type-scoped schema query (`typeContext` in the key)    | `src/web/src/hooks/useOpportunityMutations.tsx`                                |
| Selector, grouping, clear-on-type-change, preview list | `src/web/src/pages/organisations/[id]/opportunities/[opportunityId]/index.tsx` |
| Shared attribute ordering (extracted, 3rd consumer)    | `src/web/src/lib/credentials/attributePresentation.ts`                         |
| `SelectOptionGroup` (shared, was duplicated)           | `src/web/src/api/models/lookups.ts`                                            |

Type-change reselection is shared behaviour by decision (2026-08-11 in YOM-1279): the UI clears the
old selection on every Opportunity type change — including a generic selection — and the API
validates the resubmission. The shared contract is in the
[epic README](../README.md#credential-schema-context).

**The schema lookup is mocked in local development**, through the same façade as
[YOM-1281](../YOM-1281-ui-admin-credential-schema-management-by-type/feature.md):
`api/services/credentialSchemaAdmin.ts`. Not for the irreversibility reason that ticket had — for
availability. Every server-side schema resolution goes through the credential provider, so the
lookup fails outright while that provider is offline. `SCHEMA_ADMIN_MOCK_ENABLED` is gated on
`NEXT_PUBLIC_ENVIRONMENT === "local"`, and mocked ⇄ live is then a per-session switch on the banner.
See the [handoff](./handoffs/2026-08-17-a.md) for what this does and does not make testable.

## Tasks

- [x] Load applicable schemas by selected Opportunity type when issuance is enabled: all generic
      plus matching type-specific; other types excluded.
- [x] Distinguish generic vs type-specific options and show the Admin-defined schema name from
      API metadata.
- [x] Require explicit selection when issuance is enabled; submit the selected full name; no
      default or fallback behaviour for any schema, including `Default`.
- [x] Clear the selection and reload options on every Opportunity type change; require
      reselection even when the previous schema reappears in the refreshed options.
- [x] Editing: populate the current selection when the type is unchanged; apply clear-and-reselect
      when it changes; existing `Opportunity|Default` selections display correctly.
- [x] Present API validation messages clearly.
- [x] Browser pass, including type-change and generic-reselection paths — steps 1–8 of the
      [handoff](./handoffs/2026-08-17-a.md).
- [ ] Verify against a running API on `feature/custom-fields-framework`, and against one real
      type-specific schema. _(live pass over `GET /ssi/schema` and opportunity save done; the one
      real type-specific schema still needs the provider create/update path)_

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-08-13: Folder created ahead of implementation as a lean planning stub; the Plan section is
  owed by the first implementation session after reading the repo.
- 2026-08-17: **The schema query is disabled until an Opportunity type is resolved.** Called
  without a `typeContext` the API returns Opportunity schemas scoped to _every_ type, which is not
  a valid selection set here — offering one would be rejected on save by
  `AssertSSISchemaApplicable`. The query key carries the context, so TanStack Query caches one
  entry per type and switching back and forth costs nothing.
- 2026-08-17: **Generic and type-specific schemas render as two headed groups**, generic first
  under "All opportunity types" and type-specific under the selected type's `displayName`. They
  share a namespace — both may be named `Placement` — so a flat list would show what reads as a
  duplicate. Group headings and labels come from API metadata; the component knows no schema name
  or opportunity type. The full provider name is submitted verbatim, never reconstructed.
- 2026-08-17: **Clearing on type change is silent.** The selection is dropped and the step's
  existing "Schema is required." validation is left to say so; no bespoke "we cleared this"
  notice. Clearing is guarded on a _previously known_ type, because the Opportunity type lookup is
  a client query that resolves after first render — an unguarded comparison would read the initial
  `null → Job` transition as a change and wipe a saved selection on every edit.
- 2026-08-17: **A generic selection is cleared too**, matching YOM-1279's 2026-08-11 decision, even
  though the API would still accept it. Reselection is a deliberate act, not an inference.
- 2026-08-17: **The step-7 attribute preview now lists mapped custom fields alongside statics**, in
  the API's presentation order. It read `entities[].properties` only, so a type-specific schema —
  which exists precisely to carry custom fields — would have shown a credential missing exactly the
  attributes that make it type-specific. `ConvertToSSISchema` returns them under
  `entities[].customFields`.
- 2026-08-17: **The presentation comparator was extracted to
  `lib/credentials/attributePresentation.ts`.** It was written for the admin picker in YOM-1281;
  this is its second consumer and YOM-1283's wallet display will be the third. One copy per surface
  would drift from `SSIAttributePresentationHelper.Order`, which is the one thing all three must
  agree with. `SelectOptionGroup` moved to `api/models/lookups.ts` for the same reason.
- 2026-08-17: **The Opportunity Type dropdown now shows `displayName`, not `name`.** The schema
  group heading uses `displayName`, and the two disagreeing after an admin renames a type would be
  confusing. `name` remains the stable identifier for the type context and for the `Other` filter.
- 2026-08-17: **This surface was initially left unmocked** (decided with Jason), unlike YOM-1281,
  because nothing here publishes a provider schema. ~~It calls the real service.~~ **Superseded the
  same day — see the entry below.**
- 2026-08-17: **The schema lookup is mocked after all, for availability rather than safety.** The
  credential provider went offline, and `SSISchemaService.ListInternal` calls
  `ISSIProviderClient.ListSchemas` for _every_ schema resolution — so `GET /ssi/schema` fails
  wholesale, not just for schema management. `useOpportunitySchemasQuery` now reads through
  YOM-1281's existing façade so one flag still governs all schema traffic.
  The limit this leaves, which the earlier decision correctly predicted: opportunity create/update
  validates the submitted schema through `AssertSSISchemaApplicable`, which also reaches the
  provider, so **saving with credential issuance enabled fails while the provider is down** no
  matter what the web mocks. Everything up to the save is testable, and an amber
  `SchemaMockNotice` on the Credential step says so on screen.
  The façade keeps its `credentialSchemaAdmin` name despite no longer being admin-only: renaming it
  would invalidate YOM-1281's removal list for code that gets deleted before the PR. Its own doc
  comment names both consumers.
- 2026-08-17: **Mocked ⇄ live is a per-session switch, not a rebuild.** The façade resolves its
  implementation per call from `localStorage` rather than once at module load, and both the admin
  banner and the Credential step's notice carry the toggle. Editing a constant to compare the two
  data sources is too slow to do repeatedly, and the surfaces most worth comparing are exactly the
  ones the mock covers. Queries read the mode per call rather than through the React hook, so they
  cannot lag a render behind the switch; the hook exists only to keep the banner's own appearance
  free of a hydration mismatch.
- 2026-08-17: **`SCHEMA_ADMIN_MOCK_ENABLED` is gated on the environment
  (`NEXT_PUBLIC_ENVIRONMENT === "local"`), not on a hand-edited boolean.** A constant someone has to
  remember to flip back is exactly the kind of thing that ships; deriving it from the environment
  means no deployed build can serve fixtures even while this code exists. Removing the mock is
  unchanged — the guards come out with it.
- 2026-08-17: **Fixed a pre-existing bug that this ticket surfaced:** the Credential step rendered
  none of its controls on load. It has no issuance control of its own — the value derives from
  verification on the previous step — and the effect deriving it wrote only to `formData`, which
  step 7's react-hook-form state is seeded from at mount and afterwards re-seeded only by
  `resetStep7` on a step submit. So `watchStep7("credentialIssuanceEnabled")` was stale until the
  wizard was stepped through. The effect now writes the form copy as well. Any future field derived
  across steps needs the same treatment; `formData` is not a source the step forms observe.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1282](https://linear.app/didx/issue/YOM-1282/ui-opportunity-credential-schema-selection)
- Parent capability: [YOM-1277](../YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/feature.md)
- API counterpart: [YOM-1279](../YOM-1279-api-opportunity-management-credential-schema-selection/feature.md)
- Siblings: [YOM-1281](../YOM-1281-ui-admin-credential-schema-management-by-type/feature.md) ·
  [YOM-1283](../YOM-1283-ui-youth-opportunity-credential-display/feature.md)
- Handoffs: [2026-08-17-a](./handoffs/2026-08-17-a.md)
