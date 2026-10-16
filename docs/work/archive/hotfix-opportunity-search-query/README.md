# Opportunity search query hotfix

> Archived 2026-10-14; status `shipped`. Start with the [RECONSTRUCTED context pack](./CONTEXT-PACK.md)
> for merged/release provenance, recovered Stage/benchmark evidence and remaining profiling limits.
> The original working record below is retained; its local-only release wording is historical.

Unticketed follow-up requested by Adrian on 2026-09-16. This is a production-baseline hotfix, not a CF/cash-out feature. A master-based PR branch is now prepared locally. An accidental push to `current` was restored with Adrian's approval; see the latest handoff. No new release or deployment was performed during the recovery.

See [feature](feature.md) for scope, status and decisions, and the [latest handoff](handoffs/2026-09-16-c.md) for branch recovery, master integration and the next release steps. Earlier handoffs record the implementation evidence and Jason's UI change.

The preceding trigram-index hotfix remains deployed. This follow-up changes query shape and batching; it does not remove those indexes or introduce another migration.
