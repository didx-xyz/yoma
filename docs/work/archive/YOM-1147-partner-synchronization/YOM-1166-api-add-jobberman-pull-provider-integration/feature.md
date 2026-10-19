# Feature: API Jobberman Pull Provider Integration

## Meta

- **Feature**: Jobberman Opportunity pull
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1166](https://linear.app/didx/issue/YOM-1166/api-add-jobberman-pull-provider-integration)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-28

## Problem / Goal

Import and maintain provider-managed Jobberman job opportunities from its RSS feed through the
shared PartnerSync pull capability.

## Out of Scope

- Jobberman verification or user-authentication flows.
- Final custom-field mappings pending the shared field map.

## Plan

Refresh and cache the complete feed, map valid entries to Yoma Job opportunities, protect existing
data on empty/invalid snapshots, and let the shared domain apply create/update/terminal-delete
actions.

## Tasks

- [x] Add RSS retrieval, parsing, cache persistence and migration.
- [x] Add Job Opportunity content, category, language and keyword mappings.
- [x] Add duplicate suppression and complete-snapshot deletion handling.
- [x] Add embedded/local behavior, scheduling and retention.
- [x] Deploy to production.
- [ ] Revisit provider metadata when final custom-field definitions are approved.

- [x] YOM-1296: Robbie to correct `appSettings.Jobberman.Feeds` entries for GH/NG in dev/Stage to `Resources.jobs.sample-GH.xml` / `Resources.jobs.sample-NG.xml` and verify successful sample-feed runs. Do not change production live-feed behaviour. Completed 15 September 2026, confirmed by Adrian on 16 September.

### October 2026 feed enhancement follow-up

The shipped status above describes the original integration. This hotfix follow-up is not released.

- [x] Refresh both embedded RSS samples from representative, unmodified live-feed subsets (10 records per country), covering the enhanced schema and omitted salary values.
- [x] Validate XML, exact source-item fidelity, full observed field coverage and the Jobberman project build.
- [x] Update parsing/mappings for the enhanced non-CF feed: use the existing Yoma Summary and category fields; formatted body plus otherwise-unmapped metadata goes to Description.
- [x] Persist the short summary separately in the Jobberman cache with a nullable-column migration; add regression tests for enhanced/legacy feeds, omissions, hashes, cache lifecycle and all 20 embedded records.
- [x] Validate initial creation locally from a fresh database using Adrian's query results: 20 created, no failures, 10 cache records per country, no duplicates/missing summaries, and mapped descriptions/categories/summary limits confirmed.
- [ ] Deletion of old embedded records cannot be validated from the fresh local database; check during Stage replacement or via the lifecycle regression tests. Adrian waived another manual unchanged-repeat pull because the shared behaviour is already established; do not claim that rerun occurred.
- [x] Execute Jobberman's regression suite using the direct xUnit runner after the local execution block was resolved: all 27 tests passed, including hashes, lifecycle, migration SQL and model/snapshot consistency. The wider PartnerSync namespace also passed all 50 tests. Build passed with zero warnings/errors.
- [x] Complete final Jobberman diff review and restore SSI schema validation unchanged. No commit/push was made by Codex; Adrian requested commit wording and will push.
- [ ] Release via `current` without waiting for Jason's separate hotfix, then merge `current` back into `master` after release. Start a new working branch from the updated `master` to adapt Jobberman to CF mappings and structured provider-cache storage.
- [x] Remove the temporary Debug/Local-only `OpportunityService.AssertSSISchemaApplicable` bypass after local validation and before any hotfix commit. Schema validation is restored unchanged; credential/schema correctness was not validated by the bypassed local run.

See [sample preparation handoff](./handoffs/2026-10-19-a.md) for source URLs, coverage and mapping observations.

## Decisions

- 2026-05-07: A valid complete snapshot may infer deletion by omission; an empty/invalid feed may not.
- 2026-05-29: Duplicate feed items are suppressed before shared processing.
- 2026-10-19: Prepare live-derived embedded fixtures before changing mappings. Preserve complete source items, HTML text, XML namespaces and omitted fields; do not invent language, working hours or unavailable metadata. Keep provider schema/mapping work separate from the newer CF branch.
- 2026-10-19: Use existing Yoma fields before appending description metadata. RSS `description` maps to the existing 150-character Yoma Summary (plain text, bounded, title fallback); `content:encoded` provides the full Description with short-description fallback. RSS `category` uses the existing category/keyword map, with `job_function` fallback. Append salary (`price`, then legacy `salary`), experience level/length, qualification, detailed location and work type only when supplied. Keep country/language/lifecycle rules and CF usage unchanged. The only new column is nullable `Jobberman.Opportunity.Summary`, needed across the cache-to-domain boundary; no new Yoma domain fields or CF definitions are introduced.
- 2026-10-19: Latest release direction supersedes the earlier cherry-pick/Jason-wait plan: Adrian will commit/push, let checks run and proceed without Jason's not-yet-ready change. After the hotfix release from `current`, merge `current` back into `master`, then use a new master-based working branch for the structured-storage/CF version. Do not start that conversion on the release hotfix branch.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1166](https://linear.app/didx/issue/YOM-1166/api-add-jobberman-pull-provider-integration)
