# Epic: YOM-1301 — Keep engagement analytics reliable as usage grows

## Meta

- **Epic**: [YOM-1301](https://linear.app/didx/issue/YOM-1301/keep-engagement-analytics-reliable-as-usage-grows) — standalone work
- **Owner**: Adrian (api)
- **Areas**: api
- **Status**: review
- **Started**: 2026-10-21
- **Stage source branch**: `fix/analytics-engagement-memory`, merged through PR #1994
- **Production backport branch**: `fix/referral-pathway-task-reassignment`, based on `current` / `v3.13.3`

## Why This Epic Exists

Production returned `OutOfMemoryException` from engagement analytics. The recorded stack includes EF retry buffering and split collection materialization. The implementation loads individual timestamps, completion dates, ages and completion-skill collections before aggregation. Move aggregation into PostgreSQL without changing the report contract. This is a confirmed memory risk, not a confirmed explanation for the separate overnight OOMKills.

## Child Features

| Folder                                                                                          | Ticket                                                                                               | Area | Status |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---- | ------ |
| [Engagement analytics](./YOM-1301-keep-engagement-analytics-reliable-as-usage-grows/feature.md) | [YOM-1301](https://linear.app/didx/issue/YOM-1301/keep-engagement-analytics-reliable-as-usage-grows) | api  | review |

## Shared Contract

Preserve `POST /api/v3/analytics/search/engagement`, its models, authorization, filters and caching. Preserve historical totals, latest 52 weekly points, Sunday-to-next-Sunday buckets, completion-date filtering versus modification-date grouping, and completion-weighted skills/demographics. No migration, dependency, frontend or infrastructure change.

## Out of Scope

Partner refresh, exports, memory limits and attributing other restarts. Adrian reports Stage looks good and explicitly approved adding analytics to the prepared Production hotfix on 2026-10-21. The backport remains separate from CF and from the referral/retry changes for commit review; Production release approval is still separate.

## Blockers

None for implementation. Operational evidence remains necessary for the broader overnight OOM investigation.

## Cross-Area Notes

No frontend contract change; Jason does not need to adapt the dashboard.

## Production Backport

See the [Production-baseline verification handoff](./YOM-1301-keep-engagement-analytics-reliable-as-usage-grows/handoffs/2026-10-21-b.md). No migration, new dependency or provider/configuration change is needed. The same branch also carries the separately scoped [referral/retry hotfix](../hotfix-referral-pathway-task-reassignment/README.md).
