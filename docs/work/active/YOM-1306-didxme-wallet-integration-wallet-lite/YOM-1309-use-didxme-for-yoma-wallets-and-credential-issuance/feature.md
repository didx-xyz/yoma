# Feature: Use didx:me for Yoma wallets and credential issuance

## Meta

- **Feature**: didx:me SSI infrastructure adapter
- **Epic**: [YOM-1306](../README.md)
- **Ticket**: [YOM-1309](https://linear.app/didx/issue/YOM-1309/use-didxme-for-yoma-wallets-and-credential-issuance)
- **Owner**: Adrian
- **Areas**: api
- **Status**: in-progress — infrastructure scaffold; provider implementation pending
- **Started**: 2026-10-28

## Problem / Goal

Implement didx:me behind Yoma's existing SSI provider contracts for both YoID and opportunity SD-JWT credentials. Preserve the domain's scheduling, wallet and Replay behaviour and retain AriesCloud as a selectable fallback.

The current step creates a buildable infrastructure project, configuration and direct Flurl issuer-authentication/cache foundation. API hookup and provider selection come later. The remaining adapter responsibilities are assigned below; no fake domain provider is registered.

## Out of Scope for This Step

- API references/DI hookup, activating didx:me or removing AriesCloud.
- Domain/interface changes, live authentication/API calls and placeholder provider implementations.
- Mappings/database migrations, issuance, Replay and credential migration.
- Mono source, runtime startup, Keycloak, Web, Helm and Dev deployment changes.
- Committing or pushing without Adrian's review of this new work.

## Plan

Add `Yoma.Core.Infrastructure.DidxMe` beside the existing infrastructure projects, using net10.0 and their configuration/options conventions. Add it to the solution's existing Infrastructure folder. Bind the existing `DidxMe` configuration shape through infrastructure-owned options and a registration entry point that is not called by the API yet.

Use existing Microsoft and Flurl package versions already used by other infrastructure projects; introduce no new third-party libraries or didx:me SDK. Do not register a dummy `ISSIProviderClientFactory` or methods that return false success/absence. Existing domain interfaces remain the target for the actual adapter.

### Infrastructure Responsibilities

| Area | Boundary / current state |
| --- | --- |
| Provider facade and direct API transport | Future `Client/` implementation of `ISSIProviderClient` and its factory. Use Flurl with typed DTOs for onboarding, issuer and wallet APIs. Keep raw tokens/provider DTOs out of the domain. Do not scaffold provider operations as false success. |
| Issuer authentication | `IDidxMeIssuerAuthService` / `DidxMeIssuerAuthService`: client-credentials form POST, bounded timeout, expiry-aware instance cache and single-flight refresh lock. Singleton when the infrastructure's own entry point is explicitly called. |
| Holder authentication | Separate infrastructure-owned assertion/delegation flow. Isolate holder caches by environment/client/subject/assertion identity and bound expiry/size. Never reuse the issuer cache, treat issuer authorization as holder authorization or require browser context for background jobs. Route remains open under YOM-1308. |
| Schema/preset translation | Map immutable Yoma schema identities/versions to didx:me presets. Preserve both credential families, claim mappings and optional-value behaviour. Decide SD-JWT disclosure/type metadata explicitly; do not simply reject today's YoID format selector. |
| Credential correlation/recovery | Infrastructure-owned durable mapping/journal for issuance referent, issuer credential ID, wallet credential ID and confirmed progress. Record intent before side effects; reconcile uncertain outcomes before repeating issuance/delivery. A local lookup alone cannot prove absence after provider success/local-save failure. Persistence/migrations come later. |
| Replay/lifecycle | Preserve exact holder-scoped lookup/deletion/confirmed absence. Auth failures are not absence. Revocation/local supersession cannot silently replace deletion. Supported background access is still required. |
| Selection/errors | Later API hookup selects the provider explicitly; no automatic cross-provider fallback. Add safe 401 invalidation/refresh when API calls are implemented. Do not automatically retry non-idempotent mutations or log tokens, secrets or complete credential attributes. |

These are responsibility boundaries, not a requirement for one abstraction per row. Follow existing Yoma Client/Models/Services/Interfaces/persistence patterns as each operation is implemented. No speculative tables or empty placeholder layers in this first step.

## Tasks

- [x] Create the project and add it to the solution.
- [x] Add options matching the existing `DidxMe` settings and infrastructure-only registration.
- [x] Add direct Flurl issuer authentication with a per-service token cache, refresh buffer and lock.
- [x] Verify expiry/isolation, malformed/error responses, cancellation and preservation of existing provider registration with fake HTTP/clock.
- [x] Build and check formatting; confirm the host/provider behaviour is unchanged.
- [x] Write the session handoff; Adrian approved committing and pushing the scaffold on 2026-10-28.
- [ ] Implement holder authentication/background access; integrate issuer auth with actual API operations and 401 invalidation.
- [ ] Implement schema/preset translation, including both YoID and opportunities.
- [ ] Implement durable credential ID/correlation mappings and partial-success recovery.
- [ ] Implement wallet operations and actual Replay lookup/deletion semantics.
- [ ] Add provider selection/API hookup with AriesCloud fallback and regression coverage.
- [ ] Validate one YoID and one opportunity credential through the full participant journey.

## Decisions

- 2026-10-28: Adrian requires domain interfaces/processes to remain compatible with AriesCloud. Provider-specific differences belong in infrastructure. Extend shared requests only if provider-neutral information is genuinely missing; no such extension in this scaffold.
- 2026-10-28: Current JWS credentials and schemas live in Yoma storage owned by the AriesCloud infrastructure; Aries signs JWS. didx:me will store both credential families. Any local correlation/mapping state is infrastructure bookkeeping, not a second holder wallet.
- 2026-10-28: Start with the new project only; API/DI hookup later. Keep the active Aries route intact and do not create an unusable provider implementation just to satisfy registration.
- 2026-10-28: Adrian requires direct didx:me calls through Flurl with no SDK. Authentication/caching and provider-specific mapping/recovery remain in infrastructure. Initial issuer caching follows existing auth-service patterns, with instance state/lock and a framework clock for deterministic expiry checks.
- 2026-10-28: No domain interface, artifact enum, schema seeding, worker or active provider changes in this scaffold. Both YoID and opportunity SD-JWT translation remain implementation work.
- 2026-10-28: Adrian approved committing and pushing this scaffold and handoff, then parking implementation until Friday, 2026-10-30.

## Links

- [Shared architecture and open constraints](../README.md)
- [Implementation plan](../plan.md)
- [Environment/SRE runbook](../environment.md)
- [Scaffold handoff](./handoffs/2026-10-28-a.md)
