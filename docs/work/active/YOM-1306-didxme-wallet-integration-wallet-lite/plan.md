# Plan: didx:me as an SSI provider for Yoma (Wallet Lite, federated route)

High-level plan for [YOM-1306](./README.md). Decisions that affect every child live in the epic
README's Shared Contract; this file holds the how. Source references: Yoma at `bdba92a10`
(`master`, 2026-10-27), didx:me `mono` at `8ff9fcff`. All mono paths are relative to that repo.

## 1. What didx:me offers (as far as Yoma cares)

Four HTTP services behind one ingress, two Keycloak realms in one Keycloak:

| Service | Role for Yoma | Auth |
| ------- | ------------- | ---- |
| `hub-management-api` (`/hub-management/api`) | One-time provisioning: tenant, service registration, M2M client, federated-lite client | platform-admin client credentials (`product-hub` realm) |
| `consumer-onboarding-api` (`/consumer-onboarding/api`) | Per user: create didx:me user + wallet, link to Yoma identity | ORG token |
| `me-creds-api` (`/me-creds/api/v1`) | Issuer: credential presets (≈ schemas), issuances (→ `offerUri`), revocation | ORG token |
| `me-wallet-api` (`/me-wallet/api/v2`) | Holder: wallet contents, accept/reject/delete; org-push of an offer into a user's wallet | USER token for reads/writes, ORG token for `/orgs/*` |

- **ORG token** = client credentials for `yoma-me-creds` (realm `product-hub`). Carries
  `tenantAlias=yoma`, audiences `me-wallet-api` + `me-creds-api`.
- **USER token** = consumers-realm token obtained by exchanging a Yoma user access token via
  RFC 7523 (`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer`, `client_id=yoma-federated-lite`,
  `assertion=<Yoma access token>`). Carries `tenantAlias=yoma`, `aud=me-wallet-api`, and the
  didx:me user's `sub`. me-wallet-api filters everything by `tenantAlias`, so Yoma only ever sees
  Yoma-issued credentials.
- The real issuer engine behind `me-creds-api` is **Paradym** (hosted). Credential format is
  **SD-JWT VC** (`vc+sd-jwt`), delivered over OpenID4VCI. There is no AnonCreds here.

Endpoint shapes, payloads and the numbered acceptance sequence are in
[`research/didxme-wallet-lite-api-notes.md`](./research/didxme-wallet-lite-api-notes.md); they are
not repeated here to keep this file stable.

## 2. Mapping `ISSIProviderClient` → didx:me

`src/api/src/domain/Yoma.Core.Domain/SSI/Interfaces/Provider/ISSIProviderClient.cs`

| Method | didx:me realisation | Notes |
| ------ | ------------------- | ----- |
| `UpsertSchema`, `ListSchemas`, `GetSchemaBy*` | me-creds **preset** `POST/GET /v1/presets/credentials`, id `yoma:<code>` | Presets are write-once (409 on same `type`). "New version on same name" → encode the version in the preset `code` (`<name>-v<n>`) and keep the Yoma `SSISchema` row as the source of truth for name/version. `ArtifactType` is always `JWS`-equivalent; reject `ACR` requests. |
| `EnsureTenant` (role `Holder`) | `POST /consumer-onboarding/api/users {username, externalIdentifier}` then `PATCH /users/{username}/idp-link {enabled:true}` | Needs the Yoma KC user id → **`TenantRequest` gains a field for it** (populated from `User.ExternalId` in `SSIBackgroundService.ProcessTenantCreation`). Returns tenant id = `externalIdentifier`. Idempotent. |
| `EnsureTenant` (roles incl. `Issuer`) | No-op returning the organisation referent | A single `yoma` issuer; org identity lives in claims. |
| `IssueCredential` | `POST /me-creds/api/v1/issuances {credentials:[{reference:"presetId:yoma:<code>", attributes}]}` → `offerUri` → `POST /me-wallet/api/v2/orgs/credentials {credentialOffer, recipient:<holder tenant id>, identifierType:"externalIdentifier"}` with `x-approve-credential: true` | Org push; no user token needed. Returned `Credential.Id` = me-creds issuance/credential id (issuer side). |
| `GetCredentialByClientReferentOrNull` | Local lookup on `SSICredentialIssuance` → provider id | Presets have no free-form tag search; the client referent is already a credential attribute, so store the me-creds id locally at issue time and resolve from there. |
| `ListCredentials`, `GetCredentialById` | `GET /me-wallet/api/v2/credentials?status=accepted`, `GET /v2/credentials/{id}` | Requires a **USER token** → request-context only. Claims arrive as SD-JWT `claims{}`; map back to `Credential.Attributes`. |
| `GetCredentialByIdOrNull`, `DeleteCredential` (Replay) | `DELETE /me-wallet/api/v2/credentials/{id}` is USER-token only; issuer side has `POST /v1/credentials/{id}/revoke` | **Open decision** (§5): background jobs have no user token. |

### Id namespaces

Two ids exist per credential: the issuer-side me-creds credential id and the wallet-side
me-wallet credential id. `SSICredentialIssuance.CredentialId` can hold only one. Proposed: store
the **wallet id** (what the user sees and what delete/accept act on), and keep the me-creds id as
a second column if revocation is needed. Decide in the adapter ticket.

## 3. Yoma-side changes

**API** (`src/api`)

