# Feature: UI — Organization & Opportunity Admin

## Meta

- **Feature**: Organisation and Opportunity reward surfaces
- **Epic**: [YOM-1051](../README.md)
- **Ticket**: [YOM-1063](https://linear.app/didx/issue/YOM-1063)
- **Owner**: Jason
- **Areas**: web
- **Status**: in-progress — dev complete, T3 reduced, browser pass owed
- **Started**: 2026-08-04
- **Plan tasks**: **T2** (organisation rewards) and **T3** (opportunity rewards)

## Problem / Goal

The API moved organisation reward pools to a financial-year model backward-compatibly, so the
existing UI still works but renders none of the new values. Organisation pools round-trip silently:
an admin can neither see what an organisation may award this financial year nor set it.

This ticket makes the middle two levels of the hierarchy visible and editable — **Treasury →
Organisation → Opportunity** — and, critically, keeps the two scopes apart on screen: an
organisation's figures are **current financial year**, an opportunity's own are **lifetime**.

Read the [epic README](../README.md) first for the domain rules, the frozen T0 conventions and the
validation digest. This doc does not restate them.

## Out of Scope

- **List/search columns for organisation reward figures** — no endpoint provides them.
- **Per-opportunity pool/balance in any list view** — no list endpoint exposes them. See the
  2026-08-05 decision below; this is why T3's tab ships reduced.
- **Organisation self-service pool requests.** Registration deliberately leaves pools `null`;
  allocation is an admin act after approval.

## Plan

Two surfaces per level, built together so neither is retrofitted:

| Component                                                    | Detail home                                   | Compact home                     |
| ------------------------------------------------------------ | --------------------------------------------- | -------------------------------- |
| `Organisation/Rewards/OrganizationRewardStats.tsx`           | org edit Reward step, `organisations/[id]/info` | Treasury Organisations dialog    |
| `Organisation/Rewards/OrganizationRewardSummaryRow.tsx`      | —                                             | Treasury Organisations tab rows  |
| `Organisation/Rewards/OrganizationRewardPoolsForm.tsx`       | org edit Reward step                          | Treasury Organisations dialog    |
| `Opportunity/Rewards/OpportunityRewardContext.tsx`           | opportunity admin detail + info pages         | —                                |
| `Opportunity/Rewards/OpportunityRewardSummaryRow.tsx`        | —                                             | Treasury Opportunities tab rows  |

Plus the two tab bodies inside the shared page shell (owned by YOM-1072):
`components/Treasury/TreasuryOrganisationsTab.tsx` and `TreasuryOpportunitiesTab.tsx`, reachable at
`?tab=organisations` and `?tab=opportunities`.

Payload building goes through `lib/organisation/organizationRequest.ts` — **`PATCH /organization` is
a full replacement**, so the single builder is what stops a partial payload clearing a pool.
Validation is `lib/organisation/rewardPoolsFormSchema.ts`; server errors map through
`lib/organisation/serverErrors.ts`.

⚠️ **The Opportunities tab is provisional** and will most likely be folded into the Organisations
tab — see the epic README. The components are durable; the tab's grouping, paging and search are not.

## Tasks

- [x] **T2** — Organisation Rewards: edit-step rework, `info.tsx` read-only block, `?tab=organisations`
- [x] **T3** — Opportunity Rewards: detail context block, edit-step vocabulary alignment,
      `?tab=opportunities` _(reduced scope — see Decisions)_
- [x] **T2 corrective** — `NoImage` placeholder resized to match the 30px logo
- [x] **Yoma reward capability removed from the web** — matches API `f051dfd8`; this ticket's models
      carried most of it
- [x] **Merge artifact in `OpportunityCompletionRead.tsx` fixed** — `0b3cb102`
- [x] **Pool-unset copy corrected** on `OrganizationRewardStats` — "Not set — no ZLTO can be
      awarded" was the inverse of the server behaviour; now "…this organisation's awards are not
      capped" (done during T4)
- [ ] **Authenticated browser pass** — org edit Reward step (single-field form), org info Rewards
      block, opportunity Rewards block on both the admin detail and info pages, and both tabs.
      Include a **form-kit smoke check**: T2's `FormField`/`FormLabel`/`FormError` changes are
      repo-wide and reach every consumer
- [ ] **Fold the Opportunities tab into Organisations** (owner intent; tracked epic-wide)
- [ ] **`OpportunityType.displayName`** — the API gained it (`8d72254d`); the web's TS
      `OpportunityType` still has only `id`/`name`. Additive, nothing crashes, but any surface
      showing an opportunity type is showing the wrong field. Not strictly this ticket — flag to
      whoever picks up opportunity-type display

## Decisions

<!-- Append-only. Date each entry. Epic-wide decisions live in ../README.md -->

- **2026-08-04: organisation admins may see their own reward figures read-only** on
  `organisations/[id]/info`. The endpoint is `Role_Admin, Role_OrganizationAdmin`; wrap in an
  `isAdmin` check if it must become Yoma-admin-only.
- **2026-08-05: T3's Opportunities tab ships reduced — no endpoint exposes per-opportunity
  pool/balance.** `POST /opportunity/search/admin` returns `OpportunityInfo` (per-completion reward
  + lifetime cumulative, no organisation reward fields). `OpportunityItem` declares the
  `Organization…CurrentFinancialYear` fields but **every reward field on it is `[JsonIgnore]`**
  (`OpportunityItem.cs:34-92`), and it is only returned by the picker
  `POST /opportunity/search/filter/opportunity`. The tab therefore shows per-completion reward +
  lifetime awarded per opportunity, grouped under its organisation's current-FY figures. Nothing
  synthesised. **Ask for `[JsonIgnore]` to be dropped, or the fields added to `OpportunityInfo`, to
  build it as designed.**
- **2026-08-05: T3's detail block reads the organisation, not the opportunity payload's
  sub-object.** That sub-object is FY-only while `OrganizationRewardFigures` needs the all-time
  figures too, so it would render "—" for every All-time value. `GET /organization/{id}` gives all
  of them and lets the block reuse `OrganizationRewardStats` verbatim. _(The "6 vs 8 fields"
  arithmetic in the original note is superseded — the Yoma removal took `OrganizationRewardFigures`
  to four fields.)_
- **2026-08-06: the Opportunities tab is provisional** and will likely be folded into the
  Organisations tab. Recorded at the top of `TreasuryOpportunitiesTab.tsx`; a dev-only banner says
  so in the UI. **T3 is parked here deliberately** — no further work on it for now.
- **2026-08-07: the Yoma reward removal landed mostly in this ticket's models.** API `f051dfd8`
  removed the capability; the web now matches. Removed here: the four organisation figures, the
  settable org pool, the opportunity reward/pool/cumulative/balance and its three
  `organizationYomaReward*CurrentFinancialYear`, `OpportunityInfo`'s three, `MyOpportunityInfo.yomaReward`
  and the dashboard's `yomaRewardTotal`. Consequences: **`OrganizationRewardFigures` is four fields,
  not eight**; `OrganizationRewardPools` is a single key; the org pool validator is now simply
  `> 0 · ≤ 10M · whole`. The interfaces were emptied **first** so `tsc` could find every reader —
  which is how `YouthCompletedCard`'s empty badge was caught.
- **2026-08-07: single-field forms and half-empty stat grids were resolved deliberately.**
  `OrganizationRewardPoolsForm` stays a component at one field — it owns the schema factory,
  resolver, server-error-to-field plumbing, aria wiring and clear-the-pool warning that both of its
  homes would otherwise duplicate. Column counts were revisited so no survivor is stranded:
  `OrganizationRewardStats` keeps `columns` (4 stats divide evenly by 2 and 4), while both summary
  rows drop to `columns={2}` and `OpportunityRewardContext` falls back to 2 when the payload has no
  pool — otherwise the info page would render two stats in a four-column row.

## Links

- Epic: [YOM-1051](../README.md)
- Ticket: [YOM-1063](https://linear.app/didx/issue/YOM-1063)
- PRs: https://github.com/didx-xyz/yoma/pull/1741
- Related: [YOM-1061](https://linear.app/didx/issue/YOM-1061) (org reward pools) ·
  [YOM-1062](https://linear.app/didx/issue/YOM-1062) (api organization domain)
- Handoffs covering this ticket: [`handoffs/2026-08-07-a.md`](./handoffs/2026-08-07-a.md) (Yoma
  reward removal + the master-merge addendum). T2 and T3 were delivered and reviewed inside the
  seed handoffs filed under YOM-1072 —
  [`2026-08-05-a.md`](../YOM-1072-ui-treasury-admin/handoffs/2026-08-05-a.md) and
  [`2026-08-06-a.md`](../YOM-1072-ui-treasury-admin/handoffs/2026-08-06-a.md).
