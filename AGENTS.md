# AGENTS.md — Yoma Monorepo

Guidance for AI coding agents (Claude Code, Codex, Cursor, Copilot, etc.) and humans working in this repository. Nested `AGENTS.md` files in subdirectories take precedence for work inside those areas.

## Project Overview

Yoma is a youth opportunities platform. This is a pnpm monorepo with three main components:

- `src/api` — .NET API backend (PostgreSQL, Swagger). See `src/api/AGENTS.md`.
- `src/web` — Next.js 15 / React 19 frontend (pages router, Tailwind, PWA). See `src/web/AGENTS.md`.
- `src/keycloak` — Keycloak authentication themes and providers.
- `helm/` — Kubernetes deployment charts.
- `docs/` — product and integration documentation. `docs/work/` holds active feature plans and session handoffs (see Workflow below).

## Ownership

- **API (`src/api`)**: Adrian
- **Web (`src/web`)**: Jason

Cross-area changes require a handoff note to the other owner (see Workflow). When a task touches the other person's area, keep changes minimal and flag them explicitly in the handoff.

## Toolchain and Setup

Runtimes are managed with [mise](https://mise.jdx.dev/) (see `mise.toml`): dotnet, node 24, pnpm 11, helm, tilt.

```bash
mise install                     # install all pinned runtimes
pnpm install --frozen-lockfile   # from repo root
docker-compose up -d             # local infrastructure (PostgreSQL, etc.)
```

Component-specific build, run, and test commands are documented in the nested `AGENTS.md` of each component.

## Workflow — Required for Every Session

All planned work is tracked in `docs/work/` (convention: `docs/work/README.md`).

Work is organised by **epic**, with a sub-folder per **Linear issue that warrants one**. Both are
named `<TICKET>-<linear-slug>`, taking the slug straight from the Linear URL:

```
docs/work/active/
  YOM-1244-customizable-fields-framework/          # epic (the Linear parent issue)
    README.md                                      # scope, ticket map, shared contract, blockers
    handoffs/2026-08-07-a.md                       # sessions spanning several children
    YOM-1260-ui-custom-field-filtering-for-.../    # one folder per child issue that earns one
      feature.md
      handoffs/2026-08-11-a.md
```

**Not every ticket gets a folder.** A `feature.md` that only restates its ticket title is worse
than none — it looks like documentation, so nobody writes the real thing. Create one when someone
will spend a session on it, when it carries decisions or a contract a future session must not
rediscover, or when it is blocked and the reason is worth recording. Otherwise it stays a checklist
row in the parent's Tasks, carrying the ticket id. The full test is in `docs/work/README.md`.

**At session start:**

1. Find the epic folder in `docs/work/active/`, then the sub-folder for the ticket you are working on.
2. Read the epic `README.md`, the feature's `feature.md`, and the most recent file in its `handoffs/` folder before writing any code.
3. If starting new work: create the epic folder from `docs/work/templates/epic.md` if it does not exist, then — **if the ticket warrants a folder** — the ticket folder from `docs/work/templates/feature.md`, and add a row for it to the epic README's child table. If it does not warrant one, add a checklist row to the parent's `feature.md` instead.

**During the session:**

4. Keep the task checklist and Decisions log in `feature.md` up to date as work progresses. Anything that affects sibling tickets belongs in the epic `README.md`, not copied into each feature doc.

**At session end (mandatory):**

5. Write a handoff document in `docs/work/active/<EPIC>-<slug>/<TICKET>-<slug>/handoffs/` using `docs/work/templates/handoff.md`. Name it `YYYY-MM-DD-a.md` (increment the letter for multiple sessions per day). A session that spans several child tickets — a branch sync, a cross-cutting refactor — may use the epic-level `handoffs/` folder instead; file it under a ticket whenever one clearly owns it.
6. Commit the handoff together with the code changes.

**On completion:**

7. When a ticket ships, set `Status: shipped` in its `feature.md`. Once every child has shipped, set the epic's status and move the whole epic: `git mv docs/work/active/<EPIC>-<slug> docs/work/archive/<EPIC>-<slug>`.

Three rules that keep these docs trustworthy:

- A handoff written after the fact must be marked `RECONSTRUCTED` in its title and name the commits it was rebuilt from — never present a reconstruction as a contemporaneous record.
- **Docs never cite branch commit SHAs.** `master` is squash-merged, so every branch SHA dies when the PR lands, and fixing citations afterwards costs another PR. Cite what outlives the squash: the **PR number** (`PR #2018` — GitHub keeps all of a PR's commits browsable under it), the **file path**, and for landed work the squashed master commit `… (#NNNN)` copied from `git log master`. Write "on PR #2018" or "see `src/web/e2e/…`", never `ec399e13f`. The only SHAs allowed are commits already on `master`, verified with `git merge-base --is-ancestor <sha> master`. If the source genuinely cannot be identified, say so instead of guessing.
- **Status is recorded once, in the feature's `feature.md`** — `planning` | `in-progress` | `review` | `shipped` | `blocked`, optionally followed by ` — <short qualifier>`. Epic README tables may repeat it for scanning, but the feature doc wins on conflict; do not invent parallel vocabularies.
- If an existing doc set has lost its provenance beyond recovery, replace it with a context pack (`docs/work/templates/context-pack.md`) rather than carrying dead citations forward.

## Linear vs `docs/work` — Where Things Belong

**Linear tracks status. `docs/work/` holds the technical detail.** Technical content in a ticket
goes stale the moment an AI session changes the design, and stale tickets are worse than empty
ones because they are read as current.

**Write every ticket, comment and status note for a BA or tester, not an engineer.** The reader
has not seen the code and should not need to. Concretely:

- Plain sentences a high-school reader follows. Say what a user sees or can do, and what changed
  for them — not how it is built. "Approving a submission now awards the skills it promised" beats
  "FinalizeVerification lost child items after AllocateRewards".
- No class, method, file, endpoint, table or commit names; no code blocks; no stack traces. If an
  engineer needs them, they go in `docs/work/` and the ticket links the folder.
- Spell out jargon the first time (ZLTO = the reward points youth earn; OTP = the one-time code
  sent by SMS). Prefer the product's own words (Submissions, Yo-ID, Cash out) over internal ones.
- Acceptance criteria are steps a tester can perform and a result they can see: "Sign in as a
  youth, open a completed learning opportunity, check the skill appears on the Yo-ID Skills tab."
- Comments follow the same rule: status, what to test, what is blocked and by whom. A note for an
  engineer belongs in the PR or `docs/work/`, with the ticket saying only that it exists.
- When something is wrong, state it like a bug report a tester could file: who is affected, what
  they expected, what happens instead, since when (if known), workaround (if any).

| Linear ticket                                                       | `docs/work/`                                                     |
| ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Problem, user-facing outcome, acceptance criteria in business terms | Endpoint shapes, payloads, schemas, migrations, class/file names |
| Scope boundaries and out-of-scope                                   | Implementation plan, decisions and their rationale               |
| Status, assignee, priority, parent/child links, blockers            | Task checklist, gotchas, session handoffs                        |
| A link to the epic/feature folder for the detail                    | Everything an engineer needs to resume work                      |

Rules:

- Do not paste endpoint definitions, model/DTO shapes, SQL, file paths, code or command output into a Linear ticket. Put them in `feature.md` (or the epic `README.md` if siblings depend on them) and link the folder from the ticket.
- New tickets follow `docs/work/templates/linear-epic.md` / `linear-issue.md`. A ticket that cannot be described without naming a class, endpoint or file is a task, not a ticket — fold it into a parent and let that parent's checklist carry it.
- Keep ticket titles stable — folder names derive from the ticket id and slug.
- When an AI session changes an approach, update `feature.md`'s Decisions log, not the ticket description. Update the ticket only if the _outcome or scope_ changed.
- Agents must not edit Linear ticket descriptions unless explicitly asked. Status changes and comments are expected (see lifecycle below) but, like every Linear write, need the user's go-ahead first.

**Ticket lifecycle (agents own steps 1–3):**

1. **Every piece of work has a ticket.** If none exists, propose one (title + the `linear-issue.md` block) and create it once the user agrees — unless the user says no ticket is wanted.
2. **Before pushing**, the ticket reflects reality: status `In Progress` → `In Review`, a comment linking the branch/PR and the `docs/work` folder, and the description updated only if the outcome or scope changed. Do this even when the PR and stage deployment are still unconfirmed — `In Review` is the honest state at that point.
3. **After the PR merges and deploys to stage**, the ticket moves to `Testing`. This is a manual step today — nothing in CI tells Linear a deploy happened. _Improvement noted:_ a post-deploy hook (GitHub Action on the deploy job → Linear API by ticket id in the branch name) would close this gap; not built yet.

## Confirmation Gate — Always

Agents **always ask the user before**: committing, pushing, creating a PR, and creating or updating a Linear ticket (status, comment or description). Prepare everything — staged diff, commit message, ticket text — then ask once with the exact action listed. A "go" covers the actions named in that question only, not later ones in the session.

## Commit and PR Conventions

- Conventional commits: `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`.
- Keep commits scoped to one component where possible.
- PR titles follow the same convention; PRs merge with the PR number appended (e.g. `feat: opportunity details cleanup (#1912)`).

## Web Tasks — Agent Roles (`src/web` only, opt-in)

The roles in `.claude/agents/` (`designer`, `developer`, `reviewer`, `tester`, `writer`) are
**off by default** and run only when Jason asks for them, for the task he asks about. When he
does, read `.claude/agents/README.md` for the flow, gates and browser tooling. Without the roles
the session does the work itself; the Confirmation Gate applies either way.

## General Rules for Agents

- Do not modify `helm/`, CI workflows (`.github/workflows/`), or `env.secrets` files unless explicitly asked.
- Never commit secrets or credentials.
- Prefer editing existing files over creating new ones; follow existing patterns in the component you are working in.
- Ask before introducing new dependencies.

## Automated Tests (`src/web`, Playwright)

- **Feature development and support work includes Playwright e2e tests.** A change to a user-visible flow adds or updates a spec under `src/web/e2e/`. The rules (one journey per behaviour, parallel-safe, `#id` locators, seed contract, `@smoke` tag) are in `docs/work/active/YOM-1311-automated-browser-tests-for-the-web-app/handoffs/2026-11-03-c.md` "How features must be tested"; the route checklist is `sitemap.md` in the same folder.
- Agents use the **`playwright-cli` skill** for exploring and debugging pages and the **local Playwright CLI** (`pnpm test:e2e …` from `src/web`) for running specs — not the ad-hoc CDP tooling, except where the agent roles section still calls for it.
- **CI runs the suite; every test must pass.** Tests are being applied retroactively to production code, so a spec that fails repeatably for reasons outside the change at hand is bypassed with `test.fixme(true, "YOM-NNNN: <why>")` — never deleted, never left red — and recorded in `known-gaps.md` (same folder). `pnpm test:e2e:gaps` lists the current fixmes so the register and the code cannot drift.
- Flows that cannot be exercised locally or in CI (Keycloak e-mail, real SMS, social IdPs, …) are listed in `known-gaps.md` as **not tested**, with the prerequisite that would unlock them. Do not claim coverage for them.
