# Feature: UI — Youth Cash-Out (Payout)

## Meta

- **Feature**: Youth payout — wallet ledger, eligibility gate, amount entry, conversion preview, initiation, active-payout resume, outcome states
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1074](https://linear.app/didx/issue/YOM-1074)
- **Owner**: Jason
- **Areas**: web
- **Status**: in-progress — T5 built end to end (entry point, amount, preview, initiation, hosted
  iframe journey, resume, outcomes), browser-verified; a session-backed pass on Dev is what remains
- **Started**: 2026-09-09
- **Plan tasks**: **T5**
- **Rebuilt**: 2026-09-08 — clean-slate rewrite against the epic README and the API child docs (YOM-1052 / 1055 / 1057 / 1059) and their 2026-08-27 → 2026-09-01 handoffs

## Problem / Goal

Youth earn ZLTO but cannot convert it to money. This ticket adds the youth-facing side of the
payout hierarchy: a correct wallet ledger, an eligibility gate, an amount entry with an indicative
USD preview, payout initiation against the provider-neutral Payout API, a hand-off to the hosted
provider journey, an active-payout state with resume, and outcome states read back from Yoma.

**Cash Out** is the user-facing action wording. Everything behind it is provider-neutral, and **no
payout provider may be named in user-facing copy** (epic rule). The API/domain term is `Payout`.

Read the [epic README](../README.md) first — the branch note, the three-figure Treasury
availability model, the frozen conventions, and the rule that **rewards have no "available"
equivalent**, so nothing here may be built by analogy with the payout figures.

**The API is code-complete but has not run against the IXO sandbox end to end.** Build against the
real endpoints; verify every field type and enum name against the branch, not against this document.

## Out of Scope

- **Payout transaction history / pending-transactions list for the youth** — no endpoint. The
  admin history surface belongs to [YOM-1072](../YOM-1072-ui-treasury-admin/feature.md).
- **Collecting bank, card, mobile-money or identity destination details.** The hosted provider
  journey owns them; Yoma must never store them.
- **Querying the provider directly.** The UI reads only what Yoma has persisted; webhook
  reconciliation is the Payout domain's job (YOM-1059).
- **Multi-asset / multi-currency selection.** ZLTO → USD only.
- **Yoma-originated payout notifications.** Whether the provider sends user-facing progress or
  terminal notifications is an open question (asked 2026-08-28); until answered, this ticket ships
  in-app states only.

## Plan

Four pieces, in order. **The wallet ledger comes first** — the payout amount is checked against it,
and it is currently wrong.

### 1. Wallet ledger contract (`UserProfileZlto`)

Server-side source: **`08cb6c10a`** (`fix(payout): harden reconciliation and ZLTO ledger
consistency`). Read it before building the ledger.

| Field            | Meaning                                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balance`        | **nullable.** Wallet balance before payout reservations are excluded. API-derived as `available + pendingPayout`; `null` when the provider is offline |
| `pendingPayout`  | **non-nullable.** Reserved for an active payout, from Yoma's own record. **API returns positive; the UI renders it negative**                         |
| `available`      | **nullable.** Spendable now. Provider-sourced and **already excludes** `pendingPayout` — never subtract it twice                                      |
| `pendingRewards` | **non-nullable.** ZLTO rewards awaiting transfer to the wallet (was `pendingAwards`)                                                                  |
| `total`          | **nullable.** `available + pendingRewards`. Does **not** include `pendingPayout`                                                                      |

Ledger order: `Balance` → `−Pending payout` → `Available` → `+Pending rewards` → `Total`.
Reconciles as `Available = Balance − Pending payout` and `Total = Available + Pending rewards`.

**Nullability is the offline contract.** The three provider-derived figures go `null` together; the
two Yoma-owned figures always have values. **Branch on `null`, not on `zltoOffline`** — two signals
for one state will drift. `zltoOffline` stays only as the explanatory flag for the notice.
`null + 5` is `5` in JS and `0` is a legitimate balance, so neither arithmetic nor truthiness is safe.

⚠️ Because `balance` is API-derived, the ledger **always** reconciles on screen, even when
`available` is stale. A summing ledger is not a correctness signal. Yoma is the source of truth for
`pendingPayout`; the provider's reserved balance is a server-side cross-check only — **the UI must
never reconcile or surface a mismatch.**

Rendering: `formatZlto` from `lib/format/rewards.ts`; `EMPTY_VALUE` (`—`) for `null`, never blank,
never `0`. The ledger is one component with a compact variant (Marketplace) and an expanded variant
(Yo-ID Wallet), built together (epic rule: two homes from the start).

### 2. Eligibility gate

Three checks run before the amount step. All three are enforced server-side before any payout record
or ZLTO reservation is created (YOM-1055, 2026-08-27 / 2026-09-01); the UI mirrors them so the user
never reaches a form that will be rejected.

⚠️ **Corrected 2026-09-09 against `PayoutService`. There are five checks, not three, and the
profile check is six fields, not just email.** The order below is the server's order, so the reason
the UI shows is the reason the API would have given. Implemented in `lib/payout/eligibility.ts`.

⚠️ **A sixth check landed 2026-09-16: the environment kill-switch** (`payout.enabled`, row 0b). It
is the server's *first* guard and the client's *second*, and that inversion is deliberate — see the
Decisions log.

| # | Check | Source | UI state |
| - | ----- | ------ | -------- |
| 0 | Active payout | profile `payout.active` | "You already have a cash out in progress" — **Continue cash out**. Checked first: the server never re-validates availability for an active payout |
| 0b | New cash outs enabled in this environment | profile `payout.enabled` | **Nothing at all** — the entry point renders no button. The gate copy exists as a backstop for the initiation race only |
| 1 | Profile complete — **email, first name, surname, country, gender, date of birth** | `ValidateUserProfileForPayout` | "Complete your profile to cash out" + the missing fields, primary to `/user/profile` |
| 2 | Provider reachable | profile `payout.countryAvailability.offline` | "Cash Out is temporarily unavailable" — follows the **wallet-offline pattern**; not an error. **Checked before `supported`**, as the server does: while offline, `supported` carries no information |
| 3 | Country supported | profile `payout.countryAvailability.supported` | "Cash Out isn't available in your country yet" — friendly, Close only |
| 4 | Reward wallet created | `zlto.walletCreationStatus === Created` | "Your wallet is still being set up" |
| 5 | Balance known and positive | `zlto.available` | `null` → "We can't check your balance right now"; `<= 0` → "You don't have any Zlto to cash out yet" |

`ValidateUserProfileForPayout` checks the resolved gender name; the profile only exposes
`genderId`, and a set id implies a resolved name. The client list uses the server's own field
wording so a fall-through server message does not read as a different problem.

`GET /api/v3/user/payout/countries` returns the live supported list and **HTTP 503** when the
provider is offline. The list is provider-owned and dynamic (18 corridors at the 2026-09-01 probe)
— **never hardcode it**. Availability is validated only before initiation; an active payout is never
re-checked, and the hosted provider remains the final authority if a corridor changes.

### 3. Payout journey

- Entry points: Marketplace wallet balance and Yo-ID Wallet — the Cash Out action lives on the
  ledger component in both variants.
- Amount entry against `available` — ZLTO already reserved must not be spendable again. Positive
  whole ZLTO; parse with `lib/format/amountInput.ts`. **Verified 2026-09-09**: the amount is a
  **query parameter** (`POST /user/payout/zlto?amount=`), not a body, and there is no request
  validator class — `PayoutService.PayoutRewards` throws directly. Its rules, in order: `amount > 0`,
  `decimal.Truncate(amount) == amount`, the six profile fields, country availability, wallet
  `Created`, then `walletBalance.Available >= amount`. The first five are the gate; only the last is
  a field error.
- Indicative preview via `GET /treasury/conversion/zlto-usd`, which returns
  `{ amount, currency, treasuryFundsAvailable }`. `ConvertZltoToUsd` locks the Treasury and ensures
  the FY, so preview and initiation agree. Label the USD figure as an estimate; rate reads
  `N ZLTO = 1 USD` via `formatConversionRate`. **`treasuryFundsAvailable: false` must surface as a
  distinct, friendly state — never as a validation error on the amount field.**
- Initiation via `POST /user/payout/zlto`. The response carries the hosted session; the URL is
  **HTTPS-only (server-enforced) and short-lived (≈30 minutes)** — navigate to it, never persist it.
  Validate the URL client-side too: PR #1924 already reports URL-redirect findings on web.
- Hosted-session creation is **not** a completed payout. Keep showing the payout as active while
  pending or processing, and read the terminal state from Yoma.
- Idempotency is by Yoma payout id on the provider side; a replay with a different amount returns
  conflict. A conflict on initiation means an active payout already exists — route to step 4.

### 4. Active payout and outcomes

Source: YOM-1052 / 1055 / 1057 decisions of 2026-08-27 and 2026-08-28.

- **One active payout per user.** When the profile carries an active payout, block a new Cash Out
  and offer a way back to the hosted journey.
- **`Active` is the only resumable state.** Show **Continue cash-out** only for an active,
  non-terminal payout; on tap, obtain a **fresh hosted URL from the session endpoint** and navigate.
  Never reuse a stored URL. **The route is `GET /api/v3/user/payout/zlto`** (recorded 2026-09-09) —
  returns `PayoutSession`, **404** when no active payout exists. `profile.payout.active` is derived
  server-side from `amount`, so it and the 404 are the same fact from two directions.
- `Completed` is final — no resume action, even though the provider can technically reopen a
  completed session.
- **Payout states — read from the branch 2026-09-10** (`Payout/Enumerations.cs`,
  `PayoutTransactionStatus`), in declaration order:

  | Status | Terminal? | Note |
  | ------ | --------- | ---- |
  | `Initiated` | no | recorded by Yoma, not yet accepted by the provider — **no hosted session exists yet** |
  | `Processing` | no | provider accepted it; awaiting an outcome |
  | `ReconciliationRequired` | no | **the fifth status the plan did not have.** Window elapsed or an ambiguous outcome; stays active and the reservation must not be released |
  | `Completed` | yes | provider confirmed success |
  | `Failed` | yes | could not be initiated, or confirmed unsuccessful |
  | `Cancelled` | yes | stopped before completion by the user, Yoma or the provider |
  | `Expired` | yes | the provider's processing window elapsed |

  `PayoutService.Statuses_Active` is `[Initiated, Processing, ReconciliationRequired]` — that trio
  is what `profile.payout.active` means.

  **Superseded 2026-09-11:** the note here said none of these names reaches the youth UI. The API
  now sends `status` on the profile (active payouts only) and on `GET /user/payout/latest`, so the
  four terminal names drive Flow D directly. ⚠️ The one claim the UI still may not make is *which
  kind of in-progress* a payout is in: **`Processing` begins when the hosted payout is created, not
  when the youth confirms it**, so the active trio is presented as one neutral "in progress" and
  `canResume` decides only what is offered. Statuses arrive as **PascalCase strings**, not ordinals.
- Timings for copy: unconfirmed payout resumable for 24 hours; once confirmed it cannot expire and
  reaches terminal within ≈6 hours at worst; ZLTO reservation is the 30-hour safety net. Say
  "this can take a few hours", never a guarantee.
- Return-from-provider view reads the payout from Yoma and renders one of: still processing,
  completed (ZLTO deducted), cancelled/expired (ZLTO back in wallet, neutral tone), failed (ZLTO
  returned, neutral tone — the user did nothing wrong). An ambiguous outcome keeps the payout active
  on the API side until reconciliation resolves it; the UI shows "processing" for that case.

## Design (claude.design)

Static mockups, produced in a claude.design session before build. Fidelity decision 2026-09-08:
**static mockups of every state, not a clickable prototype.** Visual language: basic Tailwind CSS +
daisyUI, extending the existing Marketplace surface — sky-blue hero band, Nunito headings, white
pill buttons, amber ZLTO badge with the Z coin, white 16px-radius dialogs with the grey circular
close control, light blue-grey info panels, purple outline/primary buttons. No new palette.

### Session prompt (paste as-is)

> You are designing static mockups for Yoma, a youth opportunities web platform built with
> Next.js, Tailwind CSS and daisyUI. Reuse Yoma's existing look: sky-blue hero band, rounded
> Nunito headings, white pill buttons, amber ZLTO badge with a Z coin icon, white dialogs with
> 16px radius and a grey circular close button, light blue-grey info panels, purple
> outline/filled buttons. Mobile first; every screen must also work at desktop width. Produce one
> canvas, artboards grouped by flow, desktop dialog (520px wide) and mobile bottom sheet (390px)
> for Flows B–D, desktop only for Flow A.
>
> Hard rules. (1) Never name, brand or hint at the payout provider — say "secure payout partner".
> (2) The user action is "Cash Out"; never "payout", "withdraw", "redeem" or "off-ramp" in copy.
> (3) ZLTO is a whole number; USD is two decimals with a leading `$`; an unavailable figure renders
> as an em dash, never blank, never 0. (4) The rate reads "N ZLTO = 1 USD" and the USD figure is
> always labelled estimated. (5) No form asks for bank, card, mobile-money or identity details.
> (6) No transaction history for the young person. (7) Visible focus states, labels bound to
> inputs, error text bound to the field, colour never the only signal, 44px minimum touch targets.
>
> Flow A — Wallet ledger. One component, compact variant (Marketplace hero) and expanded variant
> (Yo-ID Wallet card). Rows carry information or drop out; order never changes: Balance ·
> −Pending cash out · Available (always shown, the primary figure) · +Pending rewards · Total.
> Balance and −Pending cash out appear only when a cash out is in flight; +Pending rewards and
> Total only when rewards are pending. The common case is a single Available row. A dotted subtotal
> rule sits above each derived position (Available, Total) and nowhere else, so it reads as
> arithmetic; digits are tabular. Hero labels and values full white, no opacity; hierarchy by weight
> and size. States (nine): single row; pending rewards only; pending cash out only; both; offline
> with a cash out in flight ("—" around a live movement, calm notice, Cash Out disabled); offline
> with nothing in flight (one "—"); known zero (Cash Out disabled, helper text); active cash out
> (status pill "Cash out in progress", button becomes "Continue cash out"). Every hero button is the
> product's white rounded-full pill with the blue-dark border; amber is the ZLTO asset colour and is
> never an action. The Cash Out button lives on this component.
>
> Flow B — Cash Out dialog. B1 eligibility gate, seven blocking states in server order, silent when
> eligible: (0) "You already have a cash out in progress" — primary "Continue cash out"; (1)
> "Complete your profile to cash out" with the missing fields listed (from email, first name,
> surname, country, gender, date of birth), primary to profile; (2) "Cash Out is temporarily
> unavailable" — calm, Close only, no spinner; (3) "Cash Out isn't available in your country yet" —
> friendly, Close only; (4) "Your wallet is still being set up"; (5a) "We can't check your balance
> right now"; (5b) "You don't have any Zlto to cash out yet". Titles are fixed; body copy under each
> is a draft owned by the copy sheet. B2 amount entry: Available ZLTO as the ceiling, numeric input with "Max", live
> "Estimated: $X.XX" with the rate line, "Continue" and "Cancel". States: empty (preview "—");
> valid; above-available field error; preview loading (skeleton on the USD figure only); funds
> paused — NOT a field error, a friendly panel: "Cash Out is paused for now. Yoma's cash-out funds
> for this period have been used up. Your ZLTO is safe and you can try again later.", Continue
> disabled, no red field. B3 review: amount, estimate, rate; "You'll continue to our secure payout
> partner to finish. This may take a few minutes. Your ZLTO will be held while your cash out is
> processed."; note the estimate may differ; "Continue to cash out" / "Back". B4 hand-off:
> "Preparing your cash out…" spinner, then a blocked-popup fallback: "If nothing opened, use the
> button below" with "Open cash out". B5 failures: "We couldn't start your cash out. Nothing has
> been taken from your wallet." with "Try again" / "Close"; conflict variant "You already have a
> cash out in progress" with "Continue cash out".
>
> Flow C — Active cash out. Panel with amount, estimate and a status line: "Waiting for you to
> finish" (resumable; primary "Continue cash out" that fetches a fresh link on tap, with a loading
> state on the button) or "Processing" (no action; "This can take up to several hours. Your wallet
> will update automatically."). Interstitial when a second Cash Out is attempted: "You can have one
> cash out at a time. Finish or wait for your current cash out first." Link-fetch failure: inline
> error "We couldn't open your cash out right now. Please try again in a moment." with retry.
>
> Flow D — Return from the partner. One return screen, four variants, never assuming success:
> still processing ("Thanks — your cash out is being processed. This can take a few hours. We'll
> update your wallet when it's done."); completed (success treatment, ZLTO and USD amounts, "Your
> ZLTO has been deducted."); cancelled or expired (neutral: "Your cash out was cancelled. Your ZLTO
> is back in your wallet.", secondary "Start a new cash out"); failed (neutral: "Your cash out
> didn't go through. Your ZLTO has been returned to your wallet.", secondary "Try again"). Plus a
> compact toast variant of each outcome.
>
> Deliverables: the canvas; a components sheet (ledger row, status pill set, paused panel, gate
> panel, review summary, outcome card); a copy sheet listing every user-facing string; a
> one-sentence trigger annotation on each state. Do not invent a provider name, add youth
> transaction history, add a rewards "available" figure, or show the estimate as guaranteed.

### State → contract map (for build, not for the design session)

| Design state | Source |
| ------------ | ------ |
| Flow A offline / zero / active | `UserProfileZlto` nullability (`08cb6c10a`); active payout on the profile |
| B1 gate (7 states) | `lib/payout/eligibility.ts` — profile `payout.countryAvailability { supported, offline }`, the six profile fields, `zlto.walletCreationStatus`, `zlto.available`, `payout.active`. `GET /api/v3/user/payout/countries` (503 → `null`) is for *listing* corridors, not for gating — the profile already carries the answer for the youth's own country |
| B2 preview / paused | `GET /treasury/conversion/zlto-usd` → `{ amount, currency, treasuryFundsAvailable }`; `false` = paused state |
| B4 hand-off, B5 failures | `POST /user/payout/zlto`; HTTPS-only hosted URL; conflict = active payout exists |
| C resumable / processing | `profile.payout { active, status, canResume, amount, currency, dateCreated }` + `zlto.pendingPayout` (reserved ZLTO); session refresh via `GET /api/v3/user/payout/zlto` → `PayoutSession { amount, currency, paymentUrl, expiresAt }`, 404 when none. `canResume` decides what is offered; the two in-progress states are still **not worded apart** (`Processing` precedes confirmation) |
| B4 hosted journey | `PayoutSession.paymentUrl` used verbatim, fragment token and all, as an **iframe `src`** inside Yoma. Closing the modal cancels nothing |
| D outcomes | `GET /api/v3/user/payout/latest` → `PayoutTransactionInfo { status, amount, currency, dateCreated, canResume }`, 404 when the youth has no payout. Read on closing the hosted modal. **Never** inferred from the wallet |

Figures on the artboards are sample values (rate 120 ZLTO = 1 USD); status names in Flows C–D
are configuration until the enum is read. The longer standalone brief, including the YOM-1072
admin payout-history surface (Flow E), is `design-brief-claude-design.md` in this folder.

### Design review — 2026-09-09 (first three artboards)

Reviewed: Flow A compact (both pendings), and B2 paused at desktop dialog + mobile sheet. The
ledger reconciles (1,640 − 400 = 1,240; 1,240 + 150 = 1,390), the dialog checks against
`available` (1,240) rather than `total` (1,390), paused renders as a panel and not a field error,
and the hero copy is the live product's verbatim. Carry these into the remaining artboards:

- **The amber filled Cash Out CTA is off-brief.** Every button on the live hero is a transparent
  `rounded-full` pill with `!border-blue-dark` (`Marketplace.tsx`); amber is the ZLTO *asset*
  colour, so spending it on an action blurs asset and action. Prefer a white-filled pill.
- **Keep hero labels at full white.** The artboard tints them; the sky-blue band is already the
  lowest-contrast surface in the product. The built ledger carries hierarchy by weight and size and
  uses **no opacity** in the compact variant — match that.
- **Stepper step 3 "Finish" is a promise Yoma cannot keep**, since 2→3 crosses the hand-off and
  hosted-session creation is not completion. Either relabel, or have the Flow D return view render
  as step 3 so the indicator resolves.
- **Disabled Continue reads as "working"** in muted purple — it must not look like B4's real
  loading state.
- Paused icon differs between desktop (ring) and mobile (pause glyph); the mobile one is right.
- The mobile sheet has ~150px of dead space above Continue; a content-height sheet sits better.

Still to draw: Flow A offline / zero / active / no-pendings; all three B1 gates; B2 empty, valid,
above-available and preview-loading; B3; B4 plus blocked-popup; both B5 failures; all of C; all of
D plus toasts.

**Applied 2026-09-10.** All six corrections applied at the primitive level, so every board carries
them: white hero pills (blue-dark border), full-white hero ledger with no opacity, stepper step 3
relabelled **"Result"** with the Flow D return views rendering step 3 resolved, daisyUI disabled
look on `Continue` (grey fill, grey text — cannot be read as B4's loading state), pause glyph on
both breakpoints, content-height mobile sheets. The "still to draw" list is complete. **Flows A and
B1 were redrawn against the 2026-09-09 decisions**: Flow A is nine information-only-row states with
subtotal rules and tabular digits; B1 is the seven gate states in `PayoutService` order with the
titles from the gate table above. The separate "one cash out at a time" interstitial was dropped —
gate state 0 is that screen; B5's conflict variant is kept for the initiation race. 39 artboards.
Flow C shows no `expiresAt` on the resume panel by design; add "link valid until HH:MM" only if
wanted.

## In-app browsers (webviews) — deferred detection

**Decision, 2026-09-21 (owner): rely on the fallbacks; do not detect.** This section exists so the
option is recorded properly rather than rediscovered, and so nobody writes the naive version.

### The problem

IXO do not support the embedded flow inside in-app browsers — *"we do not support the embedded flow
there and I would not try"* (2026-09-21). Those webviews block or mangle new windows, and **some
replace the whole view with the sign-in page, destroying the iframe**. So it is not simply a blocked
popup with a graceful message: the frame can vanish underneath the youth, which means the "Open in a
new window" control sitting beneath it may not be there to use.

IXO's supported path is the **standalone page** — the same `paymentUrl`, opened *top-level*, where
their page uses a full-window redirect and never pops.

### What a webview is

A web page rendered by a native app through the platform's embedded web component — `WKWebView` on
iOS, `android.webkit.WebView` on Android — inside the app's own interface. There is no address bar,
the host app controls navigation, and the user never leaves that app.

**What is *not* a webview, and must never be treated as one:**

- Standalone browsers — Safari, Chrome, Firefox, Samsung Internet, Edge.
- **Chrome Custom Tabs (Android) and `SFSafariViewController` (iOS).** These open *over* an app and
  look much the same to a user, but they are the real browser: they share its storage, honour its
  popup behaviour and support `window.open` normally. Apps increasingly use these instead of a raw
  WebView. They are also largely indistinguishable from the standalone browser by User-Agent — which
  is fine, because they need no special handling, and a detector that caught them would push working
  users off the supported path for nothing.

The problem set is the apps that still embed a raw WebView and intercept navigation: Facebook,
Messenger, Instagram, WhatsApp, TikTok, Snapchat, LinkedIn, X/Twitter, WeChat, Line, Pinterest.

### How it would be detected, and why that is fragile

Host apps append a token to the User-Agent:

| App                  | Token(s)                          |
| -------------------- | --------------------------------- |
| Facebook / Messenger | `FBAN`, `FBAV`, `FB_IAB`          |
| Instagram            | `Instagram`                       |
| WhatsApp             | `WhatsApp`                        |
| TikTok               | `BytedanceWebview`, `musical_ly`  |
| LinkedIn             | `LinkedInApp`                     |
| Snapchat             | `Snapchat`                        |
| X / Twitter          | `Twitter`                         |
| WeChat               | `MicroMessenger`                  |
| Line                 | `Line/`                           |
| Android, generic     | `; wv)`                           |

Four reasons this decays:

1. **The tokens are conventions, not standards.** Apps add, rename and drop them; Facebook has
   changed its set more than once. The list is an allowlist of known offenders that rots.
2. **`; wv)` is the only near-standard signal, and it is Android-only** — and an app can replace the
   User-Agent string outright.
3. **iOS offers no reliable generic signal.** A `WKWebView` reports essentially Mobile Safari's
   User-Agent. The usual heuristic — a Mobile Safari string missing the `Safari/` token — both
   misfires on legitimate browsers and misses apps that leave the token in place.
4. So detection will always have false negatives, and its false *positives* are the expensive ones:
   sending a youth on a perfectly good browser out of Yoma for no reason.

### What a positive match would do

Not render the iframe at all, and navigate top-level with `window.location.assign(paymentUrl)` —
**not** `window.open`, which is the thing that does not work there. That takes the youth out of Yoma
entirely, which the epic's iframe directive otherwise forbids, so it needs sign-off as a deliberate
exception rather than arriving as an implementation detail. Return is the youth navigating back; the
recovery is the resume path that already exists.

### Why it is deferred, and what would change the answer

The fallbacks cover it manually today — ours below the frame, and the link IXO render inside their
own page when a popup is refused. Against that, detection is fragile, its failure mode is
user-visible, and **there is no evidence yet of how often this actually bites.**

That evidence is obtainable without building anything: the User-Agent is on the initiate request, so
payouts that are started and never completed can be bucketed by webview token. Revisit if abandoned
payouts turn out to concentrate there — Yoma's social referral traffic makes that plausible, which is
why this is written down rather than dismissed.

## Tasks

- [x] **Design pass** — 39 artboards drafted and redrawn against the 2026-09-09 decisions,
      delivered 2026-09-10. Superseded 2026-09-14 by a review of the **built** flow (all 31 states,
      via `/dev/cash-out`): [`design-review-2026-09-14.md`](./design-review-2026-09-14.md).
- [x] **Copy sheet** — [`copy-sheet.md`](./copy-sheet.md), every user-facing string, applied
      2026-09-14. Two decisions were the owner's ("Check", "Use all"); three were settled from the
      API code; one string and the toasts were deliberately not applied. The header of the sheet
      records each.

- [x] **Wallet ledger** — `components/Rewards/ZltoLedger.tsx`, compact + expanded variants, wired
      into the Marketplace hero and the Yo-ID `WalletCard`. Model updated to the verified server
      contract; the old field was deleted in the same change and `tsc --noEmit` is clean.
- [x] **Eligibility gate** — `lib/payout/eligibility.ts` (all five server checks, in the server's
      order) + `components/Payout/CashOutGate.tsx` (seven blocking states). `UserProfilePayout`
      corrected to the real contract; `listPayoutCountries` in `api/services/payout.ts` resolves
      **503 → `null`** rather than throwing. **Not yet reachable** — the entry point lands with T5,
      so it is not wired to a button.
- [x] **T5** — amount entry (`lib/payout/amount.ts`), indicative conversion preview, payout
      initiation via `POST /user/payout/zlto?amount=`, HTTPS-validated hand-off to the hosted URL.
      `components/Payout/` + `lib/payout/`, wired into both surfaces.
- [x] `treasuryFundsAvailable: false` as its own state, not a field error — and the same condition
      arriving *from the POST* ("There are insufficient funds available…") renders the same panel.
- [x] **Active-payout state** — the entry point becomes **Continue cash out** and opens
      `CashOutResumePanel`, which fetches a fresh session **on tap**. A second Cash Out cannot be
      started (the gate's `activePayout` copy is the panel's notice for the initiation race).
- [x] **Outcome states** — unblocked by `GET /user/payout/latest` (API 2026-09-10) and built:
      completed, cancelled, **expired (worded distinctly)**, failed, plus neutral in-progress and
      still-setting-up. Read from the recorded status only, never inferred from the wallet. Toast
      variants are still not built — the outcome belongs inside the journey, not as a banner that
      re-announces an old payout on every visit (API guidance).
- [x] **Hosted journey embedded** — iframe modal inside Yoma rather than a new tab (API directive),
      with the "open in a new window" escape hatch for providers or browsers that refuse framing.
- [x] Entry points on both the Marketplace wallet and the Yo-ID Wallet.
- [x] Per-field server-error mapping for the payout request (`lib/payout/serverErrors.ts`) —
      every pattern quotes the verbatim server string it matches.
- [x] Payout status enum names — read and recorded below.
- [x] Session-endpoint route recorded: `GET /api/v3/user/payout/zlto`.
- [x] **API asks raised by T5 — all four delivered 2026-09-10** (Adrian): payout `status` and
      `canResume` on `UserProfilePayout`, `GET /user/payout/latest` for outcomes,
      `conversionRateZltoPerUsd` on the conversion preview, and `dateCreated` for "Started". Wired
      up 2026-09-11; the rate *inference* is deleted.
- [ ] **Session-backed pass on Dev** — the interactive half (typing, `Max`, 1 → 2 → 3, a real POST,
      the iframe against the real provider). Test wallet funded with 2,000 ZLTO on
      `jason.dicker@didx.co.za`; needs a browser login, so it cannot run headless here.
- [ ] **Framing works for the payment page, not for the hosted sign-in** (Dev, 2026-09-11). The
      `/pay` response sets no `X-Frame-Options` and no framing CSP, but the sign-in it redirects to
      sets `frame-ancestors` without Yoma's origin, so a **returning** youth gets a blank frame.
      Needs IXO to allowlist Yoma's origins, or the iframe becomes a new window.
- [ ] **Blocked on the API: the provider rejects Yoma's gender values** — the hosted verification
      step wants `male | female | other` and Yoma sends `Male` / `Female` / `Prefer not to say`
      untouched. Blocks the hosted journey for every user; nothing on the UI side can affect it.

## Decisions

<!-- Append-only. Date each entry. Epic-wide decisions live in ../README.md -->

- **2026-08-05: `total` semantics corrected.** `total = available + pendingRewards`; it has
  **never** included `pendingPayout`. An earlier note claiming otherwise was wrong and is retracted
  — `4bfeb55c` was written against the incorrect reading, so anything branching on `total` needs
  re-checking.
- **2026-08-05: renames in the profile payload break at runtime, not compile time.**
  `UserProfileZlto.Pending` → `PendingAwards`/`PendingPayout` crashed `WalletCard` and `Marketplace`
  with `undefined.toLocaleString()` because the TS interface still declared the old field. Fixed in
  `4bfeb55c`. **Mitigation for the pending `pendingAwards` → `pendingRewards` rename: delete the old
  field from the interface in the same change.** The general rule is in the epic's Cross-Area Notes.
- **2026-08-11: the wallet nullability change is `08cb6c10a`** — the missing SHA that had this
  ticket's first task waiting on an assumption. `Balance`, `Available` and `Total` are nullable while
  ZLTO is offline; `pendingRewards` and the Yoma-recorded `pendingPayout` stay populated, which is
  exactly the "branch on `null`, not on `zltoOffline`" contract above. Verify the field-by-field
  types against that commit before writing the ledger, not against this table.
- **2026-08-05: T5 retitled "Youth Payout".** The API-wide "cash-out" → "payout" rename
  (`e5209d6c` + `df675be4`) is a vocabulary change, not a neutrality fix. **"Cash Out" remains the
  user-facing action**; the internal contract is `payout`.
- **2026-09-08: scope extended to match the code-complete API.** The pre-August plan stopped at
  initiation. The API now exposes an active payout on the profile, an on-demand session refresh,
  live country availability and terminal outcomes (YOM-1055/1057/1059, 2026-08-27 → 2026-09-01), so
  eligibility gating, active-payout resume and outcome states are in this ticket rather than a
  follow-up. The mocked-seam plan is obsolete; build against the real endpoints.
- **2026-09-08: no youth-facing notifications in this ticket.** Provider notification behaviour is
  an open question on the epic; in-app states only until Yoma Business decides.
- **2026-09-08: design fidelity is static mockups, styled with basic Tailwind/daisyUI** extending
  the existing Marketplace look. No clickable prototype; no new palette. The session prompt lives
  in this document so the design and the contract are reviewed together.
- **2026-09-09: the ledger contract was verified against the branch, not this document, and the
  two agree.** `src/api/.../Entity/Models/UserProfileZlto.cs` on `feature/custom-fields-framework`
  has `Balance`/`Available`/`Total` as `decimal?`, `PendingRewards`/`PendingPayout` as `decimal`,
  in that order. `WalletBalance.Total => ZltoOffline == true ? null : Available + Pending`, so the
  three provider-derived figures genuinely do go `null` together. `08cb6c10a` is an ancestor of
  HEAD, so the web change and the API it needs ship on the same branch. The TS interface now
  mirrors the C# field-for-field.
- **2026-09-09: the five row labels live in `ZltoLedger`, not in `lib/format/rewards.ts`.** The
  frozen convention puts shared label vocabulary in that module because *different* components
  render the same figure and drift. Here one component is the only renderer of all five rows on
  both surfaces, so it is already single-source; a second home would add indirection without
  removing a drift risk. Number *formatting* still goes through `formatZlto` as required.
- **2026-09-09: prose says "Zlto", the unit says "ZLTO".** The live product is inconsistent —
  `Marketplace.tsx` says "My Zlto balance" and "What is Zlto?", `WalletCard` says "**ZLTO** - Your
  digital wallet…" — and the ledger appears next to both. Rule for this flow: sentence-case *Zlto*
  in prose, caps *ZLTO* for the unit and image alt text. The mockups already follow it. The
  `WalletCard` description line above the ledger still says "ZLTO" in prose and was left alone as
  copy churn outside this task; it is the one visible exception.
- **2026-09-09: the Marketplace hero now shows the full five-row ledger.** It previously showed
  three figures and deliberately hid `pendingPayout` because "the header is about what can be
  spent". Cash-out invalidates that: a reservation leaves `available` immediately, so hiding it
  made the balance look like it had simply dropped.
- **2026-09-09: buying on the Marketplace gained a "Balance unavailable" state.** With `available`
  nullable, `null < item.amount` is `true` in JS, so an offline wallet would have told a youth with
  plenty of ZLTO they had insufficient funds. `marketplace/[country]/index.tsx` now checks for a
  *known* balance first and says so plainly; the analytics event is `marketplace_balance_unavailable`.
- **2026-09-09: the Yo-ID wallet card is `min-h-[185px]`, no longer `h-[185px]`.** Five rows plus
  the offline notice exceed the fixed dashboard-card height. A card taller than its neighbours is
  better than a clipped money figure.
- **2026-09-09: the ledger shows only rows that carry information — a movement brings its own
  partner position.** This supersedes "five rows in fixed order" in the design brief. `balance` and
  `total` are `available` ± a movement, so when that movement is zero they are *the same number as
  `available`*: a wallet with nothing in flight was rendering one figure three times under three
  labels. Now `balance`/`−pending cash out` appear only when `pendingPayout != 0`, and
  `+pending rewards`/`total` only when `pendingRewards != 0`; `available` is always shown. The order
  never changes, rows only drop out. Consequence: the common case is a **single row**, which is what
  let the Marketplace hero shrink. Offline is unaffected — movements are Yoma's own record and keep
  their values, so a payout in flight still shows with em dashes around it. Confirmed in a browser
  across all seven states.
- **2026-09-09: accounting subtotal rules, not uniform dividers.** A dotted rule sits above each
  derived position (`available`, `total`) and nowhere between a position and the movement acting on
  it, so the ledger reads as arithmetic rather than as a list. Values are `tabular-nums` so digits
  sit in fixed-width cells and the column does not bend.
- **2026-09-09: `UserProfilePayout` was stale in exactly the way the epic keeps warning about.**
  The web interface declared `{ pending, info }`; the API has
  `{ countryAvailability, active, amount, currency }` with `active` derived from `amount`. Nothing
  read it yet, so nothing was broken — but the gate would have been the first reader. Also
  `PayoutInfo` no longer exists server-side: `POST` and `GET /user/payout/zlto` both return
  `PayoutSession { amount, currency, paymentUrl, expiresAt }`, with `paymentUrl` non-nullable and a
  new `expiresAt`. Both renamed on the web side.
- **2026-09-09: `503` from `/user/payout/countries` resolves to `null`, not an exception and not
  `[]`.** "We cannot determine availability" and "the provider supports nothing" are different
  answers and must not collapse into one. `axios` `validateStatus` treats 503 as data.
- **2026-09-09: measured hero contrast — white on `--color-blue` `#4cade9` is 2.48:1.** That fails
  AA for any text size, and it is a pre-existing property of the whole hero band (every white label
  on it today), not something this ticket introduced. The compact ledger therefore uses **no
  opacity** — tinting would only make it worse. Fixing it properly means darkening the band (
  `--color-blue-dark` `#2487c5` measures 3.93:1) or putting a scrim behind the text, which is a
  brand decision outside this ticket. **Raised, not fixed.**
