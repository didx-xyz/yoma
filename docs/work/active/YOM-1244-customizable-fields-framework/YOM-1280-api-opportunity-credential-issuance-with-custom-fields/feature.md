# Feature: API Opportunity Credential Issuance with Custom Fields

## Meta

- **Feature**: Opportunity credential issuance with custom fields
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1280](https://linear.app/didx/issue/YOM-1280/api-opportunity-credential-issuance-with-custom-fields)
- **Owner**: Adrian
- **Areas**: api
- **Status**: review — six-type Opportunity issuance and CF wallet smoke passed; live history/retry follow-up remains
- **Started**: 2026-08-12

## Problem / Goal

Issue Opportunity credentials from the Opportunity's valid schema selection and current static and
custom-field values at processing time. Persist the schema metadata actually used by a successfully
issued credential, while preserving existing `Opportunity|Default` issuance when no type-specific
schemas are configured.

## Out of Scope

- Final generic/type-specific schema flavours and mappings, tracked in YOM-1277.
- Provider and CSV-import schema assignment, tracked in YOM-1277.
- Web credential rendering, tracked in YOM-1283.
- Cross-taxonomy skill identifiers.

## Plan

Scheduling commits the selected schema full name together with its immutable schema type and artifact
type. Processing must use that scheduled schema even if the Opportunity is later changed or credential
issuance is disabled, while resolving and persisting the latest version only when issuance succeeds.
Map static properties through the existing schema-property metadata and dynamic fields through stable
custom-field keys. Convert controlled options and lookup identifiers to human-readable values. Store
complex values as structured JSON inside the provider's existing string attribute contract. Wallet
retrieval uses the immutable schema ID and exact version recorded by the provider credential, formats
scalar values, and returns API-native structured items. Existing comma-delimited Skills credentials
are normalized by the API; Web never parses provider JSON.

Shared schema naming, protection and compatibility rules live in the [epic README](../README.md).

**Current review, 2026-10-09:** [YOM-1277's consolidated stages 1–3 handoff](../YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/handoffs/2026-10-07-a.md)
records the configured final defaults, assignment transition and exact-attempt issuance/retry fixes.
The provider request carries the immutable resolved schema ID and issuance returns the existing
credential model with its actual schema ID. Recovery records the historical issued version rather
than the latest version prepared for the retry. No scheduling-time pin or DB column was added.
The changes remain uncommitted for Adrian's review. Authenticated Local provider-backed issuance
and wallet list/detail now pass for all six Opportunity types, including supplied Opportunity CFs
and omitted optional completion CFs: 377 independent schema/source assertions across 46 attributes.
Populated completion CFs and historical/retry behavior retain separate automated coverage; they
are not claimed as live fault-injection tests. YoID live issuance failed according to Adrian and
its cause remains unconfirmed; the unchanged ACR configuration is not marked live-passed in this run.
The final 2026-10-09 pass records 546 selected regression cases passing with no failures/skips,
including 102 SSI cases and all guarded local DB checks. The same handoff contains Jason's
per-type styling/content matrix and the guided Local issuance/retrieval plan; live provider and
visual Web sign-off are not inferred from these automated results.

## Tasks

- [x] Commit the selected schema full name, schema type and artifact type when issuance is scheduled.
- [x] Resolve the latest version of the scheduled schema during processing.
- [x] Allow an already scheduled issuance to continue after later Opportunity configuration changes.
- [x] Persist the resolved schema version after successful issuance.
- [x] Use the mapped immutable schema identity throughout an attempt, including a concurrent version change.
- [x] Recover the actual issued version after provider success/local-save failure without issuing twice.
- [x] Keep schema version null while pending and align existing non-issued rows through migration.
- [x] Enforce one issuance per schema type and target entity independently of the eventual schema name.
- [x] Preserve the existing retry flow; each retry resolves the current latest applicable schema.
- [x] Preserve existing YoID and generic `Opportunity|Default` issuance behavior.
- [x] Map schema-selected static properties.
- [x] Map Opportunity and MyOpportunity custom fields without CLR reflection.
- [x] Convert controlled options and supported lookup identifiers to human-readable values.
- [x] Issue Skills as structured name items instead of a comma-delimited value.
- [x] Exercise first-attempt generic `Opportunity|Default` issuance across local, Alison,
  Jobberman and IXO data and verify the signed JWS, issuance metadata and wallet API response.
- [x] Normalize structured and legacy Skills in the Youth wallet API contract.
- [x] Return dynamic custom-field labels and formatted values from the exact issued schema version.
- [x] Format scalar dates, booleans and numbers in the API while preserving signed display values for options and lookups.
- [x] Establish structured issuance and display for multi-select custom fields before CF credentials enter use.
- [x] Exercise structured Skills, scalar formatting and YoID ACR optional-value handling against a running API.
- [x] Return core and custom-field detail attributes in one grouped, deterministic presentation order.
- [x] Exercise the consolidated migration and grouped YoID/Opportunity wallet detail against a running API.
- [x] Exercise supplied Opportunity custom-field display and optional completion-CF omissions against the running API for all six types.
- [x] Verify all six type-specific/generic selected defaults through real provider issuance and youth wallet list/detail retrieval.
- [ ] Exercise legacy comma-delimited Skills against a running API; automated compatibility coverage already passes.
- [ ] Exercise retry and required-value failure scenarios against a running API; automated intercepted coverage already passes.
- [x] Filter tenant-unready Opportunity issuance in the database before batch selection, without modifying blocked queues or committed schemas.
- [x] Guard the complete issuance worker lifetime and drain started tasks before releasing the distributed lock.
- [x] Stop dispatch on application shutdown or fatal infrastructure failure; preserve successful provider results and existing credential retry policy.
- [x] Add bounded worker-failure/shutdown/concurrency regressions and execute the real PostgreSQL query against the Stage replay backlog shape.
- [x] Adrian: review/deploy the lifecycle/readiness fix via PR #1990 and resume the existing replay queue after the previous worker stopped; 223 issued, zero failed attempts and normal lock release confirmed on Stage.
- [x] Extend the proven application-stop pattern to the remaining Hangfire jobs, preserving job-specific durable boundaries and serialized invocation contracts.
- [x] Extract the common lock/lifecycle plumbing into a reusable async BackgroundJobExecutionScope while retaining explicit safe-unit checks and per-job ordinary error handling.
- [x] Align creation with TransactionScopeHelper: explicit lifecycle-only/locked factories, optional logging, and a shared exception guard in existing outer catches instead of duplicated shutdown catches.
- [x] Restrict construction to the static factories on BackgroundJobExecutionScope through a private constructor; retain mandatory lifetime and optional logging without duplicate logging-only factory names.
- [x] Verify all job-entry/lock guards, in-flight results, failed sync checkpoints, catalogue safety, cleanup failures and bounded tenant workers; see the [cross-cutting handoff](../handoffs/2026-10-19-a.md).
- [x] Complete the final registration/contract/budget audit and repeat the regression suite, including download shutdown persistence/notification and rollback-before-release cases; final results are consolidated in the lifecycle handoff.
- [ ] Adrian: review the uncommitted broad application-stop follow-up before a separate Stage rollout.

## Decisions

- 2026-10-19: Adrian selected BackgroundJobExecutionScope as the final name, making its per-invocation boundary explicit. Rename the type, file, tests and all consumers only; it observes host shutdown rather than owning the application lifetime. The proposed linked-dispatch cancellation extraction remains unimplemented; SSI retains that explicit coordination. No lifecycle, lock, retry, queue or timing behavior changes in this rename.
- 2026-10-19: Adrian requested compiler-enforced factory-only construction. Move Create / CreateWithLock onto BackgroundJobExecutionScope and make its constructor private, removing the separate helper. Application lifetime remains required in both; optional logging covers logging/non-logging use without four separate factory names. No job-specific lifecycle behavior changes. Add an access-level regression alongside the existing null-dependency and per-job caller-name checks.
- 2026-10-19: Adrian's further scope review initially selected a separate static factory helper for Create / CreateWithLock, matching the established static-factory convention. Logging is optional; distributed locking is required only by CreateWithLock and all 39 current jobs retain it. The ThrowIfStopping(exception) overload centralizes shutdown conversion within existing catches; disposal stays cleanup-only, not an exception interceptor or business-execution wrapper. Safe boundaries, special sync/SSI/timeout handling and ordinary errors remain explicit. The consolidated lifecycle handoff owns verification results.
- 2026-10-19: After the successful Stage replay, Adrian authorized restoring the broader shutdown work on a fresh branch from origin/master, separate from merged PR #1990. The shared policy and service-specific exceptions live once in the [epic lifecycle handoff](../handoffs/2026-10-19-a.md). No new Linear ticket/description or job schedule/configuration was changed. Whole-feature status remains review because the independent history/retry/UI checks above are not closed by these lifecycle tests.
- 2026-10-19: Following Adrian's review, centralize only the repeated plumbing in an await-using BackgroundJobExecutionScope. Keep the explicit stop locations, transaction/provider-save units, checkpoint/error handling and worker draining unchanged. Preserve original CallerMemberName process values in lock/shutdown logs. Do not add ambient context, automatic transaction/rollback, new retry policy or a generic business-execution wrapper.
- 2026-10-19: Adrian prioritized the SSI-only Stage release to resume replay. The subsequent application-stop extension across other background jobs is deferred and preserved outside the checkout as a verified re-applicable patch. It is not part of this release; tenant creation, schema seeding and non-SSI jobs retain their original behavior.
- 2026-10-19: Opportunity queue selection requires Created holder and issuer tenant mappings with non-empty IDs before paging. The SQL uses the existing most-derived MyOpportunity repository and SSI tenant repository. Missing/unfinished mappings remain Pending and become eligible automatically; current Opportunity status, issuance enablement and schema selection do not override the scheduled commitment. YoID retains its existing issuer-resolution path.
- 2026-10-19: Keep the parameterless Hangfire method contract. Inject application lifetime to stop new dispatch during shutdown, drain every started worker on all producer exits, and include scope creation/resolution/disposal in semaphore cleanup. Disposed infrastructure and escaping worker/setup/persistence failures fail the job rather than silently completing or consuming credential retries. Normal per-credential failures retain their existing retry handling. Provider calls are not forcibly cancelled; a successful result is still persisted during graceful shutdown.
- 2026-10-19: The Stage disposed-MemoryCache event proves a disposed dependency was used, not why it was disposed or whether the pod was OOMKilled. The identified worker-setup slot-leak/hang path is independently reproducible. No provider reset, database replay reset, schema change, new migration or Redis mutation is part of this code fix. See the [issuance lifecycle handoff](handoffs/2026-10-19-a.md).
- 2026-08-12: Full schema name plus version remains the authoritative identity; no additional provider schema ID is persisted.
- 2026-08-12: Scheduling metadata and required database columns remain backward compatible; successful processing replaces the snapshot with the metadata actually used.
- 2026-08-12: Retries retain the proven processing flow and resolve the current latest applicable schema until issuance succeeds.
- 2026-08-12: Dynamic custom fields resolve by stable definition key and never through CLR reflection.
- 2026-08-12: Provider string attributes carry structured Skills as JSON; the API, not Web, owns parsing and legacy normalization.
- 2026-08-13: Supersedes the scheduling-metadata decision above: schema full name, type and artifact type form the scheduling commitment; only the resolved version remains nullable until successful issuance.
- 2026-08-13: Later Opportunity edits, type changes, schema reselection or disabling credential issuance do not cancel or redirect an already scheduled credential.
- 2026-08-13: Duplicate prevention is keyed by schema type and target entity, not schema name; changing the selected schema before processing must not create another issuance.
- 2026-08-13: The internal issued timestamp is serialized using the invariant round-trip format so
  wallet ordering and display do not depend on the API host culture. Existing production values use
  an invariant-compatible US format and require no compatibility fallback.
- 2026-08-13: Structured Skills issuance is complete, but wallet normalization is not. Raw JSON in
  `valueDisplay` is the accepted interim API response until the credential display work proceeds.
- 2026-08-13: Supersedes the interim display decision above: wallet detail now returns a readable
  `valueDisplay` plus `itemsDisplay` for complex attributes. Existing comma-delimited Skills and new JSON
  Skills normalize to the same response. `itemsDisplay` is authoritative; `valueDisplay` is display-only
  because an individual option label may contain commas. Web must not parse either flattened or provider values.
- 2026-08-13: Wallet retrieval uses the provider credential's immutable schema ID and exact version.
  A missing required attribute is a data inconsistency and fails. Missing optional attributes are
  omitted, preserving historical credentials that did not contain them.
- 2026-08-13: Custom-field credentials have no historical compatibility burden. Multi-select custom
  fields use structured signed items from inception; scalar option and lookup values are signed and
  returned using their human-readable display values.
- 2026-08-13: New JWS credentials do not sign optional attributes with no value. Existing credentials
  containing the historical `n/a` value continue to return it. The shared YoID ACR path retains `n/a`
  because AnonCreds requires a value for every attribute declared by its credential definition.
- 2026-08-13: New static scalar values, including dates, are signed using invariant representations.
  Wallet display parses invariant values first and retains a current-culture fallback for historical
  credentials serialized by the issuing API host culture.
- 2026-08-14: Credential headers remain fixed. Detail attributes return Group, SubGroup and SortOrder
  metadata and are ordered by Group, SubGroup, SortOrder and display label. Presentation metadata is
  deliberately outside the signed credential and changing it does not create a schema version. Static
  presentation metadata is nullable; configured groups render first and unconfigured attributes remain
  readable in display-label order. Core and custom fields share the consolidated ordering space.
- 2026-10-09: Exact attempt identity and successful retry recovery now use the existing provider
  request/credential models: pass the mapped schema ID, return the actual credential/schema ID,
  and persist the recovered historical version. Latest-at-processing semantics, client referent,
  queues and retry policy remain unchanged. Regression evidence and the uncommitted review diff
  are consolidated under YOM-1277. The subsequent authenticated Local six-type issuance/attribute
  pass is complete; the consolidated handoff distinguishes it from historical/fault-injection
  coverage, the unconfirmed YoID failure and Jason's visual checks.

## Links

- Epic: [YOM-1244](../README.md)
- Parent capability: [YOM-1277](../YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/feature.md)
- Ticket: [YOM-1280](https://linear.app/didx/issue/YOM-1280/api-opportunity-credential-issuance-with-custom-fields)
