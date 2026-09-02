# Epic: YOM-1244 — Yoma Customizable Fields / Metadata Framework

## Meta

- **Epic**: [YOM-1244](https://linear.app/didx/issue/YOM-1244)
- **Owners**: Adrian (api) · Jason (web)
- **Areas**: api, web
- **Status**: in-progress
- **Started**: 2026-07-08 (api), 2026-07-21 (web)
- **Branch**: `feature/custom-fields-framework` — **load-bearing, not convention.** The
  custom-field API exists only here; there is nothing to build against on `master`.

> Retro-created on 2026-08-11. The web work began before the `docs/work` convention landed
> (`a9518de0`), so the child feature docs and the pre-2026-08-11 handoffs were reconstructed
> from the branch, the Linear tickets and an out-of-repo context pack. Handoffs marked
> **reconstructed** were not written at the time; treat their detail as best-effort.

## Why This Epic Exists

Job opportunities need structured fields — salary, work type, minimum qualification,
experience level — that do not belong on the core Opportunity model, and every future
opportunity type will want its own. Instead of growing the model per type, the API exposes
a typed **custom-field framework**: definitions are metadata, values live in an indexed
relational store, and both are queryable in PostgreSQL.

The web app's job is to render, capture, display and filter those fields **entirely from
metadata**, so the UI survives the swap from today's temporary seeded `[Sample] …`
definitions to the BA-approved set (YOM-1264) without a code change.

## Child Features

| Folder                                                                                                                                                           | Ticket                                             | Area | Status                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---- | ------------------------------------------------------------------------------------- |
| [`YOM-1254-api-custom-fields-framework-for-opportunity-and-myopportunity/`](./YOM-1254-api-custom-fields-framework-for-opportunity-and-myopportunity/feature.md) | [YOM-1254](https://linear.app/didx/issue/YOM-1254) | api  | in-progress                                                                           |
| [`YOM-1255-ui-dynamic-custom-fields-for-opportunities-and-completions/`](./YOM-1255-ui-dynamic-custom-fields-for-opportunities-and-completions/feature.md)       | [YOM-1255](https://linear.app/didx/issue/YOM-1255) | web  | in-progress                                                                           |
| [`YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/`](./YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/feature.md)     | [YOM-1260](https://linear.app/didx/issue/YOM-1260) | web  | in-progress                                                                           |
| [`YOM-1261-ui-manage-user-presets/`](./YOM-1261-ui-manage-user-presets/feature.md)                                                                             | [YOM-1261](https://linear.app/didx/issue/YOM-1261) | web  | in-progress — mocked; real persistence blocked                                        |
| [`YOM-1262-ui-apply-user-presets-to-opportunity-discovery/`](./YOM-1262-ui-apply-user-presets-to-opportunity-discovery/feature.md)                             | [YOM-1262](https://linear.app/didx/issue/YOM-1262) | web  | in-progress — mocked; blocked on the presets API for live data                        |
| [`YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/`](./YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/feature.md)           | [YOM-1277](https://linear.app/didx/issue/YOM-1277) | both | in-progress                                                                           |
| [`YOM-1278-api-admin-credential-schema-management-by-type/`](./YOM-1278-api-admin-credential-schema-management-by-type/feature.md)                               | [YOM-1278](https://linear.app/didx/issue/YOM-1278) | api  | in-progress                                                                           |
| [`YOM-1279-api-opportunity-management-credential-schema-selection/`](./YOM-1279-api-opportunity-management-credential-schema-selection/feature.md)               | [YOM-1279](https://linear.app/didx/issue/YOM-1279) | api  | review                                                                                |
| [`YOM-1280-api-opportunity-credential-issuance-with-custom-fields/`](./YOM-1280-api-opportunity-credential-issuance-with-custom-fields/feature.md)               | [YOM-1280](https://linear.app/didx/issue/YOM-1280) | api  | in-progress — issuance and core wallet display verified; custom-field runtime pending |
| [`YOM-1281-ui-admin-credential-schema-management-by-type/`](./YOM-1281-ui-admin-credential-schema-management-by-type/feature.md)                                 | [YOM-1281](https://linear.app/didx/issue/YOM-1281) | web  | review — pending live API create/edit                                                 |
| [`YOM-1282-ui-opportunity-credential-schema-selection/`](./YOM-1282-ui-opportunity-credential-schema-selection/feature.md)                                       | [YOM-1282](https://linear.app/didx/issue/YOM-1282) | web  | review — pending live API create/edit                                                 |
| [`YOM-1283-ui-youth-opportunity-credential-display/`](./YOM-1283-ui-youth-opportunity-credential-display/feature.md)                                             | [YOM-1283](https://linear.app/didx/issue/YOM-1283) | web  | review — tested against live API                                                      |

Tickets with no folder yet — add one when work starts:

| Ticket                                                                                                  | Area      | Note                                                                                        |
| ------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------- |
| [YOM-1264](https://linear.app/didx/issue/YOM-1264)                                                      | design/BA | Final Opportunity CFs, completion CFs and User Presets. **Blocks YOM-1261 / YOM-1262**      |
| [YOM-1257](https://linear.app/didx/issue/YOM-1257) / [YOM-1258](https://linear.app/didx/issue/YOM-1258) | api       | User Preset model + preset→filter mapping                                                   |
| [YOM-1259](https://linear.app/didx/issue/YOM-1259)                                                      | api       | Opportunity category taxonomy. Unrelated to custom fields; needs only a UI regression check |

### Why each child exists

| Ticket   | Purpose                                                                                   |
| -------- | ----------------------------------------------------------------------------------------- |
| YOM-1254 | Provide the API metadata/value framework shared by Opportunities and completions.         |
| YOM-1255 | Let Web render, capture and display configured fields without hardcoding them.            |
| YOM-1260 | Let youth/admins filter using configured fields.                                          |
| YOM-1257 | Store reusable youth Opportunity-discovery presets.                                       |
| YOM-1258 | Translate presets into Opportunity discovery criteria.                                    |
| YOM-1259 | Align the Opportunity category taxonomy independently of custom fields.                   |
| YOM-1261 | Let youth manage their presets.                                                           |
| YOM-1262 | Let youth apply presets during discovery.                                                 |
| YOM-1264 | Supply the BA-approved field and preset definitions that unblock final configuration.     |
| YOM-1277 | Coordinate type-aware Opportunity credential schemas and custom-field credentials.        |
| YOM-1278 | Let platform admins manage compatible schemas and attribute mappings by Opportunity type. |
| YOM-1279 | Let organisation admins select a compatible schema when managing an Opportunity.          |
| YOM-1280 | Issue the selected schema with current core/custom-field values at processing time.       |
| YOM-1281 | Provide the Web admin surface for type-aware schema management.                           |
| YOM-1282 | Provide the Web selection experience during Opportunity management.                       |
| YOM-1283 | Render issued scalar and complex credential attributes for youth.                         |

Blocker ownership: BA/PM owns YOM-1264 and the final provider mapping matrix; Adrian owns API
framework/schema work; Jason owns Web implementation and regression checks.

## The One Rule

**Nothing may be keyed to a specific custom field.** No hardcoded definition key, title,
option value, group or opportunity type, anywhere. Phase-1 definitions are temporary scripted
metadata that the BA will replace wholesale; anything referencing a `[Sample] …` field breaks
on that swap. Every surface renders from the definitions the API returns.

## Shared API Contract

Verified against a running API on `feature/custom-fields-framework` — **the ticket
descriptions on YOM-1244 are stale and should not be trusted over this table.**

| Fact                 | Detail                                                                                                                                                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Definition discovery | `GET /opportunity/custom/field/definition?types={Type}` (anonymous, repeatable `types`), `GET /opportunity/{id}/custom/field/definition` (admin / org admin), `GET /myopportunity/{opportunityId}/custom/field/definition` (user)                                                  |
| `types` binding      | the **`Type` enum name** (`Other` / `Learning` / `Event` / `Job` / `Task`), **not** the type GUID. Passing a GUID silently returns only the generic definitions                                                                                                                    |
| Definition shape     | `key`, `title`, `description`, `group`, `subGroup`, `dataType`, `lookupType`, `validationRegex`, `isRequired`, `supportsMultiple`, `sortOrder`, `options[]`. `lookupType` **exists** (`Country` / `Language` / `Skill`; `null` → inline `options`); `defaultValue` was **removed** |
| Data types           | `String`, `Integer`, `Decimal`, `Boolean`, `DateTime`, `Option`                                                                                                                                                                                                                    |
| Ordering             | Group → SubGroup → SortOrder → Title; options by SortOrder → Name                                                                                                                                                                                                                  |
| Values (write)       | non-option → `value`; **every** Option field → `values`. Inline options submit the option **`key`**; lookup-backed options submit the lookup **GUID**                                                                                                                              |
| Values (read)        | `Opportunity` / `OpportunityInfo` / `MyOpportunity` hydrate `customFields`. Definitions are **not** repeated per entity — join on `key`                                                                                                                                            |
| Save semantics       | **replacement.** Resubmit the full collection on every save; omitted keys are deleted server-side. Never send a partial diff                                                                                                                                                       |
| Completion           | `multipart/form-data` with `CustomFields` as **one JSON-encoded form field**                                                                                                                                                                                                       |
| Filtering            | see [YOM-1260's feature doc](./YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/feature.md) for the clause shape and operator matrix                                                                                                                           |

### Credential schema context

Verified by reading `SSISchemaService`, `SSISchemaEntityService`, the schema validators and the
credential-schema migration, then by starting the API and issuing credentials against the existing
generic schema.

- Generic Opportunity schema full names remain `Opportunity|{Name}`.
- Type-specific full names are `Opportunity|{OpportunityTypeName}|{Name}`.
- `TypeContext` is optional and supported only for Opportunity schemas; it resolves against the
  fixed Opportunity Type `Name`, not its editable `DisplayName`.
- Admin-defined schema identity is immutable after creation. Updating attributes creates the next
  provider schema version.
- Schema attribute discovery keeps static entity properties separate from dynamic custom fields.
  Generic custom fields and fields matching the selected Opportunity type are returned.
- `IsSystem` remains developer-controlled. `IsSchemaMapped` is persisted by schema management;
  `IsProtected` combines both for admin editing rules.
- Provider schemas are the source of truth for historical mappings. Listing schemas repairs a
  missing local `IsSchemaMapped` flag if provider persistence succeeded before the local update.
- Existing `Opportunity|Default` seeding and issuance remain backward compatible; this was verified
  locally after the schema changes by tenant creation and issuance of ten signed JWS credentials.
- Opportunity management schema discovery returns every generic Opportunity schema plus schemas
  matching the selected Opportunity Type context; schemas for other types are excluded.
- Opportunity create/update requires an explicit selection when credential issuance is enabled and
  validates that the submitted schema is generic or matches the target Opportunity type.
- Alison and IXO currently enable credential issuance against the generic `Opportunity|Default`
  schema. Jobberman and JobJack currently leave credential issuance disabled and do not assign a
  schema. All four provider mappings must be reviewed against the final field/schema matrix rather
  than assuming the generic default is correct.
- On this branch all four Opportunity pull providers return `OpportunityRequestCreate`, allowing
  custom-field request values and patch semantics to pass through the shared pull pipeline. Master
  remains internally consistent on the earlier domain-model contract until this epic is merged.- **Baseline refreshed 2026-08-25.** This branch now includes `origin/master` through the official
  IXO API alignment (`7d7f48460`), the production query-index hotfix (`8e3bc0447`) and external
  Opportunity title normalization (`6d090b89b`). Existing JobJack and IXO metadata continues to be
  rendered in descriptions for compatibility. IXO `provider` is appended to the description and
  `providerLogoUrl` is not displayed; final structured/core mappings remain pending YOM-1264.
- Structured Skills are issued as JSON name items. Wallet detail resolves the exact immutable schema
  version used by the credential and returns both readable `valueDisplay` and API-native `itemsDisplay`.
  Existing comma-delimited production Skills normalize to the same response; Web never parses the
  provider representation. New multi-select custom-field credentials use structured items from
  inception, while scalar values are formatted by the API. New JWS credentials omit optional attributes
  with no value; existing credentials containing historical `n/a` values remain readable unchanged.
  YoID ACR issuance retains `n/a` because AnonCreds requires every declared schema attribute to have a value.
- Fixed credential headers remain outside attribute grouping. Detail attributes use API-owned presentation
  metadata and are returned in Group -> SubGroup -> SortOrder -> display-label order. Core-property
  presentation is configured through database migration; custom fields retain their existing configured
  Group, SubGroup and SortOrder. This metadata is not signed and does not create a provider schema version.
  Static metadata remains nullable; configured groups render first and an unconfigured attribute safely falls
  back to display-label order. Core and custom fields may intentionally share exact group/subgroup labels and
  one coordinated sort-order space because wallet detail returns them in one consolidated attribute list.

**Stale Linear state:** YOM-1278 remains partially complete. YOM-1280 processing-time issuance is
implemented and locally verified. Its API wallet display contract is runtime verified for grouped YoID ACR
and Opportunity JWS attributes, structured Skills and scalar formatting; custom-field rendering awaits
approved mappings.

### Shared web building blocks

Both child features build on the same components — extend these rather than adding parallel ones.

| Purpose        | File                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Models / enums | `api/models/opportunity.ts`, `api/models/myOpportunity.ts`                                                                                             |
| Services       | `api/services/opportunities.ts`, `api/services/myOpportunities.ts`                                                                                     |
| Hooks          | `hooks/useOpportunityMutations.tsx` — `useOpportunityCustomFieldDefinitionsQuery(types)`, `useMyOpportunityCustomFieldDefinitionsQuery(opportunityId)` |
| Editing        | `components/Opportunity/CustomFields.tsx` (+ `getCustomFieldError(s)`, `getCustomFieldNumberError`)                                                    |
| Read-only      | `components/Opportunity/CustomFieldsView.tsx`                                                                                                          |
| Filtering      | `components/Opportunity/CustomFieldFilters.tsx`                                                                                                        |

Credential surfaces additionally share, extracted by YOM-1282:

| Purpose                                                      | File                                       |
| ------------------------------------------------------------ | ------------------------------------------ |
| `byPresentationOrder` / `groupLabelOf` — mirror the API rule | `lib/credentials/attributePresentation.ts` |
| `SelectOption` / `SelectOptionGroup`                         | `api/models/lookups.ts`                    |

**Corrected 2026-08-18.** This originally read "YOM-1283 must order wallet attributes through
`attributePresentation`, not its own copy". The reasoning — never let two surfaces restate the
ordering rule — still holds for the two _schema-management_ surfaces, which sort client-side. It does
not apply to wallet display: `POST /ssi/wallet/user/{id}` returns the attribute collection already
ordered and group-contiguous, so YOM-1283 renders that order verbatim and sorts nothing. It shares
`groupLabelOf` for the heading rule and deliberately does not use `byPresentationOrder` — a client
comparator there would be a second source of truth over data the API has already ordered, and JS
`localeCompare` and .NET's `OrderBy` do not agree on every string pair.

### Web credential models — changed by YOM-1281, read before starting YOM-1282 / YOM-1283

`api/models/credential.ts` was brought in line with the branch API:

- `SSISchema` gained `typeContext` (null = generic) and `artifactTypeDescription`;
  `SSISchemaEntity` gained `customFields[]`; `SSISchemaType` gained `type`.
- `SSISchemaRequest` was split into `SSISchemaRequestCreate` (friendly name + optional
  `typeContext`) and `SSISchemaRequestUpdate` (**full** name + attributes only).
- **`ArtifactType.AnonCreds` was renamed `ACR`** to match the API enum, with the friendly text in
  `ARTIFACT_TYPE_LABELS`. `type` and `artifactType` come back as enum **names**
  (`"Opportunity"`, `"ACR"`), never ordinals — indexing the TS enum with the old member name
  yielded `undefined`.
- `OpportunityType` gained `displayName`. Type contexts resolve against `name`; only `displayName`
  is shown.
- Following `60a7a8b4`: `SSISchemaEntityProperty` and `SSICredentialAttribute` both gained
  `group` / `subGroup` / `sortOrder`. **YOM-1283 renders wallet headings from those**, in the order
  the API returns — never inferred from the credential payload, and never submitted anywhere.
- Changed by YOM-1283 on 2026-08-18, both verified against the running API's OpenAPI schema:
  `SSICredentialAttribute` gained `itemsDisplay` (`SSICredentialAttributeItem[] | null`) — the
  authoritative values of a complex attribute, where **`[]` and `null` mean different things** (no
  value vs. scalar) and the sibling `valueDisplay` must never be split. And `attributes` moved off
  `SSICredentialBase` onto `SSICredential`: wallet **detail** returns them, wallet **search** items
  omit the property entirely.

**All credential-schema traffic can be mocked in local development**, behind one façade —
`api/services/credentialSchemaAdmin.ts`. YOM-1281 introduced it for the admin pages, reads _and_
mutations, because publishing a provider schema cannot be undone; YOM-1282 added the Opportunity
wizard's selector on 2026-08-17 because the credential provider went offline and
`SSISchemaService.ListInternal` reaches it for every schema resolution. Nothing else consumes the
façade — wallet and credential reads (YOM-1283) are unaffected.

`SCHEMA_ADMIN_MOCK_ENABLED` is gated on `NEXT_PUBLIC_ENVIRONMENT === "local"`, so no deployed build
can serve fixtures while this code exists. Which source serves locally is a **per-session choice**,
switchable from the mocked/live control on the admin banner and the Credential step.

Two consequences to know before working on either surface: this mocks the **web only**, so
opportunity save still validates server-side through the provider and fails while it is down; and
the mock must come out before the PR — the removal list lives in
[YOM-1282's handoff](./YOM-1282-ui-opportunity-credential-schema-selection/handoffs/2026-08-17-a.md).

### Opportunity discovery design — 2026-08-27

Both preset tickets are blocked, and the custom-field expansion has put the existing opportunity
search page, filter popup and result card in question: the definitions endpoint now returns
type-conditional groups with their own Group / SubGroup / SortOrder, and the current information
architecture cannot absorb them. The discovery experience was therefore designed ahead of
implementation.

| Artefact | Location |
| --- | --- |
| Design canvas — 4 pages, 14 artboards, desktop and mobile | **Out of repo** (deliberately — too large to carry as session context). Supplied to build sessions as attached PNG exports |
| Build brief for the repo session (`IMPLEMENTATION-PROMPT.md`) | **Out of repo**, pasted as the opening message of the build session |
| Handoff | [`handoffs/2026-08-27-b.md`](./handoffs/2026-08-27-b.md) |

Canvas page 1 is [YOM-1261](./YOM-1261-ui-manage-user-presets/feature.md). Pages 2 and 3 are
[YOM-1262](./YOM-1262-ui-apply-user-presets-to-opportunity-discovery/feature.md). Page 4 — per-type
card layouts — belongs to **no ticket**: it is experimental, awaiting a client pick-or-drop, and is
explicitly excluded from the build brief's scope.

Four cross-cutting decisions from that design, recorded here because they bind more than one child
feature:

- **A new page and component tree, not a refactor.** `pages/opportunities/[[...query]].tsx`,
  `OpportunityFilterVertical.tsx` and `FilterBadges.tsx` are not to be modified. The shared building
  blocks above may be extended **additively** — new exports, no changed signatures, no behaviour
  change for existing callers. Retiring the old surface is a separate change.
- **Desktop and mobile must render one registry in one order, enforced by a test.** Both breakpoints
  consume the same section registry and the same section component; only the container and the
  control density differ. This is recorded as a rule because the first design revision claimed parity
  and did not have it, and prose did not catch that.
- **Presets stay User-domain data.** Restated from Out of Scope below because the natural
  implementation — routing preferences through the custom-field components, or extending the `User`
  model — is exactly what the epic forbids. Preferences are mocked behind one façade, following the
  `SCHEMA_ADMIN_MOCK_ENABLED` pattern documented above.
- **Nothing in the youth-facing surface is keyed to a specific custom field.** The One Rule applies
  to the new surface unchanged: the type-specific filter block renders whatever the definitions
  endpoint returns, in the order returned.

The design also closes a gap in the BA preset mapping worth flagging at epic level: four User Goals
mapped to Job, Learning, Impact Task and one Category, leaving `Event` reachable from **no goal at
all** — a preference-driven feed built on that mapping could make every event on the platform
structurally invisible. An `Attend events` goal closes it. `Other` remains unreachable and is flagged
rather than papered over. `Start a business` has no agreed mapping and ships visible but inert.

## Out of Scope (whole epic)

- **Phase-2 admin CRUD for definitions and options.** Definitions are scripted server-side in Phase 1.
- **Credential (SSI) mapping UI.** Tracked on the API side.
- **User-level custom fields.** The framework covers Opportunity and MyOpportunity only.
- **User Presets** are **User-domain data, not custom fields** — YOM-1261 / YOM-1262 must not be
  built through the custom-field components, and they are blocked on YOM-1264 + YOM-1257 / YOM-1258.
- **Opportunity taxonomy migration** (YOM-1259) — an Opportunity-domain lookup.

## Blockers

| Blocker                                                             | Severity | Note                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| YOM-1264 (BA/design) — final field definitions and User Presets     | High     | Everything shipped so far runs on seeded `[Sample] …` definitions                                                                                                                                                                                                                                                                                                                                   |
| YOM-1257 / YOM-1258 (presets API)                                   | High     | YOM-1261 / YOM-1262 are **designed** (2026-08-27) but cannot be implemented — no preset model and no preset→filter mapping to build against                                                                                                                                                                                                                                                                                                                                                                    |
| YOM-1260 must land before the presets chain                         | Med      | Presets resolve to filter criteria                                                                                                                                                                                                                                                                                                                                                                  |
| Credential provider (Aries CloudAPI) — schema create/update failing | Med      | **Narrowed 2026-08-18** (Jason): reads are serving again, so `GET /ssi/schema` and wallet retrieval work — YOM-1283 was verified live on that basis. Only schema **create/update** still fails, which is the one thing keeping YOM-1281 and YOM-1282 in review: YOM-1281 cannot exercise its mutations, and YOM-1282 cannot reach one real type-specific schema. Both stay mocked locally meanwhile |

## Cross-Area Notes

Web consumes the API contract above verbatim. Anything that changes definition discovery, the
value shape, replacement semantics or the filter clause shape is a **breaking change for web** —
flag it in a handoff here before merging.

**Discovery-surface asks for Adrian (2026-08-27, from the YOM-1261/1262 build — details in
[`handoffs/2026-08-27-c.md`](./handoffs/2026-08-27-c.md)):**

1. `/opportunity/search` ordering: `OrderInstructions` is internal (always DateCreated desc), so
   the designed *Ending soonest* / *Most ZLTO* sorts ship disabled. Ask: a public sort enum.
2. The commitment **interval** filter excludes opportunities with no commitment set; the BA preset
   sheet says they must be **included**. One of the two has to move.
3. `TotalCountOnly` is internal — the web live count fetches `pageSize: 1` instead. Nice-to-have.
4. `ApplyUserPresets` is stubbed on the filter; confirm YOM-1258 makes it the real preset→filter
   path so web can retire its client-side mapping.
