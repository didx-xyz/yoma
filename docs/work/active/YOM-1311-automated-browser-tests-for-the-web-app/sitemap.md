# Site map — what needs a browser test

Every route under `src/web/src/pages/` (63 files, 2026-11-03), grouped by feature area. Each row
is a checklist item: a feature session owning the area adds a spec under
`src/web/e2e/<project>/<area>.spec.ts`, ticks the row and names the spec. Rules for writing
specs: `handoffs/2026-11-03-a.md` "For feature sessions". Only data in `src/web/e2e/seed.ts` may
be asserted on; "random" below means the seed generates it with random ids and the area needs a
fixed-id seed addition (`post.sql` + `seed.ts`, note for Adrian) before it can be tested.

Access = Playwright project to put the spec in: `anonymous`, `youth`, `org-admin`, `admin`.
Access is the SSR gate; where it says "API 403" the page only checks for a session and relies on
the API to refuse the wrong role (test that too).

Legend: ☐ no spec · ☑ smoke (renders, markers present) · ☑☑ journey (an action completed).

## Public (anonymous)

| Route | Marker | Seed | Status | Spec |
| --- | --- | --- | --- | --- |
| `/` | title `Yoma \| Home`, h1 "Building futures…" | none | ☑ | `public/login.spec.ts` (via login) |
| `/about` | title `Yoma \| About Us` | none | ☑ | `public/pages.spec.ts` |
| `/terms` | title `Yoma - Terms of Service & Privacy Policy`; `#btnTermsTab_*` | none | ☑☑ | `public/pages.spec.ts` |
| `/401` `/403` `/404` `/500` | h2 "Welcome Back!" / "Access Restricted" / "Page Not Found" / "Oops!" | none | ☑ (403, 404) | `youth/gating.spec.ts`, `public/pages.spec.ts` |
| `/login/return` | SSR redirect only | none | ☐ | |
| `/marketplace` | h3 "What is your Country?", `#input_country`, `#letsGoButton` | countries | ☑☑ | `public/pages.spec.ts` |
| `/marketplace/[country]` | `#btnSignIn_marketplaceCountry` (anon); buy needs session | store items (external) | ☐ | |

## Auth / Keycloak (anonymous) — SRE upgrade runbook

