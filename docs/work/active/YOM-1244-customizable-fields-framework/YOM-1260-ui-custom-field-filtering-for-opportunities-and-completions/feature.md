# Feature: UI — Custom-Field Filtering for Opportunities and Completions

## Meta

- **Feature**: Definition-driven custom-field filters
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1260](https://linear.app/didx/issue/YOM-1260)
- **Owner**: Jason
- **Areas**: web
- **Status**: in-progress
- **Started**: 2026-07-29

> Retro-created on 2026-08-11. The 2026-07-29 handoff is **reconstructed** from the branch and
> an out-of-repo context pack; `2026-08-11-a.md` is contemporaneous.

## Problem / Goal

Let users and admins filter the opportunity search by custom-field values, with the available
fields and operators derived from the definitions — no hardcoded field list. Filters must
coexist with the existing filters, round-trip through the URL, and be visible and clearable
as badges.

Surfaces: `/opportunities/[[...query]]` (public) and `/admin/opportunities/[[...query]]` (admin).

Capture and display are [YOM-1255](../YOM-1255-ui-dynamic-custom-fields-for-opportunities-and-completions/feature.md).

## Out of Scope

- **MyOpportunity / completion filtering.** The API supports it; no UI surface consumes it yet
  (see Open Questions in the latest handoff).
- **User Preset–driven filters** — YOM-1261 / YOM-1262, blocked. Presets resolve to filter
  criteria, so they build _on_ this feature; do not pre-empt them here.
- Phase-2 admin CRUD, credential mapping — see the epic.

## Plan

### Filter contract — verified by curl against `POST /api/v3/opportunity/search`

```
customFields: [{ key, operator, value?, valueTo?, values? }]   // clauses are ANDed
Equals | Contains | GreaterThan(OrEqual) | LessThan(OrEqual) → value
AnyOf  | AllOf                                               → values
Between → value (inclusive from) + valueTo (inclusive to)
Exists  → no value / valueTo / values at all
```

The UI submits the definition **`key`**; the API resolves the definition and hydrates its id and
data type server-side. Never send `customFieldDefinitionId` or `dataType`.

⚠️ Three rules that produce a hard `ValidationException` rather than an empty result set:

1. **Option filters submit option `key`s, never option `id`s.** `values:["certificate"]` → 200;
   `values:["c1000000-…"]` → _"contains an invalid option value"_.
2. **Option + `Equals` uses the scalar `value`, not `values`** — even though every _write_ path
   uses `values` for Option fields. `values` here → _"filter value does not match the selected operator"_.
3. **`AllOf` is valid only where `supportsMultiple === true`** → otherwise _"does not support multiple values"_.

An inverted `Between` range is also rejected, so it is caught client-side first.

### Operator matrix offered by the UI

| Data type         | Operators                                                                           |
| ----------------- | ----------------------------------------------------------------------------------- |
| String            | Contains · Equals · AnyOf · Exists                                                  |
| Integer / Decimal | Equals · From (≥) · Up to (≤) · Greater than · Less than · Between · AnyOf · Exists |
| DateTime          | Equals · From (≥) · Up to (≤) · Greater than · Less than · Between · Exists         |
| Boolean           | Equals · Exists                                                                     |
| Option            | AnyOf · AllOf _(multi-select only)_ · Equals · Exists                               |

`AnyOf` is deliberately withheld from Boolean and DateTime even though the API accepts it — see Decisions.

### Components

| Component                                                                | Role                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/Opportunity/CustomFieldFilters.tsx`                          | The whole surface. Controlled; the parent owns `CustomFieldFilter[]`. Also exports `sanitizeCustomFieldFilters` (drops half-completed clauses), `getCustomFieldFilterErrors` (blocks submit), `getCustomFieldFilterOperators`, and `useCustomFieldFilterLabeler` (badge text) |
| `OpportunityFilterVertical.tsx`                                          | Public filter modal — renders the component after the standard filters                                                                                                                                                                                                        |
| `OpportunityAdminFilterVertical.tsx`                                     | Admin filter modal — same component in an "Additional fields" accordion, react-select portalled to the modal's `htmlRef`                                                                                                                                                      |
| `Admin/opportunityAdminFilter.ts`                                        | Admin querystring ↔ filter mapping; declares `{ param: "customFields", kind: "json" }`                                                                                                                                                                                        |
| `Admin/OpportunityAdminFilterBadges.tsx` / `components/FilterBadges.tsx` | Badge rendering, both via `useCustomFieldFilterLabeler`                                                                                                                                                                                                                       |

### Transport

Clauses travel as **JSON in a single `customFields` query param**. `URLSearchParams` does the
encoding — do **not** `encodeURIComponent` on top of it.

### Badges

Badges show the **value only** (option / lookup names resolved), not the field name — except
`Exists`, which has no value, so the field title is shown. Each clause is one badge and removes
individually.

## Tasks

- [x] Operator-matrix filter UI, definition-driven, shared by the public and admin filters.
- [x] URL round-trip (`customFields` JSON param) on both pages.
- [x] Badges with per-clause removal on both pages.
- [x] Client-side validation blocking submit (numeric parse, inverted `Between`).
- [x] Lookup-backed Country / Language / Skill pickers submitting GUIDs.
- [ ] **Click-test the admin filter end-to-end** — it is `ROLE_ADMIN`-gated and has never been
      driven through a browser.
- [ ] Decide whether completion (MyOpportunity) filtering gets a surface in this epic.
- [ ] Revisit which definitions should be _filterable_ once the BA set lands — everything active
      is offered today, which will not scale.

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-07-29: Clauses are transported as one JSON query param rather than a flattened param per
  clause — the shape is nested (`operator` + up to three value slots) and a flat encoding would
  need its own grammar.
- 2026-08-11: Filter values use option **keys**, Option + `Equals` uses the scalar `value`, and
  `AllOf` is offered only for multi-select definitions — all three verified by curl after the
  first pass submitted option ids and was rejected by the API.
- 2026-08-11: `AnyOf` is not offered for Boolean ("any of true/false" filters nothing) or DateTime
  (exact-instant matching is not a usable control), even though the API accepts both.
- 2026-08-11: The "temporarily disable custom-field filtering" switch is a **commented-out
  `CUSTOM_FIELD_FILTERS_ENABLED = false`** with a `TODO(YOM-1260)` at the top of
  `CustomFieldFilters.tsx` — not a live feature flag. Filtering stays visible on both surfaces so
  it can be exercised before the BA definitions land.
- 2026-08-11: Badges show the value only, per product preference; `Exists` falls back to the title.
- 2026-08-11: Native selects/inputs are sized to the react-select control (`h-10 min-h-10`), not
  the reverse — react-select's 38px control min-height cannot be overridden through its
  `classNames` API, so the shorter `select-sm` / `input-sm` variants were dropped.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1260](https://linear.app/didx/issue/YOM-1260)
- Depends on: [YOM-1254](https://linear.app/didx/issue/YOM-1254) (API) · [YOM-1255](../YOM-1255-ui-dynamic-custom-fields-for-opportunities-and-completions/feature.md)
- Blocks: [YOM-1261](https://linear.app/didx/issue/YOM-1261) → [YOM-1262](https://linear.app/didx/issue/YOM-1262) (User Presets resolve to filter criteria)
