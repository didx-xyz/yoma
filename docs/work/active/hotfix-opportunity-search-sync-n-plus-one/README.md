# Hotfix: Opportunity search sync-state N+1

- Owner: Adrian (API).
- Ticket: none, per Adrian's direction for this N+1 work.
- Plan and status: [feature.md](./feature.md).
- Handoff: [2026-10-26-a.md](./handoffs/2026-10-26-a.md).
- Prepared alongside the separately reviewed [category-filter fix](../hotfix-opportunity-category-filter-n-plus-one/README.md), without changing that fix.

Batch the processing-log reads used to enrich an opportunity search page. Preserve existing sync metadata, domain validation, search results and API contracts. Review one recommendation at a time; no additional endpoint optimization is included.
