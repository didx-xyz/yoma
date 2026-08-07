# Feature: Rewards / Treasury / Payout UI

## Meta

- **Feature**: Rewards / Treasury / Payout UI
- **Epic**: YOM-1051
- **Owner**: Jason
- **Areas**: web
- **Status**: in-progress
- **Started**: 2026-08-03

## Problem / Goal

Yoma allocates reward and payout capacity through a hierarchy — **Treasury → Organisation → Opportunity** and **Treasury → Referral Program → Referral Link** — but only fragments of it are visible in the UI. There is no Treasury admin surface at all, organisation reward pools round-trip silently without ever being rendered, and youth cannot convert ZLTO to money. This feature builds every surface in that hierarchy: an admin can see and set capacity at each level, and a youth can request a payout.

It is a mission-critical financial surface. Every figure must be formatted, labelled and scoped identically wherever it appears, because the current-financial-year values sit next to the lifetime ones and misreading one for the other is a money error.

Tickets: YOM-1051 (epic) · YOM-1063 (org + opportunity rewards) · YOM-1072 (treasury) · YOM-1073 (referral) · YOM-1074 (youth payout).

## Out of Scope

- **Multi-asset / multi-currency.** ZLTO and USD only, fixed server-side by deliberate decision. Supporting more requires asset/currency pool tables plus a coordinated API + UI migration.
- **List/search columns for organisation reward figures** — no endpoint provides them.
- **Hard server-side validation of referral pools against Treasury capacity** — does not exist; the UI gives soft guidance instead.
- **Per-opportunity pool/balance in any list view** — no list endpoint exposes them (see Decisions, 2026-08-05).
- **Payout transaction history / pending-transactions list** — no endpoint.
- **Treasury configuration audit history UI** — persisted server-side, not exposed.
- **Organisation self-service pool requests.** Registration deliberately leaves pools `null`; allocation is an admin act after approval.

## Plan

### Branch — load-bearing, not convention

All work is on `feature/custom-fields-framework`. The entire Treasury financial-year capability exists **only** here (commit `70b2ccd`, not an ancestor of `origin/master`). On master the Treasury fields are still `Chimoney…InUSD` and `ITreasuryService` still has `ChimoneyCashedOut()` — building there ships the provider-specific naming this epic forbids.

**Never name a payout provider in user-facing copy.** Provider-neutral everywhere.

### Domain rules (fixed truth)

- Treasury and Organisation pool/balance values are **current financial year** and reset on rollover. Opportunity's own and Referral Program values are **lifetime** and never reset.
- `Balance` is **server-derived and display-only**: `pool − cumulativeCurrentFY`. The UI never computes or submits a balance. It is `null` (not `0`) when no pool is set.
- Only pools are settable. Cumulatives and balances are read-only everywhere.
- **Rollover is automated**: daily job `5 0 * * *` UTC plus `EnsureCurrentFinancialYear` guards before every allocation. It zeroes Treasury **and all organisation** current-FY cumulatives; lifetime totals survive. A PATCH that moves the financial year forward also triggers it, so the admin UI must warn before submitting such a change.
- **Reward capacity is ZLTO-only.** ZLTO is the single reward asset at every level of the hierarchy — Treasury, Organisation, Opportunity and Referral. The parallel Yoma reward was removed server-side on 2026-08-06 (API `f051dfd8`); nothing in the UI may reintroduce a second reward asset without an API contract for it.
- ZLTO is whole numbers; USD 2dp. Conversion is expressed **N ZLTO = 1 USD**.

### Treasury availability model — three figures, never conflate

| Field | Definition | Use for |
| --- | --- | --- |
| `payoutPoolCurrentFinancialYearInUsd` | the allocation | the editable pool |
| `payoutBalanceCurrentFinancialYearInUsd` | pool − current-FY cumulative | **completed-only view. NOT capacity.** |
| `payoutBalanceAvailableCurrentFinancialYearInUsd` | balance − total pending | **capacity — use for headroom and every warning** |

Pending includes **every non-terminal payout regardless of the financial year it was initiated in**. Server-derived; no migration.

