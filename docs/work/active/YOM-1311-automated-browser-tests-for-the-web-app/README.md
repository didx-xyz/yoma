# Epic: YOM-1311 — Automated browser tests for the web app

## Meta

- **Epic**: [YOM-1311](https://linear.app/didx/issue/YOM-1311)
- **Owners**: Adrian (api — seed data) · Jason (web)
- **Areas**: both — web harness and tests; one seed-data change in the API
- **Status**: in-progress
- **Started**: 2026-11-02
- **Branch**: `feature/yom-1311-automated-browser-tests-for-the-web-app` (load-bearing until merged)

## Why This Epic Exists

The web app had no browser-level tests and CI's `test-e2e` job starts the full stack but runs
nothing. This epic adds a Playwright harness to `src/web`, proves sign-in for every seeded role,
gives each role one journey on fixed seed data, and then (children below) runs the suite in CI
and makes tests part of feature work.

## Child Features

| Folder | Ticket | Area | Status |
| --- | --- | --- | --- |
| [`feature.md`](./feature.md) (epic-level) | [YOM-1311](https://linear.app/didx/issue/YOM-1311) | both | in-progress |

Tickets with no folder yet — add one when work starts:

| Ticket | Area | Note |
| --- | --- | --- |
| tbd | web / ci | Run `pnpm test:e2e` in the `test-e2e` CI job and gate deploy on it (steps listed in `feature.md`) |
| tbd | web | AGENTS.md: feature work includes Playwright tests (draft wording in `feature.md`) |
| tbd | web | Populate each area with use-cases per role |

## Shared Contract

Everything a test may rely on is in `src/web/e2e/seed.ts`; the seed itself is
`src/api/cicd/scripts/postgressql-init/post.sql`. The two carry cross-references and must move
together. Fixed as of this epic:

| Entity | Id | Notes |
| --- | --- | --- |
| `testuser@gmail.com` (youth, `User`) | `00000000-0000-4000-8000-000000000001` | display name `Test User` |
| `testadminuser@gmail.com` (`Admin`,`User`) | `00000000-0000-4000-8000-000000000002` | administers no organisation |
| `testorgadminuser@gmail.com` (`OrganisationAdmin`,`User`) | `00000000-0000-4000-8000-000000000003` | admin of every seeded organisation |
| Organisation `Yoma (Youth Agency Marketplace)` | `00000000-0000-4000-8000-000000000100` | owns the 24 search fixtures |
| 6 partner organisations | unchanged fixed ids (see `seed.ts`) | present in every environment |
| Search fixtures | titles `NN - Type` (ids random) | address by title |

All three users are seeded with `"Settings" = {"User_Settings_Configured":true,"User_RumConsent":false}`
so no first-login dialog blocks a test. Keycloak password for all three: `P@ssword12`.

Selector convention (web): elements tests target carry a **unique** `id` with an `// e2e`
comment — the existing codebase convention. No `data-testid`. `SignInButton` / `SignOutButton`
take a required `id` prop so each render site is distinct (`btnSignIn` is the navbar one).

Verified 2026-11-02: full suite green against a freshly reseeded local stack.

## Out of Scope (whole epic)

- Visual regression / screenshot comparison.
- Firefox/WebKit — add as projects when the suite is bigger than a handful of tests.

## Blockers

| Blocker | Severity | Note |
| --- | --- | --- |
| none | | |

## Cross-Area Notes

- **Adrian**: `post.sql` changed (users' ids + `Settings`, Yoma org id, fixture `OrganizationId`).
  Marked with a `NOTE (Adrian, 2026-11-02 …)` comment at the top of the file. The stale
  `P@ssword1` comments were corrected to `P@ssword12`. Local stacks need `docker compose down -v`
  to pick it up; CI always seeds fresh.
- Future seed changes that touch anything in `seed.ts` must update `seed.ts` in the same PR.
