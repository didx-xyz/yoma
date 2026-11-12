# Feature: Show didx:me credentials in the Yoma wallet

## Meta

- **Feature**: Participant wallet — credential status tags
- **Epic**: [YOM-1306](../README.md)
- **Ticket**: [YOM-1310](https://linear.app/didx/issue/YOM-1310)
- **Owner**: Jason
- **Areas**: web
- **Status**: in-progress
- **Started**: 2026-11-12

## Problem / Goal

Since PR #2028 every wallet list item and detail carries a provider-resolved lifecycle `status`
(`Unknown | Issued | Revoked | Expired`) and a derived `verificationStatus`
(`Unknown | Verified | Invalid`). The passport card hardcoded a green "Verified" pill, and the
detail dialog showed no verdict at all. A YoID profile change now revokes the old YoID and issues a
replacement, and the old copy stays in the wallet until cleanup succeeds — so a youth can see a
revoked credential and must not be told it is verified. This ticket binds the UI to the API's
fields; the contract is in Adrian's
[wallet status tags handover](../YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/handoffs/2026-11-11-c.md#jason--wallet-status-tags).

## Out of Scope

- Any provider call, cryptographic re-verification or presentation flow from the browser. The
  badge is a display verdict and must never authorise an action.
- Hiding, deduplicating or reordering wallet entries. The API's list (incl. the temporary
  revoked + issued YoID pair) is rendered as returned, keyed by native credential id.
- The rest of the [2026-11-09 UI checklist](../handoffs/2026-11-09-a.md) — already addressed
  or separately ticketed.

## Plan

- `src/web/src/api/models/credential.ts` — `CredentialStatus`, `CredentialVerificationStatus`
  enums; both fields optional on `SSICredentialBase` (an older API omits them).
- `src/web/src/lib/credentials/credentialStatus.ts` — one mapping `credentialBadge()` for card and
  detail: Invalid (reason "revoked"/"expired" from `status`) > Verified (requires `Verified`
  **and** `Issued`) > Unverified (Unknown, missing fields, or any contradictory pair).
- `src/web/src/components/Credentials/CredentialStatusBadge.tsx` — the pill; `data-status`
  carries the verdict for tests. Used by `CredentialCard.tsx` (short) and the passport detail
  dialog (`pages/yoid/passport/[[...query]].tsx`, "Status" row, full text "Invalid — revoked").
- `src/web/e2e/youth/passport-status.spec.ts` — wallet search/detail stubbed on the browser
  context (CI has no SSI provider); page, auth and type lookup real.

## Tasks

- [x] Model: lifecycle + verification enums and optional fields
- [x] Shared badge mapping + component
- [x] Card pill bound to the API verdict
- [x] Detail dialog "Status" row with reason
- [x] Playwright spec: four lifecycle tags, legacy response, contradictory pair, replacement pair visible and counted, list/detail parity
- [ ] Browser check against a real didx:me-backed API (Dev/Stage) once deployed — live statuses are not exercised locally or in CI (`known-gaps.md`)
- [ ] Linear: YOM-1310 → In Progress / In Review with PR link (needs go-ahead)

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-11-12: `Unknown` / missing fields render a neutral gray "Unverified" pill rather than no
  pill — a card without a badge reads as fine, and the handover says absence is never Verified.
- 2026-11-12: Verified requires both `verificationStatus: Verified` and `status: Issued`. The
  API never sends a contradictory pair today; the guard exists so a positive verdict can never
  override Revoked/Expired/Unknown as the handover demands.
- 2026-11-12: Live statuses are proven by a route-intercepted spec with fixtures, not a unit test
  of the helper alone: the handover's test list is about what the youth sees (list/detail
  parity, visibility of revoked copies), and CI runs without an SSI provider.

## Links

- Epic: [YOM-1306](../README.md)
- Ticket: [YOM-1310](https://linear.app/didx/issue/YOM-1310)
- API contract: [2026-11-11-c handoff](../YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/handoffs/2026-11-11-c.md#jason--wallet-status-tags), [2026-11-12-a handoff](../YOM-1309-use-didxme-for-yoma-wallets-and-credential-issuance/handoffs/2026-11-12-a.md)
- PRs:
