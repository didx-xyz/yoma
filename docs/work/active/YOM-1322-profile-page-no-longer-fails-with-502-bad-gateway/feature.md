# Feature: Profile page 502 — one session cookie per response

## Meta

- **Feature**: Stop server-rendered pages sending one copy of the session cookie per API prefetch
- **Epic**: none (hotfix, reported by Adrian from stage on 2026-11-18)
- **Ticket**: [YOM-1322](https://linear.app/didx/issue/YOM-1322)
- **Owner**: Jason
- **Areas**: web
- **Status**: review — PR #2039
- **Started**: 2026-11-18

## Problem / Goal

On stage, `/user/profile` intermittently returned `502 Bad Gateway` with `server: awselb/2.0` — both the
client-side data request (`/_next/data/…/user/profile.json`) and the full-page fallback. Signing out and
back in cleared it. Jam: https://jam.dev/c/32dbe72d-2f51-4ffa-b82c-c0b12bf063ad

Root cause (reproduced locally, see Decisions): every `getServerSession` call in next-auth v4 re-encodes
the JWT and **appends** the chunked `next-auth.session-token.{0,1}` cookie to `Set-Cookie`
(`next-auth/next/utils.js` `setCookie` pushes onto the existing header). `ApiServer(context)` created a new
axios instance per service call, each with its own `lastSession` cache, so a page that prefetched four
queries resolved the session five times and sent **five copies** of a ~5–6.5 KB cookie pair — 27–33 KB of
`Set-Cookie`. AWS ALB rejects any target response whose headers exceed 32 KB with a 502
([ALB troubleshooting](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-troubleshooting.html),
"The target response header exceeded 32 K"). Which users hit it depends on their Keycloak token size
(roles, `adminsOf`, refresh-token payload), hence "intermittent" and "fixed by re-login".

Same root cause as [YOM-176](https://linear.app/didx/issue/YOM-176) (2024, admin on stage); that was
mitigated on the SRE side (internal ALB → NLB) and the web multiplication was never removed.

## Out of Scope

- Shrinking the JWT itself (dropping `idToken`, trimming `user`). One copy is ~6.5 KB, well under the limit.
- Ingress / load-balancer configuration (Robbie).
- Pages that render without a session (`getStaticProps`) — `ApiServer` still sends no `Authorization` there.

## Plan

1. `src/web/src/server/auth.ts` — `getServerAuthSession(ctx)` memoises the `getServerSession` promise per
   `ctx.req` in a `WeakMap`. One resolution per incoming request; concurrent callers inside a `Promise.all`
   share the in-flight promise.
2. `src/web/src/lib/axiosServer.ts` — the request interceptor calls `getServerAuthSession(context)` instead
   of `getServerSession` + a per-instance `lastSession` cache (whose expiry check compared against the
   30-day NextAuth session expiry, so it never refreshed anyway).
3. Every page `getServerSideProps` (42 files) calls `getServerAuthSession(context)` instead of
   `getServerSession(context.req, context.res, authOptions)`; `authOptions` is now imported only by
   `pages/api/auth/[...nextauth].ts` and `server/auth.ts`.

Net effect: one `Set-Cookie` pair per response regardless of how many API calls the page makes.

## Tasks

- [x] Reproduce locally: replay a saved e2e session against `pnpm dev`, measure response-header bytes
- [x] Memoise session per request (`getServerAuthSession`)
- [x] Migrate `ApiServer` and all 42 pages
- [x] Re-run the loop: 10 → 2 `Set-Cookie` lines, 32.9 KB → 6.8 KB (orgAdmin)
- [x] `tsc`, eslint, prettier clean; `e2e/youth/profile.spec.ts` green
- [x] Linear ticket created and linked here
- [x] PR opened, ticket → In Review
- [ ] Robbie: confirm ALB access logs at 2026-11-18 08:12:59–08:13:00 SAST show the 502 as a target
      response-header rejection (closes the loop on the hypothesis; not blocking)

## Decisions

- 2026-11-18: Memoise per request rather than thread a `session` argument through every service
  signature. Services take `context` already; keying on `context.req` fixes all 100+ `ApiServer(context)`
  call sites without touching them, and dedupes concurrent calls.
- 2026-11-18: No new e2e spec. The failure is a header-size limit a Playwright test against the dev server
  cannot observe (no ALB in the loop). The repro is a curl loop (recorded in the handoff); the existing
  `e2e/youth/profile.spec.ts` covers the page still rendering with the Bearer token attached.

## Links

- Ticket: [YOM-1322](https://linear.app/didx/issue/YOM-1322)
- PRs: [#2039](https://github.com/didx-xyz/yoma/pull/2039)
- Related: [YOM-176](https://linear.app/didx/issue/YOM-176) — 2024 occurrence, same mechanism
