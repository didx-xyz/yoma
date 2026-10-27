# didx:me Wallet-Lite (federated route) — API notes for Yoma

Condensed from reading the `mono` repo at `8ff9fcff` (2026-10-27). Subsequent Local setup verified
tenant/client provisioning, issuer tokens and a dedicated single-audience JWT grant; credential
issuance/onboarding acceptance remains pending. See [the environment runbook](../environment.md).
Paths are relative to the mono repo. `H` = ingress base
(`https://didx.127.0.0.1.nip.io` locally). Every service mounts its OpenAPI at `<base>/api/openapi.json`
and a generated copy lives in `packages/generated/<service>-client/openapi.json`.

## Tokens

| Name | How | Claims that matter |
| ---- | --- | ------------------ |
| PH-admin | `POST H/iam/realms/product-hub/protocol/openid-connect/token`, `grant_type=client_credentials`, `client_id=product-hub-management`, `client_secret=<secret>` (local: `secret`) | realm role `platform-admin` |
| ORG | same endpoint, `client_id=yoma-me-creds`, secret from provisioning step 5 | `tenantAlias=yoma`, `aud` ⊇ `me-wallet-api`, `me-creds-api` |
| USER | `POST H/iam/realms/consumers/protocol/openid-connect/token`, `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer`, `client_id=yoma-federated-lite`, `client_secret=…`, `assertion=<Yoma user access token>` | `sub` = didx:me user, `tenantAlias=yoma`, `aud` ⊇ `me-wallet-api` |

