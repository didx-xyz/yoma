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
- [ ] Deploy to Dev, then Stage. Register with phone (real SMS), log in with Google and Facebook, and check SendGrid email.
- [ ] Prod rollout with no 26.4.0 pod running next to a 26.8.1 pod (see Gotchas).

## Decisions

- 2026-10-14: Removed `realm-management` from the export. Since 26.7.0 the Admin API rejects any update to this client or its roles with 403, even for the master admin ([keycloak#51036](https://github.com/keycloak/keycloak/issues/51036), closed as intended). keycloak-config-cli failed on it. Keycloak still creates the client for every realm. I compared the removed entries with what a fresh 26.8.1 realm gets: all 19 exported roles exist with the same composites, and 26.8.1 adds three more (`manage-`, `query-` and `view-organizations`, all inside `realm-admin`). The client differs only in client scopes, which do not matter for this bearer-only client. Keeping the old entries would only have pinned a stale copy of the defaults. Role assignments to users and service accounts were never in this block.
- 2026-10-14: Bumped `keycloakVersion` in the export. With 26.4.0 there, a fresh realm import replays the 26.5 to 26.8 import migrations. `MigrateTo26_8_0` then adds the token-exchange delegation client scopes a second time (that feature comes in through `--features=preview`), and realm creation fails with HTTP 500 on `r_def_cli_scope_bind`. Upgrading an existing database does not hit this.
- 2026-10-14: Added `always_set_password_on_register_form: "true"` to the `registration-password-action` step of "Registration with phone". Since 26.7.0, a realm with `verifyEmail: true` hides the password fields at registration and asks for a password only after email verification. Our `register.ftl` renders the fields only when `passwordRequired` is set. Without the option the page rendered 0 password inputs; with it, 2. Keycloak marks the option as deprecated, so a later upgrade may force the new flow.
- 2026-10-14: Left `--features=preview` unchanged. On 26.8.1 it enables client-admin-api v2, http-optimized-serializers, oid4vc-vci, opentelemetry-logs, parameterized-scopes, scripts, spiffe, token-exchange-delegation and token-exchange v1. Narrowing it to the features we use is a separate change.
- 2026-10-14: Did not bump the keycloakx chart (7.1.4; latest is 7.3.2) or the webhook provider (0.9.1, built against 26.1.3). Both work on 26.8.1 locally.

## Gotchas

- Prod runs `replicas: 2`. Upgrade notes for 26.6 say the `OFFLINE_CLIENT_SESSION.REALM_ID` migration needs downtime: do not run 26.6+ next to an older version on the same database. A StatefulSet rolling update would do exactly that. Bring Prod to zero (or one) replicas before the new image starts.
- SMTP: since 26.8.1, `starttls: "true"` (set in the realm) fails the send if the server does not offer STARTTLS. SendGrid offers it, but check on Stage that mail still sends.
- Since 26.8.0, an email is marked verified only by email verification. Linking a brokered (Google or Facebook) account by email no longer sets `emailVerified`. The API copies `EmailVerified` into `EmailConfirmed` in `WebhookController`.
- Providers download from the `providers.ref` git ref at pod start. Merge the JARs together with the image bump.
- Keycloak logs that `KEYCLOAK_ADMIN` and `KEYCLOAK_ADMIN_PASSWORD` are deprecated (use `KC_BOOTSTRAP_ADMIN_*`). They still work on 26.8.1.
