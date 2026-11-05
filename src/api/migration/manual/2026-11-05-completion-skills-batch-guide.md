# Completion skills: archived manual repair

The approved Production repair was completed by Adrian on 2026-11-05 after v3.13.10. These scripts are retained for traceability, **not scheduled jobs, deployment migrations or instructions to rerun the incident**. A new repair requires a fresh audit and explicit approval.

## Outcome and policy

- First pass: 998,818 user skills and 999,309 organisation links inserted.
- Reviewed backdated cohort: another 363 user skills and 365 organisation links inserted.
- Final operator-supplied progress: **999,181 user skills, 999,674 organisation links, zero Ready and zero Deferred**.
- 60,798 associations remain excluded. Adrian confirmed that later-added skills are not awarded retrospectively to earlier completers. The database queue calls these `Review`; that technical label does not mean an approved repair backlog.
- Current mappings are not historical snapshots. The decision to exclude is not proof that every mapping was first introduced after completion; explicit removal/re-addition cannot be reconstructed from current rows.
- Rewards, counters, treasury totals, credentials and existing skill rows were not targets of this repair.

## Retained files

All filenames below begin with `2026-11-05-completion-skills-`.

| Suffix | Purpose |
| --- | --- |
| `audit.sql` | Read-only comparison against current mappings; missing totals are candidates, not automatic entitlements. |
| `repair.sql` | Superseded whole-backlog transaction. Do not use for this incident. |
| `batch-prepare.sql` | Temporary queue, progress/log tables and bounded per-batch procedure. |
| `batch-dry-run.sql` | One rollback-only pilot; temporary log only. |
| `batch-apply.sql` | Pilot and bounded continuation commands, now commented out. |
| `batch-auto-resume.sql` | Tested automatic continuation with bounded lock retry; apply commands now commented out. |
| `backdated-review-repair.sql` | Separate, rollback-first repair for the reviewed 365-association cohort. Historical count guards are intentionally retained. |

Environment-specific database guards use `__APPROVED_DATABASE__`. Replace this only in a private operator copy after verifying the intended database. Do not commit the populated copy, credentials, connection details or exported result rows. No private account identifiers or Production exports are included.

## Original operating sequence (historical reference)

1. After deployment, prepare in one SQL editor/connection with Auto-commit enabled and no unrelated open transaction. Preparation writes only temporary session objects.
2. Run the dry-run statements individually; the proposed application inserts roll back. Review counts and timing.
3. Approve and execute one committed pilot. Every `CALL` must be a separate top-level statement, not wrapped in `BEGIN` or a multi-statement server batch ([PostgreSQL transaction management](https://www.postgresql.org/docs/17/plpgsql-transactions.html)).
4. Continue in batches of at most 1,000. The original runner supports at most 100 batches per call. The automatic runner supports at most 2,000, pauses one second after each commit and retries only lock acquisition every five seconds, stopping after 24 consecutive busy attempts. Partially acquired locks are released before backoff.
5. Both runners stop after a batch exceeding two seconds; that batch has already committed. The automatic runner also stops if supporting records are deferred. Other errors are not swallowed. The operator used a 30-minute overall statement timeout for automatic continuation; this is not a lock-wait duration.
6. Re-audit at ReadyRemaining=0. Independently review late mappings; never promote the entire review queue automatically.
7. The 365-association repair was first rolled back, then committed after review. Its log's `DryRun=false` is not proof of commit: its final transaction statement determines whether all inserts and progress persist.
8. The final progress query was run separately after commit. Stop repair work when the approved cohort is complete. Closing the repair connection removes its temporary objects; there is no permanent repair queue or procedure.

DBeaver's Execute SQL Script (Alt+X) sends statements sequentially. Script Commit type must be **After each query (autocommit)** for procedure-level commits, and Error handling **Stop + rollback**. Never use its parallel separate-tabs execution mode for these scripts. See [DBeaver SQL execution](https://dbeaver.com/docs/dbeaver/SQL-Execution/).

## Safety and interpretation

- Ready requires a current mapping created no later than a qualifying completed non-Job record's completion date. This conservative filter is not a historical snapshot guarantee.
- Review lacks that evidence. Backdated/imported completions can be valid exceptions; the separate repair accepted only mappings present by completion-record creation, under reviewed cohort guards.
- Deferred means the selected supporting record no longer qualifies at execution time. No award is made from that stale proof.
- Missing user skills and organisation links are inserted additively; existing rows are preserved. New rows use repair-time DateCreated.
- Short per-batch table locks allow readers but briefly exclude completion/mapping/skill writers. NOWAIT is retained. Persistent contention is a reason to pause, not remove the locks.
- Timeout/cancellation/error rolls back only the active batch. Earlier commits remain saved. Execute ROLLBACK after an error, inspect progress and reset any session statement timeout. Never assume the whole run rolled back.
- Connection loss removes temporary progress, not committed repairs. Re-preparation excludes existing links but requires a renewed review; the historical 365-cohort script is not a general resumable repair.
- A shared user-skill can exist while an organisation association remains excluded. Do not sum per-organisation user-skill counts as independent records.

## Validation evidence

Synthetic PostgreSQL 17 tests covered rollback, commit, resume/no-op, reconnect/re-preparation, invalid calls, injected mid-batch failure, changed-source deferral, existing-assignment handling and preservation of excluded records and financial fields. A 200,008-ready synthetic queue exercised a pilot and 25,000 committed associations.

The automatic continuation was separately tested against a concurrent writer: it backed off and resumed, and released partially acquired source locks when a later lock failed. Persistent-contention stopping was tested with shortened retry limits in the synthetic copy only.

The reviewed backdated repair passed rollback, commit, queue accounting and exclusion of later-created mappings. Production execution and results were supplied by Adrian; the agent did not execute Production writes. No application code changed in this scripts/documentation follow-up.
