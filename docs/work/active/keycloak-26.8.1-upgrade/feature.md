# Keycloak 26.4.0 to 26.8.1 upgrade

Status: review — local upgrade smoke passed; Dev/Stage rollout not yet done

## Scope

Upgrade the Keycloak server from 26.4.0 to 26.8.1 in Helm and local compose. Rebuild the custom provider JARs against 26.8.1 and adjust the realm export so keycloak-config-cli still imports cleanly. No API or web changes.

## Tasks

- [x] Bump the Keycloak image (Helm values, chart `appVersion`, compose) to 26.8.1.
- [x] Bump keycloak-config-cli from `6.4.0-26.1.0` to `6.5.1-26.5.5` (newest published build; there is no 26.6+ build).
- [x] Set `version.keycloak` to 26.8.1 in the providers POM and rebuild all five JARs. They compile on Java 17 with no source changes.
- [x] Set `keycloakVersion: 26.8.1` in `01-yoma-realm.yaml`.
- [x] Remove the `realm-management` client and its client roles from the realm export.
- [x] Keep the password fields on the registration form (`always_set_password_on_register_form`).
- [x] Local smoke test: fresh install, and a 26.4.0 database upgraded in place.
- [x] Helm upgrade of an existing 26.4.0 deployment on a local kind cluster, deployed the way CI does it (see "Helm upgrade test" below).
- [x] Rollout plan: keep `replicas: 2` and the normal rolling update; raise the `helmDefaults` timeout in `helmfile.yaml.gotmpl` from 300 to 600 seconds for every release.
- [x] Before merging, search the Keycloak logs in Datadog for `type="TOKEN_EXCHANGE"` in each environment (see the feature flags decision). Done on 2026-10-19 by Robbie: no occurrences in any environment. Datadog keeps 7 days of logs, so this covers only that window; something that exchanges tokens less than weekly would not show up.
- [ ] Deploy to Dev, then Stage. Register with phone (real SMS), log in with Google and Facebook, and check SendGrid email.
- [ ] Prod rollout.

## Decisions

