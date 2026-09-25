# Feature: Validate silent sign-on and agree IXO Auth Hub changes

## Meta

- **Feature**: Phase 0 — spikes and IXO asks
- **Epic**: [YOM-22](../README.md)
- **Ticket**: [YOM-23](https://linear.app/ixo-world/issue/YOM-23/validate-silent-sign-on-and-agree-ixo-auth-hub-changes) (ixo-world Linear)
- **Owner**: Shaun (coordination) · Jason (web spike review) · IXO team (hub)
- **Areas**: both
- **Status**: in-progress
- **Started**: 2026-09-20

## Problem / Goal

The epic's design was derived from reading code in four repos. Three assumptions decide whether the
user experience is good or merely possible — silent SSO, phone-only users, and DID forking — and
none has been observed. This ticket observes them, proves the SDK builds in Yoma web without
touching the initial bundle, and gets the Auth Hub changes drafted and agreed. No production Yoma
code ships from here.

## Out of Scope

- Anything that merges to `master` in `src/` (Phase 1 onward). Spike branches are throwaway.
- Pushing or deploying Auth Hub changes — drafts only until the IXO team reviews.

## Plan

Spikes run against `test.auth.ixo.earth` + stage Keycloak using the hub's own `demo-auth-app`
(no Yoma code needed), except S4/S5 which are local Yoma web builds on a spike branch.

## Tasks

Spikes — record the observed result under Decisions:

- [ ] S1 Silent SSO: signed-in stage YoID user → hub `/api/auth/login?organization_id=…`. Does
      Keycloak re-prompt for credentials? (Hub sends `prompt: 'login'` to WorkOS.)
- [ ] S2 Phone-only user (no email): does WorkOS accept the profile? Repeat with a synthetic
      `<sub>@id.yoma.world` mapper on `ixo-webos`. Then add a real email and confirm the DID is unchanged.
- [ ] S3 DID fork: same email via AuthKit-Google, then via Keycloak SSO → one DID or two?
- [x] S4 SDK build — **passed 2026-09-20**, see [S4 results](#s4-results).
- [ ] S5 `@ixo/oracles-chain-client` import with a runtime `process.env` shim (Phase 4 de-risk).
- [ ] S6 Redirect round-trip in Android Chrome installed PWA and the WhatsApp in-app browser.

Auth Hub drafts (`ixoworld/ixo-auth-hub`, local branches for IXO review):

Drafted 2026-09-20 as **local, unpushed** branches in a scratch clone (see handoff for the path and
commit ids). Each needs IXO team review before it goes anywhere.

- [x] H1 drafted — branch `yoma-web-client`: `yoma-web` client per env with `.invalid` placeholder
      hosts. Still needed: real Yoma web host per env, WorkOS org id per env.
- [x] H2 drafted — branch `sso-prompt-passthrough`: opt-in `prompt=inherit` (only valid with
      `organization_id`); default stays forced re-auth because the hub hands out signing keys on
      shared devices. 8 new tests pass. **Caveat:** WorkOS docs suggest `provider_query_params`
      only applies to OAuth providers, so forced re-auth may not reach Keycloak today — S1 decides.
- [ ] H3 **blocked** — branch `partner-lookup-external-id` is a design note only. The hub never
      receives the Keycloak `sub`; nothing verified to index. Unblock options in the epic README.
- [x] H4 drafted — branch `scoped-exchange`: optional `scope` (`session|matrix|ucan|email`),
      default = full bundle, scope-aware remembered consent, migration `0019`. 19 new tests pass.
      Yoma sends `scope=session` and then gets no email from the hub unless it also asks for `email`.
- [ ] H5 (ask) Account-link step when an SSO arrival matches an existing account's verified email.
- [ ] H6 (ask) Confirm session-key authenticator scope and lifetime with the IXO team.
- [ ] H7 (ask) PIN-less partner mode or pre-provision API — would allow DID creation at registration
      via Yoma's `WalletCreation`-style background pattern. Plan B for a non-silent federation:
      `partner-login` accepting a Keycloak JWT.
- [ ] H8 (ask) Agree hub client-hardening settings for Yoma prod; partner key per env; feegrant
      policy at Yoma scale.

Other:

- [ ] Confirm env → network mapping and the Yoma web host per env.
- [ ] Find out what `ixofoundation/jambo-yoma-worker` does.
- [ ] Confirm which oracle backend Phase 4 targets (decides `oracles-client-sdk` vs `assistant-sdk`).
- [ ] Name an owner for the data-protection review.

## S4 results

Run 2026-09-20 on a local throwaway worktree (branch `spike/yom-23-ixo-sdk-build`, never committed),
Node 26.7 rather than the pinned 24.

- `@ixo/impactxclient-sdk@3.1.0` + `typescript@5.9.3`: `next build --webpack` exits 0.
- **No webpack polyfill needed.** In the browser `createQueryClient` read the devnet latest block
  (`devnet-1`), and `DirectSecp256k1HdWallet.generate` + `utils.did.generateSecpDid` worked with
  `globalThis.Buffer` undefined. No CORS issue on `devnet.ixo.earth/rpc`. Signing and contract paths
  were not exercised — re-check Buffer there in Phase 2.
- First-load JS (gzip, sum of build-manifest files): `/_app` 654.9 → 654.8 KB, `/yoid` 660.1 →
  660.0 KB, `/` 685.4 → 685.3 KB. The SDK lands only in 4 new async chunks (+1.2 MB raw).
- TS 5.9 surfaces exactly one error: `src/lib/organisation/serverErrors.ts:67` uses the regex `s`
  flag with `"target": "es2017"`. Fix: `"target": "es2018"` in `tsconfig.json` (type-check only; SWC
  emits). Belongs in the TypeScript prep PR.
- pnpm 11 fails install on the undeclared `protobufjs` postinstall; add `protobufjs: false` under
  `allowBuilds` in `pnpm-workspace.yaml` (the script only prints a notice).
- Local prod build needs `CI=true` (otherwise `/marketplace/[country]` calls the API at build and
  fails) and a build-time `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`:

```bash
CI=true NEXT_PUBLIC_ENVIRONMENT=local NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=x SKIP_ENV_VALIDATION=1 next build --webpack
```

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-09-20: Key provisioning goes through the Auth Hub via the existing Keycloak→WorkOS SSO
  connection, not server token exchange or client-side key generation (Shaun). Token exchange stays
  as plan B (H7).
- 2026-09-20: Auth Hub code changes are in scope for this epic (Shaun).
- 2026-09-20: Phase 3 covers all four features: IXO identity on YoID, portal hand-off, completion
  claims, org entity DIDs (Shaun).
- 2026-09-20: Link proof is **email-based** for now — drafting H3 showed the hub has no verified
  Keycloak subject. Consequence: phone-only users need a deterministic synthetic email (S2) that
  the Yoma API can recompute for the partner lookup.
- 2026-09-20: S4 passed — no Buffer/crypto polyfill is needed for SDK reads and key derivation, so
  Phase 2 drops the planned `webpack()` hook unless signing proves otherwise. TypeScript prep PR =
  `typescript` 5.9.x + `target: es2018` + `protobufjs` build policy.
- 2026-09-20: `@ixo/jambo-wallet-sdk` and `@ixo/assistant-sdk` evaluated and not adopted by default;
  reasons in the epic README.

## Links

- Epic: [YOM-22](../README.md)
- Ticket: [YOM-23](https://linear.app/ixo-world/issue/YOM-23/validate-silent-sign-on-and-agree-ixo-auth-hub-changes)
- PRs:
- Related: `docs/sso/README.md`; hub reference client `ixoworld/ixo-auth-hub` `demo-auth-app/`;
  production client `ixoworld/ixo-portal` `hooks/useAuthHubLogin.ts`, `lib/authHub/*`
