# Feature: Federate Yoma identities with didx:me Wallet Lite

## Meta

- **Feature**: Federated holder identity
- **Epic**: [YOM-1306](../README.md)
- **Ticket**: [YOM-1308](https://linear.app/didx/issue/YOM-1308/federate-yoma-identities-with-didxme-wallet-lite)
- **Owner**: Adrian; coordinate participant journey with Jason
- **Areas**: api
- **Status**: in-progress — Local protocol passed; application assertion route pending
- **Started**: 2026-10-27

## Problem / Goal

Allow Yoma identities to access didx:me Wallet Lite under the Yoma tenant without a separate participant login. Local setup establishes the Keycloak contract; the application needs a supported assertion acquisition/exchange route.

## Out of Scope

No Web changes, participant SSO implementation, Dev provisioning or provider switch in this setup session.

## Plan

Use the JWT authorization grant provider with a confidential consumers client and tenant/wallet audience claims. Exact realm/client/JWKS values and SRE responsibilities are in the [epic](../environment.md#local-federation-contract).

## Tasks

- [x] Provision federated Lite client, Yoma identity provider, tenant and audience mappers.
- [x] Validate signature verification against reachable Yoma JWKS.
- [x] Pass real JWT bearer exchange with temporary identities; validate subject/issuer/tenant/audience.
- [x] Remove temporary identities/client; restore investigation changes to Yoma web client.
- [ ] Settle and implement acquisition of a dedicated single-audience assertion.
- [ ] Validate actual Yoma participant login, holder creation/linking and later access.
- [ ] Confirm environment-specific federation setup with SRE before Dev.

## Decisions

- 2026-10-27: Keycloak rejects multiple assertion audiences. Normal Yoma web tokens cannot be passed directly. The passing smoke used a temporary client with audience exactly equal to the consumers issuer.
- 2026-10-27: The basic scope supplies the subject required for exchange. Test client used basic/profile/email; no permanent Yoma web scope/audience changes remain.
- 2026-10-27: Preserve Yoma's actual discovery issuer and use host.docker.internal for reachable JWKS transport, avoiding the two Keycloak hostname collision.
- 2026-10-27: Stop after Local setup. Protocol proof does not complete the participant journey.

## Links

- [Shared contract/SRE handover](../README.md)
- [Session handoff](../handoffs/2026-10-27-c.md)
