# Feature: Provider-Managed Opportunity Rules

## Meta

- **Feature**: Provider-Managed Opportunity Rules
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1171](https://linear.app/didx/issue/YOM-1171/api-enforce-provider-managed-opportunity-rules-for-pull-synchronization)
- **Owner**: Adrian
- **Areas**: api
- **Status**: review — original scope shipped; expired-provider-extension hotfix awaiting Adrian review
- **Started**: 2026-04-20

## Problem / Goal

Prevent Yoma admin actions from overriding provider-managed pull Opportunities.

## Out of Scope

- Provider-specific transport and mapping unless explicitly owned by this ticket.

## Plan

Enforced domain update/status/delete restrictions for pull-synced records. Shared lifecycle rules are documented in the [epic README](../README.md).

## Tasks

- [x] Implement the ticket scope in the shared PartnerSync capability.
- [x] Preserve existing production push behaviour.
- [x] Integrate with shared validation, persistence and logging where applicable.
- [x] Allow a pull provider to reopen an expired opportunity with a future or removed end date in the normal update's single opportunity write.
- [x] Cover lifecycle, rollback, archive protection and sync orchestration with domain tests.
- [ ] Adrian review, hotfix release from current, then forward-port to master and validate on Stage.

## Decisions

- 2026-05-11: The external provider is authoritative until it removes the Opportunity terminally.
- 2026-11-03: Reopening is a narrow exception within the existing Update method, based on pull options, existing pull ownership, Expired state and the normalized incoming end date. Preserve normal validators and terminal Archived state. Set Active in the same opportunity write; no intermediate states, new service method or event plumbing. Recheck status/ownership under a row lock within the transaction. The processing-log success shares the existing per-item transaction; reuse central tracking cleanup on failure.
- 2026-11-03: No migration or automatic reset of permanent processing errors. Check retry eligibility at release; obtain separate approval if a targeted retry reset is required.

## Links

- Epic: [YOM-1147](../README.md)
- Ticket: [YOM-1171](https://linear.app/didx/issue/YOM-1171/api-enforce-provider-managed-opportunity-rules-for-pull-synchronization)
- Hotfix handoff: [2026-11-03](handoffs/2026-11-03-a.md)
