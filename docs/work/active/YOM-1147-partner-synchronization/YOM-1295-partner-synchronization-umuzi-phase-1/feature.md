# Feature: Umuzi Phase 1 Partner Synchronization

## Meta

- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1295](https://linear.app/didx/issue/YOM-1295/partner-synchronization-umuzi-phase-1)
- **Owner**: Adrian
- **Areas**: api; partner-owned learner UI
- **Status**: blocked — code-complete; partner URL and learner-page readiness precede end-to-end Stage testing
- **Recorded**: 2026-09-16

## Problem / Goal

Maintain Umuzi opportunities and import progress/completions for Yoma-originated learners through the existing pull-sync framework. This feature record is a reconstruction of the agreed scope and reported tests, not a claim that implementation happened today.

## Out of Scope

- Pre-authentication and permanent external-user linking in Phase 1.
- Sara's broader ensure-account/B2B onboarding request; separately assessed and awaiting prioritisation.
- Final custom-field mappings; revisited under CF alongside the other providers.

## Plan / Contract

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
- [ ] Partner: publish opportunity-specific learner URLs and connect the learner page to redirect capture.
- [ ] Confirm PR merge readiness, deploy Yoma Stage, then run the complete partner journey and credential validation.
- [ ] Receive production URL/credentials, configure and validate production activation.

## Decisions

- 2026-09-16: Track one deliverable rather than creating implementation-shaped sub-tickets. Linear status is In Progress with explicit blockers because the YOMA team has no Blocked state.
- 2026-09-16: Do not request seeded records now; local mocks suffice until partner readiness, then coordinate live Stage tests.
- 2026-09-16: No current production activation or end-to-end Stage success is claimed.

## Links

- [PR #1929](https://github.com/didx-xyz/yoma/pull/1929)
- [Session handoff](../handoffs/2026-09-16-a.md)
