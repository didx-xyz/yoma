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
- [x] Add profile ledger and active payout information; active prevents a second initiation.
- [x] Expose status, start time and resume eligibility on the existing payout profile using one active-or-latest query.
- [x] Return validation errors (HTTP 400) for non-positive or fractional reward payout amounts.
- [x] Add reconciliation selection, webhook entry and polling shell.
- [x] Harden provider-reference, retry and terminal-first persistence.
- [x] Complete provider mappings and lifecycle branches against the Yellow Card specification.
- [x] Expose Admin Treasury payout lookup and lightweight paginated search; enrich linked ZLTO detail only by id.
- [x] Verify local recovery from an ambiguous provider-initiation failure, one-active-payout enforcement,
      reward reservation linkage, profile pending-payout balances and webhook replay suppression.
- [ ] Validate expiry, delayed webhook and polling behavior end to end.
- [ ] Add maintained automated payout regression coverage during technical-debt work; temporary tests
      exercised on 2026-09-10 were removed before commit at Adrian's request.

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
- 2026-09-09: Reconciliation distinguishes an incomplete provider initiation by the absence of
  `Payout.TransactionId`, not solely by the local status. This permits an idempotent retry after a
  failed or ambiguous initiation has already moved the payout to ReconciliationRequired, while an
  existing provider id continues through status reconciliation.

### UI contract follow-up — 2026-09-10

- Final decision: enrich the existing compact payout profile, using one active-or-latest lookup.
  Removed the uncommitted dedicated endpoint and summary model. ZLTO accounting stays under the wallet.
  Active derives from status; amount/currency remain visible for the latest terminal outcome.
  The shared payload and UI interpretation are recorded once in the epic README.
- Processing is set at hosted-payout creation, before youth confirmation. Neither that status nor resume
  eligibility may be used to infer that bank delivery has started.
- Do not expose raw provider errors, references or administrative reward details to youth. No extra
  authorization surface, transaction id or terminal reward lookup was introduced.
- Amount input errors use FluentValidation rather than globally mapping ArgumentException to HTTP 400.
  Internal programming/configuration failures retain their existing error classification.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1057](https://linear.app/didx/issue/YOM-1057/api-payout-domain-and-rewards-integration)
