# Feature: PartnerSync Configuration and Jobs

## Meta

- **Feature**: PartnerSync Configuration and Jobs
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1155](https://linear.app/didx/issue/YOM-1155/api-update-partnersync-configuration-in-appsettings-and-scheduledjobs)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-04-20

## Problem / Goal

Move schedules and capability switches onto shared PartnerSync configuration.

## Out of Scope

- Provider-specific transport and mapping unless explicitly owned by this ticket.

## Plan

Updated AppSettings and recurring-job registration for the shared model. Shared lifecycle rules are documented in the [epic README](../README.md).

## Tasks

- [x] Implement the ticket scope in the shared PartnerSync capability.
- [x] Preserve existing production push behaviour.
- [x] Integrate with shared validation, persistence and logging where applicable.

## Decisions

- 2026-05-11: Schedules are operational configuration; provider capability remains database-controlled.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1155](https://linear.app/didx/issue/YOM-1155/api-update-partnersync-configuration-in-appsettings-and-scheduledjobs)
