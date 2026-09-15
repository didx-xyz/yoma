# Feature: Alison verification configuration

## Meta

- **Feature**: Alison verification configuration
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1214](https://linear.app/didx/issue/YOM-1214/api-add-alison-verification-sync-configuration)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-05-19

## Problem / Goal

Configure Alison's verification capability and scheduled processing.

## Out of Scope

- Provider-specific behavior beyond this ticket's contract.

## Plan

This shipped as part of the YOM-1202 verification track. Shared lifecycle rules are documented in the [epic contract](../README.md).

## Tasks

- [x] Alison verification can be enabled independently of entity synchronization.
- [x] Integrate the change with the shared PartnerSync verification flow.

## Decisions

- 2026-05-21: Secrets and environment values remain deployment configuration.

## Links

- Epic: [YOM-1147](../README.md)
- Parent track: [YOM-1202](../YOM-1202-partner-synchronization-verification/feature.md)
- Ticket: [YOM-1214](https://linear.app/didx/issue/YOM-1214/api-add-alison-verification-sync-configuration)
