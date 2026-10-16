# Context Pack: Completed Referral Progress Hotfix — RECONSTRUCTED

## Provenance

- **Written:** 2026-10-14 by Adrian / Codex on `chore/cash-out-final-prep`.
- **Source now at:** `docs/work/archive/hotfix-referral-completed-progress/`; original README, feature and both handoffs are preserved.
- **Rebuilt from:** all four source documents, the merged fix and current `LinkUsageService.ParseComputed` logic.
- **Release:** `9ddefa76f` (#1956), tagged `v3.12.12`; forward-port `40ad184c5` (#1957) is on master. The historical local forward-port `76e465837` still resolves but is not the master squash anchor.
- **Not verified today:** live Production UI or a rerun of historical tests.

This is a reconstruction, not a contemporaneous test or release record.

## Where the Work Got To

The hotfix is `shipped`. Adrian confirmed the affected referral usage displayed Completed / 100%
after the `v3.12.12` release. The same behaviour was subsequently merged to master.

## Decisions That Still Bind

- Stored Completed is terminal and forces computed `PercentComplete = 100` and `EffectiveCompleted = true`.
- Adding or modifying a pathway afterwards cannot reduce that completed percentage.
- Pending usages retain their weighted calculation against the current programme requirements.
- Keep pathway detail as it is; do not infer completion from pathway creation dates.
- No migration, reward replay, stored-status change or response shape change accompanies this fix.

## Contract

`src/api/src/domain/Yoma.Core.Domain/Referral/Services/LinkUsageService.cs` owns the computed detail.
Tests in `Referral/Services/LinkUsageServiceTests.cs` cover Completed with pathways before/after
completion and Pending with incomplete progress. The master fixture accepts both execution-strategy
arguments; that is a test adaptation, not a lifecycle change.

## Evidence / Gotchas

The two recorded builds passed without warnings/errors and three focused cases passed. Broader
ClaimAsReferee tests had pre-existing lookup/message failures; the focused pass was never proof that
the entire referral suite was green. No new tests ran for this archive.

## Open Questions

No outstanding item in the scoped terminal-progress fix. Reassess unrelated referral-test debt only
as separately requested work.

## Deliberately Dropped

Current-first PR/release/cherry-pick instructions are completed history. Original handoffs remain
beside this pack; their uncommitted/pending wording describes those sessions, not the archive state.
