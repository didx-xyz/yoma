# Epic: YOM-1301 — Keep engagement analytics reliable as usage grows

## Meta

- **Epic**: [YOM-1301](https://linear.app/didx/issue/YOM-1301/keep-engagement-analytics-reliable-as-usage-grows) — standalone work
- **Owner**: Adrian (api)
- **Areas**: api
- **Status**: review
- **Started**: 2026-10-21
- **Branch**: `fix/analytics-engagement-memory`, based on `origin/master`

## Why This Epic Exists

Production returned `OutOfMemoryException` from engagement analytics. The recorded stack includes EF retry buffering and split collection materialization. The implementation loads individual timestamps, completion dates, ages and completion-skill collections before aggregation. Move aggregation into PostgreSQL without changing the report contract. This is a confirmed memory risk, not a confirmed explanation for the separate overnight OOMKills.

## Child Features

| Folder                                                                                          | Ticket                                                                                               | Area | Status |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---- | ------ |
| [Engagement analytics](./YOM-1301-keep-engagement-analytics-reliable-as-usage-grows/feature.md) | [YOM-1301](https://linear.app/didx/issue/YOM-1301/keep-engagement-analytics-reliable-as-usage-grows) | api  | review |

## Shared Contract

Preserve `POST /api/v3/analytics/search/engagement`, its models, authorization, filters and caching. Preserve historical totals, latest 52 weekly points, Sunday-to-next-Sunday buckets, completion-date filtering versus modification-date grouping, and completion-weighted skills/demographics. No migration, dependency, frontend or infrastructure change.

## Out of Scope

Partner refresh, exports, memory limits and attributing other restarts. Validate in QA/Stage and release with CF; any emergency Production cherry-pick requires separate approval.

## Blockers

None for implementation. Operational evidence remains necessary for the broader overnight OOM investigation.

## Cross-Area Notes

No frontend contract change; Jason does not need to adapt the dashboard.