- **2026-09-09: `gl-icon-yellow` is a dead class.** Three components style warning icons with it
  and there is no CSS rule anywhere for it, so those triangles render in inherited grey. New code
  sets `text-orange` explicitly; the three existing uses are untouched.
- **2026-09-09: `PageBackground` gained a wrapper mode, and the Marketplace hero uses it.** The
  band was an absolutely positioned `h-80` sitting *behind* the page, so its 320px and the hero's
  real height were two independent numbers — which is unworkable here, because the ledger grows and
  shrinks with the wallet's state. The results grid ended up straddling the blue/white boundary.
  Passing `children` now puts the band in normal flow so **its height is its content's height**:
  the hero owns the blue, and "Filter by"/results sit on the page background below it. `pt-20`
  inside the band (not a margin above it) keeps the blue running behind the fixed navbar.
  **Overlay mode is unchanged** — all 21 other callers keep the band they have, including the
  hand-measured heights (`h-[14.3rem] md:h-[18.4rem]`, `h-[341px]`, `h-[310px]`) that are the
  symptom of the same problem. Verified in a browser on `/marketplace/WW` (band ends exactly at the
  hero, results fully outside it) and on `/opportunities` (overlay caller, no regression).

- **2026-09-10: the payout status enum is read (table in Plan §4) and it settles Flows C and D by
  telling us what the youth cannot be shown.** `UserProfilePayout` is
  `{ countryAvailability, active, amount, currency }` — **no status** — and there is no youth-facing
  payout record anywhere in `UserController`. Two consequences, both load-bearing:
  - **C1 vs C2 cannot be distinguished.** The board draws "Waiting for you to finish" against
    "Processing"; `active` is one boolean covering `Initiated`, `Processing` and
    `ReconciliationRequired`. So the resume panel shows **no status line**, offers the way back in,
    and lets the *session fetch* answer the question: a session means resumable, the
    `"provider session is not yet available"` refusal means processing, a 404 means it closed.
    **Amended the same day, after rebasing onto API `8d34eee7`** (`fix: harden cash-out initiation
    recovery`, 2026-09-09): reconciliation now retries provider initiation whenever `TransactionId`
    is empty — including from `ReconciliationRequired` — so the middle case is a *wait*, not a dead
    end. A payout with no session acquires one within a reconciliation cycle, so that state now
    offers **Try again** and says "We're still setting up your cash out. Try again in a few
    minutes", where it previously offered Close and said "being processed". It also **drops the
    "Pick up where you left off" invitation**, which is why `CashOutResumePanel` separates
    `invitation` from `canContinue`: there is something worth retrying but nothing to pick up until
    the session exists.
  - **D2/D3/D4 are not built.** Completed, cancelled/expired and failed are indistinguishable from
    here, and the difference is whether someone's money arrived. The wallet cannot be used to infer
    it either (a commit and a release both leave `pendingPayout` at 0). Step 3 therefore renders the
    honest state — "being processed" — and the four outcome cards wait on the API.
