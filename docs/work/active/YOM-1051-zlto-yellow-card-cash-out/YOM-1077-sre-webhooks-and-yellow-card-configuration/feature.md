# Feature: SRE Webhooks and Yellow Card Configuration

## Meta

- **Feature**: Yellow Card SRE configuration
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1077](https://linear.app/didx/issue/YOM-1077/sre-webhooks-and-yellow-card-configuration)
- **Owner**: Adrian and SRE
- **Areas**: api
- **Status**: in-progress — sandbox contract received, environment configuration pending
- **Started**: 2026-07-28

## Problem / Goal

Configure environment-segregated Yellow Card endpoints, credentials, webhook authentication and
operational schedules without committing secrets.

## Plan

The confirmed non-secret sandbox defaults live in application configuration. Environment secrets,
webhook settings and Production values remain external configuration owned with SRE.

## Tasks

- [x] Add the provider configuration shell without secrets.
- [x] Add the environment-segregated webhook route shell.
- [x] Confirm base URLs, authentication, credentials and secret handover.
- [x] Confirm webhook security, retries and source allow-list requirements.
- [x] Configure reconciliation schedule after provider polling was confirmed.
- [ ] Add readiness/health checks required for production.

## Decisions

- 2026-07-28: No speculative provider configuration is introduced.
- 2026-08-27: IXO's generated OpenAPI and HMAC webhook specification are the configuration contract.
  Secrets remain outside tracked configuration.
- 2026-08-27: IXO specifies raw-body HMAC authentication and at-least-once delivery. No source IP
  allow-list was specified; HMAC, timestamp validation and replay suppression form the inbound
  security boundary.
- 2026-08-27: The existing five-minute payout reconciliation schedule is the missed-webhook
  fallback. Environment configuration must supply ClientSecret and WebhookSigningSecret.
- 2026-08-27: Non-secret operational defaults are ZLTO payout HTTP timeout 30 seconds, IXO HTTP
  timeout 60 seconds, payout lock lease five minutes and webhook timestamp tolerance five minutes.
  The ZLTO reservation threshold is 1800 minutes (30 hours), matching IXO's confirmed maximum lifecycle.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1077](https://linear.app/didx/issue/YOM-1077/sre-webhooks-and-yellow-card-configuration)
- Provider readiness: [YOM-1079](https://linear.app/didx/issue/YOM-1079)
