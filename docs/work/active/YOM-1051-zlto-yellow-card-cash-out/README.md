# Epic: YOM-1051 — ZLTO Payout (Treasury, Reward Pools and Youth Cash-Out)

## Meta

- **Epic**: [YOM-1051](https://linear.app/didx/issue/YOM-1051)
- **Owners**: Adrian (api) · Jason (web)
- **Areas**: api, web
- **Status**: in-progress
- **Started**: 2026-03-04 (api), 2026-08-03 (web)
- **Branch**: `feature/custom-fields-framework` — **load-bearing, not convention.** See below.

> ⚠️ **The folder names carry the payout provider because the convention takes the slug verbatim
> from the Linear URL.** That is a filing decision, not a copy decision. The provider-neutrality
> rule below applies to user-facing copy and to code identifiers, and is unaffected — do not
> "fix" a folder name to satisfy it.

> Restructured on 2026-08-11 from a single `rewards-payout-ui/` folder into this epic + four
> ticket folders. Nothing was rewritten: the handoffs are the contemporaneous records, moved with
> `git mv`. See `YOM-1072-ui-treasury-admin/handoffs/2026-08-11-a.md` for what moved where and what
> was deliberately dropped.

## Why This Epic Exists

Yoma allocates reward and payout capacity through a hierarchy — **Treasury → Organisation →
Opportunity** and **Treasury → Referral Program → Referral Link** — but only fragments of it are
visible in the UI. There is no Treasury admin surface at all, organisation reward pools round-trip
silently without ever being rendered, and youth cannot convert ZLTO to money. This epic builds
every surface in that hierarchy: an admin can see and set capacity at each level, and a youth can
request a payout.

It is a mission-critical financial surface. Every figure must be formatted, labelled and scoped
identically wherever it appears, because the current-financial-year values sit next to the lifetime
ones and **misreading one for the other is a money error**. That is why the conventions below are
frozen and shared rather than re-decided per ticket.

## Child Features

| Folder                                                                                                                             | Ticket                                             | Area | Plan tasks | Status                            |
| ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---- | ---------- | --------------------------------- |
| [`YOM-1053-admin-treasury-capability/`](./YOM-1053-admin-treasury-capability/feature.md) | [YOM-1053](https://linear.app/didx/issue/YOM-1053) | both | — | in-progress — API complete, web hardening pending |
| [`YOM-1058-api-treasury-domain/`](./YOM-1058-api-treasury-domain/feature.md) | [YOM-1058](https://linear.app/didx/issue/YOM-1058) | api | — | review |
| [`YOM-1061-organization-admin-organization-reward-pools-financial-year/`](./YOM-1061-organization-admin-organization-reward-pools-financial-year/feature.md) | [YOM-1061](https://linear.app/didx/issue/YOM-1061) | both | — | in-progress — API complete, web hardening pending |
| [`YOM-1062-api-organization-domain/`](./YOM-1062-api-organization-domain/feature.md) | [YOM-1062](https://linear.app/didx/issue/YOM-1062) | api | — | review |
| [`YOM-1095-referrals-admin-reward-pools-and-treasury-financial-year-alignment/`](./YOM-1095-referrals-admin-reward-pools-and-treasury-financial-year-alignment/feature.md) | [YOM-1095](https://linear.app/didx/issue/YOM-1095) | both | — | in-progress — API complete, web hardening pending |
| [`YOM-1052-youth-yellow-card-cash-out/`](./YOM-1052-youth-yellow-card-cash-out/feature.md) | [YOM-1052](https://linear.app/didx/issue/YOM-1052) | both | — | in-progress — provider implementation and E2E |
| [`YOM-1049-api-zlto-wallet-reservation-capability/`](./YOM-1049-api-zlto-wallet-reservation-capability/feature.md) | [YOM-1049](https://linear.app/didx/issue/YOM-1049) | api | — | in-progress — implemented, E2E pending |
| [`YOM-1056-api-zlto-infrastructure-integration/`](./YOM-1056-api-zlto-infrastructure-integration/feature.md) | [YOM-1056](https://linear.app/didx/issue/YOM-1056) | api | — | in-progress — implemented, E2E pending |
| [`YOM-1057-api-payout-domain-and-rewards-integration/`](./YOM-1057-api-payout-domain-and-rewards-integration/feature.md) | [YOM-1057](https://linear.app/didx/issue/YOM-1057) | api | — | in-progress — implemented, E2E pending |
| [`YOM-1055-api-yellow-card-hosted-payout-integration/`](./YOM-1055-api-yellow-card-hosted-payout-integration/feature.md) | [YOM-1055](https://linear.app/didx/issue/YOM-1055) | api | — | in-progress — client implemented, E2E pending |
| [`YOM-1059-api-yellow-card-payout-status-integration/`](./YOM-1059-api-yellow-card-payout-status-integration/feature.md) | [YOM-1059](https://linear.app/didx/issue/YOM-1059) | api | — | in-progress — implemented, E2E pending |
| [`YOM-1077-sre-webhooks-and-yellow-card-configuration/`](./YOM-1077-sre-webhooks-and-yellow-card-configuration/feature.md) | [YOM-1077](https://linear.app/didx/issue/YOM-1077) | api/SRE | — | in-progress — environment configuration pending |
| [`YOM-1072-ui-treasury-admin/`](./YOM-1072-ui-treasury-admin/feature.md)                                                           | [YOM-1072](https://linear.app/didx/issue/YOM-1072) | web  | T0, T1     | in-progress — dev complete, browser pass owed |
| [`YOM-1063-ui-organization-and-opportunity-admin/`](./YOM-1063-ui-organization-and-opportunity-admin/feature.md)                   | [YOM-1063](https://linear.app/didx/issue/YOM-1063) | web  | T2, T3     | in-progress — dev complete, T3 reduced |
| [`YOM-1073-ui-referral-program-rewards-create-update-info/`](./YOM-1073-ui-referral-program-rewards-create-update-info/feature.md) | [YOM-1073](https://linear.app/didx/issue/YOM-1073) | web  | T4         | in-progress — dev complete, browser pass owed |
| [`YOM-1074-ui-youth-yellow-card-cash-out/`](./YOM-1074-ui-youth-yellow-card-cash-out/feature.md)                                   | [YOM-1074](https://linear.app/didx/issue/YOM-1074) | web  | T5         | planning — wallet ledger first |

### T-number → ticket map

The pre-2026-08-11 plan numbered its tasks **T0–T6**, and every handoff in this epic refers to
those numbers. They do not map one-to-one onto tickets, so keep this table until the handoffs age
out:

| Task   | What                                                     | Ticket                   |
| ------ | -------------------------------------------------------- | ------------------------ |
| **T0** | Foundations — formatters, vocabulary, `RewardStat`, validation + server-error patterns | YOM-1072 (built inside T1); conventions are epic-wide, below |
| **T1** | Treasury Admin — `/admin/treasury`, Overview + Manage, rollover guard, capacity warnings | YOM-1072 |
| **T2** | Organisation Rewards — edit step, info block, `?tab=organisations` | YOM-1063 |
| **T3** | Opportunity Rewards — detail context block, `?tab=opportunities` | YOM-1063 |
| **T4** | Referral Rewards alignment + `?tab=referrals`            | YOM-1073                 |
| **T5** | Youth Payout — amount entry, conversion preview, initiation | YOM-1074              |
| **T6** | Production hardening — consistency + scope-label audit, a11y, remove `?mock=` | **epic-wide**, below |

Tickets with no folder because no implementation belongs to them yet:

| Ticket | Area | Note |
| ------ | ---- | ---- |
| [YOM-1054](https://linear.app/didx/issue/YOM-1054) | business | High-level requirements only. |
| [YOM-1079](https://linear.app/didx/issue/YOM-1079) | business/provider | Sandbox contract received; production configuration and credentials remain outstanding. |
| [YOM-1048](https://linear.app/didx/issue/YOM-1048) | obsolete | Chimoney-only ticket remains in Linear although that provider was dropped. |

### API implementation state

Verified by reading the Treasury, Payout, Reward and provider handlers, their migrations and TODOs;
the Treasury figures were also validated through local API/database probes. The branch is authoritative:

- Treasury and Organization financial-year capability is implemented and manually tested.
- ZLTO reserve/commit/release and reserved wallet balance are implemented against ZLTO's contract.
- Payout persistence, Reward linkage, capacity, profile ledger, session and reconciliation shells exist.
- Admin Treasury payout transaction lookup and paginated search are exposed from the Treasury API.
  Search returns lightweight payout and user identity rows; retrieval by id adds the linked ZLTO transaction.
- Yellow Card OAuth authentication, hosted payout initiation, refreshed-session lookup and
  reconciliation status lookup are implemented against IXO's generated sandbox OpenAPI.
- Yellow Card raw-body HMAC authentication, replay suppression and payload/status processing are
  implemented. Payout.Transaction and Reward.Transaction remain the authoritative processing
  records; the polling fallback reconciles missed or failed deliveries.
- The existing Linear description still says a payment URL is persisted. The code deliberately does
  not treat the short-lived URL as durable profile state; an active session is refreshed on demand.
- IXO hosted sessions last approximately 30 minutes and may be refreshed while the payout is active.
  Although IXO can technically reopen a completed hosted session, Yoma treats Completed as final and does
  not offer a resume action. An unconfirmed payout remains resumable
  for 24 hours; after confirmation it cannot expire and reaches Completed or Failed within approximately six
  hours at worst. The ZLTO reservation is therefore fixed at
  30 hours. Webhooks and five-minute reconciliation are the authoritative early commit/release triggers;
  reservation expiry is only the final safety net.
- Cash-out is user-facing wording. API/domain identifiers use provider-neutral `Payout` terminology.

### Why each child exists

| Ticket | Purpose |
| ------ | ------- |
| YOM-1052 | Deliver the youth ZLTO-to-USD payout journey. |
| YOM-1074 | Build the youth-facing payout experience once the provider contract is available. |
| YOM-1055 | Integrate the hosted Yellow Card payout session. |
| YOM-1056 | Integrate ZLTO wallet reservation, commit and release operations. |
| YOM-1057 | Orchestrate payout state across Treasury, rewards, ZLTO and the external provider. |
| YOM-1059 | Receive or reconcile external payout outcomes. |
| YOM-1053 | Give platform admins control and visibility over Treasury. |
| YOM-1058 | Provide Treasury configuration, conversion, allocation and rollover behavior. |
| YOM-1072 | Build the Treasury admin interface. |
| YOM-1054 | Track the business/provider readiness needed before end-to-end payout. |
| YOM-1049 | Ensure the ZLTO wallet supports reservation-based burn safely. |
| YOM-1079 | Secure the final IXO/Yellow Card agreements and technical contract. |
| YOM-1048 | Historical Chimoney/KYC confirmation; obsolete after the provider change. |
| YOM-1061 | Let organisation admins manage current-financial-year reward capacity. |
| YOM-1062 | Provide the organisation pool/cumulative contract and rollover support. |
| YOM-1063 | Surface organisation and Opportunity reward capacity in admin UI. |
| YOM-1095 | Align referral reward pools and reporting with Treasury financial years. |
| YOM-1073 | Surface referral program reward configuration and capacity in admin UI. |
| YOM-1077 | Provision secure, environment-specific provider/webhook configuration. |

Ownership: IXO/Yellow Card owns production configuration and credentials; Adrian owns API completion
and E2E validation; Robbie/SRE owns environment configuration; Jason owns Web completion.

## Shared Contract

Everything in this section is **verified against the code on this branch**, and is binding on every
child. Feature docs link here rather than restating it.

### Branch — load-bearing, not convention

All work is on `feature/custom-fields-framework`. The entire Treasury financial-year capability
exists **only** here (commit `70b2ccd`, not an ancestor of `origin/master`). On master the Treasury
fields are still `Chimoney…InUSD` and `ITreasuryService` still has `ChimoneyCashedOut()` — building
there ships the provider-specific naming this epic forbids.

**Never name a payout provider in user-facing copy.** Provider-neutral everywhere.

Branch state, in order:

- `cafa61c8` ported master's **UI only**, with no merge parent, so master's API changes stayed out.
- `55101464` (+ `7204e4f6`) is a **real merge of `origin/master`**, so that debt is discharged.
  The earlier "master is not merged" gotcha no longer applies.
- Branch-sync verification notes belong to the Custom Fields epic and now live in [`YOM-1244/handoffs/2026-08-07-a.md`](../YOM-1244-customizable-fields-framework/handoffs/2026-08-07-a.md).

### Domain rules (fixed truth)

- Treasury and Organisation pool/balance values are **current financial year** and reset on
  rollover. Opportunity's own and Referral Program values are **lifetime** and never reset.
- `Balance` is **server-derived and display-only**: `pool − cumulativeCurrentFY`. The UI never
  computes or submits a balance. It is `null` (not `0`) when no pool is set.
- Only pools are settable. Cumulatives and balances are read-only everywhere.
- **Rollover is automated**: daily job `5 0 * * *` UTC plus `EnsureCurrentFinancialYear` guards
  before every allocation. It zeroes Treasury **and all organisation** current-FY cumulatives;
  lifetime totals survive. A PATCH that moves the financial year forward also triggers it, so the
  admin UI must warn before submitting such a change.
- ⚠️ **A `null` pool means the cap is NOT ENFORCED — unlimited — never "nothing can be awarded."**
  Every allocation path applies a level's cap only when that level has a pool:
  `ProcessRewardAllocation` (`OpportunityService.cs:2172-2194`) skips a level whose `rewardPool` is
  null, the referral path guards on `treasury.ZltoRewardPoolCurrentFinancialYear.HasValue` /
  `program.ZltoRewardPool.HasValue` (`LinkUsageService.cs:703-717`), and
  `TreasuryService.ZltoRewardAwarded` never checks a pool before accruing. With no pool at any level
  the configured rewards are paid in full, forever. Copy that reads an empty pool as a block is the
  exact inverse of what happens — this was shipped wrong on two surfaces and corrected 2026-08-07.
- **Reward capacity is ZLTO-only.** ZLTO is the single reward asset at every level — Treasury,
  Organisation, Opportunity and Referral. The parallel Yoma reward was removed server-side
  (API `f051dfd8`); nothing in the UI may reintroduce a second reward asset without an API contract
  for it. There is no 2dp reward formatter and no reward field needs one.
- ZLTO is whole numbers; USD 2dp. Conversion is expressed **N ZLTO = 1 USD**.
- **Status filters send the enum _name_, not the ordinal.** `OrganizationStatus.Active.toString()`
  → `"1"` parsed only because the TS and C# ordinals happen to align. Use `Enum[Enum.Value]`.

### Treasury availability model — three figures, never conflate

| Field                                             | Definition                   | Use for                                           |
| ------------------------------------------------- | ---------------------------- | ------------------------------------------------- |
| `payoutPoolCurrentFinancialYearInUsd`             | the allocation               | the editable pool                                 |
| `payoutBalanceCurrentFinancialYearInUsd`          | pool − current-FY cumulative | **completed-only view. NOT capacity.**            |
| `payoutBalanceAvailableCurrentFinancialYearInUsd` | balance − total pending      | **capacity — use for headroom and every warning** |

Pending includes **every non-terminal payout regardless of the financial year it was initiated in**.
Server-derived; no migration. Added by API `48540971`.

⚠️ **Cross-FY allocation quirk:** a payout initiated in the previous FY but completing after
rollover is allocated to the **current** FY cumulative. So the current-FY figure means "payouts
_completed_ this financial year", never "initiated". Label and tooltip accordingly.

⚠️ **Pending payouts survive a financial-year rollover; the cumulative does not.** Any floor or
capacity arithmetic has to keep the pending half when the FY moves forward.

⚠️ **Rewards are deliberately asymmetric — there is no reward equivalent of the available balance
and none is coming.** Yoma controls reward scheduling, processing and retries, so rewards join the
cumulative at _schedule_ time; a pending or failed award stays financially allocated. Payouts
allocate at _initiation_ via pending. **Do not build a reward "available" figure by analogy** — this
is a _do not_, not a gap.

### `/admin/treasury` is the aggregation point (owner directive, 2026-08-04)

The hierarchy is managed from one place. Five banner tabs, each also reachable on the surface where
that level naturally lives:

| Tab           | `?tab=`         | Ticket   | Status                                        |
| ------------- | --------------- | -------- | --------------------------------------------- |
| Overview      | _(none)_        | YOM-1072 | done                                          |
| Manage        | `manage`        | YOM-1072 | done                                          |
| Organisations | `organisations` | YOM-1063 | done                                          |
| Opportunities | `opportunities` | YOM-1063 | done (reduced, **temporary**)                 |
| Referrals     | `referrals`     | YOM-1073 | done                                          |

⚠️ **The Opportunities tab is provisional and will most likely be folded into the Organisations
tab** (owner, 2026-08-06). The _components_ are the durable part and are already prop-driven; the
tab's own grouping, paging and search are what would be discarded. Do not build on this tab's
structure or invest in polishing it.

**Binding on every child ticket: components are built for two homes from the start.** No component
reads the router, the session or a route param for its own data — ids, payloads, callbacks and
permissions arrive as props; the page owns fetching, mutation, routing and toasts. Nothing assumes a
single entity: build the detail view and its compact row variant **in the same task**, never
retrofitted. Where a tab needs an endpoint that does not exist, record the gap and ship what works —
**do not invent a contract**.

### Validation digest (code-verified — mirror client-side, exactly)

**Kept whole, deliberately.** The caps diverge on purpose (100M Treasury / 10M Org / 10M Referral /
50k USD payout), and the only reliable defence against copying a limit from a neighbouring surface
is seeing them side by side. Splitting this table across the four feature docs is how that
protection would be lost.

| Field                                             | Rules                                                                                                                                                               | Source                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Treasury ZLTO pool (current FY)                   | optional (null clears it) · > 0 · ≤ 100,000,000 · whole                                                                                                             | `TreasuryRequestUpdateValidator.cs:23-32`                                                          |
| Treasury payout pool (USD, current FY)            | **required** · > 0 · ≤ 50,000 · ≤ 2dp                                                                                                                               | `TreasuryRequestUpdateValidator.cs:34-47`                                                          |
| Conversion rate (ZLTO per USD)                    | > 0 · ≤ 1,000 · ≤ 4dp                                                                                                                                               | `TreasuryRequestUpdateValidator.cs:49-55`                                                          |
| FY start month + day                              | day must be valid for month — coupled control                                                                                                                       | `TreasuryRequestUpdateValidator.cs:15-21`                                                          |
| Treasury pools ≥ current-FY cumulative            | both pools · **but the server zeroes the cumulatives first when the FY moves forward, so it then compares against 0** — mirror that or a legitimate save is blocked | `TreasuryService.cs:77-85` (service, not the validator)                                            |
| Organisation ZLTO pool                            | > 0 · ≤ 10,000,000 · whole · ≥ current-FY cumulative                                                                                                                | `OrganizationRequestValidatorBase.cs:72-76`, `OrganizationService.cs:465-469`                      |
| Referral ambassador reward (`zltoRewardReferrer`) | optional · > 0 · ≤ 2,000 · whole                                                                                                                                    | `ProgramRequestValidator.cs:50-59`                                                                 |
| Referral referee reward (`zltoRewardReferee`)     | optional · > 0 · ≤ 2,000 · whole                                                                                                                                    | `ProgramRequestValidator.cs:61-70`                                                                 |
| Referral program pool                             | optional · > 0 · ≤ 10,000,000 · whole · ≥ ambassador + referee                                                                                                      | `ProgramRequestValidator.cs:72-84` (server; the client mirror is `admin/referrals/[id]/index.tsx`) |
| Referral pool vs Treasury capacity                | **no server rule exists** — soft UI guidance only                                                                                                                   | `ProgramRequestValidator.cs` (no Treasury reference)                                               |
| Conversion preview amount                         | positive whole ZLTO                                                                                                                                                 | `TreasuryService.cs:181-192`                                                                       |

### Frozen conventions (T0 — binding on every child)

- **`lib/format/rewards.ts` is the only place reward numbers are formatted.** `formatZlto` (0dp) ·
  `formatUsd` (`$`, 2dp) · `formatConversionRate` (≤4dp) · `formatZltoRange` · `rewardBalanceTone`.
  No new `toLocaleString` / `Intl.NumberFormat` on a reward field anywhere (T6 greps for this).
  `EMPTY_VALUE = "—"` for null — never blank, never a substituted `0`.
  `REWARD_BALANCE_LOW_RATIO = 0.1`. Locale pinned `en-US`.
- **Label vocabulary, used verbatim**: `LABEL_SUFFIX_FY = "(this financial year)"` ·
  `LABEL_SUFFIX_LIFETIME = "(lifetime)"` · `HEADING_FY = "Current financial year"` ·
  `HEADING_LIFETIME = "All-time"`. Never a bare "Cumulative" — say what it is, then the scope
  ("Awarded (this financial year)"). USD carries `$` on the value; the word "USD" belongs in the
  group heading.
- **The two payout balances (frozen 2026-08-06)** — constants in the same module, with their
  tooltips, because the wording is what distinguishes them:
  `LABEL_PAYOUT_BALANCE_COMPLETED = "Remaining balance"` (_the pool minus payouts completed this
  financial year… not what is available to pay out_) vs
  `LABEL_PAYOUT_BALANCE_AVAILABLE = "Available to pay out now"` (_the remaining balance minus
  payouts already in flight… the capacity a new payout is checked against_).
  **Rewards keep the plain "Remaining balance"** — they have only one balance.
- **`components/Rewards/RewardStat.tsx`** — `RewardStat` / `RewardStatGroup` / `balanceStatTone`.
  Values arrive **pre-formatted**; the primitive never formats. `RewardStatGroup` defaults to
  `columns={4}` — a group with 2, 3 or 5 stats must pass `columns` or it renders a half-empty row.
- **`components/Treasury/TreasuryZltoRewardStats.tsx`** — the Treasury's four ZLTO figures, shared
  by the Overview and by any child surface showing what it draws from.
- **Validation pattern** — react-hook-form + `zodResolver`, schema built by a **factory closing over
  the server payload** so cross-field floors can reference server cumulatives; all rules in one
  `superRefine` split into per-field validators, each citing the C# it mirrors. `mode: "onTouched"`.
  Reference: `lib/treasury/treasuryFormSchema.ts`.
- **Per-field server errors** — the API discards `PropertyName`, so mapping is **message-text
  matching**. Reference: `lib/treasury/serverErrors.ts`. Unmatched messages render verbatim above
  the form; non-400s fall through to `<ApiErrors />`. **Read the actual server string before adding
  a matcher** — the existing patterns are deliberately broad and may already cover a "new" message.
- **Shared form kit** — `FormField` takes `htmlFor`/`errorId`, `FormLabel` takes `htmlFor`,
  `FormError` takes `id` + `role="alert"`. Repo-wide effect; use `aria-describedby`/`aria-invalid`
  on new fields.
- **`lib/format/amountInput.ts`** — the shared typed-amount parser (rejects `1e5`, counts decimals
  on the typed string).
- **Full-replacement payload builders** — `PATCH /treasury` and `PATCH /organization` replace
  everything; omitting a pool clears it. Always send the current value of what you are not changing.
  `lib/organisation/organizationRequest.ts` is the single builder for the organisation payload.

## Epic-Wide Remaining Work

Not owned by any one child ticket. **T6 in the old numbering.**

- [ ] **T6 — production hardening.** Consistency and scope-labelling audit across all five tabs and
      every reward surface, a11y pass, and **removal of the `?mock=` dev aid** —
      `lib/treasury/treasuryMockScenarios.ts` plus the three `⚠️⚠️ MOCK SCENARIOS` blocks and
      `MOCK_PARAM` in `pages/admin/treasury/index.tsx`, and the dev-only banner in
      `TreasuryOpportunitiesTab.tsx`. **This must not merge as-is.**
- [ ] **Authenticated browser pass** across YOM-1072 + YOM-1063 + YOM-1073. No reward surface in
      this epic has been visually verified. Seeded admin `testadminuser@gmail.com`, credentials at
      `src/api/cicd/scripts/postgressql-init/post.sql:18`. Use `?mock=payoutAvailableDepleted` to
      see the capacity banner without touching data.
- [ ] **Fold the Opportunities tab into Organisations** (owner intent) — spans YOM-1063 and the
      shared tab shell.
- [ ] ⚠️ **Re-point the commit citations before this PR merges.** `master` is squash-merged, so the
      branch commits these docs cite collapse into one `(#NNNN)` commit on landing and every
      citation dies. **61 of the 66 resolvable SHAs across `docs/work/active/` are branch-only** —
      `70b2ccd`, `0d7a67ba`, `bd4d01c1`, `f051dfd8`, `08cb6c10a` and the rest. Run the check in
      `docs/work/README.md`, then swap each for the squashed commit or annotate it. **After the
      merge this is guesswork** — it is exactly how the Partner Sync provenance was lost. Do this
      with the `?mock=` removal, in the same pre-merge pass.

## Out of Scope (whole epic)

- **Multi-asset / multi-currency.** ZLTO and USD only, fixed server-side by deliberate decision.
  Supporting more requires asset/currency pool tables plus a coordinated API + UI migration.
  **ZLTO naming stays** — it is baked into both the API and the UI.
- **A second reward asset.** The Yoma reward was removed server-side; do not reintroduce it in the
  UI by analogy.
- Ticket-specific exclusions live in each `feature.md`.

## Blockers

| Blocker                                                                | Severity | Note                                                                                                                 |
| ---------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| No authenticated browser pass on any reward surface                    | High     | Blocks calling YOM-1072 / YOM-1063 / YOM-1073 done. Unblocked otherwise — the corrective work is in                  |
| `?mock=` dev aid is committed                                          | High     | Must be removed before this epic merges                                                                              |
| No server rule ties a referral pool to Treasury capacity               | Low      | Accepted: the UI gives soft guidance. YOM-1073's ticket asks for hard validation — the code does not provide it       |

## Cross-Area Notes

- **Wallet nullability is implemented in `08cb6c10a`.** `Balance`, `Available` and `Total` are nullable while ZLTO is offline; pending rewards and Yoma-recorded pending payouts remain available.
- **Organization reward values remain intentionally hidden on `OpportunityItem`.** The model is a compact selection/listing contract, while `OpportunityInfo` is anonymous and also feeds CSV exports. Do not expose sensitive organization-level reward configuration without an explicit business requirement.
- **API tests intentionally target a developer-managed local PostgreSQL instance.** The default Docker PostgreSQL service does not publish a host port; Adrian runs focused tests against the local database and matching test configuration.

- **An API field rename is a breaking change for web, and it breaks at _runtime_, not compile
  time** — the TS interface keeps promising a field that never arrives. This has now happened three
  times (`UserProfileZlto.Pending` → `4bfeb55c`; the `pendingAwards` rename; `yomaRewardTotal`
  rendering into an empty badge). **Flag renames in a handoff here before merging**, and on the web
  side delete the old field from the interface in the same change so `tsc` finds every reader.
- **Follow the code, not the tickets.** Where a ticket asks for something the API does not provide,
  build what the code supports and record the remainder. Applied to the org list/search columns, the
  per-opportunity pool/balance columns, and referral hard validation.
- Anything changing the three Treasury payout figures, the full-replacement PATCH semantics, or the
  reward allocation order is breaking for every child here.
- **Permissions failures return HTTP 401, not 403**, so `ApiErrors` says "your session has expired"
  for what is actually a permissions problem.

## Links

- PR: https://github.com/didx-xyz/yoma/pull/1741
- Key commit (Treasury FY capability, CF-branch only): https://github.com/didx-xyz/yoma/commit/70b2ccdfc7dfb40e1ad83ff75409e920c72bafb6
- Superseded out-of-repo working plan: `FEAT-YOM-1051-cashout-ui-working-plan.md` v1.9
  (Google Drive vault, `_incoming/other/`) — migrated into this folder 2026-08-05, no longer updated.
