# Feature: Keep engagement analytics reliable as usage grows

## Meta

- **Feature**: Engagement analytics memory use
- **Epic**: [YOM-1301](../README.md)
- **Ticket**: [YOM-1301](https://linear.app/didx/issue/YOM-1301/keep-engagement-analytics-reliable-as-usage-grows)
- **Owner**: Adrian
- **Areas**: api
- **Status**: review — Stage accepted by Adrian; Production backport verified, commit/release pending
- **Started**: 2026-10-21

## Problem / Goal

Allocations grow with engagements/completions and child skill collections. EF retry buffering compounds this. Return aggregate rows from PostgreSQL and preserve the business calculations in the [shared contract](../README.md#shared-contract).

## Out of Scope

Other endpoints, background jobs, infrastructure/provider settings, report horizon restrictions and changing completion counts to distinct-user counts.

## Plan

Update `AnalyticsService.SearchOrganizationEngagementInternal` to aggregate weekly counts, durations, skills, ages and monthly organization totals before enumeration. Execute the actual repository queries on disposable PostgreSQL with retries enabled. Compare with legacy calculations, including boundaries and a large dataset. Keep independent of CF-only models for a separately reviewed Production hotfix if necessary.

## Tasks

- [x] Trace the Production exception and current query.
- [x] Aggregate before materialization without changing the contract.
- [x] Add calculation and PostgreSQL translation/regression tests.
- [x] Validate large-data cardinality and allocations, including one million completions.
- [x] Build, review and record QA/cherry-pick guidance.
- [x] Adrian review, PR #1994 and reported Stage acceptance.
- [x] Backport the isolated analytics change to the Production baseline after Adrian's explicit approval.
- [x] Build and rerun the combined hotfix regression suite with one million completions on isolated PostgreSQL.
- [ ] Adrian's commit/PR to `current` and Production release approval.

## Decisions

- 2026-10-21: Aggregate before enumeration; streaming alone does not remove retry buffering or split collection loading.
- 2026-10-21: Preserve Sunday buckets, historical totals, completion-date filtering, permissions and caching.
- 2026-10-21: Use isolated PostgreSQL, not Adrian's database or any shared environment.
- 2026-10-21: EF cannot flatten the existing projected `Skills` collection into SQL. Join the already-registered OpportunitySkill and Skill repositories instead; reuse the existing filtered completion query and load no child collections. Other analytics consumers retain their previous child-item behavior.
- 2026-10-21: Direct timestamp materialization encounters the existing UTC value converter's DateTimeOffset/DateTime coercion issue. Timestamp addition also inherits session DST arithmetic despite a UtcDateTime projection. Compute UTC Gregorian day numbers from year/day-of-year, group by the next-Sunday ordinal, and construct display dates only from aggregate rows. Share this weekly projection across engagement and skills; PostgreSQL DST and century/leap-year regressions verify it.
- 2026-10-21: Equal-count top skills now have explicit name/ID tie-breakers; the previous underlying row order was unspecified. Skill occurrence counts and weekly distinct-skill semantics are unchanged.
- 2026-10-21: Refresh planner statistics in the disposable bulk-load fixture. Aborted/repeated loads can otherwise leave empty-table statistics and produce misleading nested-loop plans. This is test setup, not an application or shared database change.
- 2026-10-21: At Adrian's request, keep the query-only `EngagementWeek` projection in `Analytics/Models` as an internal sealed class rather than nested in the service. It remains assembly-internal, not a persisted entity or response model; query behavior is unchanged.
- 2026-10-21: Adrian approved adding analytics to the Production hotfix after reporting Stage looks good. Apply the isolated analytics source without bringing CF or SSI replay. Remove only the test's NetTopologySuite option on the Production branch, which has no PostGIS package/model requirement; no new dependency or production logic change.

## Links

- Epic: [YOM-1301](../README.md)
- Ticket: [YOM-1301](https://linear.app/didx/issue/YOM-1301/keep-engagement-analytics-reliable-as-usage-grows)
- Stage source PR: [#1994](https://github.com/didx-xyz/yoma/pull/1994)
- Production backport: [2026-10-21-b.md](./handoffs/2026-10-21-b.md)
