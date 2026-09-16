# Feature: opportunity search query hotfix

## Meta

- Owner: Adrian
- Area: api
- Status: review — local candidate; Stage/full API verification still required
- Started: 2026-09-16
- Branch: `hotfix/opportunity-search-query`
- Tracking: no Linear ticket assigned; no new remote ticket/PR created

## Problem / Goal

The deployed trigram indexes are usable, but that alone did not resolve slow public opportunity searches. The full search combines text matches with related-entity matches, repeats its filtered page in split collection queries, and issues three engagement counts per result.

Improve the full query path while retaining existing filters, ordering, exact total count, matching semantics and response fields.

## Plan / Implementation

1. Build a deferred union of matching opportunity IDs: existing opportunity text predicate, matching organization/type IDs, and matching category/skill links. Omit empty lookup branches. Apply this set to the existing filtered root query. No broad list of opportunity IDs is materialized in application memory.
2. Select ordered page IDs, hydrate those IDs with the existing split projection, and restore page order. Keep the unpaginated and count-only paths.
3. Batch Viewed, NavigatedExternalLink and Pending verification counts in one grouped database query for both public and admin search. Keep the original single-item method for detail endpoints.

No migration, configuration, response-contract or frontend change is required.

## Tasks

- [x] Compare the supplied August investigation notes with today's production-baseline source.
- [x] Reproduce the empty-related-branch and repeated-page work in isolated local PostgreSQL.
- [x] Implement matching-ID union, bounded split hydration and engagement batching.
- [x] Pass whole-model/page/count regression checks against PostgreSQL, including the public response path.
- [x] Build and check touched-file formatting.
- [ ] Review the patch with Adrian.
- [ ] Prepare the master-based PR branch locally after review, then push/PR only with authorization.
- [ ] Test the full API/UI workload on Stage, including the exact supplied country-filtered `customer hold` request.
- [ ] Follow the current-branch release process only after Stage verification.

## Decisions

- 2026-09-16: Work locally from production baseline `f791d5eaf98b1fd3b8d22a380c28fdfca74671bf`, in a separate worktree. Leave Adrian's shared master checkout alone.
- 2026-09-16: Do not force PostgreSQL planner settings or change indexes based only on a standalone query.
- 2026-09-16: Empty-lookup guards alone improved empty text searches but still left a slow nonempty related-skill branch. Use a deferred SQL union so each matching source can use its own indexes.
- 2026-09-16: Retain split hydration rather than multiply five child collections in one join. Restore the exact selected ID order.
- 2026-09-16: Preserve the existing MyOpportunity.DateStart predicate for pending verification. Its intent needs a separate business-rule review.
- 2026-09-16: Do not add a new exception if a selected row disappears before hydration. Do not add a repeatable-read transaction without an explicit consistency requirement.
- 2026-09-16: Do not lower the page-size cap, remove exact totals, or batch partner-sync information in this patch. Those require separate review/profiling.
- 2026-09-16: Local timing improvements are not a measured Production speedup and do not establish that every endpoint bottleneck is resolved.

## Out of Scope / Known Limitations

- No Production/API calls, remote Git operations, deployment, provider calls or settings changes.
- Partner-sync information still performs one database lookup per returned opportunity. The supplied older notes omit that current cost.
- Several SQL commands still form a search result. Concurrent changes can affect count/page/hydration consistency; a row may disappear or change filter-relevant fields between ID selection and hydration.
- The grouped counts observe a common statement timestamp; old per-item queries could straddle a start-time boundary.
- Existing wildcard/short/nonselective searches remain supported and can be expensive.
- The local harness mocks external/computed lookup services. It is not a deployed end-to-end API test.

