# Feature: Partner Synchronization — IXO Full Sync

## Meta

- **Feature**: IXO full partner journey
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1274](https://linear.app/didx/issue/YOM-1274/partner-synchronization-ixo-yie-full-sync)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-08-04

## Problem / Goal

Integrate IXO as a full pull partner for Learning and Job opportunities, user hand-off/linking and
verification outcomes using the agreed Alison-style POC contract.

## Out of Scope

- Manually curating the IXO catalogue in Yoma.
- Mandatory custom fields before the cross-partner field map is ready.

## Plan

YOM-1275 owns implementation and YOM-1276 owns remaining provider/environment readiness. Shared
PartnerSync rules are in the [epic README](../README.md).

## Tasks

- [x] Implement complete POC-compatible integration.
- [x] Validate embedded Learning/Job feeds and verification locally and on Stage.
- [x] Confirm user context and terminal outcome rules with IXO.
- [x] Validate against provisioned IXO Stage/testing APIs.
- [x] Configure and enable Production.

## Decisions

- 2026-09-16: Delivery reconciled to shipped from Adrian's production/staging results: World Cleanup Day published in production on 14 September; the approved Impact Task Test claim synchronized on staging on 15 September, with Completed status, 100% progress and participant count one. Credential issuance was queued, not observed as issued in that final run. In-progress claim publication was not demonstrated. Cash-out and CF mapping are separate scope. Historical readiness decisions below are superseded by this delivery update.

- 2026-08-04: IXO is the partner organization; YIE describes the impacts platform/ecosystem.
- 2026-08-04: IXO selects the catalogue subset; Yoma does not manually filter it.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1274](https://linear.app/didx/issue/YOM-1274/partner-synchronization-ixo-yie-full-sync)
- API: [YOM-1275](../YOM-1275-api-ixo-yie-full-partner-pull-sync/feature.md)
- Readiness: [YOM-1276](../YOM-1276-ixo-yie-full-sync-production-api-and-business-readiness/feature.md)
