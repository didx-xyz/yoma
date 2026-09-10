# Feature: UI — Youth Cash-Out (Payout)

## Meta

- **Feature**: Youth payout — wallet ledger, eligibility gate, amount entry, conversion preview, initiation, active-payout resume, outcome states
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1074](https://linear.app/didx/issue/YOM-1074)
- **Owner**: Jason
- **Areas**: web
- **Status**: in-progress — T5 built (entry point, amount, preview, initiation, hand-off, resume,
  result), browser-verified; Flow D outcome states blocked on an API gap
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

| # | Check | Source | UI state |
| - | ----- | ------ | -------- |
| 0 | Active payout | profile `payout.active` | "You already have a cash out in progress" — **Continue cash out**. Checked first: the server never re-validates availability for an active payout |
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
  is what `profile.payout.active` means. ⚠️ **None of these names reaches the youth UI**: the
  profile carries no status and there is no youth-facing payout record, so this table constrains
  what the UI may *claim*, not what it can display. See the 2026-09-10 decision.
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
| C resumable / processing | `profile.payout.active` + `zlto.pendingPayout` (reserved ZLTO) + `payout.amount` (USD); session refresh via `GET /api/v3/user/payout/zlto` → `PayoutSession { amount, currency, paymentUrl, expiresAt }`, 404 when none. **The two states are not separable** — no status on the profile (2026-09-10) |
| D outcomes | **Nothing supplies them.** Enum verified (Plan §4) but no youth-facing endpoint reports a payout's status, so only "processing" is built |

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

## Tasks

- [ ] **Design pass** — 39 artboards drafted and redrawn against the 2026-09-09 decisions;
      delivered 2026-09-10 as a local canvas file (see Links). **Still owed:** review of the boards
      not yet seen (A5–A9, B1, B2 empty/error/loading, B3–B5, C, D, M), and the copy sheet — all
      seven gate bodies and every Flow C/D string are drafts until it exists.

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
- [ ] **Outcome states** — **blocked, not skipped.** Processing is built; completed /
      cancelled-expired / failed are not, because **no youth-facing endpoint reports a payout's
      terminal status** (see Decisions, 2026-09-10). Toast variants wait on the same gap.
- [x] Entry points on both the Marketplace wallet and the Yo-ID Wallet.
- [x] Per-field server-error mapping for the payout request (`lib/payout/serverErrors.ts`) —
      every pattern quotes the verbatim server string it matches.
- [x] Payout status enum names — read and recorded below.
- [x] Session-endpoint route recorded: `GET /api/v3/user/payout/zlto`.
- [ ] **API asks raised by T5** (all four in the 2026-09-10 handoff, none blocking what is built
      except the first): payout **status** on `UserProfilePayout`; a youth-readable **terminal
      outcome**; the **conversion rate** on `ConversionResponse`; the active payout's **start time**.

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
