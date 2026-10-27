# Feature: Provision didx:me environments for Yoma

## Meta

- **Feature**: Standalone Local environment and reusable SRE provisioning contract
- **Epic**: [YOM-1306](../README.md)
- **Ticket**: [YOM-1307](https://linear.app/didx/issue/YOM-1307/provision-didxme-environments-for-yoma)
- **Owner**: Adrian; SRE owns environment provisioning and deployed settings
- **Areas**: api
- **Status**: review — Local setup complete
- **Started**: 2026-10-27

## Problem / Goal

Run mono independently through Tilt with the Yoma tenant and issuer/federated clients needed by later integration. Record once-off SRE provisioning separately from ongoing deployment settings and secrets.

## Out of Scope

Adapter, DI switch, Web journey and deployed Dev work. No mono source changes or Yoma commits/pushes without Adrian's review.

## Plan

Use the separate Linux tools container/Kind cluster and existing Yoma configuration pattern. External helpers and ignored files hold setup adaptations and secrets. Use hub management for tenant/service registration. Shared contracts live in the [epic](../README.md).

## Tasks

- [x] Branch from clean Yoma master; prepare independent Linux tooling with approval.
- [x] Authenticate GHCR charts and ECR via documented 1Password credentials.
- [x] Build/start me/hub APIs, Keycloak and local Paradym.
- [x] Provision Yoma tenant, issuer service/project and issuer client; validate token claims.
- [x] Provision federated Lite client/IdP; protocol smoke recorded under YOM-1308.
- [x] Add tracked setting placeholders and populated ignored Local settings; keep current provider.
- [x] Separate SRE once-off provisioning from Helm settings/secret references in the runbook.
- [x] Complete restart/health/persistence and source/secret acceptance checks.
- [x] Adrian authorized moving the setup work onto Jason's branch and committing/pushing it.

## Decisions

- 2026-10-27: Adrian approved required tools in a dedicated Linux container. No Windows mise or shell-profile changes.
- 2026-10-27: Preserve existing Yoma ports/services; mono gets separate registry, published ports and kubeconfig.
- 2026-10-27: Mono source stays unchanged. Restore earlier tracked local adjustments; use external helpers/generated ignored configuration.
- 2026-10-27: Follow existing appsettings/ignored Local conventions; prepare settings without activating a provider.
- 2026-10-27: YOM-1306 is canonical; Adrian deleted redundant YOM-1305.
- 2026-10-27: Complete setup/handover and stop. Dev and adapter work await later instruction.
- 2026-10-27: Adrian authorized consolidation onto Jason's feature branch and commit/push. Rename the configuration section to DidxMe; preserve ignored Local secrets. Mono is stopped with volumes preserved.

## Links

- [Configuration and SRE runbook](../environment.md)
- [Current consolidated handoff](../handoffs/2026-10-27-c.md)
- [Superseded early checkpoint](./handoffs/2026-10-27-a.md)
