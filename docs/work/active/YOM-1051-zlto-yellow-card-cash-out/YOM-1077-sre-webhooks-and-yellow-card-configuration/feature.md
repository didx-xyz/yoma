# Feature: SRE Webhooks and Yellow Card Configuration

## Meta

- **Feature**: Yellow Card SRE configuration
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1077](https://linear.app/didx/issue/YOM-1077/sre-webhooks-and-yellow-card-configuration)
- **Owner**: Adrian and SRE
- **Areas**: api
- **Status**: blocked
- **Started**: 2026-07-28

## Problem / Goal

Configure environment-segregated Yellow Card endpoints, credentials, webhook authentication and
operational schedules without committing secrets.

## Out of Scope

- Inventing configuration names or values before IXO supplies the contract.

## Plan

An empty Yellow Card section and infrastructure registration are safe to retain. Populate Helm and
secret values only after Stage/Production details and webhook security are confirmed.

## Tasks

- [x] Add the provider configuration shell without secrets.
- [x] Add the environment-segregated webhook route shell.
- [ ] Confirm base URLs, authentication, credentials and secret handover.
- [ ] Confirm webhook security, retries and source allow-list requirements.
- [ ] Configure reconciliation schedule if provider polling is supported.
- [ ] Add readiness/health checks required for production.

## Decisions

- 2026-07-28: No speculative provider configuration is introduced.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1077](https://linear.app/didx/issue/YOM-1077/sre-webhooks-and-yellow-card-configuration)
- Technical blocker: [YOM-1079](https://linear.app/didx/issue/YOM-1079)
