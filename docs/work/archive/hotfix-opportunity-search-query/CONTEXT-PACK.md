# Context Pack: Opportunity Search Query Hotfix — RECONSTRUCTED

## Provenance

- **Written:** 2026-10-14 by Adrian / Codex on `chore/cash-out-final-prep`.
- **Replaces:** the README, feature and session narrative as the entry point. Original files remain beside this pack.
- **Source now at:** `docs/work/archive/hotfix-opportunity-search-query/`.
- **Rebuilt from:** every original document in this folder, the production-only September 17 handoffs and benchmark at `c3d2c5b53`, merged diffs, and the current pagination helper.
- **Merged references:** `e3f582f47` (#1939) on master; production adaptation `d773d6a79`; payout-only follow-up `c3469ca27` (#1940). Original source commits `368ebaf55` and `5c20b2390` still resolve but are pre-squash development history, not the master release anchor.
- **Not verified today:** live endpoint latency, paired after-release benchmark, or deployment health. No tests or API requests were run during archival.

This is a reconstruction. Current code wins over historical implementation/release instructions.

## Where the Work Got To

The hotfix is merged and in the historical production lineage. It replaces expensive cross-table
OR searches with deferred matching-ID sets, bounds split hydration to ordered page IDs, and batches
engagement counts. The payout search follow-up is also merged. Feature status is `shipped`.

The original README and September 16 handoffs stop before release. Recovered September 17 notes
record a successful Stage deployment and Adrian's browsing smoke pass; they do not establish a
post-release Production speedup. The production-only documents and benchmark artifacts are retained
under their original relative paths in this archive.

## Decisions That Still Bind

- Preserve text/wildcard semantics, exact totals, ordering, count-only and unpaginated behaviour.
- Keep matching IDs deferred in SQL; do not materialize the whole matching opportunity set in memory.
- Recheck all non-text filters, including ownership and visibility, when hydrating page IDs. Restore selected-ID order; a concurrently deleted or newly ineligible row may be omitted.
- Organisation-status event publication opts out of separate hydration through `hydratePageSeparately: false`; do not silently change that concurrency boundary.
- Keep split projection rather than multiplying several child collections in a single join.
- Referral pagination follows requested pages and the latest total, stopping on an empty page rather than a short nonempty page.
- Payout text uses lower-expression indexes and literal substring semantics; do not turn percent/underscore into new wildcard behaviour.

## Contracts and Source of Truth

- `src/api/src/domain/Yoma.Core.Domain/Core/Extensions/PaginationExtensions.cs`: shared paging/count/hydration behaviour.
- `src/api/src/infrastructure/Yoma.Core.Infrastructure.Shared/Extensions/RepositorySearchExtensions.cs`: repository predicate composition.
- Opportunity/MyOpportunity/Referral/ActionLink/Marketplace services and repositories retain their caller filters.
- `src/web/src/hooks/usePaginatedQuery.ts`: requested-page pagination. The old consumer was commented out at the Stage smoke pass, so that pass did not exercise the hook.
- Payout transaction search and migration `20260917061729_ApplicationDb_Payout_Search_Indexes` are the later master-only extension, not part of the production-baseline cherry-pick.

## Evidence and Gotchas

Historical local evidence includes 2,920 opportunity/engagement assertions, 192 PostgreSQL query
comparisons, and focused Core tests. Harness lookups/providers were mocked; those command counts
and timings are not whole deployed endpoint measurements. Existing referral-suite failures were
observed on both baseline and candidate and were outside this hotfix.

Adrian's supplied SQL comparison preserved 413 matches and improved the measured count/ID-page
commands by about 3.94x; detail hydration and endpoint work were excluded. The public pre-release
benchmark retained 20 successful sequential requests, with country-filtered impact page-one median
11,623.28 ms and customer-hold median 2,730.19 ms. No paired after result was found in the read sources.

Multiple SQL statements are not a transaction-wide snapshot. Text/order may be temporarily stale;
per-item sync lookups and short/nonselective searches remain possible costs. Do not force planner
settings or promise blanket speedups. Keep the trigram indexes from the separate index hotfix.

## Open Questions / Follow-ups

- Run an explicitly requested paired Production benchmark before quoting endpoint speedup.
- Stage workload/index validation for the payout-only extension was not found in these records.
- CF performance and mappings belong to the active [CF epic](../../active/YOM-1244-customizable-fields-framework/README.md), not a reopened production hotfix.

## Deliberately Dropped

Old branch/worktree preparation, the recovered accidental `current` push, and release commands are
historical narrative in the original handoffs. Do not execute them as current deployment instructions.
No original source document or benchmark artifact was deleted.
