# Feature: Prevent duplicate youth actions from concurrent submissions

## Meta

- **Feature**: Selected youth API request serialization
- **Epic**: [YOM-1302](../README.md)
- **Ticket**: [YOM-1302](https://linear.app/didx/issue/YOM-1302/prevent-duplicate-youth-actions-from-concurrent-submissions)
- **Owner**: Adrian
- **Areas**: api
- **Status**: review — twelve assessed self-service mutations and controlled concurrency checks pass; release review pending
- **Started**: 2026-10-22

## Problem / Goal

Prevent overlapping youth web requests from racing existing database duplicate checks. Start with the confirmed referral claim-initiation and instant-verification failures, without changing imports, background jobs or domain rules.

## Plan

Add an opt-in MVC action filter backed by a new bounded `IDistributedLockService.TryRunWithLockAsync` method. Resolve the authenticated Yoma user through the existing user service, combine its ID with MVC's full controller type and method signature, then invoke unchanged controller/service code inside the lock. Reuse persisted-state checks rather than adding a Redis completion marker. No assembly scan or request-supplied key is involved.

Apply the guard to the twelve assessed mutations listed below, not every write verb. Related save/remove, manual/instant/delete verification, referral initiation/claim and profile/onboarding methods share explicit controller-local scopes. Viewed, external navigation and organisation creation keep default per-method keys. Null, empty or whitespace scope values use the default key; nonblank values are trimmed. Reads, harmless repeats, already-protected flows and administrative endpoints are excluded. No migrations, dependencies, request or response payload-shape changes. Two timing settings are added directly under `AppSettings`; no ingress, global request-timeout or existing background-lock settings change.

Acquisition retries use `AppSettings.DistributedLockUserActionAcquireTimeoutInMilliseconds` (default `2000`) and the existing retry delay, capped to the remaining budget. Zero means one immediate attempt without waiting; negative acquisition budgets are rejected before locking or executing the action. The Redis lease uses `AppSettings.DistributedLockUserActionLeaseDurationInSeconds` (default `120`), must be positive and is crash recovery, not a minimum hold time. The configured lease is the full duration including any buffer; nothing is added in code. Release is immediate in `finally` and compares a unique per-attempt owner token. Redis command latency remains subject to the existing client's transport timeouts. The lease is not renewed: this mitigates a brief race and does not promise exactly-once processing or coverage after expiry/failover.

Robbie is being asked for effective upstream request timeouts to inform the operational lease value. No ASP.NET request execution timeout is configured in this API, and no such timeout exists by default. An upstream timeout does not prove the action stopped; choose the lease to cover ongoing work rather than expiring it solely because a proxy gave up waiting. Environment overrides use `AppSettings__DistributedLockUserActionAcquireTimeoutInMilliseconds` and `AppSettings__DistributedLockUserActionLeaseDurationInSeconds` through the existing configuration binding.

## Tasks

- [x] Confirm latest successful Production release and fast-forward local `current`.
- [x] Branch from deployed `v3.13.4` and inspect both reported unique constraints.
- [x] Add reusable opt-in request guard and annotate exactly the two reported actions.
- [x] Verify same-user/action serialization, independent users/actions/overloads, persisted-state rechecks and failure/retry behavior.
- [x] Verify MVC activation, endpoint coverage and existing test suite.
- [x] Make acquisition wait and absolute lease lifetime independently configurable, document units/zero/invalid behavior, and verify configured values reach the lock helper unchanged.
- [x] Record handoff and known lock-lease limitations for Adrian's review; do not commit or push.
- [x] Exercise the actual MVC/controller/filter pipeline through two independent HTTP hosts and cache connections, with isolated PostgreSQL uniqueness and rollback checks; explicitly document stubbed business/provider boundaries.
- [x] Add the dedicated in-progress exception, HTTP 409 response mapping, informational/409 logging and shared Swagger error response; retain existing body shape and validation mappings.
- [x] Assess further coverage and, at Adrian's request, add the three MyOpportunity read-before-insert actions plus referral claiming; share the referral initiation/claim scope and test overlap in both directions.
- [x] Address the eight reported IDE recommendations without suppressing them: shared JSON options, logger invocation assertions, concurrent dictionary IsEmpty, collection expression, authorization builder and System.Threading.Lock.
- [x] Audit all 185 routed actions across 14 controllers; explicitly exclude GETs, read-only POSTs and harmless repeats per Adrian's instruction.
- [x] Add the six further assessed mutations, coordinate overlapping state through three additional shared scopes, and test all twelve routes plus related-action ordering in both directions.
- [x] Normalize blank optional scopes instead of throwing, as requested by Adrian, and test null/empty/whitespace/trimmed values.
- [x] Adrian approved the twelve selected actions and guard implementation; do not broaden coverage.
- [x] Supplement Swagger with 409 only for attributed actions, preserving independently declared responses and all runtime behavior.
- [x] Adrian approved the final Swagger refinement, commit and push of the hotfix working branch.
- [ ] PR into `current`, complete checks and release approval, then forward-port the isolated hotfix into `master` for Stage.

## Decisions

- 2026-10-22: Prefer an opt-in API action filter over domain-wide locking because only youth web-initiated entry points are in scope. This also avoids nested locking when domain services call one another.
- 2026-10-22: Do not use a generic Redis seen-request marker. It does not represent committed database success, cannot safely distinguish a legitimate repeat save after unsave, and cannot replay multipart verification responses without a larger contract.
- 2026-10-22: Preserve current validation/no-op outcomes. The hotfix removes the race, not every visible duplicate warning or existing business rule.
- 2026-10-22: Reuse existing fixed-duration lock semantics and retain database constraints as the final backstop. Explicitly review lease expiry and waiting behavior before calling this universally safe; do not silently expand this hotfix into a shared lock rewrite.
- 2026-10-22: Adrian confirmed simple opt-in attributes and limited the first review to the two reported actions. Removed the exploratory annotations from all adjacent actions before testing.
- 2026-10-22: Adrian requested per-user/action keys, not a user-wide lock. Use full MVC controller type plus method signature to include namespaces and distinguish overloads; do not use runtime action IDs, raw URLs or build-specific metadata tokens.
- 2026-10-22: Added a separate bounded-wait helper using Redis `LockTakeAsync`/`LockReleaseAsync` and an owner token. Existing `TryAcquireLockAsync`, `ReleaseLockAsync` and `RunWithLockAsync` callers are unchanged. A busy request returns the existing business-validation error shape, and a Redis acquisition failure does not execute unlocked.
- 2026-10-22: Adrian requested both timings directly under `AppSettings`. Keep the existing defaults (2000 ms acquisition, 120 s lease) pending operational review. The lease is an absolute value including any buffer, not a request-timeout baseline; no automatic proxy discovery, hidden buffer, global HTTP timeout or lease renewal is introduced. Millisecond acquisition units allow tuning below one second; zero is a single immediate attempt, not an infinite wait.
- 2026-10-22: On Adrian's request, use `RequestInProgressException` and HTTP 409 Conflict for exhausted contention, not `BusinessException`/400. This is a conflict with an in-flight operation, not malformed input or rate limiting. Preserve the error list/message, add the shared Swagger response, and log this expected outcome as informational/409 rather than a server error. Existing BusinessException and validation mappings are unchanged.
- 2026-10-22: Adrian approved assessed additions, not blanket coverage. Viewed/Saved/external navigation each have a read-before-insert race. The action-link claim already routes through guarded instant verification. Add the actual referral claim and give it the same optional controller-local scope as initiation; ordinary attribute usage and default per-method keys remain unchanged. No financial/admin/callback/job annotations or domain rule changes.
- 2026-10-22: The full controller audit identified six further worthwhile actions. Save removal can race the repository's delete/re-read and must also coordinate with saving. Manual verification/delete share state with instant verification and evidence work. Profile update can invoke YoID onboarding and schedule SSI work, so it shares onboarding's scope. Organisation creation has read-before-create name/name-hash checks. Add only controller attributes/imports; business-service implementations remain unchanged.
- 2026-10-22: Exclude all GETs, read-only POSTs and harmless repeats as Adrian requested. Leave already row-locked referral creation and payout flows alone. Marketplace purchase needs a durable business operation identity if duplicate completed purchases must be prevented; serializing it alone is insufficient.
- 2026-10-22: Adrian requested blank optional scope values to behave as omitted values, not configuration errors. Normalize null/empty/whitespace to null and trim actual scopes.
- 2026-10-22: Adrian approved the coverage/filter and requested conditional Swagger metadata. `ProducesResponseTypesErrorFilter` inspects the method's `UserActionLockAttribute` before adding 409. Unguarded GET, read-only POST and harmless update examples receive only existing common errors. Do not remove a 409 explicitly declared for another reason. Runtime middleware/filter behavior is unchanged.

## Controlled Concurrency Evidence

`UserActionLockIntegrationTests` runs against explicit disposable loopback storage only, via `YOMA_USER_ACTION_TEST_POSTGRES` (database prefix `yoma_request_lock_*`) and `YOMA_USER_ACTION_TEST_REDIS`. It starts two independent HTTP test hosts and Redis-compatible Valkey connections, invoking the real selected controllers, MVC guard, distributed lock service and exception middleware. Referral initiation uses the actual domain service with a SQL-backed repository double. The other MyOpportunity operations and referral claiming use read-before-write test doubles; the claim/initiate tests establish shared-scope ordering, not the complete claim business pipeline. PostgreSQL uses a constrained test ledger, not the production EF schema. This proves the request gate, committed-state ordering and rollback/retry mechanism; it does not prove live reward, wallet, provider, EF, notification or failover behavior. Existing domain regression tests still exercise claim rules, and the business-service source files are unchanged.

Double requests using either the same or different links for one target/user returned two HTTP 200s and one persisted write. Contended completion in the first batch was approximately 217–241 ms with the existing 200 ms retry delay. In 32-request bursts, one write persisted; contenders returned 200 or the intended 409 after approximately two seconds, never 500. Further tests cover all twelve selected routes, including multipart manual-verification/organisation requests, both claim/initiate overlap orders, independent users/actions, failure/rollback/retry, cancelled HTTP waiters, real lease expiry, and an expired owner being unable to release its successor. Unit tests assert exact shared keys and dispatch ordering in both directions for save/remove, manual/instant/delete verification and profile/onboarding. New route business operations use ledger doubles: this establishes binding and guard lifetime, not real deletion, onboarding or organisation outcomes. Dedicated response tests check 409, existing 400/500 mappings, informational logging and shared Swagger schema. The external-navigation test deliberately preserves MVC's 204 for null sync info instead of altering API behavior. Final verification: 71 focused tests pass; regression 427 total, 412 passed, 15 pre-existing PostgreSQL integration skips, no failures (live WhatsApp excluded). Release build: zero warnings/errors; targeted formatting verification passed.

Follow-up Swagger verification: Release build remains at zero warnings/errors; 53 non-storage guard/response tests pass, including four new cases for unguarded GET/read-only POST/update actions and preservation of an explicit 409. The positive guarded-action schema test still passes. The 71-focused/427-regression totals above are the preceding full concurrency-batch run; the 22 HTTP/cache/database cases were not rerun for this metadata-only refinement.

## Reviewed Action Coverage

| Action group | Assessment | Next step |
| --- | --- | --- |
| MyOpportunity Viewed, NavigatedExternalLink | Each queries by user/opportunity/action and then inserts when absent. | Default per-method attributes; cross-host tests. |
| MyOpportunity Saved, SavedRemove | Save queries then inserts; delete can race its repository re-read/removal. Both alter the same saved record. | Shared `PerformActionSaved` scope; exact-key, both-direction ordering and native-route tests. |
| MyOpportunity SendForVerificationManual, InstantVerification, SendForVerificationManualDelete | Can race verification status and evidence/state changes. | Shared `PerformActionSendForVerificationManual` scope; exact-key, both-direction ordering and multipart/native-route tests. Existing domain validation remains unchanged. |
| Referral ClaimAsReferee and ClaimAsRefereeInitiate | Can create/update the same user/programme usage; separate method keys would miss their overlap. | Applied the same explicit per-user/controller scope to both, with an exact-key unit test and cross-host overlap tests in both orders. Existing claim validation/no-op rules are unchanged. |
| Referral link creation | Existing transaction locks the programme row before querying/creating a link. | Do not add a redundant guard in this hotfix; preserve current transaction behavior. |
| User UpdateProfile, YoIDOnboard | Profile update can invoke onboarding; onboarding sets user state and schedules SSI work. | Shared `UpdateProfile` scope. This coordinates these web entries only, not unguarded domain/job writers. |
| Organization Create | Authenticated self-service registration queries name/name hash before creation and related setup. | Default per-method attribute; multipart native-route test. Different users remain independent and database rules remain the backstop. |
| Marketplace purchase / cash-out | Financial flows have provider/reservation semantics; cash-out already has payout locks. A sequential second purchase may be valid and would not be deduplicated by this attribute. | Exclude from this hotfix; a separate financial/idempotency review is required, not an untested attribute rollout. |
| Reads, searches, admin, imports, callbacks and jobs | Outside the agreed youth web mutation slice. | Leave unchanged. |

## Complete Controller Audit

The inventory was checked against all routed HTTP attributes: 185 actions across 14 controllers, of which 76 are GETs and 109 are non-GETs. Of the non-GETs, 31 explicitly accept the User role: 9 are read-only and 22 are self-service mutations. The remaining 78 are 68 administrative/org-admin actions and 10 anonymous/B2B/callback entries. Classification is based on the controller and called service, not just the HTTP verb.

| Controller | Total routes | Non-GET routes |
| --- | ---: | ---: |
| ActionLink | 7 | 6 |
| Analytics | 7 | 4 |
| ExternalPartner | 2 | 1 |
| Lookup | 7 | 0 |
| MarketPlace | 16 | 11 |
| MyOpportunity | 21 | 15 |
| NewsFeed | 2 | 1 |
| Opportunity | 40 | 20 |
| Organization | 17 | 12 |
| Referral | 36 | 23 |
| SSI | 8 | 4 |
| Treasury | 5 | 2 |
| User | 15 | 8 |
| Webhook | 2 | 2 |

The twelve protected mutations are enumerated in the coverage table above and an exact reflection whitelist test. The ten remaining User-role mutations were assessed as follows:

| Controller/action | Exclusion reason |
| --- | --- |
| Referral CreateLink | Existing transaction obtains the programme row lock before querying/creating; no redundant guard. |
| Referral UpdateLink | Identical repeated name/description assignment is harmless. Different-link rename collisions are a separate entity-scoped concern. |
| Referral CancelLink | Already-cancelled is a no-op; retain existing transactional/domain handling. |
| User UpsertPhoto | File replacement/version lifecycle is a separate concern; serialization alone does not deduplicate identical files or define replacement intent. |
| User DeletePhoto | Missing photo is already a no-op; reference is cleared and blob retained. |
| User UpdateSettings | Repeated identical assignments are harmless. General simultaneous different edits are not duplicate submission. |
| User PayoutZlto | Existing treasury row lock and active-payout check protect creation; downstream work has payout locks. |
| User CancelPayout | Existing payout-ID lock and re-read/state checks; leave financial flow unchanged. |
| Organization UpdateLogo | File lifecycle/replacement semantics, user creation-flow restrictions and admin writers need a separate assessment; not included merely because it is a write. |
| MarketPlace BuyItem | Two sequential requests can legitimately buy two items. A mutex alone cannot identify an accidental repeat after the first purchase completes. Separate financial operation-identity design required. |

The nine read-only User-role POSTs are MarketPlace.SearchVouchers; MyOpportunity.DownloadVerificationFiles and Search; Referral.SearchLink, SearchLinkUsageAsReferrer, SearchLinkUsageAsReferee and SearchAnalytics; SSI.SearchUserWalletCredentials and GetUserWalletCredentialById. None receives an attribute. All GETs are excluded, including incidental session/cache refreshes.

Anonymous ActionLink.GetOrCreateLinkSharing does mutate sharing/usage state, but cannot use an authenticated-user guard without breaking its contract. Any future protection should be entity-scoped and separately reviewed. ExternalPartner profile creation is B2B; Keycloak/YellowCard callbacks, admin writes, imports and background work remain outside this web-user hotfix. This inventory is not a claim that every excluded action is universally race-free; it records why blanket locking was rejected.

## Links

- Epic/shared contract: [README](../README.md)
- Production deployment: https://github.com/didx-xyz/yoma/actions/runs/39582107657
