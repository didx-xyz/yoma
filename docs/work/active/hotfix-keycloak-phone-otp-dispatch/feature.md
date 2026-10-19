# Feature: Phone OTP fails when WhatsApp reports `sent`

## Meta

- **Feature**: Keep WhatsApp OTPs usable when delivery is unconfirmed; honest errors; count failed sends
- **Epic**: none (production hotfix, adjacent to [YOM-1299](../hotfix-keycloak-sso-offline-access/feature.md) but not part of its scope)
- **Ticket**: none
- **Owner**: Jason
- **Areas**: keycloak
- **Status**: shipped — Production in `v3.13.2` (2026-10-19); post-release log review pending
- **Started**: 2026-10-16

## Problem / Goal

Phone registration and phone verification return HTTP 503 for users whose WhatsApp OTP reaches Twilio status `sent` but not `delivered` within the sender's ~14 second polling window. The Twilio sender treats that as a failure and falls back to SMS. SMS is South Africa only, so non-ZA numbers get an error, and `DefaultPhoneProvider` never persists the OTP. If the WhatsApp message does arrive, its code cannot be used. Phone OTP login and reset share the sender and are affected the same way. Full diagnosis: [handoffs/2026-10-16-a.md](handoffs/2026-10-16-a.md).

Goal, after SRE review of #1979: a code that may still arrive must work and the user must be told delivery is unconfirmed; ZA users keep the SMS backup; errors say what actually happened and are 4xx only when the number is at fault; failed sends count toward the existing rate limits.

## Out of Scope

- OTP matching/expiry and phone-verification rules.
- International SMS, billing or Twilio configuration.
- Atomic protection against concurrent sends (needs a lock or DB constraint). Left to an edge rate limit: Robbie's `fix/keycloak-sms-ratelimit` (Traefik).
- Asynchronous delivery tracking via Twilio status callbacks.
- Changing the retry count or delay (8 checks, 2 s), or the limit values (3 per number, 10 per IP, per hour and code type — code defaults; Helm does not set them).
- The two MFA OTP pages (`login-sms-otp*.ftl`): they have no alert UI and still work from `expires_in`.
- Helm, secrets and realm config.

## Plan

Outcome when the polling window ends (Twilio sender):

| Last WhatsApp status                               | ZA                                | Non-ZA                                                 |
| -------------------------------------------------- | --------------------------------- | ------------------------------------------------------ |
| `delivered` / `read` (any time)                    | 200                               | 200                                                    |
| `sent`, no receipt in window                       | SMS backup, same code (as before) | 200, code saved, `delivery_confirmed: false` → warning |
| `failed` / `undelivered` with recipient error code | SMS fallback                      | 400 "couldn't reach you on WhatsApp…"                  |
| other `failed` / `undelivered`, Twilio API errors  | SMS fallback                      | 503 "couldn't send your code on WhatsApp right now…"   |
| still `queued` / `sending`                         | SMS fallback                      | 503                                                    |

Recipient error codes (`RECIPIENT_ERROR_CODES`): 21211 invalid number, 21614 not a mobile number, 63003 not on WhatsApp, 63024 invalid recipient. Every failure log line carries the Twilio error code.

Changes:

1. **SPI**: `MessageSenderService.sendSmsMessage` / `FullSmsSenderAbstractService.sendMessage` return `MessageSendResult` (`SENT`, `DELIVERY_UNCONFIRMED`). `PhoneProvider.sendTokenCode` returns `TokenCodeSendResult(expiresIn, deliveryConfirmed)`. New `MessageRecipientException extends MessageSendException` → 400; any other `MessageSendException` → 503.
2. **`DefaultPhoneProvider`**: persists the code for both results; maps exceptions; records each failed send via `PhoneVerificationCodeProvider.persistFailedSend` in its own transaction (`KeycloakModelUtils.runJobInTransaction`), because Keycloak's error handler marks the request transaction rollback-only.
3. **`DefaultPhoneVerificationCodeProvider`**: failed sends are rows with code `FAILED` (fits `VARCHAR(6)`, never matches numeric input) and `expiresAt` 1 s before `createdAt`, so the limit counts (by `createdAt`) include them and `ongoingProcess` (by `expiresAt`) ignores them. Limits use `>=` (3 means 3). `ongoingProcess` orders by `createdAt DESC` and takes the first row, so duplicate live codes from concurrent sends no longer throw `NonUniqueResultException` (500).
4. **`TokenCodeResource`**: response is `{"expires_in":300,"delivery_confirmed":true|false}`.
5. **Theme** (`register.ftl`, `login.ftl`, `login-reset-password.ftl`, `login-update-phone-number.ftl`): `deliveryUnconfirmed` page flag picks a `SENT_UNCONFIRMED` warning alert (`codeSentUnconfirmed`, all five locales). `codeSendStatus` stays `SENT` because `PhoneUsernamePasswordForm` and `ResetCredentialWithPhone` only round-trip `SENT`/`ALREADY_SENT`.
6. **Send button** (2026-10-19, same four pages): "Send OTP" is disabled and reads "Loading..." while its request is in flight, so a double-click can't send two codes.
7. **JARs**: the SPI change means `keycloak-phone-provider`, `keycloak-phone-provider.resources`, `keycloak-sms-provider-dummy` and `keycloak-sms-provider-twilio` must ship together. Helm copies every `jars/*.jar` from the deployed ref.

