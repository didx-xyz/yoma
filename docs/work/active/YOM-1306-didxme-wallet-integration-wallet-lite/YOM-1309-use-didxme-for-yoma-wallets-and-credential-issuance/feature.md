# Feature: Use didx:me for Yoma wallets and credential issuance

## Meta

- **Ticket**: YOM-1309
- **Epic**: [YOM-1306](../README.md)
- **Owner**: Adrian
- **Areas**: API, provider adapter
- **Status**: in-progress — local issuance/read/cache flow verified; release gates remain
- **Branch**: `feature/yom-1306-didxme-wallet-integration-wallet-lite`

## Goal / Yoma Contract

Implement the provider under the epic's [shared Yoma contract](../README.md#shared-yoma-contract).
No provider selection flag or special issuer seed is required in domain/test-data logic.
Preset mappings preserve immutable schema versions; issuance mappings
bridge Yoma and provider identifiers without becoming a second wallet. All HTTP calls follow
Yoma's shared Flurl/serialization patterns.

Public docs describe Yoma behavior only. Private platform APIs, topology, access instructions,
security configuration and privileged workflows are held in the private engineering/SRE handoff.

## Tasks

- [x] Scaffold and wire the infrastructure using Yoma conventions.
- [x] Support SDJWT for both YoID and opportunity credentials.
- [x] Persist schema/credential mappings while retaining domain identity contracts.
- [x] Implement provisioning, issuance and authenticated wallet list/detail operations.
- [x] Verify Local startup/seeding, worker issuance and authenticated API list/detail.
- [x] Add encrypted shared holder caching with common Core encryption; Adrian verified it locally.
- [x] Keep existing domain filtering, sorting and pagination unchanged.
- [x] Validate full credential attribute names during preset seeding; shorten the two source CF keys.
- [x] Verify YoID detail, available entrepreneurship fields/optional omissions, schema filters, paging and refreshed-token reads through the local API.
- [x] Accept both renamed entrepreneurship fields after schema verification — Adrian accepted this coverage; populated values were not exercised in the local run.
- [ ] Complete credential rendering checks in the UI with Jason.
- [ ] Verify browser/mobile identity flows with Jason (YOM-1308).
- [x] Adrian verified mobile-only registration/profile onboarding, YoID issuance/listing, then adding email and listing the existing credential after signing out/in with email.
- [x] Adrian confirmed credential detail access after the mobile-to-email transition; the existing YoID was returned.
- [ ] Verify caching across deployed API replicas.
- [x] Jason's five frontend CF references aligned (2026-11-05, this branch; see `handoffs/2026-11-05-a.md`). Staging rollout coordination still open.
- [x] UI navigation destinations checked after the API's HTTP/HTTPS URL rule (Adrian's 2026-11-03 follow-up): "Go to opportunity" now refuses non-http(s) links and drops the opener; other data links already safe (see `handoffs/2026-11-06-a.md`).
- [ ] REQUIRED: implement supported issuance recovery/reconciliation.
- [ ] REQUIRED: implement background Replay lookup/deletion/confirmed absence and preserve issuance dates.
- [ ] Optional: shared Debug-only outbound Flurl logging, controlled by existing logging settings,
  with sensitive data redacted and no duplicated Aries handlers.
- [x] Adrian reviewed, committed and pushed the implementation batch.
- [x] Adrian committed and pushed the Medium API batch on PR #2013 (2026-11-06).
- [x] Adrian committed and pushed the first PR follow-up batch on 2026-11-08.
- [x] Adrian reviewed, committed and pushed the subsequent API corrections from the
  [2026-11-08 handoff](../handoffs/2026-11-08-a.md) on PR #2013.
- [x] Consolidate Jason's required UI adoption and separate exported UI/Keycloak review groups in the
  [2026-11-09 handoff](../handoffs/2026-11-09-a.md); implementation/verification remains with Jason.
- [ ] Provision/verify Dev with SRE, separating once-off setup from ongoing configuration/secrets.
- [x] Prepare the provider-reset seed in the current unpublished migration; verify preserved dates, current default schema selection and reset state against disposable PostgreSQL.
- [x] Correct the reset to replace historical YoID names with `YoID|Default` across all statuses; verify both credential families resolve current defaults without changing issued dates.
- [ ] Rehearse coordinated cutover and reissuance before Stage: drain workers, back up state, provision matching SDJWT schemas,
  rebuild mappings and reconcile both credential families. Migration preparation does not authorize environment execution.
- [ ] Deferred until Stage preparation: agree rollback/retention before SRE decommissions prior provider data. A DI switch alone
  cannot restore removed data or reinterpret old provider IDs.
- [x] Remove private integration-document versions from the feature history and delete the assessment file; coordinate collaborator resynchronization.

