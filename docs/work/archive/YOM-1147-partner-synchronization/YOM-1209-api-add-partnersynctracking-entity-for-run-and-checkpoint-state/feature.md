# Feature: Verification run tracking

## Meta

- **Feature**: Verification run tracking
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1209](https://linear.app/didx/issue/YOM-1209/api-add-partnersynctracking-entity-for-run-and-checkpoint-state)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-05-19

## Problem / Goal

Persist synchronization runs and verification checkpoint state.

## Out of Scope

- Provider-specific behavior beyond this ticket's contract.

## Plan

This shipped as part of the YOM-1202 verification track. Shared lifecycle rules are documented in the [epic contract](../README.md).

## Tasks

- [x] Run state and date checkpoints survive process restarts.
- [x] Integrate the change with the shared PartnerSync verification flow.

## Decisions

- 2026-05-21: Tracking represents orchestration state, not provider payloads.

## Links

- Epic: [YOM-1147](../README.md)
- Parent track: [YOM-1202](../YOM-1202-partner-synchronization-verification/feature.md)
- Ticket: [YOM-1209](https://linear.app/didx/issue/YOM-1209/api-add-partnersynctracking-entity-for-run-and-checkpoint-state)
