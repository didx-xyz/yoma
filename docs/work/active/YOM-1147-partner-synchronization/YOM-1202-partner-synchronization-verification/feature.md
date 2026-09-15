# Feature: Partner Synchronization Verification

## Meta

- **Feature**: Verification pull and user linking
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1202](https://linear.app/didx/issue/YOM-1202/partner-synchronization-verification)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-05-19

## Problem / Goal

Import partner-owned completion and placement outcomes into MyOpportunity through the shared sync
domain, with stable user linking, checkpoints, idempotency, retries and observable run outcomes.

## Out of Scope

- Automated revocation after a terminal completed/placed outcome.
- Persisting every skipped item's reason as a separate business record.

## Plan

Capability configuration distinguishes Entity and Verification scopes. The domain selects partners,
tracks date checkpoints, resolves users/opportunities, imports MyOpportunity outcomes and records
run aggregates while provider clients map their own verification payloads.

## Tasks

- [x] Add sync-scope capability configuration and provider interfaces.
- [x] Add verification request/results, validation, tracking and checkpoints.
- [x] Add MyOpportunity import, idempotency, skip and retry behavior.
- [x] Add Alison completion endpoint/configuration and authenticated navigation/linking.
- [x] Add observability and sensitive HTTP-log obfuscation.
- [x] Deploy Alison verification to production.

## Decisions

- 2026-05-21: Stable partner-user links are preferred; current username is fallback only.
- 2026-06-19: Alison imports completed courses only; non-terminal data is not treated as completion.
- 2026-08-11: Scheduled verification can coincide with startup catalogue seeding; this is timing, not an implicit startup execution.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1202](https://linear.app/didx/issue/YOM-1202/partner-synchronization-verification)
