# Web agent roles (`src/web` only, opt-in)

Read this only when Jason has asked for the roles ("use the agent roles", "run this through
designer → developer → reviewer + tester", "just get a reviewer on this"). The root `AGENTS.md`
holds the always-on rules; this file holds the choreography.

The roles are `designer`, `developer`, `reviewer`, `tester` and `writer` (one file each in this
folder). The main session is the **lead**: it plans, delegates, passes results on and owns the
gates. API work is unaffected.

## Flow by change type

| Change                                                                                | Roles, in order                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visible to users: layout, styling, components, motion, copy                           | designer (spec) → **Jason approves** → developer (whole batch) → reviewer + tester in parallel → developer fixes once → reviewer (fix diff) + tester (failed checks) → designer (compare once, at the end) |
| Web logic with no visible change                                                      | developer (whole batch) → reviewer + tester → developer fixes once → reviewer (fix diff) + tester (failed checks)                                                                                          |
| Trivial: a typo, a comment, a one-line copy fix                                       | developer → tester (static checks only)                                                                                                                                                                    |
| A document for readers outside the team: testing guide, BA review pack, release notes | writer → reviewer (fact check against the code) → writer fixes → **Jason approves** before it is shared                                                                                                    |

## Keeping the cycle count low

Each pass has a fixed cost; repeated browser passes were why early role sessions took 9–10 hours.

- **Batch the work.** One batch, two at most (logic first, then visible changes). One review and
  one test cover the whole batch — never per surface or per task.
- **Settle decisions up front.** Ask Jason for spec approval and the roles' product calls together,
  at most four at a time. While Jason reviews the spec, a developer can build the logic batch.
- **Gates:** Jason approves the design spec before implementation; a reader-facing document before
  it is shared; every commit and push (root `AGENTS.md`, Confirmation Gate).
- **Fix rounds:** wait for both reviewer and tester, hand the developer every finding at once. The
  re-check is narrow: reviewer reads the fix diff, tester re-runs static checks and only the
  checks that failed or the fix touched. One round by default; a second only for what still
  fails, then stop and ask Jason. Leftover nits go in the handoff.
- **Browser checks belong to the tester.** The developer runs static checks and at most a quick
  look; the designer compares once, at the end, from a fresh agent.
- **Hand-offs go through files**, not chat: designer spec in the feature folder; writer document
  where the lead names it (a guide spanning tickets → epic folder, e.g. `testing/`); reviewer
  findings and tester report recorded in the session handoff by the lead.
- **One developer at a time**, in the main checkout — the running dev server serves it.
- **Other agents** (Codex, Cursor, …) without these roles follow the same steps themselves.

## Browser tooling for the roles

Use the `playwright-cli` skill (`playwright-cli open http://localhost:3000`, `snapshot`, `click`,
`fill`, `screenshot`, `resize 1440 900` / `resize 390 844`). It runs its own browser — never
attach to Jason's (ports 9222/9333/9334). Close the session before handing to the next role.
Specs run with `pnpm test:e2e …` from `src/web` (see `src/web/AGENTS.md`).

- **Local stack:** web on http://localhost:3000 (Jason runs `pnpm dev`), API on
  http://localhost:5000/api/v3 (docker compose in `src/api`). Roles never start, stop or restart
  them; if either is down, stop and tell the lead.
- **Timing:** the dev server compiles a route on its first hit — allow 10–15 s.
- **Access:** passes are signed out unless the lead says Jason approved a sign-in for this task.
  Sign in through the site's Login page with the seeded accounts in `src/web/e2e/seed.ts`, never
  via a token request. Never read or print credential files. Signed-in screens nobody approved
  are reported as not tested.
