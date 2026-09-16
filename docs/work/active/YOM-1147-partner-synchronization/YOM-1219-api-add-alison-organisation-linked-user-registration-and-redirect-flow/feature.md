# Feature: Alison user registration and redirect

## Meta

- **Feature**: Alison user registration and redirect
- **Epic**: [YOM-1147](../README.md)
- **Ticket**: [YOM-1219](https://linear.app/didx/issue/YOM-1219/api-add-alison-organisation-linked-user-registration-and-redirect-flow)
- **Owner**: Adrian
- **Areas**: api
- **Status**: shipped
- **Started**: 2026-05-19

## Problem / Goal

Create stable partner-user links and authenticated Alison navigation.

## Out of Scope

- Provider-specific behavior beyond this ticket's contract.

## Plan

This shipped as part of the YOM-1202 verification track. Shared lifecycle rules are documented in the [epic contract](../README.md).

## Tasks

- [x] A linked user can continue to Alison without repeatedly resolving by mutable profile fields.
- [x] Integrate the change with the shared PartnerSync verification flow.

## Decisions

- 2026-05-21: The permanent link is preferred over current contact-value fallbacks.

## Links

- Epic: [YOM-1147](../README.md)
- Parent track: [YOM-1202](../YOM-1202-partner-synchronization-verification/feature.md)
- Ticket: [YOM-1219](https://linear.app/didx/issue/YOM-1219/api-add-alison-organisation-linked-user-registration-and-redirect-flow)
