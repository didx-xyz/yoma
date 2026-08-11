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

Work is organised by **epic**, with one sub-folder per **Linear issue**. Both are named
`<TICKET>-<linear-slug>`, taking the slug straight from the Linear URL:

```
docs/work/active/
  YOM-1244-customizable-fields-framework/          # epic (the Linear parent issue)
    README.md                                      # scope, ticket map, shared contract, blockers
    YOM-1260-ui-custom-field-filtering-for-.../    # one folder per child issue
      feature.md
      handoffs/2026-08-11-a.md
```

**At session start:**

1. Find the epic folder in `docs/work/active/`, then the sub-folder for the ticket you are working on.
2. Read the epic `README.md`, the feature's `feature.md`, and the most recent file in its `handoffs/` folder before writing any code.
3. If starting new work: create the epic folder from `docs/work/templates/epic.md` if it does not exist, then the ticket folder from `docs/work/templates/feature.md`, and add a row for it to the epic README's child table.

**During the session:**

4. Keep the task checklist and Decisions log in `feature.md` up to date as work progresses. Anything that affects sibling tickets belongs in the epic `README.md`, not copied into each feature doc.

**At session end (mandatory):**

5. Write a handoff document in `docs/work/active/<EPIC>-<slug>/<TICKET>-<slug>/handoffs/` using `docs/work/templates/handoff.md`. Name it `YYYY-MM-DD-a.md` (increment the letter for multiple sessions per day).
6. Commit the handoff together with the code changes.

**On completion:**

7. When a ticket ships, set `Status: shipped` in its `feature.md`. Once every child has shipped, set the epic's status and move the whole epic: `git mv docs/work/active/<EPIC>-<slug> docs/work/archive/<EPIC>-<slug>`.

A handoff written after the fact must be marked `RECONSTRUCTED` in its title and name the commits it was rebuilt from — never present a reconstruction as a contemporaneous record.

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
