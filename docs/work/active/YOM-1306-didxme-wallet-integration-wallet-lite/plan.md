# Plan: didx:me as an SSI provider for Yoma (Wallet Lite, federated route)

High-level plan for [YOM-1306](./README.md). Decisions that affect every child live in the epic
README's Shared Contract; this file holds the how. Source references: Yoma at `bdba92a10`
(`master`, 2026-10-27), didx:me `mono` at `8ff9fcff`. All mono paths are relative to that repo.

Local setup and protocol checks are now complete on Adrian's machine; the stack is currently
stopped with data preserved. See [the environment runbook](./environment.md) and
[setup handoff](./handoffs/2026-10-27-b.md). The single-audience assertion finding below updates
the original source-only federation proposal; adapter implementation has not started.

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
- **USER token** = consumers-realm token obtained by exchanging a dedicated Yoma assertion via
  RFC 7523 (`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer`, `client_id=yoma-federated-lite`,
  `assertion=<single-audience Yoma assertion>`). Carries `tenantAlias=yoma`, `aud=me-wallet-api`, and the
  didx:me user's `sub`. me-wallet-api filters everything by `tenantAlias`, so Yoma only ever sees
  Yoma-issued credentials.
- The real issuer engine behind `me-creds-api` is **Paradym** (Local stack or hosted). Credential format is
  **SD-JWT VC** (`vc+sd-jwt`), delivered over OpenID4VCI. There is no AnonCreds here.

Endpoint shapes, payloads and the numbered acceptance sequence are in
[`research/didxme-wallet-lite-api-notes.md`](./research/didxme-wallet-lite-api-notes.md); they are
not repeated here to keep this file stable.

## 2. Mapping `ISSIProviderClient` → didx:me

`src/api/src/domain/Yoma.Core.Domain/SSI/Interfaces/Provider/ISSIProviderClient.cs`

| Method | didx:me realisation | Notes |
| ------ | ------------------- | ----- |
| `UpsertSchema`, `ListSchemas`, `GetSchemaBy*` | me-creds **preset** `POST/GET /v1/presets/credentials`, id `yoma:<code>` | Presets are write-once (409 on same `type`). Encode versions in preset `code` (`<name>-v<n>`) while preserving the immutable Yoma schema/version contract. Both YoID and opportunities must issue SD-JWT; simply rejecting today's YoID `ACR` selector is insufficient. Format/preset translation needs an explicit adapter design. |
| `EnsureTenant` (role `Holder`) | `POST /consumer-onboarding/api/users {username, externalIdentifier}` then `PATCH /users/{username}/idp-link {enabled:true}` | Needs the Yoma KC user id → **`TenantRequest` gains a field for it** (populated from `User.ExternalId` in `SSIBackgroundService.ProcessTenantCreation`). Returns tenant id = `externalIdentifier`. Idempotent. |
| `EnsureTenant` (roles incl. `Issuer`) | No-op returning the organisation referent | A single `yoma` issuer; org identity lives in claims. |
| `IssueCredential` | `POST /me-creds/api/v1/issuances {credentials:[{reference:"presetId:yoma:<code>", attributes}]}` → `offerUri` → `POST /me-wallet/api/v2/orgs/credentials {credentialOffer, recipient:<holder tenant id>, identifierType:"externalIdentifier"}` with `x-approve-credential: true` | Org push; no user token needed. Returned `Credential.Id` = me-creds issuance/credential id (issuer side). |
| `GetCredentialByClientReferentOrNull` | Local lookup on `SSICredentialIssuance` → provider id | Presets have no free-form tag search; the client referent is already a credential attribute, so store the me-creds id locally at issue time and resolve from there. |
| `ListCredentials`, `GetCredentialById` | `GET /me-wallet/api/v2/credentials?status=accepted`, `GET /v2/credentials/{id}` | Requires a **USER token** → request-context only. Claims arrive as SD-JWT `claims{}`; map back to `Credential.Attributes`. |
| `GetCredentialByIdOrNull`, `DeleteCredential` (Replay) | `DELETE /me-wallet/api/v2/credentials/{id}` is USER-token only; issuer side has `POST /v1/credentials/{id}/revoke` | **Open decision** (§5): background jobs have no user token. |

### Id namespaces

Two ids exist per credential: the issuer-side me-creds credential id and the wallet-side
me-wallet credential id. `SSICredentialIssuance.CredentialId` can hold only one. Preserve the
domain's credential identity contract and maintain both provider IDs/correlation in infrastructure.
No domain column or storage design is selected in this scaffold. Decide this with recovery and
Replay in YOM-1309.

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
- Infrastructure persistence must cover correlation and uncertain issue/delivery outcomes as
  well as schema/preset mappings. Decide storage before implementing mutations; a local lookup
  cannot alone recover provider success that was never saved locally.
