# Feature: UI — Manage User Presets

## Meta

- **Feature**: Youth-managed Opportunity-discovery preferences
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1261](https://linear.app/didx/issue/YOM-1261)
- **Owner**: Jason
- **Areas**: web
- **Status**: in-progress — mocked; real persistence blocked
- **Started**: 2026-08-27 (design); 2026-08-27 (implementation, behind the mock façade)

> Folder created 2026-08-27 to hold the design. Implementation started the same day **behind the
> mock façade** (see the build brief §6) — the blockers below still gate real persistence and the
> final preference list, not the UI build.

## Problem / Goal

Youth have no way to tell Yoma what they are looking for. Every visit starts from an unfiltered feed,
and the profile data we already hold (country, birth date) is not used to shape discovery. This
feature captures a small set of **search preferences** — a preset — and stores them as User-domain
data so discovery can inherit them.

Applying them is [YOM-1262](../YOM-1262-ui-apply-user-presets-to-opportunity-discovery/feature.md).
This ticket is capture and management only.

## Blockers

| Blocker | Note |
| --- | --- |
| [YOM-1264](https://linear.app/didx/issue/YOM-1264) (BA/design) | The preset list is not final. The design accommodates additions by construction — see Plan — but the field set cannot be signed off |
| [YOM-1257](https://linear.app/didx/issue/YOM-1257) / [YOM-1258](https://linear.app/didx/issue/YOM-1258) (api) | No preset model and no preset→filter mapping endpoint exists. There is nothing to build against |

Consequence for the build: **preferences are mocked behind one façade**, following the pattern
YOM-1281 established and YOM-1282 extended. Details in the build brief, §6.

## Out of Scope

- **Presets are User-domain data, not custom fields.** Do not build this through `CustomFields.tsx`,
  `CustomFieldFilters.tsx` or the CF models. Separate models, separate service, separate components.
  This is the epic's explicit rule, not a preference.
- Real persistence — mocked until YOM-1257 / YOM-1258 land.
- Applying presets to discovery, chip provenance, override behaviour — YOM-1262.
- Any AI ranking or weighting of preferences.

## Design

**Canvas**: `yoma-search-discovery.html`, page 1 (desktop + mobile, six steps, clickable) — held
**out of repo**; supplied to build sessions as PNG exports.
**Build brief**: `IMPLEMENTATION-PROMPT.md` — §6 (mock and mapping), §8 (the dialog), §9
(acceptance criteria) — held **out of repo**, pasted into the build session. Authoritative over
this summary for implementation detail.

A single dialog: a split panel with a fixed-width live result count on the left and a six-step
wizard on the right. Below `md` it collapses to a column with the count as a row above the wizard.

## Plan

### Data-driven by construction

`preferenceSteps.ts` is a typed array of steps; each step declares typed **blocks**; one
`<StepBlock kind=… />` maps kind → control. Block kinds: `cards`, `chips`, `rows`, `pills`,
`toggle`, `lookupSearch`, `readonly`.

Adding a preference must be a **data change with no new JSX**. This is the direct answer to the
YOM-1264 blocker: the field set is not final, so the surface is built so that the final set costs a
data edit.

Six steps cover the seven editable preferences: Goal · Interests · Skills · Time + Format ·
Language · Accessibility. (Pay was removed as a stored preference on 2026-08-31 — see Decisions;
it stays a session filter.)

### Preference shape (mock only)

```ts
type UserGoal = "job" | "learn" | "event" | "impact" | "biz";

type UserPreferences = {
  goal: UserGoal | null;                  // single-select
  targetCategories: string[];             // Opportunity Categories taxonomy
  selfReportedSkills: string[];           // EMSI skills lookup
  maxCommitment: { intervalId: string; count: number } | null;
  engagement: string | null;                    // proposed, unconfirmed
  languages: string[];                          // proposed, unconfirmed
  accessibility: { enabled: boolean; needs: string[] };  // opt-in, sensitive
};
```

Added to the user-profile shape **in the mock only**. No fields on the real `User` model, and no
writes to identity fields. The two proposed fields (engagement, languages) carry a code comment
marking them as awaiting BA sign-off.

### Identity fields are read, never written

The last step carries a **read-only** block for the four fields the mapping reads and never writes —
Country, date of birth, Gender, Education — each labelled with what it maps to. Preferences save to
a separate preset object; nothing in this dialog touches the profile or the YoID.

### Accessibility

Opt-in, off by default, never auto-applied from the profile. Never included in any outbound payload,
partner sync, credential, or analytics event — **including the mere fact that the filter is
enabled**. The UI states, before it is switched on, that enabling it excludes opportunities which
have not described their accommodations.

### Entry points

Opens automatically on the first visit to the discovery surface, then never again. Afterwards
reachable from the preference banner, the mobile sheet's preferences block, and the avatar menu.
Anonymous visitors get it too — answers held in session, with an offer to keep them at sign-in.

## Tasks

- [x] Design complete and reviewed — canvas page 1, desktop and mobile.
- [x] Build brief written and handed off.
- [x] Mock façade (`api/services/userPreferences.ts` + live + mock modules), YOM-1282 pattern.
- [x] `preferenceSteps.ts` registry + `<StepBlock>` switch — six steps, all seven editable
      preferences (pay removed 2026-08-31); adding one demonstrated as a data-only change (see
      the 2026-08-27-c handoff).
- [x] `PersonalizeDialog` with the fixed-340px live-count panel, floor state, read-only identity
      block, single-select goal with `COMING SOON` on `biz`.
- [x] First-visit auto-open + re-entry from the preference banner and the sheet's block.
- [x] Edit path seeds the wizard from stored preferences (mount-on-open contract, 2026-09-02);
      empty-state invites on both banners are the re-entry point after an unsaved dismiss.
- [ ] Browser pass of the manual test script — partially done by Jason (2026-08-31→09-02
      sessions were its findings); full §10 run outstanding.
- [ ] Saved skills render as raw GUIDs when re-editing — needs id→name resolution.
- [ ] Avatar-menu re-entry point (third entry point not wired yet).
- [ ] Anonymous → sign-in "keep your answers" offer (migrate session answers to the stored preset).
- [ ] **Blocked**: real persistence, pending YOM-1257 / YOM-1258 (mock-removal list in the
      2026-08-27-c handoff).
- [ ] **Blocked**: final preference list, pending YOM-1264.
- [ ] Confirm with the BA whether `Start a business` gets a filter mapping or stays inert.
- [ ] Confirm the privacy position on Gender before it appears in any visible filter UI.

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-08-27: **Goal is single-select and stays that way.** A youth selecting three goals gives no
  signal — the feed collapses back to "everything" and the most valuable question on the page is
  spent. Breadth belongs one step later at Interests, which is multi-select by design. If product
  asks for multiple goals, the answer is a ranked primary plus secondaries, which is a mapping
  decision rather than a UI toggle. The sub-heading says "One choice only" on screen so the
  constraint does not read as a defect.
- 2026-08-27: **`Attend events` added as a fifth goal.** The BA sheet mapped four goals to Job,
  Learning, Impact Task and one Category, which left `Event` reachable from no goal at all. A
  preference-driven feed built on that mapping could make every event on the platform structurally
  invisible to a personalised youth. `Attend events` → type `Event` closes it. `Other` remains
  unreachable from any goal; that gap is smaller — `Other` is a residual type rather than something
  a youth sets out to find — and is flagged rather than papered over.
- 2026-08-27: **`Start a business` ships visible and inert**, marked `COMING SOON`. It is the one
  goal with no agreed filter mapping. Modelled as `comingSoon: true` in the registry, not as a
  branch in the component, so it becomes the reusable pattern for every other preference the BA has
  not settled. Visible and inert beats quietly missing: the option stays in the conversation with
  the client instead of disappearing from the design.
- 2026-08-27: The live-count panel is `flex: 0 0 340px`. An earlier revision sized it to its content
  and it resized as the youth moved between steps, which read as the layout breaking.
- 2026-08-27: The count is floored — below a threshold it swaps to a "widen your feed" state rather
  than rendering a dead `0`, which would read as the preferences having broken the product.
- 2026-08-27: Preferences save to a **separate preset object**, never to identity or profile fields.
  Recorded here because the natural implementation — extending the profile — is the one the epic's
  out-of-scope rule forbids.
- 2026-08-27 (build): **Anonymous preferences live in the REAL service, not the mock.**
  `userPreferencesLive.ts` owns the `sessionStorage` path because session-held anonymous answers
  remain the design after the presets API lands; the mock delegates to it and adds only the
  signed-in fixture store. Signed-in scope throws loudly until YOM-1257 — a 404 against an
  invented endpoint would read as a bug.
- 2026-08-27 (build): The façade exports are typed `typeof real.X` so a drifting mock fails the
  build (the YOM-1282 rule, kept). Mocked/live is a per-session `localStorage` choice read per
  call, switchable from the preference banner.
- 2026-08-31 (revision): **`paidWork` removed as a stored preference** — dropped from the mock
  `UserPreferences` type, the wizard registry and the mapping; pay remains fully available as the
  "Paid & rewards" session filter. Step 5 is language-only, retitled "What languages work for
  you?" — the wizard is now six steps covering seven editable preferences. The live-count caption
  now reads "opportunities match your answers so far", an explicitly filtered total.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1261](https://linear.app/didx/issue/YOM-1261)
- Pairs with: [YOM-1262](../YOM-1262-ui-apply-user-presets-to-opportunity-discovery/feature.md)
- Blocked by: [YOM-1264](https://linear.app/didx/issue/YOM-1264) · [YOM-1257](https://linear.app/didx/issue/YOM-1257) · [YOM-1258](https://linear.app/didx/issue/YOM-1258)
- Builds on: [YOM-1260](../YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/feature.md) (presets resolve to filter criteria)
- Mock pattern: [YOM-1282 handoff](../YOM-1282-ui-opportunity-credential-schema-selection/handoffs/2026-08-17-a.md)
- Design + brief: out of repo — see the [2026-08-27 handoff](../handoffs/2026-08-27-b.md), Deliverables
- Handoff: [`../handoffs/2026-08-27-b.md`](../handoffs/2026-08-27-b.md)