- `src/infrastructure/Yoma.Core.Infrastructure.DidxMe/` — new project, net10.0, Flurl client in
  the style of `Yoma.Core.Infrastructure.Zlto/Client/ZltoClient.cs`. Options class `DidxMeOptions`
  bound from a new `DidxMe` section in `appsettings.json` (base URL, CA bundle for local, ORG
  client id/secret, federated-lite client id/secret, consumers realm issuer URL, tenant alias).
  Token cache per client (client credentials; JWT-grant results keyed by Yoma token `jti`).
- `AppSettings.SSIProvider` + branch in `Yoma.Core.Api/Startup.cs` at
  `ConfigureServices_InfrastructureSSIProvider`, `app.UseSSIProvider()`,
  `Configure_InfrastructureDatabaseSSIProvider()`. Fully-qualify `Infrastructure.X.Startup.*`
  calls (the two Startup classes collide on name).
- `TenantRequest` gains the Yoma KC user id (holder only). Only the AriesCloud adapter ignores it.
- Local store: AriesCloud keeps an EF schema for JWS/connections; didx:me needs at most a
  `CredentialId ↔ me-creds id` map. Prefer a column on `SSICredentialIssuance` over a second
  DbContext if that suffices.
- Register in `Yoma.Core.sln` and `Yoma.Core.Api.csproj`. Tests next to
  `src/test/Yoma.Core.Test/SSI/AriesCredentialIssuanceTests.cs` using Flurl `HttpTest` stubs
  hand-written from mono's generated OpenAPI (`packages/generated/*/openapi.json`).

**Keycloak** (`src/keycloak`)

- `exports/01-yoma-realm.yaml`: audience protocol mapper on the client whose user tokens the API
  exchanges, `included.custom.audience = <didx:me consumers realm issuer URL>`, access token only.
  The realm `issuer` must byte-match what is registered in didx:me (`http://keycloak:8080/realms/yoma`
  locally).

**Web** (`src/web`)

- `src/api/services/credentials.ts` + `pages/yoid/passport/[[...query]].tsx` keep reading from the
  Yoma API. Candidate follow-ups, only if wanted: "Open in didx:me" link, pending-offer state if we
  ever switch from org-push to user-pull.

## 4. Phases (proposed child tickets)

1. **Provider adapter (api)** — `Yoma.Core.Infrastructure.DidxMe`, provider switch, `TenantRequest`
   field, schema seeding against presets, issuance via org-push, unit tests against stubs.
   Deliverable without a live environment.
2. **Identity federation (api + keycloak)** — audience mapper, onboarding + IdP link in
   `EnsureTenant`, JWT-grant exchange + wallet reads in request context. Needs a live didx:me to
   prove; the Keycloak side can be prepared blind.
3. **Environment provisioning (ops)** — scripted one-time setup per environment (tenant
   `yoma`, service registration `me-creds` with `issuerDisplay`, M2M client, federated-lite
   client). Produces the secrets for `DidxMe` config. Helm changes raised separately.
4. **Integration validation** — the numbered acceptance sequence end-to-end on a dev didx:me:
   seed schema → create user → issue → see it on `/yoid/passport` and in the didx:me app →
   Replay delete/re-issue.
5. **Wallet view (web)** — only if phase 4 shows a visible gap.

Phase 1 can start now. Phases 2–4 wait on the environment blocker.

## 5. Open decisions

| # | Question | Options | Leaning |
| - | -------- | ------- | ------- |
| 1 | Background jobs that need a user-scoped wallet operation (Replay delete, `GetCredentialByIdOrNull`) | (A) Enable `token-exchange` in Yoma KC and impersonate the user to mint an assertion; (B) issuer-side revoke + a local "superseded" flag instead of wallet delete; (C) ask DIDx for an org-scoped delete on `/v2/orgs/credentials` | B is self-contained; A needs a KC feature flag and a trusted client; C depends on DIDx roadmap |
| 2 | Which id `SSICredentialIssuance.CredentialId` stores | wallet id vs me-creds id | wallet id (user-facing, what delete acts on); add me-creds id column if revoke is needed |
| 3 | Schema versioning on write-once presets | version in preset `code` vs `type` URN | `code` suffix `-v<n>`; `type` derived from it |
| 4 | Mapping SD-JWT `claims{}` back to flat `Credential.Attributes` | flatten nested keys with `.` vs reject nested presets | Yoma schemas are flat today; keep presets flat, no nesting |
| 5 | One `yoma` tenant vs tenant per Yoma org | — | one tenant (Shared Contract); revisit only if DIDx wants per-org issuer DIDs |

## 6. Local development

- didx:me local stack: `mono` repo, `mise run tilt:up -- me hub-management-api consumer-onboarding-api ext-kc`.
  Brought up once on 2026-10-27 on WSL2 (needs `~/.local/bin` shims for `python3`, `unzip`,
  `rsync`, `envsubst`; no sudo) — everything except the issuer path works without Paradym.
  Torn down; see handoff for the exact recipe and gotchas.
- Yoma pointing at it: `DidxMe` section in `appsettings.Local.json` with base URL
  `https://didx.127.0.0.1.nip.io`, CA `tools/tilt/infra/istio/ca.crt` trusted by the .NET process,
  and the four secrets from provisioning. Yoma's Keycloak must be reachable from inside the kind
  cluster for JWKS fetch.
