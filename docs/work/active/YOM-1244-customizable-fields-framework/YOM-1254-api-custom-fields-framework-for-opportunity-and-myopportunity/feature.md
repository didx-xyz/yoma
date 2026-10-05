# Feature: API Custom Fields Framework for Opportunity and MyOpportunity

## Meta

- **Feature**: API custom-fields framework
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1254](https://linear.app/didx/issue/YOM-1254/api-custom-fields-framework-for-opportunity-and-myopportunity)
- **Owner**: Adrian
- **Areas**: api
- **Status**: in-progress
- **Started**: 2026-07-08

## Problem / Goal

Provide typed, definition-driven custom fields for Opportunity and MyOpportunity without expanding
the core models for every opportunity type. The framework must cover discovery, validation,
persistence, hydration, filtering, CSV imports and partner-sync inputs while remaining independent
of the temporary seeded field set.

## Out of Scope

- User-level custom fields and User Presets.
- BA approval of the final definitions and options.
- Credential schema selection and issuance; see YOM-1277 and its children.

## Plan

The shared contract is documented in the [epic README](../README.md). The implementation is owned
by the Core custom-field services and repositories, then composed into Opportunity,
MyOpportunity, CSV import and PartnerSync flows. Approved Opportunity/MyOpportunity definitions
are already seeded; final credential/schema mapping remains separate. The current Opportunity
search contract is in the [2026-10-01 consolidated handoff](../handoffs/2026-10-01-c.md);
older search shapes are superseded.

## Tasks

- [x] Resolve all selected Skill lookup IDs through a dedicated unpaged endpoint without an ID-count limit, while retaining the original paged search; flatten all 39 configured CF groups. Verify HTTP lookup behavior, metadata and PostgreSQL migration execution. See the [2026-10-05 handoff](handoffs/2026-10-05-a.md) for Jason's required local reset and all seven review decisions.
- [ ] Adrian reviews the selected-ID/grouping and internal follow-up diff; Jason consumes the lookup, revised metadata and deterministic fixtures after recreating his local database.
- [x] Finish the internal follow-ups: verify defensible partner incentive mappings, add deterministic Local/Dev search/completion fixtures, align completion CSV requiredness guidance, clarify committed search status and record read-only rollout checks in the same handoff.
- [x] Implement the agreed Opportunity search revision: per-criterion unspecified policies, country-scoped criteria, bounded OR groups, public ordering, scoped CF applicability and count-only on youth/admin searches.
- [x] Correct Job participation defaults and downstream Pending review queries; repair the completion CSV sample and preserve root row locking during CSV validation.
- [x] Add varied Local/Dev search fixtures, regression tests and authenticated API checks; document asks 1–24 in one consolidated handoff.
- [x] Adrian reviewed and committed the breaking search contract as `77646a74`; Jason integrated the API/Web shapes. Shared-environment deployment and acceptance testing remain coordinated follow-ups.
- [x] Add the Entrepreneurship Opportunity type, type-specific core validation, and separate Opportunity/ MyOpportunity CF definitions. Use `Opportunity|Default` until the final credential-schema phase; see the 2026-09-29-b handoff.
- [x] Verify the Entrepreneurship configuration with a fresh local PostgreSQL migration, authenticated Opportunity create/update and manual-verification API smoke tests. The youth submission remains Pending; credential issuance is covered by the final schema phase.
- [ ] Map partner-specific entrepreneurship data only after Umuzi, ixo or JA confirms its source fields and verified outcome trigger.
- [x] Remove the inert API-side preset flag and expose public count-only Opportunity search using the existing database count path. Web composes saved preferences and manual overrides into the effective filter request.
- [x] Seed optional MyOpportunity completion fields for Job employment start date, Impact Action impact achieved and Event role; add date-only CF handling, CSV sample and focused tests. Credential schema mapping remains the final CF phase.
- [ ] Confirm whether actual Job placement terms are returned by partners before adding completion-level Employment Type and Work Schedule. Employment duration remains follow-up reporting, not a completion-time field.
- [x] Implement Impact Action Tools required / Other description and Verified activity type, with seeded options, conditional validation, API CSV sample and focused tests.
- [x] Review Impact Action changes and execute fresh migration/post.sql, authenticated API/CSV smoke tests, SQL filters and Job regression checks. Correct IXO/JobJack execution-strategy registration discovered by CSV probe/commit testing; see consolidated handover.
- [x] Update the Impact Action & Event sheet's final implementation column with the final API behaviour and deferred completion/credential items.

- [x] Implement opportunity Provider, Incentivized/reward metadata, accessibility, age bounds, targeted groups and SDGs through API persistence, SQL search, CSV and applicable partner mappings; verify on disposable PostgreSQL and complete authenticated Docker/API smoke testing. See the consolidated handover for exact coverage and remaining UI integration.

- [x] Extend country mappings with optional location details, align user coordinate storage, implement country-scoped text/radius search and complete local API smoke tests; hand over the breaking payloads to Jason and PostGIS prerequisites to Robbie.

- [x] Add definition, option and value entities, mappings, indexes and migrations.
- [x] Add definition discovery for generic and Opportunity-type contexts.
- [x] Add typed validation, normalization and lookup-backed options.
- [x] Add Opportunity and MyOpportunity persistence and hydrated projections.
- [x] Add replacement semantics for API writes and patch semantics for imports/integrations.
- [x] Add database-side Opportunity and MyOpportunity filtering.
- [x] Add dynamic CSV import columns and validation.
- [x] Add PartnerSync request support.
- [x] Add `ApplicationDb_Opportunity_ParticipantCount_Reconcile` to repair historical counts alongside the CF CSV transaction fix.
- [ ] Deploy the participant-count migration with CF during a quiet window with completion/import writers paused; run the count/reward audit afterwards and stop the monthly manual-repair reminder only after production validation.
- [x] Disable temporary sample seeding for the cash-out release; the obsolete helper is now removed as approved seeding starts.
- [x] Seed type-specific Difficulty/Job experience definitions and options; migrate legacy non-Job levels, remove the core field and use the existing CF framework for capture, filtering and integrations.
- [x] Verify Difficulty with a full pre-CF database upgrade, fresh Docker migration/post.sql, five-type API CRUD/filter/validation checks and CSV import/report export. Add metadata-driven local CF option seeding; see the consolidated handover for coverage and limits.
- [x] Introduce the approved Difficulty, Job, Impact Action, Event completion and Entrepreneurship field configurations in migrations; final credential mappings remain separate.
- [ ] Re-run end-to-end API, CSV and partner mapping validation against the final definitions.
- [x] Seed Job-specific definitions and official industry/occupation options, extend generic lookup-backed CFs with Education/Currency, enforce conditional consistency and map supported partner values. Update the API CSV sample and consolidated handover.
- [x] Review Job implementation with Adrian; complete fresh migration/post.sql, authenticated Job API CRUD/validation/rollback/filter checks and CSV import/report smoke tests. Update the Jobs sheet's final implementation column; see consolidated handover for evidence and UI/partner limits.
- [x] Rename the `Task` lookup and enum to `ImpactAction` in place, with `[Description("Impact Action")]` and matching display name; update CSV sample and IXO mapping.

## Decisions

- 2026-10-05: Final selected-skill contract supersedes the earlier same-endpoint IDs proposal. Direct lookup is a dedicated anonymous POST accepting a non-empty JSON array of IDs and returning every known match as a plain list, without pagination/name filtering or an application-level ID-count limit. Adrian explicitly removed the initial 1,000-ID cap; no chunking is needed. POST avoids query-URL length constraints. Paged GET search remains unchanged. Inject the shared LookupIdsValidator through the existing domain registration; validate IDs, reuse the cached catalogue, deduplicate selections and omit unknown IDs. Country/Language/Education/Currency CF lookups already return full reference lists; inline options resolve by key against their definition's option names. User skills remain a separate, unpaged user-owned list including Verified and SelfAttested types.
- 2026-10-05: Complete the internal follow-ups without changing search contracts or defaults. JobJack's positive numeric salary mapping is retained; do not infer incentives from Jobberman prose or fabricate missing partner values. Local/Dev fixtures choose existing correctly typed rows, include one explicit Job placement start date and a pending Event, and leave labelled incomplete fixtures without CFs. No user preferences/location or production outcomes are backfilled. CSV/Partner Sync CFs remain optional; manual requiredness and instant-link bypass remain unchanged. Shared-environment data/extension checks are read-only rollout follow-ups, not remote mutations.
- 2026-10-05: Keep Opportunity search behavior unchanged after reviewing Jason's latest implementation. Latest rail naming and qualification/experience guidance labels belong to Web; accessibility includes listed support available on request; admin searches stored status. Add direct Skill resolution by IDs and promote configured CF subgroups to groups. The final endpoint decision above supersedes the earlier proposal to extend the paged Skill search itself. Adrian confirmed editing the original still-development seed migration, not a forward migration; Jason must recreate Local after pulling. Contextual search-criteria endpoints consuming the full effective filter are deferred, not batched search counts. See the [handoff](handoffs/2026-10-05-a.md).
- 2026-10-02: Reconfirmed the original capture-path policy: configured CF requiredness is enforced only on manual admin Opportunity saves and manual youth completion submissions. Partner sync and CSV permit missing CFs; supplied values remain validated. Instant/action links skip CF processing. Made the existing Impact Action/Entrepreneurship Other-companion rules follow that same boundary; no required flags or capture modes changed.
- 2026-10-02: Final search review corrected malformed commitment/reward inputs to return validation errors, standardized invariant range parsing, guarded the shared pagination offset against Int32 overflow and removed unnecessary treasury hydration from admin count-only. Local/Dev search fixtures retain varied ordering dates but stay valid for a month rather than expiring within hours. The taxonomy integration fixture now includes the prerequisites added as the consolidated configuration migration evolved; no production migration logic was changed by this test-fixture correction. See the existing consolidated handoff for rerun evidence and the unrelated full-suite test-harness failures.
- 2026-10-01: The API executes effective Opportunity criteria, not saved User Preferences. Generic `SearchCriterion<T>` policies, bounded groups, ordering and type-scoped CF applicability replace case-by-case search overrides. Count-only and CSV use the same authorised filter; other entity searches are unchanged. Job participation dates/effort are optional, and Pending review eligibility uses the Opportunity start rather than nullable youth participation start. See the [final contract](../handoffs/2026-10-01-c.md) for defaults, breaks, verification and Jason's composition rules. No commit is authorised before Adrian's review.
- 2026-09-29: Entrepreneurship is a new Yoma Opportunity type, superseding the draft credential deck's standalone partner-issued premise. Opportunity `ProgrammeType`/`VentureStageTargeted` metadata is shared; venture facts are MyOpportunity completion CFs. Manual capture may omit Incentivized and both commitment fields, and a manual Entrepreneurship verification may omit start date/commitment while retaining its completion end date. Existing core organisation, verification, category, country, language, skills and engagement fields are reused; no venture location is inferred from programme location. The generic `Opportunity|Default` schema is selected until type-specific credential schemas are implemented in the final CF phase. See [Entrepreneurship handoff](handoffs/2026-09-29-b.md) for fields, validation and unresolved partner mappings.
- 2026-09-29: Adrian chose client-side preference-to-filter composition, matching Jason's prototype. Opportunity search does not load User Preferences and accepts the effective core/CF criteria directly. Remove `ApplyUserPresets`; expose `TotalCountOnly` on the public search filter. A count-only response contains `totalCount` and no items, using the same predicates as ordinary search without item hydration, engagement counts or treasury lookup. Pagination is optional for this path. See the 2026-09-29 handoff for the Web contract and prototype gaps.
- 2026-09-29: The three MyOpportunity completion fields are optional. Job Employment Start Date is date-only (`yyyy-MM-dd`), Impact Achieved accepts text up to 1000 characters, and Event Role is a controlled single-select with no default. Adrian confirmed that instant links intentionally skip custom-field processing; no Event-specific verification logic is added. Existing completed records are not backfilled; credential mapping follows in the final CF phase. The sheet's Job placement-status and Event/Impact duplicate completion booleans are not added.
- 2026-09-29: Impact Action adds optional Tools required, conditional Other tool description (500 characters) and optional Verified activity type. Adrian approved expanding the tool list and confirmed Impact Achieved belongs to MyOpportunity. Only Other drives code logic and needs an enum. Event receives no additional Opportunity fields here; confirmation was requested from Mpho. Existing difficulty, core rewards, verification and provider are reused. See the consolidated handover.

- 2026-09-29: Job Industry uses UN ISIC Revision 5 Sections; Job category uses ISCO-08 two-digit Sub-major Groups. No separate core fields duplicate these classifications. Salary and employment consistency rules validate the complete post-upsert CF state inside the existing transaction. Manual capture enforces required fields, deadline and required skills; imports/sync permit incomplete data without permitting contradictions. Jason's prototype is a reference, not a binding API contract; Education/Currency controls and conditional UI behaviour need his integration. See the Job section in the consolidated handover.

- 2026-09-29: CF business contracts use constants for mapped keys and enums only for code-selected/interpreted options. The AnyLevel fallback is enum-backed; display names do not drive decisions. Existing enums/constants are reused in seeds and backfill; ordinary seed-only values remain literals. The four non-Job difficulty fields are system-controlled because integrations depend on them; Job experience remains ordinary metadata. Type-specific details groups, Requirements subgroup and ordering in tens establish the initial presentation convention. See the consolidated handover below for the full Difficulty contract and remaining verification.

- 2026-09-28: Common lookup ownership for Currency, TargetedGroup and SustainableDevelopmentGoal; opportunity-specific enums and associations remain in Opportunity. Extend existing request validators and use private assign/remove methods, not new collection endpoints. The age soft gate applies only on submission for verification, never external-link navigation or finalization of accepted submissions. See [core metadata handover](handoffs/2026-09-28-a.md#core-metadata).

- 2026-09-28: Country/location implementation reviewed and smoke-tested. Retain Countries, one location per country mapping; extend write/search country entries, use database-side text/radius filtering and PostGIS geography for both user and opportunity coordinates. CSV remains country-only and preserves retained details. See [final location handover](handoffs/2026-09-28-a.md#country-and-location) for Jason's contract, verification and deployment prerequisites.

- 2026-09-28: Adrian confirmed **Impact Action** as the final opportunity type, superseding the workbook's Impact Task wording. Follow the existing lookup pattern: rename enum and lookup Name to `ImpactAction`, use `[Description("Impact Action")]` and the same lookup DisplayName, and preserve the existing lookup ID. No Task-specific custom fields or SSI schemas have been seeded, so no context migration or compatibility code is needed. IXO continues to send `Impact Action` and maps to `ImpactAction`. CSV imports use the lookup Name.
- 2026-09-15: Skip only `SeedCustomFields` in the undeployed consolidated migration for the cash-out-first release. Keep all other seeds and the sample helper intact. Existing Local/Dev databases are not cleaned by this edit; newly migrated Stage/Production databases receive no sample definitions. After this migration ships, introduce approved fields through a new migration, not by re-enabling this call.
- 2026-09-07: The existing CSV rollback/EF-state fix does not repair historical data. Add a separate, data-only migration counting persisted completed verifications across all opportunities, correcting both undercounts and overcounts. Preserve existing null/zero values when no completions exist; leave ZLTO and all other fields unchanged. `Down` must not restore corrupt counters. Production was manually reconciled today and Adrian reported an empty follow-up audit; continue monthly audits and checks immediately after notified CSV imports until CF is deployed. See the [handoff](./handoffs/2026-09-07-a.md).
- 2026-07-08: Definitions and values are relational and indexed; values are not stored as a JSON blob.
- 2026-07-14: API writes are full replacement, while CSV and PartnerSync use partial-update semantics.
- 2026-07-15: Numeric and DateTime filters use typed indexed projections rather than runtime text casts.
- 2026-08-11: The branch and running API are authoritative; Linear still contains implementation detail that now belongs here.
- 2026-08-25: Synced master’s production JobJack and official IXO providers into the branch’s
  `OpportunityRequestCreate` custom-field pipeline. Existing description suffixes remain compatible
  output; final structured mappings remain blocked on the YOM-1264 field/core metadata matrix.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1254](https://linear.app/didx/issue/YOM-1254/api-custom-fields-framework-for-opportunity-and-myopportunity)
- Related: [YOM-1277](../YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/feature.md)
