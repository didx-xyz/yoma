# Feature: Recognise referral completion for Any rules

## Meta

- **Ticket**: [YOM-1314](https://linear.app/didx/issue/YOM-1314/recognise-referral-completion-when-any-required-option-is-completed)
- **Epic**: [Standalone work](../README.md)
- **Owner**: Adrian
- **Areas**: api
- **Status**: review - Production shipped in v3.13.11; master port awaiting review
- **Started**: 2026-11-09

## Problem and implementation

`ProgramPathwayProgress.Completed` and `ProgramPathwayStepProgress.Completed` required all children regardless of `Rule`. Percentages already recognised Any, producing inconsistent progress and preventing `LinkUsageService.ProcessProgressByUserId` from completing otherwise eligible claims.

The two predicates in `src/api/src/domain/Yoma.Core.Domain/Referral/Models/ProgramPathwayProgress.cs` now require at least one completed child for Any and every child for All. Empty collections retain their completed semantics. Existing earliest/latest completion-date calculations become reachable for satisfied Any rules.

After review of the recovery options, Adrian approved a reusable manual Hangfire sweep of all Pending claims. `LinkUsageBackgroundService.ProcessPendingProgress` snapshots distinct user IDs and calls the normal completion service sequentially in a fresh scope per user. Domain Startup registers it with `Cron.Never()`; no new endpoint, configuration setting or recurring automatic execution.

No API contract, dependency, schema, reward, expiry or terminal-state changes.

## Tasks

- [x] Verify current application code against successful Production release v3.13.10.
- [x] Branch `fix/referral-pathway-any-completion` from updated current.
- [x] Reproduce with failing domain and service tests, fix both predicates and validate.
- [x] Leave uncommitted for Adrian's review.
- [x] Review, commit, push, PR into current and deploy after approval (PR #2023, v3.13.11).
- [x] Agree and test a bounded, manually triggered recovery job for all Pending claims.
- [x] Deploy and manually trigger after checking the Pending/overdue audit.
- [x] Verify and report Production recovery outcomes; private claim-level evidence remains outside this repository.
- [x] Separately review and verify the approved historical Expired-claim exceptions.
- [x] Prepare the port on a new branch from master, preserving master-specific lifecycle handling.
- [ ] Adrian reviews, then authorises commit/push and PR into master.
- [ ] Merge and deploy to Stage; update the in-progress integration PR from master separately.

## Decisions

- 2026-11-09: Fix shared predicates; processing already consumes them. No rewrite of completion or reward processing.
- 2026-11-09: Do not reopen Expired, Abandoned or unclaimed intents. An overdue Pending claim still follows the existing expiry guard.
- 2026-11-09: No automatic recovery on deployment. Existing background jobs expire/abandon, not recheck Pending progress. The programme maintenance helper needs separate review because it repeats the first Pending batch without advancing past incomplete claims.
- 2026-11-09: Private audit rows and participant identifiers stay outside the public repository. Tests use synthetic cases.
- 2026-11-09: Adrian expanded scope to include the reusable manual job. This supersedes the earlier decision to leave the recovery trigger outside this hotfix. The old programme-maintenance helper remains untouched and is not used. Snapshot only distinct user IDs; process each once, not repeated first-page polling. Normal expiry, reward and terminal-state rules still apply.
- 2026-11-09: Port PR #2023 to master without unrelated partner-country mapping changes. Use the existing lifecycle-only BackgroundJobExecutionScope alongside the ownership-checked sweep lock. Stop dispatch at safe boundaries and drain the in-flight user before releasing ownership; no cancellation inside its completion transaction.

## Validation

Initial completion regressions: 33 cases, six failed before the fix, all pass afterwards. Production-focused follow-up added reward-pool/cap and concurrent status-change checks, plus interface-based Hangfire retry-filter verification. Combined referral and existing ownership-lock suite: 208 passed, zero failed, 14 isolated-database cases skipped. The sweep uses the existing ownership-checked lock wrapper. Full-suite attempt stopped after unrelated notification fixtures failed during Redis startup; no full-suite pass claimed. Focused formatting and diff whitespace checks pass.

Master port: 209 referral/ownership-lock tests and 21 lifecycle-helper tests passed, no failures or skips. API build passed without warnings. See [latest handoff](./handoffs/2026-11-09-c.md) for port validation and [manual-job handoff](./handoffs/2026-11-09-b.md) for trigger instructions and recovery cautions. The earlier hotfix validation above describes that codebase, not master's test inventory.
