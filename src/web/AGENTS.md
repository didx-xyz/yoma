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
