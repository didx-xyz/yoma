# Feature: Profile name cleanup

## Meta

- **Ticket**: [YOM-1316](https://linear.app/didx/issue/YOM-1316)
- **Epic**: [Standalone hotfix](../README.md)
- **Owner**: Adrian
- **Areas**: api
- **Status**: review
- **Started**: 2026-11-12

## Problem / Goal

Production profile updates can fail with `error-person-name-invalid-character` from Keycloak. Clean incoming names before validation and before either system persists them; preserve legitimate international names.

## Plan

The existing `StringExtensions.RemoveSpecialCharacters` gains an overload accepting a caller-supplied character expression and optional whitespace normalization. Its original behavior is unchanged. `UserExtensions.UserTextProhibitedCharacters` defines the user-field policy. `UserProfileService.Create` and `Update` apply it before FluentValidation, retaining existing title casing and sharing the resulting model with the identity provider. `UserService.Upsert` applies it for imported/synchronized names while preserving optional names and the existing protection of linked profiles.

## Tasks

- [x] Align local `current` with `origin/current` and release tag `v3.13.11`, matching the supplied Production incident.
- [x] Trace all name-write paths and inspect Keycloak's deployed-version validation baseline.
- [x] Implement shared cleanup before validation and persistence.
- [x] Build, run regression tests and verify formatting (54 focused tests passed).
- [ ] Review, release Production hotfix, then carry the correction to master/Stage.

## Decisions

- 2026-11-12: Use the prohibited-character set from [Keycloak 26.4.0's person-name validator](https://github.com/keycloak/keycloak/blob/26.4.0/services/src/main/java/org/keycloak/userprofile/validator/PersonNameProhibitedCharactersValidator.java). Normalize whitespace to spaces and remove prohibited characters; keep accents, non-Latin letters, apostrophes and hyphens. Existing `RemoveSpecialCharacters` strips too much for person names.
- 2026-11-12: Normalize before validation. Required profile names that become empty fail ordinary validation before writes. Optional import/sign-in names remain optional. Preserve the existing profile title-casing policy and linked-user update rules.
- 2026-11-12: Cover all free-text profile names on Production: first name and surname. Display name is derived. Email/phone retain their purpose-specific validation; country, gender and education are controlled lookups. Do not apply name restrictions to arbitrary descriptions, URLs, identifiers or contact fields.
- 2026-11-12: Keep string cleanup generic and reusable. The caller owns the restrictions; the string extension has no Keycloak/person-name knowledge. Existing no-argument callers retain their prior behavior.

## Out of Scope

Bulk cleanup of stored profiles, Keycloak validation/configuration changes, UI changes and unrelated Stage-only features. The incident does not capture the exact rejected character; regression inputs are synthetic.