⚠️ **Cross-FY allocation quirk:** a payout initiated in the previous FY but completing after rollover is allocated to the **current** FY cumulative. So the current-FY figure means "payouts *completed* this financial year", never "initiated". Label and tooltip accordingly.

⚠️ **Rewards are deliberately asymmetric — there is no reward equivalent of the available balance and none is coming.** Yoma controls reward scheduling, processing and retries, so rewards join the cumulative at *schedule* time; a pending or failed award stays financially allocated. Payouts allocate at *initiation* via pending. Do not build a reward "available" figure by analogy.

### Wallet ledger contract (`UserProfileZlto`)

| Field | Meaning |
| --- | --- |
| `balance` | **nullable.** Wallet balance before payout reservations are excluded. API-derived as `available + pendingPayout`; `null` when the provider is offline |
| `pendingPayout` | **non-nullable.** Reserved for an active payout, from Yoma's own record. **API returns positive; the UI renders it negative** |
| `available` | **nullable.** Spendable now. Provider-sourced and **already excludes** `pendingPayout` — never subtract it twice |
| `pendingRewards` | **non-nullable.** ZLTO rewards awaiting transfer to the wallet (was `pendingAwards`) |
| `total` | **nullable.** `available + pendingRewards`. Does **not** include `pendingPayout` |

Ledger order: `Balance` → `−Pending payout` → `Available` → `+Pending rewards` → `Total`. Reconciles as `Available = Balance − Pending payout` and `Total = Available + Pending rewards`.

**Nullability is the offline contract.** The three provider-derived figures go `null` together; the two Yoma-owned figures always have values. **Branch on `null`, not on `zltoOffline`** — two signals for one state will drift. `zltoOffline` stays only as the explanatory flag for the notice.

⚠️ Because `balance` is API-derived, the ledger **always** reconciles on screen, even when `available` is stale. A summing ledger is not a correctness signal. Yoma is the source of truth for `pendingPayout`; the provider's reserved balance is a server-side cross-check only — **the UI must never reconcile or surface a mismatch.**

### `/admin/treasury` is the aggregation point (owner directive, 2026-08-04)

The hierarchy is managed from one place. Five banner tabs, each also reachable on the surface where that level naturally lives:

| Tab | `?tab=` | Owner | Status |
| --- | --- | --- | --- |
| Overview | *(none)* | T1 | done |
| Manage | `manage` | T1 | done |
| Organisations | `organisations` | T2 | done |
| Opportunities | `opportunities` | T3 | done (reduced, **temporary** — see Decisions) |
| Referrals | `referrals` | T4 | not started |

⚠️ **The Opportunities tab is provisional and will most likely be folded into the Organisations tab** (owner, 2026-08-06) — an organisation row expanding to reveal the opportunities drawing on its pools, instead of a sibling tab that repeats the organisation heading on every page of results. The *components* are the durable part and are already prop-driven; the tab's own grouping, paging and search are what would be discarded. Do not build on this tab's structure or invest in polishing it.

Binding on every task: **components are built for two homes from the start.** No component reads the router, the session or a route param for its own data — ids, payloads, callbacks and permissions arrive as props; the page owns fetching, mutation, routing and toasts. Nothing assumes a single entity: build the detail view and its compact row variant **in the same task**, never retrofitted. Formatting, labels and validation come from T0. Where a tab needs an endpoint that does not exist, record the gap and ship the tabs that work — **do not invent a contract**.

### Validation digest (code-verified — mirror client-side, exactly)

