# Feature: UI — Youth Opportunity Credential Display

## Meta

- **Feature**: Youth opportunity credential display
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1283](https://linear.app/didx/issue/YOM-1283/ui-youth-opportunity-credential-display)
- **Owner**: Jason
- **Areas**: web
- **Status**: review — tested against live API
- **Started**: 2026-08-13

## Problem / Goal

Display issued Opportunity credentials — static, generic and type-specific custom-field
attributes plus structured Skills — through the existing youth wallet experience, rendering only
what the youth credential API returns. Scalar attributes render API-provided `nameDisplay` and
`valueDisplay` with no UI-side interpretation or formatting; the Skills attribute renders a
structured `itemsDisplay` collection (one item per Skill) alongside scalar `valueDisplay`.
Detail attributes also carry API-controlled `group`, optional `subGroup` and `sortOrder`
presentation metadata and are already returned in display order.

## Out of Scope

- Parsing provider JSON or legacy comma-delimited Skills — the API owns normalization.
- Merging fields from the Opportunity's current schema selection, the latest schema version,
  another Opportunity type or Admin schema-management endpoints; the response reflects the exact
  issued schema/version.
- Youth access to Admin schema-management endpoints.
- Any hardcoded credential fields per Opportunity type.

## Plan

The whole feature is the credential detail modal on the youth passport page, fed by one call:
`POST /ssi/wallet/user/{id}` (`SSIWalletService.ParseCredential`). The API owns everything shown —
labels, formatted values, structured item lists, group headings and the order of the collection —
so web's entire job is to render it faithfully and add nothing.

Three facts govern the implementation, all verified against the running API's schema rather than the
ticket:

1. **Attributes are detail-only.** `ParseCredential` returns before populating them for
   `SSICredentialInfo`, so wallet _search_ items carry no `attributes` property at all. The list
   renders the fixed header (issuer, title, date issued) and nothing else.
2. **`itemsDisplay` is authoritative for complex attributes**, and is a `[{ name }]` collection.
   `valueDisplay` flattens it for convenience but must never be split — an individual value may
   contain the delimiter. It is still the fallback: a complex attribute issued with no value comes
   back as an _empty_ item list plus the API's own `"n/a"`.
3. **The collection arrives ordered and group-contiguous**
   (`SSIAttributePresentationHelper.OrderCredentialAttributes`), with core properties and custom
   fields deliberately interleaved.

Files:

| Purpose                                                    | File                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| Grouped, item-aware attribute rendering                    | `src/web/src/components/Credentials/CredentialAttributes.tsx` |
| Wallet detail modal — header stays, attributes delegated   | `src/web/src/pages/yoid/passport/[[...query]].tsx`            |
| `itemsDisplay`, detail-vs-list attribute split             | `src/web/src/api/models/credential.ts`                        |
| `groupLabelOf` — shared credential heading rule (YOM-1282) | `src/web/src/lib/credentials/attributePresentation.ts`        |

Sections are built as **consecutive runs** of the same group/subGroup label — not a group-by and not
a re-sort. Exact matching group/subgroup labels form one section, a null subgroup renders directly
under its group, and null-group attributes render ungrouped (no heading) after the configured groups,
which is where the API already places them. Shared contract in the
[epic README](../README.md#credential-schema-context).

## Tasks

- [x] Confirm the YOM-1280 wallet contract (`nameDisplay` / `valueDisplay` / Skills
      `itemsDisplay`) is live on `feature/custom-fields-framework`.
- [x] Render all returned attributes schema-driven: scalar `nameDisplay` + `valueDisplay`
      verbatim, no type-specific formatting, option/lookup resolution or raw-value interpretation.
- [x] Render attributes under the API-provided `group` and optional `subGroup`, preserving the
      response order across both core and custom fields.
- [x] Render Skills from the structured `itemsDisplay` collection as individual items, not a delimited
      string.
- [x] Tolerate missing optional attributes without breaking credential details.
- [x] Regression: existing generic `Opportunity|Default` and historical scalar credentials
      display through the same view.
- [x] Verify against a running API with generic and type-specific issued credentials, including
      a historical credential.

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-08-13: Folder created ahead of implementation as a lean planning stub; the Plan section is
  owed by the first implementation session.
- 2026-08-13: Marked blocked rather than planning — YOM-1280's youth wallet normalization and
  custom-field display-value tasks are unticked, and its interim contract (raw JSON in
  `valueDisplay` for Skills) is explicitly not to be parsed by Web.
- 2026-08-14: Supersedes the blocker above. The wallet contract is ready and includes structured
  `itemsDisplay`, API-formatted scalar values, and API-owned grouping/order metadata.
- 2026-08-18: **Sections are consecutive runs of the group label, and the response order is not
  re-derived client-side.** The epic README asked YOM-1283 to order wallet attributes through
  `attributePresentation`; reading the contract showed that ordering them at all is the wrong move.
  The API returns one already-ordered, group-contiguous collection, so a second client-side ordering
  is a second source of truth that can silently disagree — JS `localeCompare` and .NET's `OrderBy`
  do not agree on every string pair, and the API's rule also depends on configured-group precedence
  the client cannot see. `groupLabelOf` _is_ taken from the shared module, so the heading rule stays
  single-sourced; `byPresentationOrder` deliberately is not used. If a response ever arrives
  non-contiguous, runs render it as sent rather than quietly rearranging it. The epic README was
  corrected to match.
- 2026-08-18: **`itemsDisplay` renders as badges, with `valueDisplay` as the fallback for an empty
  item list.** Emptiness is load-bearing and easy to miss: a complex attribute issued with no value
  returns `itemsDisplay: []` _plus_ `valueDisplay: "n/a"`, so testing for the property's presence
  rather than its length would render an attribute with no value at all. Scalars have no item list.
  Badge styling matches the existing skills treatment on the opportunity pages.
- 2026-08-18: **The web model now separates wallet detail from wallet list.** `attributes` moved off
  `SSICredentialBase` onto `SSICredential`; `SSICredentialInfo` no longer declares it, matching the
  running API's schema, which omits the property from list items entirely. The passport page's
  `activeCredential` state was typed as the _list_ type while holding the _detail_ response — it
  happened to work only because the base declared the attributes both shared. Pre-existing.
- 2026-08-18: **Fixed, adjacent to scope:** the detail header rendered `artifactType` raw, so an
  AnonCreds credential showed youth the bare enum name `ACR`. It now goes through
  `ARTIFACT_TYPE_LABELS`, which YOM-1281 added for exactly this. The header is otherwise untouched —
  fixed headers stay outside attribute grouping by contract.
- 2026-08-18: **The detail modal's fixed scroll box was removed** (Jason), along with the list card's
  `max-h`/`max-w` clamps on issuer and title. Grouped sections make the credential detail taller than
  the flat attribute list it replaced, and an inner `md:max-h-[480px]` scroll area was the wrong
  container for it — `CustomModal` already bounds the dialog at `md:max-h-[650px]`. Worth recording
  because a fixed height looks like an intentional constraint and is easy to reinstate.
- 2026-08-18: **No mock for this surface.** Wallet reads reach the credential provider, but per Jason
  the provider serves reads fine and only schema create/update is failing, so the whole feature is
  live-testable. Nothing was added to the `credentialSchemaAdmin` façade, which still governs schema
  traffic only.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1283](https://linear.app/didx/issue/YOM-1283/ui-youth-opportunity-credential-display)
- Parent capability: [YOM-1277](../YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/feature.md)
- API contract: [YOM-1280](../YOM-1280-api-opportunity-credential-issuance-with-custom-fields/feature.md)
- Siblings: [YOM-1281](../YOM-1281-ui-admin-credential-schema-management-by-type/feature.md) ·
  [YOM-1282](../YOM-1282-ui-opportunity-credential-schema-selection/feature.md)
- Handoffs: [2026-08-18-a](./handoffs/2026-08-18-a.md)
