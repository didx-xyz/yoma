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
- **Every commit SHA written into a doc must resolve.** A citation that does not is worse than none: it reads as provenance and cannot be followed. Copy hashes from `git log`, never from memory, and verify with `git cat-file -e <sha>^{commit}` before committing. If the source commits genuinely cannot be identified, write that instead of guessing.
- **Status is recorded once, in the feature's `feature.md`** — `planning` | `in-progress` | `review` | `shipped` | `blocked`, optionally followed by ` — <short qualifier>`. Epic README tables may repeat it for scanning, but the feature doc wins on conflict; do not invent parallel vocabularies.
- **When provenance cannot be verified, write a context pack** (`docs/work/templates/context-pack.md`) instead of carrying the handoffs forward — one document keeping every decision, contract and gotcha, dropping the session narrative. This fires on *unverifiable provenance* (pre-convention work, or SHAs squashed away on merge), **not** on restructuring: handoffs written live with resolving SHAs are better evidence than any summary, so `git mv` those and leave them alone. Never call a pack lossless — it is a reconstruction — never delete the source, and never pack a pack.

## Linear vs `docs/work` — Where Things Belong

**Linear tracks status. `docs/work/` holds the technical detail.** Technical content in a ticket
goes stale the moment an AI session changes the design, and stale tickets are worse than empty
ones because they are read as current.

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
- Agents must not edit Linear ticket descriptions unless explicitly asked.

## Commit and PR Conventions

- Conventional commits: `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`.
- Keep commits scoped to one component where possible.
- PR titles follow the same convention; PRs merge with the PR number appended (e.g. `feat: opportunity details cleanup (#1912)`).

## General Rules for Agents

- Do not modify `helm/`, CI workflows (`.github/workflows/`), or `env.secrets` files unless explicitly asked.
- Never commit secrets or credentials.
- Prefer editing existing files over creating new ones; follow existing patterns in the component you are working in.
- Ask before introducing new dependencies.
