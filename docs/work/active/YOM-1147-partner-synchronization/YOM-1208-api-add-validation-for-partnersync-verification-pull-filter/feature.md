# Feature: Verification filter validation

## Meta

- **Feature**: Verification filter validation
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1208](https://linear.app/didx/issue/YOM-1208/api-add-validation-for-partnersync-verification-pull-filter)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-05-19

## Problem / Goal

Validate verification pull filters before invoking a provider.

## Out of Scope

- Provider-specific behavior beyond this ticket's contract.

## Plan

This shipped as part of the YOM-1202 verification track. Shared lifecycle rules are documented in the [epic contract](../README.md).

## Tasks

- [x] Invalid checkpoint and paging inputs are rejected.
- [x] Integrate the change with the shared PartnerSync verification flow.

## Decisions

- 2026-05-21: Validation is shared across providers.

## Links

- Epic: [YOM-1147](../README.md)
- Parent track: [YOM-1202](../YOM-1202-partner-synchronization-verification/feature.md)
- Ticket: [YOM-1208](https://linear.app/didx/issue/YOM-1208/api-add-validation-for-partnersync-verification-pull-filter)
