# Cash Out — Copy Sheet

> **Applied 2026-09-14, in the implementing session.** Everything below is the design session's
> deliverable, kept as written. What the build did with it:
>
> - **Applied**, into `src/web/src/lib/payout/copy.ts` and the components that render it: every
>   KEEP/REVISE/NEW string except the two exceptions below, plus the structural items from the
>   review (status slot, `Check again`, gate links, preview retry, mobile anchoring).
> - **Decisions 1 and 2 taken as recommended** — "Check" and "Use all". The product does say
>   "Review" elsewhere, but only on admin surfaces, which have a different reader. Flip
>   `STEP_LABELS` and `REVIEW_COPY.dialogTitle` together if that is reconsidered.
> - **Decisions 3, 4 and 5 settled from the API code**, not by opinion:
>   - **3 — no.** Continue already requires a ready preview, and the review step has no estimate to
>     show without one. The inline `Try again` is in instead.
>   - **4 — "Estimated", never "Sent".** `PayoutTransaction.Amount` is computed at initiation and
>     never updated (`UpdatePayoutTerminal` touches status, error, reconciliation and retry only),
>     so Yoma cannot call it the amount that landed.
>   - **5 — the release wording is accurate.** Immediate where possible
>     (`TryReleaseReservation`), otherwise reconciliation, with the reservation expiry as the
>     backstop. No timing promise, because that last path is hours.
> - **Not applied — `RESUME_NO_LONGER_ACTIVE`.** "This cash out has ended" re-introduces the claim
>   removed on 2026-09-11: a 404 from the session endpoint does not prove the payout closed, so that
>   string stays non-committal ("We couldn't open your cash out just now"). It is only ever a
>   fallback for when the outcome read *also* fails.
> - **Not applied — the toasts.** Nothing renders a Cash Out toast today; that is a feature, not a
>   copy change.
> - **Resolved — "pending", not "on hold"** (owner, 2026-09-14). The sheet's conventions block bans
>   "pending" and makes "on hold" the single phrase for a reservation; the build went the other way,
>   because the ledger row a youth can actually see on the hero and the wallet card says **"Pending
>   cash out"**, and prose that points at a word on screen beats prose that introduces a second one.
>   So every dialog now reads "Your Zlto stays pending until it's done" and the ledger is unchanged.
>   **Read the conventions block below with that one substitution.**

## Meta