- 2026-10-14: Removed `realm-management` from the export. Since 26.7.0 the Admin API rejects any update to this client or its roles with 403, even for the master admin ([keycloak#51036](https://github.com/keycloak/keycloak/issues/51036), closed as intended). keycloak-config-cli failed on it. Keycloak still creates the client for every realm. I compared the removed entries with what a fresh 26.8.1 realm gets: all 19 exported roles exist with the same composites, and 26.8.1 adds three more (`manage-`, `query-` and `view-organizations`, all inside `realm-admin`). The client differs only in client scopes, which do not matter for this bearer-only client. Keeping the old entries would only have pinned a stale copy of the defaults. Role assignments to users and service accounts were never in this block.
- 2026-10-14: Bumped `keycloakVersion` in the export. With 26.4.0 there, a fresh realm import replays the 26.5 to 26.8 import migrations. `MigrateTo26_8_0` then adds the token-exchange delegation client scopes a second time (that feature comes in through `--features=preview`), and realm creation fails with HTTP 500 on `r_def_cli_scope_bind`. Upgrading an existing database does not hit this.
- 2026-10-14: Added `always_set_password_on_register_form: "true"` to the `registration-password-action` step of "Registration with phone". Since 26.7.0, a realm with `verifyEmail: true` hides the password fields at registration and asks for a password only after email verification. Our `register.ftl` renders the fields only when `passwordRequired` is set. Without the option the page rendered 0 password inputs; with it, 2. Keycloak marks the option as deprecated, so a later upgrade may force the new flow.
- 2026-10-14: Removed `--features=preview,declarative-ui` from `helm/keycloak/values.yaml` and `src/api/docker-compose.yml`. Nothing in the repo uses the features these flags turn on:
  - On 26.4.0 they turn on client-auth-federated, client-secret-rotation, log-mdc, scripts, spiffe and token-exchange v1.
  - On 26.8.1 they turn on client-admin-api v2, http-optimized-serializers, oid4vc-vci, opentelemetry-logs, parameterized-scopes, scripts, spiffe, token-exchange-delegation and token-exchange v1. Token-exchange-delegation caused the fresh-import failure described above.
  - The realm has no script mappers, client policies, SPIFFE or federated client authentication, or fine-grained admin permissions. Its two `standard.token.exchange.enabled` entries are `"false"`, and no code requests a token exchange.
  - `declarative-ui` is an experimental admin-console feature for providers that define UI pages; none of ours do.
  - The flags date from Keycloak 22: `preview,declarative-user-profile` was added in #272, when declarative user profile was a preview feature. Keycloak now always enables it. The 26.3.3 upgrade (#1517) replaced `declarative-user-profile` with `declarative-ui`.
  - Tested locally with the full compose stack. A fresh install without the flags, and a 26.4.0 stack running with the flags upgraded in place, both imported cleanly. Keycloak logged no errors and reported no preview or experimental features. Email registration with verification, phone registration, password login, refresh, the API with a user token, partner user creation, and the `REGISTER` and `LOGIN` webhooks all worked. A user created before the upgrade could still log in.
  - The one behaviour change: `yoma-web` exchanging its own access token (`grant_type=urn:ietf:params:oauth:grant-type:token-exchange`) returned a token on 26.4.0 with the flags, which is legacy token exchange v1. On 26.8.1 without the flags it returns `invalid_request`. Standard token exchange stays available, but no client has `standard.token.exchange.enabled` set to `"true"`. No code in the repo uses token exchange. The repo can't show whether an outside party or a setting made by hand in an environment does, so check the event logs before merging.
  - Also removed `-Dkeycloak.profile.feature.upload_scripts=enabled` from `JAVA_OPTS_APPEND` in `values.yaml` and `conf/local/values.yaml`. Keycloak reads `keycloak.profile.feature.<name>` only for features it knows (`PropertiesProfileConfigResolver`), and `upload_scripts` hasn't existed since Keycloak 18, so on 26.x the property did nothing.
- 2026-10-14: Did not bump the keycloakx chart (7.1.4; latest is 7.3.2) or the webhook provider (0.9.1, built against 26.1.3). Both work on 26.8.1 locally.
- 2026-10-14: Bumped the Datadog init libraries in the pod annotations to the newest published images. Each tag matches the `latest` digest in `gcr.io/datadoghq` (checked with `crane`): Java `v1.63.0` to `v1.67.1` (Keycloak), .NET `v3.45.0` to `v3.55.0` (API) and Node `v5.105.0` to `v6.20.1` (web). For .NET, `v3.55.1` is released on GitHub but has no `dd-lib-dotnet-init` image yet. It speeds up query-string obfuscation, and the `v3.45.0` run logged one obfuscation timeout. Node v6 is a major release. It drops Node 18 and 20 (the web image runs Node 24); its other breaking changes are in test optimisation, AppSec, LLM Observability and GraphQL, which the web app does not use. I checked each tracer locally on arm64, like Prod, by mounting the init image's package the way the admission controller does:
  - Keycloak 26.8.1, with the full realm and providers, started under both Java agents and served login, registration, SMS and token requests.
  - The API under both .NET tracers served authenticated requests and processed the `REGISTER` and `LOGIN` webhooks.
  - The built `yoma-web` image under Node `v5.105.0` and `v6.20.1` returned 200 for `/`, `/organisations`, `/api/auth/providers` and `/api/auth/csrf`, and logged the same errors under both. Those errors come from config that does not exist locally (`NEXT_PUBLIC_API_BASE_URL`, the client environment fetch).

## Gotchas

- Dev, Stage and Prod run `replicas: 2`, and a normal rolling update runs 26.4.0 and 26.8.1 side by side. The kind test reproduced the result the upgrade notes warn about: offline sessions created by the old pod during the overlap are invisible to 26.8.1, so those users are logged out. Accepted on 2026-10-14; we are not worried about these logouts.
- CI deploys with `helmfile apply` and `helmDefaults` of `atomic: true`. The timeout was 300 seconds. If an upgrade runs past the timeout after the database has migrated, Helm rolls back to 26.4.0, and 26.4.0 on a 26.8.1 schema returns HTTP 500 on the login page. The two-replica upgrade on kind took 272 of 300 seconds, mostly pulling images, so `helmDefaults.timeout` is now 600 for every release. If a rollback does happen, fix forward by deploying 26.8.1 again; don't stay on 26.4.0.
- SMTP: since 26.8.1, `starttls: "true"` (set in the realm) fails the send if the server does not offer STARTTLS. SendGrid offers it, but check on Stage that mail still sends.
- Since 26.8.0, Keycloak marks an email verified only through email verification ([keycloak#50946](https://github.com/keycloak/keycloak/pull/50946)). That change touches three places. The first is the "link by email" confirmation (`idp-email-verification`); our Google and Facebook first-login flows (`auto-link-social`, `auto-link-facebook`) do not use it. The second is password reset by email. The third is admin "execute actions" emails that leave out Verify Email; the API sends `send-verify-email` instead. Tested on 26.4.0 and 26.8.1 with a fake OIDC provider bound to our real flows, with `trustEmail: true`, and got the same result on both:
  - A new user created through the provider gets `emailVerified = true`.
  - An existing unverified account gets linked but stays unverified and is sent to Verify Email.
  - Resetting a password by email leaves an unverified account unverified and sends a verification email.
  - Nothing changes for the API's `EmailConfirmed`. One side effect: an admin's "Credential reset" email from the admin console no longer verifies the address unless Verify Email is one of the actions.
- Providers download from the `providers.ref` git ref at pod start. Merge the JARs together with the image bump.
- Keycloak logs that `KEYCLOAK_ADMIN` and `KEYCLOAK_ADMIN_PASSWORD` are deprecated (use `KC_BOOTSTRAP_ADMIN_*`). They still work on 26.8.1.

## Helm upgrade test

Run on 2026-10-14 against a local kind cluster with one control-plane node and two workers in different zones, so Prod's required pod anti-affinity applies. The chart was deployed with `values.yaml`, `conf/prod/values.yaml` and a local override for ingress, memory, secrets and the config-cli URL. Each install used the same `--set *.ref=<sha>` flags as CI, plus `--wait --atomic --timeout 300s` to mirror `helmDefaults`.

- Baseline: 26.4.0 from `master` (`a1f96612`), 2 replicas, config-cli import passed. Seeded an email user with a password, a user with a temporary password, a phone user with an OTP credential, and an offline refresh token.
- Two-replica upgrade to this branch: completed in 272 seconds. The StatefulSet replaced `keycloak-1` first; it migrated the schema while `keycloak-0` (26.4.0) kept serving. A probe inside the cluster saw no failed request. Afterwards the database held 140 `yoma-web` offline client sessions but Keycloak reported 138. The 2 missing rows had `REALM_ID` null, written by the 26.4.0 pod after the migration. The two versions also formed separate Infinispan clusters during the overlap.
- Rollback after migration (what `atomic` does on timeout): the 26.4.0 pods started and reported ready, but logged `column ipe1_0.organization_id does not exist`, the login page returned HTTP 500, and config-cli failed with HTTP 500.
- One-replica upgrade (`--set keycloak.replicas=1`) from a fresh baseline: completed in 114 seconds with the image already cached on the node. Keycloak was unreachable for about 67 seconds. No `REALM_ID` null rows. Raising replicas back to 2 afterwards added `keycloak-1` without restarting `keycloak-0` and without failed requests.
- After both upgrade paths: the pre-upgrade refresh token still worked, all seeded users could log in (the temporary-password user got `UPDATE_PASSWORD`), the phone user's attributes were intact, `realm-management` had 22 roles, and the registration password option was applied.

## Upgrade check after the SSO session fix

The tests above ran before #1973, which made `offline_access` an optional scope and raised the SSO session timeouts to 30 days idle and 60 days maximum. Their offline-token results (`refresh_expires_in`, offline session counts) describe the realm before that change.

After rebasing onto #1973, I ran the Keycloak-only compose stack on 2026-10-15. It started on `master` (26.4.0 with #1973), I logged in through the browser flow, and then I upgraded the same database in place to this branch:

- **Before the upgrade:** the login returned a `Refresh` token (not `Offline`) with `refresh_expires_in` of `2592000`, and the browser SSO session survived the code exchange (`prompt=none` returned a code).
- **After the upgrade:** config-cli imported cleanly. The pre-upgrade SSO session and refresh token still worked. A new login behaved the same as before the upgrade.
- **Explicit `offline_access`:** requesting the scope still returns an `Offline` token and drops the browser session, the Keycloak 26.1+ behaviour #1973 describes.
- **Errors:** the only Keycloak errors were webhook delivery failures, because the stack ran without the API.
