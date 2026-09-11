# Feature: Verification observability

## Meta

- **Feature**: Verification observability
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1215](https://linear.app/didx/issue/YOM-1215/api-add-partnersync-verification-observability-and-tests)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-05-19

## Problem / Goal

Expose reliable run counts and logs for verification synchronization.

## Out of Scope

- Provider-specific behavior beyond this ticket's contract.

## Plan

This shipped as part of the YOM-1202 verification track. Shared lifecycle rules are documented in the [epic contract](../README.md).

## Tasks

- [x] Processed, succeeded, skipped and failed outcomes are observable.
- [x] Integrate the change with the shared PartnerSync verification flow.

## Decisions

- 2026-05-21: Run aggregates are persisted; detailed skip reasons remain in logs.

## Links

- Epic: [YOM-1147](../README.md)
- Parent track: [YOM-1202](../YOM-1202-partner-synchronization-verification/feature.md)
- Ticket: [YOM-1215](https://linear.app/didx/issue/YOM-1215/api-add-partnersync-verification-observability-and-tests)