- **Ticket**: [YOM-1074](https://linear.app/didx/issue/YOM-1074) · Epic [YOM-1051](../README.md)
- **Maps onto**: `src/web/src/lib/payout/copy.ts`
- **Version**: 1.0 — 2026-09-14 — first review of the engineer draft. Current strings were read off the live `/dev/cash-out` gallery (all 31 states), not from the docs.
- **Reader**: 16–24, phone, often English as a second or third language. Short sentences. One idea per sentence. No idioms. No passive voice where an active one exists. Say what is true about their Zlto on every screen that ends a step.

## Conventions

- **Cash Out** — the product action, title case, on buttons and headings.
- **cash out** — in prose: "your cash out", "cash out your Zlto".
- **Zlto** in prose, **ZLTO** as the unit after a number.
- **on hold** — the one phrase for a reservation. Never "reserved", "locked", "pending", "held back".
- **our secure payout partner** — the only reference to the provider.
- **estimate / estimated** — every USD figure carries one of these words on the same screen.
- **Never**: payout (user-facing), withdraw, redeem, off-ramp, initiate, process/processing (as a status), transaction, session, reservation, provider name.
- **Never claim** "nothing was taken" after a POST — the Zlto may be on hold. Never infer an outcome from the wallet.
- Em dash `—` for an unknown figure. Never blank, never 0.

Legend on each line: **KEEP** current string stands · **REVISE** replaces the current string (old string shown) · **NEW** no current string known · **DECISION** needs a call from the owner before it can be final.

---

## 1. Entry point

ENTRY_CTA: "Cash Out" — KEEP
ENTRY_CTA_ACTIVE: "Continue cash out" — KEEP
ENTRY_HELPER_BALANCE_UNKNOWN: "Balance not available right now" — NEW (helper under the disabled pill when the ledger shows em dashes)
ENTRY_HELPER_NOTHING_AVAILABLE: "Nothing to cash out yet" — NEW (helper under the disabled pill when available is a known 0 and something is in flight)

## 2. Gate — seven blocking states, server order

GATE_ACTIVE_TITLE: "You have a cash out in progress" — REVISE from "You already have a cash out in progress" · "already" adds nothing and reads as a scold
GATE_ACTIVE_BODY: "You can only have one cash out at a time. Finish this one first." — REVISE from "You can have one cash out at a time. Finish or wait for your current cash out first." · "only" carries the rule; "finish or wait" is two instructions where one is enough
GATE_ACTIVE_PRIMARY: "Close" — KEEP (live state has Close only; an active payout normally routes to the resume panel, so no Continue here)

GATE_PROFILE_TITLE: "Complete your profile to cash out" — KEEP
GATE_PROFILE_BODY: "Our secure payout partner needs these details before you can cash out:" — REVISE from "We need a few more details before you can cash out." · names who needs the data and introduces the list with a colon, so the two fields under it read as the answer
GATE_PROFILE_FIELDS: "Email address" · "First name" · "Surname" · "Country" · "Gender" · "Date of birth" — KEEP (server field wording; show only the missing ones)
GATE_PROFILE_PRIMARY: "Update my profile" — REVISE from "Update profile" · "my" matches "Back to my wallet"
GATE_PROFILE_SECONDARY: "Close" — KEEP

GATE_OFFLINE_TITLE: "Cash Out isn't available right now" — REVISE from "Cash Out is temporarily unavailable" · "temporarily unavailable" is two hard words for the same idea
GATE_OFFLINE_BODY: "Please try again later. Your Zlto is safe." — KEEP
GATE_OFFLINE_PRIMARY: "Close" — KEEP

GATE_COUNTRY_TITLE: "Cash Out isn't available in your country yet" — KEEP
GATE_COUNTRY_BODY: "We're working on adding more countries. You can still spend your Zlto in the marketplace." — REVISE from "We're working on adding more countries. Your Zlto is safe and you can still spend it on the marketplace." · "is safe" is for states where something could have gone wrong; nothing did here. "in the marketplace" is the product's own phrase
GATE_COUNTRY_PRIMARY: "Close" — KEEP
GATE_COUNTRY_LINK: "Check my country in my profile" — NEW (quiet link; the live state has no way to fix a wrong country)

GATE_WALLET_TITLE: "Your wallet is still being set up" — KEEP
GATE_WALLET_BODY: "This usually takes a few minutes. Please try again soon." — REVISE from "This usually takes a moment. Please try again shortly." · "a moment" over-promises; "shortly" is uncommon for ESL readers
GATE_WALLET_PRIMARY: "Close" — KEEP

GATE_BALANCE_UNKNOWN_TITLE: "We can't check your balance right now" — KEEP
GATE_BALANCE_UNKNOWN_BODY: "Please try again later. Your Zlto is safe." — REVISE from "Please try again in a few minutes. Your Zlto is safe." · same words as GATE_OFFLINE_BODY on purpose: same situation for the youth, and "a few minutes" is a promise we cannot keep
GATE_BALANCE_UNKNOWN_PRIMARY: "Close" — KEEP

GATE_NOTHING_TITLE: "You don't have any Zlto to cash out yet" — KEEP
GATE_NOTHING_BODY: "Complete opportunities to earn Zlto. Then come back here." — REVISE from "Complete opportunities to earn Zlto, then come back to cash it out." · two sentences; "cash it out" repeats the title
GATE_NOTHING_PRIMARY: "Find opportunities" — NEW · the live state is Close only — a dead end on the one gate where the fix is a link away (`/opportunities`)
GATE_NOTHING_SECONDARY: "Close" — KEEP

## 3. Stepper

STEP_1: "Amount" — KEEP
STEP_2: "Review" — REVISE to "Check" — DECISION · "Review" is a verb youth rarely use; "Check" is the word they would say. Keep "Review" if the product uses it elsewhere.
STEP_3: "Result" — KEEP

## 4. Amount step

AMOUNT_TITLE: "Cash Out" — KEEP
AMOUNT_AVAILABLE_LABEL: "Available to cash out" — KEEP
AMOUNT_FIELD_LABEL: "How much Zlto do you want to cash out?" — REVISE from "Amount to cash out" · a question tells a first-time user what to do
AMOUNT_FIELD_UNIT: "ZLTO" — KEEP
AMOUNT_MAX: "Max" — REVISE to "Use all" — DECISION · "Max" is jargon; "Use all" says what happens. It fits: the live label sits alone on the right of the field row.
AMOUNT_ESTIMATE_LABEL: "Estimated" — KEEP
AMOUNT_ESTIMATE_EMPTY: "—" — KEEP
AMOUNT_RATE: "{rate} ZLTO = 1 USD" — KEEP (now exact from `conversionRateZltoPerUsd`)
AMOUNT_ESTIMATE_NOTE: "The final amount may be a little different." — NEW · the estimate label alone does not tell a first-time reader why
AMOUNT_ERROR_ZERO: "Enter an amount more than 0." — NEW (no live string seen for the zero case)
AMOUNT_ERROR_WHOLE: "Zlto must be a whole number. No decimals." — REVISE from "Enter a whole number of Zlto." · the second sentence is the plain-language gloss for "whole number"
AMOUNT_ERROR_ABOVE_AVAILABLE: "You can cash out up to 2,000 ZLTO." — KEEP · the figure is right here (client-side check against the live ledger) and it is the most useful sentence on the screen
AMOUNT_ERROR_SERVER_REJECTED: "That's more than you have available. We've updated your balance." — REVISE from "That's more than you have available to cash out right now." · no figure (the ledger was stale — 2026-09-10 decision) and the second sentence tells them why the number above just changed
AMOUNT_PREVIEW_LOADING: "Working out your estimate…" — NEW (screen-reader text for the skeleton)
AMOUNT_PREVIEW_FAILED: "We couldn't work out an estimate. Try again in a moment." — REVISE from "We couldn't work out an estimate just now." · "just now" is filler; the second sentence gives an action
AMOUNT_PREVIEW_FAILED_ACTION: "Try again" — NEW (inline retry beside the message; the live state has no retry)
AMOUNT_PREVIEW_FAILED_CONTINUE: — DECISION · can the youth continue without a preview? If yes, add "You can still continue. You'll see the amount before you confirm." If no, Continue stays disabled and no string is needed.
AMOUNT_PAUSED_TITLE: "Cash Out is paused for now" — KEEP
AMOUNT_PAUSED_BODY: "Yoma's cash-out funds for this period are used up. Your Zlto is safe. Try again later." — REVISE from "Yoma's cash-out funds for this period have been used up. Your Zlto is safe and you can try again later." · three short sentences; "are used up" over "have been used up"
AMOUNT_PRIMARY: "Continue" — KEEP
AMOUNT_SECONDARY: "Cancel" — KEEP

## 5. Review step

REVIEW_TITLE: "Check your cash out" — REVISE from "Review your cash out" (see STEP_2; keep in step with it)
REVIEW_ROW_AMOUNT: "Amount" — KEEP
REVIEW_ROW_ESTIMATE: "Estimated" — KEEP
REVIEW_ROW_RATE: "Rate" — KEEP
REVIEW_NOTE_NEXT: "Next, our secure payout partner will ask where to send your money." — REVISE from "You'll continue to our secure payout partner to finish. This may take a few minutes. Your Zlto will be held while your cash out is processed." · says what will happen next, in order; drops "processed" (a status word) and "held" (see "on hold")
REVIEW_NOTE_HOLD: "Your Zlto is on hold until your cash out is finished." — NEW (second line of the note)
REVIEW_NOTE_ESTIMATE: "The final amount may be a little different from the estimate." — REVISE from "The final amount may differ slightly from the estimate." · "differ slightly" is hard for ESL readers
REVIEW_PRIMARY: "Continue" — REVISE from "Continue to cash out" · the heading already says cash out; a short label reads faster
REVIEW_PRIMARY_BUSY: "Starting your cash out…" — NEW
REVIEW_SECONDARY: "Back" — KEEP

## 6. Hosted journey (iframe dialog)

HOSTED_TITLE: "Finish your cash out" — NEW
HOSTED_LEAD: "Our secure payout partner will take it from here." — NEW · one line, under the title, tells the youth whose page this is before they see it
HOSTED_STATUS_LOADING: "Loading…" — NEW (status slot, 0–4 s)
HOSTED_STATUS_SLOW: "Taking a while? Open it in a new window instead." — REVISE from "Not loading? Open it in a new window instead." · we cannot detect a refused frame, so we do not know anything is wrong; "Not loading?" claims we do
HOSTED_STATUS_SLOW_ACTION: "Open in a new window" — KEEP (this is the escape hatch; it lives in the status slot, not as a second footer button — see the board)
HOSTED_FOOTER_NOTE: "Your Zlto is on hold while you finish. When you're done, tap I'm done and we'll check how it went." — REVISE from "Closing this won't cancel your cash out — we'll check how it's going." · the live line answers a question the youth has not asked (what if I close it?) and leaves the one they have (what do I do when finished?) to the button label
HOSTED_PRIMARY: "I'm done" — KEEP
HOSTED_CLOSE_ARIA: "Close and check my cash out" — NEW · the ✕ does something (it reads the outcome), so it should say so to a screen reader

## 7. Result — eight states

Order of hierarchy: completed is the only success treatment. In progress, still setting up and checking are quiet waits. Cancelled, expired and failed are neutral and every one ends with where the Zlto is. Unreadable and initiation failed are honest "we don't know" states with a way back.

RESULT_CHECKING_TITLE: "Checking your cash out…" — REVISE from "Checking how your cash out went…" · "how it went" presumes it ended; it may be in progress

RESULT_COMPLETED_TITLE: "Your cash out is complete" — REVISE from "Cash out complete" · a full sentence, and "your"
RESULT_COMPLETED_BODY: "The money has been sent. Your wallet shows your new balance." — REVISE from "The payment has been sent. Your wallet has been updated to match." · "money" over "payment"; "updated to match" is abstract
RESULT_ROW_USD: "Estimated" — REVISE from "Amount" · on the resume panel "Amount" is the ZLTO figure; on the result screens the same word labels the USD one. One word, two units, two screens apart. "Estimated" is what the youth saw on the amount step and it stays honest until we know otherwise
RESULT_COMPLETED_ROW_USD: "Sent" — DECISION · use only if the recorded USD on a Completed payout is the amount actually sent; otherwise keep "Estimated"
RESULT_COMPLETED_ROW_STARTED: "Started" — KEEP
RESULT_COMPLETED_PRIMARY: "Back to my wallet" — REVISE from "Back to wallet" · "my" matches the product's "My Zlto balance"

RESULT_CANCELLED_TITLE: "Your cash out was cancelled" — KEEP
RESULT_CANCELLED_BODY: "No money was sent. Your Zlto is back in your wallet. You can start again any time." — REVISE from "Your Zlto is back in your wallet, ready to use." · leads with the money fact; "ready to use" is a sales note on a screen that should be plain
RESULT_CANCELLED_PRIMARY: "Back to my wallet" — KEEP (as above)
RESULT_CANCELLED_SECONDARY: "Start a new cash out" — KEEP

RESULT_EXPIRED_TITLE: "Your cash out ran out of time" — REVISE from "Your cash out expired" · "expired" is a word ESL readers meet on milk and passports, not on their own actions; the plain version also carries the no-fault meaning
RESULT_EXPIRED_BODY: "It wasn't finished in time, so it closed. No money was sent. Your Zlto is back in your wallet." — REVISE from "The time to finish it ran out, so we returned your Zlto to your wallet." · adds the money fact; the live version is good and this keeps its shape
RESULT_EXPIRED_PRIMARY: "Back to my wallet" — KEEP (as above)
RESULT_EXPIRED_SECONDARY: "Start a new cash out" — KEEP

RESULT_FAILED_TITLE: "Your cash out didn't go through" — KEEP
RESULT_FAILED_BODY: "Something went wrong with the payment. No money was sent. Your Zlto is back in your wallet. You can try again when you're ready." — REVISE from "Your Zlto has been returned to your wallet. You can try again whenever you're ready." · says what failed (the payment, not the youth) and that no money moved, before the reassurance
RESULT_FAILED_PRIMARY: "Back to my wallet" — KEEP (as above)
RESULT_FAILED_SECONDARY: "Try again" — KEEP

RESULT_IN_PROGRESS_TITLE: "Your cash out is in progress" — KEEP
RESULT_IN_PROGRESS_BODY: "This can take a few hours. Your Zlto is on hold until it's done. If you haven't finished with our payout partner yet, you can continue below." — REVISE from "We'll update your wallet as soon as it's done. This can take a few hours." · adds the on-hold fact and explains why a Continue button sits under an in-progress message (the youth may not have finished the hosted step; we cannot tell)
RESULT_IN_PROGRESS_PRIMARY: "Continue cash out" — KEEP (shown only when canResume)
RESULT_IN_PROGRESS_SECONDARY: "Back to my wallet" — REVISE from "Back to wallet"

RESULT_SETTING_UP_TITLE: "We're still setting up your cash out" — KEEP
RESULT_SETTING_UP_BODY: "This usually takes a few minutes. Your Zlto is on hold until it's done." — REVISE from "This usually takes a few minutes. Your Zlto is safe while we finish." · "on hold" is the one phrase for a reservation; "safe" is for error states
RESULT_SETTING_UP_PRIMARY: "Check again" — NEW · the live result variant offers only Back to wallet while the resume variant of the same state offers Try again; the two should match, and "Check again" says what the button does
RESULT_SETTING_UP_SECONDARY: "Back to my wallet" — REVISE from "Back to wallet"

RESULT_UNKNOWN_TITLE: "We couldn't check your cash out" — KEEP
RESULT_UNKNOWN_BODY: "Your cash out is safe. Check again in a few minutes." — REVISE from "Nothing is lost. Open your wallet again in a few minutes to see where it stands." · "Nothing is lost" is the right instinct but we have not checked anything, so say what is true (the cash out itself is unaffected by our failure to read it); "where it stands" is an idiom
RESULT_UNKNOWN_PRIMARY: "Check again" — NEW · live state is Back to wallet only; a read failure deserves a retry
RESULT_UNKNOWN_SECONDARY: "Back to my wallet" — REVISE from "Back to wallet"

RESULT_INIT_FAILED_TITLE: "We couldn't start your cash out" — KEEP
RESULT_INIT_FAILED_BODY: "Something went wrong on our side. Please try again. If your wallet shows Zlto on hold, we'll release it back to you." — REVISE from "We couldn't start your cash out. Nothing has been taken from your wallet." · "Nothing has been taken" can be false (reservation before failure — see the 2026-09-10 rebase note); this version is true in both cases — DECISION: confirm "we'll release it" matches the release path (reconciliation / 30-hour threshold) before shipping
RESULT_INIT_FAILED_PRIMARY: "Try again" — KEEP
RESULT_INIT_FAILED_SECONDARY: "Close" — KEEP
RESULT_INIT_FAILED_STEPPER: hide — the live screen shows no stepper (correct); keep it that way

## 8. Resume panel

RESUME_TITLE: "Your cash out" — KEEP
RESUME_ROW_AMOUNT: "Amount" — KEEP (ZLTO, from `zlto.pendingPayout`)
RESUME_ROW_ESTIMATE: "Estimated" — KEEP (USD, from `payout.amount`)
RESUME_ROW_STARTED: "Started" — KEEP
RESUME_INVITATION_TITLE: "Finish your cash out" — REVISE from "Pick up where you left off" · idiom; ESL readers stall on it. Same words as the hosted dialog title, which is where the button takes them
RESUME_INVITATION_BODY: "You started this cash out but haven't finished it. Your Zlto is on hold until it's done." — REVISE from "You started a cash out but haven't finished it. Continue to complete it — your Zlto stays held until it's done." · drops the em-dash clause and "held"; "Continue to complete it" duplicates the button
RESUME_PRIMARY: "Continue cash out" — KEEP · but drop the external-link icon: the journey is an iframe now, the icon promises a new window
RESUME_PRIMARY_BUSY: "Getting your cash out ready…" — NEW
RESUME_LINK_FAILED: "We couldn't open your cash out right now. Please try again in a moment." — KEEP
RESUME_LINK_FAILED_ACTION: "Try again" — KEEP
RESUME_NOT_PLACED_TITLE: "We're still setting up your cash out" — KEEP (same words as RESULT_SETTING_UP — same situation)
RESUME_NOT_PLACED_BODY: "This usually takes a few minutes. Your Zlto is on hold until it's done." — REVISE from "We're still setting up your cash out. Try again in a few minutes — your Zlto is safe." · the live version has no title and packs three ideas into one line; split into RESUME_NOT_PLACED_TITLE + this body, matching the result variant word for word
RESUME_NOT_PLACED_PRIMARY: "Check again" — REVISE from "Try again" · nothing failed; they are checking
RESUME_NO_LONGER_ACTIVE: "This cash out has ended. Check your wallet for your balance." — NEW (fallback only, when the outcome read also fails — per the 2026-09-11 decision)
RESUME_SECONDARY: "Close" — KEEP

## 9. Toasts (if outcome changes while elsewhere)

TOAST_COMPLETED: "Your cash out is complete. The money has been sent." — NEW
TOAST_CANCELLED: "Your cash out was cancelled. Your Zlto is back in your wallet." — KEEP
TOAST_EXPIRED: "Your cash out ran out of time. Your Zlto is back in your wallet." — NEW
TOAST_FAILED: "Your cash out didn't go through. Your Zlto is back in your wallet." — REVISE (unit casing; drop "has been returned to")

---

## Decisions needed before sign-off

1. STEP_2 / REVIEW_TITLE — "Check" or "Review".
2. AMOUNT_MAX — "Use all" or "Max".
3. AMOUNT_PREVIEW_FAILED_CONTINUE — can the youth continue without an estimate?
4. RESULT_COMPLETED_ROW_USD — is the recorded USD on a Completed payout the amount sent, or the amount requested? "Sent" only if the former.
5. RESULT_INIT_FAILED_BODY — confirm the release path wording against the API behaviour after `8d34eee7`.

## Not in this sheet by design

- No provider name, no status names (Initiated / Processing / ReconciliationRequired never reach copy).
- No "waiting for you" vs "processing" split anywhere.
- No Zlto figure on any result screen.
- No transaction history strings.
