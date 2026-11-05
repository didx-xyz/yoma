# Feature: Completion skill assignment

## Meta

- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1313](https://linear.app/didx/issue/YOM-1313/newly-acquired-skills-not-displayed-in-user-profile)
- **Owner**: Adrian (API hotfix); Jason (Stage integration)
- **Areas**: api
- **Status**: review — Production hotfix, not committed or deployed
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
- [ ] Adrian reviews, commits, pushes and releases the hotfix.
- [ ] Review Production audit, approve historical mapping assumptions, then dry-run and commit the manual repair.
- [ ] Reconcile the fix into PR #2013; test against that branch's newer domain model.

## Decisions

- 2026-11-05: Base the hotfix on `v3.13.9`, not Stage. The normal checkout is `fix/completion-skill-assignment` for Visual Studio review. No commit or push without Adrian's approval.
- 2026-11-05: Carry skills onto the allocation result instead of discarding the result: its totals are published by `OpportunityEvent`.
- 2026-11-05: Historical repair is manual, additive and separate from deployment. Production uses `Entity.UserSkills` and `Entity.UserSkillOrganizations`, with no skill `Type` column. Do not transplant Stage SQL or its newer model assumptions.
- 2026-11-05: Audit all completed non-Job records with a completion date against current opportunity skill and organisation mappings. Jobs and missing dates are reported but excluded from repair. Current mappings cannot prove the historical mappings; explicit operator approval is mandatory. A mapping created after a completion may also reflect an imported/backdated completion.
- 2026-11-05: Do not infer a Production deployment cutoff from a Git commit date. New repair rows receive repair-time `DateCreated`, as normal assignment does; existing rows remain unchanged.

## Manual Repair

1. Run `src/api/migration/manual/2026-11-05-completion-skills-audit.sql` read-only and review the returned summary, anomalies and samples. Breakdown/sample arrays are capped; summary and fingerprint cover the complete candidate set.
2. After the hotfix is deployed, supply the two expected counts and candidate fingerprint in `2026-11-05-completion-skills-repair.sql`. Approve use of current mappings only after reviewing the historical limitation above.
3. Run the entire repair in a quiet window with its default final `ROLLBACK`. It uses fail-fast table locks and rejects changed candidates. On any error, immediately `ROLLBACK`; do not remove guards to force it through.
4. Review inserted counts and zero remaining missing links. Then rerun with only the final `ROLLBACK` changed to `COMMIT`. If the candidate set changed, re-audit first.
5. Run the audit again and verify a repaired learner's skills in the UI. No reward, counter, treasury or credential replay is needed.

## Links

- [Session handoff](handoffs/2026-11-05-a.md)
- Stage integration target: [PR #2013](https://github.com/didx-xyz/yoma/pull/2013)
