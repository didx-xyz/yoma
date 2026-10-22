# Epic: YOM-1302 — Prevent duplicate youth actions from concurrent submissions

## Meta

- **Epic**: [YOM-1302](https://linear.app/didx/issue/YOM-1302/prevent-duplicate-youth-actions-from-concurrent-submissions)
- **Owner**: Adrian (api)
- **Areas**: api
- **Started**: 2026-10-22
- **Branch**: `fix/youth-action-idempotency-stage`, based on `origin/master` / `3600d8330125439db6d8e9b19a2c94874033f42b`, prepared without committing for Adrian's VS review.
- **Production hotfix**: `fix/youth-action-idempotency-hotfix` was squash-merged via [PR #1996](https://github.com/didx-xyz/yoma/pull/1996) into `current` as `19076185c8d57d31e741e1aa8f6b3ea90292dce9`, released and deployed as `v3.13.5`. The earlier `codex/` name was replaced at Adrian's request; the unrelated partner-portal documentation remains separately preserved on the original `fix/youth-action-idempotency` branch.

## Why This Epic Exists

Concurrent youth web requests can both pass a read-before-write check before either commits. Production reports show this at referral claim initiation (`IX_LinkUsage_UserId_ProgramId`) and instant opportunity verification (`IX_UsageLog_LinkId_UserId`). The existing database constraints prevent duplicate data but the losing request receives HTTP 500.

## Child Features

| Folder | Ticket | Area |
| --- | --- | --- |
| [Request serialization](./YOM-1302-prevent-duplicate-youth-actions-from-concurrent-submissions/feature.md) | [YOM-1302](https://linear.app/didx/issue/YOM-1302/prevent-duplicate-youth-actions-from-concurrent-submissions) | api |

## Shared Contract

- By default use a distributed lock key containing the persisted Yoma user ID, full controller type name and MVC-supplied method signature. Repeated calls serialize across API instances, including different link IDs. An optional explicit attribute scope groups related methods within one controller; unrelated users/controllers/actions/overloads remain independent.
- Current coverage is twelve reviewed authenticated self-service actions: seven MyOpportunity mutations (Viewed, Saved, remove-saved, external navigation, manual verification, instant verification and delete manual verification), two referral claim methods, profile update, YoID onboarding and organisation creation. The action-link claim is MyOpportunity instant verification, not a separate ActionLinkController mutation. The complete controller audit and exclusions are in feature.md.
- Both referral methods use `[UserActionLock(nameof(ClaimAsReferee))]`. Their common per-user/controller scope covers repeated claims and the initiation-versus-claim race on the same user/programme record, including distinct links/programmes. Domain validation remains authoritative; a duplicate completed claim still follows existing validation, not a fabricated success.
- Save/remove-saved share the Saved scope; manual/instant/delete verification share the manual-verification scope; profile update/YoID onboarding share the UpdateProfile scope. These methods change overlapping state. Other protected methods use their own default key. Null, empty and whitespace-only optional scopes normalize to null; nonblank scopes are trimmed.
- Hold the lock before invoking the controller action, so existing service queries see the preceding request's committed state. The database remains authoritative; retain unique constraints and business validation.
- This is request serialization, not a generic exactly-once mechanism or cached response replay. Existing no-op, validation and response behavior is preserved.
- The shared Swagger error filter adds the in-progress 409 response only when the action has `[UserActionLock]`. Unguarded actions retain the common errors without an automatically added 409; any separately declared 409 is preserved.
- Do not apply the guard globally. Admin, B2B, partner callbacks, imports, searches and background processing remain unchanged.
- Keep the Production hotfix isolated on `current`, then forward-port it to `master` for Stage. No CF changes or migrations are included. The only configuration additions are the two directly under `AppSettings` for user-action acquisition wait and total lease lifetime.
- `DistributedLockUserActionAcquireTimeoutInMilliseconds` defaults to `2000`; zero means one immediate acquisition attempt without waiting. `DistributedLockUserActionLeaseDurationInSeconds` defaults to `120` and is the absolute Redis lease including any operational buffer, not a baseline to which code adds a buffer. Normal completion releases immediately; acquisition budget, lease lifetime and upstream request timeouts are separate concerns.

## Out of Scope

- Automatic idempotency-key generation, request-body hashes, response caching and frontend changes.
- Changes to reward, link-cap, eligibility or verification rules.
- A redesign of the shared distributed-lock implementation or protection against races with unguarded writers.
- Cross-action serialization beyond the explicit reviewed groups, and any durable deduplication of sequential marketplace purchases. Per-action keys do not protect unrelated/unannotated writers automatically.

## Cross-Area Notes

No frontend code was changed. The filter waits briefly, then the unchanged service checks persisted state. If the action remains busy after its acquisition budget, `RequestInProgressException` produces HTTP 409 Conflict with the existing `List<ErrorResponseItem>` body shape and the approved friendly message; it does not claim success or execute unlocked. This new contention outcome is also classified as informational/409 by exception logging and documented by the shared Swagger error filter. Existing validation remains 400. The web shared error parser reads the same body independently of status; no live browser test was performed. No client idempotency header is required. Production `v3.13.5` is deployed. The master-based forward-port is awaiting Adrian's VS review before any commit/push; no extra annotations or business changes were added.
