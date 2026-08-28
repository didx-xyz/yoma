# Feature: API Yellow Card Hosted Payout Integration

## Meta

- **Feature**: Yellow Card hosted payout integration
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1055](https://linear.app/didx/issue/YOM-1055/api-yellow-card-hosted-payout-integration)
- **Owner**: Adrian
- **Areas**: api
- **Status**: in-progress — provider client implemented, sandbox E2E pending
- **Started**: 2026-07-28

## Problem / Goal

Initiate and refresh the short-lived hosted Yellow Card payout journey through IXO while exposing
only provider-neutral models to the Payout domain.

## Out of Scope

- Guessing provider payloads, authentication or status values before the specification arrives.
- Persisting a hosted payment URL as durable user/profile state.

## Plan

The IXO Yellow Card infrastructure project now implements the OAuth2 client-credentials and
provider-neutral hosted payout boundary against IXO's generated sandbox OpenAPI contract.

## Tasks

- [x] Add dedicated `Yoma.Core.Infrastructure.IXO.YellowCard` project and registration.
- [x] Add hosted-session provider interfaces and high-level models.
- [x] Add initiate/resume domain and User-controller wiring.
- [x] Return active payout data on profile without a stored URL; active is the resumable state.
- [x] Implement authentication, initiation and refreshed-session lookup.
- [x] Map actual request/response/error contracts.
- [x] Reject expired sessions and non-terminal sessions that do not expire before the ZLTO reservation.
- [x] Set the final ZLTO reservation duration from IXO's confirmed lifecycle.

## Decisions

- 2026-08-05: Yoma calls IXO with payout reference, user context and USD amount; the Web never calls Yellow Card directly.
- 2026-08-05: Resume requests obtain a fresh URL/session on demand because the token is short-lived.
- 2026-08-27: IXO's generated sandbox OpenAPI is authoritative for OAuth, initiation, session refresh,
  reconciliation lookup and provider errors. Yoma's payout id is the IXO idempotency/reference key.
- 2026-08-27: Required payout profile data is validated before payout creation and ZLTO reservation.
  An email is required because the hosted IXO journey supports email login.
- 2026-08-27: IXO initiated and processing both map to Yoma Processing; the remaining provider
  statuses map directly to Yoma's terminal payout statuses.
- 2026-08-27: Hosted sessions last approximately 30 minutes and are renewable while the payout is active.
  Although IXO technically permits session refresh after completion, Yoma treats Completed as final and does
  not expose a resume action. Unconfirmed payouts remain
  active for 24 hours; confirmed payouts cannot expire and reach a terminal state within approximately six
  additional hours at worst. The ZLTO reservation is therefore fixed at 30 hours.
- 2026-08-27: IXO requests use a 60-second transport timeout and hosted links must be HTTPS. These
  controls are independent from the provider-returned session expiry and ZLTO reservation duration.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1055](https://linear.app/didx/issue/YOM-1055/api-yellow-card-hosted-payout-integration)
- Provider readiness: [YOM-1079](https://linear.app/didx/issue/YOM-1079)
