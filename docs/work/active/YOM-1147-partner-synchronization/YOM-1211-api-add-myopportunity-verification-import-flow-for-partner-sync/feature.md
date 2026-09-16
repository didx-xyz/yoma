# Feature: MyOpportunity verification import

## Meta

- **Feature**: MyOpportunity verification import
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1211](https://linear.app/didx/issue/YOM-1211/api-add-myopportunity-verification-import-flow-for-partner-sync)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-05-19

## Problem / Goal

Apply validated partner outcomes through the MyOpportunity domain.

## Out of Scope

- Provider-specific behavior beyond this ticket's contract.

## Plan

This shipped as part of the YOM-1202 verification track. Shared lifecycle rules are documented in the [epic contract](../README.md).

## Tasks

- [x] Partner completion and placement outcomes create or update the correct user participation.
- [x] Integrate the change with the shared PartnerSync verification flow.

## Decisions

- 2026-05-21: Imports use domain services rather than direct persistence.

## Links

- Epic: [YOM-1147](../README.md)
- Parent track: [YOM-1202](../YOM-1202-partner-synchronization-verification/feature.md)
- Ticket: [YOM-1211](https://linear.app/didx/issue/YOM-1211/api-add-myopportunity-verification-import-flow-for-partner-sync)
