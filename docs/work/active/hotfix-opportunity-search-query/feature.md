# Feature: opportunity search query hotfix

## Meta

- Owner: Adrian
- Area: api; small web pagination fix (Jason handoff)
- Status: review — master-based PR candidate prepared locally; Stage/full API verification still required
- Started: 2026-09-16
- Branch: `hotfix-pr/opportunity-search-query` (master-based); original production-baseline commits preserved on `hotfix/opportunity-search-query`
- Tracking: no Linear ticket assigned; no new remote ticket/PR created

## Problem / Goal

The deployed trigram indexes are usable, but that alone did not resolve slow public opportunity searches. The full search combines text matches with related-entity matches, repeats its filtered page in split collection queries, and issues three engagement counts per result.

Improve the full query path while retaining existing filters, ordering, exact total count, matching semantics and response fields.

## Plan / Implementation

1. Build a deferred union of matching opportunity IDs: existing opportunity text predicate, matching organization/type IDs, and matching category/skill links. Omit empty lookup branches. Apply this set to the existing filtered root query. No broad list of opportunity IDs is materialized in application memory.
2. Select ordered page IDs, hydrate those IDs with the existing split projection and all original non-text filters, and restore page order. Recheck ownership/visibility during hydration; omit only expensive text matching. Keep the unpaginated and count-only paths.
3. Batch Viewed, NavigatedExternalLink and Pending verification counts in one grouped database query for both public and admin search. Keep the original single-item method for detail endpoints.

No migration, configuration or response-contract change is required. A small referral infinite-pagination correction is included; see the latest handoff for Jason.

### Cross-domain follow-up

- Action links: union link-text, opportunity-title and organization-name matching IDs in SQL.
- Referral links: union link-text and matching-user link IDs in SQL.
- Action-link usage logs: match email/display name/phone together on the User table and filter by matching user IDs.
- Both repository Contains overloads share the same matching set, preserving predicate-OR versus query-WHERE composition.
- Paginated MyOpportunity, referral programmes, referral links and marketplace rules select ordered page IDs before split hydration. Count-only and unpaginated paths retain existing behaviour.
- MyOpportunity search reuses grouped engagement counts for pending participants instead of issuing one count per result.
- No new search fields, normalization, wildcard escaping, status/authorization rules, ordering or result limits.

### Audit boundaries

| Path | Outcome |
| --- | --- |
| Opportunity public/admin | Existing candidate union, bounded hydration and grouped counts retained |
| MyOpportunity | Existing opportunity/user ID matching retained; bounded hydration and pending-count batching added |
| Action links, referral links, action usage logs | Cross-table OR rewritten as deferred matching sets |
| User, organization, skill, marketplace name search | Flat indexed text predicates retained; user/organization search uses Query(false), so no split-hydration change |
| Referral programme and Substack news text | Same-table substring/full-text predicates retained; programme split hydration bounded |
| Action-link distribution lists | Computed/unnested supplied values, not a persistent indexed relation; unchanged |
| AriesCloud, Alison, Jobberman, JobJack, IXO PartnerSync | No equivalent ILike/ValueContains search composition found in these contexts |
| CF on master | Read-only inspection: MatchingEntityIds applies definition-scoped filters and outer ID membership; not imported into this production-baseline branch |

CF combined filters and large value-table distributions still require master/Stage profiling; this is not a guarantee of future CF performance.

### Production SQL evidence supplied by Adrian

For impact, page 1/12 and the supplied two country IDs, with normal planner settings:
- Before count: 1227.856 ms; root page: 1236.449 ms.
- After count: 312.986 ms; ID page: 312.422 ms.
- Both counts: 413; after returns 12 IDs.
- These commands combined are approximately 3.94x faster; after detail hydration and the rest of the endpoint are excluded.
- Original PREPARE scripts yielded an always-false plan in the user's client. Parameter-inlined versions produced meaningful plans; the exact client cause was not established.

## Tasks

