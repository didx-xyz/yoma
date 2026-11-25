# Feature: ixo-auth-hub Keycloak client

## Meta

- **Feature**: `ixo-auth-hub` client in the `yoma` realm
- **Epic**: [YOM-1324](../README.md)
- **Ticket**: [YOM-1324](https://linear.app/didx/issue/YOM-1324)
- **Owner**: Robbie
- **Areas**: keycloak
- **Status**: review — PR #2044 deployed to Dev; Prod disabled until IXO tests on Stage
- **Started**: 2026-11-25

## Problem / Goal

IXO's Auth Hub needs its own confidential OIDC client so it can sign Yoma users in without WorkOS. IXO's spec: authorization code flow only, a client secret, PKCE with S256, RS256 ID tokens, scopes `openid profile email phone`, no `offline_access`, exact callback URIs, post-logout URIs with a trailing `*`, no web origins.

## Out of Scope

- Changes to `ixo-webos`.
- Client secrets in `helm/keycloak/conf/*/secrets.yaml`. Robbie adds them.

## Plan

The client is in `src/keycloak/exports/01-yoma-realm.yaml`, after `ixo-webos`. Per-environment values:

| Env var | Where | Value |
| --- | --- | --- |
| `CLIENT_IXO_AUTH_HUB_ENABLED` | `helm/keycloak/values.yaml`, `conf/prod/values.yaml`, compose | `"true"` by default, `"false"` in Prod |
| `CLIENT_IXO_AUTH_HUB_REDIRECT_URIS` | `conf/{local,dev,stage,prod}/values.yaml`, compose | JSON array |
| `CLIENT_IXO_AUTH_HUB_POST_LOGOUT_REDIRECT_URIS` | same | one string joined with `##` |
| `CLIENT_IXO_AUTH_HUB_SECRET` | `conf/{dev,stage,prod}/secrets.yaml` under `config-cli.secrets`, compose | per environment |

Local, Dev and Stage use IXO's non-production hubs (`dev.auth.ixo.earth`, `test.auth.ixo.earth`). Prod uses `auth.ixo.earth`.

## Tasks

- [x] Add the client to the realm export
- [x] Add env values for compose, Local, Dev, Stage and Prod
- [x] Verify on the local compose stack (see Decisions, 2026-11-25)
- [x] Add `CLIENT_IXO_AUTH_HUB_SECRET` to Local, Dev, Stage and Prod `secrets.yaml`
- [x] Deploy to Dev
- [ ] Merge PR #2044, which deploys to Stage, then send IXO the Stage client ID and secret
- [ ] IXO tests on Stage
- [ ] Enable on Prod (`CLIENT_IXO_AUTH_HUB_ENABLED: "true"`) and send the Prod secret

## Decisions

- 2026-11-25: Multi-value URIs come from one env var each. keycloak-config-cli substitutes variables into the raw file before it parses YAML (`KeycloakImportProvider.substituteImportResource`, v6.5.1), so `redirectUris: $(env:X)` with `X='["a","b"]'` becomes a YAML list. `post.logout.redirect.uris` is a string attribute, so its env var uses Keycloak's `##` separator. New clients with several URIs should follow this pattern. Existing single-URL clients are unchanged.
- 2026-11-25: No env var defaults. With `import.var-substitution.undefined-is-error=true` (the config-cli default), a missing secret or URI fails the import loudly instead of creating a client with an empty secret.
- 2026-11-25: `basic` is a default scope. Since Keycloak 25 `auth_time` comes only from the `basic` scope mapper. `ixo-webos` and the realm's `defaultDefaultClientScopes` do not include `basic`.
- 2026-11-25: `fullScopeAllowed: false` and no `roles`, `yoma-api` or `audience_scope` scopes. The hub does not call the Yoma API, so tokens carry no roles or Yoma API audience.
- 2026-11-25: `frontchannelLogout: false`. IXO gave no front-channel logout URL.
- 2026-11-25: Verified on the local compose stack (Keycloak 26.8.1, config-cli 6.5.1) with a password user carrying email and a verified phone:
  - config-cli imported cleanly. The client had both redirect URIs, the `##` post-logout string, PKCE S256, RS256 and default scopes `basic profile email phone` with no optional scopes.
  - Code flow with PKCE and the secret returned an RS256 ID token with `iss`, `sub`, `auth_time`, `email`, `email_verified`, `phone_number` and `phone_number_verified`.
  - Requests without PKCE, with `plain` PKCE, with `offline_access` (`invalid_scope`), with a wrong or suffixed callback, or with a wrong secret all failed.
  - Silent SSO returned a code. `prompt=login` and `max_age=0` both showed the login form, and `auth_time` advanced after the new sign-in.
  - Logout redirected to `.../logged-out?foo=bar`. An unlisted post-logout URI was rejected.
  - `sub` stayed the same after the user's email and phone number changed.

## Gotchas

- The issuer follows the request host (`--hostname-strict=false`). IXO must use `https://stage.yoma.world/auth/realms/yoma` and `https://yoma.world/auth/realms/yoma`. `auth.` and `keycloak.` hosts give different issuers.
- The deployed realm file comes from git at the deployed commit. Merging without the secrets in Dev, Stage and Prod `secrets.yaml` fails the config-cli import on the next deploy, including Prod, where the client is disabled.
- `max_age=0` re-prompts only once the last sign-in is at least one second old (`OIDCLoginProtocol.isAuthTimeExpired`). IXO also sends `prompt=login`, so this does not matter in practice.
- Google and Facebook users see the Keycloak login page again, but Google or Facebook may sign them back in without a password.
- A user who deletes their account and registers again gets a new `sub`. A Dev reset changes every `sub`.

## Links

- Epic: [YOM-1324](../README.md)
- Ticket: [YOM-1324](https://linear.app/didx/issue/YOM-1324)
- PRs: [#2044](https://github.com/didx-xyz/yoma/pull/2044)
- Related: YOM-1298 and YOM-1300 (`ixo-webos`), YOM-1299 (`offline_access` and SSO sessions)
