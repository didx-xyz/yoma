# Epic: YOM-1147 — Partner Synchronization

## Meta

- **Epic**: [YOM-1147](https://linear.app/didx/issue/YOM-1147/partner-synchronization)
- **Owners**: Adrian (api) · Jason (web)
- **Areas**: api, web
- **Status**: in-progress as a capability; the original Linear epic is marked Done
- **Started**: 2026-04-20
- **Branch**: foundational work is on `master`; current cross-epic work continues on `feature/custom-fields-framework`

> Linear's hierarchy is stale for the continuing capability. YOM-1147 is marked Done, while
> verification (YOM-1202), JobJack (YOM-1270) and IXO (YOM-1274) were created as separate parent
> tickets. This folder is the in-source umbrella for the complete PartnerSync capability; no Linear
> parent/child links were changed during this retrofit.

## Why This Epic Exists

Yoma needs one provider-neutral synchronization domain for both Yoma-managed opportunities pushed
to partners and provider-managed opportunities pulled into Yoma. The capability also supports user
hand-off/linking and importing externally determined verification outcomes. Shared orchestration,
tracking, idempotency and lifecycle rules live in the domain; each partner owns only its transport,
authentication, catalogue persistence and mapping.

Production integrations are Jobberman and Alison. JobJack and IXO are implemented and in testing.

## Child Features

### Shared foundation

| Folder | Ticket | Area | Status |
| ------ | ------ | ---- | ------ |
| [`YOM-1153-api-rename-domain-partnersharing-to-partnersync/`](./YOM-1153-api-rename-domain-partnersharing-to-partnersync/feature.md) | [YOM-1153](https://linear.app/didx/issue/YOM-1153) | api | shipped |
| [`YOM-1154-api-refactor-push-naming-onto-partnersync-conventions/`](./YOM-1154-api-refactor-push-naming-onto-partnersync-conventions/feature.md) | [YOM-1154](https://linear.app/didx/issue/YOM-1154) | api | shipped |
| [`YOM-1155-api-update-partnersync-configuration-in-appsettings-and-scheduledjobs/`](./YOM-1155-api-update-partnersync-configuration-in-appsettings-and-scheduledjobs/feature.md) | [YOM-1155](https://linear.app/didx/issue/YOM-1155) | api | shipped |
| [`YOM-1156-api-hook-up-partnersync-in-startup-and-dependency-injection/`](./YOM-1156-api-hook-up-partnersync-in-startup-and-dependency-injection/feature.md) | [YOM-1156](https://linear.app/didx/issue/YOM-1156) | api | shipped |
| [`YOM-1157-api-introduce-synctype-concept-for-partnersync/`](./YOM-1157-api-introduce-synctype-concept-for-partnersync/feature.md) | [YOM-1157](https://linear.app/didx/issue/YOM-1157) | api | shipped |
| [`YOM-1158-api-extend-lookuppartner-to-support-push-and-pull-capability-configuration/`](./YOM-1158-api-extend-lookuppartner-to-support-push-and-pull-capability-configuration/feature.md) | [YOM-1158](https://linear.app/didx/issue/YOM-1158) | api | shipped |
| [`YOM-1159-api-extend-processinglog-to-support-shared-push-and-pull-tracking/`](./YOM-1159-api-extend-processinglog-to-support-shared-push-and-pull-tracking/feature.md) | [YOM-1159](https://linear.app/didx/issue/YOM-1159) | api | shipped |
| [`YOM-1160-api-refactor-push-scheduling-and-processing-onto-shared-sync-model/`](./YOM-1160-api-refactor-push-scheduling-and-processing-onto-shared-sync-model/feature.md) | [YOM-1160](https://linear.app/didx/issue/YOM-1160) | api | shipped |
| [`YOM-1161-api-update-opportunity-event-and-service-hooks-for-partnersync-push-scheduling/`](./YOM-1161-api-update-opportunity-event-and-service-hooks-for-partnersync-push-scheduling/feature.md) | [YOM-1161](https://linear.app/didx/issue/YOM-1161) | api | shipped |
| [`YOM-1162-api-add-partnersync-schema-migration-and-seed-updates/`](./YOM-1162-api-add-partnersync-schema-migration-and-seed-updates/feature.md) | [YOM-1162](https://linear.app/didx/issue/YOM-1162) | api | shipped |
| [`YOM-1163-api-align-partnersync-ef-model-configuration-and-repositories/`](./YOM-1163-api-align-partnersync-ef-model-configuration-and-repositories/feature.md) | [YOM-1163](https://linear.app/didx/issue/YOM-1163) | api | shipped |
| [`YOM-1164-api-scaffold-partnersync-pull-background-job/`](./YOM-1164-api-scaffold-partnersync-pull-background-job/feature.md) | [YOM-1164](https://linear.app/didx/issue/YOM-1164) | api | shipped |
| [`YOM-1165-api-add-pull-processing-log-and-retry-scaffolding/`](./YOM-1165-api-add-pull-processing-log-and-retry-scaffolding/feature.md) | [YOM-1165](https://linear.app/didx/issue/YOM-1165) | api | shipped |
| [`YOM-1168-api-finalize-pull-action-resolution-and-opportunity-persistence-flow/`](./YOM-1168-api-finalize-pull-action-resolution-and-opportunity-persistence-flow/feature.md) | [YOM-1168](https://linear.app/didx/issue/YOM-1168) | api | shipped |
| [`YOM-1169-api-finalize-partnersync-observability-and-validation/`](./YOM-1169-api-finalize-partnersync-observability-and-validation/feature.md) | [YOM-1169](https://linear.app/didx/issue/YOM-1169) | api | shipped |
| [`YOM-1170-api-partnersync-cleanup-and-consistency-pass/`](./YOM-1170-api-partnersync-cleanup-and-consistency-pass/feature.md) | [YOM-1170](https://linear.app/didx/issue/YOM-1170) | api | shipped |
| [`YOM-1171-api-enforce-provider-managed-opportunity-rules-for-pull-synchronization/`](./YOM-1171-api-enforce-provider-managed-opportunity-rules-for-pull-synchronization/feature.md) | [YOM-1171](https://linear.app/didx/issue/YOM-1171) | api | shipped |

### Provider and verification tracks

| Folder | Ticket | Area | Status |
| ------ | ------ | ---- | ------ |
| [`YOM-1166-api-add-jobberman-pull-provider-integration/`](./YOM-1166-api-add-jobberman-pull-provider-integration/feature.md) | [YOM-1166](https://linear.app/didx/issue/YOM-1166) | api | production |
| [`YOM-1167-api-add-alison-pull-provider-integration/`](./YOM-1167-api-add-alison-pull-provider-integration/feature.md) | [YOM-1167](https://linear.app/didx/issue/YOM-1167) | api | production |
| [`YOM-1202-partner-synchronization-verification/`](./YOM-1202-partner-synchronization-verification/feature.md) | [YOM-1202](https://linear.app/didx/issue/YOM-1202) | api | production |
| [`YOM-1203-api-add-partnersync-scope-support-to-partner-capability-configuration/`](./YOM-1203-api-add-partnersync-scope-support-to-partner-capability-configuration/feature.md) | [YOM-1203](https://linear.app/didx/issue/YOM-1203) | api | production |
| [`YOM-1204-api-update-partner-lookup-model-and-migration-for-sync-capabilities/`](./YOM-1204-api-update-partner-lookup-model-and-migration-for-sync-capabilities/feature.md) | [YOM-1204](https://linear.app/didx/issue/YOM-1204) | api | production |
| [`YOM-1205-api-refactor-partnerservice-capability-filtering-by-sync-scope/`](./YOM-1205-api-refactor-partnerservice-capability-filtering-by-sync-scope/feature.md) | [YOM-1205](https://linear.app/didx/issue/YOM-1205) | api | production |
| [`YOM-1206-api-split-partnersync-provider-interfaces-by-sync-scope/`](./YOM-1206-api-split-partnersync-provider-interfaces-by-sync-scope/feature.md) | [YOM-1206](https://linear.app/didx/issue/YOM-1206) | api | production |
| [`YOM-1207-api-add-partnersync-verification-pull-request-and-result-models/`](./YOM-1207-api-add-partnersync-verification-pull-request-and-result-models/feature.md) | [YOM-1207](https://linear.app/didx/issue/YOM-1207) | api | production |
| [`YOM-1208-api-add-validation-for-partnersync-verification-pull-filter/`](./YOM-1208-api-add-validation-for-partnersync-verification-pull-filter/feature.md) | [YOM-1208](https://linear.app/didx/issue/YOM-1208) | api | production |
| [`YOM-1209-api-add-partnersynctracking-entity-for-run-and-checkpoint-state/`](./YOM-1209-api-add-partnersynctracking-entity-for-run-and-checkpoint-state/feature.md) | [YOM-1209](https://linear.app/didx/issue/YOM-1209) | api | production |
| [`YOM-1210-api-add-partnersync-verification-pull-orchestration/`](./YOM-1210-api-add-partnersync-verification-pull-orchestration/feature.md) | [YOM-1210](https://linear.app/didx/issue/YOM-1210) | api | production |
| [`YOM-1211-api-add-myopportunity-verification-import-flow-for-partner-sync/`](./YOM-1211-api-add-myopportunity-verification-import-flow-for-partner-sync/feature.md) | [YOM-1211](https://linear.app/didx/issue/YOM-1211) | api | production |
| [`YOM-1212-api-add-partner-verification-import-idempotency-and-skip-handling/`](./YOM-1212-api-add-partner-verification-import-idempotency-and-skip-handling/feature.md) | [YOM-1212](https://linear.app/didx/issue/YOM-1212) | api | production |
| [`YOM-1213-api-integrate-alison-completed-course-data-endpoint/`](./YOM-1213-api-integrate-alison-completed-course-data-endpoint/feature.md) | [YOM-1213](https://linear.app/didx/issue/YOM-1213) | api | production |
| [`YOM-1214-api-add-alison-verification-sync-configuration/`](./YOM-1214-api-add-alison-verification-sync-configuration/feature.md) | [YOM-1214](https://linear.app/didx/issue/YOM-1214) | api | production |
| [`YOM-1215-api-add-partnersync-verification-observability-and-tests/`](./YOM-1215-api-add-partnersync-verification-observability-and-tests/feature.md) | [YOM-1215](https://linear.app/didx/issue/YOM-1215) | api | production |
| [`YOM-1218-api-improve-alison-completion-commitment-mapping/`](./YOM-1218-api-improve-alison-completion-commitment-mapping/feature.md) | [YOM-1218](https://linear.app/didx/issue/YOM-1218) | api | production |
| [`YOM-1219-api-add-alison-organisation-linked-user-registration-and-redirect-flow/`](./YOM-1219-api-add-alison-organisation-linked-user-registration-and-redirect-flow/feature.md) | [YOM-1219](https://linear.app/didx/issue/YOM-1219) | api | production |
| [`YOM-1222-api-improve-obfuscation-of-sensitive-fields-in-shared-flurl-http/`](./YOM-1222-api-improve-obfuscation-of-sensitive-fields-in-shared-flurl-http/feature.md) | [YOM-1222](https://linear.app/didx/issue/YOM-1222) | api | production |
| [`YOM-1240-api-improve-partner-sync-tracking-run-summaries/`](./YOM-1240-api-improve-partner-sync-tracking-run-summaries/feature.md) | [YOM-1240](https://linear.app/didx/issue/YOM-1240) | api | production |
| [`YOM-1239-api-support-verification-imports-for-deleted-pull-synced-opportunities/`](./YOM-1239-api-support-verification-imports-for-deleted-pull-synced-opportunities/feature.md) | [YOM-1239](https://linear.app/didx/issue/YOM-1239) | api | production |
| [`YOM-1247-show-partner-provided-progress-on-completion-submissions-for-synced/`](./YOM-1247-show-partner-provided-progress-on-completion-submissions-for-synced/feature.md) | [YOM-1247](https://linear.app/didx/issue/YOM-1247) | api/web | production |
| [`YOM-1248-api-support-partner-provided-progress-sync-for-myopportunity/`](./YOM-1248-api-support-partner-provided-progress-sync-for-myopportunity/feature.md) | [YOM-1248](https://linear.app/didx/issue/YOM-1248) | api | production |
| [`YOM-1270-partner-synchronization-jobjack-opportunity-sync/`](./YOM-1270-partner-synchronization-jobjack-opportunity-sync/feature.md) | [YOM-1270](https://linear.app/didx/issue/YOM-1270) | api/business | testing |
| [`YOM-1271-api-jobjack-opportunity-pull-sync/`](./YOM-1271-api-jobjack-opportunity-pull-sync/feature.md) | [YOM-1271](https://linear.app/didx/issue/YOM-1271) | api | testing |
| [`YOM-1272-feed-mappings-and-business-rules/`](./YOM-1272-feed-mappings-and-business-rules/feature.md) | [YOM-1272](https://linear.app/didx/issue/YOM-1272) | api/business | in-progress |
| [`YOM-1274-partner-synchronization-ixo-yie-full-sync/`](./YOM-1274-partner-synchronization-ixo-yie-full-sync/feature.md) | [YOM-1274](https://linear.app/didx/issue/YOM-1274) | api/business | in-progress |
| [`YOM-1275-api-ixo-yie-full-partner-pull-sync/`](./YOM-1275-api-ixo-yie-full-partner-pull-sync/feature.md) | [YOM-1275](https://linear.app/didx/issue/YOM-1275) | api | testing |
| [`YOM-1276-ixo-yie-full-sync-production-api-and-business-readiness/`](./YOM-1276-ixo-yie-full-sync-production-api-and-business-readiness/feature.md) | [YOM-1276](https://linear.app/didx/issue/YOM-1276) | business/SRE | in-progress |

Ticket with no API folder:

| Ticket | Area | Note |
| ------ | ---- | ---- |
| [YOM-1172](https://linear.app/didx/issue/YOM-1172) | web | Provider-managed Opportunity UI restrictions; Web ownership. |
| [YOM-1249](https://linear.app/didx/issue/YOM-1249) | web | Verification progress display; Web ownership. |

### Why each continuing track exists

| Ticket/track | Purpose |
| ------------ | ------- |
| YOM-1147 / YOM-1153–YOM-1171 | Establish the shared provider-neutral Push/Pull domain, lifecycle, persistence and provider-management rules. |
| YOM-1166 | Operate the production Jobberman Opportunity integration. |
| YOM-1167 | Operate the production Alison Opportunity integration. |
| YOM-1172 | Prevent Web users/admins from changing provider-managed Opportunities. |
| YOM-1202 / YOM-1203–YOM-1215, YOM-1218, YOM-1219, YOM-1222 | Import partner verification outcomes with stable linking, checkpoints, idempotency and safe observability. |
| YOM-1239 | Keep verification import working after a provider removes an Opportunity. |
| YOM-1240 | Make synchronization run outcomes operationally understandable. |
| YOM-1247 | Coordinate partner-provided completion progress across API and Web. |
| YOM-1248 | Import and protect provider-managed MyOpportunity progress. |
| YOM-1249 | Display provider progress to youth. |
| YOM-1270 | Coordinate JobJack Phase 1 Opportunity synchronization. |
| YOM-1271 | Implement the JobJack pull provider. |
| YOM-1272 | Confirm JobJack feed mappings and business rules. |
| YOM-1274 | Coordinate IXO Opportunity, user hand-off and verification synchronization. |
| YOM-1275 | Implement the IXO full PartnerSync provider. |
| YOM-1276 | Track IXO environment, contract and business readiness. |

The closed YOM-1153–YOM-1171 and YOM-1203–YOM-1222 tickets predate the current sizing rule and are
more technically granular than new Linear tickets should be. Their folders preserve history; future
breakdown belongs in the parent feature checklist rather than new class/endpoint-shaped tickets.

## Shared Contract

Verified by reading `SyncBackgroundService`, provider factory resolution, capability/configuration
lookups, tracking/processing repositories and each provider client; migrations confirm the shared
and provider-owned persistence. JobJack and IXO were also run against embedded feeds on Stage, and
IXO Learning and Job opportunities were confirmed through the Web UI.

- PartnerSync supports `Push` and `Pull`; capability configuration is keyed by partner, sync type,
  entity type and sync scope.
- Sync scopes separate entity synchronization from verification synchronization.
- Shared orchestration owns scheduling, locking, action resolution, idempotency, retries, tracking
  and Opportunity/MyOpportunity domain calls. Provider projects own transport and mapping.
- Pull-synced opportunities are provider-managed. Admin edit/status actions are blocked.
- Provider deletion is terminal in Yoma. A removed external ID cannot be reactivated or reused.
- A successful complete snapshot may infer deletions from omission. Empty or invalid feeds do not
  delete the existing catalogue.
- Provider cache tombstones may be purged after retention; the shared permanent processing record
  preserves terminality.
- Verification processing resolves stable partner-user links first. Provider-specific documented
  fallbacks may use a Yoma user ID, then current username/email/mobile. Username history is not kept.
- Run-level processed/succeeded/skipped/failed counts are persisted. Individual skip reasons are
  written to application logs; persisted item failures retain their error state.
- Completed Learning and placed Job outcomes are terminal. Validated revocations are manual support
  operations unless a future contract changes this.
- Startup may seed an empty provider catalogue from embedded resources. Domain pull and verification
  processes remain scheduled jobs; startup at the exact cron time can legitimately coincide with one.

### Provider state

| Provider | Current capability | Source of truth |
| -------- | ------------------ | --------------- |
| Jobberman | Production Opportunity pull from RSS/cache | Jobberman client, cache migration and shared pull handler |
| Alison | Production Opportunity pull, authenticated hand-off and verification import; course descriptions clarify that paid certificates are optional for YoID credentials | Alison clients, catalogue service and verification handler |
| JobJack | XML Opportunity pull configured for the Yoma production feed with a refreshed representative embedded sample; final validation remains in progress and Phase 2 hand-off/verification is deferred | JobJack feed service/client, runtime configuration and embedded sample |
| IXO | Learning/Job pull, user hand-off/linking and verification implemented; external Stage/Production provisioning pending | IXO PartnerSync client, migration, embedded probes and YOM-1276 confirmations |

### Cross-epic Custom Fields dependency

Partner requests already accept custom-field values with patch semantics, but provider mappings do
not yet populate them. Once the BA-approved definitions are available under
[YOM-1244](../YOM-1244-customizable-fields-framework/README.md), review Jobberman, Alison, JobJack
and IXO together. Mappings must use stable definition keys, preserve omitted values, and use a
key-only item only for deliberate deletion. No provider may hardcode temporary `[Sample]` keys.

## Out of Scope (whole epic)

- Replacing partner-controlled source data or manually curating provider catalogues in Yoma.
- Implementing final custom-field mappings before the shared field map is approved.
- JobJack user pre-authentication, verification and credential integration in Phase 1.
- Enabling IXO external Production sync before its final environments and credentials exist.
- Consolidating provider infrastructure databases; each integration retains its own transport/cache boundary.

## Blockers

| Blocker | Severity | Note |
| ------- | -------- | ---- |
| BA-approved custom fields and partner mapping matrix | High | Blocks cross-provider custom-field mapping refactor. |
| IXO final Stage/Production environments and credentials | High | Embedded Stage validation works; external activation waits. |
| JobJack production validation/sign-off | Medium | Code is implemented; Phase 1 remains in testing. |

## Cross-Area Notes

Web must treat pull-synced opportunities as provider-managed and preserve partner navigation. New
partner metadata should arrive through core fields or approved custom-field definitions, not
provider-specific UI branches. API contract changes affecting display or navigation require a Web
handoff under the owning ticket.
