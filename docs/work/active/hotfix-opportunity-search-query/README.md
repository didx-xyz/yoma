# Opportunity search query hotfix

Unticketed follow-up requested by Adrian on 2026-09-16. This is a production-baseline hotfix, not a CF/cash-out feature. PR #1939 is merged and deployed to Stage. Adrian completed the browsing smoke checks. Local `current` is prepared for the agreed morning release; it has not been pushed or released. The earlier accidental push was restored as recorded in the recovery handoff.

See [feature](feature.md) for scope, status and decisions, and the [latest handoff](handoffs/2026-09-17-a.md) for Stage evidence, local production preparation and the next release steps. Earlier handoffs record the implementation evidence and branch recovery.

The preceding trigram-index hotfix remains deployed. This follow-up changes query shape and batching; it does not remove those indexes or introduce another migration.