Assertion requirements for the USER exchange (`apps/me/consumer-onboarding-api/test/external/jwt-auth-grant-e2e.test.ts`):
`iss` byte-equal to the IdP `issuer`; `aud` is exactly the didx:me consumers realm issuer URL
(`H/iam/realms/consumers`); `sub` equals the `externalIdentifier` stored for the user (the
federated identity link is `identityProvider=yoma-idp, userId=<externalIdentifier>`); signed by a
key published at the registered `jwksUrl`. The IdP type is `jwt-authorization-grant`
(Keycloak feature flag `jwt-authorization-grant`, enabled in mono's Keycloak).

Local verification rejected multi-audience assertions. Ordinary Yoma web tokens cannot be
forwarded directly; YOM-1308 must settle acquisition of a dedicated single-audience assertion.

## (a) One-time provisioning per environment — PH-admin

Source: `apps/product-hub/hub-management-api/src/domain/{tenants,service-registrations,clients,federated-lite-clients}`.

1. Create (or pick) a user in the `product-hub` realm to own the tenant → `userId`.
2. `POST H/hub-management/api/tenants` `{"tenantAlias":"yoma","tenantName":"Yoma","userId":"<userId>","domains":["<yoma domain>"]}` → 201.
   Alias rules: `^[a-zA-Z][a-zA-Z0-9_-]*$`, ≤21 chars, immutable, must not end in `-federated`. Idempotent on same alias+name.
3. `POST H/hub-management/api/service-registrations` `{"tenantAlias":"yoma","userId":"<userId>","serviceName":"me-creds","issuerDisplay":{"displayName":"Yoma","logoUrl":"…"}}` → 201 `{meCredsProjectId}`.
   Creates the Paradym project `yoma-me-creds` — **this is the step that needs Paradym**.
4. `POST H/hub-management/api/clients` `{"tenantAlias":"yoma","service":"me-creds"}` → 201 `{clientId:"yoma-me-creds", clientSecret}` → ORG credentials.
5. `POST H/hub-management/api/federated-lite-clients` `{"tenantAlias":"yoma","issuer":"<Yoma realm issuer URL>","jwksUrl":"<JWKS URL reachable from inside the didx:me cluster>"}` → 201 `{clientId:"yoma-federated-lite", clientSecret, idpAlias:"yoma-idp"}`.
   Creates, in the consumers realm, IdP `yoma-idp` and client `yoma-federated-lite` with mappers `tenantAlias=yoma` and `aud=me-wallet-api`. 409 if it already exists; `GET …?tenantAlias=yoma` to read back, `DELETE /{id}` to remove.
6. In **Yoma Keycloak**: the assertion client/route must produce the sole audience `H/iam/realms/consumers`. An additional mapper on an ordinary multi-audience web token is insufficient; application acquisition is still pending.

## (b) Per Yoma user — ORG token

Source: `apps/me/consumer-onboarding-api/src/domain/users/user.service.ts`.

7. `POST H/consumer-onboarding/api/users` `{"username":"<yoma username>","firstName":"…","lastName":"…","externalIdentifier":"<Yoma KC sub>","sendOnboardingEmail":false}` → 201 `{data:{username, tempPassword}}`.
   Creates the consumers-realm user in organisation `yoma`, creates the wallet (`me-wallet-api POST /v2/tenants/{userId}`), stores `externalIdentifier → userId`. Idempotent per org; 409 if the username belongs to another org or the externalIdentifier is already mapped to a different user.
   Send `email` only if you want it stored; with the default local onboarding contexts an email triggers an invite mail.
8. `PATCH H/consumer-onboarding/api/users/<username>/idp-link` `{"enabled":true}` → 200 `{data:{idpAlias:"yoma-idp", linked:true}}`. 404 if no externalIdentifier. Idempotent.
9. Lookups: `GET /users/by-external-identifier/{externalIdentifier}`, `GET /users/{username}/external-identifier`.

## (c) Credential preset ≈ schema (once per schema version) — ORG token

Source: `apps/me/me-creds-api/src/domain/presets`, `docs/design/preset-namespaces.md`.

10. `POST H/me-creds/api/v1/presets/credentials` → **200** (not 201)
    ```json
    {"credentialFormat":"sd-jwt","code":"opportunity-completion-v1","templateName":"Opportunity Completion",
     "templateDescription":"…","templateAttributes":{
       "userName":{"type":"string","name":"User Name","required":true,"alwaysDisclosed":false}}}
    ```
    Attribute types `string|number|boolean|date|datetime|object|array`. Response `{data:{id:"yoma:opportunity-completion-v1", author:"yoma", code, templateType:"<vct>", namespace}}`.
    Write-once: 409 if the `type` already exists. `GET /v1/presets/credentials[/{id}]`.
    Explicit template is optional — issuance by `presetId:` reference materialises one.

## (d) Issue + deliver + read back

11. `POST H/me-creds/api/v1/issuances` (ORG) `{"credentials":[{"reference":"presetId:yoma:opportunity-completion-v1","attributes":{…}}]}` → 201 `{data:{id, status:"offered", credentials:[{id, credentialTemplateId, format:"sd-jwt-vc"}], offerUri}}`. `offerUri` is the OpenID4VCI offer.
12. **Org push** (ORG, header `x-approve-credential: true`): `POST H/me-wallet/api/v2/orgs/credentials` `{"credentialOffer":"<offerUri>","recipient":"<Yoma KC sub>","identifierType":"externalIdentifier"}` → 201 `{data:null}`. Stored with `issuerTenantAlias=yoma`; creates the wallet if missing.
    Alternative user pull (USER): `POST /v2/credentials {"credentialOffer"}` → pending → `PATCH /v2/credentials/{id} {"status":"accepted"}`.
13. Read (USER): `GET H/me-wallet/api/v2/credentials?status=accepted` (`status` required; `pending|accepted|rejected`) → `{data:[{id, claims{…}, iss, issuer, iat, exp?, status, display, format:"vc+sd-jwt", vct}], links, meta}`; paging `page[size]`≤100, `page[after]`. Also `GET /v2/credentials/{id}`, `GET /v2/credentials/summary`, `DELETE /v2/credentials/{id}` (204).
    No org-token read or delete exists — `/v2/orgs/*` is write-only (`credentials`, `presentations`).
14. Issuer side (ORG): `GET /v1/issuances/{id}`, `GET /v1/credentials?filter[status]=`, `POST /v1/credentials/{id}/revoke` (204).

## Local stack facts (for whoever runs it next)

- `mise run tilt:up -- me hub-management-api consumer-onboarding-api ext-kc -- --consumers-browser-flow=ext-browser-optional`
  (`consumer-onboarding-api` is not in the `me` group). Add `--paradym-url=https://api.paradym.id --paradym-api-key=<key>` for issuance against hosted Paradym; the local `paradym` group needs AWS ECR via 1Password.
- Bootstrap clones two private repos over SSH; without an SSH key use the `gh` credential helper and `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=url.https://github.com/.insteadOf GIT_CONFIG_VALUE_0=git@github.com:`. Needs `gh auth refresh -s read:packages` for GHCR charts.
- Ingress `https://didx.127.0.0.1.nip.io`, CA `tools/tilt/infra/istio/ca.crt`. Keycloak admin `keycloak`/`keycloak`; realms `master`, `consumers`, `product-hub`. Port-forwards: keycloak 8080, me-wallet-api 3300, me-creds-api 3302, consumer-onboarding-api 3303, hub-management-api 3400, postgres 5432 (`postgres`/`postgres`). Tilt UI :10350.
- WSL2 without sudo: the helm extension shells out to `python3`, `unzip`, `rsync`, `envsubst`; shims in `~/.local/bin` were enough. Checking the repo out with CRLF breaks every mise task — `git rm --cached -r -q . && git reset --hard -q` fixes it.
- Yoma's Keycloak must be reachable from inside the kind cluster for the JWKS fetch in step 5.
