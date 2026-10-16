# Feature: Provider interfaces by scope

## Meta

- **Feature**: Provider interfaces by scope
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1206](https://linear.app/didx/issue/YOM-1206/api-split-partnersync-provider-interfaces-by-sync-scope)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-05-19

## Problem / Goal

Separate entity and verification provider contracts without coupling shared orchestration to transports.

## Out of Scope

- Provider-specific behavior beyond this ticket's contract.

## Plan

This shipped as part of the YOM-1202 verification track. Shared lifecycle rules are documented in the [epic contract](../README.md).

## Tasks

- [x] Provider interfaces expose scope-specific operations.
- [x] Integrate the change with the shared PartnerSync verification flow.

## Decisions

- 2026-05-21: Providers implement only the scopes they support.

## Links

- Epic: [YOM-1147](../README.md)
- Parent track: [YOM-1202](../YOM-1202-partner-synchronization-verification/feature.md)
- Ticket: [YOM-1206](https://linear.app/didx/issue/YOM-1206/api-split-partnersync-provider-interfaces-by-sync-scope)
