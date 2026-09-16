# Feature: IXO Production API and Business Readiness

## Meta

- **Feature**: IXO environment/readiness confirmations
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1276](https://linear.app/didx/issue/YOM-1276/ixo-yie-full-sync-production-api-and-business-readiness)
- **Owner**: Product and SRE, with Adrian
- **Areas**: api
- **Status**: shipped
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
- [x] Receive and validate IXO Stage/testing endpoint and credentials.
- [x] Receive and configure IXO Production endpoint, credentials and Yoma organization.
- [x] Enable Production catalogue synchronization; complete approved-claim Stage verification validation.

## Decisions

- 2026-09-16: Delivery reconciled to shipped from Adrian's production/staging results: World Cleanup Day published in production on 14 September; the approved Impact Task Test claim synchronized on staging on 15 September, with Completed status, 100% progress and participant count one. Credential issuance was queued, not observed as issued in that final run. In-progress claim publication was not demonstrated. Cash-out and CF mapping are separate scope. Historical readiness decisions below are superseded by this delivery update.

- 2026-08-07: Stage may use embedded representative resources until IXO provisions the final environment.
- 2026-08-07: Production synchronization remains disabled in capability configuration until ready.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1276](https://linear.app/didx/issue/YOM-1276/ixo-yie-full-sync-production-api-and-business-readiness)
- API implementation: [YOM-1275](../YOM-1275-api-ixo-yie-full-partner-pull-sync/feature.md)
