# Feature: UI — Treasury Admin

## Meta

- **Feature**: Treasury Admin (`/admin/treasury`) + the shared reward foundations
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1072](https://linear.app/didx/issue/YOM-1072)
- **Owner**: Jason
- **Areas**: web
- **Status**: in-progress — dev complete, authenticated browser pass owed
- **Started**: 2026-08-03
- **Plan tasks**: **T0** (foundations) and **T1** (Treasury admin) in the epic's T-number map

## Problem / Goal

There is no Treasury surface in the admin portal at all, so nobody can see or set what Yoma has
available to award and to pay out. This ticket builds `/admin/treasury` — the top of the reward
hierarchy and, by owner directive, the **aggregation point** for every level beneath it.

It also delivered **T0**, the shared foundations every sibling ticket consumes: the reward
formatters, the financial-year/lifetime label vocabulary, the `RewardStat` primitive, the validation
factory pattern and the message-text server-error mapper. Those conventions are frozen and live in
the [epic README](../README.md#frozen-conventions-t0--binding-on-every-child) — this doc does not
restate them.

Read the epic README first: the branch note, the domain rules, the three-figure availability model
and the validation digest are all there.

## Out of Scope

- **Treasury configuration audit history UI** — persisted server-side, not exposed by any endpoint.
- **Manual payout actions** — the transaction surface is query-only.
- **The tabs owned by sibling tickets** — Organisations and Opportunities (YOM-1063) and Referrals
  (YOM-1073) render inside this page's shell but are built and documented under their own tickets.

## Plan

`/admin/treasury`, Admin role only, with banner tabs. This ticket owns the page shell, the tab
routing (`?tab=`), the Overview tab and the Manage tab; siblings own the other three tab bodies.
The `TreasuryInfo` payload is fetched once by the page and **passed down as a prop** to every tab —
so no tab can disagree with the capacity banner rendered above it.

Key files:

| Purpose                          | File                                                 |
| -------------------------------- | ---------------------------------------------------- |
| Page shell, tabs, save + rollover | `pages/admin/treasury/index.tsx`                    |
| Overview tab                     | `components/Treasury/TreasuryOverview.tsx`           |
| Manage tab (the only form)       | `components/Treasury/TreasuryManagementForm.tsx`     |
| Capacity banners (all tabs)      | `components/Treasury/TreasuryCapacityWarnings.tsx`   |
| Rollover confirmation            | `components/Treasury/TreasuryRolloverConfirmDialog.tsx` |
| Shared ZLTO stat group           | `components/Treasury/TreasuryZltoRewardStats.tsx`    |
| Model + limits                   | `api/models/treasury.ts`                             |
| Form schema / server errors      | `lib/treasury/treasuryFormSchema.ts`, `lib/treasury/serverErrors.ts` |
| Pending + pool floor             | `lib/treasury/payoutCommitment.ts`                   |
| FY guard                         | `lib/treasury/financialYear.ts`                      |
| ⚠️ Dev aid, must be removed      | `lib/treasury/treasuryMockScenarios.ts`              |

Endpoints: `GET /treasury`, `PATCH /treasury`, `GET /treasury/payout/transaction/{id}` and
`POST /treasury/payout/transaction/search` (Admin), `GET /treasury/conversion/zlto-usd` (User).
No migration — every derived figure is API-calculated.

**`PATCH /treasury` is a full replacement.** Omitting `zltoRewardPoolCurrentFinancialYear` clears
it, after which no ZLTO reward is capped anywhere. Always send current values for untouched fields.

## Tasks

- [x] **T0** — Foundations: shared formatters, FY/lifetime vocabulary, `RewardStat` primitive,
      validation + server-error patterns (delivered inside T1; frozen in the epic README)
- [x] **T1** — `/admin/treasury`, Overview + Manage tabs, rollover guard, capacity warnings
- [ ] **Payout transactions** — add the Admin query/history surface using the Payout-domain lookup
      and paginated search now exposed through the Treasury API
- [x] **T1 corrective (a)** — capacity readings repointed to
      `payoutBalanceAvailableCurrentFinancialYearInUsd` in `TreasuryOverview.tsx` +
      `TreasuryCapacityWarnings.tsx`, tone inputs included
- [x] **T1 corrective (b)** — completed-only balance kept, demoted to a plain-toned
      "Completed payouts only" stat
- [x] **T1 corrective (c)** — pool-floor mirror now `current-FY cumulative + total pending`, with
      the pending half retained through a rollover
- [x] **T1 corrective (d)** — verified: the existing `/payout pool/i` matcher already covers the new
      rejection; no new matcher needed
- [x] **T1 corrective (e)** — `payoutAvailableDepleted` + `payoutAvailableOvercommitted` mock scenarios
- [x] **Label vocabulary frozen** — the two payout balance labels + tooltips are constants in
      `lib/format/rewards.ts`
- [x] **Pool-unset copy corrected** — "Not set — no ZLTO can be awarded" was the inverse of the
      server behaviour; now "Not set — ZLTO rewards are not capped by the Treasury" (done during T4)
- [x] **`TreasuryZltoRewardStats` extracted** from `TreasuryOverview` so referral surfaces reuse it
      rather than duplicating the four figures (done during T4)
- [ ] **Authenticated browser pass** — Overview → Manage → a real save → the rollover dialog.
      Tracked epic-wide; this ticket is the largest part of it
- [ ] **Remove the `?mock=` dev aid** — tracked as epic-wide T6, but the code is all in this ticket's files

## Decisions

<!-- Append-only. Date each entry. Epic-wide decisions live in ../README.md -->

- **2026-08-04: the rollover guard does not port `TreasuryHelper`.** It derives a candidate FY start
  only where clamping provably cannot occur, compares against the server-derived
  `financialYearStartDate`, and warns when uncertain (29 Feb, ±1 day around the anniversary,
  unparseable input). Posture: **may warn spuriously, never silent on a reset.**
- **2026-08-05: the availability model makes T1's shipped capacity warnings wrong.** `48540971`
  added `payoutBalanceAvailableCurrentFinancialYearInUsd`; the shipped warnings read the
  completed-only balance and therefore **overstated capacity by the pending total**, reading
  "healthy" while payouts were being refused. Corrective items (a)–(e) above. `ConvertZltoToUsd`
  also now locks the Treasury and ensures the FY, so the preview and the real initiation agree.
- **2026-08-06: T1's capacity defects fixed.** Both surfaces tone and warn off the available
  balance. Where the two balances differ, the UI says why (`"$49,500 in flight"` /
  `"…is held by payouts already in flight."`) rather than leaving an unexplained gap between two
  numbers. Also corrected the exhausted copy: payouts can no longer be **started**; ones already in
  flight still complete.
- **2026-08-06: no new `serverErrors.ts` matcher was needed.** The pool-floor rejection was assumed
  to be unmatched, but the actual server text is _"The **payout pool** for the current financial
  year cannot be less than the total payout amount (N USD) already paid out or pending"_, which the
  existing broad `/payout pool/i` pattern already routes to the right field — verified against all
  nine verbatim messages. **The general lesson — read the server string before adding a matcher —
  is in the epic README.**
- **2026-08-06: the pending total is derived client-side as `completedBalance − availableBalance`**
  (`lib/treasury/payoutCommitment.ts`). The API returns both balances but not the pending figure, and
  the form needs it to mirror the server's floor. It is `null`, not `0`, when no pool is set — in
  which case the client declines to invent a floor and lets the server reject.
- **2026-08-11: `TreasuryReferralsTab` takes the Treasury as a required prop** while the
  Organisations and Opportunities tabs take none. Deliberate asymmetry: the referral rows fold the
  Treasury balance into a derived "payable per completion", and a second fetch could disagree with
  the banner above it. Recorded here because this ticket owns the page shell.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1072](https://linear.app/didx/issue/YOM-1072)
- PRs: https://github.com/didx-xyz/yoma/pull/1741
- Related: [YOM-1053](https://linear.app/didx/issue/YOM-1053) (admin treasury capability) ·
  [YOM-1058](https://linear.app/didx/issue/YOM-1058) (api treasury domain)
- Handoffs covering this ticket: [`handoffs/`](./handoffs/) — `2026-08-05-a.md` (seed; T0–T3 state
  and the T1 corrective list), `2026-08-06-a.md` (T1 correctives landed), `2026-08-11-a.md`
  (docs restructure). The Yoma-reward removal touched this ticket's rollover dialog copy — see
  [`../YOM-1063-…/handoffs/2026-08-07-a.md`](../YOM-1063-ui-organization-and-opportunity-admin/handoffs/2026-08-07-a.md).