- **2026-09-10: the conversion rate is not on the youth contract, so the "N ZLTO = 1 USD" line is
  *inferred* — and suppressed when it cannot be.** `Treasury.ConversionRateZltoUsd` is `[JsonIgnore]`
  and `conversionRateZltoPerUsd` lives on admin-only `TreasuryInfo`; all a youth can see is
  `{ amount, currency, treasuryFundsAvailable }` with `amount` **rounded to 2dp**. Dividing naively
  makes the rate wobble as they type (at 45 ZLTO = 1 USD, 1,000 ZLTO → $22.22 → 45.0045), and a rate
  that moves while a money figure is being entered reads as a bug. `lib/payout/conversion.ts`
  instead takes the interval the rounding leaves and shows the rate only at a precision **both ends
  agree on**, dropping the line when even a whole number cannot be established. Verified numerically
  against the server's own rounding: at the seeded 45 the line is a stable "45" for every amount from
  45 ZLTO up, and absent below ~$1, where the rate genuinely is not knowable. **A workaround for a
  gap, not a design** — put the rate on `ConversionResponse` and the module goes away.
- **2026-09-10: the entry point owns the flow's state, deliberately against "the page owns
  fetching".** That rule was written for the admin surfaces, where one page owns one dataset. This
  entry point has no page: its two homes are a *layout* (`Layout/Marketplace`) and a dashboard *card*
  (`YoID/WalletCard`) rendered by different pages. Lifting the orchestration would copy a
  money-moving state machine into three places, which is the drift the rule exists to prevent. So
  `components/Payout/CashOutEntry.tsx` owns it once and every step component stays prop-driven.
