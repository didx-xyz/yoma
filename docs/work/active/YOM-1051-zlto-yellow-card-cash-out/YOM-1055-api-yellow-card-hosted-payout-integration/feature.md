# Feature: API Yellow Card Hosted Payout Integration

## Meta

- **Feature**: Yellow Card hosted payout integration
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1055](https://linear.app/didx/issue/YOM-1055/api-yellow-card-hosted-payout-integration)
- **Owner**: Adrian
- **Areas**: api
- **Status**: blocked
- **Started**: 2026-07-28

## Problem / Goal

Initiate and refresh the short-lived hosted Yellow Card payout journey through IXO while exposing
only provider-neutral models to the Payout domain.

## Out of Scope

- Guessing provider payloads, authentication or status values before the specification arrives.
- Persisting a hosted payment URL as durable user/profile state.

## Plan

The IXO Yellow Card infrastructure project, client factory, provider registration and high-level
models exist. Transport methods intentionally remain unimplemented until the technical contract is
confirmed.

## Tasks

- [x] Add dedicated `Yoma.Core.Infrastructure.IXO.YellowCard` project and registration.
- [x] Add hosted-session provider interfaces and high-level models.
- [x] Add initiate/resume domain and User-controller wiring.
- [x] Return active payout data on profile without a stored URL.
- [ ] Implement authentication, initiation and refreshed-session lookup.
- [ ] Map actual request/response/error contracts.
- [ ] Validate token/session expiry against the ZLTO reservation buffer.

## Decisions

- 2026-08-05: Yoma calls IXO with payout reference, user context and USD amount; the Web never calls Yellow Card directly.
- 2026-08-05: Resume requests obtain a fresh URL/session on demand because the token is short-lived.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1055](https://linear.app/didx/issue/YOM-1055/api-yellow-card-hosted-payout-integration)
- Blocker: [YOM-1079](https://linear.app/didx/issue/YOM-1079)
