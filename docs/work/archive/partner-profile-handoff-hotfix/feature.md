# Feature: Partner Profile Handoff Hotfix — RECONSTRUCTED

## Meta

- **Owner:** Adrian (API), Jason (Web)
- **Areas:** api, web
- **Status:** shipped
- **Recorded:** 2026-10-14, reconstructed from the original handoff and merged code
- **Tracking:** original unticketed hotfix; no new Linear issue created

## Scope and Completion

Prevent incomplete profiles reaching partner flows that require names and country. Shared navigation
returns profile validation errors instead of bypassing them; the Web prompts for profile completion.
The API and Web hotfix merged as `54b275265` (#1935), followed by `1b998e86c` (#1936) for button state.

## Tasks

- [x] Add partner-specific API validation and derived, JSON-ignored `IsLinked`.
- [x] Add the coordinated Web completion gate and API-error navigation handling.
- [x] Merge the delivered hotfix and preserve the recorded test/contract evidence.
- [x] Reconstruct and archive at Adrian's request on 2026-10-14.

## Decisions

- 2026-09-14: Unlinked email-based Alison registration and every email-based IXO handoff require first name, surname and a valid country; linked Alison login retains its email contract. General onboarding remains the Web's responsibility.
- 2026-10-14: Use the [context pack](./CONTEXT-PACK.md) as the archive entry point. The original handoff's pending rollout/browser-test wording is historical; archival performs no live test or deployment.
