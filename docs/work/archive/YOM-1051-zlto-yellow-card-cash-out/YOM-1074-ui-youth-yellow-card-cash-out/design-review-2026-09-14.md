# Cash Out — Design Review of the Live Build

> **Applied 2026-09-14, in the implementing session.** All five findings below are in, except where
> noted here. The copy went into `lib/payout/copy.ts`; what happened to each decision is recorded at
> the top of [`copy-sheet.md`](./copy-sheet.md).
>
> - **The stepper tick was a real defect, not only a design one.** `CashOutEntry` resolved step 3
>   for every outcome view. `describeOutcome` now carries a `resolved` flag that only a terminal
>   status sets, and the dev gallery derives it the same way rather than declaring it — it had been
>   hardcoding `stepResolved: true`, which is exactly the drift the gallery exists to prevent.
> - **Applied:** the hosted status slot (replacing the appended sentence and the second footer
>   button), `Check again` on still-setting-up and unreadable, the USD/ZLTO label split, the mobile
>   centring and pinned actions, the 22px title, the gate links, the preview retry, and the resume
>   panel's external-link icon removal.
> - **Not applied:** `RESUME_NO_LONGER_ACTIVE` ("This cash out has ended") — it re-introduces a
>   claim removed on 2026-09-11, since a 404 from the session endpoint does not prove closure. And
>   the toasts, which are a feature rather than a copy change.
> - **Open:** "on hold" vs the ledger's "Pending cash out" row — see the copy sheet.

## Meta

- **Ticket**: [YOM-1074](https://linear.app/didx/issue/YOM-1074) · Epic [YOM-1051](../README.md)
- **Date**: 2026-09-14
- **Reviewed**: the `/dev/cash-out` state gallery on the local dev server — all 31 states read for copy; the hosted step, four result screens, the resume panel and the paused amount step viewed at 375px. Desktop viewed at low resolution only; every desktop finding below is also visible in the DOM.
- **Deliverables**: `copy-sheet.md` v1.0 (every string, flat, labelled) · `cash-out-review-boards.html` (15 revised artboards) · this document
- **Not changed**: anything outside the states named below. Entry point, gate layout, amount step, review step were read and are sound apart from the copy revisions in the sheet.

## Findings, in the brief's priority order

### 1. Copy

Delivered as `copy-sheet.md`. Sixty-one strings, each marked KEEP / REVISE / NEW, old string quoted, one-line rationale. Five decisions are pulled out at the end of the sheet for the owner. The pattern across the revisions is one rule: every screen that ends a step says, in plain words, where the Zlto is — on hold, back in the wallet, or that no money was sent — and no screen says "processed", "held", "expired" or "pick up where you left off".

### 2. Hosted-journey dialog

**What is there.** Title, stepper, bordered frame, a single grey paragraph in the footer that carries two unrelated sentences ("Closing this won't cancel your cash out — we'll check how it's going." and, after four seconds, "Not loading? Open it in a new window instead." appended inline), then two actions side by side: a filled `I'm done` and a text link `Open in a new window`.

**Why it reads as clutter.** The four-second prompt arrives as extra words inside a paragraph that is already there, so the footer reflows; the escape hatch exists twice (the appended sentence and the link button); and the reassurance line answers a question the youth has not asked while the button label carries the one they have.

**Revision (boards `Main`, `H1_HostedDesktop_slow`, `H2_HostedMobile_*`).**

Lead line under the title: "Our secure payout partner will take it from here." — names whose page the frame is, before they see it.

A **status slot** in the footer, present from the first paint, `role="status" aria-live="polite"`, 44px tall. At 0–4 s it shows a spinner and "Loading…". At 4 s the same slot changes to "Taking a while?" with the `Open in a new window` link beside it. Nothing appears from nowhere and nothing reflows; the escape hatch lives in exactly one place. The wording no longer claims the frame failed, because we cannot know that.

**One primary action.** `I'm done` alone, right-aligned on desktop, full width on mobile. Above it, the footer note now says what the button does: "Your Zlto is on hold while you finish. When you're done, tap I'm done and we'll check how it went."

The close control keeps its behaviour (read the outcome) and gains the label "Close and check my cash out" for screen readers.

### 3. The three added outcome states

**Still setting up.** Live: title, body, `Back to wallet` only; stepper shows all three steps ticked. Two problems: the stepper says the cash out is resolved when it is not, and the resume variant of the same state offers `Try again` while this one offers nothing. Revision (`R7_SettingUp`): step 3 shown as live (filled number), not ticked; the same USD/Started rows as the other in-flight screen so it is recognisably the same object; `Check again` primary, `Back to my wallet` secondary; body ends with the on-hold fact.

**We couldn't check.** Live: "Nothing is lost. Open your wallet again in a few minutes to see where it stands.", `Back to wallet` only, stepper ticked. Revision (`R8_Unreadable`): step 3 live; body "Your cash out is safe. Check again in a few minutes." — true without having read anything, and without the idiom; `Check again` primary because a read failure is the one outcome state where retrying is the honest action.

**Initiation failed.** Live: "Nothing has been taken from your wallet." — the 2026-09-10 rebase note documents the case where that is false (reservation succeeded, initiation failed). Revision (`R9_InitFailed`): "Something went wrong on our side. Please try again. If your wallet shows Zlto on hold, we'll release it back to you." No stepper (correct as built). Flagged as a DECISION in the sheet: confirm "we'll release it" against the actual release path before shipping.

These three now share the shell, icon-badge, type scale, row block and action stack of the other six, which is what removes the bolted-on look.

### 4. Hierarchy across the eight result screens

**The stepper is lying on four of them.** Checking, in progress, still setting up and unreadable all render step 3 as a tick. A tick means resolved; those states are the opposite. Revision: step 3 is the live step (filled number) on every non-terminal result and ticked only on completed, cancelled, expired and failed. This is the single highest-value visual change in the review — it costs nothing and it is currently the most confident wrong signal in the flow.

**Neutral is not indifferent, provided each body ends with a fact and each screen offers a way forward.** Cancelled, expired and failed keep the grey badge and the plain title; what stops them reading as a shrug is that every body states "No money was sent" and "Your Zlto is back in your wallet", and every one has a primary action that is not just leaving (start again / try again). Completed keeps the only green.

**Same word, two units.** The result screens label the USD figure "Amount"; the resume panel labels the ZLTO figure "Amount". Revision: "Estimated" on results (what the youth saw on the amount step), "Sent" only on completed and only if the recorded USD is the sent amount (DECISION 4).

**Type scale.** On mobile the result title renders at roughly body size; the badge and the title do not outrank the body. Revised boards use 22px/700 for the title against 15px body.

### 5. Mobile (full-screen modal)

The full-screen shape stays. The problem on the live build is the content anchoring: title, badge, text, rows and the primary button stack from the top and stop half-way down, leaving the lower half of the screen empty and the primary action in the middle of the thumb's reach, not at the end of it. Revision, applied on every mobile board: header 56px; stepper directly under it; the message block **vertically centred** in the remaining space; the action stack **pinned to the bottom** with 28px of padding. Same DOM order, so nothing changes for screen readers.

### 6. Smaller items seen in passing

The resume panel's `Continue cash out` button carries an external-link icon; the journey is an iframe now, so the icon promises a new window that does not open. Removed on `S1_Resume`. The gate for "nothing available" is Close-only; it is the one gate where the fix is a link (`/opportunities`), so the sheet adds `Find opportunities`. The country gate has no route to correct a wrong country; the sheet adds a quiet link. The preview-failed message has no retry; the sheet adds an inline `Try again`. The Next.js dev issue badge and the service-worker overlay are dev-server artefacts and were ignored.

## What was not reviewed

The real hosted page inside the frame (the gallery's stand-in only); the live journey with a logged-in session; desktop layouts at full resolution; the entry point on the real hero with real profile data. Nothing above depends on those.

## Files

- `copy-sheet.md` — the strings
- `cash-out-review-boards.html` — 15 artboards, opens in a browser; `cash-out-review-boards.zip` — the same as PNG
  (both delivered as local files from the design session; not in the repo)
- Live source read: `lib/payout/copy.ts` via `/dev/cash-out`, 2026-09-14
