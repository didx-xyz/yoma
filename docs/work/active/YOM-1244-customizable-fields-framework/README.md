# Epic: YOM-1244 — Yoma Customizable Fields / Metadata Framework

## Meta

- **Epic**: [YOM-1244](https://linear.app/didx/issue/YOM-1244)
- **Owners**: Adrian (api) · Jason (web)
- **Areas**: api, web
- **Status**: in-progress
- **Started**: 2026-07-08 (api), 2026-07-21 (web)
- **Branch**: `feature/cf-implementation` — fresh from origin/master on 2026-09-22.
  The original framework has merged; older branch-only notes below are historical.

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

**Current search/preference contract (2026-10-01):** the [consolidated API handoff](./handoffs/2026-10-01-c.md) records the agreed decisions for asks 1–24, exact request shapes/defaults and test evidence. It supersedes the historical search/preference-cardinality notes below. The API implementation was committed as `77646a74`; Web has moved to the same breaking shapes. Deploy API and Web together. Web continues to own preference composition and skips.

**Web moved onto this contract on 2026-10-03** (on top of `77646a74`): every search caller, discovery's composition with provenance, and the visible changes. See the [YOM-1262 handoff](./YOM-1262-ui-apply-user-presets-to-opportunity-discovery/handoffs/2026-10-03-a.md). The branch now works only against an API on `77646a74` or later. For the BA and testers, the [testing guide](./testing/2026-10-03-discovery-testing-guide.md) explains the search, preferences, filters, details and admin changes in plain words. It has 68 tests and lists the decisions awaiting BA confirmation (TBC).

| [YOM-1259 taxonomy implementation](./YOM-1259-api-update-the-opportunity-category-lookup-to-the-new-taxonomy/feature.md) | API / Adrian | in-progress |
| --- | --- | --- |

Taxonomy CSV imports accept final names only; partner-specific vocabulary is handled separately.

The shared Engagement Type lookup now has enum-compatible keys `Remote`, `OnSite`, `Hybrid` and display names `Remote`, `On-site`, `Hybrid`. Existing lookup IDs and Opportunity associations are retained. CSV import/export and the ordinary lookup service use canonical names only. Each partner with an engagement field explicitly maps its legacy wire values `Online`/`Offline` to `Remote`/`OnSite` before lookup resolution; this does not make them CSV aliases. User engagement preference is now multi-select (`engagementTypes`), retaining any previous scalar choice through a forward migration. Opportunity engagement remains single-select; discovery accepts multiple alternatives. Hybrid is distinct from selecting both Remote and On-site.

The User preference formerly proposed as `PaidWorkPreference` is nullable `UserPreferences.Incentivized` and applies to every Opportunity type. This means a preference for any incentive, not only wages or cash. Opportunity now uses `Incentivized`, with Reward Type describing the incentive. Web supplies the effective criterion; an inclusive root incentive criterion ranks explicit matches before unknowns. Preferences are a one-to-one User-owned table, with category, accessibility, engagement and language selections in preference-owned link tables; skills remain in UserSkills. The self-service API uses `categories` and `languages` under UserPreferences, not User or UserProfile fields.

Entrepreneurship is now a Yoma Opportunity type, based on Mpho's later confirmation rather than the credential deck's earlier partner-direct draft. Its programme metadata and individual venture outcomes use separate Opportunity/MyOpportunity CF definitions. Core incentive and commitment are optional for this type. It selects `Opportunity|Default` until the type-specific credential/schema phase; see the [API handoff](YOM-1254-api-custom-fields-framework-for-opportunity-and-myopportunity/handoffs/2026-09-29-b.md) before Web integration or credential mapping. Web integrated it on 2026-10-01 ([handoff](handoffs/2026-10-01-b.md)): the editor mirrors the optional effort and the unanswered incentive, the programme Other ↔ description rule is in `customFieldRules.ts`, and the "Start a business" goal now maps to this type.

| Folder                                                                                                                                                           | Ticket                                             | Area | Status                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---- | ------------------------------------------------------------------------------------- |
| [`YOM-1254-api-custom-fields-framework-for-opportunity-and-myopportunity/`](./YOM-1254-api-custom-fields-framework-for-opportunity-and-myopportunity/feature.md) | [YOM-1254](https://linear.app/didx/issue/YOM-1254) | api  | in-progress                                                                           |
| [`YOM-1257-api-extend-the-user-model-with-user-presets/`](./YOM-1257-api-extend-the-user-model-with-user-presets/feature.md)                         | [YOM-1257](https://linear.app/didx/issue/YOM-1257) | api  | in-progress                                                                           |
| [`YOM-1255-ui-dynamic-custom-fields-for-opportunities-and-completions/`](./YOM-1255-ui-dynamic-custom-fields-for-opportunities-and-completions/feature.md)       | [YOM-1255](https://linear.app/didx/issue/YOM-1255) | web  | in-progress                                                                           |
| [`YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/`](./YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/feature.md)     | [YOM-1260](https://linear.app/didx/issue/YOM-1260) | web  | in-progress                                                                           |
| [`YOM-1261-ui-manage-user-presets/`](./YOM-1261-ui-manage-user-presets/feature.md)                                                                               | [YOM-1261](https://linear.app/didx/issue/YOM-1261) | web  | in-progress — live on the preferences API (2026-09-29)                                |
| [`YOM-1262-ui-apply-user-presets-to-opportunity-discovery/`](./YOM-1262-ui-apply-user-presets-to-opportunity-discovery/feature.md)                               | [YOM-1262](https://linear.app/didx/issue/YOM-1262) | web  | in-progress — live preferences, location and core facets (2026-09-29)                |
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
| [YOM-1258](https://linear.app/didx/issue/YOM-1258)                                                      | api       | **Superseded by YOM-1262** (PM, 2026-09-30): Web composes effective filters; API executes them. No API work remains. |

Job opportunity skills represent role requirements, not evidence of attainment. Completing a Job must not award those skills as Verified; the CF branch now enforces this centrally, and the same fix requires a separate Production hotfix before CF ships.

### User preset foundations — Education (2026-09-28)

User location extends the existing profile country. User/profile upsert requests carry flat `region`, `city`, `coordinates` and `locationSource` fields; User and UserProfile responses return them. There is no standalone location endpoint. Shared UserRequestValidatorBase validates these core fields through the injected CoordinatesValidator. Save through the complete `PATCH /api/v3/user` profile payload, including required profile fields; omitted/null optional location values clear them. Internal user upserts assign them directly inside the existing new/unlinked-user guard, and ToUserRequest copies them when constructing an update from a stored user. Country remains the existing parent field; source uses Lookup, Device or Manual. Coordinates are `[longitude, latitude]`, the city centre without elevation, stored in one nullable PostGIS geography(point,4326) column. No provider place ID is persisted. Country identity synchronization is unchanged; location remains Yoma-only and preferences stay separate. Refresh the cached profile from the save response and clear/reselect location when changing country. See the [current user/profile handover](YOM-1257-api-extend-the-user-model-with-user-presets/handoffs/2026-09-28-a.md). Opportunity location/search remains covered by YOM-1254.

- [x] Keep the existing optional `User.EducationId` / `UserProfile.EducationId`; no new user column.
- [x] Expand the controlled Education lookup to eleven values, retaining all five existing IDs and mapping the old tertiary row to "Tertiary (Qualification not specified)"; new qualifications use "Tertiary - …".
- [x] Align both Keycloak realm-export Education option lists with the lookup.
- [ ] Robbie: prepare and execute the Stage and Production Keycloak DB changes in the [SRE deployment handover](handoffs/2026-09-28-sre.md) when the CF release reaches each environment. The Yoma database migration does not rewrite Keycloak user values, and existing realms do not automatically reimport changed exports.
- [x] Reuse the Education lookup for Job Minimum Qualification. Generic CF lookup types now include Education and Currency; API values/filter selections use lookup IDs, while CSV resolves Education names and Currency codes. No qualification eligibility gate is added. See the [Job integration handover](YOM-1254-api-custom-fields-framework-for-opportunity-and-myopportunity/handoffs/2026-09-28-a.md#job-specific-custom-fields) for Jason's capture/filter work.

### Why each child exists

| Ticket   | Purpose                                                                                   |
| -------- | ----------------------------------------------------------------------------------------- |
| YOM-1254 | Provide the API metadata/value framework shared by Opportunities and completions.         |
| YOM-1255 | Let Web render, capture and display configured fields without hardcoding them.            |
| YOM-1260 | Let youth/admins filter using configured fields.                                          |
| YOM-1257 | Store reusable youth Opportunity-discovery presets.                                       |
| YOM-1258 | Superseded by YOM-1262 (PM, 2026-09-30) — Web composes saved preferences into search criteria. |
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

**The framework and UI remain metadata-driven.** Every surface renders the definitions,
options, groups and ordering returned by the API; do not hardcode a field-specific control.

**Grouping decision (2026-10-05):** Web owns the overarching opportunity-type heading;
the configured CF sections use one metadata-driven `group` level with null `subGroup`.
This does not permit hardcoded field controls or field/option labels.

Domain rules and partner mappings may depend on explicitly protected CF contracts.
Use shared constants for the stable keys they reference, and an enum only for values
code actually selects or interprets. Resolve options through the common CF extensions;
never compare display labels in business logic. Set `IsSystem` when such a dependency
exists, not merely because a definition was seeded. Ordinary CFs remain configurable.
Tests must verify these contracts against the seeded metadata.

Seeds reuse existing enums and constants (including Opportunity Type and CF data/entity
types); ordinary seed-only labels/values remain literals. Persisted enum/key
renames require an explicit migration. The obsolete sample helper has been removed;
approved definitions are now being added to the consolidated CF configuration migration.

## Release kill-switch — read before touching any web surface

> **Updated 2026-09-29: the flag is `true` for the whole branch** (Jason). Cash-out has shipped
> from `master`, and the API now makes the framework mandatory: every opportunity type has a
> REQUIRED Difficulty custom field (Jobs many more), so with the flag `false` the editor sends no
> custom fields and every manual create / update is rejected. Setting it back to `false` breaks
> opportunity saving. `/opportunities/discover` and "My preferences" are reachable again; the two
> points below about the September release are history. The preference mock it gated is gone.

> **Added 2026-10-01: the flag also picks the opportunity DETAIL layout** (Jason). It's on, so
> `/opportunities/{id}`, `/organisations/{org}/opportunities/{id}/info` and the editor's step-8
> Preview render the round-7 tabbed layout (`components/Opportunity/TabbedDetails/`). Off, all
> three fall back to the classic two-column layout, untouched.
>
> The chokepoints are:
> - `OpportunityPublicDetails`'s default `layout` (public page and Preview);
> - the page component in `info.tsx`.
>
> The temporary `…/experimental` routes are gone.

**`CUSTOM_FIELDS_ENABLED` in `src/web/src/lib/constants.ts` was `false`** (2026-09-16 → 09-29).
The branch ships a release _without_ this framework, so cash-out can go out while the framework
waits on YOM-1264, YOM-1257/1258, and a live pass over credential schema create/update. Flip it to
`true` to restore everything — nothing else needs changing, though it is a build-time constant, so
it needs a rebuild rather than an env change.

**The discovery redesign must not go live in this release.** It is off by the same flag, not by a
separate one: `/opportunities/discover` 404s and its user-menu link is hidden. Cash-out is the only
thing this release adds on top of `master`.

It is wired at **chokepoints, not per surface**: both custom-field definition queries and the
discovery `useTypeDefinitions` loop are disabled at source, and because every consumer already
rendered nothing on an empty definition set, the whole UI collapses on its own. The two mock
façades (`SCHEMA_ADMIN_MOCK_ENABLED`, `USER_PREFERENCES_MOCK_ENABLED`) are gated on it too, so no
fixture or dev panel can serve — including on `dev.yoma.world`, the one place a mock reached a
deployed build.

**`/opportunities/discover` goes off entirely** — it is the preset-driven prototype, so the page
404s and the user menu's "My preferences" link is hidden with it. `/opportunities` is untouched and
remains the discovery surface for this release.

Two things it does **not** do, both of which have bitten already — see the
[handoff](./handoffs/2026-09-16-a.md) for detail:

- **It does not protect stored custom-field values.** The save paths reconcile against the loaded
  definitions, so with none loaded they submit an empty collection into a replacement-mode upsert.
  On any environment that still has definitions and values seeded, editing an opportunity or
  completion through the web deletes them.
- **It does not remove the mocks.** They are still in the tree and still owed their removal before
  the framework's own PR.

When adding a gate: never write `...(CUSTOM_FIELDS_ENABLED ? [x] : [])` at module scope. It
type-checks and compiles, then fails the production build with a bare-identifier `ReferenceError`.

## Shared API Contract

**Presentation / selected lookup update (2026-10-05):** all 39 configured CFs now use one `group` level and null `subGroup`; Web owns the overarching type heading. Dedicated `POST /api/v3/lookup/skill/ids` resolves a non-empty JSON array of skill IDs and returns all matches without pagination or an application-level ID-count limit. Existing `GET /api/v3/lookup/skill` remains paged name search/catalogue browsing, without an IDs criterion. Other CF reference lists (Country, Language, Education, Currency) are complete, unpaged lists; inline options expose keys/names in their definition. The original development seed migration was edited, so Jason must recreate Local after pulling. The [consolidated review handoff](YOM-1254-api-custom-fields-framework-for-opportunity-and-myopportunity/handoffs/2026-10-05-a.md) records the exact contract, reset warning and seven confirmed decisions; Opportunity search behavior remains unchanged. Contextual reference/search-criteria endpoints are a later enhancement, not batched counts.

### Opportunity core metadata (2026-09-28)

Provider through SDGs are implemented as core fields, not custom-field values. The
[consolidated API handover](YOM-1254-api-custom-fields-framework-for-opportunity-and-myopportunity/handoffs/2026-09-28-a.md#core-metadata)
defines Jason's request/response and reference endpoints, incentive/accessibility rules,
CSV/partner mappings and the explicit filter semantics. Age is checked only when
submitting for verification; browsing and finalization of accepted submissions are not
blocked by age. Difficulty, final CF configurations and preference-to-search mappings
remain separate work. Currency, targeting and SDG vocabularies are shared lookups;
opportunity associations and business rules remain opportunity-domain concerns.

Verified against a running API on `feature/custom-fields-framework` — **the ticket
descriptions on YOM-1244 are stale and should not be trusted over this table.**

| Fact                 | Detail                                                                                                                                                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Definition discovery | `GET /opportunity/custom/field/definition?types={Type}` (anonymous, repeatable `types`), `GET /opportunity/{id}/custom/field/definition` (admin / org admin), `GET /myopportunity/{opportunityId}/custom/field/definition` (user)                                                  |
| `types` binding      | the **`Type` enum name** (`Other` / `Learning` / `Event` / `Job` / `Task`), **not** the type GUID. Passing a GUID silently returns only the generic definitions                                                                                                                    |
| Definition shape     | `key`, `title`, `description`, `group`, `subGroup`, `dataType`, `lookupType`, `validationRegex`, `isRequired`, `supportsMultiple`, `sortOrder`, `options[]`. `lookupType` **exists** (`Country` / `Language` / `Skill`; `null` → inline `options`); `defaultValue` was **removed**. `validationRegex` is **.NET syntax** — web translates the `\A` / `\z` / `\Z` anchors (`toEcmaScriptPattern`, 2026-09-30; ask 22) |
| Data types           | `String`, `Integer`, `Decimal`, `Boolean`, `Date` (`yyyy-MM-dd`, no UTC — 2026-09-29), `DateTime`, `Option`                                                                                                                                                                                                           |
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
| CF rules       | `lib/customFields/customFieldRules.ts` — mirrors the API's `AssertCrossFieldRules` (Job salary / employment, Impact Action tools, Entrepreneurship programme) on its SYSTEM keys only; inert without them |
| Places         | `components/Location/LocationInput.tsx` (youth + admin), `components/Opportunity/Admin/OpportunityCountryPlaces.tsx`; wire forms in `api/models/location.ts` |
| Search payload | `toSearchFilterPayload(input, endpoint)` (`api/services/opportunitySearchPayload.ts`, 2026-10-03): wraps flat legacy and admin filters with no mode, and passes discovery's typed request through untouched. Discovery builds its request in `features/discovery/lib/searchRequest.ts` |

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

| Artefact                                                      | Location                                                                                                                   |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Design canvas — 4 pages, 14 artboards, desktop and mobile     | **Out of repo** (deliberately — too large to carry as session context). Supplied to build sessions as attached PNG exports |
| Build brief for the repo session (`IMPLEMENTATION-PROMPT.md`) | **Out of repo**, pasted as the opening message of the build session                                                        |
| Handoff                                                       | [`handoffs/2026-08-27-b.md`](./handoffs/2026-08-27-b.md)                                                                   |

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
- **Presets stay User-domain data.** The earlier design note ruling out extension of `User` was
  superseded by the 2026-09-28 YOM-1257 decision: stable single-select values live on `User`,
  multi-select values use User-owned link tables, and preferences have dedicated authenticated
  GET/PATCH endpoints. They do not route through custom-field components or the frequently
  loaded and UI-cached youth profile response; the existing admin User model exposes its fields.
  The web mock remains behind its existing façade until wired to this API.
- **Nothing in the youth-facing surface is keyed to a specific custom field.** The One Rule applies
  to the new surface unchanged: the type-specific filter block renders whatever the definitions
  endpoint returns, in the order returned.

The design also closes a gap in the BA preset mapping worth flagging at epic level: four User Goals
mapped to Job, Learning, the `ImpactAction` type and one Category, leaving `Event` reachable from **no goal at
all** — a preference-driven feed built on that mapping could make every event on the platform
structurally invisible. An `Attend events` goal closes it. `Other` remains unreachable and is flagged
rather than papered over. `Start a business` has no agreed mapping and ships visible but inert.

**Updated 2026-09-22 (BA sign-off + client review of the revised canvas).** `Start a business` now
has a BA mapping — Opportunity Category "Business, Finance & Marketing" (a category, not a type) —
and is selectable; web resolves the category by name at runtime against the lookup, accepting the
pre-migration "Business and Entrepreneurship" until YOM-1259 lands everywhere. `Attend events`
remains a design proposal **awaiting BA confirmation**; it stays selectable and mapped to `Event`
because the alternative is the structural invisibility above. Detail and the other decisions of
that review are in
[YOM-1262's feature doc](./YOM-1262-ui-apply-user-presets-to-opportunity-discovery/feature.md),
Decisions 2026-09-22.

**Historical Web state before the search revision (2026-10-01, Jason).** `Start a business` maps to the new **Entrepreneurship Opportunity
type**, not the Category. The BA's Category mapping predates the type (API, 2026-09-29), so this
**departs from the signed-off sheet and needs BA confirmation**. Reverting is one line in
`preferenceMapping.ts`. Every goal now maps to a Type; the by-name category path is removed.

**Agreed replacement (2026-10-01, Adrian):** Start a business maps to Entrepreneurship type **OR** Business, Finance & Marketing category so related Learning opportunities remain discoverable. Web composes a generic OR group using stable lookup IDs; skipping the goal removes that group. The API does not hardcode the goal mapping. See the [current handoff](./handoffs/2026-10-01-c.md#web-composition-and-binding--jason).

## Out of Scope (whole epic)

- **Phase-2 admin CRUD for definitions and options.** Definitions are scripted server-side in Phase 1.
- **Credential (SSI) mapping UI.** Tracked on the API side.
- **User-level custom fields.** The framework covers Opportunity and MyOpportunity only.
- **User Presets** are **User-domain data, not custom fields** — YOM-1261 / YOM-1262 must not be
  built through the custom-field components. The Web maps saved preferences to ordinary Opportunity filter criteria; the API does not load preferences during search.
- **Opportunity taxonomy migration** (YOM-1259) — an Opportunity-domain lookup.

## Blockers

| Blocker                                                             | Severity | Note                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| YOM-1264 (BA/design) — final field definitions and User Presets     | High     | Everything shipped so far runs on seeded `[Sample] …` definitions                                                                                                                                                                                                                                                                                                                                   |
| YOM-1257 (preferences API)                                          | Med      | Preferences storage and self-service endpoints exist. Jason's prototype still uses a mock façade; Web must wire it to the live contract and send the effective filter request. API-side preset mapping (YOM-1258) is no longer required — superseded by YOM-1262 (PM, 2026-09-30).                                                                                                                                                    |
| YOM-1260 must land before the presets chain                         | Med      | Presets resolve to filter criteria                                                                                                                                                                                                                                                                                                                                                                  |
| Credential provider (Aries CloudAPI) — schema create/update failing | Med      | **Narrowed 2026-08-18** (Jason): reads are serving again, so `GET /ssi/schema` and wallet retrieval work — YOM-1283 was verified live on that basis. Only schema **create/update** still fails, which is the one thing keeping YOM-1281 and YOM-1282 in review: YOM-1281 cannot exercise its mutations, and YOM-1282 cannot reach one real type-specific schema. Both stay mocked locally meanwhile |

## Cross-Area Notes

**Final country/location contract (2026-09-28):** [API handover for Jason](./YOM-1254-api-custom-fields-framework-for-opportunity-and-myopportunity/handoffs/2026-09-28-a.md#country-and-location). Country write/search collections now contain country-scoped objects, with one optional location per country; text and radius filtering run in the database. This supersedes the prototype location asks below. User coordinate storage is PostGIS, not the earlier JSONB design, without a user wire-contract change. [SRE rollout handover](./handoffs/2026-09-28-sre.md) covers PostGIS and Keycloak; Dev provisioning remains outstanding with Robbie, Stage/Prod fixed per Adrian.

**Cash-out-first release (2026-09-15):** temporary CF seeding is disabled in the consolidated migration; the sample helper remains for reference. Fresh deployments receive no CF definitions/options. Jason must hide the CF UI for this release. Existing Local/Dev samples remain until reset or separately cleaned; this edit does not delete persisted data. Approved definitions will require a new migration once this migration has shipped.

**Migration sequence consolidated (2026-09-15):** the undeployed CF/Treasury/Payout, SSI and payout
notification-setting migrations now form `20260915100000_ApplicationDb_Custom_Fields_Treasury_Payout_SSI`.
The participant-count repair stays separate as `20260915100001_ApplicationDb_Opportunity_ParticipantCount_Reconcile`.
All 66 Stage/Production migration IDs remain untouched. Local/Dev must be reset by Adrian before using
the new sequence. [Migration mapping and deployment notes](./handoffs/2026-09-15-a.md).
Executed clean-install, populated-upgrade, original-versus-consolidated comparison, repair guards and
rollback/reapply checks passed; see [Docker validation results](./handoffs/2026-09-15-b.md).

**CF release gate — participant counts (2026-09-07):** ship the existing CSV transaction/EF-state fixes together with `20260915100001_ApplicationDb_Opportunity_ParticipantCount_Reconcile`. Pause completion/import writers while migrating (transactional table locks use `NOWAIT`), then audit participant counts and recorded ZLTO totals. The migration changes participant counts only. Adrian repaired production manually and reported a clean audit; monthly/manual post-import reconciliation remains necessary until the code fix is deployed. Disable the monthly reminder after successful CF production validation. Details: [API handoff](./YOM-1254-api-custom-fields-framework-for-opportunity-and-myopportunity/handoffs/2026-09-07-a.md). No Web contract changes.

Web consumes the API contract above verbatim. Anything that changes definition discovery, the
value shape, replacement semantics or the filter clause shape is a **breaking change for web** —
flag it in a handoff here before merging.

**Discovery-surface asks for Adrian (2026-08-27, from the YOM-1261/1262 build — details in
[`handoffs/2026-08-27-c.md`](./handoffs/2026-08-27-c.md)):**

The following is the historical ask log, not the current API contract. The [2026-10-01 disposition table](./handoffs/2026-10-01-c.md#original-asks-124--disposition) lists every ask in numeric order, including intentionally unchanged items and Web responsibilities.

1. `/opportunity/search` ordering: `OrderInstructions` is internal (always DateCreated desc), so
   the designed _Ending soonest_ / _Most ZLTO_ sorts ship disabled. Ask: a public sort enum.
2. The commitment **interval** filter excludes opportunities with no commitment set; the BA preset
   sheet says they must be **included**. One of the two has to move.
3. **Resolved 2026-09-29:** public `TotalCountOnly` uses the same search predicates and returns `totalCount` with no items; pagination is optional. Web can replace its `pageSize: 1` live-count request.
4. **Superseded 2026-09-29:** the API-side `ApplyUserPresets` stub is removed. Web owns preference inheritance, skips and overrides and sends the effective criteria to the ordinary Opportunity search API. The API executes all core and CF filters, including count-only searches.

**Added 2026-09-05** (from the discovery refinement round — details in
[`handoffs/2026-09-05-a.md`](./handoffs/2026-09-05-a.md)):

5. **A custom-field definition should say which type owns it.** `GET
/opportunity/custom/field/definition?types={Type}` returns the generic definitions plus that
   type's own, with nothing distinguishing them, so a youth selecting two types was shown the
   generic set twice. Web now infers it by intersecting the keys returned for each selected type
   and renders the intersection once — correct in practice, but inference: a definition that is
   type-specific to two selected types is indistinguishable from a generic one. A flag or a
   `types[]` on the definition would make it exact.
6. **Category facet counts** come back as the grand total for every category on local data
   (a fixture artefact — every seeded opportunity is in all ten). Worth confirming against DEV
   data; if the counts are genuinely total-only, they have to come off the category tiles.

**Added 2026-09-22** (from the BA sign-off / client-review pass on YOM-1262 — details in
[`YOM-1262 …/handoffs/2026-09-23-a.md`](./YOM-1262-ui-apply-user-presets-to-opportunity-discovery/handoffs/2026-09-23-a.md)).
Reference-data and behaviour changes the discovery surface is built to absorb without code once
the API ships them; until then web states the actual behaviour in copy:

7. **Opportunity Type `ImpactAction`, displayed as "Impact Action".** Adrian confirmed the final
   name on 2026-09-28, superseding the workbook's "Impact Task" wording. Rename the lookup `Name`
   and enum together while retaining its existing ID. No Task-specific custom fields or schemas
   have been seeded, so this migration has no associated context rows to update.
   CSV imports use `ImpactAction`; IXO's "Impact Action" wire value maps to that enum.
   Web renders `displayName` verbatim and has
   deliberately NOT added a display map — the row currently reads "Task" on local and DEV because
   the seed sets `DisplayName = Name`.
8. **Engagement Type value rename, IDs preserved** — Remote (was Online), On-site (was Offline),
   Hybrid unchanged (BA sheet, all types). Web carries a one-module display map
   (`features/discovery/lib/engagementLabels.ts`) that becomes identity once the lookup renames;
   delete it then.
9. **Engagement filter null rule.** BA: opportunities with no engagement type are **hidden while
   the filter is set**. The search currently does the opposite (`!o.EngagementTypeId.HasValue ||
   …` in `OpportunityService`). Web cannot enforce this client-side (server paging), so the
   section copy states the current behaviour. Ask #2 (commitment interval must **include** nulls)
   still stands — together they are the two null rules where web and BA disagree with the API.
10. **`Is Paid` null handling: keep in results, sort last** (BA sheet, User + All Opportunities).
    Depends on the field existing and on a public sort (ask #1). The results page's "Pay not
    specified" divider is designed but not built until both land.
11. **Category facet counts on DEV are also grand totals** (verified 2026-09-23:
    `/opportunity/search/filter/category` returns ~1 000 for every one of the ten old-taxonomy
    categories; local returns 2 488 for every one of the new sixteen). Same fixture artefact as
    #6 — every seeded opportunity carries every category. Not a code fault, but the tiles cannot
    be judged until one environment has real category spread.
12. **Search `PublishedState.Active` ignores `DateEnd`.** It checks `StatusId = Active` and
    `DateStart <= now`, so an opportunity whose end date has passed keeps returning until the
    expiry job flips its status. On seeded data that is every item (local fixtures all end
    2026-09-21; DEV's all end 2026-09-23), which is why every card read "Closed". Web now derives
    "Closed" from status OR end date and hides places on a closed card. Ask, low priority: either
    exclude `DateEnd < now` from the Active published state, or seed fixtures with rolling future
    end dates so the preview does not go stale overnight.
13. **Performance suggestion, not a blocker — batched facet counts.** The design shows a live
    count per quick-search badge and greys a badge that would return zero. Web will not issue one
    search request per badge (Jason, 2026-09-23), so badges carry no count. A single endpoint that
    returns counts for N filter sets in one round trip (or `TotalCountOnly` made public, ask #3,
    plus batching) would make both the badge counts and the wizard's live count cheaper.

**Added 2026-09-28** (User Location, built on YOM-1262 against a mock — details in
[`YOM-1262 …/handoffs/2026-09-28-a.md`](./YOM-1262-ui-apply-user-presets-to-opportunity-discovery/handoffs/2026-09-28-a.md)).
The web side is built to an ASSUMED contract; please confirm or correct:

14. **User location.** Country stays `User.countryId` (profile PATCH, unchanged). Region, city and
    coordinates go through the new user-location PATCH and come back on the profile response.
    Web holds `{ countryId, region, city, coordinates: { latitude, longitude }, source, placeId }`;
    it would like the API to store at least `region`, `city`, `latitude`, `longitude` and the
    country they were picked under (so a later profile-country change can mark them stale).
    Names are English (Google Places / Geocoder, `language=en`) unless typed by hand.
    Coordinates are the **city centroid**, never a device fix.
15. **Location search filter.** Web will send region and city (single values, "contains",
    case-insensitive) only with exactly one country, and distance as a point + radius in km
    (10 / 25 / 50 / 100). **Null rule (Jason, 2026-09-28): opportunities with no region / city
    are included.** Distance with a point should replace the region / city match, not add to it.
    Until this exists, `LOCATION_SEARCH_LIVE = false` keeps all three out of the request.
16. **Opportunity coordinates** — distance needs them on opportunities, or at least a centroid per
    opportunity city. Without them "Jobs near me" can only ever be a city match.

> **Status 2026-09-29:** 7 and 8 are resolved by the API (web renders `displayName`; the engagement
> map is deleted). 10 became `incentivized` (explicit, nullable) — wired; "sorted last" still waits
> on ask 1. 14–16 are resolved by Adrian's final contract (place on the profile, nested
> per-country search, coordinates on opportunity countries) — wired and verified locally; the
> admin editor now captures a place per country. 3 (count-only) and 4 (preset flag) were closed by
> Adrian later the same day (`098e8ece`) — the live count uses `totalCountOnly`. 1, 2, 5, 6, 9, 12
> and 13 still stand.

**Added 2026-09-29** (API integration session — details in
[`handoffs/2026-09-29-a.md`](./handoffs/2026-09-29-a.md)):

17. **Engagement preference cardinality.** The BA asked for a multi-select engagement preference
    (2026-09-22); `UserPreferences.EngagementTypeId` stores one. Web is single-select again to
    match. Either make it a list or confirm single with the BA.
18. **Accommodations filter vs the BA null rule.** `accommodations` needs ALL picked and EXCLUDES
    opportunities that list none; the BA rule is "stays in results for now". So the youth's saved
    accessibility requirements are NOT inherited into discovery (it would hide nearly the whole
    feed). An include-unspecified option would let web apply them.
19. **Goal → filter mapping (YOM-1258).** `/user/goal` carries no mapping, so web maps goals to a
    Type or Category by NAME ("Get a job" → Job, "Start a business" → category "Business, Finance
    & Marketing"). A type / category reference on the goal lookup would make it exact.
20. **"Or unspecified" filters that cannot narrow on today's data.** `provider`, `targetedGroups`,
    `sustainableDevelopmentGoals` and `accessibilitySupport` all keep unspecified opportunities,
    and almost none are specified, so the Provider and SDG sections (and the parked
    "With accommodations" / "Climate action + SDG 13" badges) barely change results. Confirm this
    is intended; an "only specified" switch would make them useful before the data fills in.
21. **Local seed coverage.** `post.sql` leaves Boolean and lookup-backed required Job fields
    (`jobSalaryDisclosed`, `jobMinimumQualification`) empty — by design — so every seeded Job
    needs them filled before an admin save succeeds; and no seeded opportunity carries a place,
    coordinates, provider, SDGs, accommodations or age bounds, so distance and the new facets
    cannot be exercised on local data. A few seeded examples would make the preview testable.
    **Also (2026-09-30):** seeded Impact Actions leave the required `impactActionDifficulty`
    empty (same save block), and none carries `impactActionToolsRequired`, so the Tools filter
    returns 0 locally.

**Added 2026-09-30** (local browser pass — [`handoffs/2026-09-30-a.md`](./handoffs/2026-09-30-a.md)):

22. **Definition regexes use .NET-only anchors.** `impactActionToolsOtherDescription`
    (`\A[\s\S]{1,500}\z`) and `impactActionImpactAchieved` (`\A[\s\S]{1,1000}\z`). In
    JavaScript `\A` / `\z` match a literal "A" / "z", so the web rejected every normal value
    until it started translating them (2026-09-30). Either keep definition patterns to the shared
    subset (`^…$` means the same for these two), or confirm `validationRegex` is .NET syntax by
    contract — web now assumes the latter.

> **Decision 2026-09-30 (Jason): the API takes priority for now on asks 17–22.** Web keeps the
> behaviour it built against today's contract — single engagement preference, accessibility
> requirements saved but not applied, goals mapped by name, "or unspecified" filters as the API
> defines them, the anchor translation — and does not wait on answers. Adrian: answer or schedule
> at your pace; each ask names what web would change. **YOM-1258 is superseded by YOM-1262 (PM).**

**Added 2026-10-01** (Entrepreneurship integration — [`handoffs/2026-10-01-b.md`](./handoffs/2026-10-01-b.md)):

23. **The completions CSV sample has no `CF:` prefix on its custom-field headers.**
    `src/api/src/other/MyOpportunityInfoCsvImport_Sample.csv` (from `35da1e0b`) has bare
    `jobEmploymentStartDate,impactActionImpactAchieved,eventRole` headers.
    `CSVImportHelper.ValidateHeader` rejects any column that is neither a model column nor
    `CF:`-prefixed, so the sample as shipped should fail on its header. This was found by
    reading the code, not by running an import. Web fixed its own copy (`public/docs/…`) and the
    help text on 2026-10-01; the API copy is yours. The Entrepreneurship completion columns are
    in the web help, but in neither sample.
24. **A Job with no effort cannot be completed through the web form.** The form sends no start
    date or commitment. `PerformActionSendForVerificationApplyDefaults` defaults the commitment
    only from the opportunity, and a Job's effort is optional, so it may have none.
    `RequiresParticipationPeriod` now exempts only Entrepreneurship, so that submission should
    fail with "Start date is required when the commitment interval…". Either exempt Jobs too, or
    tell web to collect a start date for them. Not reproduced: the session had no signed-in API
    access.

**Adrian, one API-side conflict resolution on this branch (2026-09-05)** — flagged because it is
your area and web did not author either side. Merging `master` into
`feature/custom-fields-framework` (PR #1924) collided on `Opportunity.Type`: master had added
`Task` for IXO impact actions (#1925 / #1926) while this branch had already added `Event` and
`Task` with the custom-fields work. Resolved to the union — `Other, Learning, Event, Job, Task`,
which is this branch's member list unchanged. Safe because the enum resolves by NAME against the
static lookup table (`Enum.Parse<Type>(entity.Opportunity.Type.Name)`), so nothing is keyed to the
ordinal. Master's IXO client change auto-merged and still compiles: it maps "Impact Action" onto
`Type.Task`, which survives in the merged enum. `dotnet build Yoma.Core.sln` is clean.
This records the 2026-09-03 merge state; the 2026-09-28 CF change above subsequently renames
the enum and lookup Name to `ImpactAction` while retaining the same lookup ID.

**DEV environment skew (found 2026-09-03, affects anyone previewing this branch):**
`/opportunity/search` on `v3api.dev.yoma.world` fails with `42703: column
o.YomaRewardPoolCurrentFinancialYear does not exist` (also `o.YomaReward`). Verified cause: the
DEV database has had this branch's migration
`20260806191303_ApplicationDb_Custom_Fields_Treasury_Payout` applied — it **drops** the
Yoma-reward columns — while the pods behind `v3api.dev` are serving a **master-model build**
whose EF model still maps them (the branch-only definitions endpoint 404s there; web at
`dev.yoma.world` IS the branch build). `yoma-v3-dev` is a shared, last-deploy-wins environment:
every PR against `master` deploys its images there, and the API chart's dev values default to
`image.tag: "master"` when CI's `TAG` is not applied. Migrations only run forward, so any
master-based deploy after this branch's destructive drops breaks opportunity search until a
branch API image is redeployed. **Fix**: re-run the branch PR's deploy (or push a commit) so the
API pod image matches the DB schema — and expect it to re-break whenever another PR deploys to
DEV, until this epic merges. Owner: Adrian / infra.

## Changelog

- 2026-10-01 (later): Web absorbed Adrian's `f0194e90` (Entrepreneurship type):
  - editor: optional effort and a "Not specified" incentive for this type;
  - the programme Other ↔ description rule;
  - the type's blue-dark theme, "View programme" copy and a programme card fact;
  - "Start a business" → the type (BA to confirm);
  - the Integer `validationRegex` mirrored;
  - import help, and the completions sample's `CF:` headers;
  - asks 23–24 filed.

  Also: `/opportunities/discover` is the navbar's search page while `CUSTOM_FIELDS_ENABLED` is
  on, and the discovery cards link only through their button.

- 2026-10-01: The round-7 tabbed detail layout is live on `/opportunities/{id}`, the admin `info`
  page and the editor Preview, behind `CUSTOM_FIELDS_ENABLED` (off → classic). The `…/experimental`
  routes are removed.

- 2026-09-30 / 10-01: Discovery round-7 visual pass (claude.design brief) on YOM-1262:
  - header-owned category pills;
  - preference chips in the purple banner, this search's chips in a green twin panel;
  - redesigned cards with the summary restored;
  - experimental single-column detail pages (`/opportunities/{id}/experimental` and the admin
    `…/info/experimental`, also used by the editor Preview) — the classic pages are untouched;
  - a first-visit welcome step.

  Deviations from the canvas are listed in [`handoffs/2026-09-30-b.md`](./handoffs/2026-09-30-b.md).

- 2026-09-30: Local browser pass of manual steps 1–8 (all pass). Fixed on web: .NET regex anchors
  in definitions (ask 22), Job salary on discovery cards, partner-incentive decimals, deadline
  labels in UTC, core metadata on the public opportunity page (shared `OpportunityCoreDetails`),
  engagement `displayName` in the editor, "Skills required" for Jobs, banner copy, `aria-pressed`
  on wizard pills. Decisions: API takes priority on asks 17–22; YOM-1258 superseded by YOM-1262.

- 2026-09-29 (later): Web absorbed Adrian's `4c4b0ebd` (Impact Action tools / activity fields) and `35da1e0b` (optional completion fields, new `Date` data type) — `Date` in the editor, view and filters; the Impact Action Other ↔ description rule in the renamed `customFieldRules.ts`; CSV samples and both import help texts updated. Local DB must be recreated again (the CF migration was edited).

- 2026-09-29: Web integrated Adrian's five API commits (`263cc82e` … `adb9a305`) — `CUSTOM_FIELDS_ENABLED` on; preferences, the user place and location search live with the mock removed; admin editor on the new core fields, per-country places, Difficulty-as-CF and the Job rules; legacy / admin search, YoID skills, profile form and labels fixed for the breaking changes; asks 17–21 filed.

- 2026-09-28: User Location built on YOM-1262 / YOM-1261 against a mock — country stays the profile field; region / city / centroid via the shared `LocationInput` (Google Places + Geocoder); asks 14–16 filed for Adrian.
- 2026-09-22: YOM-1262 aligned to the BA sign-off and client review — Engagement replaces Pay on the search bar, badges render only when filterable, recents capped at 3, Start a business mapped; asks 7–13 above filed for Adrian.
