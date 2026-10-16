# Feature: Phone OTP fails when WhatsApp reports `sent`

## Meta

- **Feature**: Accept WhatsApp `sent` as successful OTP dispatch
- **Epic**: none (production hotfix, adjacent to [YOM-1299](../hotfix-keycloak-sso-offline-access/feature.md) but not part of its scope)
- **Ticket**: none
- **Owner**: Jason
- **Areas**: keycloak
- **Status**: review — Stage rollout and live Twilio SID check pending
- **Started**: 2026-10-16

## Problem / Goal

Phone registration and phone verification return HTTP 503 for users whose WhatsApp OTP reaches Twilio status `sent` but not `delivered` within the sender's ~14 second polling window. The Twilio sender treats that as a failure and falls back to SMS. SMS is South Africa only, so non-ZA numbers get an error, and `DefaultPhoneProvider` never persists the OTP. If the WhatsApp message does arrive, its code cannot be used. Phone OTP login and reset share the sender and are affected the same way.

Goal: treat `sent` as accepted dispatch so the existing flow persists the OTP, without changing any other boundary. Full diagnosis: [handoffs/2026-10-16-a.md](handoffs/2026-10-16-a.md).

## Out of Scope

- `DefaultPhoneProvider` persistence order, OTP matching/expiry and phone-verification rules.
- International SMS, billing or Twilio configuration.
- Rate limiting of failed or concurrent sends, the `>` vs `>=` abuse boundary, and returning a client error instead of 503 for unsupported fallback (separate follow-up, to be agreed by Adrian and Jason).
- Asynchronous delivery tracking via Twilio status callbacks.
- Changing the retry count or delay (8 checks, 2 s).
- Helm, secrets and realm config.

## Plan

`src/keycloak/providers/keycloak-sms-provider-twilio/.../sender/TwilioSmsSenderServiceProvider.java`:

1. `checkMessageDeliveryStatus`: `sent` returns with an explicit "dispatched; delivery is not yet confirmed" log. `queued`/`sending` keep polling. `delivered`/`read` success and `failed`/`undelivered` failure are unchanged.
2. `sendMessage`: the outer log says "WhatsApp dispatch accepted" instead of "delivery successful".
3. Rebuild with `mvn clean install` and commit only `src/keycloak/providers/jars/keycloak-sms-provider-twilio.jar`. Helm copies `jars/*.jar` from the deployed ref and does not compile source, so the JAR is the shipped artifact.

## Tasks

- [x] Sender change and comment/log wording
- [x] Rebuild; confirm only the Twilio JAR's contents changed
- [x] Scripted-Twilio harness for validation cases 1–6 of the brief, fixed JAR vs master JAR
- [ ] Robbie: confirm the live provider ref/checksum and trace a failing message SID to its final status (the fix assumes affected messages reach `sent`)
- [ ] Stage: deploy the hotfix ref to all Keycloak replicas; phone registration + verification with a non-ZA WhatsApp number; ZA SMS fallback; phone OTP login and reset; email and social sign-in
- [ ] Stage: sequential resend returns `ALREADY_SENT` without a second provider send; wrong/expired code still rejected; nothing verified on send alone (cases 7–8 of the brief)
- [ ] Production: rollout to all replicas, one controlled phone registration smoke, check dispatch/503/fallback logs
- [ ] Follow-up ticket for failed-send throttling and error classification, if agreed

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-10-16: Validated with a throwaway harness that drives the built JAR against a fake Twilio `HttpClient` (`Twilio.setRestClient`), rather than adding JUnit/Mockito to the provider build. The brief requires approval for new dependencies, and the provider tree has no test setup. Cases 7–10 need a running Keycloak and stay as Stage checks.
- 2026-10-16: Committed only the Twilio JAR. The other four tracked JARs that Maven rewrote had byte-identical extracted contents (only zip timestamps differed), so they were restored.

## Links

- PRs:
- Related: [YOM-1299 SSO hotfix](../hotfix-keycloak-sso-offline-access/feature.md); `fd0a11b8d` (#1339), `e797cdf83` (#1366), `eeb21bb22` (#1395) introduced and tuned the delivery polling
- Twilio [Message status values](https://www.twilio.com/docs/messaging/api/message-resource#message-status-values)
