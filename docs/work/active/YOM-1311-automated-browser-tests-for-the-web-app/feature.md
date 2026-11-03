# Feature: Playwright end-to-end tests for the web app

## Meta

- **Feature**: Playwright e2e harness, role sign-in setup, one journey per role, seed constants
- **Epic**: [YOM-1311](./README.md)
- **Ticket**: [YOM-1311](https://linear.app/didx/issue/YOM-1311)
- **Owner**: Jason (web) · Adrian notified of the `post.sql` change
- **Areas**: both
- **Status**: in-progress — harness + role journeys green locally; AGENTS.md rule and CI wiring deferred
- **Started**: 2026-11-02

## Problem / Goal

The web app had no browser-level tests, and CI's `test-e2e` job brings up the full stack but runs
nothing. Add Playwright to `src/web` with one real login test so later feature work can add
tests against a known harness, then (deferred) make tests a requirement in AGENTS.md and run them
in CI.

## Out of Scope

- Visual regression / screenshot comparison.
- Tests for signed-in surfaces beyond proving the login round-trip.
- Starting the stack from Playwright (`webServer`) — the stack is docker compose + `pnpm dev`.

## Plan

Harness lives in `src/web`:

- `playwright.config.ts` — chromium only, `baseURL` from `E2E_BASE_URL`
  (default `http://localhost:3000`), no `webServer`, trace/screenshot on failure, `retries: 2`
  and `workers: 1` under `CI`. Projects:
  - `setup` — `e2e/auth.setup.ts` signs in each seeded role through Keycloak, asserts the role
    claims on `/api/auth/session`, and saves `e2e/.auth/<role>.json` (gitignored).
  - `anonymous` — `e2e/public/**`, no session. The login journey lives here.
  - `youth` / `org-admin` / `admin` — `e2e/youth/**`, `e2e/org-admin/**`, `e2e/admin/**`;
    depend on `setup` and load that role's storage state, so tests start signed in.
    **To add a test, drop it in the folder of the role it needs.**
- `e2e/seed.ts` — every seeded id/name/title/route a test may rely on, with `post.sql`
  references. See the epic README "Shared Contract".
- `e2e/support/auth.ts` — `loginViaKeycloak(page, user)` and `storageStatePath(role)`.
- `*.spec.ts` is disjoint from the unit-test glob `src/**/*.test.ts`; `tsconfig.json` and
  `eslint.config.mjs` already cover `e2e/` through globs, so `pnpm lint` checks tests too.
- Scripts: `pnpm test:e2e`, `pnpm test:e2e:headed` (real browser window),
  `pnpm test:e2e:ui` (Playwright UI mode, time-travel per step); `--debug` for the Inspector.
  First run needs `mise x -- pnpm exec playwright install chromium`.
- Coverage: `pnpm test:e2e:coverage` (`E2E_COVERAGE=1`). Specs import `test` from
  `e2e/support/test.ts`, whose auto fixture records V8 JS coverage per test
  (`reportAnonymousScripts` so the dev server's eval'd `webpack-internal:///…/src/…` modules
  are included) and hands it to `monocart-reporter`, which maps through the inline source maps
  to `src/`. Output: `monocart-report/index.html` (test report), `monocart-report/coverage/`
  (html + `lcov.info`). Console summary prints at the end of the run.
  - Measures **client bundles only**: `getServerSideProps`, `pages/api/*`, `server/` never
    execute in the browser. Untouched routes are not in the denominator at all — only modules
    the browser loaded count, so "100%" means "of what was loaded".
  - Next reverts any `devtool` change in dev (`webpack-config.js` "Reverting webpack devtool"),
    so file-level source maps are not an option on the dev server; the eval route above is.
    A production build needs `productionBrowserSourceMaps: true` for the same mapping.
  - Roughly doubles test time; keep it off by default.

Journeys (all on fixed seed data):

| Project | Spec | Asserts |
| --- | --- | --- |
| anonymous | `public/login.spec.ts` | `/` → `#btnSignIn` → Keycloak `#username`/`#password`/`#kc-login` → back on `/`, `#btnUserMenu` visible, `/api/auth/session` email |
| youth | `youth/yoid.spec.ts` | `/yoid` h1 "Good …, Test" + `section#wallet/passport/opportunities/skills`; `/opportunities/discover?q=01 - Job` shows card h3 `01 - Job`; `/organisations` shows no Organisations heading / Treasury link |
| org-admin | `org-admin/opportunities.spec.ts` | `/organisations/<yoma id>/opportunities` heading "🏆 Opportunities", `#lnkNavbarMenu_Submissions`, no `#userMenu_admin`, row link `01 - Job` |
| admin | `admin/organisations.spec.ts` | `/organisations` heading "🏢 Organisations", `#lnkNavbarMenu_Treasury`, `JobJack` in `#results` |
| anonymous | `public/keycloak/login-page.spec.ts` | theme renders (tabs, fields, OTP toggle, forgot, social, terms); submit gating; OTP/password switch; Register and Forgot pages open; wrong password → `#input-error` (brute-force counter cleared in `afterAll`); site language fr → Keycloak in French (`ui_locales`) |
| anonymous | `public/keycloak/register.spec.ts` | client password gate blocks submit; existing email → "Email already exists." |
| anonymous | `public/keycloak/phone.spec.ts` (serial) | register with test phone + OTP `1234` → signed in; OTP login with wrong then right code; reset password by phone OTP → `login-update-password` → new password works. Throw-away user deleted before/after via admin API |
| anonymous | `public/keycloak/logout.spec.ts` | user-menu Logout → `#btnSignIn`, `/api/auth/session` `{}`, and Login shows the Keycloak form again (SSO session really ended) |
| youth | `youth/session-expired.spec.ts` | `/api/auth/session` patched with `error: "RefreshAccessTokenError"` → "Session Expired" dialog, `#btnSignIn_sessionExpired`, "Stay logged out" |

Support: `e2e/support/keycloak.ts` — `KeycloakAdmin` (master `admin-cli` token; `deleteUsersByPhone`,
`clearBruteForce`), `openKeycloakLogin` (closes toasts first), `requestOtp` (waits for
intl-tel-input's `promise` — CDN utils + geo-IP — before typing). `e2e/support/test.ts` also
pre-sets `localStorage` `rumConsent=false` and `hasShownRefereePendingToast=true` so the RUM
consent dialog and referral toast never overlay a test.

Site map / checklist for feature sessions: [`sitemap.md`](./sitemap.md).

Source changes made for testability (web): `SignInButton`/`SignOutButton` take a required `id`
(navbar `btnSignIn`/`btnSignOut`, drawer `btnSignIn_drawer`/`btnSignOut_drawer`, and one per
other render site); user-menu toggle `#btnUserMenu`.

### Prerequisites for running locally

- `src/api` docker compose stack up (Keycloak, API, Postgres) and `pnpm dev` in `src/web`.
  The DB must have been seeded from `post.sql` at or after 2026-11-02 (fixed ids); otherwise
  `docker compose down -v && docker compose up -d` in `src/api`.
- `127.0.0.1 keycloak` in `/etc/hosts`: `KEYCLOAK_ISSUER` is `http://keycloak:8080/realms/yoma`,
  so the browser is redirected to that host.

### Deferred (CI)

Add to `.github/workflows/cicd.yml` `test-e2e`, after the `jdx/mise-action` step and before the
log dumps:

1. `echo "127.0.0.1 keycloak" | sudo tee -a /etc/hosts`
2. `pnpm install --frozen-lockfile`
3. `pnpm --filter yoma-web exec playwright install --with-deps chromium`
4. `pnpm --filter yoma-web test:e2e` with `CI=true`
5. `actions/upload-artifact` of `src/web/playwright-report` and `src/web/test-results` on failure.

The job already starts both compose files with the pushed image tags, so no stack changes are
needed. `helm/` and workflows are not to be edited without an explicit ask (root AGENTS.md).

### Deferred (AGENTS.md)

Add to `src/web/AGENTS.md`: feature work that changes a user-visible flow adds or updates a
Playwright test under `e2e/`, and `pnpm test:e2e` is part of the pre-commit checks alongside
`pnpm lint`.

## Tasks

- [x] Add `@playwright/test` devDependency, `playwright.config.ts`, scripts, `.gitignore` entries
- [x] `public/login.spec.ts`: home → Login → Keycloak credentials → authenticated
- [x] Unique ids on sign-in/sign-out buttons and user-menu toggle (web)
- [x] `post.sql`: fixed ids for test users + Yoma org, fixtures under Yoma org, seeded `Settings` (api — Adrian)
- [x] `e2e/seed.ts` constants
- [x] `auth.setup.ts` + per-role projects with storage state
- [x] One journey per role + a youth gating check — full suite green on a reseeded stack (2026-11-02)
- [x] Coverage via monocart-reporter (`test:e2e:coverage`) — 269 `src/` files mapped (2026-11-03)
- [x] Keycloak suite for the SRE upgrade runbook — 14 anonymous tests green (2026-11-03)
- [x] `sitemap.md` — every route by role with seed needs and status (2026-11-03)
- [ ] AGENTS.md: require Playwright tests for feature work (deferred — needs Jason's wording)
- [ ] CI: run `pnpm test:e2e` in the `test-e2e` job (deferred — workflow edits need an explicit ask)
- [ ] Per-area use-cases per role (deferred)

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-11-02: Tests live in `src/web/e2e/`, not `src/web/test/` — that folder already holds the
  `node --test` loader for unit tests.
- 2026-11-02: No `webServer` in the config. The stack is docker compose plus `pnpm dev`, and
  AGENTS.md says agents never start or stop it. CI starts it the same way.
- 2026-11-02: Authenticated state is asserted twice — navbar swap and `/api/auth/session` — rather
  than opening the user menu. The first login shows the "Choose your settings" modal
  (`components/Global.tsx`) because `post.sql` does not seed `User_Settings_Configured`, and that
  modal sits over the drawer.
- 2026-11-02: Chromium only. Firefox/WebKit can be added as projects once the suite is bigger than
  one test; each adds a browser download to CI.
- 2026-11-02: Credentials default to the seeded values committed in `src/api/docker-compose.yml`
  (they are not secrets) and can be overridden by env for other environments.
- 2026-11-02: Locators use roles/titles, not ids. `#btnSignIn` and `label[for="userMenu-drawer"]`
  are each rendered more than once (navbar + hidden mobile drawer; toggle + overlay + close), so
  id/attribute locators fail Playwright's strict mode. No `data-testid`s were added to the app.
- 2026-11-02: After the Keycloak callback the test waits for `commit`, not `load`. The home page's
  embeds kept `load` from firing for >45 s under parallel runs on the dev server, which showed up
  as a one-off timeout; the visibility assertions do the real waiting.
- 2026-11-02 (supersedes the two above on selectors/modals): the app now guarantees unique ids
  for the elements tests target, and seeded users have `User_Settings_Configured` /
  `User_RumConsent` set, so tests use `#id` locators and no modal handling. Kept `data-testid`
  out: the codebase convention is `id` + `// e2e`.
- 2026-11-02: One storage state per role, created by a `setup` project, instead of logging in
  inside each test. Keeps each journey ~5–10 s and keeps the Keycloak form out of every spec; the
  login journey itself remains a real test in the `anonymous` project.
- 2026-11-02: Seed changes done in `post.sql` directly (Jason, with a NOTE for Adrian) rather than
  waiting: fixed ids are the only way the org-admin journey can address an organisation, and
  seeding `Settings` removes the modal problem at its source instead of in every test.
- 2026-11-02: Fixtures moved from "lowest active org id" (random) to the Yoma org. Opportunity ids
  stay random — child tables already reference them and titles are deterministic, so tests key on
  titles.
- 2026-11-03: Coverage by V8 (`page.coverage`) + `monocart-reporter`, not Istanbul. No `.babelrc`
  (would switch the build off SWC), no separate instrumented build, works against the running
  dev server. Trade-off: client-side only. Server coverage, if ever wanted, is the Istanbul route.
- 2026-11-03: Phone flows use the compose `TEST_PHONE_NUMBERS` number (`+27123456789`, OTP
  `1234`) and a throw-away user removed via the admin API, not a seeded user: registration needs
  the number to be free, reset mutates the password. Abuse limits remain (1 send per code type
  per 5 min, 3 per hour) → at most three runs of `phone.spec.ts` per hour; documented in the file.
- 2026-11-03: Email registration/reset are asserted only up to the form validation. No mail
  catcher locally and the realm SMTP is SendGrid with a fake key; adding Mailpit to compose is
  the way to cover them (Adrian's call).
- 2026-11-03: Session expiry is tested by patching `/api/auth/session` (`page.route`) rather than
  waiting out the 300 s token. What matters for the site is its reaction to the refresh error.
- 2026-11-03: Client-side prompts are pre-answered through `localStorage` in the shared fixture
  instead of dismissed per test. The app has no ids on those dialogs; text-based dismissal in
  every spec would be the brittle alternative.

## Links

- Ticket: [YOM-1311](https://linear.app/didx/issue/YOM-1311)
- PRs:
- Related: `.github/workflows/cicd.yml` `test-e2e` job; `src/keycloak/scripts/users.sh` (seeded
  accounts)
