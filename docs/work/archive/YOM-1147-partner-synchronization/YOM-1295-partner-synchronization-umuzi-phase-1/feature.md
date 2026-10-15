# Feature: Umuzi Phase 1 Partner Synchronization

## Meta

- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1295](https://linear.app/didx/issue/YOM-1295/partner-synchronization-umuzi-phase-1)
- **Owner**: Adrian
- **Areas**: api; partner-owned learner UI
- **Status**: shipped — merged delivery archived ahead of the combined cash-out Production release; rollout/E2E proof is qualified in the context pack
- **Recorded**: 2026-09-16

## Problem / Goal

Maintain Umuzi opportunities and import progress/completions for Yoma-originated learners through the existing pull-sync framework. This feature record is a reconstruction of the agreed scope and reported tests, not a claim that implementation happened today.

## Out of Scope

- Pre-authentication and permanent external-user linking in Phase 1.
- Sara's broader ensure-account/B2B onboarding request; separately assessed and awaiting prioritisation.
- Final custom-field mappings; revisited under CF alongside the other providers.

## Plan / Contract

Archive update, 2026-10-14: #1929 is merged and #1965 supplies Production configuration. Later
September evidence confirms five Stage opportunities and correlation navigation; the partner
reported learner-page/URL readiness. The [context pack](../CONTEXT-PACK.md) supersedes old blockers
and separates those observations from live completion/issuance and Production activation evidence.

### Creation-Only Visibility Follow-up — 2026-10-15

Ngoako supplied an updated opportunity payload containing boolean `hidden`. The DTO now accepts
that property and the Umuzi mapper passes it to the create request. `true` creates hidden;
`false` or an omitted property retains the visible default. This applies to Learning and Job.

After creation, Yoma owns visibility. Existing shared pull orchestration continues to call
`ToRequestUpdate(..., applyHidden: false)` for both update requests and their payload hashes;
normal domain updates preserve the stored value when Hidden is null. Feed visibility changes
therefore neither overwrite a Yoma setting nor trigger a visibility-only domain update.
This is not a retroactive hide/backfill of existing opportunities. `active: false` retains its
terminal removal meaning. No schema, configuration, pre-authentication or Web change is needed.

The follow-up merged to master as `ca62876d4` (#1974), independently of the cash-out preparation
branch, and is retained in this archive. Independent Stage smoke validation remains unconfirmed.
The historical Phase 1 readiness text below is retained; this follow-up does not assert new live
completion/credential or Production validation.

Implementation is in PR #1929 on feature/sync-umuzi. No merge or deployment was performed during this status reconciliation.

- UmuziClient and OpportunityCatalogueBackgroundService own transport, catalogue caching and mapping.
- Yoma appends the signed-in user's GUID using configurable UserIdQueryParameter, currently yomaUserId. It is correlation, not authentication. Umuzi must capture it on its opportunity-specific learner page and enforce Yoma-originated completion scope.
- No PartnerSync.User row is expected for this correlation-only hand-off.
- Verification mapping prefers valid yomaUserId, with current username fallback. Completed/placed records set DateCompleted; pending/in_progress use endOrLastActivity and leave DateCompleted null.
- Pull windows use recorded/update time with overlap and mapped-payload duplicate handling. Partner confirmed recordedAt advances on changed records.
- The ten category mappings are implemented, including AI Data and Analytics with/without the comma.
- Shared lifecycle and source-of-truth rules remain in the epic README.

## Tasks

- [x] Accept the supplied `hidden` boolean and map initial visibility only.
- [x] Keep shared update/hash visibility exclusion and cover it for Learning and Job.
- [x] Include a hidden active opportunity in the embedded sample; omitted flags remain covered.
- [x] Build cleanly and pass eight new visibility cases plus existing partner/skill regression (56 total).
- [x] Merge the independent creation-only visibility follow-up in #1974.
- [ ] Retain/complete independent Stage smoke evidence for new hidden/visible opportunities and Yoma-owned updates.

- [x] Implement catalogue and verification integration and correlation redirect.
- [x] Align categories and date/overlap contract with partner feedback.
- [x] Exercise local embedded samples: matching, progress-to-completion, repeat-run skips, participant counts and issuance queueing.
- [x] Exercise authentication and catalogue retrieval locally against Umuzi staging.
- [x] Partner reports opportunity-specific learner URLs/user-ID capture ready; navigation demonstrated on Stage.
- [x] Merge #1929 and deploy Yoma Stage; five catalogue opportunities imported after corrected validation retry.
- [x] Receive Production connection details and merge configuration in #1965.
- [ ] Retain/complete live progress-to-completion and credential E2E evidence; catalogue/navigation extracts alone are insufficient.
- [ ] Complete the combined cash-out Production rollout and validate activation; archive close-out is ahead of deployment.

## Decisions

- 2026-10-15: Honour Umuzi's hidden flag only on initial creation, defaulting to false when omitted. Subsequent visibility belongs to Yoma and remains excluded from mapped update hashes. Keep the change based on remote master so Stage delivery does not require the cash-out prep/archive changes.
- 2026-10-15: Preserve the shipped Phase 1 archive and merge #1974's follow-up and original handoff into it; merged code is not proof of independent Stage smoke or Production activation.
- 2026-10-14: Archive delivered Phase 1 at Adrian's direction, matching the cash-out close-out ahead of Production. Hidden-on-create was then only a proposal; the October 15 follow-up supersedes that limitation. B2B ensure-account stays separately prioritised via Koni.

- 2026-09-16: Track one deliverable rather than creating implementation-shaped sub-tickets. Linear status is In Progress with explicit blockers because the YOMA team has no Blocked state.
- 2026-09-16: Do not request seeded records now; local mocks suffice until partner readiness, then coordinate live Stage tests.
- 2026-09-16: No current production activation or end-to-end Stage success is claimed.

## Links

- [PR #1929](https://github.com/didx-xyz/yoma/pull/1929)
- [Session handoff](../handoffs/2026-09-16-a.md)
