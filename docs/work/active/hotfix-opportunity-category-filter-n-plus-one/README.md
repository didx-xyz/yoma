# Hotfix: Opportunity category-filter N+1

- Owner: Adrian (API).
- Ticket: none, explicitly requested by Adrian for now.
- Plan and status: [feature.md](./feature.md).
- Latest combined handoff: [2026-10-26-c.md](../hotfix-opportunity-search-sync-n-plus-one/handoffs/2026-10-26-c.md).

Remove per-category count queries from public/admin category filters without changing their responses or filtering rules. Production shipped in v3.13.6. The separately verified master forward-port preserves CF's existing published-state rules and awaits Adrian's review and Stage deployment. Other N+1 recommendations require separate assessment; this is not a blanket rewrite.
