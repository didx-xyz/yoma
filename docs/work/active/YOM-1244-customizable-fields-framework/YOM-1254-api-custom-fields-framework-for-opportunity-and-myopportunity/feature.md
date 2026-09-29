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
MyOpportunity, CSV import and PartnerSync flows. Final scripted definitions remain pending until
the BA field map is approved.

## Tasks

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
- [ ] Introduce the approved field map in a new migration when CF is released.
- [ ] Re-run end-to-end API, CSV and partner mapping validation against the final definitions.
- [x] Seed Job-specific definitions and official industry/occupation options, extend generic lookup-backed CFs with Education/Currency, enforce conditional consistency and map supported partner values. Update the API CSV sample and consolidated handover.
- [x] Review Job implementation with Adrian; complete fresh migration/post.sql, authenticated Job API CRUD/validation/rollback/filter checks and CSV import/report smoke tests. Update the Jobs sheet's final implementation column; see consolidated handover for evidence and UI/partner limits.
- [x] Rename the `Task` lookup and enum to `ImpactAction` in place, with `[Description("Impact Action")]` and matching display name; update CSV sample and IXO mapping.

## Decisions

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
