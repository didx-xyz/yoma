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

- [x] Prepare the Production-first completion-counter hotfix from released `current`: separate metadata writes from completion/reward totals and reuse opt-in tracking cleanup at owning completion transaction boundaries. See [2026-10-28 handoff](./handoffs/2026-10-28-a.md).
- [ ] Complete the current release after merged PR #2008: merge the CsvHelper 33.1.0 package correction first, then cut the Production release and forward-port to master/Stage. CsvHelper 34 migration and historical data audit/repair are separate follow-ups.

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
- [x] Disable temporary sample seeding for the cash-out release; retain the framework and sample helper.
- [ ] Introduce the approved field map in a new migration when CF is released.
- [ ] Re-run end-to-end API, CSV and partner mapping validation against the final definitions.

## Decisions

- 2026-10-28 release review: defer the CsvHelper 34 rewrite to separately tested master/Stage work. Its namespaces, generated mapping, reader/writer APIs and behavior differ from 33; the unadapted upgrade does not compile. The Production correction restores only CsvHelper 33.1.0 and preserves all counter fixes and other committed package patches.

- 2026-10-28 review: ordinary metadata batches and dedicated tracking-total batches query tracked entities and rely on EF change detection plus SaveChangesAsync. No UpdateRange or manual IsModified filtering is needed; the existing central transaction-boundary cleanup handles rollback/retry state. Entity-to-domain copy-back keeps returned models aligned with the loaded totals without making metadata saves total writers.

- 2026-10-28: Production `v3.13.6` still permits stale metadata snapshots to overwrite counters and retains accepted EF values after rollback in completion paths that do not opt into cleanup. Keep the central handler and its global default unchanged. Use opt-in tracking-total capabilities composed into derived generic repository interfaces; all affected injection, registrations and consumers use the utmost derived type. Base repository contracts stay unchanged, with no default throwing methods or entity-specific repository interfaces. Preserve totals in metadata saves, and enable existing cleanup at the owning transaction boundaries (not nested allocation scopes). The September reconciliation remains a one-time historical repair, not an ongoing safeguard; no new data migration or live repair is included. Master still requires a forward-port after the Production-first hotfix.

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
