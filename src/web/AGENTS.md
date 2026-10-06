# AGENTS.md — Yoma Web (`src/web`)

Next.js 15 / React 19 frontend (pages router), PWA-enabled. Owner: **Jason**. Root conventions in `/AGENTS.md` apply; this file adds web specifics.

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

## Agent roles

Root `/AGENTS.md` ("Web Tasks — Agent Roles") says when each role runs; the roles are opt-in, used
only when Jason asks for them. The role definitions are in `/.claude/agents/`. This section covers
what the roles need to work on Jason's machine.

**Local stack.** The web dev server runs on http://localhost:3000 (Jason runs `pnpm dev`) and
the API on http://localhost:5000/api/v3 (`docker-compose` in `src/api`). Roles never start,
stop or restart them. If either is down, stop and tell the lead.

**Browser tooling** (machine-local, in `~/.cache/cdp-tools/`; it uses no repo dependencies):

| Command                                                    | Does                                                                                         |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `~/.cache/cdp-tools/anon.sh start` / `stop`                | A throwaway signed-out headless Chrome on port 9226 and its daemon on 9336, fresh profile each start |
| `~/.cache/cdp-tools/a <route> …`                           | The daemon CLI: `nav <url> [waitMs]`, `eval <js>`, `click <js>`, `type <js> <text>`, `key <Key>`, `shot <path> [full]`, `net`, `console`, `cdp <Method> <json>` |
| `mise x node@24 -- node ~/.cache/cdp-tools/snapshot.mjs <step>` | Standard captures at 1440 and 390 (`welcome`, `pages`, `filters`, `details`, `all`, or `route <path> <name>`) into `$SNAP_OUT` (default `~/.cache/cdp-tools/shots/<timestamp>`) |

- **Viewports:** desktop is `a cdp Emulation.setDeviceMetricsOverride '{"width":1440,"height":900,"deviceScaleFactor":1,"mobile":false}'`;
  mobile is the same at `390` × `844`, `deviceScaleFactor` 2, `"mobile":true`.
- **Clicking:** for anything a user clicks, use `a click` (real mouse events), not
  `element.click()`.
- **Timing:** the dev server compiles a route on its first hit, so give it 10–15 s.
- **Ports 9222, 9333 and 9334 are Jason's own browser.** Never use or kill them.
- **There is one throwaway slot.** The developer, tester, designer and writer (for a document's
  screenshots) take turns on it. Each runs `anon.sh stop` before handing on.

**Access.**
- Passes are signed out unless the lead says Jason approved a sign-in for this task.
- A sign-in goes through the site's Login page with the seeded local accounts, never through a
  token request. Never read or print credential files.
- Signed-in screens nobody approved are reported as not tested.

**Local data.** The seeded data is placeholder text, and every reseed changes the IDs. Look IDs
up through the API (`snapshot.mjs` does) rather than reusing old ones. Since `77646a74`
(`post.sql`, local and DEV only):

- Categories (1–3 each), languages and skills vary per opportunity, and ordinary opportunities
  stay open for 30 days after seeding.
- 24 labelled search fixtures, titled "Search fixture NN - {type}", carry the new core fields:
  - a provider, engagement type and incentive, except every third fixture ("incomplete
    partner-like"), which has none of them;
  - accessibility Yes, No, Available on request or missing, with accommodation lists and one
    Other description;
  - age bounds, SDGs and targeted groups;
  - South African places in the Western Cape and Gauteng, and coordinates 5, 20, 60 and 150 km
    from Cape Town;
  - Worldwide on fixture 23 (alone) and 24 (with South Africa);
  - a past end date (07), a future start (08) and no end date (09).
- No user preferences or user location are seeded.
