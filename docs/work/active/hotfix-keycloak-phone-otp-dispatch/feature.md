# Feature: Phone OTP fails when WhatsApp reports `sent`

## Meta

- **Feature**: Keep WhatsApp OTPs usable when delivery is unconfirmed; honest errors; count failed sends
- **Epic**: none (production hotfix, adjacent to [YOM-1299](../hotfix-keycloak-sso-offline-access/feature.md) but not part of its scope)
- **Ticket**: none
- **Owner**: Jason
- **Areas**: keycloak
- **Status**: review — reworked after SRE review of #1979; Stage rollout and live Twilio SID check pending
- **Started**: 2026-10-16

## Problem / Goal

Phone registration and phone verification return HTTP 503 for users whose WhatsApp OTP reaches Twilio status `sent` but not `delivered` within the sender's ~14 second polling window. The Twilio sender treats that as a failure and falls back to SMS. SMS is South Africa only, so non-ZA numbers get an error, and `DefaultPhoneProvider` never persists the OTP. If the WhatsApp message does arrive, its code cannot be used. Phone OTP login and reset share the sender and are affected the same way. Full diagnosis: [handoffs/2026-10-16-a.md](handoffs/2026-10-16-a.md).

Goal, after SRE review of #1979: a code that may still arrive must work and the user must be told delivery is unconfirmed; ZA users keep the SMS backup; errors say what actually happened and are 4xx only when the number is at fault; failed sends count toward the existing rate limits.

## Out of Scope

- OTP matching/expiry and phone-verification rules.
- International SMS, billing or Twilio configuration.
- Atomic protection against concurrent sends (needs a lock or DB constraint). Recommended to SRE as a Cloudflare rate-limit rule instead.
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
6. **JARs**: the SPI change means `keycloak-phone-provider`, `keycloak-phone-provider.resources`, `keycloak-sms-provider-dummy` and `keycloak-sms-provider-twilio` must ship together. Helm copies every `jars/*.jar` from the deployed ref.

## Tasks

- [x] First version: accept `sent` as dispatch (superseded by the rework)
- [x] Rework sender to the outcome table; SPI result types; 400/503 split
- [x] Count failed sends; `>=` limits; duplicate-tolerant `ongoingProcess`
- [x] Theme warning + `codeSentUnconfirmed` in en/es/fr/pt/sw
- [x] Rebuild; confirm only the four intended JARs' contents changed
- [x] Scripted-Twilio harness, 17 sender scenarios
- [x] Local Keycloak (dummy sender): response shape, failure recording surviving rollback, per-IP and per-number limits at exact values, duplicate live codes → `ALREADY_SENT`, theme renders en/fr
- [ ] Native-speaker check of the es/fr/pt/sw `codeSentUnconfirmed` strings
- [ ] Robbie: confirm the live provider ref/checksum and trace failing message SIDs to their final status and error code (checks the recipient code list)
- [ ] Stage on **all** Keycloak replicas: non-ZA WhatsApp number shows the unconfirmed warning and its code verifies; non-ZA number not on WhatsApp gets 400; ZA SMS fallback; phone OTP login and reset; email and social sign-in
- [ ] Production rollout to all replicas, one controlled phone registration smoke, check logs
- [ ] SRE: Cloudflare rate-limit rule on the `sms/*-code` endpoints

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-10-16: Validated with a throwaway harness that drives the built JAR against a fake Twilio `HttpClient` (`Twilio.setRestClient`), rather than adding JUnit/Mockito to the provider build. The brief requires approval for new dependencies, and the provider tree has no test setup. Cases 7–10 need a running Keycloak and stay as Stage checks.
- 2026-10-16: Committed only the Twilio JAR. The other four tracked JARs that Maven rewrote had byte-identical extracted contents (only zip timestamps differed), so they were restored.
- 2026-10-16: Reworked after SRE review of #1979. Returning at the first `sent` dropped the SMS backup for ZA users and could not support an "unconfirmed" warning (almost every message passes through `sent`). Polling now continues to `delivered`; the window ending at `sent` is accepted with a warning for non-ZA and falls back to SMS for ZA.
- 2026-10-16: 400 only for recipient-specific Twilio error codes; other failures stay 503 so 5xx still signals a provider or account fault. SRE asked for 400 broadly; this keeps their alerting meaningful. The code list is a starting point to check against live SIDs.
- 2026-10-16: Brought failed-send counting and the `>` → `>=` fix into this hotfix (Adrian's brief had deferred them) at SRE's request. A genuine user hitting a Twilio outage now uses up their 3 attempts per hour.
- 2026-10-16: Return values (`MessageSendResult`, `TokenCodeSendResult`) rather than an exception for the unconfirmed case, so success is never signalled through the error path. Costs a dummy-provider rebuild.
- 2026-10-16: Concurrent sends are not made atomic. The duplicate-row 500 is fixed; burst protection is left to a Cloudflare rule.

## Links

- PRs: [#1979](https://github.com/didx-xyz/yoma/pull/1979)
- Related: [YOM-1299 SSO hotfix](../hotfix-keycloak-sso-offline-access/feature.md); `fd0a11b8d` (#1339), `e797cdf83` (#1366), `eeb21bb22` (#1395) introduced and tuned the delivery polling
- Twilio [Message status values](https://www.twilio.com/docs/messaging/api/message-resource#message-status-values), [error codes](https://www.twilio.com/docs/api/errors)