## Decisions

- 2026-11-08, Adrian's review: synchronize administrator roles inline after membership commits.
  Remove the ad hoc Hangfire retry and its job-facing interface method. Preserve the per-user lock,
  current-membership checks and normal API errors. A failed external call requires an explicit retry;
  a failed database commit never changes roles. This supersedes the queued-recovery approach.
- 2026-11-08: Preserve literal comparisons and unclosed brackets during HTML-to-text conversion,
  while continuing to remove multiline source tags. UI rendering still requires its own protection.
- 2026-11-08: Extend the one-off cutover seed to reset existing opportunity schema selections,
  not only issuance schedules. Future completions then use the same current defaults. Preserve
  issuance enablement and leave disabled opportunities without a selection unchanged.
- 2026-11-08: Wallet listing skips credentials whose signed correlation has no local issuance
  record, for example after a Yoma-only reset. Existing but conflicting holder/tenant/preset
  mappings still fail validation. This does not implement recovery or prove remote absence.
- 2026-11-03: Add the one-off reset to `20261102114553_ApplicationDb_SSI_DidxMe` as a separate seed class.
  Reset all tenant/issuance schedules to Pending, clear provider IDs/version/retry state and use SDJWT.
  Keep Aries storage, scheduling identity and issuance dates. Legacy Issued rows missing a date
  use their previous modification date, matching the earlier date-backfill convention. Block automatic Down;
  old provider IDs cannot be reconstructed from the reset schedules.
- 2026-11-03: At Adrian's request, cutover replaces every opportunity schedule's schema name, including custom
  selections: ImpactAction, Event, Job and Entrepreneurship use their type-specific default; Learning and Other
  use `Opportunity|Default`. This includes previously issued rows being reset.
  Issuance resolves the latest version for the selected name and reuses DateIssued on the normal Pending path.
  No Replay state or domain behavior change is required for provider cutover.
- 2026-11-03 review correction: reset every YoID schedule to `YoID|Default` as well, including historical
  names in Pending, Issued, Error and Replay. SRE must align `SSISchemaFullNameYoID` with that default.
  This supersedes the earlier decision to preserve YoID names; both families resolve the latest seeded version.
- Keep organisation scheduling and Aries signing behavior unchanged. Adapt current didx:me
  signing in infrastructure; future per-organisation signing is a separate design decision.
- Schema and issuance stores preserve the current domain contract. Aries infrastructure is retained
  for a planned rollback requiring compatible configuration and restored provider mappings/data;
  switching DI does not restore IDs cleared by the reset migration or the previous runtime state.
- Validate complete attribute names in preset seeding, not unrelated entity/CF read paths.
- Shorten source CF names with ID-preserving migration; coordinate web and CSV references.
- 2026-11-02: Cache holder tokens securely across requests; retain issuer caching behavior.
  This improves online access and does not solve background operations.
- 2026-11-02: Retain full provider-page traversal and domain pagination for correct filtering/order.
- 2026-11-02: Sanitize all public integration documentation. Private platform research and setup
  details are preserved privately; affected feature history was subsequently sanitized.
- 2026-11-02: Read-only local API verification passed 55 checks, including all 16 fixture
  credential details and cross-holder isolation. Adrian also confirmed mobile/email-change
  listing and detail access; browser rendering checks are still outstanding. Adrian accepted the renamed-field coverage
  without requiring an additional populated-value fixture run.

## Verification / Handoff

Cross-cutting Medium API review and required UI adoption are tracked once in the
[epic review handoff](../handoffs/2026-11-06-a.md). This includes validation on the updated PR branch;
the earlier provider-specific results below remain the record of the local integration exercise.
The [PR follow-up handoff](../handoffs/2026-11-08-a.md) records the subsequent review corrections.
The [Jason checklist](../handoffs/2026-11-09-a.md) consolidates remaining UI/Keycloak work, including
the separate security export; it distinguishes existing fixes from findings still needing validation.

The earlier SSI/Core run reported 1,023 total, zero failures/errors and one explicit test not
run (1,022 passed). Local API issuance, list/detail, mobile-to-email continuity and caching have been exercised; this does not
claim completion of browser/Dev or live multi-replica tests. Recovery/Replay block production use.

The reset seed additionally passed disposable PostgreSQL checks for 4 tenants and 56 credential
cases covering all six opportunity types, empty schedules and missing-lookup atomicity. The focused SSI suite passed 348 tests with
one explicit test not run. No deployed or local application database was migrated.

See the [provider-reset handoff](./handoffs/2026-11-03-a.md),
[session / frontend handoff](./handoffs/2026-11-02-a.md) and
[local startup guide](../environment.md). Local SSI parallelism was restored to the configured defaults (5/5) after debugging.
