# Context Pack: YOM-1051 — ZLTO Payout (Treasury, Reward Pools and Youth Cash-Out) · RECONSTRUCTED

## Provenance

- **Replaces**: the epic's working set as the entry point for future work. That set is `README.md`
  (~60 KB), 13 child `feature.md` files and 40 handoffs, written 2026-03 → 2026-10-14. **Nothing was
  deleted.** Every source file sits beside this pack in the archived epic folder and stays the evidence.
- **Source now at**: `docs/work/archive/YOM-1051-zlto-yellow-card-cash-out/` (moved from `active/` on 2026-10-14).
- **Rebuilt from**: a full read of every document in this folder (README, all `feature.md`,
  all handoffs, `copy-sheet.md`, `design-review-2026-09-14.md`). It was spot-checked against `master`
  and `chore/cash-out-final-prep` on 2026-10-14:
  - `appsettings.json` payout keys
  - `UserController` / `TreasuryController` / `WebhookController` routes
  - `Payout/Enumerations.cs`
  - `lib/payout/*`, `lib/treasury/*`, `lib/format/rewards.ts`
  - `CashOutHostedStep.tsx`
- **Commit provenance**: recovered, not lost. Branch SHAs in the source docs mapped to `master` squash
  commits, as recorded in each file's "Citation note":
  - `20a4f268` (#1924, custom-fields + Treasury/payout)
  - `678ce683` (#1952, payout minimum + cancellation)
  - `328c9c0a` (#1958, wallet access)

  The Stage YoID workaround is `a1f96612` (#1971). The release-prep commits are on `chore/cash-out-final-prep`;
  **re-point those once the release PR squash-merges.**
- **Could not be verified**:
  - Production configuration (IXO credentials, `WalletUrl`, SendGrid template IDs, webhook cutover). It lives outside the repo.
  - The Stage UAT results themselves. They are recorded only as "concluded 2026-10-14" (Jason).
  - `design-brief-claude-design.md` and the HTML design canvases were never committed.
- **Written**: 2026-10-14 by Jason (agent: Claude Code). It went into the archive ahead of the
  imminent Production deploy, at Jason's direction.

> ⚠️ This is a reconstruction, not a contemporaneous record. Where it disagrees with the code, the
> code wins — and correct this file rather than working around it.

## Where the Work Got To

The whole reward hierarchy and the youth cash-out are built and passed Stage UAT (concluded
2026-10-14):
- Treasury, with financial years and automated rollover
- organisation and referral pools
- ZLTO reserve/commit/release
- a provider-neutral `Payout` domain, with IXO/Yellow Card hosted payout, HMAC webhooks and 5-minute reconciliation
- four terminal outcome emails
- the `/admin/treasury` admin surface (6 tabs)
- the youth Cash Out flow on both the Marketplace hero and the Yo-ID wallet

Every child ticket is marked `shipped — cash-out Production release, October 2026`. They were
marked on 2026-10-14, just before the deploy. The Production gate items under
[Open Questions](#open-questions) are owned outside these docs and are not confirmed here.

The release branch `chore/cash-out-final-prep` removes two things:
- the temporary Stage YoID schema bypass (API)
- every web dev aid: the Treasury `?mock=` scenarios, the dev-only Opportunities banner, and the `/dev/cash-out*` gallery

## Decisions That Still Bind

### Production release settings — October 15 update

- New migration `20261015090000_ApplicationDb_Treasury_CashOut_Release_Defaults` sets the payout
  pool to **USD 0** and conversion to **57 ZLTO per USD 1** (stored as rounded USD per ZLTO).
  It runs once on existing Stage/Production databases and after the original seed on fresh installs;
  historical applied migrations are unchanged. It is prepared, not applied or deployed by this session.
- Financial year stays **1 March through the end of February**. No reward pools, payout/reward
  cumulatives, reservations or transaction records are changed. Existing payouts keep their locked amounts.
- Cash-outs must also remain disabled in the UI until funding and readiness are confirmed. This
  migration is the API capacity safeguard; it does not change the UI switch or environment config.
- Administrator Treasury updates currently require a positive payout pool. The release migration
  deliberately sets zero directly; this session does not relax validation or change Jason's form.
  See the [release-settings handoff](./handoffs/2026-10-15-a.md) before deployment or later changes.

### Naming and scope

- **Provider neutrality.** User-facing copy never names, brands or hints at the payout provider. The
  only reference is "our secure payout partner"; the iframe title is "Secure cash out". The rule extends further:
  - **Code:** API/domain identifiers use `Payout`. "Cash Out" is the user-facing action only.
  - **Admin:** the Payouts tab neither shows nor filters by provider.
  - **Folder names** carry the provider because they take the Linear slug verbatim. That is filing, not copy — don't rename them.
- **ZLTO and USD only.** ZLTO is the single reward asset. The Yoma reward was removed server-side; do not
  reintroduce a second asset, a 2dp reward formatter or multi-currency. Either would need asset/currency pool
  tables and a coordinated API + UI migration.
- **Follow the code, not the tickets.** Where a ticket asks for something the API does not provide,
  build what the code supports and record the gap. This was applied to org list columns,
  per-opportunity pool/balance columns, and referral hard validation.
- **The Payouts surface is audit/query only.** No manual or admin payouts.

### Treasury and pools

- **`/admin/treasury` is the aggregation point** (owner, 2026-08-04): Overview, `manage`, `organisations`,
  `opportunities`, `referrals`, `payouts`.
  - **Components:** built for two homes. They take ids, payloads, callbacks and permissions as props, and read no router or session.
  - **Pages:** own fetching, mutation, routing and toasts.
  - **Detail views and their compact rows** are built together.
- **Scopes never mix.**
  - Treasury and organisation figures are **current financial year** and reset on rollover.
  - Opportunity and referral programme figures are **lifetime** and never reset.
  - Every figure carries its scope in the label.
- **A `null` pool means uncapped, never blocked**, at every ZLTO level. Copy says "not capped". The
  Treasury *payout* pool is the exception: it is required by validation, and unset reads "Not set — no payouts can be completed".
- **Three payout figures, never conflated:**
  - `payoutPoolCurrentFinancialYearInUsd` is the editable allocation.
  - `payoutBalanceCurrentFinancialYearInUsd` is pool − current-FY cumulative. It is a completed-only view and **not capacity**.
  - `payoutBalanceAvailableCurrentFinancialYearInUsd` is balance − all pending. **This is capacity**: use it for headroom, tones and every warning.
  - The UI derives pending as `completed − available` (`lib/treasury/payoutCommitment.ts`). It is `null`, never `0`, when no pool is set.
- **Rewards and payouts allocate asymmetrically — a "do not", not a gap.**
  - Rewards join the cumulative at *schedule* time, so a pending or failed award stays allocated.
  - Payouts allocate at *initiation*, through pending.
  - Never build a reward "available" figure by analogy.
  - A cross-FY payout counts in the FY in which it *completes*. Pending survives rollover; the cumulative does not.
- **Rollover is automated.** It runs as a daily `5 0 * * *` UTC job, plus `EnsureCurrentFinancialYear` before every allocation.
  - It zeroes the Treasury **and every organisation's** current-FY cumulatives.
  - A PATCH that moves the FY forward triggers it, so `TreasuryRolloverConfirmDialog` must confirm first.
  - The guard (`lib/treasury/financialYear.ts`) does not port `TreasuryHelper`. It may warn spuriously and is never silent on a reset.
- **Organisation reward fields stay off `OpportunityItem` / `OpportunityInfo`** (Adrian, 2026-08-11).
  - Why: this is a data-exposure decision. `OpportunityInfo` is anonymous and feeds CSV exports.
  - Settled: do not re-raise it.
  - Consequences: the Opportunities tab's reduced scope is permanent, and the planned fold-in cannot assume per-opportunity pool or balance in list data.
- **The Opportunities tab is provisional** (owner, 2026-08-06). It will fold into Organisations.
  The `*RewardSummaryRow` components are the durable part; don't polish the tab's grouping, paging or search.
- **The referral capacity notice is advisory everywhere.** No server rule ties a referral pool to Treasury capacity.
  - On the edit wizard, a typed pool that differs from the saved one drops the programme cap and falls back to the Treasury cap alone. Never subtract the cumulative client-side.
  - On a tie, point at the Treasury.
  - `deriveReferralCapacity()` mirrors `ProgramExtensions.CalculateProgramRewardEstimate` line for line. The referee is funded first, and partial payouts are allowed.

### Payout lifecycle (API)

- **Ownership:**
  - **Payout** owns monetary orchestration.
  - **Rewards** owns ZLTO reserve/commit/release.
  - **Infrastructure:** provider parsing stays in the IXO YellowCard project.
  - **Ledgers:** `Payout.Transaction` (payout/audit) and `Reward.Transaction` (ZLTO funding) are separate authoritative ledgers.
  - **Pending source:** Yoma's Reward reservation is the source of pending payout. The ZLTO reserved balance is only a warning-level consistency check.
- **One active payout per user.** Active = `Initiated`, `Processing` or `ReconciliationRequired`. `canResume`
  also requires a provider reference.
- **`Completed` is final.** No resume is offered, even though IXO can reopen a completed session. Later provider
  delivery retries do not reopen it or release committed ZLTO.
- **The ZLTO reservation is fixed at 30 h** (`PayoutRewardReservationExpirationInMinutes = 1800`).
  - IXO keeps an unconfirmed payout resumable for 24 h, then needs up to about 6 h to reach a terminal state.
  - Webhooks and reconciliation are the real commit/release triggers; expiry is only the safety net.
- **Timeouts are independent; never derive one from another:**
  - ZLTO HTTP: 30 s
  - IXO HTTP: 60 s
  - payout lock lease: 300 s
  - webhook timestamp tolerance: 5 min
  - reservation: 30 h
- **An ambiguous ZLTO reserve response keeps the payout active** until the threshold. ZLTO can only be looked up
  by reservation id, not by external reference.
- **Incomplete initiation:** detected by a missing `Payout.TransactionId`, not by status. Retry it idempotently,
  including from `ReconciliationRequired`. Once a provider id exists, reconciliation does status lookups only.
- **Profile is validated before creating the payout or reserving ZLTO**: email, names, country, gender, date of birth.
  Gender is normalised for IXO: Male→`male`, Female→`female`, Prefer not to say→`other`. Unknown values are
  rejected, never defaulted.
- **Country availability and minimums come live from IXO**, never hardcoded.
  - The profile degrades to "offline", the standalone endpoint returns 503, and initiation stays fail-closed.
  - Minimums are checked against the USD amount (2dp, rounded away from zero, at the locked rate). Equal passes.
  - Resume, reconciliation and settlement never re-apply a newer limit.
- **Cancellation:**
  - It targets the exact `payoutId`, and only provider status *initiated* is cancellable.
  - A refused or uncertain outcome never releases ZLTO.
  - `canCancel` stays off the profile because it would need a live provider call.
- **The environment gate `AppSettings:PayoutEnabledEnvironments` = `Staging, Production` gates *new* initiation only.**
  - Missing means none. Initiation is refused with 400 before any write.
  - Resume, webhooks, reconciliation and emails continue.
  - Being in the list is not a readiness check.
- **Four terminal outcome emails (Completed/Cancelled/Expired/Failed), email only, best-effort:**
  - **Failure handling:** a failure is logged, with no retry or outbox.
  - **When it sends:** only after a new settled terminal transition commits. Replays never resend.
  - **Not covered:** no email for initiation, progress or `ReconciliationRequired`. SMS/WhatsApp are drafted, not enabled.
- **Deployed migrations are immutable.** CF/Treasury/Payout/SSI and the notification setting ship together in
  `20260915100000_ApplicationDb_Custom_Fields_Treasury_Payout_SSI`.
- **No temporary environment bypass ships to Production**, even code Production cannot reach (Adrian, 2026-10-13/14).

### Youth cash-out UI

- **Every user-facing string lives in `lib/payout/copy.ts`.** `copy-sheet.md` is the annotated design source.
  The owner's overrides of the sheet:
  - "pending", not "on hold"
  - "Check", not "Review"
  - "Use all", not "Max"
  - the USD figure is **always "Estimated"**, even on Completed, because `PayoutTransaction.Amount` is fixed at initiation
  - "Zlto" in prose, "ZLTO" for the unit
- **The ledger branches on `null`, never on `zltoOffline`.** `balance`, `available` and `total` go null together; null renders `EMPTY_VALUE` "—".
  - `total = available + pendingRewards`. It never includes `pendingPayout`.
  - Rows appear only when they carry information, and their order never changes.
- **Eligibility order** (`lib/payout/eligibility.ts`):
  1. active payout (resume)
  2. `enabled === false`
  3. the six profile fields
  4. offline
  5. supported
  6. wallet `Created`
  7. available unknown or ≤ 0

  Active comes before enabled — the reverse of the server — so a kill-switch can never strand reserved ZLTO.
- **The kill-switch hides the entry point, never disables it.** Read `enabled === false`; absent means an older API.
  The hide is gated on `!isOpen` so an open dialog never unmounts.
- **Cash Out is disabled only when the ledger itself shows why:** em dashes, or a visible zero. Every other reason opens the gate.
- **The amount field is a controlled string.** Only `> available` is a field error.
  - Treasury exhaustion is the "paused" panel, never a field error.
  - The country minimum compares against the **preview's USD figure**, never typed ZLTO or a back-computed threshold.
  - A non-USD or negative minimum is unusable: show nothing and block nothing.
  - A server refusal quotes no figure and refreshes the profile.
- **The hosted journey is an iframe in a Yoma modal** (API directive). `paymentUrl` is used verbatim, fragment included, and must be HTTPS.
  - **Hands-off:** no DOM, URL or `postMessage` inspection. Auto-close would need an agreed, origin-validated contract.
  - **No `sandbox`:** IXO's sign-in/KYC popup needs it absent.
  - **No `allow` attribute at all:** camera, microphone, payment and clipboard-write are all dropped. Don't re-add one "just in case".
  - **Modal settings:** `shouldCloseOnOverlayClick={false}` is load-bearing.
  - **Escape hatch:** "Open in a new window" is permanent.
- **Closing the modal never assumes an outcome.** It reads the profile plus `GET /user/payout/latest`.
  Outcomes come from the recorded status only, never inferred from the wallet (`pendingPayout` is zero after both commit and release).
  - Only Completed gets success styling.
  - Stepper step 3 is ticked only on a terminal status.
  - `showOutcome` re-reads the profile after Completed.
- **Sessions are never persisted.**
  - `GET /user/payout/zlto` refreshes a session; never POST again.
  - The session is fetched when the active-payout panel **opens**, so Cancel can sit beside Continue. It is held in dialog memory and refetched when expired.
  - A session 404 routes to the outcome read, never to a terminal message.
- **Cancel shows only for `canCancel === true` and a `payoutId`.**
  - `null` means unknown: show a note and "Check again", never just hide the button.
  - The id on screen is the id POSTed.
  - A `latest` whose `id` does not match the session is discarded.
  - Nothing is released optimistically.
- **In-app webviews (FB/IG/WhatsApp) are not detected** (owner, 2026-09-21). The product relies on the permanent new-window
  link and IXO's own link. To reopen, bucket abandoned payouts by the initiate request's User-Agent first. The full
  write-up is in `YOM-1074-…/feature.md` § In-app browsers.
- **`CashOutWalletLink` is a sibling of `CashOutEntry`**, so it survives the kill-switch.
  - It renders only when `walletAvailable === true` and the URL is HTTPS.
  - It opens top-level, `noopener noreferrer`, never in the iframe.
  - Label: "View my cash-outs" — no balance or retry claims.

### Identity (travelled with this release)

- **LOGIN recovers a genuinely missing Yoma user**, only after the ExternalId and username lookups both fail.
  - It runs inside the existing per-user lock, using REGISTER's mapping and one `UserService.Upsert`.
  - UPDATE_PROFILE never creates a user.
  - A token issued before the role was restored can 403 until the next sign-in. This is accepted; the API does not rewrite tokens.

## Contracts

The sources of truth are the controllers (`UserController`, `TreasuryController`, `WebhookController`), the web services
(`api/services/payout.ts`, `api/services/treasury.ts`) and models (`api/models/{user,payout,treasury}.ts`). Verify against them; don't trust this table.

| Endpoint | Role | Shape / semantics |
| --- | --- | --- |
| `GET /api/v3/user` → `payout` | User | `{ enabled, walletAvailable, walletUrl, countryAvailability{supported, offline, minimumAmount?, currency?}, active, status, canResume, amount (USD), currency, dateCreated }`. Active payout only; null/false otherwise. |
| `GET /api/v3/user` → `zlto` | User | `{ balance?, available?, total?, pendingPayout (ZLTO), pendingRewards, walletCreationStatus, zltoOffline }` |
| `GET /api/v3/user/payout/countries` | User | Country list + nullable `minimumAmount`, `currency: "USD"`; **503** when the provider is offline. Listing only — not used for gating. |
| `GET /api/v3/treasury/conversion/zlto-usd?amount=` | User | `{ amount, currency, treasuryFundsAvailable, conversionRateZltoPerUsd }`; non-positive/fractional → 400 |
| `POST /api/v3/user/payout/zlto?amount=N` | User | Query param, no body. Reserves ZLTO, returns `{ payoutId, canCancel, amount (USD), currency, paymentUrl, expiresAt }` |
| `GET /api/v3/user/payout/zlto` | User | Fresh session for the same active payout (~30 min life; session expiry ≠ payout expiry). 404 is not terminal. |
| `GET /api/v3/user/payout/latest` | User | `{ id, status, amount, currency, dateCreated, canResume, canCancel? }` — active first, else latest terminal; 404 if none. `canCancel` comes from a best-effort provider status GET (terminal → false, unknown → null). |
| `POST /api/v3/user/payout/{payoutId}/cancel` | User | Empty **200** after local settlement (also on replay); provider refusal → 400; unknown → 404 |
| `GET` / `PATCH /api/v3/treasury` | Admin | **Full replacement** — omitting a pool clears it. Always resend untouched values. |
| `GET /api/v3/treasury/payout/transaction/{id}` | Admin | Full audit view incl. user and linked ZLTO reward transaction |
| `POST /api/v3/treasury/payout/transaction/search` | Admin | Lightweight paged rows, newest first; pagination required; no per-row reward lookup |
| `PATCH /organization` (multipart) | Admin/OrgAdmin | Full replacement — build only with `lib/organisation/organizationRequest.ts` |
| `POST /api/v3/webhook/yellowcard` | provider | HMAC-SHA256 over `webhook-id + "." + webhook-timestamp + "." + rawBody` (raw UTF-8 body, constant-time compare). Bad signature or stale timestamp → 401, no change. Replayed id → 200, no second update. At-least-once delivery; no IP allow-list. |

**Enums travel as PascalCase strings.**
- `PayoutTransactionStatus`: `Initiated`, `Processing`, `ReconciliationRequired`, `Completed`, `Failed`, `Cancelled`, `Expired`.
  - `Processing` starts when the hosted payout is created, before the youth confirms, so use neutral "in progress" copy.
  - Completed commits the ZLTO and adds to the Treasury cumulatives. Failed, Cancelled and Expired release it.
- Status filters send the enum **name**.

**Configuration** (`src/api/src/application/Yoma.Core.Api/appsettings.json`):
- **IXO:** `IXO:YellowCard:{BaseUrl, WalletUrl, SupportedCountriesUrl, AccessTokenPath, PayoutsPath, RequestTimeoutSeconds=60, ClientId, ClientSecret, WebhookSigningSecret, WebhookTimestampToleranceInMinutes=5}`.
  The committed `BaseUrl`/`WalletUrl` are IXO **Test** values.
- **Payout timing:** `PayoutRewardReservationExpirationInMinutes=1800`, `DistributedLockPayoutDurationInSeconds=300`,
  `PayoutReconciliationSchedule="*/5 * * * *"` (batch 100).
- **Gate:** `PayoutEnabledEnvironments="Staging, Production"`.
- **Emails:** setting `User_Notifications_Payouts` (User role, default true). SendGrid keys `Payout_Youth_Completed`, `_Cancelled`,
  `_Expired`, `_Failed` hold placeholders in source; real template IDs come from each environment.
- **Country limits:** `YellowCardClient` appends `limits=true` (not in the configured URL). `lowestMinUsd` maps
  straight to USD; IXO already adds a 5% buffer. 0, null or missing means no minimum; negative is invalid. The cache is capped at 1 h.

**Validation digest.** Mirror the server exactly; the line-level detail is in the archived README.

| Field | Rule | Source |
| --- | --- | --- |
| Treasury ZLTO pool (FY) | optional (null clears) · > 0 · ≤ 100,000,000 · whole | `TreasuryRequestUpdateValidator.cs` |
| Treasury payout pool (USD) | **required** · > 0 · ≤ 50,000 · ≤ 2dp | `TreasuryRequestUpdateValidator.cs` |
| Conversion rate (ZLTO per USD) | > 0 · ≤ 1,000 · ≤ 4dp | `TreasuryRequestUpdateValidator.cs` |
| FY start month + day | day valid for month (29 Feb offered) | `TreasuryRequestUpdateValidator.cs` |
| Treasury pools ≥ FY cumulative | against 0 when the FY moves forward (server zeroes first) | `TreasuryService.cs` |
| Org ZLTO pool | > 0 · ≤ 10,000,000 · whole · ≥ FY cumulative | `OrganizationRequestValidatorBase.cs`, `OrganizationService.cs` |
| `zltoRewardReferrer` / `zltoRewardReferee` | optional · > 0 · ≤ 2,000 · whole | `ProgramRequestValidator.cs` |
| Referral programme pool | optional · > 0 · ≤ 10,000,000 · whole · ≥ referrer + referee | `ProgramRequestValidator.cs` |
| Referral pool vs Treasury | **no server rule** — soft UI guidance only | — |

**Web conventions:**
- **Formatting:** `lib/format/rewards.ts` is the only reward formatter, and its label constants are used verbatim:
  - `LABEL_SUFFIX_FY`, `LABEL_SUFFIX_LIFETIME`
  - `LABEL_PAYOUT_BALANCE_COMPLETED = "Remaining balance"`
  - `LABEL_PAYOUT_BALANCE_AVAILABLE = "Available to pay out now"`
  - `EMPTY_VALUE`, `REWARD_BALANCE_LOW_RATIO = 0.1`

  Never write a bare "Cumulative".
- **Typed amounts:** `lib/format/amountInput.ts` is the typed-amount parser.
- **Validation:** money-submitting forms use react-hook-form + a zod schema factory (`lib/treasury/treasuryFormSchema.ts`).
- **Server errors:** mapped by matching message text (`lib/{treasury,organisation,payout}/serverErrors.ts`), because the API
  discards `PropertyName`. Matcher order is load-bearing.

## Gotchas

- **API field renames break the web at runtime, not at compile time.** This happened three times
  (`UserProfileZlto.Pending`, `pendingAwards`, `yomaRewardTotal`). Delete the old field from the TS interface in
  the same change and let `tsc` find the readers. Grep `yomaReward`, not `yoma` — "yoma" is also the brand.
- **A numeric TS enum against this API is a silent bug.** `"Created" !== 2` made the gate refuse every youth.
  Check `/swagger/v3/swagger.json` and use string enums.
- **`null` traps:** `null < n` is true and `null + 5` is 5. Both shipped bugs (WalletCard empty state, Marketplace
  "insufficient funds" on an offline wallet).
- **Permission failures return 401, not 403**, so `ApiErrors` says "session expired".
- **Two "amount"s.** `PayoutTransaction.amount` is USD; `RewardTransaction.amount` is ZLTO. Never reconstruct ZLTO
  from USD at today's rate.
- **Near-identical server strings:** "Cash-out is not available" is the kill-switch; "Cash-out is currently unavailable…"
  is the corridor. Likewise "Insufficient funds available" (Treasury paused) vs "Insufficient reward balance" (field error).
- **Don't infer outcomes:**
  - `pendingPayout` reaching 0 does not mean Completed.
  - Completed does not mean bank delivery.
  - A session 404 does not mean terminal.
  - `canCancel` can disagree with local status until reconciliation runs.
- **Partitioned storage:** the iframe and a top-level provider tab do not share sign-in. A webview can destroy the
  frame outright, and a blocked popup is invisible to Yoma.
- **Webhooks don't follow deploys.** IXO's webhook target is switched by coordination with IXO. The secrets being
  present proves nothing about their values. Committed `WalletUrl`/`BaseUrl` are Test, so Production must override them.
- **Email failures are silent.** A crash after commit loses that email for good. Wrong template IDs only log errors,
  so settlement looks healthy.
- **Shared environments:**
  - ZLTO wallets are not isolated per environment.
  - Stage shares the ACA-Py test registry with Local/Dev. CF-published YoID 1.1 broke Stage schema reads, and removing the bypass can re-expose that.
  - Never send a mocked terminal webhook for a payout that also exists in IXO Test.
- **The gender fix applies to new payouts only.** A session refresh does not resend the profile.
- **The distributed lock has a fixed lease** with no renewal and no owner-token release.
- **API tests:**
  - .NET 10 / xUnit v3 rejects `dotnet test`. Run the built test DLL or `dotnet run --project test/Yoma.Core.Test/...`.
  - Exclude `WhatsAppNotificationTests` (live).
  - Run the formatter after the *last* edit; a late edit broke PR CI twice.
- **Local admin testing is thin.** A fresh database has no payout rows, and as of 2026-09-21 the README recorded the seeded
  admin as missing from local Keycloak (re-check before relying on either claim).
- **`ApiClient` refreshes on NextAuth session expiry, not access-token expiry.** After a few idle minutes in the hosted
  journey, the first call 401s and then retries.

## Open Questions

Unresolved at archive time. "Gate" means a Production release item, not a code change.

- **Gate — Adrian / Robbie / IXO:**
  - IXO Production credentials, `BaseUrl` and `WalletUrl`
  - the four SendGrid template IDs
  - the webhook cutover and a signed-delivery check
  - Yoma funding
  - a matched API + UI deploy
  - controlled Production smoke checks
  - verifying the deployed build contains no Stage bypass code

  YOM-1077 recorded production readiness and health checks as unticked.
- **Adrian:** the remaining E2E coverage:
  - expiry, delayed-webhook and polling behaviour
  - all four emails via both webhook and reconciliation
  - opt-out
  - cancel and minimum edge cases on Stage

  Also: automated lifecycle tests (the 2026-09-10 temporary tests were removed), and triage of the NU1902/NU1903 advisories on transitive `System.Security.Cryptography.Pkcs` / `.Xml` 10.0.12.
- **IXO:**
  - Is `other` right for "Prefer not to say"?
  - Confirm the Production wallet landing URL.
  - Do retries carry a fresh timestamp within the 5-minute tolerance?
- **SRE / provider:** isolate the Stage test registry from CF schema publication, and find the cause of the provider's
  HTTP 500 on schema creation.
- **Infra:** distributed-lock hardening (renewal, owner token).
- **Web (Jason), post-release:**
  - fold the Opportunities tab into Organisations
  - outcome toasts (strings only in `copy-sheet.md` §9)
  - `ApiClient` refresh on access-token expiry
  - whether a recovered user's first-token 403 needs a re-auth prompt (only if it recurs; never blanket-retry 403s)
  - wallet-link placement (completed screen? Marketplace hero?) and whether its label should name the provider
  - "Manage cash-out" as the Continue label
  - whether cancel-success should offer "Start a new cash out"
  - a notice if the kill-switch is ever turned off after launch
  - hero contrast (2.48:1, a brand call)
  - querystring-backed payout filters (when support needs shareable links)
  - a provider column (when a second provider exists)
  - Payouts-tab access below Admin, and a finance CSV export (no endpoint)
- **Product:** hard Treasury-capacity validation for referral pools needs an API rule first. Business (non-youth) payout
  notifications have no owner.
- **Linear:** YOM-1048 (Chimoney) is obsolete but still open.

## Where the Source Docs Disagree With the Code

Corrections found during the reconstruction. They are recorded here rather than rewritten into the archive:

- **README "Youth cash-out API additions"** says `clipboard-write` is kept on the iframe. The code has no `allow` attribute at all (`CashOutHostedStep.tsx`).
- **README (2026-09-10) `/latest` shape** omits `id`. The 2026-09-21 cancellation contract and the code include `id` and nullable `canCancel`.
  Its profile shape also omits `enabled` (added 2026-09-16).
- **YOM-1057 handoff 2026-09-21-c** says the configured URL carries `limits=true`. `YellowCardClient` appends it in code.
- **`PAYOUT_STATUS_META`** gives `Failed` and `ReconciliationRequired` the same amber "attention" tone. The decision singles out `ReconciliationRequired`.
- **Stale code comments:**
  - The `lib/payout/copy.ts` header still says the copy sheet is owed.
  - `lib/payout/amount.ts` and the `serverErrors.ts` header say invalid amounts return HTTP 500 (400 since 2026-09-11).
  - The `TreasuryCapacityWarnings.tsx` header says "both tabs" (it renders above all six).
- **`UserProfilePayout.enabled`** is typed non-optional while the rule treats it as possibly absent. The behaviour is correct.
- **Stale checklists in the source docs:**
  - the README's YoID-removal and login-warning boxes still read "uncommitted". Both are committed; the login warning is on `master`.
  - YOM-1052's "Complete the youth Web journey" and YOM-1057's "add the wallet button" are unticked, though both are done.

## Deliberately Dropped

Each item is still readable in the archived folder or in git:

- **The `feature/custom-fields-framework` branch saga** (Chimoney naming on old master, the UI-only port, the merge),
  and **the T0–T6 task numbering**. See the archived README, § Branch and § T-number map.
- **The Chimoney provider** (YOM-1048) and its renamed `Chimoney…InUSD` fields.
- **Dev aids**, removed 2026-10-14: Treasury `?mock=` scenarios, the provisional Opportunities banner, `/dev/cash-out*`. So
  is every browser-pass instruction that relied on them.
- **Superseded designs:**
  - **Hand-off and timers:** the new-tab hand-off with a "return view"; the 4-second "Not loading?" timer.
  - **Framing:** asking IXO to allowlist Yoma's framed sign-in (WorkOS forbids framing, so IXO moved sign-in and KYC to a popup).
  - **Conversion rate:** the inferred rate (`conversionRateZltoPerUsd` replaced it).
  - **Profile:** terminal payouts on the profile (replaced by `/latest`); database-only latest-info; a global or
    conversion-level minimum and parent-level minimum fields.
  - **Copy:** the sheet's "on hold", "Sent" and `RESUME_NO_LONGER_ACTIVE`; the "five rows in fixed order" ledger; the
    mockups' bottom sheet, amber CTA and "Finish" step.
- **Resolved blockers:** gender rejection, framed sign-in, no youth status/outcome, no browser pass, `?mock=` committed.
- **The Stage YoID bypass implementation**: `handoffs/2026-10-13-a.md`, removed by `handoffs/2026-10-14-a.md`.
- **Session narrative and test-evidence tables**, e.g. the 2026-10-06 login-recovery stress runs, local Docker isolation notes and
  the 2026-08-11 docs restructure. They are in the handoffs where they were written.
- **Assets that were never committed**: `design-brief-claude-design.md`, `youth-cash-out-screens.html` (39 artboards) and
  `cash-out-review-boards.html/.zip`. The out-of-repo plan `FEAT-YOM-1051-cashout-ui-working-plan.md` is superseded.