## Tasks

- [x] First version: accept `sent` as dispatch (superseded by the rework)
- [x] Rework sender to the outcome table; SPI result types; 400/503 split
- [x] Count failed sends; `>=` limits; duplicate-tolerant `ongoingProcess`
- [x] Theme warning + `codeSentUnconfirmed` in en/es/fr/pt/sw
- [x] Rebuild; confirm only the four intended JARs' contents changed
- [x] Scripted-Twilio harness, 17 sender scenarios
- [x] Local Keycloak (dummy sender): response shape, failure recording surviving rollback, per-IP and per-number limits at exact values, duplicate live codes → `ALREADY_SENT`, theme renders en/fr
- [x] Prod hotfix branch `hotfix/keycloak-phone-otp-dispatch` from `v3.13.0`, changes applied uncommitted (2026-10-16). Dropped 2026-10-18 in favour of #1979 to master; its code was identical to #1979
- [x] Local re-verification on the hotfix branch (2026-10-18): JARs rebuilt from source match, builds on 26.8.1, harness 17/17, dummy-sender endpoint checks, stubbed-endpoint alerts on register/login/reset at 320/390 px in en/fr — [handoffs/2026-10-18-a.md](handoffs/2026-10-18-a.md)
- [x] Update #1979's title and description; review (Robbie approved) and squash-merge to master as `f21d66802` (2026-10-19)
- [x] Stage smoke checks without real messages (2026-10-19): new theme served on 6 of 6 fetches, test number returns `delivery_confirmed`, 14/14 stubbed alert scenarios at 320/390 px in en/fr — [handoffs/2026-10-19-a.md](handoffs/2026-10-19-a.md)
- [ ] Real-message checks. No non-ZA phone is available, so the non-ZA rows (2, 3, 6) of [handoffs/2026-10-16-d.md](handoffs/2026-10-16-d.md) §3 are checked from Production logs instead (next task). For the ZA SMS backup (row 4), request the code from a laptop while the phone is in airplane mode
- [ ] Post-release log review with `src/keycloak/scripts/otp-dispatch-report.mjs` (Datadog), daily for a few days. First run 2026-10-19, 1.3 h after the release: new code live, no 503s yet, too little traffic to conclude — see [handoffs/2026-10-19-b.md](handoffs/2026-10-19-b.md)
- [x] Send-button fix: disable "Send OTP" while its request is in flight on register, login, reset password and update phone number (2026-10-19, local)
- [x] Send-button fix: #1986, merged as `8ad828f47`; double-click check passes on Stage (2026-10-19)
- [ ] Native-speaker check of the es/fr/pt/sw `codeSentUnconfirmed` strings
- [ ] Robbie: confirm the live provider ref/checksum and trace failing message SIDs to their final status and error code (checks the recipient code list)
- [x] Production: Robbie released `v3.13.2` on top of `v3.13.1`, with #1979 and #1986 cherry-picked; its provider source and JARs are identical to master `8ad828f47`. Production pages serve the new theme and pass the double-click check (2026-10-19)
- [ ] Robbie's `chore/keycloak-26.8.1` (not merged; Keycloak stays on 26.4.0 for now) is rebased onto #1979 but not #1986. Before it merges, it must rebuild the JARs from master, or its resources JAR drops the send-button fix
- [ ] SRE rate limit at the edge: Robbie's `fix/keycloak-sms-ratelimit` (Traefik, 10/min per client IP on `/auth/realms/yoma/sms/`) replaces the Cloudflare suggestion; not merged as of 2026-10-18

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-10-16: Validated with a throwaway harness that drives the built JAR against a fake Twilio `HttpClient` (`Twilio.setRestClient`), rather than adding JUnit/Mockito to the provider build. The brief requires approval for new dependencies, and the provider tree has no test setup. Cases 7–10 need a running Keycloak and stay as Stage checks.
- 2026-10-16: Committed only the Twilio JAR. The other four tracked JARs that Maven rewrote had byte-identical extracted contents (only zip timestamps differed), so they were restored.
- 2026-10-16: Reworked after SRE review of #1979. Returning at the first `sent` dropped the SMS backup for ZA users and could not support an "unconfirmed" warning (almost every message passes through `sent`). Polling now continues to `delivered`; the window ending at `sent` is accepted with a warning for non-ZA and falls back to SMS for ZA.
- 2026-10-16: 400 only for recipient-specific Twilio error codes; other failures stay 503 so 5xx still signals a provider or account fault. SRE asked for 400 broadly; this keeps their alerting meaningful. The code list is a starting point to check against live SIDs.
- 2026-10-16: Brought failed-send counting and the `>` → `>=` fix into this hotfix (Adrian's brief had deferred them) at SRE's request. A genuine user hitting a Twilio outage now uses up their 3 attempts per hour.
- 2026-10-16: Return values (`MessageSendResult`, `TokenCodeSendResult`) rather than an exception for the unconfirmed case, so success is never signalled through the error path. Costs a dummy-provider rebuild.
- 2026-10-16: Concurrent sends are not made atomic. The duplicate-row 500 is fixed; burst protection is left to a Cloudflare rule.
- 2026-10-16: Ship to Production as a hotfix from the `v3.13.0` tag, not from master, because Adrian is about to merge the CF branch into master. The tag points at the same commit #1979 was built on (`67c8f90d6`), so the tested JARs apply unchanged. Master gets the same change re-applied after the CF merge.
- 2026-10-18: Tested the alerts that the dummy sender can't produce (unconfirmed warning, 400, 503) by stubbing the `sms/*-code` response in headless Chrome against the real local pages, instead of waiting for Stage. This proves the theme logic and layout. Whether Twilio actually produces those outcomes is still a real-message check.
- 2026-10-18: Left out of this hotfix: a ZA send that fails on both WhatsApp and SMS still shows Twilio's raw SMS error to the user. `v3.13.0` behaves the same, and changing it widens a production hotfix. Raised as an open question in the 2026-10-18 handoff.
- 2026-10-18: Reversed the 2026-10-16 tag decision. #1979 goes to master like any other change (as Adrian's brief said), reaches Stage together with the CF changes, and Robbie can cut a Production hotfix from it if he wants. Reasons: CF has landed and doesn't touch `src/keycloak/providers`, so #1979 merges cleanly and its JARs stay valid; Stage then tests what ships next; one PR instead of a hotfix branch plus a master re-apply. Trade-off: the real-message checks now run on Stage after the merge, not before it.
- 2026-10-19: Disable "Send OTP" while its request is in flight. The request now takes up to ~14 s (delivery polling, then the ZA SMS backup), and the button stayed clickable: a click while the first request was still waiting sent a second WhatsApp message with a different code, and only the code saved last verifies. Theme-only fix (`isSending` flag, "Loading..." label, an early return for a click that lands before the button re-renders); only `keycloak-phone-provider.resources.jar` changes. The two MFA OTP pages are left as they are.
- 2026-10-19: Production order agreed with Jason: send-button fix to master and Stage first; once both changes are confirmed on Stage, cherry-pick `f21d66802` and the send-button commit, in that order, onto Adrian's hotfix branch or a new hotfix branch from his release tag.
- 2026-10-19: Keycloak stays on 26.4.0. Robbie's 26.8.1 branch is not part of this release, so the JARs are not rebuilt for it.
- 2026-10-19: Production effect is measured from Keycloak's own log lines in Datadog (`src/keycloak/scripts/otp-dispatch-report.mjs`), comparing a window before `v3.13.2` with the time since. The script prints counts and Twilio codes only, because the log lines contain phone numbers. It lives under `src/keycloak/scripts` rather than this folder because it stays useful after the hotfix is archived.

## Links

- PRs: [#1979](https://github.com/didx-xyz/yoma/pull/1979) (merged as `f21d66802`), [#1986](https://github.com/didx-xyz/yoma/pull/1986) (merged as `8ad828f47`)
- Release: `v3.13.2` (2026-10-19)
- Related: Robbie's `fix/keycloak-sms-ratelimit` (Traefik SMS rate limit) and `chore/keycloak-26.8.1` (rebuilds the provider JARs); CF merge `3a5d5f9cd` (#1978)
- Related: [YOM-1299 SSO hotfix](../hotfix-keycloak-sso-offline-access/feature.md); `fd0a11b8d` (#1339), `e797cdf83` (#1366), `eeb21bb22` (#1395) introduced and tuned the delivery polling
- Twilio [Message status values](https://www.twilio.com/docs/messaging/api/message-resource#message-status-values), [error codes](https://www.twilio.com/docs/api/errors)
