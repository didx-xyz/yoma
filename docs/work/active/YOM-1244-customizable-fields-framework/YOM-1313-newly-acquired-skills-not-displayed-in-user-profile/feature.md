# Feature: Completion skill assignment

## Meta

- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1313](https://linear.app/didx/issue/YOM-1313/newly-acquired-skills-not-displayed-in-user-profile)
- **Owner**: Adrian (API hotfix); Jason (Stage integration)
- **Areas**: api
- **Status**: in-progress — Production fix and approved backfill complete; Stage reconciliation pending
- **Started**: 2026-11-05

## Problem / Goal

Completed opportunities can allocate rewards without assigning configured skills. `FinalizeVerification` replaces the fully loaded opportunity with the child-less projection returned by `AllocateRewards`; `AssignSkills` then sees no skills. Fix the shared completion path without changing rewards, counters, completion rules or API contracts.

## Out of Scope

- Frontend and credential-provider changes.
- Replaying completions, rewards or credentials.
- Automatic historical backfill or schema migrations.

## Plan

Preserve the original skills collection on the allocation result before replacing the opportunity. Retain the fresh allocation result because the subsequent opportunity update event needs its current totals. Cover completion entry points with mocked domain regression tests and provide separately reviewed manual SQL for historical missing skill links.

## Tasks

- [x] Verify hotfix base against `current` and released `v3.13.9`.
- [x] Reproduce missing-skill failures before the fix.
- [x] Preserve skills while retaining updated allocation totals.
- [x] Test completion routes, reward/no-reward cases and additive skill assignment.
- [x] Prepare read-only audit and guarded rollback-first repair scripts; validate with synthetic PostgreSQL data.
- [x] Adrian reviews, commits, pushes and releases the hotfix (PR #2019, v3.13.10).
- [x] Replace whole-backlog repair with tested, session-only batched scripts after reviewing audit volume.
- [x] Review Production audit, approve historical mapping assumptions, then dry-run and commit the manual repair.
- [x] Confirm post-commit totals and exclude later-mapping candidates under the no-retrospective-awards rule.
- [x] Archive sanitised manual scripts and the final repair handoff without Production exports or credentials.
- [ ] Reconcile the fix into PR #2013; test against that branch's newer domain model.

## Decisions

- 2026-11-05: Base the hotfix on `v3.13.9`, not Stage. The normal checkout is `fix/completion-skill-assignment` for Visual Studio review. No commit or push without Adrian's approval.
- 2026-11-05: Carry skills onto the allocation result instead of discarding the result: its totals are published by `OpportunityEvent`.
- 2026-11-05: Historical repair is manual, additive and separate from deployment. Production uses `Entity.UserSkills` and `Entity.UserSkillOrganizations`, with no skill `Type` column. Do not transplant Stage SQL or its newer model assumptions.
- 2026-11-05: Audit all completed non-Job records with a completion date against current opportunity skill and organisation mappings. Jobs and missing dates are reported but excluded from repair. Current mappings cannot prove the historical mappings; explicit operator approval is mandatory. A mapping created after a completion may also reflect an imported/backdated completion.
- 2026-11-05: Do not infer a Production deployment cutoff from a Git commit date. New repair rows receive repair-time `DateCreated`, as normal assignment does; existing rows remain unchanged.
- 2026-11-05: Adrian confirmed no retrospective skill awards for later opportunity changes. The remaining 60,798 late-mapping associations are excluded from this repair, not an outstanding repair backlog. Current rows still cannot establish every historical removal/re-addition.

## Manual Repair

The approved manual repair is complete. Adrian's post-commit results confirmed **999,181 user skills and 999,674 organisation links inserted**, with zero Ready and zero Deferred. This includes the separately reviewed backdated cohort (363 skills and 365 links). The remaining 60,798 associations are excluded under the confirmed policy above.

The whole-backlog repair is superseded. `src/api/migration/manual/2026-11-05-completion-skills-batch-guide.md` documents the archived batched runner, contention handling, targeted backdated repair and validation. These are not deployment migrations or instructions to rerun the completed incident. Public copies use database placeholders and disabled batch apply commands; future use requires fresh review.

No reward, counter, treasury or credential replay is needed. Current mappings remain a historical limitation; excluding late mappings reduces ambiguity but does not manufacture historical evidence.

## Links

- [Session handoff](handoffs/2026-11-05-a.md)
- [Final manual repair handoff](handoffs/2026-11-05-b.md)
- Stage integration target: [PR #2013](https://github.com/didx-xyz/yoma/pull/2013)