| Field | Rules | Source |
| --- | --- | --- |
| Treasury ZLTO pool (current FY) | optional (null clears it) · > 0 · ≤ 100,000,000 · whole | `TreasuryRequestUpdateValidator.cs:23-32` |
| Treasury payout pool (USD, current FY) | **required** · > 0 · ≤ 50,000 · ≤ 2dp | `TreasuryRequestUpdateValidator.cs:34-47` |
| Conversion rate (ZLTO per USD) | > 0 · ≤ 1,000 · ≤ 4dp | `TreasuryRequestUpdateValidator.cs:49-55` |
| FY start month + day | day must be valid for month — coupled control | `TreasuryRequestUpdateValidator.cs:15-21` |
| Treasury pools ≥ current-FY cumulative | both pools · **but the server zeroes the cumulatives first when the FY moves forward, so it then compares against 0** — mirror that or a legitimate save is blocked | `TreasuryService.cs:77-85` (service, not the validator) |
| Organisation ZLTO pool | > 0 · ≤ 10,000,000 · whole · ≥ current-FY cumulative | `OrganizationRequestValidatorBase.cs:72-76`, `OrganizationService.cs:465-469` |
| Referral program pool | ≥ 1 · ≤ 10,000,000 · whole · ≥ total rewards | `admin/referrals/[id]/index.tsx:200-321` |
| Conversion preview amount | positive whole ZLTO | `TreasuryService.cs:181-192` |

Caps diverge on purpose (100M Treasury / 10M Org / 10M Referral / 50k USD payout) — **never copy a limit from a neighbouring surface.**

### Frozen T0 conventions (binding on T3–T6)

- **`lib/format/rewards.ts` is the only place reward numbers are formatted.** `formatZlto` (0dp) · `formatUsd` (`$`, 2dp) · `formatConversionRate` (≤4dp) · `formatZltoRange` · `rewardBalanceTone`. (`formatYoma` is gone with the Yoma reward — there is no 2dp reward formatter and no reward field needs one.) No new `toLocaleString` / `Intl.NumberFormat` on a reward field anywhere (T6 greps for this). `EMPTY_VALUE = "—"` for null — never blank, never a substituted `0`. `REWARD_BALANCE_LOW_RATIO = 0.1`. Locale pinned `en-US`.
- **Label vocabulary, used verbatim**: `LABEL_SUFFIX_FY = "(this financial year)"` · `LABEL_SUFFIX_LIFETIME = "(lifetime)"` · `HEADING_FY = "Current financial year"` · `HEADING_LIFETIME = "All-time"`. Never a bare "Cumulative" — say what it is, then the scope ("Awarded (this financial year)"). USD carries `$` on the value; the word "USD" belongs in the group heading.
- **The two payout balances (frozen 2026-08-06)** — constants in the same module, with their tooltips, because the wording is what distinguishes them: `LABEL_PAYOUT_BALANCE_COMPLETED = "Remaining balance"` (*the pool minus payouts completed this financial year… not what is available to pay out*) vs `LABEL_PAYOUT_BALANCE_AVAILABLE = "Available to pay out now"` (*the remaining balance minus payouts already in flight… the capacity a new payout is checked against*). **Rewards keep the plain "Remaining balance"** — they have only one balance.
- **`components/Rewards/RewardStat.tsx`** — `RewardStat` / `RewardStatGroup` / `balanceStatTone`. Values arrive **pre-formatted**; the primitive never formats.
- **Validation pattern** — react-hook-form + `zodResolver`, schema built by a **factory closing over the server payload** so cross-field floors can reference server cumulatives; all rules in one `superRefine` split into per-field validators, each citing the C# it mirrors. `mode: "onTouched"`. Reference: `lib/treasury/treasuryFormSchema.ts`.
- **Per-field server errors** — the API discards `PropertyName`, so mapping is **message-text matching**. Reference: `lib/treasury/serverErrors.ts`. Unmatched messages render verbatim above the form; non-400s fall through to `<ApiErrors />`.
- **Shared form kit** — `FormField` takes `htmlFor`/`errorId`, `FormLabel` takes `htmlFor`, `FormError` takes `id` + `role="alert"`. Repo-wide effect; use `aria-describedby`/`aria-invalid` on new fields.
- **`lib/format/amountInput.ts`** — the shared typed-amount parser (rejects `1e5`, counts decimals on the typed string).
- **Full-replacement payload builders** — `PATCH /treasury` and `PATCH /organization` replace everything. `lib/organisation/organizationRequest.ts` is the single builder for the organisation payload.

## Tasks

