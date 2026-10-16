# Context Pack: Partner Profile Handoff Hotfix — RECONSTRUCTED

## Provenance

- **Written:** 2026-10-14 by Adrian / Codex on `chore/cash-out-final-prep`.
- **Source now at:** `docs/work/archive/partner-profile-handoff-hotfix/`.
- **Rebuilt from:** the complete original September 14 handoff, current validation and IsLinked code, and merged API/Web diff `54b275265` (#1935). Button-state follow-up: `1b998e86c` (#1936).
- **Not verified today:** the originally affected user's browser journey or Production health. The original handoff records source review and 15 isolated API cases, not browser E2E.

This is a reconstruction, not a new runtime validation record.

## Where the Work Got To

The shared API/Web hotfix is merged and `shipped`. Initial account creation can legitimately precede
full onboarding, but partner registration/handoff cannot proceed without that partner's required
profile fields. No blanket account deletion, data repair or database migration was introduced.

## Decisions That Still Bind

- Alison unlinked email-based registration needs FirstName, Surname and a resolvable Country; already-linked login keeps its email-only contract.
- IXO email-based handoff needs those fields every time, including an existing partner link.
- Empty email retains the existing provider-owned mobile-only behaviour. Plain redirects and other partner contracts do not inherit these requirements.
- `SyncInfoUserPartner.IsLinked` is derived from the stored external ID and Newtonsoft.Json-ignored; it is not a fresh partner-account existence check.
- Validation exceptions propagate; unrelated provider failures retain the existing best-effort fallback.
- General Yoma onboarding, including gender/DOB, remains a Web requirement.

## API / Web Contract

`PUT /api/v3/myOpportunity/action/{opportunityId}/navigateExternalLink` returns the existing HTTP 400
array of `{ type: "ValidationException", message: "..." }` objects. Property names stay internal.
`SyncUserAuthenticationService` validates before resolving/calling the provider.

The Web checks completeness, loads the profile if needed and requests the shared completion modal.
An API error closes the blank tab, displays the error and stops navigation; it does not redirect
to the raw partner URL. The error catch does not itself reopen the modal; the user corrects and retries.
`Global.tsx` consumes its one-time latch only after checks run and reevaluates on leaving exempt routes.
`OpportunityPublicDetails.tsx` and the shared store atom own the corresponding navigation prompt.

## Evidence / Gotchas

The original API/test build and formatting passed; all 15 focused mocked cases passed. No live partner
requests or DB writes were made by those tests. No tests were rerun during archival.

Navigation-attempt tracking happens before partner authentication. A navigation action is therefore
not proof that handoff/registration succeeded. Do not add stricter backend requirements to every partner
or reinterpret incomplete Yoma accounts as invalid database rows.

## Open Questions

No remaining code item in this scoped hotfix. The original browser reproduction and detailed combined
Stage test evidence were not recoverable from these docs; do not invent that evidence from a merge.

## Deliberately Dropped

Shared-branch commit/PR/staging instructions are completed historical preparation. The original
handoff is retained unchanged apart from its archive note.
