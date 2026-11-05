# Prompt for a feature session — add Playwright e2e tests

Copy the fenced block into the feature session, replace the first line, append the matching
area note from the bottom of this file. Paths are repo-relative.

````
Ticket: YOM-NNNN — <title>   (your own ticket; its folder is docs/work/active/<epic>/<ticket>/)

Write Playwright e2e tests for the feature you implemented, following the YOM-1311 harness.

Read first, in this order:
1. AGENTS.md — "Automated Tests", "Confirmation Gate", "Ticket lifecycle"
2. src/web/AGENTS.md — "End-to-end tests (Playwright)"
3. docs/work/active/YOM-1311-automated-browser-tests-for-the-web-app/README.md (Shared Contract)
4. docs/work/active/YOM-1311-automated-browser-tests-for-the-web-app/handoffs/2026-11-03-c.md
   ("How features must be tested" — rules, not suggestions)
5. docs/work/active/YOM-1311-automated-browser-tests-for-the-web-app/handoffs/2026-11-03-d.md
   (gotchas: single local worker, title-cased names, wallet state, card markup)
6. docs/work/active/YOM-1311-automated-browser-tests-for-the-web-app/sitemap.md — find your rows
7. docs/work/active/YOM-1311-automated-browser-tests-for-the-web-app/known-gaps.md — what is
   already known to be untestable locally; do not re-discover it
8. src/web/e2e/seed.ts, src/web/e2e/support/test.ts, src/web/e2e/support/api.ts, and one existing
   spec in the role folder you will use (e.g. src/web/e2e/youth/profile.spec.ts)

Then:
- Put specs in src/web/e2e/<youth|org-admin|admin|public>/<area>.spec.ts. Import { test, expect }
  from "../support/test" — never from @playwright/test. The project supplies the session; never
  log in inside a spec. Use apiGet(page, "/path") from ../support/api to assert server truth after
  a UI mutation.
- Assert only on data in src/web/e2e/seed.ts. If your feature needs fixed seed data that is not
  there, add it to src/api/cicd/scripts/postgressql-init/post.sql AND src/web/e2e/seed.ts in the
  same commit, with a "-- NOTE (Adrian, <date> — YOM-NNNN)" comment, and say so in your handoff.
- Add a unique id="…" // e2e to any element you need that has none (shared components take id
  as a required prop). No data-testid.
- One test per user-visible behaviour, written as a short journey. Tag the single cheapest journey
  for your area "@smoke" (end of the title). Mutating tests restore their data (afterEach) or
  create their own. Serial only inside one file when state genuinely chains.
- If your new route is not in src/web/e2e/warmup.setup.ts, add it there (one line).
- A test that fails repeatably for reasons outside your change: test.fixme(true, "YOM-NNNN: why")
  + a row in known-gaps.md "Bypassed". Never leave the suite red; never delete a test.
- Flows you cannot exercise locally: a row in known-gaps.md "Not testable" with the prerequisite.
- Run from src/web: `mise x -- pnpm lint`, then `mise x -- pnpm test:e2e --project=<role>` while
  iterating and `mise x -- pnpm test:e2e` once before handing back (single worker locally,
  ~13 min — do not pass --workers). Stack: docker compose in src/api + `pnpm dev`; /etc/hosts needs
  `127.0.0.1 keycloak`; first time: `mise x -- pnpm exec playwright install chromium`. Use the
  playwright-cli skill to explore a page or debug a failing spec.
- In docs/work/active/YOM-1311-automated-browser-tests-for-the-web-app/sitemap.md set your rows to
  ☑ (smoke) or ☑☑ (journey) with the spec file name.
- Record the run result and gaps in your own ticket's handoff
  (docs/work/active/<epic>/<ticket>/handoffs/YYYY-MM-DD-x.md).
- Ask before committing, pushing, or touching Linear. Do not change src/web/playwright.config.ts
  or src/web/e2e/support/* — write that request in your handoff for the YOM-1311 session.

Branch: feature/yom-1311-automated-browser-tests-for-the-web-app holds the harness and is not
merged yet. Base your test work on it (or rebase onto it) — the ids, fixture, seed.ts, warm-up and
post.sql changes live there.
````

## Area notes (append the one that applies)

**Cash-outs**

````
Your rows: `/yoid/wallet` (render-only today) in sitemap.md. Wallet balance / cash-out is listed in
known-gaps.md as not testable locally (no SSI / Zlto backend in docker compose). If your feature
adds a stub or a seeded tenant with balance, move the row to tested and remove the gap.
````

**CF-fields**

````
Your rows: "Custom-field filters" under Discovery, and `/admin/schemas`, `/admin/schemas/[id]`
under Admin in sitemap.md. Existing filter widgets carry data-testid attributes — leave them; new
elements get id. The shared fixture (src/web/e2e/support/test.ts) sets
localStorage "yoma.discovery.personalizationSeen" = "1" so the discovery wizard never overlays a
test; a spec about the wizard itself must clear that key first.
````
