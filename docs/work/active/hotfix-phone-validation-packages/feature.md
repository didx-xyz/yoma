# Feature: Phone validation and compatible API package updates

## Meta

- **Ticket**: None, explicitly requested by Adrian on 2026-11-26.
- **Owner**: Adrian (API), Jason (web and Keycloak follow-up)
- **Areas**: API; web and Keycloak hotfix by Jason, master integration by Adrian
- **Status**: review — production released; master port awaiting review
- **Started**: 2026-11-26

## Problem / Goal

Refresh phone-number metadata and compatible API packages. The production hotfix shipped in v3.13.15; bring it into master while preserving master's newer CSV handling and Keycloak OTP protections. Keep the API on .NET 10 and preserve existing application behaviour.

Root cause of the Uganda rejections (verified by running both jars): Keycloak's `libphonenumber 8.13.7` carries a UG mobile pattern (`7(?:[01578]\d|20|36|[46][0-4]|9[89])…`) that rejects `0745`–`0749` and `0790`–`0797`. The Keycloak UI (`iti.isValidNumber()` is length-only) and the web (`libphonenumber-js` min metadata) accept them, so users only fail server-side in `Utils.canonicalizePhoneNumber` → `isValidNumber`. `9.0.44` accepts all of `074x`/`079x` except `0796`/`0797` (unassigned per ITU).

## Tasks

- [x] Preserve Adrian's compatible package updates and restore CsvHelper 33.1.0.
- [x] Update Microsoft.NET.Test.Sdk to 18.12.0.
- [x] Build with the .NET 10 SDK and run available regression tests.
- [x] Jason: update web `libphonenumber-js` 1.13.2 → 1.13.17 (metadata 9.0.4x).
- [x] Jason: update Keycloak `libphonenumber` 8.13.7 → 9.0.44; rebuild and commit `providers/jars/keycloak-phone-provider*.jar`.
- [x] Jason: vendor intl-tel-input 29.5.12 into the phone theme (bundled utils build, CSS, flag sprites); migrate directive options; cache-bust assets.
- [x] Jason: browser-test registration, login, reset password and update phone against the local Keycloak.
- [x] Release the hotfix to production as v3.13.15 (PR #2045); Adrian confirmed profile phone update and OTP receipt.
- [x] Port the deployed changes to a branch from master; rebuild the two phone JARs against master's Keycloak 26.8.1 and existing OTP protections.
- [x] Update compatible API packages on master, retaining the CsvHelper 34 migration and updating to 34.1.0.
- [x] Validate the master port with API build, formatting, regression tests, web unit tests and JAR resource checks.
- [ ] Adrian: review in VS, commit, push and open the master PR, then deploy to Stage.
- [ ] Retest the actual rejected numbers once supplied.

## Decisions

- 2026-11-26: Keep all target frameworks at net10.0. Leave Microsoft Extensions, Npgsql EF provider and Serilog.AspNetCore major-11 upgrades out of this hotfix.
- 2026-11-26: Keep Swashbuckle packages at 10.3.1. Version 11 introduces breaking OpenAPI.NET changes; a separate migration is required, even though its major version alone does not imply a .NET 11 requirement.
- 2026-11-26: Revert CsvHelper 34.1.0 to the production version 33.1.0 at Adrian's request; do not rewrite CSV handling for this update.
- 2026-11-26: Retain Adrian's MediatR 15.0.0 and Sentry.AspNetCore 7.0.1 upgrades: both provide net10.0 assets. Build and available tests pass; external provider smoke tests remain necessary.
- 2026-11-26: No changes to authentication or OTP delivery policy. Current Keycloak SMS delivery is restricted to +27 numbers; refreshing metadata does not enable Uganda SMS.
- 2026-11-26: Keycloak theme ships `intlTelInputWithUtils.min.js` (utils bundled) instead of `intlTelInput.min.js` + utils from the jsDelivr CDN. v27 moved `build/` → `dist/` so the pinned CDN URL would 404, and v27 makes `getNumber()`/`isValidNumber()` throw until utils are loaded; bundling removes both the external dependency and the race. Same total payload (~314 KB).
- 2026-11-26: Directive pins the v25 behaviour explicitly (`numberDisplayFormat: "NATIONAL"`, `separateDialCode: false`, `strictMode: false`, `countrySelectorMode: "DROPDOWN"`, `allowedNumberTypes: ["MOBILE"]`) because v26–v29 flipped those defaults. Adopting the new defaults (separate dial code, strict typing) is a UX change for a separate ticket. `geoIpLookup` → promise-based `initialCountryLookup`, falling back to `za` on failure as before.
- 2026-11-26: Keycloak serves theme resources under a path keyed to the Keycloak build with a 30-day cache, so `intlTelInput.css` and `flags*.webp` keep their filenames but get `?v=29.5.12`; `styles.css` bumped to `?v=20261126`. `globe*.webp` removed (v26 bakes an SVG into the JS).
- 2026-11-26: Only the two rebuilt jars that changed (`keycloak-phone-provider.jar`, `keycloak-phone-provider.resources.jar`) are committed; the other three rebuild byte-differently but have no source change.
- 2026-11-26: intl-tel-input ≥ 27.0.1 calls `Object.hasOwn` (ES2022) inside `intlTelInput(el, …)`; Adrian reproduced the init failure where it is missing. `intlTelInputDirective.js` now defines a fallback before the directive registers, and the four templates load it as `intlTelInputDirective.js?v=29.5.12` so cached v25 init code is never paired with the v29 library (included in PR #2045).
- 2026-11-26: The CsvHelper 33 pin above applies to production only. Master already migrated to CsvHelper 34, including its source-generated mapping APIs. Preserve that implementation and update to 34.1.0; all 34 CSV import/export regression cases pass.
- 2026-11-26: Master integration updates Microsoft 10.0.14 packages to 10.0.15 and Npgsql EF packages from 10.0.3 to 10.0.4. No .NET 11 migration. Retain Swashbuckle 10.3.1 because v11 requires a separate breaking OpenAPI migration.
- 2026-11-26: Rebuild phone JARs from the combined master source rather than copying production binaries. Preserve atomic OTP consumption and brute-force checks, Keycloak 26.8.1, and master's removal of the obsolete API test-host fixture. Leave the port uncommitted for Adrian's review.

## Links

- [Shared branch](https://github.com/didx-xyz/yoma/tree/hotfix/phone-validation-packages)
- [Production hotfix PR #2045](https://github.com/didx-xyz/yoma/pull/2045)
- [Master integration handoff](handoffs/2026-11-26-c.md)
- [Swashbuckle v11 release notes](https://github.com/domaindrivendev/Swashbuckle.AspNetCore/releases/tag/v11.0.0)
- [API validation and handoff](handoffs/2026-11-26-a.md)
- [Web and Keycloak validation and handoff](handoffs/2026-11-26-b.md)
- [intl-tel-input v26–v29 breaking changes](https://github.com/jackocnr/intl-tel-input/releases)
