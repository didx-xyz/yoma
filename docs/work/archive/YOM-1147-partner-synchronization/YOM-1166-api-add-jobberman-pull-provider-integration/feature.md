# Feature: API Jobberman Pull Provider Integration

## Meta

- **Feature**: Jobberman Opportunity pull
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1166](https://linear.app/didx/issue/YOM-1166/api-add-jobberman-pull-provider-integration)
- **Owner**: Adrian
- **Areas**: api
- **Status**: review — October CF follow-up; original integration and non-CF hotfix shipped
- **Started**: 2026-04-28

## Problem / Goal

Import and maintain provider-managed Jobberman job opportunities from its RSS feed through the
shared PartnerSync pull capability.

## Out of Scope

- Jobberman verification or user-authentication flows.
- Unrelated provider transport/capability and CF persistence changes. The explicitly requested
  snapshot consistency, one-sided salary presentation and Contract duration-rule follow-ups are included below.

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
- [x] Revisit provider metadata against the configured Job custom-field definitions; see the October CF follow-up below.

- [x] YOM-1296: Robbie to correct `appSettings.Jobberman.Feeds` entries for GH/NG in dev/Stage to `Resources.jobs.sample-GH.xml` / `Resources.jobs.sample-NG.xml` and verify successful sample-feed runs. Do not change production live-feed behaviour. Completed 15 September 2026, confirmed by Adrian on 16 September.

### October 2026 feed enhancement follow-up

The original integration and non-CF hotfix are shipped. Adrian supplied the successful 19 October
production pull: 4,925 processed, eight created, 330 updated, 4,587 skipped and zero failures.
Representative saved fields and live pages were checked, revealing a separate stray-bold-marker
formatting defect. Its shared-helper fix is now implemented/tested in this CF branch; production
port/deployment is deferred until after this batch. First reconcile `current`
with the latest deployed release, including Robbie's/Jason's subsequent hotfixes. The CF adaptation
below is separate and awaits Experience agreement, review and local end-to-end validation.

- [x] Refresh both embedded RSS samples from representative, unmodified live-feed subsets (10 records per country), covering the enhanced schema and omitted salary values.
- [x] Validate XML, exact source-item fidelity, full observed field coverage and the Jobberman project build.
- [x] Update parsing/mappings for the enhanced non-CF feed: use the existing Yoma Summary and category fields; formatted body plus otherwise-unmapped metadata goes to Description.
- [x] Persist the short summary separately in the Jobberman cache with a nullable-column migration; add regression tests for enhanced/legacy feeds, omissions, hashes, cache lifecycle and all 20 embedded records.
- [x] Validate initial creation locally from a fresh database using Adrian's query results: 20 created, no failures, 10 cache records per country, no duplicates/missing summaries, and mapped descriptions/categories/summary limits confirmed.
- [ ] Deletion of old embedded records cannot be validated from the fresh local database; check during Stage replacement or via the lifecycle regression tests. Adrian waived another manual unchanged-repeat pull because the shared behaviour is already established; do not claim that rerun occurred.
- [x] Execute Jobberman's regression suite using the direct xUnit runner after the local execution block was resolved: all 27 tests passed, including hashes, lifecycle, migration SQL and model/snapshot consistency. The wider PartnerSync namespace also passed all 50 tests. Build passed with zero warnings/errors.
- [x] Complete final Jobberman diff review and restore SSI schema validation unchanged. No commit/push was made by Codex; Adrian requested commit wording and will push.
- [x] Release the non-CF hotfix via `current` without waiting for Jason's separate change. The later approved direction was to branch from `origin/master` and cherry-pick only the Jobberman change before adapting it to CF; a complete `current`-to-`master` reconciliation remains separate.
- [x] Remove the temporary Debug/Local-only `OpportunityService.AssertSSISchemaApplicable` bypass after local validation and before any hotfix commit. Schema validation is restored unchanged; credential/schema correctness was not validated by the bypassed local run.

See [sample preparation handoff](./handoffs/2026-10-19-a.md) for source URLs, coverage and mapping observations.

### October 2026 CF follow-up

- [x] Create `fix/jobberman-cf-mappings` from remote master and import the reviewed Jobberman hotfix only, preserving master's existing schedule CF mapping.
- [x] Store raw salary, experience level/length and qualification in four nullable provider-cache columns, with repository/refresh coverage and a forward migration.
- [x] Map compatible source values to existing Job salary, schedule, experience and qualification CFs. Retain ambiguous or more precise source details in Description; do not infer salary period, employment permanence, ISCO occupation or employer industry.
- [x] Explicitly clear only the eight CF keys owned by this complete-snapshot mapper when withdrawn/unmappable; preserve unrelated CFs through the shared PATCH contract. Use the common snapshot helper as recorded below, not a Jobberman-only deletion loop.
- [x] Keep Experience/Qualification non-system as confirmed by Adrian. Remove the uncommitted/unapplied protection migration and its migration-only test; assert the actual seeded flags remain false. No historical migration or other existing system flag changed.
- [x] Review enum use across the five pull providers: retain enums for business-process decisions and the established shared constants/configured metadata/lookup IDs for data mappings. No Jobberman-only enum catalogue was introduced; seeded key/option contract checks remain in place.
- [x] Align QualificationMappings with the existing ID-first category pattern, grouping source aliases per Yoma Education ID and commenting each destination label. Matching remains trimmed and case-insensitive; all nine alias/case/whitespace regression cases pass.
- [x] At Adrian's request, centralize snapshot completion in `SyncExtensions.CompleteCustomFieldSnapshot`, with identically named provider ownership declarations for Jobberman and JobJack. Add JobJack's missing withdrawal behaviour for salary/disclosure/interval, schedule and industry; preserve currency/qualification/employment fields it does not map.
- [x] Review all five pull providers: add runtime mapping regression tests proving Alison/IXO/Umuzi replace withdrawn difficulty with their existing mapped/default value instead of omitting it. Their Job mappings and verification responses do not claim unsupported CF ownership.
- [x] Add real shared PATCH-upsert tests for explicit withdrawal plus unrelated preservation, case-insensitive/idempotent snapshot completion and effective hash stability. Record the mandatory forward ownership/snapshot rule once in the PartnerSync epic shared contract.
- [x] Set Jobberman's salary disclosure to No only when raw salary text is absent/blank. Supplied but unmappable salary stays unknown/readable, never misclassified as absent or unpaid. Add null/empty/whitespace coverage.
- [x] Measure current mapper coverage on 200 deterministic live-feed samples (100 per country, title-deduplicated). Record missing-vs-unmapped distinctions and the experience-framework hotspot in the coverage evidence/handoff; do not change experience mapping without agreement.
- [x] Map explicit salary thresholds to a single bound, retaining the source qualifier. Keep exact amounts as equal bounds. Web display wording is handed to Jason, not implemented in this branch.
- [x] Add Contract alongside existing employment options through a forward metadata migration; clarify all option meanings without changing existing keys/IDs. Map only explicit Jobberman Contract, not an assumed schedule or term. API allows an unknown term for Contract alone; other term/permanence rules remain in force. Web alignment is pending Jason.
- [ ] Jason: implement shared From / Up to salary display and mirror Contract duration rules in the form, with regression tests and Web checks. See the dedicated Jason handoff; Codex's initial good-faith Web edits/tests were fully reverted at Adrian's explicit ownership instruction. Keep future API work out of `src/web`.
- [x] Audit all 39 CF definitions and rewrite the 24 implementation-oriented descriptions as user-facing form help. Use one pending application migration with separate employment/help-text seed classes; retain the production-applied Summary migration and the separate-context cache-column migration.
- [x] Fix shared HTML-to-Markdown handling of empty emphasis and line breaks/whitespace at emphasis boundaries. Preserve valid formatting and literal Markdown. Cover the exact GH/NG production excerpts and all embedded records; a full conversion scan of 3,991 live items has zero standalone emphasis-marker lines.
- [x] Preserve the original 20 live-derived embedded records and add three explicitly labelled synthetic cases for exact salary, maximum-only salary and omitted metadata. Embedded totals are GH 12 / NG 11. Test structured values and description fallbacks explicitly.
- [x] API build and read-only formatting checks pass. The handoff records 261 API test passes and six guarded DB skips. No Web changes remain; the earlier 40-test result covered a reverted experiment and is not proof of current UI alignment. Jason owns implementation and Web lint/type/browser checks.
- [x] Adrian reviewed in VS and ran the local setup/catalogue/pull. Read-only local API validation passed all 819 assertions across 23 synced records (GH 12 / NG 11), including independently specified CF values, complete source body text, summaries, fallbacks and returned metadata. The selected regression suite was rerun: 261 passed, six guarded DB skips, zero failures. Evidence is linked in the consolidated handoff.
- [ ] Visual verification is deferred to Stage at Adrian's explicit instruction. No local UI pass was performed. Live unchanged-repeat/metadata-withdrawal checks remain separate from the passing automated transition tests; no test writes were performed during the API readback.
- [ ] Commit/push only after Adrian's approval. No new CF commit, migration execution or deployment has occurred.

See [CF adaptation handoff](./handoffs/2026-10-19-b.md) for mapping decisions, migration order,
test evidence, branch provenance and remaining validation.

## Decisions

- 2026-05-07: A valid complete snapshot may infer deletion by omission; an empty/invalid feed may not.
- 2026-05-29: Duplicate feed items are suppressed before shared processing.
- 2026-10-19: Prepare live-derived embedded fixtures before changing mappings. Preserve complete source items, HTML text, XML namespaces and omitted fields; do not invent language, working hours or unavailable metadata. Keep provider schema/mapping work separate from the newer CF branch.
- 2026-10-19: Use existing Yoma fields before appending description metadata. RSS `description` maps to the existing 150-character Yoma Summary (plain text, bounded, title fallback); `content:encoded` provides the full Description with short-description fallback. RSS `category` uses the existing category/keyword map, with `job_function` fallback. Append salary (`price`, then legacy `salary`), experience level/length, qualification, detailed location and work type only when supplied. Keep country/language/lifecycle rules and CF usage unchanged. The only new column is nullable `Jobberman.Opportunity.Summary`, needed across the cache-to-domain boundary; no new Yoma domain fields or CF definitions are introduced.
- 2026-10-19: Latest release direction supersedes the earlier cherry-pick/Jason-wait plan: Adrian will commit/push, let checks run and proceed without Jason's not-yet-ready change. After the hotfix release from `current`, merge `current` back into `master`, then use a new master-based working branch for the structured-storage/CF version. Do not start that conversion on the release hotfix branch.
- 2026-10-19: Subsequent instruction supersedes the full-merge prerequisite above: branch from `origin/master` and cherry-pick the reviewed Jobberman hotfix (`003286f3b`, PR #1985), then adapt it for CF. Keep Robbie's release CI/Helm changes out of this scoped import; reconcile those separately later. All new CF work remains uncommitted for Adrian's VS review.
- 2026-10-19: Reuse configured Job CFs and stable lookup identities. Require source experience labels/year counts to agree with seeded year-range options; preserve contradictions in Description. Numeric salary has no inferred pay interval. Snapshot withdrawals deliberately delete only mapper-owned CF values; unrelated keys remain untouched. The detailed mapping contract lives in the CF adaptation handoff.
- 2026-10-19: Adrian confirmed Experience/Qualification remain ordinary non-system CFs. The proposed protection migration was removed before commit/application. Follow the existing split: enums for business-process decisions, stable shared constants and metadata/lookup IDs for informational sync mappings. Enum/constant references help code refactoring but do not detect database-only edits; keep seed-contract tests and common active-option validation. No broader reclassification of existing fields was requested.
- 2026-10-19: Adrian requested cross-provider consistency, not a Jobberman exception. Adopt one shared snapshot completion helper for optional, provider-owned authoritative fields; JobJack has the same omission gap and now uses it too. Difficulty-only providers emit explicit replacements/defaults and need no synthetic deletes. Future ownership declarations and withdrawal tests follow the PartnerSync epic shared contract; actual PATCH validation/deletion remains unchanged.
- 2026-10-19: Adrian approved Jobberman Salary disclosed = No when the feed genuinely supplies no salary text. Do not apply that default to present-but-unmappable text and do not infer unpaid work. Live-sample analysis shows 42.5% experience fallback under the current strict label/year agreement, mainly framework differences; whether years should become the primary mapping source remains a discussion item, not an implemented change.
- 2026-10-19: Adrian approved one-sided salary mapping/display and adding Contract to Employment Type, separate from Work Schedule. Preserve stable existing options and clarify their meanings in definition help text. Generic Contract is not automatically Fixed-term and does not force an invented duration; optional manual term details must be paired. Experience is deferred. Minimal shared Web edits require Jason's review; no commit/push authorized.
- 2026-10-19 (later, supersedes Web implementation above): Adrian explicitly directed us to leave Jason's domain. Reverted Codex's two Web helper edits and two new test files completely; kept the API contract and documented exact pending UI requirements/tests for Jason. Future API tasks must hand off related Web work rather than implement it in `src/web`. Local API/UI inspection precedes Adrian's commit/push/Stage approval; pending client behaviors must not be claimed complete.
- 2026-10-19 (local validation): Adrian ran the API and sync and directed that visual UI checks happen on Stage rather than locally. The local API readback passed (819 assertions, 23 synced fixtures); proceed through his reviewed commit/push/merge workflow without claiming a visual pass or Jason's pending client work complete. No code, DB or Web changes were needed during this validation.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1166](https://linear.app/didx/issue/YOM-1166/api-add-jobberman-pull-provider-integration)