- Register in `Yoma.Core.sln` and `Yoma.Core.Api.csproj`. Tests next to
  `src/test/Yoma.Core.Test/SSI/AriesCredentialIssuanceTests.cs` using Flurl `HttpTest` stubs
  hand-written from mono's generated OpenAPI (`packages/generated/*/openapi.json`).

**Keycloak** (`src/keycloak`)

- Assertion acquisition/client configuration must produce exactly one audience, the didx:me
  consumers realm issuer. Simply adding an audience mapper to existing Yoma web tokens fails
  the tested grant. YOM-1308 owns the route decision; no realm export change is included yet.
  The Yoma assertion issuer must match the registered issuer (`http://keycloak:8080/realms/yoma`
  locally); the separately reachable JWKS URL uses `host.docker.internal` from mono.

**Web** (`src/web`)

- `src/api/services/credentials.ts` + `pages/yoid/passport/[[...query]].tsx` keep reading from the
  Yoma API. Candidate follow-ups, only if wanted: "Open in didx:me" link, pending-offer state if we
  ever switch from org-push to user-pull.

## 4. Phases (proposed child tickets)

1. **Provider adapter (api)** — `Yoma.Core.Infrastructure.DidxMe`, provider switch, `TenantRequest`
   field, schema seeding against presets, issuance via org-push, unit tests against stubs.
   Deliverable without a live environment.
2. **Identity federation (api + keycloak)** — dedicated assertion route, onboarding + IdP link in
   `EnsureTenant`, JWT-grant exchange + wallet reads in request context. Needs a live didx:me to
   prove; the Keycloak side can be prepared blind.
3. **Environment provisioning (ops)** — scripted one-time setup per environment (tenant
   `yoma`, service registration `me-creds` with `issuerDisplay`, M2M client, federated-lite
   client). Produces the secrets for `DidxMe` config. Helm changes raised separately.
4. **Integration validation** — the numbered acceptance sequence end-to-end on a dev didx:me:
   seed schema → create user → issue → see it on `/yoid/passport` and in the didx:me app →
   Replay delete/re-issue.
5. **Wallet view (web)** — only if phase 4 shows a visible gap.

Local environment provisioning is complete and the JWT grant/issuer token checks passed.
Phase 1 remains planned; phase 2 still needs the application assertion route and real participant
journey. Full issuance/Replay validation and deployed Dev provisioning remain future work.

## 5. Open decisions

| # | Question | Options | Leaning |
| - | -------- | ------- | ------- |
| 1 | Background jobs that need a user-scoped wallet operation (Replay delete, `GetCredentialByIdOrNull`) | Supported delegated holder access from infrastructure, or a platform org-scoped operation satisfying the same holder/delete contract | Preserve existing semantics. Revoke plus a local superseded flag is not a transparent deletion replacement. Validate the approved auth/platform route first. |
| 2 | Which id `SSICredentialIssuance.CredentialId` stores | wallet id vs me-creds id | wallet id (user-facing, what delete acts on); add me-creds id column if revoke is needed |
| 3 | Schema versioning on write-once presets | version in preset `code` vs `type` URN | `code` suffix `-v<n>`; `type` derived from it |
| 4 | Mapping SD-JWT `claims{}` back to flat `Credential.Attributes` | flatten nested keys with `.` vs reject nested presets | Yoma schemas are flat today; keep presets flat, no nesting |
| 5 | One `yoma` tenant vs tenant per Yoma org | — | one tenant (Shared Contract); revisit only if DIDx wants per-org issuer DIDs |
| 6 | How Yoma acquires a dedicated single-audience assertion | Dedicated client/bridge or another supported Keycloak route, to be evaluated in YOM-1308 | Do not forward ordinary multi-audience web tokens; no route selected yet |

## 6. Local development

- Adrian's standalone mono stack runs through a Linux tools container and Tilt/Kind, with source
  groups `me-platform-backend paradym ext-kc`. Local issuer and shared services passed health
  checks. It is now stopped with containers/volumes retained. Start/status/stop helpers and exact
  ports are documented in [environment.md](./environment.md#local-operations).
- `DidxMe` placeholders are in tracked API settings; the ignored Local settings have direct
  host-forward API URLs and the two generated client secrets. No provider is activated yet.
  Future HTTPS ingress use needs explicit CA trust in the API process; Windows trust was not
  modified. SRE owns once-off Dev setup plus Dev Helm values and secret references.
