# Feature: Verification pull contracts

## Meta

- **Feature**: Verification pull contracts
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1207](https://linear.app/didx/issue/YOM-1207/api-add-partnersync-verification-pull-request-and-result-models)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-05-19

## Problem / Goal

Add provider-neutral request and result models for verification synchronization.

## Out of Scope

- Provider-specific behavior beyond this ticket's contract.

## Plan

This shipped as part of the YOM-1202 verification track. Shared lifecycle rules are documented in the [epic contract](../README.md).

## Tasks

- [x] Verification contracts support checkpoints and mapped outcomes.
- [x] Integrate the change with the shared PartnerSync verification flow.

## Decisions

- 2026-05-21: Transport payloads stay inside provider infrastructure.

## Links

- Epic: [YOM-1147](../README.md)
- Parent track: [YOM-1202](../YOM-1202-partner-synchronization-verification/feature.md)
- Ticket: [YOM-1207](https://linear.app/didx/issue/YOM-1207/api-add-partnersync-verification-pull-request-and-result-models)
