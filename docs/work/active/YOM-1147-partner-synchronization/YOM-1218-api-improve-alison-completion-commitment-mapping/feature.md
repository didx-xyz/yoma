# Feature: Alison commitment mapping

## Meta

- **Feature**: Alison commitment mapping
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1218](https://linear.app/didx/issue/YOM-1218/api-improve-alison-completion-commitment-mapping)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-05-19

## Problem / Goal

Align Alison completion data with the correct Yoma commitment and outcome rules.

## Out of Scope

- Provider-specific behavior beyond this ticket's contract.

## Plan

This shipped as part of the YOM-1202 verification track. Shared lifecycle rules are documented in the [epic contract](../README.md).

## Tasks

- [x] Mapped completions resolve the intended opportunity and participation.
- [x] Integrate the change with the shared PartnerSync verification flow.

## Decisions

- 2026-05-21: Mapping does not weaken terminal outcome rules.

## Links

- Epic: [YOM-1147](../README.md)
- Parent track: [YOM-1202](../YOM-1202-partner-synchronization-verification/feature.md)
- Ticket: [YOM-1218](https://linear.app/didx/issue/YOM-1218/api-improve-alison-completion-commitment-mapping)
