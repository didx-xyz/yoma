# Feature: UI — Youth Opportunity Credential Display

## Meta

- **Feature**: Youth opportunity credential display
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1283](https://linear.app/didx/issue/YOM-1283/ui-youth-opportunity-credential-display)
- **Owner**: Jason
- **Areas**: web
- **Status**: blocked — YOM-1280 wallet API contract incomplete (Skills normalization and
  custom-field display values pending)
- **Started**: 2026-08-13

## Problem / Goal

Display issued Opportunity credentials — static, generic and type-specific custom-field
attributes plus structured Skills — through the existing youth wallet experience, rendering only
what the youth credential API returns. Scalar attributes render API-provided `nameDisplay` and
`valueDisplay` with no UI-side interpretation or formatting; the Skills attribute renders a
structured `items` collection (one item per Skill) in place of scalar `valueDisplay`.

## Out of Scope

- Parsing provider JSON or legacy comma-delimited Skills — the API owns normalization.
- Merging fields from the Opportunity's current schema selection, the latest schema version,
  another Opportunity type or Admin schema-management endpoints; the response reflects the exact
  issued schema/version.
- Youth access to Admin schema-management endpoints.
- Any hardcoded credential fields per Opportunity type.

## Plan

To be written by the implementation session after reading the web repo, once the blocking API
contract lands. Per [YOM-1280](../YOM-1280-api-opportunity-credential-issuance-with-custom-fields/feature.md)
(status 2026-08-13), issuance mechanics are complete but two wallet-contract tasks are open:
normalizing structured/legacy Skills in the youth wallet API (interim response returns raw JSON
in `valueDisplay`) and returning dynamic custom-field labels and formatted values from the exact
issued schema version. Do not build against the interim raw-JSON response — the ticket explicitly
forbids UI parsing. Shared contract in the [epic README](../README.md#credential-schema-context).

## Tasks

- [ ] Confirm the YOM-1280 wallet contract (`nameDisplay` / `valueDisplay` / Skills `items`) is
      live on `feature/custom-fields-framework` before starting.
- [ ] Render all returned attributes schema-driven: scalar `nameDisplay` + `valueDisplay`
      verbatim, no type-specific formatting, option/lookup resolution or raw-value interpretation.
- [ ] Render Skills from the structured `items` collection as individual items, not a delimited
      string.
- [ ] Tolerate missing optional attributes without breaking credential details.
- [ ] Regression: existing generic `Opportunity|Default` and historical scalar credentials
      display through the same view.
- [ ] Verify against a running API with generic and type-specific issued credentials, including
      a historical credential.

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-08-13: Folder created ahead of implementation as a lean planning stub; the Plan section is
  owed by the first implementation session.
- 2026-08-13: Marked blocked rather than planning — YOM-1280's youth wallet normalization and
  custom-field display-value tasks are unticked, and its interim contract (raw JSON in
  `valueDisplay` for Skills) is explicitly not to be parsed by Web.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1283](https://linear.app/didx/issue/YOM-1283/ui-youth-opportunity-credential-display)
- Parent capability: [YOM-1277](../YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/feature.md)
- Blocked by: [YOM-1280](../YOM-1280-api-opportunity-credential-issuance-with-custom-fields/feature.md)
- Siblings: [YOM-1281](../YOM-1281-ui-admin-credential-schema-management-by-type/feature.md) ·
  [YOM-1282](../YOM-1282-ui-opportunity-credential-schema-selection/feature.md)