- [x] **T0** — Foundations: shared formatters, FY/lifetime vocabulary, `RewardStat` primitive, validation + server-error patterns (delivered inside T1)
- [x] **T1** — Treasury Admin: `/admin/treasury`, Overview + Manage tabs, rollover guard, capacity warnings *(dev complete; corrective work owed below)*
- [x] **T2** — Organisation Rewards: edit-step rework, `info.tsx` read-only block, `?tab=organisations` *(dev complete)*
- [x] **T3** — Opportunity Rewards: detail context block, edit-step vocabulary alignment, `?tab=opportunities` *(dev complete, reduced scope — see Decisions)*
- [ ] **T4** — Referral Rewards alignment (YOM-1073) + `?tab=referrals`. Must show Treasury **ZLTO reward** figures, not USD payout figures
- [ ] **T5** — Youth Payout (YOM-1074): amount entry, indicative conversion preview, payout initiation against `POST /user/payout/zlto`
- [ ] **T6** — Production hardening: consistency, scope-labelling audit, a11y, remove the `?mock=` dev aid
- [x] **T1 corrective (a)** — capacity readings repointed to `payoutBalanceAvailableCurrentFinancialYearInUsd` in `TreasuryOverview.tsx` + `TreasuryCapacityWarnings.tsx`, tone inputs included
- [x] **T1 corrective (b)** — completed-only balance kept, demoted to a plain-toned "Completed payouts only" stat
- [x] **T1 corrective (c)** — pool-floor mirror now `current-FY cumulative + total pending`, with the pending half retained through a rollover
- [x] **T1 corrective (d)** — verified: the existing `/payout pool/i` matcher already covers the new rejection; no new matcher needed
- [x] **T1 corrective (e)** — `payoutAvailableDepleted` + `payoutAvailableOvercommitted` mock scenarios
- [x] **T2 corrective** — `NoImage` placeholder resized to match the 30px logo
- [x] **Label vocabulary frozen** — the two payout balance labels + tooltips are constants in `lib/format/rewards.ts`
- [x] **Yoma reward capability removed from the web** — matches API `f051dfd8`; reward capacity is ZLTO-only across T0–T3
- [ ] **Wallet ledger** — add `balance`, rename `pendingAwards` → `pendingRewards`, render `pendingPayout` negative, handle the nullable offline render
- [ ] **Authenticated browser pass on T1 + T2 + T3** — now unblocked; the corrective work is in
- [ ] **Fold the Opportunities tab into Organisations** (owner intent, see the tab note above)
- [ ] **Fix the merge artifact in `OpportunityCompletionRead.tsx:324-335`** — duplicated "Time to complete" block from `55101464`; check the sibling at line 295 before deciding whether to drop one or both

## Decisions

<!-- Append-only. Date each entry. -->