- **2026-09-10: the compact hero renders the entry point in its pill row, not in `ZltoLedger`'s
  `actions` slot; the wallet card uses the slot.** The slot renders inside the ledger's own column,
  which the hero's 56px coin offsets from centre, and it would separate the primary action from the
  two pills it belongs beside (boards A1/A4 put it in that row). The guarantee the slot was there to
  give — one implementation, no per-surface drift — is carried by `CashOutEntry` instead: each host
  passes nothing but `variant`.
- **2026-09-10: the button is disabled for exactly the two block reasons the ledger already shows,
  and opens the gate for the other five.** `balanceUnknown` (em dashes plus the offline notice) and
  `nothingAvailable` (a visible zero) get a disabled button with a helper line, as A3/A7 draw:
  offering an action the figure on screen contradicts is what disabling is for. The other five
  reasons are invisible on the ledger, so the button stays live and the gate explains — a disabled
  button with no stated reason is a dead end.
- **2026-09-10: every user-facing string lives in `lib/payout/copy.ts`,** including the seven gate
  bodies moved out of `CashOutGate`. The copy sheet is still owed and none of this wording is signed
  off; the reviewer has to be able to read the flow in one file. Tone and layout stay in the
  components.
- **2026-09-10: an active payout goes to `CashOutResumePanel`, not to the gate's `activePayout`
  screen, and `CashOutGate`'s `onContinueCashOut` prop was removed.** The panel shows what is in
  flight (reserved Zlto from `zlto.pendingPayout`, value from `payout.amount` — **USD, not Zlto**)
  and owns the busy and retry states the fetch-on-tap needs; the gate had a bare button and no way
  to report a failed fetch. The gate's copy is reused as the panel's notice for the initiation race,
  so nothing is orphaned.