| Flow | Status | Spec |
| --- | --- | --- |
| Login OK → session + user menu | ☑☑ | `public/login.spec.ts` |
| Login page renders (tabs, fields, OTP toggle, social, terms) | ☑ | `public/keycloak/login-page.spec.ts` |
| Wrong password → `#input-error` (brute-force counter reset after) | ☑☑ | `public/keycloak/login-page.spec.ts` |
| Site language → Keycloak `ui_locales` (fr) | ☑☑ | `public/keycloak/login-page.spec.ts` |
| Register: client password gate; duplicate email rejected | ☑☑ | `public/keycloak/register.spec.ts` |
| Register by phone + OTP → signed in | ☑☑ | `public/keycloak/phone.spec.ts` |
| Login with OTP; wrong code rejected | ☑☑ | `public/keycloak/phone.spec.ts` |
| Reset password by phone OTP → new password works | ☑☑ | `public/keycloak/phone.spec.ts` |
| Logout ends site + Keycloak SSO session | ☑☑ | `public/keycloak/logout.spec.ts` |
| Session expired dialog (refresh failure injected) | ☑☑ | `youth/session-expired.spec.ts` |
| Email registration / email reset end-to-end | blocked | no mail catcher locally; realm SMTP is SendGrid with a fake key |
| Social login (Google/Facebook) | blocked | placeholder IdP secrets; presence asserted only |
| SMS 2FA (`login-sms-otp.ftl`) | not reachable | `sms-otp-authenticator` is in no realm flow (browser flow's conditional OTP step is the standard `auth-otp-form`); the helm/compose `TEST_PHONE_NUMBERS` number only short-cuts SMS sending, it does not enable 2FA. Test it if/when the flow is added |
| Required actions: update profile / update password | ☐ | set `requiredActions` via admin API on the throw-away phone user, then log in |
| Required action: verify email | blocked | needs email (see above) |

## Discovery & opportunity details (anonymous+)

| Route | Marker | Seed | Status | Spec |
| --- | --- | --- | --- | --- |
| `/opportunities/discover` (+ `?q=`) | title `Yoma \| Discover opportunities`, card h3 | fixture titles | ☑ (youth) | `youth/yoid.spec.ts` |
| `/opportunities` (`[[...query]]`) | title `Yoma \| Opportunities` | fixture titles | ☐ | |
| `/opportunities/[opportunityId]` | h4 title; `#btnOpportunityGoTo`, `#btnOpportunitySave` | fixture title → id (via search) | ☑☑ save/unsave | `youth/opportunity-details.spec.ts` |
| `/opportunities/actionLink/verify/[linkId]` | h2 "Almost there…" / "Congratulations!" | instant-verify link (random) | ☐ | |
| Custom-field filters (CF fields session) | filter panel `data-testid`s | custom field definitions | ☐ | |

## Youth (`youth`)

| Route | Marker | Seed | Status | Spec |
| --- | --- | --- | --- | --- |
| `/yoid` | h1 "Good …, Test"; `section#wallet/#passport/#opportunities/#skills` | youth completions | ☑ | `youth/yoid.spec.ts` |
| `/yoid/opportunities/completed` | title; `01 - Job` | youth completed `01 - Job` | ☑ | `youth/yoid-tabs.spec.ts` |
| `/yoid/opportunities/pending` | title; `04 - Event` | youth pending `04 - Event` | ☑ | `youth/yoid-tabs.spec.ts` |
| `/yoid/opportunities/saved` | title; saved fixture | youth | ☑☑ (via save) | `youth/opportunity-details.spec.ts` |
| `/yoid/opportunities/declined` `/add` | titles | youth | ☐ | |
| `/yoid/passport` | credential-type filter group or "No credentials yet" | `passport_enabled` | ☑ | `youth/yoid-tabs.spec.ts` |
| `/yoid/skills` | "Skills you've earned" + no empty state | 57 verified skills | ☑ | `youth/yoid-tabs.spec.ts` |
| `/yoid/wallet` (cash-outs session) | `#wallet-products-heading`; balance card only with SSI/Zlto backends | vouchers / ZLTO (random) | ☑ render only | `youth/yoid-tabs.spec.ts` |
| `/user/profile` | `#inpProfileFirstName/#inpProfileSurname`, `#btnProfileSubmit`; toast "Your profile has been updated" | youth | ☑☑ surname edit + API check | `youth/profile.spec.ts` |
| `/user/settings` | `#<SettingKey>` toggles, `#btnSettingsSubmit`; toast "Settings updated" | youth | ☑☑ toggle + API check | `youth/settings.spec.ts` |
| `/organisations/register` → `/success` | h2 "Organisation details" | none | **not tested** — creates an organisation that nothing cleans up; needs an admin-API delete or a seed reset per run (see `known-gaps.md`) | |
| `/referrals`, `/referrals/program/[id]`, `/claim/[id]`, `/link/[id]`, `/progress/[id]` | titles `Yoma \| Refer a friend…` | referral program (random) | ☐ | |
| Gating: `/organisations` and every `/admin/*` as youth → Access Restricted | | | ☑☑ | `youth/gating.spec.ts` |

## Organisation admin (`org-admin`) — Yoma org `…0100`

| Route | Marker | Seed | Status | Spec |
| --- | --- | --- | --- | --- |
| `/organisations/dashboard?organisations=` | title `Yoma \| Dashboard`; tabs Engagement / Rewards & Skills / Demographics; `#btnMainMenu` → `#userMenu_orgs_*` | Yoma org | ☑ | `org-admin/dashboard.spec.ts` |
| `/organisations/[id]/opportunities` | h3 "🏆 Opportunities", `#lnkNavbarMenu_Submissions`, row link `01 - Job` | fixtures | ☑ | `org-admin/opportunities.spec.ts` |
| `/organisations/[id]/opportunities/create` → edit → info | title `Yoma \| Opportunity`; create/update | Yoma org | ☐ | |
| `/organisations/[id]/verifications` | title `Yoma \| Submissions`; approve/reject | youth pending on `04 - Event` | ☐ | |
| `/organisations/[id]/links`, `/links/create`, `/links/[linkId]` | h3 "🔗 Links"; createLinkInstantVerify | Yoma org + fixture | ☐ | |
| `/organisations/[id]/stores` | h3 "🛒 Marketplace Rules" (read-only) | rule (random) | ☐ | |
| `/organisations/[id]/edit`, `/info` | title `Yoma Admin \| Organisation Edit` / `{name}` | Yoma org | ☐ | |
| Gating: `/admin/*` as org-admin → API 403 | | | ☐ | |

## Admin (`admin`)

| Route | Marker | Seed | Status | Spec |
| --- | --- | --- | --- | --- |
| `/organisations` | h3 "🏢 Organisations", `#lnkNavbarMenu_Treasury`, `JobJack` | partner orgs | ☑ | `admin/organisations.spec.ts` |
| `/organisations/[id]/verify` (approve / decline) | title `Yoma Admin \| Verify Organisation`, `#btnApprove` `#btnReject` | an Inactive org — none seeded | ☐ | |
| `/admin/opportunities` | `#results` row links; active/visible/featured/archive actions | fixtures | ☑ list | `admin/opportunities.spec.ts` |
| `/admin/links` | h3 "🔗 Links" | link (random) | ☐ | |
| `/admin/referrals/**` (list, create/edit, info, links, usage) | "🎯 Referral Programs" | programs (random) | ☐ | |
| `/admin/schemas`, `/admin/schemas/[id]` | title `Yoma Admin \| Schemas` | none / create | ☐ | |
| `/admin/stores`, `/admin/stores/[ruleId]` | "🛒 Marketplace Rules"; create/activate/delete | rule (random) | ☐ | |
| `/admin/treasury` | h3 "💰Treasury", tab "Manage", `#btnTreasurySave` | none | ☑ render | `admin/opportunities.spec.ts` |
| `/admin/skills` | "⚡Skills" | none | ☐ | |
| `/admin`, `/admin/connections` | "Under development" | none | ☐ (gating covered) | `youth/gating.spec.ts` |

## Findings for the owners — fixed 2026-11-03

- `/admin`, `/admin/connections` had no auth and `/admin/skills` no role check → all three now
  SSR-gate on `Admin` like the other admin pages (401/403 → Unauthenticated/Unauthorized).
- Global dialogs got ids: `#dlgSessionExpired` / `#btnSessionExpiredStayLoggedOut`,
  `#dlgSettings` / `#btnSettingsSkip`, `#dlgUpdateProfile`, `#btnRumConsentNotNow` /
  `#btnRumConsentAllow`. Language switcher: `#selLanguage` (navbar), `#selLanguage_drawer`.
- `handleUserSignOut` now dismisses toasts, so nothing from the previous session overlays Login.
- Still true: `kc_locale` on the Keycloak auth URL is ignored by this realm; use the site switcher.
