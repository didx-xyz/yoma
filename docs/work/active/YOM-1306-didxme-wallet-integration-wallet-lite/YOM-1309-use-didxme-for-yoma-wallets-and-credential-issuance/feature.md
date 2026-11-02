# Feature: Use didx:me for Yoma wallets and credential issuance

## Meta

- **Ticket**: YOM-1309
- **Epic**: [YOM-1306](../README.md)
- **Owner**: Adrian
- **Status**: in-progress — local issuance/read/cache flow verified; release gates remain
- **Branch**: `feature/yom-1306-didxme-wallet-integration-wallet-lite`

## Goal / Yoma Contract

Implement the provider behind existing Yoma SSI interfaces. Preserve domain scheduling,
credential identity and wallet responses; keep Aries infrastructure and its original behavior.
Provider-specific adaptation and mappings belong in infrastructure. Current didx:me integration
uses Yoma signing; revisit per-organisation signing separately. No provider selection flag or
special issuer seed is required in domain/test-data logic.

Both credential families use SDJWT with this adapter. The additive enum/provider changes retain
existing Aries formats. Preset mappings preserve immutable schema versions; issuance mappings
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
- [ ] Coordinate Jason's five frontend CF references and the matching staging rollout.
- [ ] REQUIRED: implement supported issuance recovery/reconciliation.
- [ ] REQUIRED: implement background Replay lookup/deletion/confirmed absence and preserve issuance dates.
- [ ] Optional: shared Debug-only outbound Flurl logging, controlled by existing logging settings,
  with sensitive data redacted and no duplicated Aries handlers.
- [x] Adrian reviewed, committed and pushed the implementation batch.
- [ ] Provision/verify Dev with SRE, separating once-off setup from ongoing configuration/secrets.
- [ ] Deferred until Stage preparation: design/rehearse provider-state reset and reissuance; drain workers, define affected records,
  preserve source references/dates, rebuild mappings and reconcile both credential families.
- [ ] Deferred until Stage preparation: agree rollback/retention before SRE decommissions prior provider data. A DI switch alone
  cannot restore removed data or reinterpret old provider IDs.
- [x] Remove private integration-document versions from the feature history and delete the assessment file; coordinate collaborator resynchronization.

## Decisions

- Keep organisation scheduling and Aries signing behavior unchanged. Adapt current didx:me
  signing in infrastructure; future per-organisation signing is a separate design decision.
- Schema and issuance stores preserve the current domain contract while provider fallback remains.
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

The latest SSI/Core run reported 1,023 total, zero failures/errors and one explicit test not
run (1,022 passed). Local API issuance, list/detail, mobile-to-email continuity and caching have been exercised; this does not
claim completion of browser/Dev or live multi-replica tests. Recovery/Replay block production use.

See the [session / frontend handoff](./handoffs/2026-11-02-a.md) and
[local startup guide](../environment.md). Local SSI parallelism was restored to the configured defaults (5/5) after debugging.
