# Feature: Phone validation and compatible API package updates

## Meta

- **Ticket**: None, explicitly requested by Adrian on 2026-11-26.
- **Owner**: Adrian (API), Jason (web and Keycloak follow-up)
- **Areas**: API; web and Keycloak updates delegated to Jason
- **Status**: review
- **Started**: 2026-11-26

## Problem / Goal

Refresh phone-number metadata and compatible API packages on the production hotfix branch. Keep the API on .NET 10 and preserve existing application behaviour. Exact rejected Uganda numbers are still needed to confirm that the metadata update resolves the reported rejection.

## Tasks

- [x] Preserve Adrian's compatible package updates and restore CsvHelper 33.1.0.
- [x] Update Microsoft.NET.Test.Sdk to 18.12.0.
- [x] Build with the .NET 10 SDK and run available regression tests.
- [ ] Jason: update and validate web and Keycloak phone-number packages on the shared branch.
- [ ] Retest the actual rejected numbers once supplied, then review and deploy the hotfix.

## Decisions

- 2026-11-26: Keep all target frameworks at net10.0. Leave Microsoft Extensions, Npgsql EF provider and Serilog.AspNetCore major-11 upgrades out of this hotfix.
- 2026-11-26: Keep Swashbuckle packages at 10.3.1. Version 11 introduces breaking OpenAPI.NET changes; a separate migration is required, even though its major version alone does not imply a .NET 11 requirement.
- 2026-11-26: Revert CsvHelper 34.1.0 to the production version 33.1.0 at Adrian's request; do not rewrite CSV handling for this update.
- 2026-11-26: Retain Adrian's MediatR 15.0.0 and Sentry.AspNetCore 7.0.1 upgrades: both provide net10.0 assets. Build and available tests pass; external provider smoke tests remain necessary.
- 2026-11-26: No changes to authentication or OTP delivery policy. Current Keycloak SMS delivery is restricted to +27 numbers; refreshing metadata does not enable Uganda SMS.

## Links

- [Shared branch](https://github.com/didx-xyz/yoma/tree/hotfix/phone-validation-packages)
- [Swashbuckle v11 release notes](https://github.com/domaindrivendev/Swashbuckle.AspNetCore/releases/tag/v11.0.0)
- [Validation and handoff](handoffs/2026-11-26-a.md)
