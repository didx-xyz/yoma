# Feature: Youth Yellow Card Payout

## Meta

- **Feature**: Youth reward payout
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1052](https://linear.app/didx/issue/YOM-1052/youth-yellow-card-cash-out)
- **Owner**: Adrian and Jason
- **Areas**: both
- **Status**: in-progress
- **Started**: 2026-07-28

## Problem / Goal

Allow a youth to convert ZLTO rewards to a Treasury-funded USD payout through a hosted Yellow Card
journey while Yoma owns reservation, financial capacity, orchestration and reconciliation.

## Out of Scope

- Manual admin payouts in the initial release.
- Direct Yellow Card API usage by the Web application.
- Multi-asset or multi-currency payout selection.

## Plan

Yoma validates Treasury capacity, creates a local payout, reserves ZLTO, initiates a short-lived
hosted session, and finalizes or releases ZLTO from provider outcomes. The known shared lifecycle
is in the [epic README](../README.md); provider-specific calls remain blocked.

## Tasks

- [x] Scaffold provider-neutral Payout and Rewards integration.
- [x] Implement ZLTO reservation/commit/release infrastructure.
- [x] Scaffold Yellow Card hosted-session and status clients.
- [x] Scaffold secured webhook boundary and reconciliation fallback.
- [x] Expose profile ledger and resumable-session API contracts.
- [ ] Implement Yellow Card requests, responses, authentication and status mapping.
- [ ] Complete and validate the full lifecycle after the technical specification arrives.
- [ ] Complete the youth Web journey.

## Decisions

- 2026-08-04: API/domain terminology is Payout; Cash Out remains a user-facing rewards action.
- 2026-08-05: Only one active payout per user is allowed.
- 2026-08-05: Hosted URLs are short-lived and are refreshed on demand, not treated as durable profile state.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1052](https://linear.app/didx/issue/YOM-1052/youth-yellow-card-cash-out)
- Web: [YOM-1074](../YOM-1074-ui-youth-yellow-card-cash-out/feature.md)
