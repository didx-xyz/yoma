# Feature: Partner Synchronization — IXO Full Sync

## Meta

- **Feature**: IXO full partner journey
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1274](https://linear.app/didx/issue/YOM-1274/partner-synchronization-ixo-yie-full-sync)
- **Owner**: Adrian
- **Areas**: api
- **Status**: in-progress
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
- [ ] Validate against provisioned IXO Stage/testing APIs.
- [ ] Configure and enable Production when supplied.

## Decisions

- 2026-08-04: IXO is the partner organization; YIE describes the impacts platform/ecosystem.
- 2026-08-04: IXO selects the catalogue subset; Yoma does not manually filter it.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1274](https://linear.app/didx/issue/YOM-1274/partner-synchronization-ixo-yie-full-sync)
- API: [YOM-1275](../YOM-1275-api-ixo-yie-full-partner-pull-sync/feature.md)
- Readiness: [YOM-1276](../YOM-1276-ixo-yie-full-sync-production-api-and-business-readiness/feature.md)
