# Feature: Partner Synchronization — JobJack Opportunity Sync

## Meta

- **Feature**: JobJack Phase 1
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1270](https://linear.app/didx/issue/YOM-1270/partner-synchronization-jobjack-opportunity-sync)
- **Owner**: Adrian
- **Areas**: api
- **Status**: in-progress
- **Started**: 2026-08-03

## Problem / Goal

Deliver JobJack jobs to Yoma from the existing XML feed as Phase 1, retaining partner tracking
links while deeper user/verification integration remains deferred.

## Out of Scope

- JobJack pre-authentication, verification sync and credential exchange.

## Plan

YOM-1271 owns the integration and YOM-1272 owns feed mappings/business confirmation. Shared pull
lifecycle rules are in the [epic README](../README.md).

## Tasks

- [x] Implement XML opportunity synchronization.
- [x] Complete content, salary, requirement, keyword and category mappings.
- [x] Configure Local/Dev/Stage/Production organization identity.
- [ ] Complete Stage/Production validation and business sign-off.

## Decisions

- 2026-08-03: Ship Opportunity sync first; deeper integration is a later phase.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1270](https://linear.app/didx/issue/YOM-1270/partner-synchronization-jobjack-opportunity-sync)
- API: [YOM-1271](../YOM-1271-api-jobjack-opportunity-pull-sync/feature.md)
- Mappings: [YOM-1272](../YOM-1272-feed-mappings-and-business-rules/feature.md)
