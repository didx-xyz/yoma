# Feature: Recognise referral completion for Any rules

## Meta

- **Ticket**: [YOM-1314](https://linear.app/didx/issue/YOM-1314/recognise-referral-completion-when-any-required-option-is-completed)
- **Epic**: [Standalone work](../README.md)
- **Owner**: Adrian
- **Areas**: api
- **Status**: review - local hotfix ready; deployment and recovery not performed
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
- [ ] Review, commit, push, PR into current and deploy after approval.
- [x] Agree and test a bounded, manually triggered recovery job for all Pending claims.
- [ ] Deploy and manually trigger after checking the Pending/overdue audit.
- [ ] Verify recovery outcomes, reward schedules and counters.
- [ ] Separately review historical Expired claims before repair.
- [ ] Port to the appropriate master branch, respecting ongoing Stage work.

## Decisions

- 2026-11-09: Fix shared predicates; processing already consumes them. No rewrite of completion or reward processing.
- 2026-11-09: Do not reopen Expired, Abandoned or unclaimed intents. An overdue Pending claim still follows the existing expiry guard.
- 2026-11-09: No automatic recovery on deployment. Existing background jobs expire/abandon, not recheck Pending progress. The programme maintenance helper needs separate review because it repeats the first Pending batch without advancing past incomplete claims.
- 2026-11-09: Private audit rows and participant identifiers stay outside the public repository. Tests use synthetic cases.
- 2026-11-09: Adrian expanded scope to include the reusable manual job. This supersedes the earlier decision to leave the recovery trigger outside this hotfix. The old programme-maintenance helper remains untouched and is not used. Snapshot only distinct user IDs; process each once, not repeated first-page polling. Normal expiry, reward and terminal-state rules still apply.

## Validation

Initial completion regressions: 33 cases, six failed before the fix, all pass afterwards. Production-focused follow-up added reward-pool/cap and concurrent status-change checks, plus interface-based Hangfire retry-filter verification. Combined referral and existing ownership-lock suite: 208 passed, zero failed, 14 isolated-database cases skipped. The sweep uses the existing ownership-checked lock wrapper. Full-suite attempt stopped after unrelated notification fixtures failed during Redis startup; no full-suite pass claimed. Focused formatting and diff whitespace checks pass.

See [latest handoff](./handoffs/2026-11-09-b.md) for manual trigger instructions and recovery cautions.
