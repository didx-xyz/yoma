# Feature: UI — Youth Cash-Out (Payout)

## Meta

- **Feature**: Youth payout — wallet ledger, amount entry, conversion preview, initiation
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1074](https://linear.app/didx/issue/YOM-1074)
- **Owner**: Jason
- **Areas**: web
- **Status**: planning — not started
- **Started**: —
- **Plan tasks**: **T5**

## Problem / Goal

Youth earn ZLTO but cannot convert it to money. This ticket adds the youth-facing side of the
payout hierarchy: a correct wallet ledger, an amount entry with an indicative USD preview, and
payout initiation against the provider-neutral Payout API.

**Cash Out** stays the user-facing action wording. Everything behind it is provider-neutral, and
**no payout provider may be named in user-facing copy** (epic rule).

Read the [epic README](../README.md) first — in particular the three-figure Treasury availability
model, and the rule that **rewards have no "available" equivalent** so nothing here may be built by
analogy with the payout figures.

## Out of Scope

- **Payout transaction history / pending-transactions list** — no endpoint.
- **Collecting bank or mobile-money destination details.** The hosted provider journey owns them;
  Yoma must never store them.
- **Querying the provider directly.** The UI reads only what Yoma has persisted; webhook
  reconciliation is the Payout domain's job.

## Plan

Two pieces, in order. **The wallet ledger comes first** — the payout amount is checked against it,
and it is currently wrong.

### 1. Wallet ledger contract (`UserProfileZlto`)

Server-side source: **`08cb6c10a`** (`fix(payout): harden reconciliation and ZLTO ledger
consistency`) — supplied 2026-08-11, so the nullable types below can be checked against real code
rather than inferred. Read it before building the ledger.

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

### 2. Payout journey

- Entry points: Marketplace wallet balance and Yo-ID Wallet.
- Amount entry against `available` — ZLTO already reserved must not be spendable again.
- Indicative preview via `GET /treasury/conversion/zlto-usd`, which returns
  `{ amount, currency, treasuryFundsAvailable }`. **`treasuryFundsAvailable: false` must surface as
  a distinct, friendly state — never as a validation error on the amount field.**
- Initiation via `POST /user/payout/zlto`. Build against the real endpoint; the mocked-seam plan is
  obsolete.
- **One active payout per user.** When one exists, block a new Cash Out and offer a way back to the
  hosted journey.
- Hosted-session creation is **not** a completed payout. Keep showing the payout as active while
  pending or processing, and read the terminal state from Yoma.

## Tasks

- [ ] **Wallet ledger** — add `balance`, rename `pendingAwards` → `pendingRewards`, render
      `pendingPayout` negative, handle the nullable offline render. **Delete the old field from the
      interface in the same change** so `tsc` finds every stale read
- [ ] **T5** — amount entry, indicative conversion preview, payout initiation
- [ ] Active-payout state: block a second Cash Out, offer a return to the hosted journey
- [ ] `treasuryFundsAvailable: false` as its own state, not a field error
- [ ] Entry points on both the Marketplace wallet and the Yo-ID Wallet

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

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1074](https://linear.app/didx/issue/YOM-1074)
- Related: [YOM-1052](https://linear.app/didx/issue/YOM-1052) (youth cash-out) ·
  [YOM-1055](https://linear.app/didx/issue/YOM-1055) (hosted integration) ·
  [YOM-1057](https://linear.app/didx/issue/YOM-1057) (api rewards domain)
- Handoffs: none yet. The wallet contract above was established across
  [`../YOM-1072-…/handoffs/2026-08-05-a.md`](../YOM-1072-ui-treasury-admin/handoffs/2026-08-05-a.md)
  and [`2026-08-06-a.md`](../YOM-1072-ui-treasury-admin/handoffs/2026-08-06-a.md).
