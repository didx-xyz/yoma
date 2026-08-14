# Feature: UI — Youth Opportunity Credential Display

## Meta

- **Feature**: Youth opportunity credential display
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1283](https://linear.app/didx/issue/YOM-1283/ui-youth-opportunity-credential-display)
- **Owner**: Jason
- **Areas**: web
- **Status**: planning — YOM-1280 wallet API contract ready; Web implementation pending
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

To be written by the implementation session after reading the web repo. The YOM-1280 wallet contract
is ready: the API normalizes structured and historical Skills, formats scalar/custom-field values,
and owns grouping and ordering. Web must render the returned contract and never parse provider JSON.
Core and custom fields are deliberately mixed in the same ordered `attributes` collection. Web must
not split or re-sort them: exact matching group/subgroup labels form one section, null subgroup values
render directly under their group, and null group values render ungrouped after configured groups.
Shared contract in the [epic README](../README.md#credential-schema-context).

## Tasks

- [x] Confirm the YOM-1280 wallet contract (`nameDisplay` / `valueDisplay` / Skills
      `itemsDisplay`) is live on `feature/custom-fields-framework`.
- [ ] Render all returned attributes schema-driven: scalar `nameDisplay` + `valueDisplay`
      verbatim, no type-specific formatting, option/lookup resolution or raw-value interpretation.
- [ ] Render attributes under the API-provided `group` and optional `subGroup`, preserving the
      response order across both core and custom fields.
- [ ] Render Skills from the structured `itemsDisplay` collection as individual items, not a delimited
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
- 2026-08-14: Supersedes the blocker above. The wallet contract is ready and includes structured
  `itemsDisplay`, API-formatted scalar values, and API-owned grouping/order metadata.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1283](https://linear.app/didx/issue/YOM-1283/ui-youth-opportunity-credential-display)
- Parent capability: [YOM-1277](../YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/feature.md)
- API contract: [YOM-1280](../YOM-1280-api-opportunity-credential-issuance-with-custom-fields/feature.md)
- Siblings: [YOM-1281](../YOM-1281-ui-admin-credential-schema-management-by-type/feature.md) ·
  [YOM-1282](../YOM-1282-ui-opportunity-credential-schema-selection/feature.md)
