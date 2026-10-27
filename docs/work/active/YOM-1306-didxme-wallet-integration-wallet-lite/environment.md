# Environment setup and SRE runbook — YOM-1306

Local setup by Adrian/Codex, 2026-10-27. Shared implementation planning is in [the epic](./README.md) and [plan](./plan.md). SRE owns once-off provisioning and deployment configuration/secrets for every environment. Local mono is currently stopped with its volumes preserved.

## SRE: Once-off Provisioning per didx:me Environment

SRE owns these operations for Local, Dev and each subsequent environment. Local resources are not automatically carried into Dev.

1. Deploy/identify the independent didx:me environment, Keycloak realms, issuer provider and durable storage. Establish DNS/TLS and mutual network reachability for discovery/JWKS.
2. Provision Yoma's tenant through hub management (Local alias `yoma`). Register the `me-creds` service with display name `Yoma` and establish its issuer project/provider access.
3. Create a confidential issuer service client in `product-hub`, with client credentials and the tenant and `me-creds-api` audience claims. Local client ID: `yoma-me-creds`.
4. Create a confidential federated Lite client in `consumers` (Local: `yoma-federated-lite`). Enable JWT authorization grant and associate it with Yoma's JWT identity provider (`yoma-idp`). Disable unused browser/password/service-account grants on this holder client.
5. Configure Yoma's issuer and reachable JWKS URL with signature verification. Add `tenantAlias=yoma`, the `me-wallet-api` audience mapper and basic/profile/email scopes. Verify subject mapping and the single-audience assertion contract below.
6. Store client secrets/provider credentials in the approved environment secret store. Record non-secret identifiers and approved URLs for deployment configuration. Validate tokens/federation using temporary test identities and remove those identities afterwards.

Dev needs its own provisioning, endpoints and secrets. Reuse the pattern, not Local credentials/localhost URLs. YOM-1308 must settle and implement application assertion acquisition before real participant SSO can be accepted.

## SRE: Helm Configuration and Secret References

SRE also owns each Yoma deployment's Helm values and secret references. Once-off provisioning creates the resources; deployment configuration selects them. Document both separately. No Helm edits have been made in this session.

The tracked API `appsettings.json` defines `DidxMe` with placeholders. The ignored `appsettings.local.json` contains current Local values and client secrets, preserving Yoma's existing pattern.

| Setting under `DidxMe` | Current Local value/source | Deployed environment handling |
| --- | --- | --- |
| `TenantAlias` | `yoma` | Non-secret environment value |
| `CredentialsBaseUri` | `http://localhost:3302/api` | Credentials URL |
| `WalletBaseUri` | `http://localhost:3300/api` | Wallet URL |
| `OnboardingBaseUri` | `http://localhost:3303/api` | Onboarding URL |
| `KeycloakBaseUri` | `http://localhost:18080/iam` | didx:me Keycloak URL |
| `Issuer:Realm` / `Issuer:ClientId` | `product-hub` / `yoma-me-creds` | Non-secret values |
| `Issuer:ClientSecret` | Ignored Local settings | Environment secret reference |
| `Holder:Realm` / `Holder:ClientId` | `consumers` / `yoma-federated-lite` | Non-secret values |
| `Holder:ClientSecret` | Ignored Local settings | Environment secret reference |
| `Holder:AssertionAudience` | `https://didx.127.0.0.1.nip.io/iam/realms/consumers` | Exact consumers realm issuer |

Local endpoints target a host-run Yoma API. A Docker-hosted API needs published-port routes via `host.docker.internal`, rather than its own loopback. Identity issuer URLs must agree with realm discovery. Provider selection and any assertion bridge settings belong to implementation tickets once their contract is settled.

Never commit populated Local settings, credentials, private receipts or secret-bearing logs. Rotation updates the environment secret store and runtime configuration; it does not require recreating the tenant.

## Local Federation Contract

- Consumers issuer / exact assertion audience: `https://didx.127.0.0.1.nip.io/iam/realms/consumers`.
- Yoma issuer reported by discovery: `http://keycloak:8080/realms/yoma`.
- JWKS transport from mono: `http://host.docker.internal:8080/realms/yoma/protocol/openid-connect/certs`. This avoids the two stacks' `keycloak` hostname collision.
- Real JWT authorization grant smoke passed: correct holder subject, tenant and wallet audience. Temporary Yoma/consumer users and assertion client were removed. Investigation changes to `yoma-web` were restored.
- **Keycloak rejects multi-audience assertions.** Ordinary Yoma web tokens cannot simply be forwarded. The smoke used a temporary dedicated single-audience assertion. This verifies protocol/configuration, not the completed Yoma browser journey.
- Issuer client-credentials token passed tenant/audience validation. Local `me-creds` registration created its issuer project; no credential issuance acceptance test yet.

## Local Operations

External helpers: `D:\source\didx-mono-local`. Windows source: `D:\source\didx-mono`. Active Linux source: `/var/lib/docker/volumes/didx-mono-dev/_data/repo` in the `didx-mono-dev` volume.

```powershell
& 'D:/source/didx-mono-local/Start.ps1'
& 'D:/source/didx-mono-local/Status.ps1'
& 'D:/source/didx-mono-local/Stop.ps1'
```

Dashboard: http://localhost:10350. Keycloak: http://localhost:18080/iam. PostgreSQL: 15432; Valkey: 16379; registry: 15001. Direct API paths use `/api`; health uses `/health`. HTTPS ingress adds service prefixes.

The helpers target only `didx-mono-dev`, `didx-mono-control-plane` and `didx-mono-registry`; Stop preserves volumes. Start reuses this prepared machine, not a full second-machine installer. Tilt uses source builds with `me-platform-backend paradym ext-kc`; Expo/mobile UI and optional mediator are not started.

Generated setup uses namespace `product-hub`, an internal Kind kubeconfig and both local-registry aliases over HTTP. Docker's matching Buildx plugin is included in the external tools container to avoid a legacy build-context race with generated theme files. See the handoff for restart recovery details. The generated CA is not installed in Windows trust stores; validate HTTPS using its public CA explicitly.

## Registry Access and Secret Handling

Documented ECR source: company 1Password `didx-xyz.1password.eu`, vault **Env: Development**, item **DIDx Devs ECR IAM Keys**, fields **Access Key ID** / **Secret Access Key**. AWS account `402177810328`, region `af-south-1`. Follow this convention; no separate AWS SSO profile. Private GHCR charts separately require GitHub `read:packages`.

For this Windows/Linux split, external `Import-EcrFrom1Password.ps1` uses the approved Windows desktop/CLI integration. It captures only the two fields and passes them through stdin to Linux. Ignored mode-0600 `mise.local.toml` stores canonical ECR variables and locally overrides `docker:ecr:login` to use them. Tracked mono tasks remain unchanged. ECR pull-secret creation and pulls passed.

ECR is needed for local Paradym/S3 Compass. A hosted Paradym URL/key is an alternative when a local issuer stack is unnecessary. Source-built me services and Keycloak do not themselves need ECR.

Private issuer/federation receipts and Paradym configuration stay outside Git; Linux private files are mode 0600. Upstream Paradym automation prints its Local API key: the initially exposed key was revoked, and a replacement validated. An external redactor now protects future bootstrap summaries. Do not print raw private receipts, app configuration dumps or bootstrap logs.

## Session Handoff

See [2026-10-27-b](./handoffs/2026-10-27-b.md) for verification, limits and the requested stop point.
The current branch/runtime status is in [2026-10-27-c](./handoffs/2026-10-27-c.md).
