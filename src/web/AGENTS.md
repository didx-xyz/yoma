# AGENTS.md — Yoma Web (`src/web`)

Next.js 16 / React 19 frontend (pages router), PWA-enabled. Owner: **Jason**. Root conventions in `/AGENTS.md` apply; this file adds web specifics.

## Layout (`src/web/src/`)

- `pages/` — Next.js pages router (routes)
- `components/` — shared React components
- `api/` — API client code for the .NET backend
- `context/`, `hooks/`, `lib/`, `models/` — state, hooks, utilities, types
- `server/` — server-side code
- `styles/` — Tailwind and global styles
- `env.mjs` — typed environment variables

## Commands (run from `src/web/`, after `pnpm install --frozen-lockfile` at repo root)

```bash
pnpm dev       # dev server at http://localhost:3000
pnpm build     # production build
pnpm start     # serve production build
pnpm lint      # eslint + prettier check
pnpm format    # prettier write
pnpm analyze   # bundle analyzer
pnpm test               # node:test unit tests (src/**/*.test.ts)
pnpm test:e2e           # Playwright e2e, all projects (needs the stack up, see below)
pnpm test:e2e:smoke     # @smoke subset — the PR gate
pnpm test:e2e:headed    # watch it in a browser window
pnpm test:e2e:ui        # Playwright UI mode
pnpm test:e2e:coverage  # V8 coverage of client bundles → monocart-report/
pnpm test:e2e:gaps      # list test.fixme() bypasses (must match known-gaps.md)
```

## Conventions

- TypeScript throughout; respect `tsconfig.json` strictness.
- Formatting is enforced by Prettier (`prettier.config.cjs`) and ESLint (`eslint.config.mjs`) — run `pnpm lint` before committing.
- Tailwind for styling (`tailwind.config.ts`); avoid ad-hoc CSS files.
- Environment variables are declared in `env.mjs` — add new ones there, not as raw `process.env` reads.
- Preserve PWA behavior; test changes to caching/manifest carefully.
- Run web tooling through mise (`mise x -- pnpm exec …`). The shell's bare `node` is v20, which
  pnpm 11 rejects.
- Never run `next build` (or `pnpm build`) while the dev server is running: they share `.next`.

## End-to-end tests (Playwright)

Required for feature work and support fixes that touch a user-visible flow (root `/AGENTS.md`,
"Automated Tests"). Harness, rules and the route checklist live in
`docs/work/active/YOM-1311-automated-browser-tests-for-the-web-app/` — read `README.md` (Shared
Contract) and `handoffs/2026-11-03-c.md` ("How features must be tested") before writing a spec.

- Layout: `e2e/<public|youth|org-admin|admin>/<area>.spec.ts`; import `{ test, expect }` from
  `e2e/support/test`. The project supplies the session — never log in inside a spec.
- Data: assert only on `e2e/seed.ts`. New fixed data goes into `src/api/.../post.sql` **and**
  `seed.ts` in the same change, with a NOTE for Adrian.
- Locators: unique `id="…"` with an `// e2e` comment; shared components take `id` as a required
  prop. No `data-testid`.
- Prerequisites: `src/api` docker compose up, `pnpm dev` running, `127.0.0.1 keycloak` in
  `/etc/hosts`, `mise x -- pnpm exec playwright install chromium` once.
- Use the `playwright-cli` skill to explore a page or debug a failing spec
  (`pnpm test:e2e <file> --debug`); use the CLI scripts above to run.
- A spec that fails repeatably for reasons outside your change: `test.fixme(true, "YOM-NNNN: why")`
  - a row in `known-gaps.md`. Never leave the suite red; never delete the test.

## Agent roles

Opt-in only; flow, gates and browser tooling are in `/.claude/agents/README.md`.

## Local data

Seeded by `src/api/cicd/scripts/postgressql-init/post.sql` (local and DEV only). **What tests and
agents may rely on is listed in `e2e/seed.ts`** — fixed ids for the three test users and the Yoma
organisation, the six partner organisations, the 24 search fixtures titled `NN - Type` (owned by
the Yoma organisation; 07 ended, 08 future, 09 no end date, every third "incomplete
partner-like"), `testuser`'s completed placement on `01 - Job` and pending verification on
`04 - Event`. Everything else (other organisations, bulk opportunities, referral programmes) is
random per reseed: look ids up through the API, never reuse old ones. Seed changes update
`post.sql` and `seed.ts` together.
