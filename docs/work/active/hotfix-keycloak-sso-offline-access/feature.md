# Feature: Keycloak SSO for partner clients

## Meta

- **Feature**: Keep the Keycloak browser session alive after sign-in
- **Epic**: none (unticketed hotfix, reported by the IXO integration work)
- **Ticket**: none
- **Owner**: Adrian
- **Areas**: keycloak
- **Status**: review — stage rollout and sign-in lifetime decision pending
- **Started**: 2026-10-14

## Problem / Goal

After a user signs in to Yoma, Keycloak deletes their browser session when the code is exchanged for tokens. A partner that then tries single sign-on (IXO via `ixo-webos`, and the other partner clients) gets the login page instead of a silent sign-in.

The cause is `offline_access` as a default client scope. Since Keycloak 26.1, when the request that creates a session asks for `offline_access`, Keycloak keeps only the offline session and drops the browser session ([keycloak#32650](https://github.com/keycloak/keycloak/issues/32650); reversal declined in [#36921](https://github.com/keycloak/keycloak/issues/36921) and [#36717](https://github.com/keycloak/keycloak/issues/36717)). It started with the Keycloak 22.0.1 → 26.3.3 upgrade (#1517). Upgrading Keycloak further does not fix it.

## Out of Scope

- Changes to the web login flow (`src/web/src/server/auth.ts`). It uses the next-auth Keycloak default scopes and never asks for `offline_access` explicitly.
- Helm values and `secrets.yaml` files.
- The Swagger auth-code scopes in `src/api/.../appsettings.json`, which request `offline_access` explicitly. Swagger logins still end the browser session, which only affects developers.

## Plan

Realm config change in `src/keycloak/exports/01-yoma-realm.yaml`:

1. Move `offline_access` from `defaultClientScopes` to `optionalClientScopes` on every client that had it as a default: `yoma-web`, `yoma-api`, `atingi`, `goodwall`, `iiasa`, `ixo`, `ixo-webos`, `maza-app`, `unicef-kenya`, `mini-sass`. The P2E clients already had it as optional.
2. Move it from `defaultDefaultClientScopes` to `defaultOptionalClientScopes`, so clients created later do not bring the problem back.
3. Raise `ssoSessionIdleTimeout` from 30 min to 30 days and `ssoSessionMaxLifespan` from 10 h to 60 days. Refresh tokens are now tied to the browser session, so these values set how long users stay signed in. Keycloak 26 stores sessions in the database, so they survive pod restarts.

## Tasks

- [x] Realm export change
- [x] Reproduce and verify on local Keycloak 26.4.0
- [ ] Agree the sign-in lifetime (see Decisions)
- [ ] Tell partners that their refresh tokens are no longer offline tokens unless they ask for `offline_access`
- [ ] Roll out to stage and have IXO re-test silent SSO
- [ ] Enable `ixo-webos` on prod only after stage passes

## Decisions

- 2026-10-14: Option 1 from the report (optional `offline_access` plus longer SSO sessions) over option 2 (a second silent token request on every web login). Option 1 is config only and is what the Keycloak maintainers recommend.
- 2026-10-14: Proposed lifetime is 30 days idle and 60 days maximum. Before this change, web users kept an offline session with a 30-day idle timeout and no maximum. The 60-day maximum is new and is a product and security call; change it in the PR if it is not agreed.

## Links

- PRs: see the latest handoff
- Related: #1517 (Keycloak 26 upgrade)
