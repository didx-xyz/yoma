# Opportunity search sync-state N+1

Status: review

## Scope and baseline

- Reported endpoint: `POST /api/v3/opportunity/search`; repeated query reads PartnerSync.ProcessingLog once per returned opportunity.
- Branch: `fix/opportunity-category-filter-n-plus-one`, already based on verified Production v3.13.5 / current (`19076185c8d57d31e741e1aa8f6b3ea90292dce9`). Do not rebase this work onto master or disturb the first uncommitted category fix.
- Latest origin/master checked: `df67ed3272207d79fa596132c6e64bf8cf8058b0`. Its sync-state implementation and per-item enrichment have the same issue; CF has NOT resolved it.
- No REST contract, schema/index, configuration, provider, authorization, transaction or retry changes.

## Implementation and constraints

- Add a domain sync-state overload accepting entity IDs and their caller-supplied URLs. Fetch the same non-aborted log histories for those IDs in one ordered SQL query.
- Keep latest-per-raw-sync-type/partner selection, enum parsing, partner deduplication, partner order and consistency checks in the domain. Both the existing single-item method and the batch method use the extracted original mapping logic.
- Preserve null for entities with no qualifying records, exact supplied URLs (including null/blank), latest pending/error/delete records, mixed-type errors and the single-partner requirement for pull sync. Do not silently repair or hide inconsistent data.
- Search invokes the batch only after normal pagination/hydration and only for returned items. Count-only and empty results do not request sync information. Null prefetched entries do not trigger fallback queries.
- Existing single reads, create/update/status paths and Contains keep their single-item path. MyOpportunity search is addressed in the separate Production follow-on below; its guards retain single-item reads. Published flags and organisation-logo computation are unchanged.
- No cache, SQL latest-record shortcut or new tie-break ordering is introduced. This removes round trips; it does not redesign history retention or eliminate the existing history reads.

## Tasks

- [x] Trace Production query and compare current/master.
- [x] Batch only returned opportunity IDs and reuse original domain rules.
- [x] Independently compare batch and single-item results/errors with pre-change logic.
- [x] Verify PostgreSQL query count and exclude unrelated/aborted records.
- [x] Verify search pagination, ordering, publication/logo computation, null sync values and single-read fallback behaviour.
- [x] Build and changed-file formatting verification.
- [x] Combined suite with both new PostgreSQL gates enabled.
- [ ] Adrian review; no commit/push/release before approval.
- [ ] Production hotfix through current, then forward-port to master and deploy Stage.

## Evidence

- Focused second-fix tests: 28 passed, zero failures/skips, including the isolated PostgreSQL test.
- Combined full suite: 478 total, 441 passed, zero failed, 37 pre-existing fixture-gated tests skipped. The first fix's 14 tests also pass.
- Build: zero warnings/errors; formatting verification and diff whitespace checks passed.
- PostgreSQL gate requests 12 entities, compares their results with independent legacy expectations and the actual single-item repository path, and observes one processing-log query. Returned row reads exclude unrelated IDs and aborted logs.
- Existing tests were not edited or excluded. The final full run reused the established child-process-only localhost connection override; no saved settings/password change.

## Forward port

The sync-state files have the same starting implementation on current and master. Port the new overload, shared mapper and page-level prefetch together. Keep master's CF search/filter/published-state logic intact, adapting test constructor/model shapes as needed. This branch does not yet fix Stage. Preserve the separate first-fix category patch and its own CF forward-port cautions.

## Production follow-on: MyOpportunity admin search

- Report: env:v3-prod, POST /api/v3/myopportunity/search/admin, twelve repeated ProcessingLog reads keyed by MyOpportunityId.
- Applied only on the local current-based fix branch. Existing filtering, authorization, sorting, pagination, hydration and engagement counts are unchanged.
- Add a verification-ID batch overload, filtering the same non-aborted histories in SQL; use the extracted original pull-only domain mapper and validation. Preserve nulls, latest record selection, raw sync-type grouping, partner deduplication and exact consistency errors.
- Search batches only verification IDs on its returned page. Non-verification, empty, count-only and unrestricted searches retain their prior bypass behaviour. Photo/logo/file URLs and the ToInfo mapping are unchanged.
- Existing single-entity getters and verification deletion/finalization guards still use the Guid overload. The invalid-Guid exception is preserved through shared validation.
- Focused MyOpportunity/search/sync group: 46 passed, zero failures/skips, including actual PostgreSQL parity and one-query verification. Final combined four-fix assembly: 516 total, 479 passed, zero failed, 37 pre-existing fixture-gated skips.
- Build, changed-file format verification and whitespace checks passed. Disposable fixtures removed; no saved settings, migrations, provider code, commits, pushes or deployments changed.
- Same issue exists on the master baseline, but forward-port/reimplementation and branch-specific validation remain separate release work, not already completed.
- Handoff: [2026-10-26-b.md](./handoffs/2026-10-26-b.md).

## Final Production-readiness verification

- Rechecked the complete four-fix production diff against current/v3.13.5. No further production-code changes were needed. All changes remain on the local fix branch; nothing has been committed, pushed or deployed.
- Added two PostgreSQL cases covering the maximum allowed search page size (1,000 IDs), up to 32 histories per ID, unsynced/aborted records and malformed histories outside the requested page. Both batch paths match independent pre-change mapping, preserve exact database-backed consistency errors and execute one history query.
- Final full assembly: **518 total, 518 passed, zero failed, zero skipped**. Enabled all previously gated fixtures on separate disposable localhost PostgreSQL databases and Redis, including referral reassignment, user-action concurrency and analytics (100,000 additional completions). Existing tests were not edited or excluded.
- Build: zero warnings/errors; changed-file formatting and diff checks passed. Both disposable containers were identity-checked and removed. No saved settings/password change or live environment access.
- No known blocking functional regression remains from the audit/tests. This is strong release evidence, not a zero-risk guarantee or a Production-load measurement. Production smoke/Datadog monitoring after release and the separate master/Stage adaptation remain required.

## Analyzer cleanup

- Cleared the 15 reported IDE/analyzer recommendations without suppressions: matching test namespaces/folders, collection expressions, reusable read-only scenario arrays and the private opportunity computed-field dictionary parameter's concrete type.
- New search tests now live under `src/api/src/test/Yoma.Core.Test/OpportunitySearch`, namespace `Yoma.Core.Test.OpportunitySearch`. The singular `Opportunity` namespace shadows the existing model in older tests; moving only the new files avoids modifying those existing tests.
- Explicit information-severity verification of CA1859, IDE0130, CA1861, IDE0300, IDE0301 and IDE0305 passed. Build and changed-file format verification passed. Full suite rerun after cleanup: **518 passed, zero failures, zero skips**, with all isolated integration gates enabled.
- No search/domain-rule changes, saved configuration changes, commits or pushes. Disposable cleanup fixtures removed. See the existing follow-on handoff for artifacts.
