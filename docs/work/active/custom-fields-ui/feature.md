# Feature: Custom Fields UI (Opportunity + Completion)

## Meta

- **Feature**: Custom Fields UI
- **Epic**: YOM-1244
- **Owner**: Jason
- **Areas**: web
- **Status**: in-progress
- **Started**: 2026-07-20

> Retro-created on 2026-08-11. Work began before the `docs/work` convention landed
> (`a9518de0`), so the Tasks and Decisions below were reconstructed from the branch,
> the Linear tickets and the out-of-repo context pack. Earlier sessions have no
> handoff documents; the first one is `handoffs/2026-08-11-a.md`.

## Problem / Goal

The API (YOM-1254) introduces a generic, typed custom-field framework for Opportunity
and MyOpportunity so that type-specific data — Job salary, work type, qualification —
can be added without growing the core Opportunity model. The web app has to render,
capture, display and filter those fields **entirely from metadata**: definitions are
loaded from the API and drive the controls, so the same UI keeps working when the
temporary seeded `[Sample] …` definitions are replaced by the BA-approved set (YOM-1264).

Surfaces in scope: opportunity create/edit (admin, org admin), opportunity details
(public + org admin), completion capture and display (user), and definition-driven
filtering on both the public and admin opportunity searches.

Tickets: YOM-1244 (epic) · YOM-1254 (API dependency) · YOM-1255 (dynamic fields UI) ·
YOM-1260 (filtering UI) · YOM-1261 / YOM-1262 (User Presets UI, blocked) ·
YOM-1264 (BA/design definition, blocked).

## Out of Scope

- **Phase-2 admin CRUD for definitions and options.** Definitions are scripted server-side
  in Phase 1; there is no admin screen for them and none is planned in this feature.
- **Credential (SSI) mapping UI.** Tracked on the API side; excluded unless separately confirmed.
- **User Presets** (YOM-1261 / YOM-1262). Presets are stable **User-domain** data, *not*
  custom fields, and must not be built through the custom-field components. Blocked on
  YOM-1264 (design) and YOM-1257 / YOM-1258 (API).
- **User-level custom fields.** The framework supports Opportunity and MyOpportunity only.
- **Opportunity taxonomy migration** (YOM-1259) — an Opportunity-domain lookup, unrelated
  to this framework; categories are already loaded from the API and need only a regression check.
- **Any hardcoded field key, title, option or opportunity type.** This is a hard constraint,
  not a preference — see Decisions, 2026-07-20.

## Plan

### API contract — verified against the running API, not the ticket text

The ticket descriptions on YOM-1244 are stale. These were each confirmed by calling a
local API on `feature/custom-fields-framework`:

| Fact | Detail |
| --- | --- |
| Definition discovery | `GET /opportunity/custom/field/definition?types={Type}` (anonymous, repeatable `types`), `GET /opportunity/{id}/custom/field/definition` (admin/org admin), `GET /myopportunity/{opportunityId}/custom/field/definition` (user) |
| `types` binding | the **`Type` enum name** (`Other` / `Learning` / `Event` / `Job` / `Task`), **not** the type GUID |
| `lookupType` | **exists** on the definition (`Country` / `Language` / `Skill`; `null` → inline `options`). `defaultValue` was **removed** |
| Values | non-option → `value`; **every** Option field → `values`. Inline options submit the option **`key`**; lookup-backed options submit the lookup **GUID** |
| Responses | `Opportunity` / `OpportunityInfo` / `MyOpportunity` hydrate `customFields`; definitions are **not** repeated per entity — join on `key` |
| Save semantics | **replacement** — resubmit the full collection on every save; omitted keys are deleted server-side. Never send a partial diff |
| Completion | `multipart/form-data`, `CustomFields` as **one JSON-encoded form field** |

### Filter contract (YOM-1260) — verified by curl against `POST /api/v3/opportunity/search`

```
customFields: [{ key, operator, value?, valueTo?, values? }]   // clauses are ANDed
Equals | Contains | GreaterThan(OrEqual) | LessThan(OrEqual) → value
AnyOf  | AllOf                                               → values
Between → value (inclusive from) + valueTo (inclusive to)
Exists  → no value / valueTo / values at all
```

⚠️ Three rules the API enforces that are easy to get wrong, each producing a hard
`ValidationException` rather than an empty result set:

1. **Option filters submit option `key`s, never option `id`s.** `values:["certificate"]` → 200;
   `values:["c1000000-…"]` → *"contains an invalid option value"*.
2. **Option + `Equals` uses the scalar `value`, not `values`** — despite every *write* path
   using `values` for Option fields. `values` here → *"filter value does not match the selected operator"*.
3. **`AllOf` is valid only where `supportsMultiple === true`** → otherwise *"does not support multiple values"*.

An inverted `Between` range is also rejected server-side, so it is caught client-side first.

### Key files

