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
- [x] Add profile ledger and active payout information; active is the resumable state.
- [x] Add reconciliation selection, webhook entry and polling shell.
- [x] Harden provider-reference, retry and terminal-first persistence.
- [x] Complete provider mappings and lifecycle branches against the Yellow Card specification.
- [x] Expose Admin Treasury payout lookup and lightweight paginated search; enrich linked ZLTO detail only by id.
- [ ] Validate expiry, delayed webhook and polling behavior end to end.

## Decisions

- 2026-08-04: Payout owns monetary orchestration; Rewards owns ZLTO reserve/release/process.
- 2026-08-04: Payout states are Initiated, Processing and terminal outcomes; ZLTO states are Reserved, Released and Processed.
- 2026-08-05: Yoma's transaction log is the admin/query source; provider lookup is reconciliation fallback only.
- 2026-08-27: Payout.Transaction remains the payout processing/audit record and
  Reward.Transaction remains the ZLTO reservation/burn/release record. Webhook event transport
  state is not duplicated into a second database workflow.
- 2026-08-27: Treasury exposes the administrative query boundary, but transaction retrieval and
  filtering remain owned by the Payout domain. This does not introduce manual payout actions.
- 2026-08-28: Search returns lightweight transaction rows with the standard youth identity fields:
  user id, username, email, phone number and display name. The repository flattens these fields from the User
  relationship into every payout query, consistent with other transaction-style domain models. Search does not
  resolve linked Reward transactions per row; retrieval by id composes the full audit view. Pagination remains
  API-required, while the service keeps the standard conditional pagination block for future flexibility.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1057](https://linear.app/didx/issue/YOM-1057/api-payout-domain-and-rewards-integration)
