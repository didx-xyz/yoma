# Feature: Use didx:me for Yoma wallets and credential issuance

## Meta

- **Ticket**: YOM-1309
- **Epic**: [YOM-1306](../README.md)
- **Owner**: Adrian
- **Areas**: API, provider adapter
- **Status**: review — YoID profile replacement reviewed and verified locally; approval and deployed verification pending
- **Branch**: `feature/yom-1306-yoid-revocation-reissuance`

## Goal / Yoma Contract

Implement the provider under the epic's [shared Yoma contract](../README.md#shared-yoma-contract).
No provider selection flag or special issuer seed is required in domain/test-data logic.
Preset mappings preserve immutable schema versions; issuance mappings
bridge Yoma and provider identifiers without becoming a second wallet. All HTTP calls follow
Yoma's shared Flurl/serialization patterns.

Public docs describe Yoma behavior only. Private platform APIs, topology, access instructions,
security configuration and privileged workflows are held in the private engineering/SRE handoff.

## Tasks

- [x] Route Replay failures through the existing issuance Error/retry policy, preserving cleanup identity and retrying as Replay. Remove the global Pending issuance block; verify mixed batches, retry exhaustion, checkpoints and failed saves. See the [follow-up handoff](./handoffs/2026-11-11-b.md).
- [ ] Commit and deploy the reviewed Replay retry follow-up.
- [x] Reconcile the Stage Replay cohort against its private baseline: 599 replacements on v1.1, four known test-account exceptions, all 603 original dates preserved exactly. See the follow-up handoff for verification limits.
- [x] Make unchanged schema PATCH return the existing latest version. Compare complete attributes and artifact type under the existing write lock; verify real additions/removals, implicit system fields, historical reads, shared cache and concurrent identical updates. Include in the same uncommitted follow-up.
- [x] Undo the uncommitted revocation prototype and rename the follow-up branch for phase 1; source restored to the PR #2013 baseline.
- [x] Prove authorized background holder access locally without a holder password or existing login; verify recovery lookup, deletion and replacement. Application integration and the VS job run are now verified; deployed configuration remains outstanding.
- [x] Move Yoma token configuration/acquisition behind the identity-provider contract; preserve encrypted cache binding and separate interactive/background operations.
- [x] Automate local acceptance-webhook registration and signing-secret synchronization in `didxme-init`; verify repeat runs and reset handling. Local platform delivery permissions remain a standalone prerequisite; deployed provisioning is coordinated with Robbie.
- [x] Replace the additional signed tracking attribute with native wallet-ID tracking; issuance waits inline for authenticated acceptance. Local adapter proof and focused failure-path tests passed; review remains open.
- [x] Persist issuance progress before delivery and hold uncertain outcomes for reconciliation. Accepted credentials recover by client referent; a missing wallet result after delivery starts is not permission to issue again.
- [x] Verify the real VS job flow: signed acceptance, native wallet IDs, holder recovery, both credential families recovering with and without tracking rows, and Replay preserving the original issuance date. See the [local results](./handoffs/2026-11-10-e.md).
- [x] Commit/push the phase-1 follow-up and open [draft PR #2025](https://github.com/didx-xyz/yoma/pull/2025).
- [ ] Review the PR #2025 follow-up corrections and confirm the Linear review status/link; obtain approval before publishing further changes.
- [x] Prepare private Stage-only preset refresh and Replay tooling outside the repository, with guarded SQL and isolated PostgreSQL verification. Existing Admin schema Update creates clean versions without changing public attributes. No runtime workaround or Prod cutover migration change.
- [ ] Review and execute that procedure on Stage after deployment/configuration verification, with workers paused and drained; confirm wallet results before restoring schedules.
- [x] Share schema definitions through the existing distributed cache and coordinate cache population/provider writes with the existing ownership-checked distributed lock. Preserve domain reflection metadata and historical schema reads; leave PATCH versioning unchanged for Stage preparation.
- [x] Implement background YoID profile replacement with retained parent history, confirmed revocation, replacement issuance and wallet cleanup. Reuse the existing retry policy and issuance process; ordinary Replay and opportunity snapshots remain unchanged.
- [x] Share profile change detection between API profile updates and internal user upserts; unchanged saves/login timestamps do not queue work. Compare issued claims against the issued schema in the worker before requesting revocation.
- [x] Verify the automated regression suite and apply the new migration to an isolated PostgreSQL database containing an issued credential.
- [x] Review the uncommitted YoID replacement change and run live profile-change/revocation/reissuance tests against local didx:me, including unchanged/unrelated edits, provider status, retained history and retry recovery. See the [local test results](./handoffs/2026-11-11-c.md#live-local-docker-results).
- [ ] Obtain commit/PR approval, coordinate wallet status tags with Jason and verify the replacement flow after deployment. Cryptographic proof validation has not been exercised.
- [x] Separate list lifecycle badges from detail verification status: Issued maps to Verified, Revoked/Expired to Invalid and Unknown to Unknown. See the [UI handover](./handoffs/2026-11-11-c.md#jason--wallet-status-tags).
- [x] Resolve wallet validity through provider receipt verification plus current revocation and signed-expiry checks; no repeated cryptographic verification on view. Presentation/proof verification remains separate.
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
- [x] Implement background reference recovery with explicit handling of ambiguous delivery; verified locally. Deployed verification remains required.
- [x] Implement background Replay lookup/deletion/confirmed absence and preserve issuance dates; verified locally. Stage preparation remains outstanding.
- [ ] Optional: shared Debug-only outbound Flurl logging, controlled by existing logging settings,
  with sensitive data redacted and no duplicated Aries handlers.
- [x] Adrian reviewed, committed and pushed the implementation batch.
- [x] Adrian committed and pushed the Medium API batch on PR #2013 (2026-11-06).
- [x] Adrian committed and pushed the first PR follow-up batch on 2026-11-08.
- [x] Adrian reviewed, committed and pushed the subsequent API corrections from the
  [2026-11-08 handoff](../handoffs/2026-11-08-a.md) on PR #2013.
- [x] Consolidate Jason's required UI adoption and separate exported UI/Keycloak review groups in the
  [2026-11-09 handoff](../handoffs/2026-11-09-a.md); implementation/verification remains with Jason.
- [x] Remove reward-pool edits from ordinary organisation updates; preserve the current pool under the existing transaction lock. Retain initial pools on creation and the dedicated Admin endpoint. Committed and pushed on PR #2013; UI adoption is in the same handoff.
- [x] Check the final 9 November PR review: fix notification/event ordering and fixture-test drift, add missing work-docs metadata, and record the existing cutover decision and redundant guard disposition in the same handoff. Committed and pushed on PR #2013.
- [x] SRE prepared Dev; Adrian confirmed test-user issuance and wallet list/detail for YoID and opportunities on 9 November. This does not establish Stage readiness or multi-replica cache coverage.
- [x] Address the latest API review: preserve current referral accounting during administrative changes/cancellation and filter unrelated wallet types before Yoma-specific format validation. Adrian reviewed, committed and pushed this batch on PR #2013; see the consolidated 9 November handoff.
- [x] Prepare the provider-reset seed in the current unpublished migration; verify preserved dates, current default schema selection and reset state against disposable PostgreSQL.
- [x] Correct the reset to replace historical YoID names with `YoID|Default` across all statuses; verify both credential families resolve current defaults without changing issued dates.
- [x] Initial Stage cutover completed; Adrian confirmed tenant creation, issuance and wallet access. Phase-1 Stage cleanup/reissuance is separate work above.
- [ ] Deferred until Stage preparation: agree rollback/retention before SRE decommissions prior provider data. A DI switch alone
  cannot restore removed data or reinterpret old provider IDs.
- [x] Remove private integration-document versions from the feature history and delete the assessment file; coordinate collaborator resynchronization.

## Decisions

- 2026-11-11, PR #2027 CI follow-up: repeated e2e runs failed before tests started because the hosted runner could not resolve its Azure Ubuntu package mirror. Use the official HTTPS Ubuntu archive/security mirrors in the disposable e2e runner's existing apt mirror list before Playwright installs dependencies. Keep test execution and apt signature verification unchanged; hosted validation is pending the next push.

- 2026-11-11, wallet verification decision: supersedes the initial UI placeholder plan. Provider receipt verification plus current lifecycle checks supplies the display result. Add Expired from signed expiry, with confirmed Revoked taking precedence; both map to Invalid. No fresh signature verification on each view. This is not authorization or proof acceptance. See the updated UI handover.

- 2026-11-11 wallet review: lifecycle status comes from each provider adapter, not domain issuance history. Shared `CredentialStatus` is `Unknown` / `Issued` / `Revoked`. didx:me resolves the correlated issuer credential; Aries requests revocation checks for AnonCreds and reports non-revocable local JWS as issued. Missing correlation or failed status checks remain unknown. Keep native provider enums separate: wallet acceptance and issuer offers are different contracts. See the replacement handoff for read costs and UI handling.
- 2026-11-11 review: use explicit `Reissue` status for queued attribute comparisons and their retries. Unchanged credentials return to `Issued`; changed credentials move to `Revoke`. Pending/Replay work retains its status and records the refresh marker until successful issuance promotes it to `Reissue`. The marker also protects a newer profile change from an older comparison.

- 2026-11-11: Keep YoID profile replacement under YOM-1309. Profile/API, identity/import and photo changes only queue a durable comparison; existing profile ownership rules remain unchanged. Reuse Core hashing for the stored profile projection, excluding login/audit timestamps and resolved labels. The worker compares the current user with the signed claims using the **issued** schema. Fields introduced only in a newer schema do not trigger replacement.
- 2026-11-11: Replacement uses a new issuance row and referent, linked by `ParentId`, and a new issue date. Confirm revocation before allowing that child to issue with the latest configured YoID schema version. Delete the old wallet copy after confirmed replacement, retain the old row and native ID, and show confirmed revocations in list/detail with `status: Revoked` until deletion succeeds, even if cleanup fails. Replay remains same-row cleanup/reissue with its original date. Unsupported adapters retain the existing YoID. See [replacement handoff](./handoffs/2026-11-11-c.md) for recovery limits and verification.

- 2026-11-11 schema PATCH: Stage's explicit refresh and Replay are complete, so remove unconditional version creation for identical definitions. Seeding delegates to the same Update flow as admin PATCH; only private `UpsertSchema` owns change detection. Use the provider's latest-by-name lookup inside the existing distributed write lock, compare trimmed ordinal attribute sets after adding domain-owned system/internal fields and preserve artifact type. An unchanged update returns the current schema with HTTP 200 without provider upsert/cache invalidation; real changes retain the existing write/invalidation flow. No force-version flag or Stage-specific exception. This supersedes the earlier decision to retain unconditional PATCH versioning during Stage preparation.

- 2026-11-11 Replay retries: use the existing Error branch in `UpdateScheduleIssuance` for both cleanup and issuance failures. Read the persisted status/count so cleanup failures retry as Replay, while issuance failures retry as Pending; apply the same configured limit and first-failure count of zero. Exhausted cleanup stays Error with its old credential identity/version/date. Checkpoints do not increment counts, and successful cleanup clears them. After attempting cleanup batches, skip failed items for that run and process eligible Pending work; one failed cleanup must not block other credentials. No migration, provider-specific exception handling or new retry policy.

- 2026-11-11 shared schema cache: cache provider definitions in Valkey, not JSON-ignored domain reflection metadata. Cache hits remain unlocked; misses recheck/populate under the same lock used to invalidate and upsert. Clear before the provider write so partial success followed by failure cannot leave the previous snapshot cached. Use a fixed TTL bounded by the shorter existing lookup expiration setting, a five-minute non-renewing lease and a thirty-second acquisition timeout. No generation marker, new infrastructure or configuration. All replicas must run this change before relying on shared invalidation; thereafter schema updates do not require a separate pod roll. Already-running readers may finish their existing snapshot; lease expiry is not fenced against an overlong operation.

- 2026-11-11 Stage preparation: use the existing Admin schema Update API to explicitly create new versions with unchanged domain attributes; startup comparison cannot detect removal of an infrastructure-only attribute. Preserve historical preset mappings for wallet decoding/Replay. Convert legacy domain tracking IDs to known wallet IDs, or NULL for validated reference recovery, only in the reviewed Stage cohort. Pause workers and complete the rollout on every replica before preparation. One-off operator tooling stays outside the repository; see the [handoff](./handoffs/2026-11-11-a.md).

- 2026-11-10 final review follow-up: acknowledge and log a conflicting acceptance event without replacing its confirmed wallet ID; persistence failures still propagate for retry. Reuse the resolved holder context during issuance without narrowing the recovery scan. Align token invalidation with the acquisition lock budget and preserve the original wallet failure if cache cleanup fails. Retain the existing Keycloak options registration: Adrian rejected isolated timeout validation; positive configuration remains an operator requirement. See the [follow-up handoff](./handoffs/2026-11-10-h.md).

- 2026-11-10 deployment review: initialize existing issuance journal rows to `Accepted` when adding the required status column, as agreed with Adrian. This supersedes the earlier no-backfill decision: deployment precedes manual Stage preparation. New rows explicitly start as `Prepared` in the service. This does not convert legacy credential IDs or replace the manual Stage procedure. Keep the initial journal lookup/insert ReadCommitted, per Adrian's review; the existing job lock owns execution concurrency. This is not an atomic uniqueness guarantee if that lock expires or callers bypass it. Provider calls remain outside transactions. See the [latest review handoff](./handoffs/2026-11-10-g.md).

- 2026-11-10 PR review: check issuance transitions against the locked current row. The identity provider decides whether a client's webhook events should be ignored; exclude all events from the dedicated assertion client before idempotency/user processing, without injecting Keycloak options into the controller. Do not classify other clients by naming conventions or confidential/service-account settings. Retain wallet-wide reference recovery and conservative delivery-error handling. Keep the agreed manual Stage preparation and direct UTC clock; see the [review dispositions](./handoffs/2026-11-10-f.md).

- 2026-11-10: An accepted credential can restore the domain's native wallet ID/version/date even when its issuance journal is missing. Do not fabricate issuer/session references or recreate an incomplete journal. Reads and Replay still use the wallet ID, client referent and retained preset mapping. Issuer/session audit history is unavailable for that recovered attempt. Local jobs verified this for YoID and Opportunity; see the [local results](./handoffs/2026-11-10-e.md).

- 2026-11-10 review: use DateTimeOffset.UtcNow directly, with no injected clock or clock DI. Preserve expiry/timeout coverage using real short lifetimes and expired cache fixtures. See the [implementation review handoff](./handoffs/2026-11-10-d.md) for the local proof and remaining Stage preparation.

- 2026-11-10: Yoma assertion acquisition and configuration belong to the identity-provider adapter. Both token paths use the existing domain-owned provider contract; didx:me has no Keycloak project dependency or Yoma client secrets. Keep the configuration name `KeycloakAdmin.TokenExchange`. Local initialization updates this section; SRE must move deployed configuration before release. Normal issuance will wait inline for the correlated wallet event; background lookup is the recovery path, not a replacement for that event.

- 2026-11-10: Local proof establishes a viable authorized background holder-access route for wallet recovery lookup and deletion. New issuer-side operations are not a prerequisite for this route, subject to deployment approval and application implementation. This supersedes the assumption that only an interim manual process is possible. No production-readiness claim: pending/in-flight issuance, retries, concurrency and deployed permissions still require implementation and verification.
- 2026-11-10: Start phase 1 afresh. Remove last night's uncommitted revocation implementation, interface additions and tests. Phase 1 covers native issuance tracking and an explicitly limited interim recovery approach; YoID replacement/revocation is separate. No environment changes are authorized by this reset. See the [handoff](./handoffs/2026-11-10-a.md).
- 2026-11-09: Use existing transaction/retry and row-lock patterns for referral administrative writes. Validate limits against the locked current totals; preserve cancellation cleanup. Wallet list pages retain structural validation, with Yoma format/date checks after preset matching. Keep the small reward-pool validation chains explicit rather than introducing another abstraction solely for review feedback.
- 2026-11-09: Send required notifications/status events before inline role synchronization so
  a failed external role call cannot skip them. Preserve explicit error/retry behavior and the
  earlier decision against queued role recovery. Retain the migration-driven reset with SRE
  backup/drain/controlled-startup prerequisites; no additional application approval flag.
- 2026-11-09: Existing organisation pools change only through the dedicated endpoint. Full updates
  preserve the current database value under the existing row lock, using the existing repository.
  Creation retains its optional initial pool. No new repository interface or persistence path.
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

Current phase-1 evidence and deployment prerequisites are in the [local debug handoff](./handoffs/2026-11-10-e.md).
Earlier entries below describe their respective runs and do not replace this follow-up's deployment gates.

The subsequent 9 November review retains the existing application-level rejection of mapping
deletion. Adrian rejected adding a database FK-action policy; no provider migration is added.
The [epic handoff](../handoffs/2026-11-09-a.md#subsequent-full-review--five-new-comments)
records this decision and Jason's separate token-bearing navigation telemetry finding.

Cross-cutting Medium API review and required UI adoption are tracked once in the
[epic review handoff](../handoffs/2026-11-06-a.md). This includes validation on the updated PR branch;
the earlier provider-specific results below remain the record of the local integration exercise.
The [PR follow-up handoff](../handoffs/2026-11-08-a.md) records the subsequent review corrections.
The [Jason checklist](../handoffs/2026-11-09-a.md) consolidates remaining UI/Keycloak work, including
the separate security export; it distinguishes existing fixes from findings still needing validation.

The earlier SSI/Core run reported 1,023 total, zero failures/errors and one explicit test not
run (1,022 passed). Local API issuance, list/detail, mobile-to-email continuity and caching have been exercised; this does not
claim completion of browser/Dev or live multi-replica tests. Recovery/Replay are now implemented and locally verified on draft PR #2025; deployed verification and Stage preparation remain release gates.

The reset seed additionally passed disposable PostgreSQL checks for 4 tenants and 56 credential
cases covering all six opportunity types, empty schedules and missing-lookup atomicity. The focused SSI suite passed 348 tests with
one explicit test not run. No deployed or local application database was migrated.

See the [provider-reset handoff](./handoffs/2026-11-03-a.md),
[session / frontend handoff](./handoffs/2026-11-02-a.md) and
[local startup guide](../environment.md). Local SSI parallelism was restored to the configured defaults (5/5) after debugging.
