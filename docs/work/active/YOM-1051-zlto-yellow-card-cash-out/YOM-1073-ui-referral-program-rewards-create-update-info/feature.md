# Feature: UI — Referral Program Rewards (Create / Update / Info)

## Meta

- **Feature**: Referral programme reward alignment + `?tab=referrals`
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1073](https://linear.app/didx/issue/YOM-1073)
- **Owner**: Jason
- **Areas**: web
- **Status**: in-progress — dev complete, browser pass owed
- **Started**: 2026-08-07
- **Plan tasks**: **T4**

## Problem / Goal

The referral programme admin surface formatted and labelled its ZLTO figures with private helpers
that predate the shared reward conventions, and showed nothing at all about the Treasury pool that
actually caps what a completion pays. This ticket aligns the second branch of the hierarchy —
**Treasury → Referral Program → Referral Link** — with the rest of the epic.

The labelling risk is at its sharpest here: **lifetime** programme figures sit beside
**current-financial-year** Treasury figures, and elsewhere in the same admin area a _third_
distinction exists (completed vs available payout). Nothing may imply a referral pool resets per
financial year, and nothing may imply a referral figure has an "available" variant.

Read the [epic README](../README.md) first for the domain rules, the frozen conventions and the
validation digest.

## Out of Scope

- **Hard validation of a referral pool against Treasury capacity.** YOM-1073's ticket asks for it
  ("Validate the configured Program pool against the available Treasury balance… display API
  validation errors"), but **no such server rule exists** — `ProgramRequestValidator.cs` never looks
  at the Treasury. Per the epic's "follow the code, not the tickets" rule, the UI gives **soft,
  non-blocking guidance** instead. Raising an API ticket for it is a product decision, not taken here.
- **Referral link–level reward surfaces.** The hierarchy ends at the programme for this ticket.
- **USD payout figures anywhere on a referral surface** — a category error, see below.

## Plan

⚠️ **Referral rewards are ZLTO, capped by the Treasury's ZLTO reward pool — never by the USD payout
pool.** The payout figures have no business on this surface.

How a referral completion is actually funded (`LinkUsageService.cs:703-740`, mirrored for display by
`ProgramExtensions.CalculateProgramRewardEstimate`): the pools are evaluated outside in, **Treasury
(current FY) → Program (lifetime)**, the smaller remaining balance is what one completion may draw,
the **referee is funded first** and the ambassador from what remains, and **partial payouts are
allowed**.

| Purpose                             | File                                                            |
| ----------------------------------- | --------------------------------------------------------------- |
| Capacity derivation (pure, no React) | `lib/referral/rewardCapacity.ts`                                |
| Detail block                        | `components/Referrals/Rewards/ReferralProgramRewardStats.tsx`   |
| Compact row                         | `components/Referrals/Rewards/ReferralProgramRewardSummaryRow.tsx` |
| Soft guidance                       | `components/Referrals/Rewards/ReferralTreasuryCapacityNotice.tsx` |
| Tab body                            | `components/Treasury/TreasuryReferralsTab.tsx`                  |
| Consumers                           | `components/Referrals/AdminProgramInfo.tsx`, `pages/admin/referrals/[id]/info.tsx`, `pages/admin/referrals/[id]/index.tsx` |

`deriveReferralCapacity()` mirrors the server function exactly, so the derived "payable per
completion" can never disagree with the `zltoRewardEstimate` the API already returns.

Data source is `POST /referral/program/search/admin`, which returns the **full `Program`** (Admin
role) — so unlike YOM-1063's Opportunities tab there is **no API gap** and nothing is synthesised.

## Tasks

- [x] **T4** — Referral Rewards alignment + `?tab=referrals`: shared detail block + compact row,
      soft Treasury-capacity notice, Treasury **ZLTO reward** figures (never USD payout)
- [x] `AdminProgramInfo`'s private reward formatters retired — `renderZltoAmount`, `renderZltoRange`,
      `getRewardEstimateMeta`, `renderRewardEstimateBadge` gone, with ~187 lines of bespoke markup.
      `formatCount` stays, scoped to counts only
- [x] `TreasuryZltoRewardStats` extracted from `TreasuryOverview` and reused here
- [x] `Program.referrerBalance` added to the TS model; the client-side subtraction removed
- [x] Two youth-facing `zltoEarned` figures moved onto `formatZlto` (`ReferrerStats`,
      `ReferralStatsSmallLink`)
- [x] Validation digest corrected — the referral rows now cite `ProgramRequestValidator.cs`, not the
      web mirror, and gained the two reward rows plus an explicit "no server rule exists" row
- [ ] **Authenticated browser pass** — the `?tab=referrals` rows, the detail block on
      `/admin/referrals/[id]/info`, and the capacity notice on the edit wizard's Completion &
      Rewards step, **including the case where the typed pool differs from the saved one**
- [ ] **Freeze or rename the new vocabulary** — "Payable now" (group) and "Payable per completion"
      (row stat) are not in the frozen T0 list. If they read well in the browser, promote them to
      constants in `lib/format/rewards.ts`; if not, rename before YOM-1074 copies them

## Decisions

<!-- Append-only. Date each entry. Epic-wide decisions live in ../README.md -->

- **2026-08-07: T4 ships as a detail + row pair plus a soft capacity notice, with no new API
  contract.** `POST /referral/program/search/admin` returns the full `Program`, so the row needed no
  new endpoint. Because the server has **no** rule tying a programme pool to Treasury capacity, the
  notice is advisory in all three homes — no field error, no disabled submit.
- **2026-08-07: on the edit wizard the notice drops the _programme_ cap whenever the typed pool
  differs from the saved one.** A typed pool has no server-derived balance, and the UI does not
  compute balances (epic domain rule). The notice then falls back to the Treasury cap alone.
  **Understating the cap is safe; inventing a balance is not.** Do not "improve" this by subtracting
  the cumulative client-side.
- **2026-08-07: a tie between the two caps stays with the Treasury.** It is the outer cap, and
  raising the programme pool alone would not move the figure — so "which level do I fix?" points at
  the one that would actually help.
- **2026-08-07: `TreasuryZltoRewardStats` extracted from `TreasuryOverview`.** The referral detail
  block shows the Treasury's four ZLTO figures beside the programme's own, and duplicating them was
  how the "one place per figure" rule would have been lost. Overview now renders the extraction.
  Cross-ticket: the file lives under YOM-1072's surface.
- **2026-08-07: `Program.referrerBalance` added to the TS model.** The API has returned
  `ReferrerBalance` (limit − total) all along; `AdminProgramInfo` was subtracting it client-side.
  Same rule as the reward balances — server-derived, display-only. Added **non-optional**, so `tsc`
  found the one other construction site (the create-form default).
- **2026-08-07: `formatCount` was kept in `AdminProgramInfo`.** It formats completions, ambassadors
  and claims — counts, not reward fields — so the "one place for reward numbers" rule does not reach
  it. Retiring it would have meant inventing a count formatter with no home.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1073](https://linear.app/didx/issue/YOM-1073)
- PRs: https://github.com/didx-xyz/yoma/pull/1741
- Related: [YOM-1095](https://linear.app/didx/issue/YOM-1095) (referral pool + Treasury FY alignment)
- Handoffs covering this ticket: [`handoffs/2026-08-07-b.md`](./handoffs/2026-08-07-b.md) (T4, with
  the full contract manifest). The branch state T4 was verified against is in
  [`../YOM-1063-…/handoffs/2026-08-07-a.md`](../YOM-1063-ui-organization-and-opportunity-admin/handoffs/2026-08-07-a.md)
  (addendum: zero Referral-domain changes came in with the master merge).
