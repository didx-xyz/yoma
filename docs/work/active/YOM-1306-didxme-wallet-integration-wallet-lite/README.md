# Epic: YOM-1306 — didx:me wallet integration (Wallet Lite)

## Meta

- **Epic**: [YOM-1306](https://linear.app/didx/issue/YOM-1306)
- **Owners**: Adrian (api) · Jason (web)
- **Areas**: both (api-heavy; keycloak realm config; web last)
- **Status**: planning
- **Started**: 2026-10-27
- **Branch**: `feature/yom-1306-didxme-wallet-integration-wallet-lite` — docs only so far, not load-bearing

## Why This Epic Exists

Yoma issues verifiable credentials through Aries CloudAPI. Those wallets are Yoma-internal: a youth
can see their credentials on `/yoid/passport` but nowhere else, and no other service can ask for
them. didx:me gives every participant a real, user-owned wallet (the didx:me app) that other
ecosystem services already target. This epic makes didx:me a selectable SSI provider behind Yoma's
existing `ISSIProviderClient` abstraction: Yoma keeps scheduling and replaying issuance exactly as
it does today, but tenants become didx:me wallets, Yoma organisations issue into them, and the
user's wallet view is read from didx:me — with the user signed in to Yoma only once (SSO between
the two Keycloaks via a JWT authorization grant). Aries CloudAPI stays as the fallback provider
per environment.

The technical plan, provider mapping and open decisions are in [`plan.md`](./plan.md).

## Child Features

| Folder | Ticket | Area | Status |
| ------ | ------ | ---- | ------ |
| — | — | — | — |

Tickets with no folder yet — create tickets, then folders, when work starts (proposed split, see
`plan.md` § Phases):

| Ticket | Area | Note |
| ------ | ---- | ---- |
| _tbc_ — Provider adapter | api | `Yoma.Core.Infrastructure.DidxMe` implementing `ISSIProviderClient`; provider switch in `Startup.cs`. The bulk of the work. |
| _tbc_ — Identity federation | api + keycloak | Yoma realm audience mapper; didx:me user onboarding + IdP link per Yoma user; user-token exchange for wallet reads. |
| _tbc_ — Environment provisioning | ops | One-time didx:me tenant / service registration / clients per Yoma environment; secrets into `appsettings.Local.json` / helm values (helm by request only). |
| _tbc_ — Wallet view | web | Only if the wallet payload shape changes visibly (e.g. SD-JWT claims, didx:me deep link). May be zero work. |

## Shared Contract

Everything every child depends on. Verified against mono source at `8ff9fcff` (see `plan.md` for
file references) — **not yet verified against a running didx:me**, see Blockers.

**Tenant model**

- One didx:me tenant, alias `yoma`, per Yoma environment — not one per Yoma organisation.
  Wallet-Lite scopes a user's wallet by the `tenantAlias` claim; per-org tenants would fragment
  the user's view and need platform-admin provisioning for every organisation. The issuing Yoma
  organisation is carried in the credential claims (existing `Issuer` / `IssuerLogoURL` system
  attributes), as today.
- Holder tenant id = the Yoma Keycloak user id (`User.ExternalId`) = didx:me `externalIdentifier`.
  Issuer tenant id = the Yoma organisation referent (unchanged), used only to populate claims.

**Identity federation (SSO)**

- Yoma Keycloak (realm `yoma`) is registered in didx:me as a `jwt-authorization-grant` identity
  provider (`yoma-idp`) with client `yoma-federated-lite` in the didx:me `consumers` realm.
- Yoma access tokens must carry an extra audience: the didx:me consumers realm issuer URL. This
  is a realm export change in `src/keycloak/exports/01-yoma-realm.yaml` (audience protocol mapper).
- Per user, Yoma onboards the user into didx:me (`externalIdentifier` = Yoma KC `sub`) and enables
  the IdP link. After that, a Yoma user token can be exchanged (RFC 7523 JWT bearer grant) for a
  didx:me user token scoped to tenant `yoma`.

**Token roles**

- ORG token (`yoma-me-creds` client credentials, didx:me `product-hub` realm): background issuance,
  onboarding, org-push into wallets. Held by the API as a secret.
- USER token (from the JWT grant, didx:me `consumers` realm): wallet reads in request context.
- Open decision — how background jobs that need a user-scoped operation (Replay delete) get one.
  Tracked in `plan.md` § Open decisions.

**Provider selection**

- New `AppSettings.SSIProvider` (`AriesCloud` | `DidxMe`), default `AriesCloud`. The three hooks in
  `Yoma.Core.Api/Startup.cs` branch on it. Schemas for the selected provider must be seeded before
  issuance (existing contract in `SSIBackgroundService` remarks).

## Out of Scope (whole epic)

- Migrating credentials already issued via Aries into didx:me — Replay re-issues; no copy.
- Yoma as verifier (presentation requests) — didx:me supports it, Yoma has no consumer yet.
- Replacing Yoma login with didx:me, or didx:me as an IdP for Yoma — federation is one-way.
- Running the didx:me platform itself for production — DIDx platform team owns it.

## Blockers

| Blocker | Severity | Note |
| ------- | -------- | ---- |
| No didx:me environment to integrate against | High | Local mono stack brought up on 2026-10-27 but the issuer (`me-creds-api`) needs Paradym, which needs 1Password/ECR access or a hosted Paradym API key the Yoma team does not hold. Stack torn down. Unblocks: hosted Paradym key, or a DIDx dev environment with a `yoma` tenant and the four client secrets. |
| Local-dev networking | Med | didx:me Keycloak must fetch Yoma's JWKS from inside its cluster; local Yoma KC is `http://keycloak:8080` in docker-compose. Needs `host.docker.internal` or similar when both run locally. |

## Cross-Area Notes

- **API (Adrian)**: new infrastructure project, `AppSettings` field, `TenantRequest` gains the
  Yoma KC user id for holders, provider switch in `Startup.cs`. No change to public API contracts
  is planned; `/ssi/wallet/*` shapes stay as they are unless the SD-JWT claims force it.
- **Keycloak**: realm export gains one protocol mapper (audience). Must match the `issuer` value
  registered in didx:me exactly (`http://keycloak:8080/realms/yoma` locally; the public URL in
  deployed environments).
- **Web (Jason)**: `/yoid/passport` continues to read from the Yoma API. Revisit only if the
  provider changes the `Credential` attribute set or we want a "open in didx:me" affordance.
- **Helm / CI**: new secrets (`DidxMe` config section) will be needed per environment — raise
  with whoever owns `helm/`; not edited by this epic unless asked.