- **2026-08-03: branch `feature/custom-fields-framework` is load-bearing.** The Treasury FY capability is CF-only (`70b2ccd` is not an ancestor of master, which still carries `Chimoney…InUSD`). An earlier "branch off master" reading was wrong.
- **2026-08-03: follow the code, not the tickets.** Where a ticket asks for something the API does not provide, build what the code supports and record the remainder. No API tickets raised for the list/search columns or referral hard validation.
- **2026-08-04: T0 conventions frozen** (formatters, label vocabulary, primitive, validation + server-error patterns). T2–T6 consume them verbatim.
- **2026-08-04: the rollover guard does not port `TreasuryHelper`.** It derives a candidate FY start only where clamping provably cannot occur, compares against the server-derived `financialYearStartDate`, and warns when uncertain (29 Feb, ±1 day around the anniversary, unparseable input). Posture: may warn spuriously, never silent on a reset.
- **2026-08-04: `/admin/treasury` is the aggregation point** — five tabs, and every reward component is built for two homes.
- **2026-08-04: organisation admins may see their own reward figures read-only** on `organisations/[id]/info`. The endpoint is `Role_Admin, Role_OrganizationAdmin`; wrap in an `isAdmin` check if it must become Yoma-admin-only.
- **~~2026-08-04: epic paused at T2 pending Wall 1 (the registration prompt).~~** Struck 2026-08-05 — the owner directed T3 to proceed. The scheduling gate no longer applies; T4 and T5 are sequenced on their own merits.
- **2026-08-05: "cash-out" is now "payout" — binding on all remaining work.** API `e5209d6c` + UI `df675be4`, verified contract-for-contract. Renamed: `payoutPoolCurrentFinancialYearInUsd`, `payoutCumulative…`, `payoutBalance…`, `TREASURY_LIMITS.payoutPoolMaxUsd` / `payoutPoolDecimals`. `GET /treasury/conversion/zlto-usd` now returns `{ amount, currency, treasuryFundsAvailable }`, not a bare decimal. T5 retitled **Youth Payout**. Provider-neutrality is unchanged and still holds — this was a vocabulary change, not a neutrality fix. **ZLTO naming stays** (baked into API and UI; multi-currency deliberately out of scope).
- **2026-08-05: availability model resolved** (`48540971`). `TreasuryInfo` gained `payoutBalanceAvailableCurrentFinancialYearInUsd` = balance − total pending. Capacity messaging must use it; the completed-only balance is not capacity. This makes T1's shipped capacity warnings **wrong** — they overstate capacity by the pending total (corrective items above). `ConvertZltoToUsd` now locks the Treasury and ensures the FY, so the preview and the real initiation agree.
- **2026-08-05: `total` semantics corrected.** `total = available + pendingRewards`; it has **never** included `pendingPayout`. The 2026-08-04 note claiming otherwise was wrong and is retracted — `4bfeb55c` was written against the incorrect reading, so anything branching on `total` needs re-checking.
- **2026-08-05: renames in the profile payload break at runtime, not compile time.** `UserProfileZlto.Pending` → `PendingAwards`/`PendingPayout` crashed `WalletCard` and `Marketplace` with `undefined.toLocaleString()` because the TS interface still declared the old field. Fixed in `4bfeb55c`. **Mitigation for the `pendingAwards` → `pendingRewards` rename: delete the old field from the interface in the same change**, so the compiler surfaces every stale read.
- **2026-08-05: T3's Opportunities tab ships reduced — no endpoint exposes per-opportunity pool/balance.** `POST /opportunity/search/admin` returns `OpportunityInfo` (per-completion reward + lifetime cumulative, no organisation reward fields). `OpportunityItem` declares the six `Organization…CurrentFinancialYear` fields but **every reward field on it is `[JsonIgnore]`** (`OpportunityItem.cs:34-92`), and it is only returned by the picker `POST /opportunity/search/filter/opportunity`. The tab therefore shows per-completion reward + lifetime awarded per opportunity, grouped under its organisation's current-FY figures. Nothing synthesised. **Ask for `[JsonIgnore]` to be dropped, or the fields added to `OpportunityInfo`, to build it as designed.**
- **2026-08-05: T3's detail block reads the organisation, not the opportunity payload's sub-object.** That sub-object is FY-only (6 fields) while `OrganizationRewardFigures` needs 8, so it would render "—" for every All-time figure. `GET /organization/{id}` gives all eight and lets the block reuse `OrganizationRewardStats` verbatim.
- **2026-08-05: master's UI was ported web-only, with no merge parent** (`cafa61c8`). Master's API changes were deliberately excluded. A merge commit would have marked them "intentionally removed" and merging this branch back would delete them; as committed, master stays unmerged and a later full merge still brings the API side in.
- **2026-08-05: status filters send the enum *name*, not the ordinal.** `OrganizationStatus.Active.toString()` → `"1"` parsed correctly only because the TS and C# ordinals happen to align. Fixed in both Treasury tabs.
- **2026-08-06: the two payout balance labels are frozen** — "Remaining balance" (completed-only, demoted, plain tone) vs "Available to pay out now" (capacity, carries the tone), each with its tooltip, as constants in `lib/format/rewards.ts`. Applied to T1; T4 copies them verbatim. Rewards keep the unqualified "Remaining balance" since they have only one balance.
- **2026-08-06: T1's capacity defects fixed.** Both surfaces now tone and warn off the available balance. Where the two balances differ, the UI says why (`"$49,500 in flight"` / `"…is held by payouts already in flight."`) rather than leaving an unexplained gap between two numbers.
- **2026-08-06: no new `serverErrors.ts` matcher was needed.** The pool-floor rejection was assumed to be unmatched, but the actual server text is *"The **payout pool** for the current financial year cannot be less than the total payout amount (N USD) already paid out or pending"*, which the existing broad `/payout pool/i` pattern already routes to the right field — verified against all nine verbatim messages. The lesson is the general one: read the server string before adding a matcher for it.
- **2026-08-06: the pending total is derived client-side as `completedBalance − availableBalance`** (`lib/treasury/payoutCommitment.ts`). The API returns both balances but not the pending figure, and the form needs it to mirror the server's floor. It is `null`, not `0`, when no pool is set — in which case the client declines to invent a floor and lets the server reject.
- **2026-08-06: the Opportunities tab is provisional** and will likely be folded into the Organisations tab. Recorded in the tab table above and at the top of `TreasuryOpportunitiesTab.tsx`; a dev-only banner says so in the UI.
- **2026-08-07: the Yoma reward is gone — reward capacity is ZLTO-only.** API `f051dfd8` removed the whole capability (fields, allocation paths, validator rules and columns); the web now matches. Removed from the models: the four organisation figures, the settable org pool, the opportunity reward/pool/cumulative/balance and its three `organizationYomaReward*CurrentFinancialYear`, `OpportunityInfo`'s three, `MyOpportunityInfo.yomaReward`, and the dashboard's `yomaRewardTotal`. Consequences to carry forward: **`OrganizationRewardFigures` is four fields, not eight** (superseding the 2026-08-05 entry's "needs 8"); `OrganizationRewardPools` is a single key; `formatYoma` and `ORGANIZATION_REWARD_LIMITS.yomaPoolDecimals` are deleted, and with them the decimal(12,2) silent-rounding rule — **no reward field is 2dp any more, only USD is**. The org pool validator is now simply `> 0 · ≤ 10M · whole`. `YouthCompletedCard` had been rendering `{opportunity.yomaRewardTotal}` into an empty badge since the API change — the exact failure mode of `4bfeb55c`, and the reason the interfaces were emptied **first** so `tsc` could find every reader.
- **2026-08-07: master is now genuinely merged — the 2026-08-05 "master stays unmerged" entry is discharged.** Adrian merged `origin/master` in (`55101464`, with `7204e4f6` on top), so the API side that `cafa61c8` deliberately excluded has landed. **T4 needs no catch-up: zero changes to the Referral domain in API or web**, the whole incoming web delta is 6 lines in one file, and the Treasury churn is migration consolidation only (the standalone Treasury and `Remove_Reward_Yoma` migrations folded into `ApplicationDb_Custom_Fields_Treasury_Payout`) with no Organisation/Opportunity/Treasury DTO or validator change. The Yoma removal survived intact. His merge message lists 7 `src/web` conflicts despite the recollection of none; the resolutions are sound because `cafa61c8` had already ported master's UI — but it left a duplicated render block in `OpportunityCompletionRead.tsx:324-335`, still unfixed. Details in `handoffs/2026-08-07-a.md`.
- **2026-08-07: single-field forms and half-empty stat grids were resolved deliberately.** `OrganizationRewardPoolsForm` stays a component at one field — it owns the schema factory, resolver, server-error-to-field plumbing, aria wiring and clear-the-pool warning that both of its homes would otherwise duplicate. Column counts were revisited so no survivor is stranded: `OrganizationRewardStats` keeps `columns` (4 stats divide evenly by 2 and 4), while both summary rows drop to `columns={2}` and `OpportunityRewardContext` falls back to 2 when the payload has no pool — otherwise the info page would render two stats in a four-column row.

## Links

- PRs: https://github.com/didx-xyz/yoma/pull/1741
- Key commit (Treasury FY capability, CF-branch only): https://github.com/didx-xyz/yoma/commit/70b2ccdfc7dfb40e1ad83ff75409e920c72bafb6
- Related: `docs/work/active/rewards-payout-ui/handoffs/` · superseded working plan `FEAT-YOM-1051-cashout-ui-working-plan.md` v1.9 (Google Drive vault, `_incoming/other/`)