- **2026-09-10: the amount field is a controlled string + `parseCashOutAmount`, not
  react-hook-form + zod.** The frozen validation pattern exists for the admin pool forms, where a
  schema factory closes over server cumulatives for cross-field floors. Here there is one field,
  one ceiling and a live preview; a resolver would add indirection without removing a drift risk,
  and `lib/payout/amount.ts` cites the C# it mirrors line by line. Per-field server errors still
  follow the `serverErrors.ts` pattern.
- **2026-09-10: the server strings are read, and two of the amount rules are 500s, not 400s.**
  `ArgumentOutOfRangeException` (amount ≤ 0) and `ArgumentException` (fractional) are unmapped by
  `ExceptionResponseMiddleware`, so they would reach a youth as a 500 with an internal message —
  hence the client guards. Mapped in `lib/payout/serverErrors.ts`: `"A payout is already in
  progress"` → resume; `"There are insufficient funds available to complete this payout"` → **paused
  panel** (Treasury capacity, the preview's condition arriving a moment later, *never* a field
  error); `"Insufficient reward balance for payout…"` → the one field error;
  `"Complete the following profile information before cashing out: …"` and `"…your country is not
  specified"` → profile gate; `"…currently unavailable; please try again later"` → provider offline;
  `"…currently unavailable in {country}"` → country; `"The reward wallet is not ready for payout"` →
  wallet; `"The payout provider session is not yet available"` → nothing to resume;
  `"No active payout exists for the current user"` / 404 → no active payout.
