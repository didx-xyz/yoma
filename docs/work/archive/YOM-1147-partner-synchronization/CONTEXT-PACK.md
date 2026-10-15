# Context Pack: YOM-1147 — Partner Synchronization — RECONSTRUCTED

## Provenance

- **Written:** 2026-10-14 by Adrian / Codex on `chore/cash-out-final-prep`, at Adrian's direction.
- **Replaces:** the working README/features/handoffs as the entry point; every original file is preserved in the archived epic.
- **Source now at:** `docs/work/archive/YOM-1147-partner-synchronization/`.
- **Rebuilt from:** the epic README, feature records and all epic/provider handoffs; merged delivery diffs; current provider/shared mapping code; Adrian's later staging extracts, partner correspondence and production release/config decisions in this chat.
- **Merged delivery references:**
  - `3939084e4` (#1782): shared pull foundation and Jobberman delivery.
  - `7262dc8a7` (#1795): Alison catalogue; `bedab9c43` (#1809): verification; later `565b4fa6c` (#1821): Alison authentication/verification completion.
  - `4f666dd8e` (#1879): partner progress; `a82cd3dfc` (#1909): stable partner-link resolution.
  - `b5bfe4005` (#1910): JobJack Phase 1; `7932adc6b` (#1915): production feed/sample.
  - `9f8ec5a84` (#1913), `7d7f48460` (#1920), `dd7a330cb` (#1926), `77942fe38` (#1934): IXO integration, official contract, impact-action support and production configuration.
  - `52b3be093` (#1929): Umuzi Phase 1; `f346a1ad9` (#1965): production configuration.
  - `f0cfeac6b` (#1942), then `b82b2f993` (#1959): shared conservative/explicit skill matching.
- **Citation boundary:** source branch hashes mostly still resolve, but a resolving object is not proof of squash ancestry. The references above identify reviewed merged deliveries, not an asserted one-to-one mapping for every historical branch commit. One original Alison source citation does not resolve; it remains explicitly flagged in the historical May 15/August 12 documents and is not silently equated to the similarly named merged SHA.
- **Not verified today:** live partner endpoints, production activation, secrets/decryption, deployment health, or a live Umuzi completion/credential. No SQL or sync jobs ran for this archive.

This is a reconstruction. Current code wins; the archive closes delivered scope rather than making
the capability permanently frozen or treating every later integration request as already implemented.

## Where the Work Got To

The shared framework and original provider tracks are `shipped`. Jobberman, Alison, JobJack Phase 1
and IXO were previously confirmed in production. Umuzi code and production configuration are merged;
Adrian directed its close-out ahead of the combined cash-out Production release, matching the archive
convention used for cash-out. Production deployment/activation is a release gate, not established by
this documentation operation. YOM-1295 records that qualification in its own status/decisions.

Umuzi's old partner-URL blocker is stale: September 25 evidence shows five opportunities imported
after resetting an exhausted validation retry and navigation with `yomaUserId` to the learner page.
Partner correspondence later confirms URL/user-ID handling is ready. Live capture confirmation and
progress/completion/credential E2E are not established by the retained extracts alone.

## Decisions That Still Bind

### Ownership and lifecycle

- PartnerSync is provider-neutral Push/Pull orchestration. Capabilities are keyed by partner, sync type, entity type and scope; Entity, Verification and UserAuthentication are separately selected.
- Shared services own scheduling, locking, processing identity, retries, checkpoint/tracking and domain calls. Infrastructure owns transport, catalogue caching, authentication and mapping.
- Pulled opportunities and their synced verifications are externally managed. Normal Yoma content/status and manual completion changes cannot become a competing source of truth. Existing supported Yoma featured/hidden/delete controls remain separate.
- Removal is terminal in Yoma. An external ID removed successfully cannot be reused/reactivated merely by sending it active again. Provider-cache retention does not erase the permanent processing history.
- Infer omission-based removals only after a successful valid complete snapshot. Empty, failed or invalid feeds must not wipe the catalogue.
- Import progress as Pending; terminal completion/placement finalizes through MyOpportunity and the existing credential issuance queue. Partial progress does not issue partial credentials.
- Valid completion import for an eligible removed opportunity is distinct from reactivating its catalogue entry.
- Prefer a stable partner-user link, then the provider's documented Yoma GUID/current-username fallback. Username history is not maintained.
- Persist run aggregates and item errors/retries; detailed skip reasons remain operational logs. A successful run with zero items does not prove a specific user's completion was supplied.

### Provider boundaries

| Provider | Delivered scope and limits |
| --- | --- |
| Jobberman | Job RSS catalogue/cache pull. No pre-authentication, completion feed or credential integration. Dev/Stage GH/NG embedded-resource config fix was confirmed complete; it does not change Production live-feed behaviour. |
| Alison | Learning catalogue, registration/login handoff, stable user linking and verification/progress. Completion sync relies on the correct partner link and provider payload. Existing users registered directly with Alison are the known unsupported pre-auth linking edge case; investigate with Alison rather than assuming an automatic repair. |
| JobJack | Phase 1 XML opportunity pull only. Completion/VC automation requires a completion endpoint and reliable learner linkage; pre-auth/SSO is optional additional scope. Reverse B2B pulling from Yoma is a separate unimplemented integration. |
| IXO | Catalogue, email-based handoff/linking and verifications, including impact actions. Production World Cleanup Day import and an approved Stage claim (Completed/100%, participant count 1) were recorded. Pending claim publication and final issued credential were not proven by that Stage run; it recorded issuance queueing. Cash-out is a separate infrastructure boundary. |
| Umuzi | Learning/Job catalogue, correlation redirect and verification. Phase 1 performs no registration, authentication or persistent PartnerSync.User linking. Umuzi controls Yoma-originated participation scope. |

### Umuzi correlation, dates and visibility

- Yoma appends the signed-in GUID as configurable, case-sensitive `yomaUserId` to the catalogue URL. It is not an authentication token. Umuzi captures it on the specific learner page; do not hardcode user IDs into catalogue links.
- Verification mapping prefers a valid `yomaUserId`, with current username fallback. Completed/placed records populate DateCompleted; in-progress records use endOrLastActivity and retain null DateCompleted.
- `recordedAt` must advance on changed records. Pull overlap protects late availability; duplicate handling must compare mapped payload state, not permanently discard every later record with the same source ID.
- Date/commitment validation remains authoritative. A corrected source record previously exhausted by retries may need a deliberate processing-state reset; do not globally clear errors or retry counters.
- The production organisation was confirmed as active Umuzi, ID `967e7cbf-5c7f-4b26-0d3d-08db08ffa993`. Production API URL was confirmed and configuration committed in #1965; credentials stay in the secret store. The migration inserts the partner active with Entity/Verification/UserAuthentication capabilities; operational activation still depends on the deployed migration/config.
- **Current hidden behaviour:** create maps Hidden=false; subsequent pulls preserve Yoma's setting. `active=false` is terminal removal, not a temporary private/draft state.
- **October 14 proposed extension, NOT implemented:** map Umuzi's boolean hidden field on initial creation only. Updates must preserve Yoma-owned visibility. Await the updated example opportunity JSON and partner confirmation; do not add update mapping or import private programmes assuming the change already exists.
- Sara's ensure-account request is separate B2B onboarding scope. Assessment was handed to Koni; account lookup/creation, client-credential organisation attribution and generic audit logging still need prioritisation. Do not claim that sending a GUID or configuring inbound SSO implements it.

### Skill matching

Use the configured EMSI skill catalogue and prefer exact names. The shared matcher prioritises
full names, then normalized names and unambiguous formatting/explicit semantic aliases. Ambiguous
keys remain unmatched. Never strip arbitrary qualifiers: Programming must not become Programming
(Music) merely because that is the only candidate. Reviewed aliases target Python, JavaScript, SQL,
Git, Django and CSS only when the canonical skill exists. Alison, IXO and Umuzi share this resolver.

Mapped skill-list changes can alter the effective payload hash and update an opportunity without
a source-feed edit. No historical credential rewrite is implied. Unknown labels remain best effort,
not semantic AI or a licence to create manual partner-specific skills.

## Contracts / Code Entry Points

- `domain/Yoma.Core.Domain/PartnerSync/Services/SyncBackgroundService.cs`: Entity/Verification pull orchestration and payload comparisons.
- `ProcessingService`, `PartnerService`, `SyncStateService` and PartnerSync repositories: capability, permanent item state, tracking and locks.
- `SyncUserAuthenticationService`: partner-specific required profile fields and handoff routing; see the [profile hotfix pack](../partner-profile-handoff-hotfix/CONTEXT-PACK.md).
- `domain/Yoma.Core.Domain/MyOpportunity/Services/MyOpportunityService.cs`: progress/completion domain processing and issuance scheduling.
- `infrastructure/Yoma.Core.Infrastructure.<Provider>`: provider transport, cache, DTOs, mappings and resources. API paths above are relative to `src/api/src/`.
- `domain/Yoma.Core.Domain/Lookups/Services/SkillService.cs`: shared full-name and explicit-alias matching.
- Migration `20260907045846_ApplicationDb_Partner_Sync_Umuzi`: Umuzi capability seed. Do not edit deployed historical migrations to achieve a later toggle.

## Evidence and Gotchas

The handoffs retain local mocked/embedded builds/tests and externally supplied Stage/Production
results. September skill follow-ups recorded 35 then 48 focused passing cases. Those are historical
runs, not tests rerun during archival. Partner readiness, a navigated page and an imported catalogue
do not independently prove live completion capture, issuance or wallet delivery.

SOPS MAC conflicts require a valid re-encrypted combined document; choosing one side's MAC is not
a safe integration. Robbie's rebase/config resolutions completed the earlier merge blocker.
Do not print secrets or re-run the obsolete merge instructions in the historical handoff.

The original documents call IXO impact actions Task; the CF branch later changes the canonical type.
The CF migration/default-schema/provider mapping changes remain owned by the active CF epic. This
archive does not copy undeployed CF behaviour into the cash-out release branch.

## Open Questions / Follow-ups

- Adrian/Robbie: complete the combined cash-out/Umuzi production rollout, migration/config/activation and controlled smoke verification. This archive does not say it already deployed.
- Umuzi/Adrian: retain or complete evidence for live learner capture, in-progress-to-completed import and credential delivery; no seed record was requested during this archive.
- Umuzi: supply the hidden-field example and confirm creation-only ownership before the proposed change is implemented.
- Koni: prioritise the separately assessed ensure-account B2B capability and any later pre-authentication.
- CF: rework approved fields/default credential mappings across providers under [YOM-1244](../../active/YOM-1244-customizable-fields-framework/README.md). This is later scope, not an uncompleted foundation ticket.
- JobJack: Phase 2 needs a separately agreed completion/hand-off contract; CSV is the existing manual bulk route, not already-live completion pull.
- Alison: provider investigation of missing/unlinked completions remains support work; aggregate issued counts alone do not diagnose an individual user.

## Where Historical Sources Disagree With the Archive State

- The README and YOM-1295 still originally described pre-merge partner-URL/production-credential blockers. Merge/config and later staging correspondence supersede them; detailed E2E proof is still qualified above.
- The first skill follow-up permitted generic base-name aliases. #1959 deliberately removed them and retains qualifiers; the latest resolver is authoritative.
- Old foundation/Alison notes describe completed-only import while later progress work supports non-terminal state. Pending means progress, not completion/issuance.
- IXO queueing is not evidence of issued status. Historical generic Default/type wording can differ from later CF configuration.

## Deliberately Dropped

Repeated implementation-shaped child checklists, branch/merge narrative and stale release steps
are not repeated here. All original source files remain available. No Linear ticket descriptions,
partner configurations, databases, application code or deployment state were changed by this archive.
