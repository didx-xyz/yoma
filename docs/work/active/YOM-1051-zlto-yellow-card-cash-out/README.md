# Epic: YOM-1051 — ZLTO Payout (Treasury, Reward Pools and Youth Cash-Out)

## Cancellation contract — 2026-09-21

Cancellation is now implemented locally too; see the [cancellation handover](./YOM-1057-api-payout-domain-and-rewards-integration/handoffs/2026-09-21-b.md).
The existing start/resume session response adds payoutId and canCancel (provider initiated only).
POST /api/v3/user/payout/{payoutId}/cancel returns empty 200 OK after cancellation/release is processed.
No additional provider request is added to profile. IXO country minimums are now mapped; see the country contract below.
Latest payout information includes id; session payoutId refers to the same Yoma transaction.
Latest payout information also includes nullable canCancel: terminal=false locally; active payouts
with a provider reference use a status GET, not a session refresh. Unknown eligibility is null.
No profile provider call is added. Existing valid sessions can be retained while checking latest-info;
match latest-info id to session payoutId before applying eligibility.

**Web side done 2026-09-21.** The session is now fetched when the active-payout panel *opens*
rather than when Continue is tapped — Cancel has to be offered beside Continue. Eligibility is
available on sessions and on-demand latest-info. The session is held in dialog memory, reused for Continue, refetched when expired, and
never persisted. Cancel appears only for `canCancel === true` **and** a `payoutId`; `null` is
"unknown" and gets a note plus a re-check, never a missing button. The id on screen is the id
POSTed — the flow never re-resolves "the active payout" at cancel time, which on a stale dialog
would release a different payout. See
[YOM-1074's handoff](./YOM-1074-ui-youth-yellow-card-cash-out/handoffs/2026-09-21-b.md).

## Country minimum contract — 2026-09-21

- `GET /api/v3/user/payout/countries` preserves the country array and existing country fields;
  each item adds `minimumAmount: number | null` and `currency: "USD"`.
- Profile exposes the SAME country limit at `payout.countryAvailability.minimumAmount` and
  `payout.countryAvailability.currency`.
  Existing `payout.amount` and `payout.currency` remain active-payout-only and null when none exists.
  Changing profile country updates the minimum metadata, never the active payout amount/currency.
  CountryAvailability retains supported/offline and adds nullable minimum/currency fields.
- Both monetary concepts remain USD-only. The separate minimum currency preserves their meaning
  and the original active-payout contract; it adds no currency selection, FX calculation or
  multi-currency processing. Those would need coordinated provider/Treasury/API/UI work later.
- Null minimum means no minimum enforced by Yoma, NOT provider availability or a promise that
  all destination channels accept any amount. Unsupported/unspecified/offline country has null
  countryAvailability.minimumAmount and countryAvailability.currency. Supported countries supply USD for currency
  even when minimum is null. An active payout's currency remains independent in every case.
- The existing provider country lookup/cache carries the metadata: no extra provider call on
  profile or initiation, no conversion response change, global setting or migration.
- Both initiation paths enforce the minimum against the actual USD payout (ZLTO conversion rounded
  to two decimals away from zero at the locked current Treasury rate), before payout creation or
  reward reservation. Equal is allowed. Resume/reconciliation/settlement do not reapply new limits.
- IXO's existing public countries request now adds `limits=true`. Map `limits[countryCode].lowestMinUsd`
  directly to minimumAmount in USD; its 5% buffer is already included. Do not use the local channel
  currency or perform another conversion. Zero, null or missing limits map to no minimum (null).
  Negative values are rejected as invalid provider data. Hosted per-method validation remains authoritative.
  The existing lookup cache has an absolute maximum lifetime of one hour. No extra profile request,
  migration, environment configuration or UI shape change is needed.
- Final mapping and verification: [handover](./YOM-1057-api-payout-domain-and-rewards-integration/handoffs/2026-09-21-c.md).
- Jason: implementation instructions and test matrix are in
  [the API handoff](./YOM-1057-api-payout-domain-and-rewards-integration/handoffs/2026-09-21-a.md).

**Web side done 2026-09-21.** The floor is read from the profile (no extra request), shown under the
field from first paint, and compared against the **conversion preview's USD figure** — never the
typed ZLTO, never a threshold back-calculated from the rounded display rate. Equal passes. A
non-USD or negative minimum is treated as unusable contract data: no figure is shown and nothing is
blocked client-side, because the server enforces the real rule and blocking on data we cannot read
would lock a youth out of their own money. The server's refusal maps to a field error that quotes no
figure and refreshes the profile, so the hint corrects itself. The completed provider mapping now
supplies real minimums when this branch is deployed. See
[YOM-1074's handoff](./YOM-1074-ui-youth-yellow-card-cash-out/handoffs/2026-09-21-b.md).

## Environment gate — 2026-09-16

`AppSettings:PayoutEnabledEnvironments` is configured as `Staging, Production`. New profile field
`payout.enabled` controls NEW cash-out actions only. Jason: hide/disable initiation in the Marketplace
and wallet when false, but retain active-payout status/resume and terminal-outcome handling. Country,
wallet and balance checks still apply when true. API initiation independently enforces the flag.
Existing reconciliation and webhook processing remain enabled. See the
[API/UI handoff](./YOM-1057-api-payout-domain-and-rewards-integration/handoffs/2026-09-16-a.md).

**Web side done 2026-09-16** — the entry point is *hidden* where the switch is off, not disabled, and
an active payout keeps its Continue. Read `enabled` as `=== false`: absent means an API older than
this change, i.e. no gate. See
[YOM-1074's handoff](./YOM-1074-ui-youth-yellow-card-cash-out/handoffs/2026-09-16-a.md).
Production still requires its own correct credentials/endpoints before deployment; inclusion in this
list is not a readiness check. No Helm secrets were edited for this change.

## Meta

- **Epic**: [YOM-1051](https://linear.app/didx/issue/YOM-1051)
- **Owners**: Adrian (api) · Jason (web)
- **Areas**: api, web
- **Status**: in-progress
- **Started**: 2026-03-04 (api), 2026-08-03 (web)
- **Branch**: `master` — `feature/custom-fields-framework` was squash-merged as `20a4f268` (#1924)
  on 2026-09-16. New work branches from master; see the branch section below for what changed.

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
| [`YOM-1072-ui-treasury-admin/`](./YOM-1072-ui-treasury-admin/feature.md)                                                           | [YOM-1072](https://linear.app/didx/issue/YOM-1072) | web  | T0, T1     | in-progress — dev complete (incl. Payouts tab, 2026-09-21), browser pass owed |
| [`YOM-1063-ui-organization-and-opportunity-admin/`](./YOM-1063-ui-organization-and-opportunity-admin/feature.md)                   | [YOM-1063](https://linear.app/didx/issue/YOM-1063) | web  | T2, T3     | in-progress — dev complete, T3 reduced |
| [`YOM-1073-ui-referral-program-rewards-create-update-info/`](./YOM-1073-ui-referral-program-rewards-create-update-info/feature.md) | [YOM-1073](https://linear.app/didx/issue/YOM-1073) | web  | T4         | in-progress — dev complete, browser pass owed |
| [`YOM-1074-ui-youth-yellow-card-cash-out/`](./YOM-1074-ui-youth-yellow-card-cash-out/feature.md)                                   | [YOM-1074](https://linear.app/didx/issue/YOM-1074) | web  | T5         | in-progress — T5 built end to end; Dev session pass owed |

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
  The web surface for both is the Payouts tab, built 2026-09-21 — query-only, and the provider is
  neither shown nor filterable (one provider, and naming it breaks the copy rule).
- Yellow Card OAuth authentication, hosted payout initiation, refreshed-session lookup and
  reconciliation status lookup are implemented against IXO's generated sandbox OpenAPI.
- Yellow Card's live off-ramp country availability uses the shared in-memory lookup-cache policy, is exposed
  to authenticated users as standard Yoma Country models and as explicit profile support/offline flags, and is
  enforced before payout creation or ZLTO reservation.
  Expected provider unavailability follows the wallet offline pattern rather than failing the complete profile.
  The hosted provider remains the final authority if a corridor changes after initiation.
- Yellow Card raw-body HMAC authentication, replay suppression and payload/status processing are
  implemented. Payout.Transaction and Reward.Transaction remain the authoritative processing
  records; the polling fallback reconciles missed or failed deliveries.
- Local sandbox integration testing on 2026-09-09 verified OAuth, ZLTO reservation, Yellow Card
  initiation recovery, session refresh, the active-payout guard, profile balances, valid processing
  webhooks, invalid signatures, stale timestamps and event-id replay suppression. The remaining
  provider E2E is the hosted sign-in/KYC/payout journey and terminal webhook processing on Dev/Stage
  with a test user whose email inbox is accessible.
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

### Payout outcome emails — 2026-09-15

- Yoma owns the four terminal outcome emails: Completed, Cancelled, Expired and Failed.
  No initiation, progress or ReconciliationRequired email, and no SMS/WhatsApp fallback.
- Existing best-effort delivery is intentional: log failures without failing settlement, retries,
  outbox or delivery tracking. Only new settled terminal transitions attempt a send after commit.
- One settings definition: User_Notifications_Payouts (Cash-outs), User role, default true.
  Existing users inherit the default through SettingsHelper; saved false is respected.
  Jason: verify the setting appears in the existing settings UI and can be toggled; no web changes here.
- Four SendGrid template configuration keys (Payout_Youth_Completed, Payout_Youth_Cancelled, Payout_Youth_Expired,
  Payout_Youth_Failed) receive separate template IDs, sharing one data model. Templates own the wording;
  youth emails contain no technical references. Adrian supplied all four template IDs; they are in
  ignored local settings only. Committed configuration has placeholders. Deployed environments must
  supply the IDs separately; live delivery still requires verification.
- The shared payload and remaining verification are documented in
  [the notification handoff](./YOM-1057-api-payout-domain-and-rewards-integration/handoffs/2026-09-15-a.md).

Everything in this section is **verified against the code on this branch**, and is binding on every
child. Feature docs link here rather than restating it.

### Branch — ⚠️ merged 2026-09-16; this section is history

> **`feature/custom-fields-framework` was squash-merged into `master` as `20a4f268` (#1924) on
> 2026-09-16.** Verified 2026-09-21: `20a4f268` is an ancestor of master, master carries the whole
> Treasury/payout surface, and no `Chimoney` identifier remains in the Treasury domain. **Branch
> from `master` now** — the warning below is kept because every handoff before that date was
> written under it, and because the squash is what killed the SHA citations (see Remaining Work).

All work was on `feature/custom-fields-framework`. The entire Treasury financial-year capability
existed **only** there (commit `70b2ccd`, not an ancestor of `origin/master` *at the time*). On
master the Treasury fields were still `Chimoney…InUSD` and `ITreasuryService` still had
`ChimoneyCashedOut()` — building there would have shipped the provider-specific naming this epic
forbids.

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

### Youth cash-out API additions — 2026-09-10

Current contract after the final profile-visibility review; see handoffs/2026-09-10-d.md under YOM-1057.
This supersedes returning terminal payouts on the profile. No expiry configuration or data deletion is introduced.

- GET `/api/v3/user` keeps the compact payout section:
  `{ countryAvailability, active, status, canResume, amount, currency, dateCreated, walletAvailable, walletUrl }`.
  Only in-flight payout details appear here. When none is active, status/amount/currency/dateCreated are null
  and active/canResume are false; countryAvailability and lifetime wallet access remain available.
- GET `/api/v3/user/payout/latest` is the on-demand outcome read for the cash-out journey:
  `{ status, amount, currency, dateCreated, canResume, canCancel }`.
  Returns the user's active payout first,
  otherwise the most recently initiated terminal payout; 404 if the user has no payout.
  User role is required and identity comes from authenticated context, with no caller-supplied user id.
- Outcome reads may check IXO status for `canCancel` on active payouts, but do not refresh sessions,
  mutate records or enrich reward transactions. The Yoma payout id supports exact cancellation;
  raw errors, provider references and duplicated ZLTO amount are not exposed.
- Profile and initiation/session guards use GetByUserIdOrNull with activeOnly=true (default).
  Only the on-demand endpoint opts into active-or-latest. The profile makes one separate indexed
  existence check for completed cash-outs to expose wallet access, not terminal payout details.
- The outcome endpoint has no age cutoff: it is explicitly requested in the cash-out journey, not rendered
  permanently in the wallet. Historical records remain available for audit. Avoid repeatedly announcing an
  old outcome; a latest-state read is not a history/unread-notification mechanism.
- Active is derived from Initiated, Processing or ReconciliationRequired. CanResume additionally requires
  a provider reference. It means a session request can be attempted, not a live availability guarantee.
  Active plus false means setup/recovery pending: allow a later retry.
- Processing begins at hosted-payout creation, before youth confirmation. Use neutral in-progress copy;
  neither status nor canResume reliably distinguishes awaiting confirmation from post-confirmation delivery.
- Completed, Failed, Cancelled and Expired are read from the outcome endpoint, never resumable through
  Yoma. Provider final fiat-delivery retries after Completed do not reopen the payout or release committed rewards.
- `payout.walletAvailable` is true and `payout.walletUrl` is populated once the user has any completed
  cash-out. These fields are on the profile payout section, beside the Cash Out entry point;
  no latest-info request is needed to render the wallet button. The hosted-wallet URL is required
  configuration. A newer payout does not remove wallet access.
  This is a navigation affordance, not a wallet-balance or bank-delivery signal. Jason owns the button;
  do not label it as a retry or promise that funds remain in the wallet.
- Currency separation remains intentional: payout amount/currency is USD, while zlto.pendingPayout is
  reserved ZLTO. After commit/release pendingPayout is zero and the wallet balance reflects the result.
  Do not infer outcome from zero, duplicate reward accounting in payout, or calculate historical ZLTO at
  today's rate. Flow D can show the outcome and updated wallet without an exact historical ZLTO amount.
- dateCreated is initiation time for the Started label, not confirmation/completion time.
- Conversion preview includes conversionRateZltoPerUsd using Treasury's four-decimal display calculation.
  Initiation recalculates at the current rate. Preview and initiation reject non-positive/fractional ZLTO
  with HTTP 400; global ArgumentException handling is unchanged.
- Initiate: POST `/api/v3/user/payout/zlto?amount=450` reserves 450 ZLTO and returns
  `{ amount, currency, paymentUrl, expiresAt }` (USD amount). Use the complete paymentUrl, including
  its fragment token, as iframe src.
- Resume/refresh: GET `/api/v3/user/payout/zlto` obtains a fresh URL for the same active payout.
  Do not POST again to refresh. Hosted-session expiry (~30 minutes) does not expire the underlying payout.
- Use an iframe modal INSIDE Yoma. Closing it does not cancel or complete the payout. Refresh the
  wallet/profile and query the outcome endpoint for Flow D; no return URL is needed for modal closure.
  Do not inspect cross-origin iframe DOM or infer success from its URL. Any automatic close/message needs
  an agreed origin-validated provider postMessage contract; authentication exceptions need IXO coordination.
- Session errors may be transient and even a 404 can originate at the provider. Read the outcome endpoint
  rather than inferring a terminal state from a failed session request.
- **Sign-in and KYC run in a popup the provider opens, not in the frame** (IXO, 2026-09-18). The frame
  must therefore not be sandboxed — it is not, and adding `sandbox` to satisfy IXO's conditional note
  about `allow-popups` would break it, since `sandbox` is deny-by-default. Yoma sets no CSP, no
  `Cross-Origin-Opener-Policy` and no `X-Frame-Options`, so nothing of ours blocks a popup.
- **The frame needs no camera or microphone delegation** (IXO, 2026-09-21). Identity capture,
  ComplyCube and its QR hand-off to a phone all run in the KYC window, which is top-level on the
  provider's origin and prompts for itself; nothing inside the frame ever asks. Both were removed
  from `allow`, along with `payment` (the Payment Request API, which this flow does not use).
  `clipboard-write` is kept for now — unasked, plausibly used for a reference to copy, and its
  Permissions-Policy default is `self`, so a cross-origin frame does need the grant.
- **Mobile recovery after a tab reload is the resume path, not persistence** (Adrian, 2026-09-18;
  confirmed independently by IXO, 2026-09-21). If Yoma reloads while the youth is away, refresh the
  profile; an active payout means "Continue cash out" calls GET `/api/v3/user/payout/zlto` for a
  fresh session and URL. Still never persist the URL, and never POST again. IXO's side of it: a
  **completed sign-in survives the reload** because the session lives on their origin, partitioned to
  the Yoma site — re-embedding with a refreshed payment URL lands the youth back at the payout or KYC
  step with no second sign-in. A reload *mid* sign-in simply means tapping Sign in again; the parked
  code is single-use and expires in five minutes.
- **Mobile is confirmed on all three targets** (IXO, 2026-09-21): iOS Safari, iOS Chrome and Android
  Chrome, each run as the full loop on a Yoma-style host page. The frame waits in the background
  while the youth is on the sign-in page and has moved on by the time they switch back; that page
  ends on a "done, you can close this" screen. This closes the Android/eviction gap left open on
  2026-09-18.
- **⚠️ Partitioned storage cuts both ways.** The session is keyed to *Yoma-site + provider-origin*, so
  the iframe and a top-level tab on the provider's domain are **different partitions**. A youth who
  signs in via "Open in a new window" has not signed in inside the frame. They finish in that tab, so
  it does not block them — but do not build anything that assumes state carries between the two.
- Notification ownership (IXO/Yoma) remains separate from in-app outcome presentation.
- Automated test additions were removed at Adrian's request; no new tests accompany these changes.
  API build and Dev integration checks are separate from future maintained automated regression coverage.

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

The hierarchy is managed from one place. Six banner tabs, each also reachable on the surface where
that level naturally lives:

| Tab           | `?tab=`         | Ticket   | Status                                        |
| ------------- | --------------- | -------- | --------------------------------------------- |
| Overview      | _(none)_        | YOM-1072 | done                                          |
| Manage        | `manage`        | YOM-1072 | done                                          |
| Organisations | `organisations` | YOM-1063 | done                                          |
| Opportunities | `opportunities` | YOM-1063 | done (reduced, **temporary**)                 |
| Referrals     | `referrals`     | YOM-1073 | done                                          |
| Payouts       | `payouts`       | YOM-1072 | done (2026-09-21) — query-only audit surface  |

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
      every reward surface, a11y pass, and **removal of the two dev aids**. **Neither must merge.**
  - **`?mock=`** — `lib/treasury/treasuryMockScenarios.ts` plus the three `⚠️⚠️ MOCK SCENARIOS`
    blocks and `MOCK_PARAM` in `pages/admin/treasury/index.tsx`, and the dev-only banner in
    `TreasuryOpportunitiesTab.tsx`. Woven into a production page, so unpicking it needs care.
  - **The Cash Out state gallery** — `pages/dev/cash-out.tsx` and `pages/dev/cash-out-provider.tsx`.
    Deliberately built as standalone pages that import the real components and 404 in a production
    build, *because* of how much work the `?mock=` approach turned out to be: removing these is
    deleting two files, with nothing to unpick.
- [ ] **Authenticated browser pass** across YOM-1072 + YOM-1063 + YOM-1073. No reward surface in
      this epic has been visually verified. Seeded admin `testadminuser@gmail.com`, credentials at
      `src/api/cicd/scripts/postgressql-init/post.sql:18`. Use `?mock=payoutAvailableDepleted` to
      see the capacity banner without touching data.
      ⚠️ **The seeded admin exists in the API database but not in local Keycloak** (checked
      2026-09-21: the realm export carries no users, and a password grant for it is refused), so
      the pass needs a Keycloak user provisioned first — or Dev. The Payouts tab additionally needs
      payout **rows**, which a fresh local database has none of; `?mock=` does not cover it, since
      that dev aid only substitutes the Treasury record.
- [ ] **Fold the Opportunities tab into Organisations** (owner intent) — spans YOM-1063 and the
      shared tab shell.
- [ ] ⚠️ **The commit citations were not re-pointed and the PR has now merged.** The squash
      happened on 2026-09-16 (`20a4f268`, #1924), so the window closed. Verified 2026-09-21:
      `70b2ccd`, `0d7a67ba`, `f051dfd8`, `48540971` and `08cb6c10a` still resolve in a local clone
      that fetched the branch, but **none is an ancestor of `master`** — they survive only where
      GitHub keeps the PR head (`refs/pull/1741/head`, `refs/pull/1924/head`), not in the repo's
      own history. Do not add more branch SHAs. When these are next touched, annotate each with
      "branch-only, squashed into `20a4f268` (#1924)" rather than guessing an equivalent, or
      replace the doc set with a context pack (`docs/work/templates/context-pack.md`). The
      `?mock=` removal is now independent of this and still owed.

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
| ~~No youth-facing payout status or terminal outcome~~ | ~~High~~ | **Resolved 2026-09-10** by the API additions above (`status`, `canResume`, `dateCreated`, `GET /user/payout/latest`); Flow D was built against them on 2026-09-11 |
| **Gender is rejected by the provider's verification step** (found 2026-09-11 on Dev, [YOM-1074](./YOM-1074-ui-youth-yellow-card-cash-out/feature.md)) | High | The hosted KYC answers `'personDetails.gender' should be equal to one of the allowed values: male, female, other`. Yoma's lookup is `Female`/`Male`/`Prefer not to say` and `YellowCardClient` sends it untouched, so **every** value is refused — two for case, the third because it is not in the provider's set. Blocks the hosted journey for every user. API-side mapping needed (`Male → male`, `Female → female`, else `other`); no UI change can affect it |
| ~~**The hosted sign-in step refuses to be framed**~~ (found 2026-09-11 on Dev, [YOM-1074](./YOM-1074-ui-youth-yellow-card-cash-out/feature.md)) | ~~High~~ | **Resolved by design change 2026-09-18.** There was no allowlist to be granted — WorkOS does not permit framed sign-in at all — so IXO moved sign-in *and* KYC into a **popup their page opens**, returning to the frame afterwards. The iframe stays; Yoma's only change is the escape hatch below. See the row under it for what this trades the problem for |
| **A blocked popup ends the journey, and Yoma cannot see it** (IXO design change, 2026-09-18) | Low | Sign-in and KYC are popups opened by the provider's code in the provider's document, so a blocker produces a tap that does nothing — no event, nothing cross-origin to read. **Narrowed 2026-09-21:** IXO confirmed the popup is opened synchronously in the click handler, blank, and navigated afterwards, which is the pattern iOS Safari requires — so an ordinary browser should not block it. "Open in a new window" is permanent and takes the journey top-level either way. What remains is the webview row below |
| **The embedded flow is unsupported in in-app browsers** (IXO, 2026-09-21) | High | Facebook, Instagram and WhatsApp webviews block or mangle new windows, and **some replace the whole view with the sign-in page, destroying the iframe** — so this is not a blocked-popup case with a graceful message, it can be the frame disappearing. IXO's words: "we do not support the embedded flow there and I would not try." Their supported path is the **standalone page** — the same `paymentUrl`, opened top-level, where their page uses a full-window redirect and no popup at all. **Accepted 2026-09-21 (owner): rely on the fallbacks, do not detect.** A youth in one gets the permanent "Open in a new window", or the equivalent link IXO render inside their own page. Detection was weighed and deferred — it is User-Agent sniffing, the tokens are conventions that rot, iOS gives no reliable generic signal, and a false positive sends someone on a good browser out of Yoma for nothing. The full write-up — what a webview is, what is wrongly mistaken for one (Custom Tabs and `SFSafariViewController` are *not* webviews), the token table, and the evidence that would reopen it — is in [YOM-1074's feature doc](./YOM-1074-ui-youth-yellow-card-cash-out/feature.md#in-app-browsers-webviews--deferred-detection). Remains High because the gap is real, not because work is pending |
| Hosted Yellow Card E2E needs an accessible test email                  | Medium   | WorkOS verifies email and provides no bypass; use a funded Dev/Stage user with an inbox the test team controls.       |
| No server rule ties a referral pool to Treasury capacity               | Low      | Accepted: the UI gives soft guidance. YOM-1073's ticket asks for hard validation — the code does not provide it       |

## Cross-Area Notes

- **Undeployed migration consolidation (2026-09-15):** CF/Treasury/Payout, SSI and the payout
  notification setting now ship in `20260915100000_ApplicationDb_Custom_Fields_Treasury_Payout_SSI`;
  the participant-count repair remains separate immediately afterwards. All deployed migrations are
  unchanged. Adrian will reset local/Dev before deployment. See the
  [shared migration handoff](../YOM-1244-customizable-fields-framework/handoffs/2026-09-15-a.md).

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
- **The four things the youth payout journey asked of the API were delivered on 2026-09-10** and
  wired up on 2026-09-11 — payout `status`/`canResume`/`dateCreated`, `GET /user/payout/latest`,
  and `conversionRateZltoPerUsd`. See the section above for the contract and
  [YOM-1074](./YOM-1074-ui-youth-yellow-card-cash-out/feature.md) for what each one changed.
- ⚠️ **Every enum on this API is a PascalCase *string*, so a numeric TS enum is a latent runtime
  bug.** `Startup.cs` registers a strict string enum converter; the Swagger schema says
  `"type": "string"`; most of the web codebase already compares them as strings
  (`item.status === "Active"`). `WalletCreationStatus` was declared numerically in
  `api/models/user.ts`, so `"Created" !== WalletCreationStatus.Created` was **always true** and the
  Cash Out gate refused every youth in the product. Nothing fails to compile, and only a logged-in
  session shows it. Declare API enums as string enums, mirroring the C# member for member — and
  check the Swagger schema rather than assuming (`/swagger/v3/swagger.json`, unauthenticated).
- ⚠️ **`UserProfilePayout.Amount` is USD, not ZLTO** — it is the `PayoutTransaction.Amount`. The
  reserved ZLTO is `UserProfileZlto.PendingPayout`. Two figures for one payout, in two places, in
  two units, both named "amount".

## Links

- PR: https://github.com/didx-xyz/yoma/pull/1741
- Key commit (Treasury FY capability, CF-branch only): https://github.com/didx-xyz/yoma/commit/70b2ccdfc7dfb40e1ad83ff75409e920c72bafb6
- Superseded out-of-repo working plan: `FEAT-YOM-1051-cashout-ui-working-plan.md` v1.9
  (Google Drive vault, `_incoming/other/`) — migrated into this folder 2026-08-05, no longer updated.
