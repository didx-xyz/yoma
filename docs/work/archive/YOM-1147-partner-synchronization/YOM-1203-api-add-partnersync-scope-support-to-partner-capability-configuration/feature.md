# Feature: PartnerSync scope configuration

## Meta

- **Feature**: PartnerSync scope configuration
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1203](https://linear.app/didx/issue/YOM-1203/api-add-partnersync-scope-support-to-partner-capability-configuration)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-05-19

## Problem / Goal

Add Entity and Verification scope to partner capability configuration so orchestration can select the correct work.

## Out of Scope

- Provider-specific behavior beyond this ticket's contract.

## Plan

This shipped as part of the YOM-1202 verification track. Shared lifecycle rules are documented in the [epic contract](../README.md).

## Tasks

- [x] Scope is persisted and used by partner selection.
- [x] Integrate the change with the shared PartnerSync verification flow.

## Decisions

- 2026-05-21: Verification and Entity capabilities remain independently configurable.

## Links

- Epic: [YOM-1147](../README.md)
- Parent track: [YOM-1202](../YOM-1202-partner-synchronization-verification/feature.md)
- Ticket: [YOM-1203](https://linear.app/didx/issue/YOM-1203/api-add-partnersync-scope-support-to-partner-capability-configuration)
