# Epic: YOM-1244 — Yoma Customizable Fields / Metadata Framework

## Meta

- **Epic**: [YOM-1244](https://linear.app/didx/issue/YOM-1244)
- **Owners**: Adrian (api) · Jason (web)
- **Areas**: api, web
- **Status**: in-progress
- **Started**: 2026-07-21 (web)
- **Branch**: `feature/custom-fields-framework` — **load-bearing, not convention.** The
  custom-field API exists only here; there is nothing to build against on `master`.

> Retro-created on 2026-08-11. The web work began before the `docs/work` convention landed
> (`a9518de0`), so the child feature docs and the pre-2026-08-11 handoffs were reconstructed
> from the branch, the Linear tickets and an out-of-repo context pack. Handoffs marked
> **reconstructed** were not written at the time; treat their detail as best-effort.

## Why This Epic Exists

Job opportunities need structured fields — salary, work type, minimum qualification,
experience level — that do not belong on the core Opportunity model, and every future
opportunity type will want its own. Instead of growing the model per type, the API exposes
a typed **custom-field framework**: definitions are metadata, values live in an indexed
relational store, and both are queryable in PostgreSQL.

The web app's job is to render, capture, display and filter those fields **entirely from
metadata**, so the UI survives the swap from today's temporary seeded `[Sample] …`
definitions to the BA-approved set (YOM-1264) without a code change.

## Child Features

| Folder                                                                                                                                                       | Ticket                                             | Area | Status                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | ---- | ------------------------------------- |
| [`YOM-1255-ui-dynamic-custom-fields-for-opportunities-and-completions/`](./YOM-1255-ui-dynamic-custom-fields-for-opportunities-and-completions/feature.md)   | [YOM-1255](https://linear.app/didx/issue/YOM-1255) | web  | in-progress (T1–T3 done)              |
| [`YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/`](./YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/feature.md) | [YOM-1260](https://linear.app/didx/issue/YOM-1260) | web  | in-progress (opportunity search done) |

Tickets with no folder yet — add one when work starts:

| Ticket                                                                                                  | Area      | Note                                                                                                       |
| ------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| [YOM-1254](https://linear.app/didx/issue/YOM-1254)                                                      | api       | The framework itself. Authoritative reference for models, endpoints, validation, persistence and filtering |
| [YOM-1264](https://linear.app/didx/issue/YOM-1264)                                                      | design/BA | Final Opportunity CFs, completion CFs and User Presets. **Blocks YOM-1261**                                |
| [YOM-1261](https://linear.app/didx/issue/YOM-1261) / [YOM-1262](https://linear.app/didx/issue/YOM-1262) | web       | User Presets — manage, and apply to discovery. Blocked                                                     |
| [YOM-1257](https://linear.app/didx/issue/YOM-1257) / [YOM-1258](https://linear.app/didx/issue/YOM-1258) | api       | User Preset model + preset→filter mapping                                                                  |
| [YOM-1259](https://linear.app/didx/issue/YOM-1259)                                                      | api       | Opportunity category taxonomy. Unrelated to custom fields; needs only a UI regression check                |

## The One Rule

**Nothing may be keyed to a specific custom field.** No hardcoded definition key, title,
option value, group or opportunity type, anywhere. Phase-1 definitions are temporary scripted
metadata that the BA will replace wholesale; anything referencing a `[Sample] …` field breaks
on that swap. Every surface renders from the definitions the API returns.

## Shared API Contract

Verified against a running API on `feature/custom-fields-framework` — **the ticket
descriptions on YOM-1244 are stale and should not be trusted over this table.**

| Fact                 | Detail                                                                                                                                                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Definition discovery | `GET /opportunity/custom/field/definition?types={Type}` (anonymous, repeatable `types`), `GET /opportunity/{id}/custom/field/definition` (admin / org admin), `GET /myopportunity/{opportunityId}/custom/field/definition` (user)                                                  |
| `types` binding      | the **`Type` enum name** (`Other` / `Learning` / `Event` / `Job` / `Task`), **not** the type GUID. Passing a GUID silently returns only the generic definitions                                                                                                                    |
| Definition shape     | `key`, `title`, `description`, `group`, `subGroup`, `dataType`, `lookupType`, `validationRegex`, `isRequired`, `supportsMultiple`, `sortOrder`, `options[]`. `lookupType` **exists** (`Country` / `Language` / `Skill`; `null` → inline `options`); `defaultValue` was **removed** |
| Data types           | `String`, `Integer`, `Decimal`, `Boolean`, `DateTime`, `Option`                                                                                                                                                                                                                    |
| Ordering             | Group → SubGroup → SortOrder → Title; options by SortOrder → Name                                                                                                                                                                                                                  |
| Values (write)       | non-option → `value`; **every** Option field → `values`. Inline options submit the option **`key`**; lookup-backed options submit the lookup **GUID**                                                                                                                              |
| Values (read)        | `Opportunity` / `OpportunityInfo` / `MyOpportunity` hydrate `customFields`. Definitions are **not** repeated per entity — join on `key`                                                                                                                                            |
| Save semantics       | **replacement.** Resubmit the full collection on every save; omitted keys are deleted server-side. Never send a partial diff                                                                                                                                                       |
| Completion           | `multipart/form-data` with `CustomFields` as **one JSON-encoded form field**                                                                                                                                                                                                       |
| Filtering            | see [YOM-1260's feature doc](./YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/feature.md) for the clause shape and operator matrix                                                                                                                           |

### Shared web building blocks

Both child features build on the same components — extend these rather than adding parallel ones.

| Purpose        | File                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Models / enums | `api/models/opportunity.ts`, `api/models/myOpportunity.ts`                                                                                             |
| Services       | `api/services/opportunities.ts`, `api/services/myOpportunities.ts`                                                                                     |
| Hooks          | `hooks/useOpportunityMutations.tsx` — `useOpportunityCustomFieldDefinitionsQuery(types)`, `useMyOpportunityCustomFieldDefinitionsQuery(opportunityId)` |
| Editing        | `components/Opportunity/CustomFields.tsx` (+ `getCustomFieldError(s)`, `getCustomFieldNumberError`)                                                    |
| Read-only      | `components/Opportunity/CustomFieldsView.tsx`                                                                                                          |
| Filtering      | `components/Opportunity/CustomFieldFilters.tsx`                                                                                                        |

## Out of Scope (whole epic)

- **Phase-2 admin CRUD for definitions and options.** Definitions are scripted server-side in Phase 1.
- **Credential (SSI) mapping UI.** Tracked on the API side.
- **User-level custom fields.** The framework covers Opportunity and MyOpportunity only.
- **User Presets** are **User-domain data, not custom fields** — YOM-1261 / YOM-1262 must not be
  built through the custom-field components, and they are blocked on YOM-1264 + YOM-1257 / YOM-1258.
- **Opportunity taxonomy migration** (YOM-1259) — an Opportunity-domain lookup.

## Blockers

| Blocker                                                         | Severity | Note                                                              |
| --------------------------------------------------------------- | -------- | ----------------------------------------------------------------- |
| YOM-1264 (BA/design) — final field definitions and User Presets | High     | Everything shipped so far runs on seeded `[Sample] …` definitions |
| YOM-1257 / YOM-1258 (presets API)                               | High     | YOM-1261 / YOM-1262 cannot start                                  |
| YOM-1260 must land before the presets chain                     | Med      | Presets resolve to filter criteria                                |

## Cross-Area Notes

Web consumes the API contract above verbatim. Anything that changes definition discovery, the
value shape, replacement semantics or the filter clause shape is a **breaking change for web** —
flag it in a handoff here before merging.
