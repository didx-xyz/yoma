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

- [x] Implement authenticated exact-payout cancellation using IXO's atomic cancel endpoint.
- [x] Expose provider-derived cancellation eligibility in the existing session response, without profile RPCs.
- [x] Cover cancellation replay, ownership, provider refusal and webhook races with isolated tests.
- [ ] Jason: wire cancellation confirmation and session eligibility; validate end-to-end on Stage.

- [x] Prepare nullable country minimum metadata on supported countries and UserProfilePayout.
- [x] Enforce supplied country minimum on both new-payout paths before persistence/reservation.
- [x] Add focused minimum boundary, rounding, lookup and no-side-effect regression tests.
- [x] Map and verify IXO's final extended countries response: lowestMinUsd, zero-to-null and one-hour cache cap.
- [x] Jason: wire profile country minimum into cash-out amount entry and server-error handling (Stage validation remains).

- [x] Add Payout domain, status/type/provider models, repository and migration.
- [x] Add payout creation and status-transition service shell.
- [x] Integrate Treasury capacity and cumulative accounting.
- [x] Add Rewards reservation ledger states and payout link.
- [x] Add profile ledger and active payout information; active prevents a second initiation.
- [x] Expose active status, start time and resume eligibility on the profile; latest outcomes via a user-scoped on-demand endpoint.
- [x] Return validation errors (HTTP 400) for non-positive or fractional reward payout amounts.
- [x] Add reconciliation selection, webhook entry and polling shell.
- [x] Harden provider-reference, retry and terminal-first persistence.
- [x] Complete provider mappings and lifecycle branches against the Yellow Card specification.
- [x] Expose Admin Treasury payout lookup and lightweight paginated search; enrich linked ZLTO detail only by id.
- [x] Verify local recovery from an ambiguous provider-initiation failure, one-active-payout enforcement,
      reward reservation linkage, profile pending-payout balances and webhook replay suppression.
- [ ] Validate expiry, delayed webhook and polling behavior end to end.
- [x] Add best-effort email notifications after settled Completed/Cancelled/Expired/Failed transitions.
- [x] Add one default-enabled payout notification preference and shared email payload.
- [x] Configure the four SendGrid template IDs supplied by Adrian in ignored local settings; committed configuration uses placeholders.
- [ ] Verify deployed template configuration and live email delivery for all four outcomes.
- [x] Add focused maintained tests for cancellation and country-minimum preparation (2026-09-21).
- [ ] Extend automated coverage to the remaining payout lifecycle; temporary tests exercised on
      2026-09-10 were removed before commit at Adrian's request.

## Decisions

- 2026-09-21: Also expose nullable CanCancel on on-demand PayoutTransactionInfo. When an in-memory
  session remains valid, UI can check status without refreshing it. Active payouts use a best-effort
  provider status GET; terminal payouts return false locally, unknown returns null. No profile call,
  settlement or reconciliation is added. This supersedes latest-info's database-only implementation.

- 2026-09-21: Keep CanCancel off the profile. It requires current provider state, unlike local
  CanResume, and a profile RPC adds latency without guaranteeing eligibility at execution time.
  Fetch the existing session when the manage/resume dialog opens; show Continue and Cancel
  before IXO handoff. IXO atomically rechecks the actual cancellation. UI details are in handoff b.

- 2026-09-21: Match existing controller conventions: cancellation returns empty 200 OK, not 204;
  typed Guid model binding validates the unconstrained route parameter. Existing endpoints stay unchanged.

- 2026-09-21: Cancellation targets the exact session payoutId, not whichever payout is active later.
  IXO initiated alone means cancellable; local Processing merges provider states and cannot decide this.
  Successful response uses the existing settlement path under the webhook/reconciliation lock;
  refused or uncertain outcomes never trigger a local release. Shared contract and UI handover
  are in the epic README and handoff 2026-09-21-b.md.

- 2026-09-21: Use dynamic provider country minimums, not the initially proposed global setting or
  conversion response field. Nullable amount + currency follows Yoma's monetary contract. Per
  Adrian's final review direction exposes `payout.countryAvailability.minimumAmount` and
  `payout.countryAvailability.currency`, superseding the parent-level forwarding properties.
  Existing amount/currency remain active-payout-only so profile country changes cannot relabel
  an active payout. Availability flags retain their meaning; the nested model now serializes the minimum metadata.
  The shared contract is recorded once in the epic README; Jason's implementation handoff is
  `handoffs/2026-09-21-a.md`. The initially unmapped adapter is superseded by the final confirmed
  mapping in `handoffs/2026-09-21-c.md`: request limits=true and use lowestMinUsd directly in USD,
  zero/missing/null means no minimum, cache capped at one hour. Cancellation was added later
  in this branch under the separate decision above.

- 2026-09-16: `AppSettings:PayoutEnabledEnvironments` uses the existing comma-separated environment convention, configured as `Staging, Production`. Profile `payout.enabled` reports new-initiation enablement. Both public payout initiation paths reject disabled environments before writes/reservations with HTTP 400. Existing payout resume, reconciliation, webhooks, terminal outcomes and notifications remain operational. Jason must gate new cash-out UI actions independently from existing active-payout rendering. Production credentials and rollout verification remain prerequisites; this flag does not select provider endpoints.
- 2026-09-15 wording review: shorten the Cash-outs preference description to "Updates on your cash-outs". Seed-only change; already-migrated Dev/local databases retain the previous wording until reset/reseed. No preference or notification behavior changes.

- 2026-09-15 final review: payout preference uses a dedicated migration seed helper. Actual SendGrid
  IDs are local-only, not committed; environment configuration supplies them on deployment.

- 2026-09-15 migration review: consolidate the undeployed notification setting with CF/Treasury/Payout
  and SSI, preserving the complete original operations. Keep participant-count repair separate.
  Deployed migrations stay immutable; local/Dev reset is owned by Adrian. See the epic migration note.

- 2026-09-15: Yoma owns payout outcome emails; Adrian has informed IXO. Reuse existing best-effort
  notification delivery: email-only, one user preference, four templates sharing one data model.
  Errors are logged, never affect settlement, and are not retried. No outbox or delivery tracking.
  Send only after a new settled terminal transition commits; replayed terminal events do not resend.
  Early initiation failures without a recorded settled reward do not send misleading refund claims.
  Templates own the subject/heading/body and use simple youth-friendly wording. Omit technical
  references; Completed does not promise final bank delivery.
- 2026-09-15 review: Payout_Youth_* identifies the notification audience, not a payout currency.
  The setting remains User_Notifications_Payouts in the user-notifications group. YoIDWalletURL
  names the destination explicitly. ContentVariables follows other models without enabling phone delivery.
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

- Final visibility decision: profile is active-only, clearing details at closure. Latest outcomes are read
  on demand through a User-role endpoint so old failed/expired payouts do not linger on ordinary profiles.
  No age threshold, new configuration or duplicate ZLTO fields. The shared contract is in the epic README.
- Processing is set at hosted-payout creation, before youth confirmation. Neither that status nor resume
  eligibility may be used to infer that bank delivery has started.
- Do not expose raw provider errors, references or administrative reward details to youth. The outcome
  endpoint uses authenticated identity with no user-id input, and performs no terminal reward lookup.
- Amount input errors use FluentValidation rather than globally mapping ArgumentException to HTTP 400.
  Internal programming/configuration failures retain their existing error classification.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1057](https://linear.app/didx/issue/YOM-1057/api-payout-domain-and-rewards-integration)
