# Feature: Alison completion endpoint

## Meta

- **Feature**: Alison completion endpoint
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1213](https://linear.app/didx/issue/YOM-1213/api-integrate-alison-completed-course-data-endpoint)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-05-19

## Problem / Goal

Retrieve completed Alison course outcomes for verification import.

## Out of Scope

- Provider-specific behavior beyond this ticket's contract.

## Plan

This shipped as part of the YOM-1202 verification track. Shared lifecycle rules are documented in the [epic contract](../README.md).

## Tasks

- [x] Alison completed-course data maps into the shared verification contract.
- [x] Integrate the change with the shared PartnerSync verification flow.

## Decisions

- 2026-05-21: Only completed outcomes qualify.

## Links

- Epic: [YOM-1147](../README.md)
- Parent track: [YOM-1202](../YOM-1202-partner-synchronization-verification/feature.md)
- Ticket: [YOM-1213](https://linear.app/didx/issue/YOM-1213/api-integrate-alison-completed-course-data-endpoint)