- [x] Compare the supplied August investigation notes with today's production-baseline source.
- [x] Reproduce the empty-related-branch and repeated-page work in isolated local PostgreSQL.
- [x] Implement matching-ID union, bounded split hydration and engagement batching.
- [x] Pass whole-model/page/count regression checks against PostgreSQL, including the public response path.
- [x] Build and check touched-file formatting.
- [x] Audit cross-domain text matching and split hydration; expand the local patch where the pattern applies.
- [x] Compare the expanded repository searches against original predicates on isolated PostgreSQL.
- [x] Bound referral UI pagination by requested pages and stop on empty pages; cover short/stale-total cases.
- [x] Retain original filtered paging for organization-status event publication via the shared helper's hydratePageSeparately opt-out.
- [x] Final independent review: preserve all non-text hydration guards and verify a real organization reassignment between ID selection and hydration in isolated PostgreSQL.
- [x] Review the patch with Adrian.
- [ ] After merge, audit master-only additions (CF, payout/treasury and any other new search paths) against the shared paging and matching helpers; repeat equivalent result tests.
- [ ] Apply the same audit to the pending Umuzi PR after it incorporates the hotfix; do not assume the production-baseline audit covers it.
- [x] Prepare the master-based PR branch locally after review, preserving master-only custom-field filters and JobJack contracts.
- [ ] Push the explicitly named PR branch and open the PR to master with Adrian; never push this branch to current.
- [ ] Test the full API/UI workload on Stage, including the exact supplied country-filtered `customer hold` request.
- [ ] Follow the current-branch release process only after Stage verification.

## Decisions

- 2026-09-16: Correct accidental `current` push using an exact expected-SHA force-with-lease, after Adrian authorized recovery. Remote `current` again matches `v3.12.8`. Remove the original hotfix branch's incorrect upstream and create the master PR branch with `--no-track`; do not inherit `origin/master` or `origin/current` as its push destination. See the latest handoff for verified references and release steps.
- 2026-09-16: Master integration retains custom-field filtering for both opportunity and MyOpportunity page selection and hydration. Keep master's existing JobJack generated regex methods and request-create provider contract. This is integration preservation, not the deferred audit of all master-only search paths.
- 2026-09-16: Work locally from production baseline `f791d5eaf98b1fd3b8d22a380c28fdfca74671bf`, in a separate worktree. Leave Adrian's shared master checkout alone.
- 2026-09-16: Do not force PostgreSQL planner settings or change indexes based only on a standalone query.
- 2026-09-16: Empty-lookup guards alone improved empty text searches but still left a slow nonempty related-skill branch. Use a deferred SQL union so each matching source can use its own indexes.
- 2026-09-16: Retain split hydration rather than multiply five child collections in one join. Restore the exact selected ID order.
- 2026-09-16: Browsing accepts the documented concurrent-read trade-off. Organization-status event publication opts out through the shared helper and keeps its baseline filtered paging; no snapshot transaction added around event publication.
- 2026-09-16: Referral See More advances by requested page number and the latest total count, with an empty-page stop. Do not infer exhaustion from a short nonempty page or use accumulated item count to decide whether another page exists.
- 2026-09-16: Extra review found that unrestricted ID-only hydration could cross an organization boundary after reassignment. Capture each service's fully non-text-filtered query for hydration instead; a row that no longer satisfies those filters is omitted. Explicitly tested the real service during an intervening organization update. No stronger transaction added.
- 2026-09-16: Preserve the existing MyOpportunity.DateStart predicate for pending verification. Its intent needs a separate business-rule review.
- 2026-09-16: Do not add a new exception if a selected row disappears before hydration. Do not add a repeatable-read transaction without an explicit consistency requirement.
- 2026-09-16: Do not lower the page-size cap, remove exact totals, or batch partner-sync information in this patch. Those require separate review/profiling.
- 2026-09-16: Local timing improvements are not a measured Production speedup and do not establish that every endpoint bottleneck is resolved.

## Out of Scope / Known Limitations

- No Production/API calls, deployment, provider calls or settings changes. The only authorized remote write during branch recovery restored `current`; the master PR branch remains local.
- Partner-sync information still performs one database lookup per returned opportunity. The supplied older notes omit that current cost.
- Several SQL commands still form a search result. Concurrent changes can affect count/page/hydration consistency. Hydration rechecks non-text filters, including ownership/visibility; a row may disappear or cease to qualify and be omitted. Text changes or sort changes can still yield a temporarily stale match/order. These reads are not a snapshot.
- The grouped counts observe a common statement timestamp; old per-item queries could straddle a start-time boundary.
- Existing wildcard/short/nonselective searches remain supported and can be expensive.
- The local harness mocks external/computed lookup services. It is not a deployed end-to-end API test.
