# Feature: IXO Production API and Business Readiness

## Meta

- **Feature**: IXO environment/readiness confirmations
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1276](https://linear.app/didx/issue/YOM-1276/ixo-yie-full-sync-production-api-and-business-readiness)
- **Owner**: Product and SRE, with Adrian
- **Areas**: api
- **Status**: in-progress
- **Started**: 2026-08-04

## Problem / Goal

Move the implemented POC-compatible IXO integration from embedded/sample validation onto provisioned
Stage/testing and Production environments with confirmed business/data rules.

## Out of Scope

- Repeating implementation detail already held in YOM-1275.

## Plan

Track only provider/environment confirmations and validation outcomes. Technical configuration,
payload details and code paths remain in this folder and YOM-1275 rather than Linear.

## Tasks

- [x] Confirm POC compatibility direction and opportunity subset ownership.
- [x] Confirm user hand-off fields and terminal completed/placed behavior.
- [x] Confirm custom fields are optional until the cross-partner capability is ready.
- [x] Validate representative embedded opportunities and verification locally/Stage.
- [ ] Receive and validate IXO Stage/testing endpoint and credentials.
- [ ] Receive and configure IXO Production endpoint, credentials and Yoma organization.
- [ ] Enable external synchronization only after environment validation.

## Decisions

- 2026-08-07: Stage may use embedded representative resources until IXO provisions the final environment.
- 2026-08-07: Production synchronization remains disabled in capability configuration until ready.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1276](https://linear.app/didx/issue/YOM-1276/ixo-yie-full-sync-production-api-and-business-readiness)
- API implementation: [YOM-1275](../YOM-1275-api-ixo-yie-full-partner-pull-sync/feature.md)
