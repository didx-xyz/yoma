# Feature: Verification idempotency and skips

## Meta

- **Feature**: Verification idempotency and skips
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1212](https://linear.app/didx/issue/YOM-1212/api-add-partner-verification-import-idempotency-and-skip-handling)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-05-19

## Problem / Goal

Make repeated verification imports safe and distinguish expected skips from failures.

## Out of Scope

- Provider-specific behavior beyond this ticket's contract.

## Plan

This shipped as part of the YOM-1202 verification track. Shared lifecycle rules are documented in the [epic contract](../README.md).

## Tasks

- [x] Duplicate outcomes are idempotent and expected omissions are counted as skips.
- [x] Integrate the change with the shared PartnerSync verification flow.

## Decisions

- 2026-05-21: Terminal imported outcomes are not reopened automatically.

## Links

- Epic: [YOM-1147](../README.md)
- Parent track: [YOM-1202](../YOM-1202-partner-synchronization-verification/feature.md)
- Ticket: [YOM-1212](https://linear.app/didx/issue/YOM-1212/api-add-partner-verification-import-idempotency-and-skip-handling)