- **2026-09-10: a rejected amount shows no figure.** "Insufficient reward balance" means the ledger
  on screen was stale, so quoting its number would contradict the refusal, and the server's own
  message says "payout" — which copy may not. The field says "That's more than you have available to
  cash out right now" and the profile is refetched so the ledger corrects itself behind the dialog.
- **2026-09-10: there is no provider redirect back into Yoma** — nothing in `PayoutRequest` or the
  Yellow Card client carries a return URL. So the hosted journey opens in a **new tab**
  (`noopener,noreferrer`) and the "return view" is this tab regaining visibility after losing it.
  Requiring it to have been hidden first is what keeps a *blocked popup* on the hand-off screen,
  where the button that opens the journey still is. One screen covers opened and blocked, because
  the round trip puts `window.open` outside the youth's tap and the browser will not tell us which
  happened — and by then the Zlto is reserved, so "nothing happened" is the one reading to avoid.
- **2026-09-10: the dialog is content-height on desktop (`md:h-fit`) and stays the product's
  full-screen modal on mobile.** `CustomModal`'s box is `fixed inset-0`, so without `h-fit` the
  amount step sat above ~250px of empty white — the dead-space note from the design review. The
  boards draw a mobile bottom sheet; every other dialog in the app is full-screen on mobile, and
  matching the product beats matching the board here.
- **2026-09-10: daisyUI's disabled look is right on white and wrong on the hero band.** Measured in
  a browser: `btn-disabled` on `--color-blue` renders pale-grey-on-blue with the label barely
  readable. The compact variant uses a translucent white pill with `text-gray-dark` instead; the
  expanded variant keeps daisyUI's own look, which is what A7 draws.
- **2026-09-10: the resume panel drops its "Pick up where you left off" invitation when there is
  nothing to continue.** Caught in the browser pass: the panel was inviting the youth to continue
  directly above a notice saying the payout was already processing, with no button between them.
- **2026-09-10: board A7's zero-balance wallet card is not built as drawn.** The live `WalletCard`
  answers a known-zero, nothing-in-flight wallet with its existing "You will receive ZLTO for
  completing opportunities" empty state, which is better for a youth who has never earned. The
  disabled Cash Out plus helper line therefore appears when `available` is zero but something else
  is in flight. Changing that empty state is copy churn outside this task.

- **2026-09-11: `WalletCreationStatus` was a numeric TS enum, and the gate would have refused every
  youth in the product.** The API serialises every enum as its **PascalCase name** (`Startup.cs`
  registers a strict string enum converter; the Swagger schema says `"type": "string"`), so
  `walletCreationStatus` arrives as `"Created"` while `WalletCreationStatus.Created` was `2`.
  `"Created" !== 2` is always true, so **every** profile failed the wallet check and Cash Out was
  unreachable behind "Your wallet is still being set up". The enum was also missing
  `PendingUsernameUpdate`, so its ordinals were wrong anyway. Now a string enum mirroring the C#.
  Two lessons worth keeping: the rest of this codebase already reads these fields as strings
  (`item.status === "Active"`), and a numeric TS enum against this API is a latent bug wherever it
  appears. **Caught by reading the Swagger schema, not by `tsc`** — nothing about it fails to
  compile, and only a logged-in session would have shown it.
- **2026-09-11: all four API asks landed, so the workarounds are deleted rather than kept.**
  `profile.payout` now carries `status`, `canResume` and `dateCreated`; `GET /user/payout/latest`
  returns the outcome; the conversion preview carries `conversionRateZltoPerUsd`. Consequently:
  `lib/payout/conversion.ts` no longer *infers* a rate from the rounded USD figure (the interval
  arithmetic and its suppression rule are gone — the line is exact for every amount now, including
  the small ones it used to hide from); the resume panel shows **Started**; and Flow D exists.
- **2026-09-11: the hosted journey is an iframe inside Yoma, not a new tab** (API directive). The
  youth stays in the product, there is no popup to be blocked, and the "a new window should have
  opened" screen is gone with it. Consequences, all deliberate: the dialog grows to
  `md:h-[85vh] md:w-[720px]` for that step only; `openPaymentUrl` survives **solely** as an escape
  hatch, because framing depends on the provider's headers and IXO coordination is still open, and
  a youth with Zlto reserved cannot be left in front of a frame that refused to load; and the
  visibility-based "return view" is gone, because nobody leaves.
- **2026-09-11: closing the hosted modal reads the outcome; it never assumes one.** The frame is
  cross-origin, so its DOM and its URL are neither readable nor evidence, and there is no
  `postMessage` contract yet (that would need an origin-validated agreement with the provider). So
  ✕ or "I'm done" refreshes the profile, calls `GET /user/payout/latest`, and shows what that says —
  with a "we couldn't check" state when the read itself fails, never a guessed outcome.
- **2026-09-11: Flow D is built from the recorded status only, and expired is worded apart from
  cancelled.** A clock running out is not a decision someone made, and telling a youth they
  cancelled something they did not is its own small injustice. Only `Completed` gets the success
  treatment; cancelled, expired and failed are neutral — the Zlto came back and nobody did anything
  wrong. **No historical ZLTO figure appears anywhere in Flow D**: the API deliberately does not
  carry one and recomputing it at today's rate would invent a number on a money screen, so the USD
  amount and the updated wallet carry it instead.
- **2026-09-11: still no status *line*, even now that `status` exists.** `Processing` begins when
  the hosted payout is created, before the youth confirms anything, so neither it nor `canResume`
  separates "still needs you" from "confirmed and on its way". The active trio is therefore one
  neutral "in progress", and `canResume` decides only what is *offered* — the resume invitation when
  a session can be requested, a "we're still setting this up" wait when the provider reference has
  not landed yet. That second state is now known **on opening** rather than discovered by tapping.
- **2026-09-11: a 404 from the session endpoint no longer means "your cash out ended".** It can
  originate at the provider and can be transient (API note), so it routes to the outcome read
  instead of to a terminal message. `RESUME_COPY.noLongerActive` survives only as the fallback for
  when that read also fails.
- **2026-09-11: the two amount rules are 400s now**, not the unmapped 500s they were
  (`ValidationException` in `PayoutRewards`), so "must be greater than zero" and "must be a whole
  number" land on the field like any other rejection. The client guards stay — they are what keeps
  the youth from sending a request at all.

- **2026-09-11: the hosted frame tracks the window, and `min-h-0` is why.** The dialog was a fixed
  `720px`, and the frame kept its own intrinsic height inside a scrolling column — so the journey
  sat in a narrow box with white space around it. For the hosted step the dialog is now
  `md:h-[90vh] md:w-11/12 md:max-w-[1040px]`, its body is `overflow-hidden` with a definite height
  rather than a scroll container, and the iframe is `h-full min-h-0 w-full grow`. The `min-h-0` is
  the load-bearing part: a flex child's default `min-height: auto` will not shrink below its
  content, and an iframe's content is a whole other document. Capped at 1040px so a wide monitor
  gets a dialog rather than a narrow hosted layout stretched across it. Verified at three sizes.
- **2026-09-11: Adrian confirmed the enum convention holds in both directions** — the API accepts
  integers *or* names on the way in, and always serialises PascalCase names on the way out. So the
  string-enum correction is the convention, not a workaround, and it applies to every web response
  model. No API change; the sweep of other models for numeric enums is web-side work.

