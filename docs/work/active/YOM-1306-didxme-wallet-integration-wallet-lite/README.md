# Epic: YOM-1306 — didx:me wallet integration (Wallet Lite)

## Meta

- **Epic**: [YOM-1306](https://linear.app/didx/issue/YOM-1306)
- **Owners**: Adrian (api) · Jason (web)
- **Areas**: both (api-heavy; keycloak realm config; web last)
- **Status**: in-progress — Local setup complete; implementation pending
- **Started**: 2026-10-27
- **Branch**: `feature/yom-1306-didxme-wallet-integration-wallet-lite` — planning, environment handover and API configuration placeholders

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
The tested Local setup and SRE's once-off provisioning versus deployment configuration/secrets
are in [`environment.md`](./environment.md). Local mono is currently stopped; data is preserved.

## Child Features

| Folder | Ticket | Area | Status |
| ------ | ------ | ---- | ------ |
| [Environment provisioning](./YOM-1307-provision-didxme-environments-for-yoma/feature.md) | [YOM-1307](https://linear.app/didx/issue/YOM-1307) | api / SRE | review |
| [Identity federation](./YOM-1308-federate-yoma-identities-with-didxme-wallet-lite/feature.md) | [YOM-1308](https://linear.app/didx/issue/YOM-1308) | api + keycloak | in-progress |
| Folder when implementation starts | [YOM-1309](https://linear.app/didx/issue/YOM-1309) | api | planning |
| Folder when implementation starts | [YOM-1310](https://linear.app/didx/issue/YOM-1310) | web | planning |

YOM-1306 is the canonical root. Adrian deleted the redundant YOM-1305; its early setup checkpoint
is retained under YOM-1307. YOM-1309 owns the provider adapter and DI switch; YOM-1310 covers
the participant wallet view if the API work exposes a visible gap.

## Shared Contract

Everything every child depends on. Source analysis used mono at `8ff9fcff` (see `plan.md`).
Local tenant/client provisioning, issuer tokens and the JWT grant were subsequently verified
against the running stack; see [environment verification](./environment.md#local-federation-contract).
Participant onboarding, credential issuance and the finished Yoma journey remain unverified.

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
- The assertion must have exactly one audience: the didx:me consumers realm issuer URL.
  The Local grant rejects multiple audiences, so adding another audience to an ordinary Yoma
  web token is insufficient. YOM-1308 must settle how Yoma acquires this dedicated assertion;
  no permanent Yoma realm/client changes were retained from the protocol test.
- Per user, Yoma onboards the user into didx:me (`externalIdentifier` = Yoma KC `sub`) and enables
  the IdP link. A correctly scoped, signed Yoma assertion can then be exchanged (RFC 7523 JWT
  bearer grant) for a didx:me user token scoped to tenant `yoma`.

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
| Application assertion acquisition | High | Local JWT grant works with a dedicated single-audience assertion; ordinary Yoma web tokens have multiple audiences. Route to be settled in YOM-1308. |
| Adapter data-model decisions | High | Background Replay operations and issuer/wallet credential IDs remain open in `plan.md` § 5. |

The prior Local environment and JWKS-networking blockers are resolved on Adrian's machine:
ECR/Paradym, tenant/clients and cross-stack JWKS all passed. The standalone stack is deliberately
stopped pending the next instruction. Dev still needs SRE provisioning and environment-specific
Helm values/secret references; no Dev changes have started.

## Cross-Area Notes

- **API (Adrian)**: new infrastructure project, `AppSettings` field, `TenantRequest` gains the
  Yoma KC user id for holders, provider switch in `Startup.cs`. No change to public API contracts
  is planned; `/ssi/wallet/*` shapes stay as they are unless the SD-JWT claims force it.
- **Keycloak**: preserve the exact Yoma issuer registered in didx:me
  (`http://keycloak:8080/realms/yoma` locally), and separately ensure the assertion's sole audience
  equals the consumers issuer. The acquisition/client mapper strategy is still pending.
- **Web (Jason)**: `/yoid/passport` continues to read from the Yoma API. Revisit only if the
  provider changes the `Credential` attribute set or we want a "open in didx:me" affordance.
- **Helm / CI**: new secrets (`DidxMe` config section) will be needed per environment — raise
  with whoever owns `helm/`; not edited by this epic unless asked.
- **Session close**: see [branch consolidation](./handoffs/2026-10-27-c.md). Adrian authorized
  committing/pushing this setup/planning consolidation; implementation and Dev work are deferred.
