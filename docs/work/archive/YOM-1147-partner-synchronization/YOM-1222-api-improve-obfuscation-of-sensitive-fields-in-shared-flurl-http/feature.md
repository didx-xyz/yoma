# Feature: Shared HTTP log obfuscation

## Meta

- **Feature**: Shared HTTP log obfuscation
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1222](https://linear.app/didx/issue/YOM-1222/api-improve-obfuscation-of-sensitive-fields-in-shared-flurl-http)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-05-19

## Problem / Goal

Prevent configured sensitive values from appearing in shared Flurl request and response logs.

## Out of Scope

- Provider-specific behavior beyond this ticket's contract.

## Plan

This shipped as part of the YOM-1202 verification track. Shared lifecycle rules are documented in the [epic contract](../README.md).

## Tasks

- [x] Authentication and personal values are obfuscated consistently.
- [x] Integrate the change with the shared PartnerSync verification flow.

## Decisions

- 2026-05-21: Observability must not disclose credentials or personal data.

## Links

- Epic: [YOM-1147](../README.md)
- Parent track: [YOM-1202](../YOM-1202-partner-synchronization-verification/feature.md)
- Ticket: [YOM-1222](https://linear.app/didx/issue/YOM-1222/api-improve-obfuscation-of-sensitive-fields-in-shared-flurl-http)
