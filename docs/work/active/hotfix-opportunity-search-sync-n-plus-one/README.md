# Hotfix: Opportunity search sync-state N+1

- Owner: Adrian (API).
- Ticket: none, per Adrian's direction for this N+1 work.
- Plan and status: [feature.md](./feature.md).
- Latest handoff: [2026-10-26-c.md](./handoffs/2026-10-26-c.md).
- Prepared alongside the separately reviewed [category-filter fix](../hotfix-opportunity-category-filter-n-plus-one/README.md), without changing that fix.

Batch the processing-log reads used to enrich opportunity and verification search pages. Preserve existing sync metadata, domain validation, search results and API contracts. Production shipped in v3.13.6; the master forward-port and Adrian-requested test-suite cleanup are awaiting review, without commit or push.
