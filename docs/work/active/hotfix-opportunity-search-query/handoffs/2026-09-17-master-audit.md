# Master-only search optimization follow-up — 2026-09-17

Branch: `improvement/master-search-optimizations`, from `origin/master` at `e3f582f47` (PR #1939). No upstream: do not accidentally push to master/current. Changes intentionally uncommitted for Adrian's VS review. Umuzi is separate and not yet touched.

## Scope and result

| Area | Finding / action |
| --- | --- |
| Payout admin search | Remaining inline pagination and cross-table substring OR. Reuse `Page` and repository `WhereContains`; build deferred union of payout-text, user-text and optional GUID matches. Preserve exact count, date/amount/status/user filters and ordering. |
| Payout projection | Flat reference projection, no split child collections. Retain single page retrieval; adding page-ID hydration would introduce an unnecessary query. |
| Payout indexes | Five lower-expression trigram indexes via EF migration: User email/phone/display name and payout transaction ID/error reason. Raw-column trigram indexes do not cover lower(column). Retain existing lower + literal Contains semantics instead of broadening percent/underscore into ILIKE wildcards. |
| CF value search | Already definition-scoped deferred matching IDs, numeric/date covering indexes and a Value trigram index. No duplicate index or speculative rewrite. |
| Opportunity/MyOpportunity with CF | Shared page-ID hydration already in master. CF filters remain before captured hydrationQuery, retaining eligibility on both reads. No relaxation of those guards. |
| CF definitions/options | Cached lookup listing, not a paged text search; leave unchanged. |
| Treasury | Single-record accounting / financial aggregates, not a split browsing query. Preserve locks and transactional behavior. |
| SSI schema, notifications, idempotency | No equivalent new paginated SQL text search found. Leave provider/list/in-memory paths intact. |
| Existing search repositories and provider contexts | Previous hotfix helpers retained. Remaining raw Skip calls are internal batching, provider-specific offsets, option iteration or commented code, not missed PaginationFilter service paths. |

## Validation

- Both payout services inject `IRepositoryValueContains<PayoutTransaction>` through one DI registration; the richer interface includes the base repository contract. No duplicate base registration retained.

- Test-project build (and referenced API projects): zero warnings/errors.
- Direct xUnit Core suite: 29 passed. New tests compare the original payout predicate to matching-ID search for case, null/fallback fields, literal percent/underscore/backslash, no-match and GUID searches. Check counts, page order and existing query-WHERE/predicate-OR composition.
- Real Npgsql SQL generation tested without connecting: deferred UNION, lower/LIKE, LIMIT/OFFSET.
- Generated EF migration SQL applied successfully in isolated Docker PostgreSQL 18.4 database `yoma_payout_index_review_20260917` in container `yoma-search-query-check`. Five indexes valid/ready with correct lower expressions and gin_trgm_ops. This is a minimal-schema migration smoke test, not a full app database reset or production benchmark.
- Model snapshot has no semantic change. Expression indexes use the established raw-SQL migration convention; normal EF designer included.
- No payment state-machine, reconciliation, provider, authorization, UI or production config changes.

## Remaining checks / limits

- Review the diff, then exercise payout search on Stage after deployment. No measured payout performance multiplier is claimed from local unit/translation tests.
- Lower-expression indexes add storage/write overhead; they intentionally coexist with existing raw-column indexes used by other searches.
- Existing short/nonselective terms may still be expensive. No global planner settings changed.
- CF large-data performance remains workload-dependent; no behavior-changing filter removal or guaranteed future speed claim.
- This work is for master, not another current/prod cherry-pick. Umuzi audit is next, separately.
