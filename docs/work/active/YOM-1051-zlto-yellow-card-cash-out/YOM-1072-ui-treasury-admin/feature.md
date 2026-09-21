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
routing (`?tab=`), the Overview, Manage and Payouts tabs; siblings own the other three tab bodies.
The `TreasuryInfo` payload is fetched once by the page and **passed down as a prop** to every tab
that needs it — so no tab can disagree with the capacity banner rendered above it. Payouts takes no
Treasury prop: it reports transactions, and the banner already owns the pool figures.

Key files:

| Purpose                          | File                                                 |
| -------------------------------- | ---------------------------------------------------- |
| Page shell, tabs, save + rollover | `pages/admin/treasury/index.tsx`                    |
| Overview tab                     | `components/Treasury/TreasuryOverview.tsx`           |
| Manage tab (the only form)       | `components/Treasury/TreasuryManagementForm.tsx`     |
| Capacity banners (all tabs)      | `components/Treasury/TreasuryCapacityWarnings.tsx`   |
| Rollover confirmation            | `components/Treasury/TreasuryRolloverConfirmDialog.tsx` |
| Shared ZLTO stat group           | `components/Treasury/TreasuryZltoRewardStats.tsx`    |
| Payouts tab (`?tab=payouts`)     | `components/Treasury/TreasuryPayoutsTab.tsx`         |
| Payout row / detail / badge      | `components/Payout/PayoutTransactionSummaryRow.tsx`, `PayoutTransactionDetail.tsx`, `PayoutStatusBadge.tsx` |
| Payout filter popup              | `components/Payout/PayoutTransactionFilterVertical.tsx` |
| Admin payout vocabulary + filter mapping | `lib/payout/adminTransactions.ts`            |
| Model + limits                   | `api/models/treasury.ts`                             |
| Payout audit contract            | `api/models/payout.ts` (admin section), `api/services/treasury.ts` |
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
- [x] **Payout transactions** — Admin query/history surface at `?tab=payouts`: search, status/type/
      amount/date filters, paginated rows and a detail dialog carrying the payout, the youth and the
      linked ZLTO reservation. Query-only. Built 2026-09-21; browser pass owed with it
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
- [ ] **Authenticated browser pass** — Overview → Manage → a real save → the rollover dialog, plus
      Payouts → search → filters → a row's detail dialog. Tracked epic-wide; this ticket is the
      largest part of it. Payouts additionally needs **data**: a local database has no payout rows,
      so it wants Dev/Stage or a seeded transaction
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
- **2026-09-21: the Payouts tab shows no provider and offers no provider filter.** The search
  contract has `providers`, the row carries `provider`, and there is exactly one value it can ever
  hold today. Rendering it would put the payout provider's name on an admin screen, which the epic
  forbids ("provider-neutral everywhere"), in exchange for a filter with a single option and a
  column that never varies. Both the model field and the filter key are typed and commented, so
  adding them is a UI change only — do it when a second provider exists.
- **2026-09-21: the payout filter is plain state, not the react-hook-form + zod factory.** The
  frozen validation pattern exists for the forms that *submit* money, where per-field server errors
  have to be mapped back by message text. A query filter has two rules (`amount > 0`, `amountTo >=
  amountFrom`, plus the date-order pair) and no server-error mapping, so the schema factory would
  be ceremony around four inputs. The rules are mirrored from
  `PayoutTransactionSearchFilterValidator` and cited in the component.
- **2026-09-21: the tab's filters live in component state, like its siblings.** `?tab=payouts`
  already owns the url and the Organisations/Opportunities tabs set the precedent. The cost is
  real and known: an admin cannot share a link to a filtered list or to one payout. That is the
  trigger to move this onto the querystring — not a general tidy-up.
- **2026-09-21: the two payout amounts are kept in separate, unit-labelled groups.** The payout's
  `amount` is USD and the linked reward transaction's is ZLTO, and the API calls both "amount"
  (epic gotcha). The detail dialog puts them under "Payout (USD)" and "ZLTO funding", formatted
  with `formatUsd` / `formatZlto` respectively; the row shows only the USD figure, because the
  ZLTO is not on the search projection and must never be reconstructed at today's rate.
- **2026-09-21: admin status wording is deliberately not the youth's.** `lib/payout/copy.ts` and
  `outcome.ts` collapse the three active statuses into one neutral "in progress" and say nothing a
  youth cannot act on. The admin surface needs the recorded status by name plus what it means for
  the ZLTO (held / burned / returned), so `lib/payout/adminTransactions.ts` is a separate
  vocabulary. `Failed` is toned amber rather than red on purpose — a failed payout released the
  reservation, so nothing needs rescuing; `ReconciliationRequired` is the state that wants
  attention, because the outcome is unknown and the ZLTO is still held.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1072](https://linear.app/didx/issue/YOM-1072)
- PRs: https://github.com/didx-xyz/yoma/pull/1741
- Related: [YOM-1053](https://linear.app/didx/issue/YOM-1053) (admin treasury capability) ·
  [YOM-1058](https://linear.app/didx/issue/YOM-1058) (api treasury domain)
- Handoffs covering this ticket: [`handoffs/`](./handoffs/) — `2026-08-05-a.md` (seed; T0–T3 state
  and the T1 corrective list), `2026-08-06-a.md` (T1 correctives landed), `2026-08-11-a.md`
  (docs restructure), `2026-08-27-a.md` (Adrian: the payout transaction API contract),
  `2026-09-21-a.md` (the Payouts tab built against it). The Yoma-reward removal touched this
  ticket's rollover dialog copy — see
  [`../YOM-1063-…/handoffs/2026-08-07-a.md`](../YOM-1063-ui-organization-and-opportunity-admin/handoffs/2026-08-07-a.md).
