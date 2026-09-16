# Feature: UI — Dynamic Custom Fields for Opportunities and Completions

## Meta

- **Feature**: Dynamic custom fields — capture and display
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1255](https://linear.app/didx/issue/YOM-1255)
- **Owner**: Jason
- **Areas**: web
- **Status**: in-progress
- **Started**: 2026-07-21

> Retro-created on 2026-08-11 from the branch, the tickets and an out-of-repo context pack.
> The two handoffs dated before 2026-08-11 are **reconstructed**, not contemporaneous.

## Problem / Goal

Render, capture and display custom fields on every Opportunity and completion surface,
driven entirely by the definitions the API returns. Filtering is a separate ticket
([YOM-1260](../YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/feature.md)).

Surfaces:

- Opportunity **create / edit** (admin, org admin) — `/organisations/[id]/opportunities/[opportunityId]`
- Opportunity **details** — org-admin `…/info` and public `/opportunities/[opportunityId]`
- **Completion capture** (user) — `OpportunityCompletionEdit`, and its read view
- **List cards** — the user's opportunity lists and search-result cards

The shared API contract lives in the [epic README](../README.md#shared-api-contract); this doc
only covers what is specific to capture and display.

## Out of Scope

- Custom-field **filtering** — YOM-1260.
- Phase-2 admin CRUD for definitions/options, credential mapping UI, User Presets — see the epic.
- Any hardcoded definition key, title, option or opportunity type.

## Plan

### Components

| Component                                                                     | Role                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CustomFields.tsx`                                                            | The editable surface. One control per `DataType`; Option fields resolve to inline options (submitting option **keys**), Country/Language selects or an async Skill search (both submitting **GUIDs**); `supportsMultiple` picks single vs multi. Groups by Group → SubGroup unless `hideGrouping` |
| `CustomFieldsView.tsx`                                                        | Read-only `{Title}: {Value}` display. Resolves option keys and Country/Language/Skill GUIDs to names. Optional `fields` whitelist for compact card use                                                                                                                                            |
| `OpportunityCustomFieldsSection.tsx` / `MyOpportunityCustomFieldsSection.tsx` | Fetch the right definitions and render `CustomFieldsView` as an "Additional details" section                                                                                                                                                                                                      |
| `DetailSection.tsx`                                                           | Shared sidebar section chrome extracted while doing this work                                                                                                                                                                                                                                     |

### Validation

`getCustomFieldError(definition, entry)` / `getCustomFieldErrors(definitions, values)` are pure and
**exported**, so the component's inline errors and the caller's zod schema apply one rule set:
required, Int32 range for Integer, invariant + `decimal.MaxValue` for Decimal (compared as digit
strings — the value exceeds JS `Number` precision), and `validationRegex` for String.
`getCustomFieldNumberError` is exported separately for reuse by the filter UI.

### Form integration (create / edit)

Custom-field state is held **outside** the react-hook-form object and merged on submit, because
`zodResolver` strips unknown keys. The wizard binds it through `<Controller name="customFields">`
so it participates in step 2's zod `superRefine` (gating "Next" and the tab jump) and in the
unsaved-changes dialog. On submit the collection is reconciled against the **current type's**
definitions, empties dropped, and the **full** collection resubmitted (replacement semantics).

`CustomFields` updates local state on every keystroke and debounces the parent `onChange` (400ms)
with a blur flush; the seeding effect ignores echoes of its own emissions to avoid a feedback loop.

### Completion

Definitions come from `GET /myopportunity/{opportunityId}/custom/field/definition`; the submission
is `multipart/form-data` with `CustomFields` as one JSON-encoded form field
(`api/services/myOpportunities.ts`).

## Tasks

- [x] **T1 — Create / edit.** Definition-driven fields in step 2, zod + dirty integration,
      type-change refetch and reconciliation, replacement-semantics submit.
- [x] **T2 — Completion (user) + list cards.** MyOpportunity definitions hook, multipart submit,
      completion read view, custom-field metadata on `MyOpportunity/OpportunityListItem`.
- [x] **T3 — Details.** `OpportunityCustomFieldsSection` on the org-admin and public detail pages;
      sidebar sections refactored onto `DetailSection`.
- [ ] Re-verify every surface once the BA-approved definitions land (YOM-1264). No code change
      should be needed — that is the point of the definition-driven rule.
- [ ] Resolve the Skill label fallback if a batch skill get-by-ids ever appears (see Gotchas).

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-07-21: Definitions are fetched per selected opportunity **type name** and the query is keyed
  on it, so changing the type in the wizard refetches and re-renders the applicable fields.
- 2026-07-22: Contract corrections after reading the API branch: `lookupType` **exists**,
  `defaultValue` was **removed**, entity responses **do** hydrate `customFields`. The planning notes
  said the opposite on all three.
- 2026-07-22: Custom-field state sits outside the RHF form (zodResolver strips unknown keys) and
  validation is shared with the caller's zod through exported pure functions.
- 2026-07-22: Saves resubmit the full collection reconciled to the current type's definitions.
  Omitted keys are deleted server-side, so a partial diff would silently destroy data.
- 2026-07-22: `CustomFields` renamed from `OpportunityCustomFields` and made context-agnostic —
  it takes definitions and values, and knows nothing about Opportunity vs MyOpportunity.
- 2026-07-27: Completion reuses the same editor and validators; only the definitions source and
  the multipart submission differ.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1255](https://linear.app/didx/issue/YOM-1255)
- Depends on: [YOM-1254](https://linear.app/didx/issue/YOM-1254) (API) · [YOM-1264](https://linear.app/didx/issue/YOM-1264) (final definitions)
- Sibling: [YOM-1260](../YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/feature.md)
