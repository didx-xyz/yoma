# Context Pack: Text Search Index Hotfix — RECONSTRUCTED

## Provenance

- **Written:** 2026-10-14 by Adrian / Codex on `chore/cash-out-final-prep`.
- **Source now at:** `docs/work/archive/hotfix-text-search-indexes/`; original README, feature and handoff are preserved.
- **Rebuilt from:** all three source documents and merged migration/domain diffs.
- **Merged references:** master `113a1a13f` (#1938); production `f791d5eaf`, tagged `v3.12.8`.
- **Not verified today:** environment permissions, live index health, workload plans or latency. Historical disposable-PostgreSQL evidence is retained below.

This is a reconstruction. The deployed migrations and current code remain authoritative.

## Where the Work Got To

The hotfix is `shipped`. It adds 17 ApplicationDb raw-column GIN trigram indexes and one Substack
title index, provisions `pg_trgm`, and retains existing full-text/B-tree indexes. The same delivery
intentionally permits Automatic as well as Manual verification in referral opportunity eligibility.

## Decisions That Still Bind

- Use concurrent index creation/drop and the existing recovery pattern for valid/invalid partial builds. Do not wrap these migration statements in an outer transaction.
- Retain the shared `pg_trgm` extension on rollback; other indexes may depend on it.
- Do not rewrite old deployed migrations or retarget existing unrelated indexes.
- Raw-column indexes cover the existing ILIKE expressions. Later lower-expression payout indexes are a separate merged follow-up.
- Referral candidate/computed eligibility accepts explicitly Manual or Automatic; retain hidden/status/date/organisation, Job and programme-country restrictions.
- Manual youth submission still independently requires Manual. Supporting Automatic referral opportunities does not open a manual override for partner-managed completions.

## Contracts

ApplicationDb migration `20260916145228_ApplicationDb_Text_Search_Trigram_Indexes` and Substack
migration `20260916145337_SubstackDb_Text_Search_Trigram_Indexes` own the index lifecycle.
Opportunity criteria, extensions and service code own referral eligibility. Physical-column
substring coverage spans Opportunity, User, Organization, Referral, ActionLink, Marketplace, Skill
and Substack title. MyOpportunity uses Opportunity/User matching.

## Evidence / Gotchas

Recorded isolated PostgreSQL checks covered fresh upgrade, repeat no-op, rollback/reapply, interrupted
concurrent index recovery, and non-superuser database-owner extension provisioning. All 18 indexes
were valid/ready. Ten Contains repositories translated/executed through both overloads with nine
term shapes. A separate domain harness passed 1,560 referral eligibility/pathway assertions.

The synthetic 30,000-row timing (about 481 ms to 0.4 ms) was never a Production benchmark.
Indexes add write/storage overhead and do not guarantee planner choice across joined predicates.
Computed/unnested distribution-list identifiers, short terms and wildcard searches remain separate
profiling cases. Run one migration executor and inspect partial-index state after a failure.

## Open Questions

Historical Stage/account-permission and representative full-endpoint validation boxes were not
independently resolved by this archive. The [query hotfix pack](../hotfix-opportunity-search-query/CONTEXT-PACK.md)
records the later query-shape and Stage smoke evidence without turning it into index-health proof.

## Deliberately Dropped

Uncommitted/master-PR/current-release instructions are historical. No original evidence was deleted;
the archive does not re-execute migrations or modify any database.
