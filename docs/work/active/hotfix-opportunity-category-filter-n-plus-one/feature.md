# Opportunity category-filter N+1

Status: review

## Current phase: master forward-port

- Production shipped via PR #2005 / v3.13.6, commit `dfe2b311c397ff7555c85255088db4e8ea17a4a4`. Adrian's Production smoke tests passed.
- Prepared on `fix/opportunity-search-n-plus-one-master` from master `1c2ee4ed053e5a0df7847f73582fdea0ef4616f3`, without commit/push. The aggregation retains master's `OpportunityPublishedStateHelper` and CF end-date/selection rules; admin visibility/organization scope remains distinct from public filtering.
- Branch-specific category tests include end dates, published states, ordering, authorization and organization scope. All four N+1 fixes remain the only production-code changes.
- Adrian also requested a complete retained-test cleanup. Current unit suite passed twice: **1,187 tests, zero failures/skips**, without configured external test services. Historical PostgreSQL parity evidence below remains recorded, but its environment-gated diagnostics no longer live in the unit suite.
- Latest combined handoff: [2026-10-26-c.md](../hotfix-opportunity-search-sync-n-plus-one/handoffs/2026-10-26-c.md). Historical sections below describe the pre-Production phase, not the current release status.

## Baseline and scope

- Endpoint: `GET /api/v3/opportunity/search/filter/category`.
- Branch: `fix/opportunity-category-filter-n-plus-one`.
- Latest Production release checked: `v3.13.5`, successful [CICD 39775710678](https://github.com/didx-xyz/yoma/actions/runs/39775710678). Deploy and its API Helm step succeeded.
- Before branching, local current was fast-forwarded to origin/current; both match release commit `19076185c8d57d31e741e1aa8f6b3ea90292dce9`.
- Latest origin/master checked: `df67ed3272207d79fa596132c6e64bf8cf8058b0`. The same per-category Search/count loop remains. CF has NOT resolved this N+1 issue.
- No frontend, configuration, schema/index, dependency, transaction/retry or provider implementation changes.

## Implementation and decisions

- Keep the existing category-mapping query's organisation, hidden and published-state predicates untouched.
- Replace category-ID discovery and the per-category Search calls with one SQL aggregation, grouping by category and counting distinct opportunity IDs. Materialize only aggregate rows.
- Preserve lookup metadata, ordering, Other last, omission of unused categories and lookup caching.
- The admin category-filter endpoint was outside the first fix; it is addressed in the separate Production follow-on below.
- Datadog's latency forecast is not a measured patch result. The verified improvement is a constant query count: one aggregate query, plus the existing lookup query on a cold lookup cache.

## Tasks

- [x] Verify release deployment and synchronize current before branching.
- [x] Compare Production/current with latest master.
- [x] Replace the public endpoint's repeated counts only.
- [x] Add regression tests and verify PostgreSQL translation/count parity.
- [x] Build, changed-file formatting verification and local suite run.
- [x] Adrian review and Production deployment through current (PR #2005 / v3.13.6).
- [x] Forward-port to the separate master review branch and verify its CF semantics.
- [ ] Adrian reviews/commits the master port and requested test cleanup, then master PR and Stage deployment.

## Forward-port boundary

Master uses `OpportunityPublishedStateHelper` with opportunity end-date handling, and its filter DTO uses value wrappers. Keep those changes. Apply the aggregation after master's existing predicate; do not replace that predicate with Production's older switch. Adapt tests to master's constructor/filter shapes and compare against master's Search results, including end-date transitions. A cherry-pick may need conflict resolution around the removed per-category filter construction. Stage is not yet fixed by this branch.

## Validation

- Build: passed, zero warnings/errors. Changed-file format verification passed.
- Focused tests: 14 passed, including real PostgreSQL.
- Full assembly: 450 total, 413 passed, zero failed, 37 skipped because their separate disposable integration fixtures were not configured. Existing tests were neither edited nor excluded in the final run.
- Initial full-run failures were five existing notification tests rejecting the local PostgreSQL password. The final run supplied the existing master localhost/yoma-dev connection via the test process environment only. No saved setting or role password was changed.
- Isolated category fixture: PostgreSQL 17, 37 categories, 607 opportunities; all published-state combinations compared against the real existing Search/count path. Cold/warm lookup query counts asserted. Test data is rolled back. Disposable container removed afterward.

## Production follow-on: admin category counts

- Source recommendation: env:v3-prod, GET /api/v3/opportunity/search/filter/category/admin, six repeated per-category counts using filter_Organizations/filter_Categories. The earlier Stage sample is not the implementation baseline.
- Implemented only on the same local current-based fix branch, not directly on current or master. The two earlier production-code fixes remain unchanged.
- Preserve SearchCriteriaAdminValidateRequest, organisation deduplication, role requirements, existence validation and organisation scoping. Unlike public counts, admin counts retain hidden, inactive, expired and archived opportunities and do not require active organisations.
- Replace only the per-category Search/count loop with one SQL grouping/count-distinct operation on the existing scoped mappings. No new authorization, visibility, status or date rules.
- Added twelve admin validation/scope cases and extended the actual PostgreSQL parity gate to all admin selection forms. Original public test assertions remain in place; the shared fixture additionally includes an archived hidden opportunity.
- Final category tests: 26 passed, zero failures/skips. Combined three-fix suite: 490 total, 453 passed, zero failed, 37 separately fixture-gated skips. Build, changed-file format verification and whitespace checks passed.
- No production/deployment operation occurred. Adrian review is the next gate, then current/Production release and a separate master/Stage forward-port/adaptation.
- Handoff: [2026-10-26-b.md](./handoffs/2026-10-26-b.md).

## Final combined verification

The final four-fix Production-readiness pass ran the entire assembly with every integration fixture enabled: **518 passed, zero failures, zero skips**. Public/admin category PostgreSQL parity and constant-query-count assertions remain green. Build had zero warnings/errors; changed-file formatting and whitespace checks passed. No additional production-code changes were needed. See the [sync follow-on handoff](../hotfix-opportunity-search-sync-n-plus-one/handoffs/2026-10-26-b.md#final-review-addendum) for the combined evidence and release boundaries. Nothing is committed, pushed, deployed or forward-ported to master yet.

Subsequent analyzer-only cleanup moved the new category/search tests to the matching OpportunitySearch folder/namespace and reused constant scenario arrays. No category query or outcome changes. Explicit info-level analyzer checks and the full suite remained green: **518 passed, zero failures/skips**. See the [cleanup handoff](../hotfix-opportunity-search-sync-n-plus-one/handoffs/2026-10-26-b.md#analyzer-cleanup-addendum).
