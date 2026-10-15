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

Implementation is in PR #1929 on feature/sync-umuzi. No merge or deployment was performed during this status reconciliation.

- UmuziClient and OpportunityCatalogueBackgroundService own transport, catalogue caching and mapping.
- Yoma appends the signed-in user's GUID using configurable UserIdQueryParameter, currently yomaUserId. It is correlation, not authentication. Umuzi must capture it on its opportunity-specific learner page and enforce Yoma-originated completion scope.
- No PartnerSync.User row is expected for this correlation-only hand-off.
- Verification mapping prefers valid yomaUserId, with current username fallback. Completed/placed records set DateCompleted; pending/in_progress use endOrLastActivity and leave DateCompleted null.
- Pull windows use recorded/update time with overlap and mapped-payload duplicate handling. Partner confirmed recordedAt advances on changed records.
- The ten category mappings are implemented, including AI Data and Analytics with/without the comma.
- Shared lifecycle and source-of-truth rules remain in the epic README.

## Tasks

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

- 2026-10-14: Archive delivered Phase 1 at Adrian's direction, matching the cash-out close-out ahead of Production. Hidden-on-create is only a proposed extension awaiting a sample; update visibility remains Yoma-owned. B2B ensure-account stays separately prioritised via Koni.

- 2026-09-16: Track one deliverable rather than creating implementation-shaped sub-tickets. Linear status is In Progress with explicit blockers because the YOMA team has no Blocked state.
- 2026-09-16: Do not request seeded records now; local mocks suffice until partner readiness, then coordinate live Stage tests.
- 2026-09-16: No current production activation or end-to-end Stage success is claimed.

## Links

- [PR #1929](https://github.com/didx-xyz/yoma/pull/1929)
- [Session handoff](../handoffs/2026-09-16-a.md)
