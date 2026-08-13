# Feature: API Opportunity Credential Issuance with Custom Fields

## Meta

- **Feature**: Opportunity credential issuance with custom fields
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1280](https://linear.app/didx/issue/YOM-1280/api-opportunity-credential-issuance-with-custom-fields)
- **Owner**: Adrian
- **Areas**: api
- **Status**: in-progress - issuance and core wallet display verified; custom-field runtime pending
- **Started**: 2026-08-12

## Problem / Goal

Issue Opportunity credentials from the Opportunity's valid schema selection and current static and
custom-field values at processing time. Persist the schema metadata actually used by a successfully
issued credential, while preserving existing `Opportunity|Default` issuance when no type-specific
schemas are configured.

## Out of Scope

- Final generic/type-specific schema flavours and mappings, blocked on YOM-1264.
- Provider and CSV-import schema assignment, tracked in YOM-1277.
- Web credential rendering, tracked in YOM-1283.
- Cross-taxonomy skill identifiers.

## Plan

Scheduling commits the selected schema full name together with its immutable schema type and artifact
type. Processing must use that scheduled schema even if the Opportunity is later changed or credential
issuance is disabled, while resolving and persisting the latest version only when issuance succeeds.
Map static properties through the existing schema-property metadata and dynamic fields through stable
custom-field keys. Convert controlled options and lookup identifiers to human-readable values. Store
complex values as structured JSON inside the provider's existing string attribute contract. Wallet
retrieval uses the immutable schema ID and exact version recorded by the provider credential, formats
scalar values, and returns API-native structured items. Existing comma-delimited Skills credentials
are normalized by the API; Web never parses provider JSON.

Shared schema naming, protection and compatibility rules live in the [epic README](../README.md).

## Tasks

- [x] Commit the selected schema full name, schema type and artifact type when issuance is scheduled.
- [x] Resolve the latest version of the scheduled schema during processing.
- [x] Allow an already scheduled issuance to continue after later Opportunity configuration changes.
- [x] Persist the resolved schema version after successful issuance.
- [x] Keep schema version null while pending and align existing non-issued rows through migration.
- [x] Enforce one issuance per schema type and target entity independently of the eventual schema name.
- [x] Preserve the existing retry flow; each retry resolves the current latest applicable schema.
- [x] Preserve existing YoID and generic `Opportunity|Default` issuance behavior.
- [x] Map schema-selected static properties.
- [x] Map Opportunity and MyOpportunity custom fields without CLR reflection.
- [x] Convert controlled options and supported lookup identifiers to human-readable values.
- [x] Issue Skills as structured name items instead of a comma-delimited value.
- [x] Exercise first-attempt generic `Opportunity|Default` issuance across local, Alison,
  Jobberman and IXO data and verify the signed JWS, issuance metadata and wallet API response.
- [x] Normalize structured and legacy Skills in the Youth wallet API contract.
- [x] Return dynamic custom-field labels and formatted values from the exact issued schema version.
- [x] Format scalar dates, booleans and numbers in the API while preserving signed display values for options and lookups.
- [x] Establish structured issuance and display for multi-select custom fields before CF credentials enter use.
- [x] Exercise structured Skills, scalar formatting and YoID ACR optional-value handling against a running API.
- [ ] Exercise legacy comma-delimited Skills and custom-field display against a running API.
- [ ] Exercise retry, type-specific and required-value failure scenarios against a running API.

## Decisions

- 2026-08-12: Full schema name plus version remains the authoritative identity; no additional provider schema ID is persisted.
- 2026-08-12: Scheduling metadata and required database columns remain backward compatible; successful processing replaces the snapshot with the metadata actually used.
- 2026-08-12: Retries retain the proven processing flow and resolve the current latest applicable schema until issuance succeeds.
- 2026-08-12: Dynamic custom fields resolve by stable definition key and never through CLR reflection.
- 2026-08-12: Provider string attributes carry structured Skills as JSON; the API, not Web, owns parsing and legacy normalization.
- 2026-08-13: Supersedes the scheduling-metadata decision above: schema full name, type and artifact type form the scheduling commitment; only the resolved version remains nullable until successful issuance.
- 2026-08-13: Later Opportunity edits, type changes, schema reselection or disabling credential issuance do not cancel or redirect an already scheduled credential.
- 2026-08-13: Duplicate prevention is keyed by schema type and target entity, not schema name; changing the selected schema before processing must not create another issuance.
- 2026-08-13: The internal issued timestamp is serialized using the invariant round-trip format so
  wallet ordering and display do not depend on the API host culture. Existing production values use
  an invariant-compatible US format and require no compatibility fallback.
- 2026-08-13: Structured Skills issuance is complete, but wallet normalization is not. Raw JSON in
  `valueDisplay` is the accepted interim API response until the credential display work proceeds.
- 2026-08-13: Supersedes the interim display decision above: wallet detail now returns a readable
  `valueDisplay` plus `itemsDisplay` for complex attributes. Existing comma-delimited Skills and new JSON
  Skills normalize to the same response. `itemsDisplay` is authoritative; `valueDisplay` is display-only
  because an individual option label may contain commas. Web must not parse either flattened or provider values.
- 2026-08-13: Wallet retrieval uses the provider credential's immutable schema ID and exact version.
  A missing required attribute is a data inconsistency and fails. Missing optional attributes are
  omitted, preserving historical credentials that did not contain them.
- 2026-08-13: Custom-field credentials have no historical compatibility burden. Multi-select custom
  fields use structured signed items from inception; scalar option and lookup values are signed and
  returned using their human-readable display values.
- 2026-08-13: New JWS credentials do not sign optional attributes with no value. Existing credentials
  containing the historical `n/a` value continue to return it. The shared YoID ACR path retains `n/a`
  because AnonCreds requires a value for every attribute declared by its credential definition.
- 2026-08-13: New static scalar values, including dates, are signed using invariant representations.
  Wallet display parses invariant values first and retains a current-culture fallback for historical
  credentials serialized by the issuing API host culture.

## Links

- Epic: [YOM-1244](../README.md)
- Parent capability: [YOM-1277](../YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/feature.md)
- Ticket: [YOM-1280](https://linear.app/didx/issue/YOM-1280/api-opportunity-credential-issuance-with-custom-fields)
