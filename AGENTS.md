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

**At session start:**

1. Check `docs/work/active/` for the feature you are working on.
2. Read the feature document (`feature.md`) and the most recent file in its `handoffs/` folder before writing any code.
3. If starting new work, create a feature folder from `docs/work/templates/feature.md` first.

**During the session:**

4. Keep the task checklist and Decisions log in `feature.md` up to date as work progresses.

**At session end (mandatory):**

5. Write a handoff document in `docs/work/active/<feature-slug>/handoffs/` using `docs/work/templates/handoff.md`. Name it `YYYY-MM-DD-a.md` (increment the letter for multiple sessions per day).
6. Commit the handoff together with the code changes.

**On completion:**

7. When a feature ships, set `Status: shipped` in `feature.md` and move the folder: `git mv docs/work/active/<slug> docs/work/archive/<slug>`.

## Commit and PR Conventions

- Conventional commits: `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`.
- Keep commits scoped to one component where possible.
- PR titles follow the same convention; PRs merge with the PR number appended (e.g. `feat: opportunity details cleanup (#1912)`).

## General Rules for Agents

- Do not modify `helm/`, CI workflows (`.github/workflows/`), or `env.secrets` files unless explicitly asked.
- Never commit secrets or credentials.
- Prefer editing existing files over creating new ones; follow existing patterns in the component you are working in.
- Ask before introducing new dependencies.