| Area | File |
| --- | --- |
| Models / enums | `api/models/opportunity.ts` (`CustomFieldDefinition`, `CustomFieldOption`, `CustomFieldValueRequest`, `CustomFieldValueItem`, `CustomFieldFilter`, `CustomFieldDataType`, `CustomFieldLookupType`, `CustomFieldFilterOperator`), `api/models/myOpportunity.ts` |
| Services | `api/services/opportunities.ts` (definitions by type / by id), `api/services/myOpportunities.ts` (definitions by opportunity + multipart completion) |
| Hooks | `hooks/useOpportunityMutations.tsx` — `useOpportunityCustomFieldDefinitionsQuery(types)`, `useMyOpportunityCustomFieldDefinitionsQuery(opportunityId)` |
| Editing | `components/Opportunity/CustomFields.tsx` (+ exported `getCustomFieldError(s)`, `getCustomFieldNumberError`) |
| Read-only | `components/Opportunity/CustomFieldsView.tsx`, `OpportunityCustomFieldsSection.tsx`, `MyOpportunityCustomFieldsSection.tsx`, `OpportunityCompletionRead.tsx`, `MyOpportunity/OpportunityListItem.tsx` |
| Filtering | `components/Opportunity/CustomFieldFilters.tsx` (+ `sanitizeCustomFieldFilters`, `getCustomFieldFilterErrors`, `useCustomFieldFilterLabeler`), `OpportunityFilterVertical.tsx`, `OpportunityAdminFilterVertical.tsx`, `Admin/opportunityAdminFilter.ts`, `Admin/OpportunityAdminFilterBadges.tsx`, `components/FilterBadges.tsx` |
| Pages | `pages/opportunities/[[...query]]`, `pages/admin/opportunities/[[...query]]`, `pages/organisations/[id]/opportunities/[opportunityId]{,/info}` |

### Transport

Filter clauses travel in the querystring as **JSON in a single `customFields` param**
(`URLSearchParams` does the encoding — do not `encodeURIComponent` on top of it). The admin
page declares it as `{ param: "customFields", key: "customFields", kind: "json" }` in
`opportunityAdminFilter.ts`; the public page parses and serialises it inline.

## Tasks

- [x] **T1 — Opportunity create / edit / details.** Definition-driven fields in step 2 of the
      wizard, wired through `<Controller name="customFields">` so they take part in the step's
      zod validation and the unsaved-changes dialog; read-only display on the org-admin and
      public detail pages.
- [x] **T2 — Completion (user) + list cards.** MyOpportunity definitions hook, multipart
      submission, completion read view, custom-field metadata on the opportunity list item.
- [x] **T3 — Details / card metadata.** Detail views shipped with T1. Search-result card
      metadata reuses `CustomFieldsView` with a `fields` whitelist.
- [x] **T4 — Search filters (YOM-1260).** Operator-matrix filter UI shared by the public and
      admin vertical filters; clauses round-trip through the URL and render as badges.
- [ ] **T5 — Manage User Presets (YOM-1261).** Blocked — see Out of Scope.
- [ ] **T6 — Apply User Presets to discovery (YOM-1262).** Blocked on T5.
- [ ] Re-verify every surface once the BA-approved definitions replace the seeded
      `[Sample] …` set (YOM-1264). No code change should be needed — that is the point of
      the definition-driven constraint.
- [ ] Regression check that opportunity categories are not hardcoded anywhere, for the
      taxonomy change (YOM-1259).

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-07-20: **Everything renders from definitions; no key, title, option or opportunity type
  is hardcoded.** Phase-1 definitions are temporary scripted metadata that the BA will replace
  wholesale (YOM-1264); anything keyed to a `[Sample] …` field would break on that swap.
- 2026-07-22: Contract corrections captured after reading the API branch: `lookupType` **exists**,
  `defaultValue` was **removed**, and entity responses **do** hydrate `customFields`. The earlier
  planning notes said the opposite on all three.
- 2026-07-22: Custom-field state is held **outside** the react-hook-form form object and merged
  into the payload on submit, because `zodResolver` strips unknown keys. Validation is shared
  with the caller's zod via the exported `getCustomFieldError(s)` so both agree without duplicating rules.
- 2026-07-22: Opportunity saves resubmit the **full** collection reconciled against the current
  type's definitions (replacement semantics). Omitted keys are deleted server-side.
- 2026-07-28: Filter clauses use option **keys**, Option + `Equals` uses the scalar `value`, and
  `AllOf` is offered only for multi-select definitions — all three verified by curl after the
  first implementation submitted option ids and was rejected by the API.
- 2026-07-28: `AnyOf` is deliberately **not** offered for Boolean ("any of true/false" filters
  nothing) or DateTime (exact-instant matching is not a usable control), even though the API accepts both.
- 2026-07-28: The "temporarily disable custom-field filtering" switch is a **commented-out
  `CUSTOM_FIELD_FILTERS_ENABLED = false`** with a `TODO(YOM-1260)` at the top of
  `CustomFieldFilters.tsx`, not a live feature flag. Filtering stays visible on both the public
  and admin surfaces so it can be exercised before the BA definitions land.
- 2026-07-28: Filter badges show the **value only** (resolved to option / lookup names), not the
  field name — except `Exists`, which has no value, so the field title is shown instead.
- 2026-08-11: Native selects/inputs in the filter are sized to the react-select control
  (`h-10 min-h-10`), not the reverse — react-select's 38px control min-height cannot be overridden
  from the `classNames` API, so the shorter `select-sm` / `input-sm` variants were dropped.

## Links

- PRs:
- Designs: YOM-1264 (Design Custom Fields — Opportunity CFs, completion CFs, User Presets)
- Related: YOM-1244 (epic) · YOM-1254 (API) · YOM-1255 · YOM-1260 · YOM-1261 · YOM-1262 ·
  YOM-1257 / YOM-1258 (presets API) · YOM-1259 (taxonomy)