- **2026-09-11: a dev-only state gallery at `/dev/cash-out`**, so copy and layout can be worked on
  while the hosted journey is unreachable (its sign-in refuses framing, and verification rejects
  Yoma's gender values). Every screen, in the real dialog, one click apart, deep-linkable by
  `?scene=`; the frame source is switchable between a stand-in journey, a site that refuses framing
  — the blank box a returning youth currently gets — and blank.
  **Built as standalone pages rather than a `?mock=` parameter**, which is the lesson of the
  Treasury aid: that one is threaded through a production page and is now a blocker to unpick, while
  these import the real components, touch no production code, and 404 in every deployed
  environment. Removing them is deleting two files. On the T6 list either way.
  The chrome those screens sit in moved to `CashOutDialog` in the same change, so the gallery shows
  the real dialog by construction instead of a copy that drifts.

- **2026-09-14: the stepper was ticking step 3 on four screens that mean the opposite.** Checking,
  in progress, still setting up and "we couldn't check" all rendered step 3 resolved, because
  `CashOutEntry` resolved it for the outcome *view* rather than for a terminal *status*. A tick is a
  claim, and it was the most confident wrong signal in the flow. `describeOutcome` now carries a
  `resolved` flag that only `Completed` / `Cancelled` / `Expired` / `Failed` set. The dev gallery
  derives it the same way instead of declaring it — it had been hardcoding `stepResolved: true`,
  which is precisely the drift the gallery exists to prevent. Found by the design review, not by us.
- **2026-09-14: the copy sheet is applied, and three of its five open decisions were answered from
  the API rather than by preference.** "Estimated" never "Sent" on a completed payout, because
  `PayoutTransaction.Amount` is fixed at initiation and never updated; no Continue without a preview,
  because the review step has no estimate to show; and the "we'll release it back to you" wording is
  accurate against the real release path. The two genuinely editorial ones went the designer's way —
  **"Check"** rather than "Review" (the product's other uses are admin-only, a different reader) and
  **"Use all"** rather than "Max".
- **2026-09-14: one proposed string was refused.** `RESUME_NO_LONGER_ACTIVE` — "This cash out has
  ended" — re-introduces the claim removed on 2026-09-11: a 404 from the session endpoint can
  originate at the provider and can be transient, so it does not prove closure. That string stays
  non-committal and is only ever a fallback for when the outcome read *also* fails.
- **2026-09-14: the hosted dialog's escape hatch lives in one place, on a timer, and claims
  nothing.** A `frame-ancestors` refusal cannot be detected — it still fires `load`, on a document
  we cannot read — so the four-second prompt became a fixed-height `role="status"` slot that shows
  "Loading…" and then "Taking a while?" with the only "Open in a new window" control beside it. The
  second footer button is gone, the footer no longer reflows, and "Not loading?" (which asserted a
  failure we cannot see) is now a question.
- **2026-09-14: "pending", not "on hold" — the prose follows the ledger, not the other way round**
  (owner). The copy sheet made "on hold" the single phrase for a reservation and banned "pending";
  the ledger row on the hero and the wallet card says **"Pending cash out"**, and that row is the
  most-seen surface in the flow. Copy that points at a word already on screen beats copy that
  introduces a second one for the same thing, so every dialog says "Your Zlto stays pending until
  it's done" and Flow A is untouched. `REVIEW_COPY.holdNote` renamed `pendingNote` so the key does
  not outlive the wording.
- **2026-09-14: `RESULT_ROW_USD` stays "Estimated" even on a completed payout** (owner). It reads
  oddly beside a finished payment, but the alternative — a neutral "Amount" — brings back the
  one-word-two-units clash with the resume panel's ZLTO row, and the API cannot support "Sent".
- **2026-09-14: `CashOutDialog` extracted**, so the state machine is not also a layout and the dev
  gallery renders the real chrome by construction rather than a copy of it.
- **2026-09-15: two shapes, named.** `CashOutMessage` is a screen's own point — round tinted badge,
  heading, centred body — and now backs the result screens, the gate and the active-payout panel,
  which had been drawing the same act three different ways. `CashOutNote` is something said
  *alongside* the content — icon left, text left, never the primary action — and backs the review's
  hand-off note, the paused panel and the resume panel's failure notice. Keeping them separate is
  the point: a badge in the middle of a screen announces, a tinted strip beside content qualifies.
- **2026-09-15: `CashOutResumePanel` takes a `state` discriminator** (`resumable` / `settingUp` /
  `ended`) instead of four independent flags. The mapping from state to heading, icon, tone and verb
  lived in `CashOutEntry`, so every caller had to repeat it — and the dev gallery got it wrong twice,
  showing a headless message and the wrong button verb on a screen the flow renders correctly.
  Derived inside the component, that class of drift is gone.
- **2026-09-15: secondary actions are full-width outlined pills, not ghost text.** `w-full` on a
  ghost button fills the row invisibly — it looks identical at 80px and 480px — so Cancel, Back,
  Close and "Back to my wallet" now carry a border on white: same footprint as the primary, still
  quieter. The gate's centred row of two auto-width buttons stacks the same way; it was the last
  screen not following the pattern and it wrapped awkwardly at 320px.
- **⚠️ 2026-09-15: Chrome will not open a window below ~500px on Windows, so a narrow headless
  window does not test a narrow layout** — it lays out at 500 and crops. This produced a false
  "the whole product overflows on mobile" finding on 2026-09-11, now retracted in that handoff. The
  dev gallery's width preview renders the dialog in an **iframe**, which has its own layout
  viewport, so 320 there is genuinely 320. At a real 320 the only defect was the amount step
  breaking "Use all" across two lines; everything else fits.
- **2026-09-16: the kill-switch hides the entry point rather than disabling it.** `payout.enabled`
  is an *environment* switch (`AppSettings:PayoutEnabledEnvironments` = `Staging, Production`), so
  where it is off the feature has not been announced at all. A disabled button is reserved for the
  two reasons the ledger already shows on screen — an unknown balance and a known zero — and this
  one is invisible there; a greyed "Cash Out" with an explanation would advertise something that may
  stay off for weeks and answer a question nobody asked. Same call the framework switch made on
  `/opportunities/discover` (`25c95e1a`): the surface goes, not its shell.
- **2026-09-16: `enabled` is read as `=== false`, never `!enabled`.** The field is absent on an API
  older than 2026-09-16 and arrives as `undefined`. An API without the field is an API without the
  gate, so treating absent as "off" would hide Cash Out in every environment where it actually
  works. The failure mode of the other reading is a button that 400s, which the gate already handles.
- **2026-09-16: the client checks `enabled` *second*, though the server checks it first.**
  `PayoutRewards` rejects a disabled environment before anything else, but it has no opinion about
  *resuming* — resume, the hosted session, webhooks and reconciliation are all untouched. The
  active-payout branch is the resume route, so it has to win. Reversing the two would strand a youth
  with Zlto already reserved behind a "not available" screen the moment the switch was flipped.
- **⚠️ 2026-09-16: hiding the entry point on eligibility alone unmounts the dialog mid-flow.**
  `showOutcome` refreshes the profile, so when a payout reaches a terminal status `active` goes
  false — and if the switch is off, `payoutDisabled` becomes the live reason at that exact instant.
  The entry point would return `null` and the result screen would vanish as it arrived. The hide is
  gated on `!isOpen`: nothing disappears mid-flow, the entry point goes once the flow is closed.
  `CashOutOutcomeStep` takes `canStartNew` for the same window, so that screen offers the way out
  instead of a "Start a new cash out" the server would refuse.
- **2026-09-16: the gallery's gate list is derived from `GATE_COPY`, not written out.** A
  hand-written `CashOutBlockReason[]` accepts a *subset* without complaint, so `payoutDisabled`
  compiled fine and simply never appeared. `GATE_COPY` is a total `Record`, so its keys make the
  gallery exhaustive by construction — the fourth instance of the drift the gallery exists to catch,
  and the first one closed structurally rather than by hand.
- **2026-09-18: the iframe stays; IXO moved sign-in and KYC into a popup.** Their message mentions
  popups, which reads at first like "open the journey in a new window" — it is the opposite. The
  payment page stays embedded and *they* call `window.open` for the two steps WorkOS will not allow
  to be framed. Yoma opens nothing and can observe nothing; the frame is unchanged.
- **⚠️ 2026-09-18: do not add a `sandbox` attribute.** IXO's note asks for `allow-popups` and
  `allow-popups-to-escape-sandbox` **if** the frame is sandboxed. It is not, and `sandbox` is
  deny-by-default — adding it to satisfy that sentence would strip scripts, forms, storage and
  navigation from a journey that needs all four, and `allow-popups-to-escape-sandbox` is meaningless
  without it. Verified 2026-09-18 that nothing else of Yoma's blocks a popup either: no `headers()`
  in `next.config.mjs`, no security headers on the web ingress (rewrites and proxy buffers only), no
  CSP `<meta>` in `_document.tsx`, and `allow` is a Permissions-Policy list with no popup feature.
- **2026-09-18: the escape hatch is permanent, not timed.** "Taking a while?" appeared four seconds
  after frame load, written for a frame that would not render. The new failure is the opposite
  shape: the frame renders perfectly and the tap on sign-in does nothing because the popup was
  blocked — at any point in the journey, and undetectable for the same reason the refused frame was.
  A youth who taps inside four seconds would have watched a spinner instead of finding the one
  control that helps. So the timer, the spinner and `statusLoading` are gone, and the hint reads
  **"Window didn't open?"** — asking about the window rather than the page.
- **2026-09-18: `shouldCloseOnOverlayClick={false}` is now load-bearing.** It was tidiness; under the
  popup flow it is what keeps the frame alive while the youth is away in the popup that has to
  return to it. It also governs Escape, since `CustomModal` only registers that handler when the
  flag is true. Commented in place so nobody relaxes it.
- **2026-09-18: a mobile reload is recovered by resume, not by persisting the URL** (Adrian). If the
  tab is evicted while the youth is in the popup, the profile refresh shows an active payout and
  "Continue cash out" fetches a fresh session from GET `/user/payout/zlto`. The no-persistence rule
  is unchanged and the recovery path already existed — this confirms it is the intended one.

- **2026-09-21: `camera` and `microphone` removed from the iframe's `allow`.** IXO confirmed nothing
  inside the frame ever asks for either — capture, ComplyCube and the QR hand-off to a phone all run
  in the KYC window, top-level on their origin, prompting for itself. Delegating them was granting a
  payment frame two of the most sensitive permissions a browser has for no reason. `payment` went
  too: it delegates the Payment Request API, and bank/mobile-money details are collected on the
  provider's own pages. **`clipboard-write` went too** (owner) — nothing in the frame is believed to
  copy anything, so the frame is now delegated nothing at all and the `allow` attribute is gone. Its
  Permissions-Policy default is `self`, so the symptom of being wrong is a copy control in the
  journey that silently does nothing rather than an error; that is the one thing to watch on STAGE.
- **2026-09-21: the mobile questions are closed.** iOS Safari, iOS Chrome *and* Android Chrome all
  run the full loop on a Yoma-style host page. A completed sign-in survives a reload of the Yoma tab
  because the provider's session is stored on their origin, partitioned to the Yoma site — so
  re-embedding with a fresh payment URL returns the youth to the right step. That is exactly the
  resume path already built, confirmed from the other side.
- **⚠️ 2026-09-21: the session is partitioned, so the frame and a top-level tab do not share it.**
  Signing in through "Open in a new window" does not sign the youth in inside the frame. It does not
  strand them — they finish in that tab — but nothing may assume state carries between the two.
- **⚠️ 2026-09-21: IXO do not support the embedded flow in in-app browsers, and neither should we.**
  Facebook/Instagram/WhatsApp webviews block or mangle new windows, and *some replace the whole view
  with the sign-in page, destroying the iframe* — not a blocked popup with a graceful message, the
  frame simply gone. Their supported path is the same `paymentUrl` opened **top-level**, where their
  page redirects full-window and never pops. **Resolved the same day (owner): rely on the fallbacks,
  do not detect.** Detection is fragile, its false positives push working users off the supported
  path, and nothing yet says how often this bites. Recorded in full — what a webview is, what is
  wrongly mistaken for one, the User-Agent tokens, and the evidence that would reopen it — under
  [In-app browsers (webviews)](#in-app-browsers-webviews--deferred-detection) above.
- **2026-09-21: popup timing is not a risk.** IXO open the window synchronously in the click handler,
  blank, and navigate it afterwards — the pattern iOS Safari enforces. So a block in an ordinary
  browser would be user configuration, not a bug either side can fix.

- **2026-09-21: the session is fetched when the active-payout panel opens, not when Continue is
  tapped.** Cancellation eligibility only exists on a session, and Cancel has to sit beside Continue
  *before* the youth is handed to the provider — you cannot offer it after the hand-off. So the
  panel gained a `loading` state, `FlowView.resume` carries the `PayoutSession`, and Continue reuses
  it rather than asking again. Expiry is checked before reuse; `POST` is still never a refresh.
- **⚠️ 2026-09-21: cancel the id on screen, never "the active payout".** `confirmCancel` takes the
  `payoutId` the confirmation view carries. Re-resolving at cancel time would, on a stale dialog,
  release a payout the youth never looked at. The same rule governs the eligibility re-check: a
  `latest` read whose `id` does not match the session is discarded and the session refetched, rather
  than reconciled.
- **2026-09-21: `canCancel === true` is the only value that offers Cancel.** `null` is *unknown* —
  the provider reference is missing or the status call failed — and a missing button would assert
  "not allowed" on evidence we do not have. It gets a quiet note and a re-check link instead, the
  same shape as the amount step's failed-estimate retry. `settingUp` never offers it: Yoma has the
  payout and the provider does not, so there is nothing there to cancel.
- **2026-09-21: Cancel is outlined, not red, and sits between Continue and Close.** Cancelling is a
  choice a youth is entitled to make, not a destructive mistake to be warned away from — the
  consequence is spelled out on the confirmation step, which is also why a mis-tap next to Continue
  costs one screen rather than any money.
- **2026-09-21: the country minimum is compared against the *preview's* USD figure.** Not the typed
  ZLTO (different unit) and not a threshold reverse-calculated from the displayed rate (rounded for
  display, so wrong exactly at the boundary). `preview.state === "ready"` already guarantees the
  estimate belongs to what is in the field, so a stale preview cannot qualify a smaller new amount.
- **2026-09-21: an unusable minimum suppresses the claim, not the flow.** A non-USD or negative
  minimum shows no figure — any figure would be invented — but blocks nothing client-side. The
  server enforces the real rule; blocking on contract data we cannot read would lock a youth out of
  their own money over someone else's bug.
- **2026-09-21: the server's minimum refusal quotes no figure.** `belowMinimum` maps to
  `MINIMUM_COPY.serverRejected` and refreshes the profile, so the hint under the field corrects
  itself. The server's message carries the real number, but parsing a figure out of a sentence is a
  contract nobody agreed to — and the number we were holding has just been proved stale either way.

- **2026-09-25: the wallet link is a sibling of `CashOutEntry`, not part of it.** `CashOutEntry`
  returns `null` when the environment kill-switch is off, and wallet access is *independent* of it —
  money already sent is not new initiation, and closing the door to it because new cash outs are
  paused would strand a youth away from their own funds. Same for a withdrawn corridor. So
  `CashOutWalletLink` is its own component in the ledger's actions slot, with no opinion about
  eligibility, the gate, or an active payout.
- **2026-09-25: rendered only on `walletAvailable === true` *and* a valid HTTPS `walletUrl`.** Both,
  not either: the flag is the API's answer about this youth, the URL check is about the
  environment's configuration, and the realistic failure is the second one — the landing URL is
  per-environment and Production must override the committed Test value. A link to nowhere on a
  money screen is worse than no link. `=== true` for the same reason as `payout.enabled`: absent
  means an older API, which is "cannot tell", not "yes".
- **⚠️ 2026-09-25: `showOutcome` re-reads the profile after a Completed outcome.** Its two reads are
  concurrent, so the completion webhook can land between them — the outcome returns `Completed`
  while the profile still says `walletAvailable: false`, and the youth is told their cash out is
  complete on a screen whose wallet link is missing, exactly when they want it. The extra read fires
  only for `Completed`, the one status that flips the flag. It does not cover a webhook arriving
  after the dialog closes; nothing pushes into the page.
- **2026-09-25: the link opens top-level in a new tab, never the hosted iframe.** It is a durable
  landing page the youth signs into, not a 30-minute payment session, and the payment URL is the
  wrong URL entirely. `noopener noreferrer`, because it is a third-party site.
- **2026-09-25: the label is "View my cash-outs" — no "wallet" in it at all** (owner). The button
  sits on the Yo-ID *Wallet* card beside a Zlto balance, so any label containing "wallet" competes
  with what the youth is already looking at. The first attempt, "View my cash-out wallet",
  distinguished the two by being longer; naming what they went to *do* sidesteps the clash instead,
  and is shorter. It also stays clear of claiming anything about a balance, which "wallet" edges
  towards.
- **⚠️ 2026-09-25: the label is provider-neutral, and that is an open question rather than a settled
  one.** The epic rule says never name the provider; the API's field names follow it
  (`walletAvailable`, not `ixoWallet`); the request that prompted this work said "View IXO wallet".
  There is a fair argument that naming a third-party destination is *better* for someone about to
  leave the product. `WALLET_ACCESS_COPY.action` is the single string to change if that argument is
  had and won.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1074](https://linear.app/didx/issue/YOM-1074)
- Related: [YOM-1052](https://linear.app/didx/issue/YOM-1052) (youth cash-out, parent) ·
  [YOM-1055](../YOM-1055-api-yellow-card-hosted-payout-integration/feature.md) (hosted integration,
  country availability) · [YOM-1057](../YOM-1057-api-payout-domain-and-rewards-integration/feature.md)
  (payout domain) · [YOM-1059](../YOM-1059-api-yellow-card-payout-status-integration/feature.md)
  (status / webhooks) · [YOM-1072](../YOM-1072-ui-treasury-admin/feature.md) (admin payout history)
- API handoffs this rewrite is built from: [`../handoffs/2026-08-28-a.md`](../handoffs/2026-08-28-a.md)
  (API code-complete) · [`../YOM-1055-…/handoffs/2026-08-27-a.md`](../YOM-1055-api-yellow-card-hosted-payout-integration/handoffs/2026-08-27-a.md)
  · [`../YOM-1055-…/handoffs/2026-09-01-a.md`](../YOM-1055-api-yellow-card-hosted-payout-integration/handoffs/2026-09-01-a.md)
- Design: session prompt in [Design (claude.design)](#design-claudedesign) above; long-form brief
  [`design-brief-claude-design.md`](./design-brief-claude-design.md); canvas:
  `youth-cash-out-screens.html` — 39 artboards, delivered 2026-09-10 as a local file (opens in a
  browser; view and PNG/PDF export), **not saved online**. Hosted link to be added if published.
- Handoffs for this ticket: [`handoffs/2026-09-09-a.md`](./handoffs/2026-09-09-a.md) (design review
  + wallet ledger). The wallet contract above was established across
  [`../YOM-1072-…/handoffs/2026-08-05-a.md`](../YOM-1072-ui-treasury-admin/handoffs/2026-08-05-a.md)
  and [`2026-08-06-a.md`](../YOM-1072-ui-treasury-admin/handoffs/2026-08-06-a.md).
