# Feature: API Payout Domain and Rewards Integration

## Meta

- **Feature**: Payout domain and Rewards integration
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1057](https://linear.app/didx/issue/YOM-1057/api-payout-domain-and-rewards-integration)
- **Owner**: Adrian
- **Areas**: api
- **Status**: in-progress
- **Started**: 2026-08-04

## Problem / Goal

Provide a provider-neutral payout aggregate and orchestration service while Rewards retains the ZLTO
reservation/burn ledger and Treasury retains financial capacity and cumulative accounting.

## Out of Scope

- Actual Yellow Card transport until its contract is supplied.
- Automatic recovery beyond webhook reconciliation and a supported polling fallback.
- Admin/manual payout endpoints in the first release.

## Plan

Persist payout transactions separately from Reward transactions, link reward reservations to a
payout, enforce one active payout per user, and reconcile terminal outcomes idempotently. See the
[epic lifecycle](../README.md).

## Tasks

- [x] Add Payout domain, status/type/provider models, repository and migration.
- [x] Add payout creation and status-transition service shell.
- [x] Integrate Treasury capacity and cumulative accounting.
- [x] Add Rewards reservation ledger states and payout link.
- [x] Add profile ledger and active payout information.
- [x] Add reconciliation selection, webhook entry and polling shell.
- [x] Harden provider-reference, retry and terminal-first persistence.
- [ ] Complete provider mappings and lifecycle branches against the Yellow Card specification.
- [ ] Validate expiry, delayed webhook and polling behavior end to end.

## Decisions

- 2026-08-04: Payout owns monetary orchestration; Rewards owns ZLTO reserve/release/process.
- 2026-08-04: Payout states are Initiated, Processing and terminal outcomes; ZLTO states are Reserved, Released and Processed.
- 2026-08-05: Yoma's transaction log is the admin/query source; provider lookup is reconciliation fallback only.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1057](https://linear.app/didx/issue/YOM-1057/api-payout-domain-and-rewards-integration)
