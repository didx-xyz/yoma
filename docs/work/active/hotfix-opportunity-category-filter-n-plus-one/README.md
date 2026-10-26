# Hotfix: Opportunity category-filter N+1

- Owner: Adrian (API).
- Ticket: none, explicitly requested by Adrian for now.
- Plan and status: [feature.md](./feature.md).
- Handoff: [2026-10-26-a.md](./handoffs/2026-10-26-a.md).

Remove per-category count queries from the public category-filter endpoint without changing its response or filtering rules. Prepare from the deployed Production release, then forward-port to master while preserving CF's existing published-state rules. Other N+1 recommendations require separate assessment; this is not a blanket rewrite.
