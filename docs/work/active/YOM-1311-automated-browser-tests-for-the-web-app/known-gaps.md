# Known gaps — what the e2e suite does NOT prove

Two kinds of gap, kept apart on purpose:

- **Not testable** — the flow cannot run locally or in CI. Nothing to fix in the test; record the
  prerequisite that would unlock it and who owns it.
- **Bypassed** — a spec exists but is switched off with `test.fixme(true, "YOM-NNNN: <why>")`
  because it fails repeatably for reasons outside the change that was being made. Every row here
  must have a matching `fixme` in the code: `pnpm test:e2e:gaps` (from `src/web`) prints them.
  Remove the `fixme` and the row together.

Update this file in the same commit as the test change. Reviewed by the YOM-1311 master session.

## Not testable (locally or in CI)

| Flow | Why | Unlocks when | Owner |
| --- | --- | --- | --- |
| Keycloak e-mail registration (VERIFY_EMAIL page, link click) | No mail catcher; realm SMTP is SendGrid with a fake key → "Failed to send email" | Mailpit (or similar) in `src/api/docker-compose.yml` + realm `smtpServer` pointed at it; test reads the mail via its API | Adrian |
| Keycloak e-mail password reset | same | same | Adrian |
| Keycloak "verify email" required action | same | same | Adrian |
| Real SMS delivery (Twilio/WhatsApp sender) | Local sender is the `dummy` provider (logs, 20 % random failure); production senders need credentials | Not an e2e concern — covered by the provider's own tests / staging smoke | SRE |
| SMS 2FA (`login-sms-otp.ftl`, `sms-otp-authenticator`) | The authenticator is in no realm flow; the browser flow's conditional OTP step is stock TOTP (`auth-otp-form`) | Only if the flow is added to the realm | Adrian / SRE |
| Social login (Google, Facebook) | IdP client ids/secrets are placeholders locally; the redirect leaves our stack | Presence of `#social-google` / `#social-facebook` is asserted; the round-trip is a staging manual check | — |
| Session expiry in real time | Needs the Keycloak session revoked and the 300 s access token to lapse | Covered indirectly: `youth/session-expired.spec.ts` injects the refresh error. Real-time variant not worth the wall-clock | — |
| Organisation approve/decline (`/organisations/[id]/verify`) | Every seeded organisation is Active; nothing pending to act on | One seeded organisation in Inactive/pending status with a fixed id (`post.sql` + `seed.ts`) | Adrian |
| Marketplace purchase (`/marketplace/[country]` buy) | Store items come from an external provider | A stubbed store or a seeded local item | Adrian |
| Referral programme journeys | Programmes and links are seeded with random ids | Fixed-id programme + link in `post.sql` + `seed.ts` | Adrian |
| Datadog RUM consent *effect* | Only the dialog is testable; RUM is not initialised locally | — | — |
| Phone OTP flows more than 3×/hour | Provider cap of 3 OTP sends per number per hour (`DefaultPhoneProvider`); CI seeds fresh so unaffected | Second `TEST_PHONE_NUMBERS` entry would double the local budget | Adrian |
| Organisation registration (`/organisations/register` → `/success`) | Creates a new organisation under the youth user every run; nothing deletes it, so the DB drifts and the user becomes an org admin, which changes every later youth test | A delete-organisation admin API call in `afterAll`, or a per-run seed reset in CI | Adrian / Jason |
| Cash-out money path (ZLTO reserve/commit/release, provider session, webhook/reconciliation settlement, real cancel, outcome emails) | No ZLTO wallet backend or payout provider in compose; the API runs as `Local`, outside `PayoutEnabledEnvironments`. `youth/wallet.spec.ts` covers the UI by overlaying `zlto`/`payout` on `GET /user` and stubbing session / latest / cancel; only the kill-switch, the Treasury conversion preview and the initiation refusal are real | A ZLTO + payout-provider stub in compose and a `Created` wallet with balance for the youth | Adrian |
| Treasury save (`/admin/treasury` Manage → `#btnTreasurySave`) | Seeded payout pool is USD 0 (release-defaults migration) and the validator requires > 0, so a saving test cannot restore it — and a positive pool would un-pause cash-out for every other test | A Treasury reset path for tests, or the validator accepting 0 | Adrian |
| Yo-ID declined list, Add opportunity (`/yoid/opportunities/declined`, `/add`) | No seeded declined/rejected rows asserted on yet; render-only would be trivial | Fixed-id rejected verification in `post.sql` | Adrian |
| Credential schema create / update (`/admin/schemas/create` Submit, `/admin/schemas/[id]` Submit) | `POST`/`PATCH /ssi/schema` publish an immutable schema (or a new version) on the real Aries CloudAPI test tenant — the local stack has no provider stub and the API has no delete. `admin/schemas.spec.ts` drives the wizard to Review and blocks non-GET `/ssi/schema` at the browser as a safety net | A credential-provider stub in compose (or a throw-away tenant reset per run) | Adrian |
| Credential schema **reads** (`admin/schemas.spec.ts`, all three tests) | Also external: the list and wizard read live from the Aries CloudAPI test tenant and need the API's `SeedSchemas` Hangfire job to have run after start-up. Kept in the suite (deterministic when the provider is up) but **not `@smoke`**, so the PR gate never depends on the provider | Same provider stub | Adrian |
| Completion **file** upload (FileUpload / Picture / VoiceNote / Video proof) | The API's TUS store and blob service write to real AWS S3 (`appsettings.Local.json` keys; no MinIO/LocalStack in compose). `flows/opportunity-lifecycle.spec.ts` uses the S3-free **Location** proof instead | MinIO in compose + `BlobProvider` config pointing at it, then a file-proof variant of the flow | Adrian |
| Youth completion of Entrepreneurship opportunities | The completion dialog requires three MyOpportunity custom fields (business name / summary / registered); not in the flow, which completes a Learning opportunity | Extend the flow if the business section needs coverage | — |
| ZLTO actually credited / credential issued after approval | `ProcessRewardTransactions` and credential issuance are Hangfire jobs needing the external ZLTO / Aries providers. The flow asserts the synchronous outcomes: verified skill on Yo-ID and `zlto.pendingRewards` | Provider stubs | Adrian |
| Marketplace landing in CI (`/marketplace`) | `pages/marketplace/index.tsx` returns the disabled page whenever the web was built/started with `CI` set — the CI image is. `public/pages.spec.ts` skips with that reason | Build-time flag decoupled from `CI`, or an `E2E` build of the web image | Jason |
| Credential schema reads when the provider rejects the API | First CI run: Aries CloudAPI answered `invalid_client` to the API (`ARIESCLOUDAPI_*` secrets), pages 500. `admin/schemas.spec.ts` probes `/ssi/schema` in `beforeEach` and skips with the reason | Valid provider credentials on the runner (Robbie) | Robbie |
| `Other` opportunity type | Hidden in the create wizard (`[opportunityId]/index.tsx` filters it) — not creatable by org admins, so not in the flow | — | — |

## Bypassed (`test.fixme`) — must be empty before the suite becomes a merge gate

| Spec · test | Ticket | Since | Why it fails | What unblocks it |
| --- | --- | --- | --- | --- |
| _none_ | | | | |

## Server-side code

Coverage (`pnpm test:e2e:coverage`) measures client bundles only. `getServerSideProps`,
`pages/api/*` and `server/*` are exercised by the journeys but never counted. Not a gap in the
tests — a gap in the number; do not read "100 %" as whole-app coverage.
