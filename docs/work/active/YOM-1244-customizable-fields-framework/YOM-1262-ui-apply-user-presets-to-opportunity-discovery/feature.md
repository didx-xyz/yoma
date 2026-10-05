# Feature: UI — Apply User Presets to Opportunity Discovery

## Meta

- **Feature**: Preset-driven opportunity discovery — search, filters and results
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1262](https://linear.app/didx/issue/YOM-1262)
- **Owner**: Jason
- **Areas**: web
- **Status**: in-progress — on the revised search contract (built and tested locally 2026-10-03); DEV pass outstanding
- **Started**: 2026-08-27 (design); 2026-08-27 (implementation, behind the mock façade)

> Folder created 2026-08-27 to hold the design. Implementation started the same day **behind the
> mock façade** — the blockers below still gate live preset data, not the UI build.

## Problem / Goal

Apply a youth's stored preferences to opportunity discovery, and make the result legible: they must
be able to see which filters came from their preferences, override any of them for this search only,
and understand that overriding changes nothing about their profile.

The custom-field expansion forces the same question on the existing surface. The current filter
popup, result card and search page were built for a handful of core fields; the definitions endpoint
now returns type-conditional groups with their own Group / SubGroup / SortOrder. The existing
information architecture cannot absorb that, which is why this ticket carries a **new surface**
rather than a refactor.

Capturing preferences is [YOM-1261](../YOM-1261-ui-manage-user-presets/feature.md).

## Blockers

| Blocker | Note |
| --- | --- |
| ~~[YOM-1257](https://linear.app/didx/issue/YOM-1257) (api)~~ | **Resolved 2026-09-29** — preferences are live (`/user/preferences`); the mock is removed |
| ~~[YOM-1258](https://linear.app/didx/issue/YOM-1258) (api)~~ | **Superseded by this ticket (PM, 2026-09-30)** — no server-side preset→filter mapping; inheritance composes client-side (`preferenceMapping.ts`) |
| [YOM-1264](https://linear.app/didx/issue/YOM-1264) (BA/design) | The preference set and the final filter mapping are not signed off; Difficulty and the Job fields are seeded, the other types' fields are not |
| [YOM-1260](https://linear.app/didx/issue/YOM-1260) must land first | Presets resolve to filter criteria, so this builds on that feature's clause shape and operator matrix |
| ~~Location API (Adrian)~~ | **Resolved 2026-09-29** — the place is a profile field (full `PATCH /user`), search takes nested per-country entries; `LOCATION_SEARCH_LIVE` is `true`. Distance only matches opportunities with coordinates, which today only admins add by hand |

## Out of Scope

- **Modifying the existing discovery page.** `pages/opportunities/[[...query]].tsx`,
  `OpportunityFilterVertical.tsx` and `FilterBadges.tsx` are not to be touched. Retiring the old
  surface is a separate change.
- **Per-type card layouts** — canvas page 4, experimental, awaiting client selection. Do not build
  the layout enum, the card-image upload, or the admin "Appearance" section. See Decisions.
- Admin opportunity search. Public / youth surface only.
- MyOpportunity / completion filtering.
- Any AI ranking or weighting. There is deliberately no "Best match" sort.
- The opportunity **detail** page.

## Design

**Canvas**: `yoma-search-discovery.html` — page 2 (landing, results grid, compact list, loading
state, mobile grid, mobile list, quick-search badge reference) and page 3 (desktop filter dialog,
mobile sheet, single-section popover, inheritance reference). Page 4 is experimental and out of
scope. Held **out of repo**; supplied to build sessions as PNG exports.
**Build brief**: `IMPLEMENTATION-PROMPT.md` — §4 (breakpoint parity), §5 (structure), §6 (mapping
table), §7 (behaviour contracts), §9 (acceptance criteria) — held **out of repo**, pasted into the
build session. Authoritative over this summary for implementation detail.

## Plan

### Three registries carry the surface

| Registry | Holds | Consumed by |
| --- | --- | --- |
| `filterSections.ts` | The eleven universal sections: id, label, icon, control kind, options source, null-rule copy, `fromProfile` flag | Desktop dialog, mobile sheet, standalone popover |
| `quickSearches.ts` | Quick-search badges: id, label, icon, the filter set each expands to, `availability` | Landing, results, desktop dialog, mobile sheet |
| `preferenceSteps.ts` | Wizard steps → typed blocks | Personalization dialog (YOM-1261) |

Adding a section or a badge must be a data change with no new JSX.

### Breakpoint parity is a structural requirement, with a test

Both breakpoints render the same blocks in the same order (revised 2026-08-31: recent searches
moved out of the block list into a typeahead under the input, and the sections trimmed — eight
blocks became seven; revised 2026-09-22: recents capped at 3, Paid and rewards demoted behind
"More filters" when Engagement took its place on the search bar, quick-search badges render only
when filterable):

```
1  free-text search input      (recent searches render beneath it as a typeahead, ≤3, removable,
                                "Clear recent")
2  quick searches              (shipped badges only — Under an hour · Climate action · Remote ·
                                Jobs in my country [a known country — profile, or anonymous
                                session answer] · Jobs near me [a city centroid in effect]; no
                                SOON state, no "Show all N")
3  your preferences            (master switch + inherited chips)
4  what kind of opportunity    (type row — always open, MULTI-select since 2026-09-03,
                                provenance-aware, drives block 5; fixed order Job · Learning ·
                                Task · Event · Other by enum name, labels from displayName)
5  type-specific filters       (one collapsible "«Type» filters" section per EFFECTIVE type, plus
                                "Details (all types)" for two or more; from the definitions
                                endpoint)
6  the sections                (primary six: Categories · Where · Engagement · How long ·
                                Accessibility · Language — then Paid and rewards · Skills · SDGs ·
                                Provider behind one "More filters" disclosure, collapsed by
                                default. "Who it is for" removed from the youth surface: admin
                                targeting never restricts who can apply)
7  sticky footer               (Clear filters + "Show N matches")
```

The desktop search bar is SEARCH · WHAT · WHERE · HOW LONG · ENGAGEMENT plus Filters with its
applied count; each registry-backed segment opens its section as a popover (one definition, two
homes). Below `md` the badge row sits inside the purple header **above** the search pill, which
carries a one-line summary of the effective filters ("Jobs · South Africa · Remote +1 · +3").

The only differences between breakpoints are the **container** — desktop is a centred dialog with
anchored popovers, mobile is one full-screen sheet — and control **density**. Never the set, never
the order.

A unit test asserts the ordered section ids are identical between the two containers and that neither
renders a block the other lacks. A test that fails when someone adds a mobile-only block is the
deliverable; a comment saying "keep these in sync" is not.

### One section, two homes

Each of the eleven sections is also openable on its own as a popover anchored under its search-bar
segment, rendered by the same `<FilterSection>` the dialog uses. Two doors, one filter state, one
component.

### The type-specific block

Collapsible like every other section, and keeps its distinct purple treatment because it is
conditional on the selected type and must not read as a permanent part of the filter set. Rendered
from `GET /opportunity/custom/field/definition?types={Type}`, grouped Group → SubGroup → SortOrder in
the order returned. Collapsed state is UI only — it never changes the query. Changing the type swaps
the block and clears type-scoped clauses.

### Inheritance and override — the answer to this ticket's core question

Three chip classes above the results, labelled `Group: Value`:

| Class | Look | Meaning |
| --- | --- | --- |
| Inherited, active | purple tint + person icon | Came from preferences. Removing affects this search only |
| Inherited, switched off | ghosted, struck through, **undo** action | One of theirs, off for this search. **Stays on screen** |
| Manual | green, no icon | Chosen here, not stored |

Plus one master "Using my preferences" switch that drops or restores the whole inherited set.

**Write-back is never automatic.** After the youth has actually overridden something, offer a
dismissible "Save these as my preferences" — once, not on load.

### View mode — grid and compact list

`viewMode: "grid" | "list"`, default grid, in the URL and persisted per device (URL wins). It changes
nothing about the query, the filters, the sort or the count — same request, same results, different
component. What the row drops: the image entirely, the summary line, the skill chips, the
accessibility flag. What it keeps: type badge, title, organisation, commitment, pay, closing date
with urgency colour, ZLTO. Desktop aligns them under a column header; mobile keeps the same values in
a three-line stack with pay in a fixed position.

### Preference → filter mapping

The full table is in the build brief, §6. Two deliberate inconsistencies to preserve, both stated in
words in the UI because a youth cannot infer them: **time commitment includes** opportunities with no
commitment set; **accessibility excludes** those that have not described their accommodations.

> **Corrected 2026-09-22 (BA sign-off).** Accessibility no longer excludes: opportunities that have
> not described their accommodations **stay in the results for now** (canvas p3, "Accessibility:
> stays in results for now"; BA All Opportunities sheet, "Null represents Not Specified"). The
> wizard's step-6 sentence saying the toggle hides them is removed, the section's null-rule line
> says "includes … for now", and the mapping must never exclude Not specified. Time commitment's
> rule is unchanged in intent (include) but the search API still excludes — the copy states the
> actual behaviour and the API ask stays open. The one-line null rules per section are now:
> How long — excludes for now (API) · Engagement — includes for now (API; BA says hide while set)
> · Accessibility — includes for now · Paid — includes, sorted last (once the field exists) ·
> Language — no null case (the API requires at least one language on every opportunity).

`MinimumQualification`, `ExperienceLevel` and Age are filterable **by** the youth and never applied
**for** them — a weight, never a gate, per the BA instruction. Marked `GUIDE ONLY` in the UI.

## Tasks

- [x] Design complete and reviewed — canvas pages 2 and 3, desktop and mobile.
- [x] Build brief written and handed off.
- [x] Route confirmed and built: **`/opportunities/discover`** — static route, querystring-only
      state (no catch-all; nothing rides the path). Shell page ≤30 lines.
- [x] View mode: `view` URL param (URL wins) + per-device `yoma.discovery.viewMode` in
      `localStorage`, following the app's existing localStorage-per-device convention.
- [x] URL codec, reducer, context, live count, results query, preference inheritance + three chip
      classes, master switch, per-chip skip/undo, write-back prompt (once, dismissible).
- [x] `filterSections.ts` / `quickSearches.ts` registries + one `<FilterPanelBlocks>` consumed by
      both containers; registry-only extension demonstrated and reverted (2026-08-27-c handoff).
- [x] Type row + type-specific block reusing YOM-1260's `CustomFieldFilters`; type change clears
      type-scoped clauses in the reducer.
- [x] Grid card (fixed height, pinned footer, clamped title) + compact list sharing one
      `LIST_COLUMNS` constant; loading keeps previous results blurred, one spinner, pulse on the
      new chip, `motion-reduce` throughout.
- [x] ~~`Jobs near me` ships **visible and unavailable** with a tooltip (decision: not hidden).~~
      **Reversed 2026-09-22**: parked, not rendered — see Decisions.
- [x] 2026-09-22 client feedback + BA alignment (Pass 1, session 2026-09-23): PAY → ENGAGEMENT
      segment with `engagement=` in the URL; Paid and rewards under More filters; badges render
      only when filterable (Remote added; Jobs in my country conditional on profile country);
      mobile badge row above the pill + pill summary line; recents capped at 3 with Clear recent;
      wizard step 1 rationale box gone and Start a business mapped by category name; engagement
      preference multi-select; accessibility copy no longer claims exclusion; type row order
      fixed by enum name; one engagement display map; card status rule (`lib/cardStatus.ts`);
      Where reserved inputs; Provider typeahead; Skills caption; Paid and rewards composite with
      ZLTO hidden while Type includes Job; SOON / "Show all N" styling removed from badges.
- [x] Browser pass of the manual test script (brief §10) — first full pass by Jason 2026-09-03;
      **local pass of the 2026-09-29 manual steps 1–8 on 2026-09-30, all passing** (findings fixed
      the same day — [`../handoffs/2026-09-30-a.md`](../handoffs/2026-09-30-a.md)).
- [x] Where section: region / city / distance **live** through the shared `LocationInput`
      (2026-09-28, see Decisions) — mocked search: not sent until `LOCATION_SEARCH_LIVE` flips.
      The "my country only" switch is still not built.
- [x] User location (2026-09-28): wizard block in step 5 above Languages, Where section, bar
      segment + mobile pill summary, chips (incl. the inapplicable class), `Jobs near me`
      shipped, sign-in merge rule. Browser pass on local, anonymous only — see the 2026-09-28
      handoff.
- [x] **Location search live** (2026-09-29): `lib/searchRequest.ts` sends one country entry
      with region / city, or coordinates + radius (never both — the API rejects it), only for
      exactly one country; `LOCATION_SEARCH_LIVE = true`. The API confirms the null rule (no
      region / city → included); distance EXCLUDES opportunities without coordinates, stated as
      `DISTANCE_NOTE` in the Where section and the results.
- [x] **User location wired** (2026-09-29): read from `GET /user`, written with the full
      `PATCH /user` from `userPreferencesLive.ts`; the preferences PATCH never carries it.
      Verified locally signed in (Cape Town round trip, `[lng, lat]`, `Lookup`).
- [ ] Signed-in browser pass on DEV (read-only profile country, "Change your profile country" on
      a device mismatch, keep-answers dropping a place from another country, an incomplete
      profile making the place save fail visibly).
- [x] ~~Follow-up ticket for the admin form adopting `LocationInput`~~ — done in this session
      instead (2026-09-29, Jason's call): one place per non-Worldwide country in the editor.
- [x] Raise the API asks with Adrian — epic README asks 1, 2, 5, 6, 9, 12, 13 still stand; 3, 4, 7, 8, 14–16
      are resolved; asks 17–21 (2026-09-29) and 22 (2026-09-30) are left for Adrian in the
      2026-09-30 handoff. **The API takes priority for now** (Jason) — web does not wait on them.
- [x] Live preset data (2026-09-29): mock, DEV allowance and `PreferencesMockDevTool` removed.
- [ ] Client decision on the per-type card layouts (canvas page 4) — if taken up, it becomes its own
      ticket with two new opportunity fields.
- [ ] **Regression check once the BA field set is seeded (YOM-1264):** the per-type sections render
      the Job / Impact task / Event / Learning groups from the definitions endpoint with no code
      change; the Paid half of Paid and rewards, Accessibility, Skills and SDGs come alive through
      their bindings (not through definition keys); the parked badges (Paid & remote, No
      experience needed, With accommodations, Climate action + SDG 13) get their filter sets from
      the new core facets and flip to `shipped`; the Job rules on screen (Pay interval "Per
      engagement (once-off)", Salary range disabled when Salary disclosed = No, Permanent and
      Fixed-term exclusive, Minimum qualification GUIDE ONLY) hold with no per-field code.
- [ ] **Regression check once the category taxonomy migration (YOM-1259) is deployed:** 16 tiles
      on the carousel and 16 chips in Categories / wizard Interests with "Show all 16"; the
      Climate action badge resolves "Agriculture, Food, Environment and Climate"; drop the
      pre-migration names from `quickSearches.ts` once no environment serves them; confirm the
      facet counts are no longer grand totals on DEV. (Start a business maps to the
      Entrepreneurship type since 2026-10-01, so it no longer depends on the taxonomy.)
- [x] **Engagement Type rename** (2026-09-29): `lib/engagementLabels.ts` deleted; cards, chips,
      the section, the bar segment and wizard step 4 read the lookup's `displayName` (verified:
      Hybrid / On-site / Remote). `Task` → `ImpactAction` in `typeOrder` / `typeBadge` /
      the goal mapping; cards and rows show the type's `displayName` ("Impact Action").
- [x] Salary on the card's pay line (2026-09-30) — from the Job's system-controlled salary fields:
      the currency lookup (one cached request) labels the id, `JOB_PAY_INTERVAL_OPTIONS` the
      interval ("ZAR 20 000–30 000 / mo").
- [x] Design review (claude.design session) → **round-7 visual pass built 2026-09-30**
      ([`../handoffs/2026-09-30-b.md`](../handoffs/2026-09-30-b.md)): header-owned categories +
      Current filters, the colour rule, cards with the summary restored, the experimental detail
      pages, the welcome step. Every place the canvas was not followed is listed there.
- [ ] Round-7 follow-ups: `next build`; copy review of the new strings. (The tabbed detail
      layout replaced the classic one behind the kill-switch on 2026-10-01.)
- [x] **Entrepreneurship type** (Adrian's `f0194e90`, 2026-10-01 —
      [`../handoffs/2026-10-01-b.md`](../handoffs/2026-10-01-b.md)): type order (before Other),
      blue-dark chip / band / button, "View programme" copy, welcome tile icon, a `programme`
      card fact, "Start a business" → the type, the list's type column widened to fit it.
- [ ] BA to confirm "Start a business" → Entrepreneurship type (the sheet says the Category).
- [x] Discovery is the navbar's search page behind the kill-switch (`OPPORTUNITIES_SEARCH_URL`),
      and the cards link only through their button, with a mobile arrow on the list row
      (2026-10-01).
- [x] **claude.design review, round 10** (2026-10-02, built through the agent roles —
      [`handoffs/2026-10-02-b.md`](handoffs/2026-10-02-b.md)). The brief, artboards and checked
      task list are in [`design/`](design/2026-10-02-tasks.md); Jason's answers head the task list.
      Built: welcome step W1–W8, tabbed detail D1–D10 + D13, admin header A1–A3, landing rails
      R1–R5 with a `featured` facet, copy C1–C11. Not built by Jason's choice: W9, D11, D12, A4, C12.
- [x] Round-10 follow-ups F1–F4 (2026-10-02, [`design/2026-10-02-followups.md`](design/2026-10-02-followups.md)):
      the welcome takes its content's height and never scrolls on desktop; Get started morphs
      into step 1; open chip sections carry a note; focus starts on Get started.
- [x] Jason's browser: the welcome did not auto-open after clearing the seen flag. Jason
      solved it on his side (2026-10-02); no code change.
- [x] Signed-in pass of the round-10 admin header (A1–A3) and the editor Preview, on local with the
      seeded org admin (2026-10-02). Both pass at 1440 and 390. The Preview was
      reached on a Learning opportunity: the seeded Job fails the editor's Details validation, and
      filling the fields locally was refused. The seed does not carry the Completed tile, "Limit
      reached" or the pull-sync badge.
- [x] Keep the active pill in view in the sticky / pinned tab bars at 390. This is the designer's
      fix; the gap predates round 10 on the public page.
- [ ] Round-10 items the seed cannot show: the Age row, Global goals (SDGs), Provider card,
      Starts / Ongoing / Depleted facts, Pending / Completed buttons, the five-pill welcome grid.
- [ ] `next build --webpack` without a dev server on `.next` (still outstanding from round 7).
- [ ] Point the remaining legacy `/opportunities` entry points at discovery (search boxes,
      category links, banners, referral pages, the detail back link). Each needs its query
      params mapped.
- [x] **Move Web onto the revised search contract** (Adrian's `77646a74`, 2026-10-03; see
      Decisions and [`handoffs/2026-10-03-a.md`](handoffs/2026-10-03-a.md)). Each wave was
      reviewed and tested; W3 was also checked against its approved spec. Uncommitted at the
      handoff, and it ships as one change:
  - [x] W1: wire types and one converter; every legacy, admin and CSV search caller; the admin
        status-tab counts as `totalCountOnly`; engagement preferences as a list; the completion
        CSV sample synced with the API's.
  - [x] W2: discovery composition with provenance (modes, the "Start a business" and saved-skills
        groups, Worldwide, inherited accessibility and skills), the sort mapping,
        `useTypeDefinitions` by `entityContext`, and unit tests for the builder and merge.
  - [x] W3: the visible changes (multi-select engagement step and summary, Sort, section rule
        copy, the new inherited chips, "not specified" wording, Job completion without "Time to
        complete").
- [ ] DEV pass of the search-contract move, once DEV runs an API on `77646a74` or later.
- [ ] Follow-up, out of scope 2026-10-03: a per-section "Include not specified" switch. Today no UI
      sends `Only`, and modes are fixed by provenance.
- [ ] Follow-ups from the 2026-10-03 build:
  - the live count's "counting" cue flickers off for 300 ms when the readiness gate reopens
    (`state/useResultCount.ts`);
  - the breakpoint-parity test (2026-08-27), now possible with `pnpm test`;
  - the legacy `OpportunitiesGrid.tsx` duplicate-key warning.

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-08-27: **A new page and component tree, not a refactor of the existing discovery page.** The
  change is to the information architecture, not the styling — segmented search bar, a preference
  layer composing with session filters, type-conditional custom-field groups, a view mode, a
  different mobile model. Retrofitting produces a page serving two IAs at once. Build the new tree,
  prove it, retire the old one separately. Existing shared building blocks may be extended
  additively; no changed signatures.
- 2026-08-27: **Desktop and mobile must render the same registry in the same order, enforced by a
  test.** The first design revision claimed parity and did not have it — Quick searches and Recent
  existed only on mobile, and the type-specific block rendered real grouped definitions on desktop
  against a hand-made chip row on mobile. Prose instructions did not prevent that; a test will.
- 2026-08-27: **The type-specific block is collapsible but keeps its conditional colour.** Making it
  behave like the universal sections was the request; making it *look* like them would hide that it
  appears and disappears with the selected type.
- 2026-08-27: **Sort is Newest · Ending soonest · Most ZLTO. "Best match" is removed.** No relevance
  score is computed server-side and weighting is deferred to the AI project; the label would promise
  something the API is not doing.
- 2026-08-27: **Category tiles stay in their current position** on the results page. Size increased,
  position unchanged — a deliberate limit on how much of the page this change moves.
- 2026-08-27: **Compact list is a youth-controlled view, not an admin setting**, and it is not a
  per-opportunity layout. Its cost is stated in the product rather than left to be discovered: on
  mobile a single line explains that images and summaries are hidden. Consequence worth flagging to
  the client — in list view every uploaded image and any future per-type card layout has no effect.
- 2026-08-27: **Fixed card height per breakpoint**, footer row pinned to the bottom, title clamped to
  two lines. Only one layout ships now, but a mixed grid of layouts is only possible if every layout
  shares one box, so the single card is built to that discipline from the start.
- 2026-08-27: **Loading keeps the previous results mounted** under `blur-sm opacity-50
  scale-[0.99] transition duration-300`, with a shimmer on the count, exactly one spinner beside the
  count, a pulse on the newly added chip, and `motion-reduce:animate-none` throughout. No blank page,
  no layout shift.
- 2026-08-27: **Zero-count facet values grey out with the count still visible** and no facet
  disappears mid-session. A control that vanishes reads as a broken page.
- 2026-08-27: **The URL is the single source of truth for filter state, and that includes the view
  mode.** One reducer, one serialiser, one parser; no parallel React state mirroring it.
- 2026-08-27: **The breakpoint-parity test is deferred — parity is verified manually for now.**
  `src/web` has no test runner (no vitest/jest, no `test` script), and Jason chose not to introduce
  one this session. Parity remains structurally enforced — both containers consume one registry and
  one `<FilterSection>` component — and is confirmed by manual side-by-side inspection per the test
  script. The brief's acceptance criterion for an automated parity test stands unmet until a runner
  is adopted.
- 2026-08-27 (build): **Four API-contract givebacks, recorded because the design promised more
  than `/opportunity/search` offers** (the API contract wins; asks filed with Adrian in the
  2026-08-27-c handoff): sort is Newest-only (`OrderInstructions` is internal) with the other two
  options visible-disabled; Skills / Who it is for / SDGs / Accessibility sections and the
  Paid & remote / No experience / Accommodations badges are visible-inert pending YOM-1264 fields;
  facet counts exist only on categories; and the interval filter **excludes** opportunities with
  no commitment set — the inverse of the BA rule — so the section's null-rule copy states the
  actual behaviour until the API changes.
- 2026-08-31 (revision): **Category browser reverted to the app's existing carousel**
  (`OpportunityCategoriesHorizontalFilter`) via a thin id↔name wrapper — no second carousel.
  **Recents became a typeahead** under the search input (≤5, removable) instead of a block.
  **Sections trimmed 11 → 7**, with Skills / SDGs / Provider demoted behind a "More filters"
  disclosure (a `group: "primary" | "more"` field in the registry — demoting/restoring stays a
  data change) and "Who it is for" removed from the youth surface entirely: it is admin-side
  targeting that never restricts who can apply, so offering it would imply a constraint that does
  not exist. **Card field set revised** to type+reward · title · location+engagement ·
  ≤2 skill chips+N · due date (urgency ≤7 days, changed from 14 in `lib/dates.ts`) ·
  "X of Y places left" — both `participantLimit` and `participantCountTotal` are exposed on
  `OpportunityInfo`, so places render from exposed fields only. **My-opportunities entry point**
  added in the header on both breakpoints, linking to the existing `/yoid/opportunities/pending`
  surface with the profile's already-loaded `opportunityCountPending` as the badge.
- 2026-09-02 (browser-feedback): **Controls are provenance-aware.** All filter controls, the
  segmented bar and the category carousel display EFFECTIVE filters (manual + inherited);
  deselecting an inherited value skips its owning preference for this search — one semantic,
  identical to removing its chip, per-preference granularity. Applied chips now also render on
  the landing page (departure from the design's "no chips on landing": the inherited layer must
  be visible and editable before a search runs). The static FROM PROFILE badge became a truthful
  FROM PREFERENCES badge, shown only while a section actually receives an inherited value.
  Full change list in [`../handoffs/2026-09-02-a.md`](../handoffs/2026-09-02-a.md).
- 2026-08-27 (build): **Preference inheritance composes client-side for now.**
  `preferenceMapping.ts` implements the §6 table rows the API can express; the API already carries
  an inert `ApplyUserPresets` flag, which YOM-1258 is expected to make the real mapping path —
  at which point the client-side merge becomes redundant and should be revisited.
- 2026-08-27: **Per-type card layouts are explicitly excluded from this ticket.** Six layouts plus an
  admin "Appearance" section were designed as options for the client (canvas page 4) and are not to
  be built. Two of the six use no image at all by design — Job and Impact task — so their variation
  is salary disclosed / not disclosed and requirements listed / not listed instead.
- 2026-09-03 (browser-feedback round 2): **Opportunity type is multi-select** (`filters.types:
  string[]`, URL `type=Job,Event`) and the type row is provenance-aware like every other control —
  it displays EFFECTIVE types, and deselecting the inherited one skips the Goal preference.
  Block 5's type-specific filters became **one collapsible section per effective type**, headed
  "«DisplayName» filters"; clauses are partitioned per section by definition key (generic
  definitions arrive with every type and edit consistently across open sections). The reducer's
  `toggleType` clears ALL custom-field clauses when a type is REMOVED (clauses are not tagged by
  type — clearing beats guessing); adding a type orphans nothing. Also from this round:
  **Clear all now also switches off the active inherited layer** (struck-through, undoable —
  "empty search" means empty; `clearAll` on the context supplies the fragment keys); the results
  header is filter-aware ("N matches for …", skipped chips excluded); the pager scrolls back to
  the count row; the **Search segment** joined the desktop bar (block 1 in popover form, recents
  inline) and the LAST segment's popover right-aligns so it cannot overflow the viewport; the
  loading treatment is a plain opacity fade — the former `blur-sm scale-[0.99]` read as the page
  breaking — and count updates blur only the TEXT of the previous number, never a swapped-in
  placeholder box.
- 2026-09-03 (round 3): **Clause clearing on type removal is a GLOBAL reducer rule**, not a
  per-action one — the first cut lived in `toggleType` only and missed the chip's ×
  (`removeManual`), quick-search toggles, popover resets and skipping the inherited Goal.
  `reduceDiscovery` now post-processes every action: if the types set shrank (or the Goal
  preference was skipped — its fragment supplies a type), `customFields` clears. Known gap:
  master-switch-off doesn't clear (it can't tell inherited-type clauses from manual-type ones).
  Also: custom-field chips are labelled by the FIELD TITLE (`«title»: «value»`, "Has any value"
  for Exists) instead of the static "Details"; each per-type section nests **one disclosure per
  definition group** (the More-filters pattern) with sub-group headings inside, clauses
  partitioned by definition keys at each level; and the results heading is short-form —
  "N match(es) for «first value» + K filter(s)", where K counts remaining chips AND
  custom-field clauses (the chips row carries the full set).
- 2026-09-03: **The write-back prompt returns after each save.** "Save to profile" no longer
  session-dismisses the prompt (only "Not now" does); instead, the wizard's save dispatches
  `resetPreferenceOverrides` — the preset just saved IS the new default, so per-preference skips
  and the master-off switch are cleared. The prompt disappears because nothing is overridden any
  more, and it can re-offer on the NEXT override.
- 2026-09-03 (round 4, superseding part of the entry above): **"Save to profile" persists
  one-tap, and the prompt is unconditional.** Jason reversed the earlier
  review-in-the-dialog reading: the button now saves directly through the façade —
  `applySkipsToPreferences` clears each skipped preference's field from the preset (a skipped
  preference means "stop applying this") — then keeps only the identity-derived skips
  (`country`, `age`, which have no preset field) in the URL via `setSkippedPreferences`. The
  session-dismiss state ("Not now" + `yoma.discovery.writeBackDismissed`) is GONE: the prompt
  shows whenever at least one savable preference is skipped, and retires itself because saving
  removes the skips. Also in round 4: the type row moved inside the section list and dresses
  like the universal sections (icon + divider, always open); nested group dividers span full
  width (content indents, the border doesn't); segment popovers carry question titles from the
  registry's new `question` field; sections renamed Location → **Where** and Time commitment →
  **How long** (segment "When" → "How long"); "What kind of opportunity?" → "What **type** of
  opportunity?"; the banner's Edit button is purple/white with a pencil; the floating filter
  button uses `top-20` on both breakpoints (the navbar is `h-20` everywhere — mobile's `top-16`
  hid 16px of it).
- 2026-09-03 (round 5): **Skipping a preference also strips its values from the manual filters**
  — the intermittent "removed inherited chip reappears green" bug: a value both inherited AND
  manually set (quick search, or picked before preferences resolved) survived the skip as a
  hidden manual duplicate, surfacing as a green chip and still filtering. New compound reducer
  action `skipPreference {key, fragment}` (one action, not two dispatches — the second would
  race the router); `skipPreference(key)` on the context is now the ONE deselect path for
  inherited values (chip ×, section controls, type row, category tiles); undo remains
  `setPreferenceSkipped(key, false)` and does not resurrect the stripped duplicates (they were
  redundant while inherited). Also round 5: **"Not now" restored** on the write-back prompt —
  dismissal is keyed to a SIGNATURE of the skipped keys (sessionStorage), so the prompt returns
  whenever the override set changes rather than staying dead for the session; the mobile sheet's
  title matches the desktop dialog ("Filters" + green count badge, aria-label aligned); the
  What-segment popover renders the shared question-title style (`TypeRow hideHeader` — its own
  icon/divider header made the popup open with a tall gap).
- 2026-09-03 (round 6): **One dismiss behaviour for all overlays** — `useDialogDismiss` (state/):
  Escape closes, and the browser Back button closes via a same-URL sentinel history entry
  (native `<dialog open>` is non-modal, so the UA handles neither; `showModal` would fight our
  styling/stacking). Filter tweaks made while an overlay is open sit above the sentinel, so Back
  first reverts them (URL-as-state, by design) and then closes. **Scroll-to-results is explicit
  and centralised**: `scrollToResults()` + `resultsAnchorRef` on the context, called ONLY by the
  Show-N-results actions (dialog/sheet footers, segment popovers, wizard finish) and the pager —
  never by selecting or changing a filter. Also round 6: both dialogs capped
  (`min(90vh, 52rem)` filters / `min(85vh, 46rem)` wizard) so tall monitors don't stretch them;
  Quick searches got its section icon; popover search inputs render the large rounded block-1
  style via `FilterControl largeSearch` (dialog sections keep the compact one); "Show N results"
  buttons share `ShowResultsButton` — previous count stays mounted, text-only blur, `min-w-44`
  against layout shift.
- 2026-09-03 (round 7): **`useDialogDismiss` no longer consumes its history sentinel on close.**
  The cleanup-time `history.back()` lands asynchronously, and under React StrictMode's dev
  double-mount the remounted listener received that self-inflicted popstate and closed the
  wizard the instant it opened ("Edit my preferences" flicker — only mount-on-open overlays were
  hit; the always-mounted filter containers never remount). Cost of leaving the sentinel: one
  silent Back press after a non-Back close; reopening reuses the entry. **`scrollToResults`
  retries across frames** until the body scroll-lock (`overflow: hidden`, released one render
  after the overlay closes) is gone and the anchor exists — the single-rAF version silently lost
  the race, which was the "auto-scroll sometimes doesn't work" report. Also round 7: buttons say
  "Show N **match(es)**", zero reads plainly "0 matches" and the results section shows a
  refine-your-search warning; the block-1 search inputs are one shared `FreeTextSearchInput`
  (explicit search button + clear button, commit on Enter/blur/button, clear commits `null`
  immediately); section filter inputs got a clear button too.

- 2026-09-05 (design-refinement round, from a claude.design review of the running surface —
  committed separately from rounds 2–7 so the experiment can be reverted whole):
  - **The master preferences switch now clears custom-field clauses too.** It was the known gap
    in the 2026-09-03 round-3 rule (it cannot tell an inherited type's clauses from a manual
    type's); switching the layer off is now treated as "types shrank". Over-clearing is
    recoverable, a clause filtering on a type that is no longer selected is not visible anywhere
    and cannot be removed.
  - **Fetch failures are stated, never silent.** Lookups, the definitions endpoint, the results
    query and the live count each report failure: an error `<Message>` with Retry in the results
    region, a one-line "Couldn't load opportunity types — retry" in place of an empty type row,
    a per-section error where definitions failed, "Show results" without a number on the footer
    button, and "Count unavailable right now" beside Clear all. An empty option list that looks
    like "no countries exist" is indistinguishable from a broken page.
  - **Generic definitions are rendered ONCE across selected types.** The endpoint returns the
    generic set plus the type's own for every type asked about, with no marker saying which — so
    Job + Event drew 18 of 24 controls twice. `useTypeDefinitions` intersects the definition keys
    across the fetched types (what every type returns is by construction not particular to any of
    them) and renders the intersection as one "Details (all types)" section above the per-type
    ones, which then carry only their difference. Two types up only: with one type selected the
    intersection is everything, so that case renders exactly as before. No API change — though an
    "owning type" marker on definitions would make this exact rather than inferred.
  - **Category tile counts stay; the "Counts are live and respect your preferences" caption
    goes.** Verified on the local API: `/opportunity/search/filter/category` returns 2 457 for
    all ten categories because every seeded opportunity carries all ten (a category-filtered
    search returns the same total, and a bogus id is rejected — the filter works). That is a
    fixture artefact, so no code change to the counts. The caption was wrong independently of
    the data: the counts come from the lookup, which knows nothing about the current search or
    the youth's preferences. Re-check the counts on DEV once the API redeploys.
  - **One badge component, three intents.** Amber carried both "not available yet" (SOON) and
    "consent required" (OPT-IN), so the colour said nothing; OPT-IN moved to neutral grey and
    amber now means availability alone. FROM THIS TYPE and FROM PREFERENCES share one purple
    provenance tone (the former was solid purple, the only filled badge on the surface).
  - **One `SectionHeader` for every block in the filter panel** — universal sections, the type
    row, the per-type custom-field sections and "More filters" — so icon size, label scale, the
    value column, badge placement, chevron and divider cannot drift apart again. **The type row
    is a noun with a value column** ("Type · Job · Event" / "Any type"); its question becomes the
    subtitle and still titles the popover, where it is the only label on screen. **Helper text is
    a 13px subtitle**; boxed callouts are reserved for null-rule warnings, which are the only
    helpers that change what the search returns.
  - **44px touch targets below `md`** on every option pill, type pill, quick-search badge in a
    panel, wizard pill and disclosure row. The custom-field controls reach it through a new
    `largeTouchTargets` prop on YOM-1260's `CustomFieldFilters` — additive and off by default, so
    the admin and legacy filter panels are untouched (the epic's rule for shared building blocks).
    The hero's scrolling badge row stays compact: it is not the place a thumb aims carefully.
  - **One loading treatment, everywhere.** The spinner beside the count and the three shimmer
    placeholders (results heading, Show-results button, wizard count panel) are gone; what
    remains is the results fade plus the text-only blur on a previous number. A shimmer promises
    a number that a failed request will never deliver — the placeholders became "Searching…",
    "Show results" and "Counting…".
  - **Spacing is 32px between page blocks and 24px inside the filter panel**, dropping to 24px
    on the page below `md` where the fold is the scarcer resource. Mobile category tiles lose
    their square aspect and their count (icon + label only, ~78px instead of ~120px), done with
    child variants in the carousel rather than a prop, so the legacy page's carousel is untouched.
  - **A sub-group heading has to earn its level.** A sub-group wrapping exactly one field renders
    its name as the field's label prefix ("Application · [Sample] Application Required") instead
    of a heading — five of six sub-groups in the seeded data were one-field headings. Below `md`
    the heading level goes entirely and every field carries the prefix (`useIsCompact`, the one
    place this surface asks JavaScript about the viewport, because the change is to the rendered
    string and not to styling). Indentation is capped at one level, shallower on mobile.
  - **Quick searches order available-first** (five of seven are inert, and the registry order
    buried the two that work), and the **sort row collapses to one disabled "More sorts soon"
    pill below `md`** — two dead pills is a poor use of a 390px row; desktop keeps all three.
  - **Wording pass.** "Save to profile" → **"Make this my default"** with an inline "Saved. Undo"
    (the old label contradicted the promise one line above it, and a one-tap write with no way
    back is not one-tap); the write-back offer merged INTO the preference banner as its second
    line, so preference state has one home instead of three stacked panels; the banner lists
    every inherited value, two by name then "+N"; the hero's results line no longer points at
    chips that are below it; "Up to a hour" → "Up to an hour" (article by sound, silent-h list —
    a letter-only rule is what produced the bug).
  - **Build: the zero-results state offers the way out.** "No matches. Try removing a filter:"
    followed by the applied chips, inline and removable — the same `AppliedChips` component, so
    there is no second chip implementation. With nothing removable (a free-text miss) it says so
    instead.
  - **Build: Copy link on the results heading.** The URL is already the whole search, so a
    shareable search is one button and no new state. Confirmation is inline, not a toast.
  - **Recent searches carry a relative time** ("2h ago"), stored as `at` on the entry; entries
    written before this round have none and simply show the count.
  - **Per-type card layouts (brief §5) were not built** — the brief marks the section "ignore for
    this session", and canvas page 4 is still awaiting the client's pick-or-drop.

- 2026-09-05 (same session, Jason's review of the refinement round — supersedes two bullets in
  the entry above):
  - **The mobile category tiles are back to the shared card as it stands** — square, with the
    count. The compacted mobile variant bought ~45px of fold and cost the tiles their consistency
    with every other surface that renders `OpportunityCategoryHorizontalCard`; the fold is not
    worth a second look for the category row. If the fold is revisited, it should be by moving or
    dropping the row on mobile, not by making the same component look different here.
  - **"Clear all" is now "Clear filters", and it clears filters ONLY** — reversing the
    2026-09-03 round-2 reading that pressing it means "empty search" and should therefore also
    switch off the inherited layer. Preferences are a standing setting, not one of this search's
    filters, so a button in the filter panel must not silently turn them off; the master switch
    and the per-chip skip remain the two ways the layer comes off, and both say what they do.
    The reducer action is `clearFilters` (no payload) — `preferencesOff` and `preferencesSkipped`
    are untouched by it.
  - **The clear action only exists while there is something to clear.** Both homes (the chips row
    and the sticky footer) hide it unless the session carries a filter of its own —
    `hasActiveFilters(state.filters)`, exposed as `hasFilters` on the context. The test is the
    manual filters, deliberately NOT the chips: a row of purely inherited chips has nothing for
    this button to remove, so offering it there would say the opposite of what the button now
    does. The footer switched from `justify-between` to `justify-end` + `mr-auto` so the Show
    button stays put when the left side empties.
  - **The hero's quick-search row scrolls instead of overflowing the page.** Its wrapper was
    `hidden justify-center md:flex`, which made the scroller a flex ITEM sized to its content
    (1322px of badges): `overflow-x-auto` never engaged, so between `md` and ~1350px the row ran
    off both edges of the hero with the first badge unreachable at a negative x, and the document
    itself scrolled sideways. The wrapper is now a block and the row carries
    `justify-center-safe` — centred while the badges fit, start-aligned and scrollable when they
    do not. Worth remembering the shape of this bug: a `ScrollableContainer` inside a flex parent
    needs a width constraint or it silently stops being a scroller.

- 2026-09-05 (DEV-preview pass, before parking the work for team feedback):
  - **A facet that 404s is "not available from this API yet"; anything else is a failure.**
    `lib/apiStatus.ts` splits the two, and every lookup carries its own status
    (`lookups.status[key]`). The brief's §1 rightly demanded that nothing fail silently, but the
    first cut treated an endpoint the environment does not serve as an outage: on DEV, whose API
    image has no custom-field endpoints at all, that painted an error over a page that is
    working as well as it can. A 404 now reads as a plain note — the same visible-but-inert
    vocabulary the surface already uses for facets the API cannot express — and only real faults
    get red and a Retry.
  - **Lookup failures are reported in the section they feed, not over the results.** The
    page-level "Some filter options couldn't be loaded" banner is gone: the Provider lookup
    (behind "More filters", 500 on DEV) was putting a red bar across an otherwise working page.
    `<FilterControl>` renders the note or the error inside its own section, with the null-rule
    copy suppressed while the options are missing — it describes what the filter does, and it
    does nothing.
  - **`next.config.mjs`'s dev-only PWA `disable` was reverted** (with the type cast it required).
    It was a local-comfort change — service workers in dev — carried on a feature branch that is
    about discovery; it goes back to the team through its own change if it is still wanted.
    Consequence worth knowing: in local dev the service worker registers again, so requests it
    mediates bypass devtools/puppeteer request interception (that is what made the first pass at
    simulating the DEV 404s look like the interception was broken).

- 2026-09-22 (client feedback on the revised canvas `yoma-search-discovery_3.html` + BA sign-off
  of September 2026; built 2026-09-23 — handoff
  [`handoffs/2026-09-23-a.md`](./handoffs/2026-09-23-a.md)):
  - **PAY → ENGAGEMENT on the search bar, on every breakpoint.** The bar is SEARCH · WHAT · WHERE
    · HOW LONG · ENGAGEMENT. Values Any · Remote · On-site · Hybrid, multi-select, summary "Any" /
    one value / "Remote +1". The popover reuses the Engagement section definition — the section id
    is the segment id, one definition, two homes. **Paid and rewards moved under "More filters"**
    (order there: Paid and rewards · Skills · SDGs · Provider), so the primary list is six. URL:
    `engagement=` as a list, renamed from `format=`; nothing reads the old name. There was never
    a `pay=` param — the section's `reward=` / `zlto=` are unchanged.
  - **Engagement null rule: web states the actual behaviour, not the BA rule.** BA says hide
    opportunities with no engagement type while the filter is set; the search API includes them
    (`!o.EngagementTypeId.HasValue || …`) and web cannot exclude client-side over server paging.
    The section's line says "includes … for now" and the exclusion is epic README ask #9.
  - **Quick-search badges render only what filters today** — reversing 2026-08-27's "Jobs near me
    ships visible and unavailable" and the SOON state with it. Shipped: Under an hour · Climate
    action (category resolved by NAME at runtime, accepting "Agriculture, Food, Environment and
    Climate" then the pre-migration "Environment and Climate") · **Remote (new)** (engagement
    type by name, "Remote" then "Online") · Jobs in my country (Type Job + profile country;
    **renders only for a signed-in youth whose profile has a country** — anonymous users never
    see it). Paid & remote, No experience needed, With accommodations, Climate action + SDG 13
    and Jobs near me stay in the registry as `parked` entries that never render and carry no
    definition keys. With four badges the dialog shows no "Show all N" and the hero row fits at
    1280 / 1440. A badge still applies its whole set and tapping again clears only what it added.
    **No per-badge counts** (Jason, 2026-09-23: never issue one search per badge) — the canvas's
    "zero-result badges grey out with the count visible" is not built; a batched facet-count
    endpoint is filed as README ask #13.
  - **Mobile badge row moved into the purple header above the search pill**, on landing and
    results, matching desktop; horizontal scroll, compact density, `min-h-8` reserved so the
    header does not jump when lookups resolve. The pill gained a second line summarising the
    effective filters ("Jobs · South Africa · Remote +1 · +3": type · where · engagement each as
    "first +N", then a count of the other facets in play).
  - **Recent searches 5 → 3**, per device, newest first, across every home (Search segment
    popover, filters dialog, mobile sheet — one component). Removing one promotes the next stored
    entry (the panel re-reads the store), "Clear recent" empties it; relative time and removable
    rows kept. Entries stored under the old cap collapse to three on read.
  - **Wizard.** Step 1: the info box under the goal cards is gone (it was design rationale);
    "Start a business" loses COMING SOON and is **mapped to a Category** — "Business, Finance &
    Marketing", resolved by name at runtime against the lookup (accepting "Business and
    Entrepreneurship" pre-migration), never a hard-coded id. Its inherited chip therefore takes
    the facet's group ("Categories: …" rather than "Type: …"), and every provenance-aware control
    now asks `owningPreference()` which preference supplies a value instead of assuming Interests
    owns categories and Goal owns types. "Attend events" → Type Event kept, still awaiting BA
    confirmation. Step 4: **engagement preference is a list** (`UserPreferences.engagement:
    string[]`; the façade normalises a stored single id to a one-element list; merge unions;
    skip-to-save clears to `[]`). Time commitment carries "Awaiting BA sign-off". Step 6: the
    sentence saying the accessibility toggle hides opportunities without accommodation data is
    removed — the mapping must not exclude Not specified (correction under the Plan's
    "two deliberate inconsistencies"). Identity captions read Birth date → age range (applied
    silently), Gender → ranking only (privacy sign-off pending), Education → no filter.
  - **Type row order is fixed by enum NAME** — Job · Learning · Task · Event · Other, unknown
    types after, in `lib/typeOrder.ts`, applied at the lookup so every type list agrees. Labels
    keep coming from `displayName`; "Task" → "Impact task" is reference data and is **README ask
    #7**, not a web display map. Multi-select and per-type sections unchanged.
  - **One engagement display map** — Online → Remote, Offline → On-site, Hybrid → Hybrid — in
    `lib/engagementLabels.ts`, used by cards, applied chips, the Engagement section, the bar
    segment and wizard step 4. **Temporary**: it becomes identity when the API renames the
    values with IDs preserved (README ask #8) and is then deleted.
  - **Sections (BA alignment).** Where reserves Province / Region and City as disabled free-text
    "contains" inputs and Distance as a disabled input, declared in the registry (`reserved`),
    until the Location API and the User Location decision land. Provider is a **typeahead** —
    nothing listed until you type, then up to eight names matching anywhere, chosen ones as
    removable chips (a new `typeahead` control kind; the org list is hundreds long). Skills
    carries the caption "For jobs this matches required skills; for everything else, the skills
    you will earn" (a new `hint` field rendered as the header subtitle). Paid and rewards is a
    composite `rewards` control: the Paid half inert until Is Paid / Reward Type exist, the ZLTO
    half live — and **hidden while Type includes Job** with the line "Jobs do not carry ZLTO."
    (Jason: hide, not grey; keyed to the core Type enum via `OPPORTUNITY_TYPE_NANE_JOB`, not to a
    custom field; an already-set ZLTO filter stays removable in the chips row). Categories,
    wizard Interests and the tiles read the category lookup and take 16 values without code —
    "Show all N" is data-driven. Null-rule copy is one line per section (see the Plan
    correction), and a section with no API facet yet still states its rule.
  - **Card status rule** (`lib/cardStatus.ts`, shared by grid card and compact row). Trace: the
    search's Active published state checks status and start date but not end date, so items
    past their end date keep returning until the expiry job runs; on seeded fixtures every item
    shares one fixed end date (local 2026-09-21, DEV 2026-09-23) and `participantCountTotal` is
    0 — hence "Closed" beside "N of N places left" on every card. The web side was right to say
    Closed and wrong to show places next to it; the data side is a stale fixture. Rule: status
    not Active OR end date passed → "Closed", places hidden; participant limit reached → "No
    places left"; otherwise the closing label and "X of Y places left". README ask #12 covers the
    API side (exclude past end dates from Active, or seed rolling dates).
  - **Housekeeping.** The `prefs: mock` dev pill's gate is confirmed:
    `USER_PREFERENCES_MOCK_ENABLED` = flag AND (local environment OR `dev.yoma.world` hostname),
    so stage and production never mount it; **the DEV allowance stays** (Jason, 2026-09-23 —
    "leave the mocked stuff for now"). The badge `availability` intent (SOON) and the
    "Show all N" on the badge row were removed as dead; the `comingSoon` card pattern in the
    wizard registry is kept (documented, currently unused). Mocks themselves untouched; the
    2026-08-27-c removal list stands.
  - **Applied chips stay one per value** ("Engagement: Remote", "Engagement: Hybrid") rather than
    the canvas's single "Engagement: Remote, Hybrid" — per-value removal needs per-value chips;
    the group label changed Format → Engagement.
  - **Not built, by decision or dependency:** per-badge counts (above); the "Pay not specified"
    results divider (needs Is Paid and a public sort); the wizard sidebar's "2 ways to take part"
    summary (the live-count panel has no per-step summary today); the "my country only" switch.

- 2026-09-28 (User Location — analysed, agreed with Jason and built the same day, against a mock
  because the API is still in development; handoff
  [`handoffs/2026-09-28-a.md`](./handoffs/2026-09-28-a.md)):
  - **Country is the global profile `countryId`**, edited only in `UserProfileForm` — other
    features read it too, so the wizard shows it read-only with a link to the profile. **Region,
    city and coordinates are a user-location preference** set in the wizard and saved through a
    separate PATCH (API in development) that the profile response will return. For an
    **anonymous** youth there is no profile, so the wizard offers a country picker and the whole
    location lives in the session with their other answers.
  - **Web model:** `location: UserLocation` on `UserPreferences` (`countryId` + `region` / `city`
    / `coordinates` / `source` / `placeId`), so the wizard draft, normaliser, merge and session
    store carry it with no new plumbing; the façade owns the split to the location PATCH. The
    stored `countryId` records the country the place was picked in: when the profile country
    changes, the place is **stale** — never applied, and the wizard asks for it again.
  - **Capture: Google Places (New) autocomplete + the Maps JS Geocoder**, already integrated (no
    new dependency). Places are searched within ONE country, in English. Verified 2026-09-28: the
    suggestion list echoes the language typed ("Kaapstad"), the resolved place is English
    ("Cape Town", "Western Cape") — only the resolved place is stored. Picking a city fills its
    region; picking another region clears the city. **Free text is the fallback** (Maps
    unavailable, or no match and the youth presses Enter): stored as typed, trimmed, no
    coordinates, hinted "use the English name". Reverse geocoding must go through Maps JS — the
    Geocoding REST endpoint refuses referrer-restricted browser keys.
  - **Coordinates are the city's centroid, never the device fix**, with the always-visible line
    "Location may not be accurate — we use your nearest place or city, never your exact
    position." URLs round them to 2 decimals (`pt=`), because Copy link shares the URL.
  - **"Use my location" in another country is not applied.** Anonymous wizard: "Switch to
    Kenya"; filters: "Search in Kenya instead" (one `patchFilters` that also skips the inherited
    country — `skip` on the action, so the two cannot race); signed in: a link to change the
    profile country.
  - **Inheritance.** One `location` preference (chip "Where: Durban, KwaZulu-Natal"), skippable
    and savable (skip-to-save clears the place, keeps the country). It applies **only while the
    search is for exactly the youth's country and names no place of its own**
    (`locationFragmentState`); otherwise its chip takes a fourth class, `inheritedInapplicable`
    — ghosted, no undo, the note says why ("Not applied — this search is for Kenya" / "pick one
    country" / "uses the place you picked here"). Agreed: a country override switches the
    inherited place off for that search. **Distance is never inherited** — a standing radius
    would quietly hide most of the feed.
  - **Filters.** `region`, `city`, `point` (centroid) and `radiusKm` on `DiscoveryFilters`; URL
    `region=`, `city=`, `pt=`, `km=`. Region / city need exactly one effective country
    (Worldwide does not count); distance needs a point — a city picked from the list or the
    inherited one. Radius options 10 / 25 / 50 / 100 km, default 25. A global reducer rule
    (`clearOrphanedPlace`, like the clause rule) clears the search's own place whenever the
    country may have changed; removing the city chip drops its centroid.
  - **Null rule (Jason): opportunities that name no region or city are INCLUDED** — the section's
    line says so.
  - **Mocked search, stated in the product.** `LOCATION_SEARCH_LIVE = false` in `lib/location.ts`:
    the request builder sends no region / city / distance, location chips are drawn dashed with
    "not applied to results yet", the results heading does not count them, and the Where section
    and results carry "Region, city and distance aren't applied to results yet — location search
    is still being built." No client-side filtering over server paging.
  - **Where summary is one function** (`whereSummary`) for the bar segment, the mobile pill and
    the section header: "25 km of Cape Town" → "Cape Town" → "Western Cape" → "South Africa +1".
  - **Wizard placement: step 5, above Languages**, no new step (Jason: keep the steps to a
    minimum). First built under Engagement in step 4; Jason moved it to step 5 in review the
    same day, and the step reads "Where are you, and what languages work for you?". The Country
    row left the read-only identity block.
  - **A selected option is never hidden behind "Show all N"** (found in review the same day, via
    the Where segment). The country list shows its first eight; a country picked through the
    search box and then un-searched vanished from view while it still filtered — the chips read
    one country, the segment "Kenya +1", and the Where section "one country at a time", with no
    visible way to deselect it. `ChipSet` (`FilterControl.tsx`) now keeps every selected option
    visible, in lookup order (nothing jumps under the cursor). Shared by every chip section, so
    Categories and the other lookups get the same guarantee. Region / city / distance render
    only for exactly one real country; otherwise one line says what unlocks them (none / several
    / Worldwide).
  - **Badges.** `Jobs near me` **shipped** (Type Job + 25 km around the effective point; absent
    without one). `Jobs in my country` now renders for an anonymous youth who gave a country —
    it was signed-in-only only because anonymous youth had no country.
  - **Sign-in "keep your answers": the profile country wins.** The anonymous place carries over
    only if it was picked in the profile's country; otherwise the offer says it will not be kept.
  - **`LocationInput` is a shared app component** (`src/components/Location/`), not a discovery
    one, so the admin opportunity form can adopt it — the follow-up in Tasks. The admin side is
    the weakest link in matching: opportunity region / city are admin free text today.

- 2026-09-29 (API integration — Adrian's five commits `263cc82e` … `adb9a305`; analysed, agreed
  with Jason and built the same day; handoff
  [`../handoffs/2026-09-29-a.md`](../handoffs/2026-09-29-a.md)):
  - **Everything mocked is now live**: preferences, the user place, location search, and the
    Paid / Accessibility / SDGs / Provider facets. `CUSTOM_FIELDS_ENABLED` is `true` for the whole
    branch (Jason) — with it `false` the API's required Difficulty field makes every admin save
    fail — so `/opportunities/discover` is reachable again on this branch.
  - **Inherited from the youth (visible, skippable chips)**: goal, interests, country, place,
    time, engagement, **incentive** (new) and **age** (new — whole years from the profile's date
    of birth; the API keeps opportunities with no age bounds, and refuses an out-of-range
    SUBMISSION, so showing those would only lead to a dead end). Age is per-search only.
  - **Accessibility requirements are saved but NOT inherited.** The API's `accommodations`
    filter needs ALL picked and leaves out every opportunity that has not described its
    accommodations — inheriting it would hide nearly the whole feed and break the BA's "stays in
    results for now" (2026-09-22). The Accessibility SECTION is live for a youth who asks for it,
    and its line says it leaves those out. Filed as ask 18.
  - **Paid and rewards**: the Paid half is `incentivized` (Paid or rewarded / Unpaid; unspecified
    opportunities stay in). "Sorted last" is not claimed — there is still no public sort.
  - **Provider is the new free-text field** ("contains"; null provider stays in), replacing the
    organisation typeahead, which filtered a different thing. URL `provider=` replaces `org=`.
  - **SDGs and Accommodations list only values published opportunities use**, so on today's data
    both are empty; a section with a loaded-but-empty list says "No opportunities list any of
    these yet" (a new `loading` facet status keeps that from flashing while it loads).
  - **Quick searches**: `Paid & remote` shipped. `No experience needed` stays parked (its key is
    not system-controlled), `With accommodations` and `Climate action + SDG 13` stay parked
    (their filters keep unspecified opportunities, so they would not narrow).
  - **URL**: `paid=`, `acc=`, `sdg=`, `provider=` added; `org=` retired. Age has no param.
  - **Wording**: the wizard panel now says only the picked place is added to the profile.

- 2026-09-30 (local browser pass — [`../handoffs/2026-09-30-a.md`](../handoffs/2026-09-30-a.md)):
  - **The API takes priority for now on asks 17–22** (Jason). Web keeps what it built against
    today's contract and does not wait on the answers.
  - **YOM-1258 is superseded by this ticket** (PM): preferences stay composed into search
    filters on the web; the API executes the search.
  - **Salary feeds the card's pay line** from the Job custom fields, keyed only on the protected
    keys and pay-interval option keys (the rules module's principle). "Paid — amount not
    disclosed" was false for a Job that disclosed one.
  - **Deadlines are labelled in UTC.** The API stores the end of that calendar day in UTC, so a
    local-time label read "Apply by 01 Jan" for a 31 Dec deadline in Johannesburg. The day count
    stays on absolute time.
  - **The banner no longer promises "never touches your profile"** — signed in, a place picked
    in the wizard is written to the profile. It now says only that the YoID is never touched.

- 2026-09-30 (round-7 visual pass, claude.design brief — [`../handoffs/2026-09-30-b.md`](../handoffs/2026-09-30-b.md)):
  - **Category pills in the purple header supersede the 2026-09-05 "shared square card"** (Jason):
    first 10, then "See more". The banner and Current filters row are the surface's — one instance
    for landing and results (the zero-results inline chips stay, per 2026-09-05).
  - **Colour rule: green = filters, purple = preferences** — segment values, chips, category
    pills, the Filters button.
  - **Cards restore the summary** (dropped 2026-08-31) and gain one band badge (`cardStatus`:
    Ending soon / Featured), up to two per-type facts (`lib/cardFacts.ts`, protected keys only —
    Job qualification is left out) and the type button (existing CTA copy, drawn inside the card
    link, never an inline action).
  - **Detail page: experimental routes, existing pages untouched** (Jason). Discovery links to
    `/opportunities/{id}/experimental`; the admin twin is `…/info/experimental`; the editor's
    Preview renders the public component in the experimental layout. Same sections and
    conditions, regrouped into Overview · Requirements · Who it's for · Impact · Provider ·
    Details.
  - **Welcome step 0** until the wizard is completed once; no counts on type tiles (no per-type
    count endpoint, no fan-out).
- 2026-10-01 (Jason's review of round 7): **preference chips live in the purple banner; this
  search's chips in a green twin panel** (no "Current filters" label), each scrolling sideways on
  mobile. **Zero results is a friendly card with large CTAs, no repeated chips** — supersedes the
  2026-09-05 inline chips. Categories show 6 + See more / See less. Detail: "Overview" → "About";
  the admin page gets a Rewards tab and the Manage opportunity menu in a full sticky panel on
  mobile too.
- 2026-10-01 (Jason): **the tabbed detail layout replaces the experimental routes.** It is the real
  `/opportunities/{id}` and `…/info` page, and the editor Preview, whenever the release
  kill-switch `CUSTOM_FIELDS_ENABLED` is on; off, the classic layout returns. Discovery links to
  `/opportunities/{id}` again. Supersedes 2026-09-30's "separate experimental routes, existing
  pages untouched".
- 2026-10-01 (Jason): **Copy link and Sort are hidden** from the results header (commented out,
  not deleted) — space, and sorting waits for the API (Newest is the only order today). The
  mobile list's "compact list" explainer is gone; preference chips drop the person icon (the
  purple banner carries that meaning).
- 2026-10-01 (Jason, Entrepreneurship type — [`../handoffs/2026-10-01-b.md`](../handoffs/2026-10-01-b.md)):
  - **"Start a business" maps to the Entrepreneurship type, not the Category "Business, Finance &
    Marketing".** This supersedes 2026-09-22's mapping and departs from the BA sheet, which
    predates the type; it is pending BA confirmation. The goal chip now reads "Type: …". The
    by-name category path (and `categories` in `PreferenceProfileContext`) is removed, because no
    goal maps to a category any more.
  - **Theme: blue-dark**, the colour discovery had left unused: chip and button `bg-blue-dark`,
    band `bg-blue-light`, outline `border-blue-dark`. The same blue-dark goes in `TYPE_CONFIG`
    for the detail headers, where Event is already the lighter `bg-blue` (that palette predates
    discovery's). Copy is "View programme →" / "Go to programme"; the welcome tile and goal card
    use `IoRocketOutline`.
  - **Card facts: programme · effort.** The programme is the option name, or the Other
    description when Other is picked. The venture stage targeted is not a system-controlled key,
    so it stays off the card (the same reason as Job qualification).
  - **The list's type column is `w-32`** (was `w-24`): "ENTREPRENEURSHIP" measures 123px. At
    768px the title column narrows from about 136px to 104px; nothing overflows.
- 2026-10-01 (Jason): **`/opportunities/discover` is the default search page while the kill-switch
  is on.** The navbar's Opportunities link uses `OPPORTUNITIES_SEARCH_URL` (`lib/constants.ts`):
  discover when `CUSTOM_FIELDS_ENABLED` is on, `/opportunities` when it is off. Only the navbar
  changed. The other entry points still open the legacy page:
  - the home and YoID search boxes (`?query=` builders);
  - the About category links, the World Cleanup Day banner and payout copy;
  - the referral pages;
  - the detail page's back link.

  Moving them means mapping legacy query params onto the discovery codec.
- 2026-10-01 (Jason): **The cards are not clickable; only their button is.** On the grid card and
  the list row, the type button is now the one `<Link>` to the detail page, and the body is a
  plain `div` with no hover lift. This is how the legacy `OpportunityPublicSmall` cards already
  work, and it supersedes 2026-09-30's "type button drawn inside the card link". The mobile list
  row had no button, so it gains a 40px round outline arrow in the type's colour, labelled with
  the type's `ctaTitle`.
- 2026-10-02 (Jason — [`handoffs/2026-10-02-a.md`](handoffs/2026-10-02-a.md)):
  - **The welcome step's right column drops the category pills.** Expanding them scrolled the
    whole dialog. They stay in the discovery header. The rest of the welcome step is left for the
    claude.design review.
  - **"New this week" → "See all" opens `?prefsOff=1`.** The rail searches with empty filters and
    ignores preferences, so its full set is every opportunity with preferences off. The default
    order is newest by start date, so no sort parameter is needed. The empty query string it had
    linked to the landing page itself.
  - **`FreeTextSearchInput` follows `q` when it changes from outside** (recent-search replay, a
    quick search, removing the chip). It used to keep its stale draft and commit it over the
    replayed query on the next blur.
- 2026-10-02 (claude.design round 10, Jason's answers to the checked task list —
  [`design/2026-10-02-tasks.md`](design/2026-10-02-tasks.md), handoff
  [`handoffs/2026-10-02-b.md`](handoffs/2026-10-02-b.md)):
  - **Landing rails: at most four** (Jason's cap). Picked for you (only while an inherited chip
    exists) · Featured · Newest on Yoma · Done in under an hour — three signed out, four with
    preferences, one search each. Every rail but Picked for you ignores preferences, so its
    See all carries `prefsOff=1`. Not built: lazy loading (pointless at ≤ 4), card skeletons
    (2026-09-05, one loading treatment), the brief's rail swap when preferences go off (the
    landing only renders in the default state, so it cannot happen) and "Most completed" (the
    API re-orders by completions — a sort, against 2026-08-27's Newest-only).
  - **A `featured` facet** so the Featured rail's See all reproduces its set: `featured: boolean
    | null` on `DiscoveryFilters`, URL `featured=1` only (the API filters only on `Featured ==
    true`, so a `0` would filter nothing), passed through to the search and the count, a manual
    chip "Picks: Featured". No filter-panel section and no preference inherits it, so breakpoint
    parity is unaffected. `hasActiveFilters` now compares key by key, so the parser's key order no
    longer matters.
  - **Kept against the brief:** "FROM THIS TYPE" (2026-08-27 — it is the last mark of a
    conditional section); full type names at 390, no "Impact" / "Business" map (2026-09-22);
    the Reward stays in the fact strip at 390; open long lists never span both columns (a card
    must not jump under the cursor). OPT-IN goes.
  - **"Show all {N}" / "Show fewer"** on the category toggle, superseding 2026-10-01's
    "See more / See less" (copy only; the six-first rule stands).
  - **Detail page (tabbed only; classic untouched, confirmed with a one-time local kill-switch
    flip):** Effort shows the interval ("4 minutes") instead of rounded-up hours; "Earn {n} ZLTO";
    the spots-left caption stays under the strip; Nunito, not the unloaded Nunito Sans. A section
    body mounts on first open and stays mounted — mounting it on load fired the Additional
    details lookups (skills, 500; education) for every visitor. **A group that renders one card
    lets it span both columns** (the brief said "odd card fills the left cell"; decided by which
    sections render, never by open state, so nothing jumps) — the Provider card included.
    Flagged to Jason to veto.
  - **Admin header:** the public header (chips, logo, fact strip) with the status chips on the
    chip row and a stat strip from the existing strings in place of the youth actions; the views
    / participants line stays; Rewards is a gold-tinted tab with a dark label (AA).
  - **No matches has three states** — a word only (Clear search), filters (Clear filters),
    preferences narrowing (Search without my preferences, then whichever clear applies). The
    clear button appears only when it has something to clear (2026-09-05). A facet that cannot
    filter yet (Skills) is a disabled "Coming soon" row, plain text, never a pill (2026-09-22).
  - **Recent searches** are labelled from the chips that actually filter, "All opportunities"
    when there are none (the `?prefsOff=1` See all used to store an empty label).
  - **Welcome step:** 1072 × 600 at `lg`, one column below `lg`; tiles in discovery's
    `typeBadge.ts` colours (Event orange, as on the cards behind it); quick searches in a
    2-column grid at every width, an odd last pill spanning. Motion is one-shot except the orbs'
    drift, and all of it is off under `motion-reduce`.
- 2026-10-02 (Jason's follow-ups to round 10; spec
  [`design/2026-10-02-followups.md`](design/2026-10-02-followups.md), every recommendation in it
  approved — supersedes the welcome's fixed 1072 × 600 in the entry above):
  - **The welcome takes its content's height** from `md` up, capped at the viewport less 64px.
    The fixed 600px left 75–85px empty bands, and between 768 and 1023px wide the one-column
    layout scrolled about 170px. Two height tiers from `lg` (≤ 680px, ≤ 600px) tighten the
    padding, the gaps, the count and the tiles; each property is set by one tier only, because
    the ranges overlap. Result: no inner scroll on desktop down to a 560px-tall window. Mobile
    is unchanged (it fits 390 × 844; shorter screens scroll with the buttons pinned).
  - **Get started morphs into step 1.** One mounted frame: the welcome fades out over 100ms,
    then the box eases to the wizard's 896 × 736 and from purple to white over 300ms, and
    step 1 rises in. The developer holds the measured height through the fade instead of
    animating from `auto`, which snapped; this works in every browser, not only Chromium.
    Focus moves to step 1's heading. Reduced motion: final size at once, one 150ms fade.
  - **Focus starts on Get started when the welcome opens** — keyboard users used to start in
    the page behind the (non-modal) dialog. The ring shows only after keyboard use, and a focused
    text field is never robbed of focus.
  - **Open chip sections carry a one-line note** in the preview's slot (13px `text-gray-dark`, no
    icon), tabbed layout only: Incentive, Skills required / Skills you will learn, Languages,
    Accessibility (when it shows chips), Targeted groups, Countries, Global goals (SDGs), Topics.
    The strings are in the spec's F3 table. Time needed, Age range, Additional details and
    Provider get none — they show no chips.
  - **Jason's "welcome not showing": no regression found, his case not yet explained.** In a fresh
    profile it opens on every path tried: hard load, navbar navigation, reduced motion, a
    background tab, a query string. It auto-opens only while the device has no
    `yoma.discovery.personalizationSeen` flag (2026-09-05) and no preferences. Anonymous answers
    in `sessionStorage` count, and finishing the wizard stores them even when every step is
    skipped. Clearing the flag alone did not bring it back for Jason, and his storage state is
    still awaited.
- 2026-10-02 (Jason): **the lone-card span is vetoed.** Detail section cards flow into the two
  columns from `lg`, and an odd card fills the row's left cell, even when it is a group's only card
  and including the Provider card, as the brief has it. This supersedes the "a group that renders
  one card lets it span both columns" bullet in the round-10 entry above. The description and the
  admin Rewards block still span the full width.
- 2026-10-02 (Jason): **the missing welcome is solved on Jason's side**, with no code change. It
  closes the open item in the follow-ups entry above.
- 2026-10-02 (Jason: "do what you think is best"): **every tab bar keeps its active pill in
  view.** `DetailTabs` scrolls only the bar's own sideways scroll (`nav.scrollTo`, smooth unless
  reduced motion), never `scrollIntoView`, which also moves the page and interrupts `goTo`. The
  failing case was the 390 sticky / pinned bar after a tap on Details or Rewards. It predates
  round 10 on the public page.
- 2026-10-03 (the revised search contract: Adrian's `77646a74`, merged locally as `c2ca0eb9`;
  the contract is [`../handoffs/2026-10-01-c.md`](../handoffs/2026-10-01-c.md)). Jason took the
  first four in his 2026-10-01 review of the proposal and the rest on 2026-10-03. The API applies
  no preferences; web sends only the effective criteria.
  - **"Start a business" is the Entrepreneurship type OR the Business, Finance & Marketing
    category**, sent as one OR group so related Learning stays in. Both IDs come from the
    lookups, and the API hard-codes no goal. Skipping the goal removes the whole group. This
    supersedes 2026-10-01's type-only mapping; BA confirmation is still pending.
  - **A type-specific custom-field clause narrows only its own type.** A Job clause no longer
    removes every Event from a Job + Event search: the API scopes clauses by the definition's
    `entityContext`. Web still clears a type's clauses when the type is deselected.
  - **Inherited engagement keeps opportunities that don't say; a manual pick is strict.** The
    Jobberman and JobJack clients never set an engagement type, so a strict inherited filter
    would hide every partner job.
  - **The inherited home country also sends a plain Worldwide entry**, as the legacy page does.
    Alison lists every course as Worldwide, so discovery was hiding them. The region / city place
    attaches to the home-country entry, never to Worldwide.
  - **No Worldwide while a radius is on** (2026-10-03). Distance and "Jobs near me" are a
    deliberate "near me". Country-only and region / city searches keep Worldwide.
  - **Manual types fold into the goal's type branch** (2026-10-03):
    `anyOf: [{ types: manual ∪ [Entrepreneurship] }, { categories: [Business…] }]`, with no
    root `types`. A root `types` AND the group would turn "Event + Start a business" into
    "Events in the Business category". With the goal skipped, or another goal, manual types stay
    a root `types`.
  - **Saved skills narrow Jobs only, and inclusively** (2026-10-03). One group:
    `anyOf: [{ types: [every non-Job type] }, { types: [Job], skills: { value, unspecified: "Include" } }]`,
    where the skills are self-attested plus verified. The Jobberman and JobJack clients set no
    skills, so a strict branch would hide every partner job. A manual skills pick, if a section
    is ever exposed, is strict.
  - **Accessibility requirements are now inherited, inclusively.** This supersedes 2026-09-29's
    "saved but not inherited" (ask 18, answered by the contract). Opportunities that haven't said
    stay in; an explicit No, or a list missing a need, never does. A manual pick is strict.
  - **Modes are fixed by provenance** (2026-10-03). Inherited engagement and accommodations use
    `Include`, inherited skills `Include` on the Job branch, and manual picks of all three
    `Exclude`. Every other criterion keeps the API default. There is no per-section "Include
    not specified" switch, so no UI sends `Only`; the switch is a follow-up in Tasks. Each
    section states its rule in its copy.
  - **Union, and the manual mode wins.** Inherited and manual values on one multi-select
    criterion are unioned, under the manual mode if there is a manual pick, else the inherited
    one. Scalars and a manual place replace the inherited value. To replace an inherited
    multi-select, skip its preference.
  - **The engagement preference is multi-select again**: the API stores a list
    (`engagementTypes`). This reverses 2026-09-29's single-select.
- 2026-10-03 (the build, W1–W3; handoff [`handoffs/2026-10-03-a.md`](handoffs/2026-10-03-a.md)).
  Jason took the product calls as the roles raised them; the rest are the lead's.
  - **One converter for every search.** `toSearchFilterPayload(input, endpoint)`
    (`api/services/opportunitySearchPayload.ts`, a pure module) wraps a legacy or admin flat
    filter with no mode, so those pages get the API defaults. It passes discovery's typed request
    through untouched. It strips the other endpoint's root controls, because the API now rejects
    unknown members, and drops empties. The admin status tabs count with `totalCountOnly`.
  - **Unit tests run on Node 24's built-in `node:test`** (`pnpm test`; a resolve hook in
    `src/web/test/`), with no new dependency. This settles 2026-08-27's "no test runner" for pure
    modules; the breakpoint-parity test is still unwritten.
  - **Worldwide and the Business category are request-only** (Jason, on the W3 spec). The
    controls never show either as selected. Skipping the goal goes through its chip or
    Entrepreneurship, not the category.
  - **The saved skills group stays alongside the "Start a business" group** (`jobSkillsApply`).
    Business-category Jobs come in through the category branch, and the skills group narrows
    them. The skills chip ghosts only when that rule says it filters nothing.
  - **A manual value that duplicates a surviving inherited one keeps the inherited mode** (Jason).
    It is shown as inherited, and "Picked for you" → See all must count what its rail counts. The
    reviewer argued it makes the Remote badge lenient while Remote is inherited; Jason kept it.
  - **"Other" is left out of inherited accommodations** (Jason). Without its private description
    it can't match the need, and under the every-need rule it would drop every opportunity that
    doesn't list Other.
  - **"Make this my default" on skipped skills clears the skills the youth added** (Jason).
    While earned (verified) skills remain, the skip stays in the URL for this search, like
    country and age; they apply again on the next visit. The offer says "Skills you've earned
    still apply."
  - **Inherited needs never reach the URL.** "Picked for you" → See all leaves them out (they
    still apply at the destination, so the counts match). See all isn't drawn when its query
    would be empty, which would otherwise link to the landing itself.
  - **Readiness.** A search with preferences on waits for the preference layer: the preferences,
    the verified skills, and the accessibility list only when needs are inherited. So its first
    request is never sent and then replaced. Searches with preferences off, and the rails that
    ignore preferences, wait only for the lookups. Every lookup counts as settled after its first
    failure, so a failing list degrades the request at once.
  - **The wizard opens only once the preferences have loaded** (Jason). `?personalize=1` used to
    open it on an empty draft, and Finish would then PATCH a complete replacement over the saved
    preferences.
  - **The count body is the results body minus paging and `ordering`**, plus `totalCountOnly`.
    Changing the sort doesn't refetch an identical count.
- 2026-10-03 (W3, the visible changes; Jason approved the spec
  [`design/2026-10-03-search-contract.md`](design/2026-10-03-search-contract.md) with every
  recommendation, and the [compare](design/2026-10-03-search-contract-compare.md) matched):
  - **Sort is back** (reverses 2026-10-01's "Sort is hidden"; Copy link stays hidden).
    - It is a segmented control like the view toggle: inline from `lg`, its own full-width row
      below.
    - Newest · Ending soonest · Most ZLTO, all live. The 2026-09-05 "More sorts soon" pill is
      gone.
    - Most ZLTO is hidden on a Jobs-only search unless it is already selected; then a note
      says Jobs are shown newest first.
    - A sort change never scrolls.
  - **The engagement step is multi-select**, and signing in with "Keep my answers" unions
    engagement like the other lists.
  - **The section rule lines state the new behaviour**, one line each, including both modes for
    Engagement and Accessibility. Language now says opportunities with no language are left out
    (partner data has some). Jason shortened the Accessibility line after the build so it fits
    3 lines at 390.
  - **Inherited accessibility needs are private.**
    - The chip reads "Accessibility: your needs", and nothing else ever names or counts them: not
      the tuned-to line, the rail subtitle, the results heading or the recent searches.
    - The Accessibility section stays collapsed as "Your needs" while the needs are only
      inherited. Opened, it lists every inherited need, including ones no opportunity lists.
    - A need picked by hand stays named (Jason): it is this search's own pick.
  - **"Start a business" shows as "Goal: Starting a business"**, plus one line under the type
    pills naming the Business category it also brings in. Other goals keep "Type: …".
  - **The skills chip** reads "{n} job skill(s)". It ghosts as "Not applied — this search has no
    jobs" only when `jobSkillsApply` says the group filters nothing.
  - **An "Incentive not specified" divider** sits before the first unspecified result while a
    Paid filter is in effect. This builds the divider 2026-09-22 parked. It splits on the Paid
    filter the page was fetched with, so it never marks old results.
  - **Accessibility on cards and details never claims the provider meets a need.**
    - Cards and details read "On request: …" for an on-request list.
    - The tabbed detail page always has an Accessibility entry: a static row for Not specified,
      Available on request or No, the way Age range is shown.
    - The classic layout is untouched.
  - **The Job completion review has no timing rows** for Jobs (Started on, Finished on, Time to
    complete). For a Job they were derived or automatic; it reads "Jobs record a placement, not
    time spent." instead.
  - **The import help** says rows, column order, case-sensitive `CF:` headers and the Automatic
    verification requirement.

## BA sign-off summary (2026-09-22)

Copied from the BA Considerations workbook (sheets All Opportunities, Jobs, Impact Action & Event,
User; September 2026), restricted to what changes THIS surface. Status: **existing** = core field
already on `OpportunityInfo` / the search filter · **renamed** = same field, new values or label ·
**new** = does not exist on the API yet. Where a null rule differs from what the search does
today, the section copy states today's behaviour (see the Plan correction).

**Core (all types)**

| Field | Status | Values | Null rule | Where it shows here |
| --- | --- | --- | --- | --- |
| Type (`TypeId`) | renamed | Job · Learning · **Impact Task** (was Task) · Event · Other; IDs kept, CSV accepts both | n/a (required) | type row, badges, chips — `displayName` verbatim, README ask #7 |
| Categories | renamed (taxonomy) | the approved 16 (YOM-1259); Other kept | n/a (required) | tiles, Categories section, wizard Interests, Climate action badge, Start a business goal |
| Location (was Countries) | renamed / expanding | Country → Province/Region → City (+ optional coordinates); Province and City free text, case-insensitive "contains" | n/a (required); **no region / city → included** (Jason, 2026-09-28) | Where: country live; region / city / distance live controls, not sent yet (mocked search) |
| Languages | existing | ISO lookup; required, ≥1 | **no null case** — every opportunity lists one | Language section |
| Skills | existing | EMSI lookup; for Jobs = required skills, elsewhere = skills earned | not specified stays | Skills (inert — no search facet), card chips |
| Commitment interval + count | existing | Minute · Hour · Day · Week · Month; required non-Job, optional Job | **stays in results** (BA) — API still excludes | How long, Under an hour badge |
| Engagement Type | renamed | **Remote** (was Online) · **On-site** (was Offline) · Hybrid; optional; IDs kept | **hidden while a value is selected** (BA) — API still includes | Engagement segment / section, Remote badge, cards, chips, wizard step 4 |
| Reward Type | new, required | None · ZLTO · Partner Incentive; **Job: None or Partner Incentive only** | defaults to None on migration | Paid and rewards — ZLTO hidden while Type includes Job |
| Partner Incentive Amount + Currency | new | positive decimal + ISO 4217 code; informational, Yoma processes nothing | not specified stays | card money badge (partner-paid line) — typed, not yet fed |
| ZLTO Reward | existing | > 0, ≤ 2000, whole; non-Job only once Reward Type lands | n/a | Paid and rewards, card / row reward slot |
| Is Paid | new, nullable boolean | Yes · No; explicit, not derived | **stays in results, sorted last** | Paid half of Paid and rewards (inert), parked "Paid & remote" badge |
| Accessibility Support + Available Accommodations (+ Other description) | new | Yes · No · Available on request; 16-value multi-select | **stays in results for now**; matching rule "supports all selected" | Accessibility section (inert), wizard step 6 toggle, parked "With accommodations" badge |
| Minimum / Maximum Age | new, optional | open-ended range | both null = no restriction; youth without DoB not blocked | inherited-not-removable age chip (designed; no facet yet) |
| Targeted Groups | new, informational | Open to All · Youth with Disabilities · Women/Girls · Men/Boys · Rural · Urban · Refugee/Displaced · Second-Chance Learners | never restricts eligibility | **not on the youth surface** ("Who it is for" removed) |
| SDGs | new, optional multi-select | the 17 goals, all types incl. Jobs | not specified stays | SDGs section (inert), parked "Climate action + SDG 13" badge |
| Provider | new, optional free text | e.g. KFC, University of Pretoria; informational | null = not specified; "contains" filter | Provider typeahead (today over the Organisation lookup — the new field is not on the API) |
| Application deadline (Jobs) | existing (`DateEnd` reused) | required for manually created Jobs | — | card due date / Closed |

**Type-specific (custom/metadata fields — rendered from the definitions endpoint, never keyed in
web)**

| Type | Field | Status | Values / rule on screen |
| --- | --- | --- | --- |
| Job | Salary Disclosed | new, required | Yes · No — **No disables Salary range, Currency, Pay interval** |
| Job | Salary range (Minimum / Maximum) + Currency | new | ISO 4217; either bound optional; Currency + Pay interval required when a value is supplied |
| Job | Pay Interval | new, conditionally required | Per Year · Per Month · Per Hour · **Per Engagement (Once-Off)** (replaces Per Gig / Per Task) |
| Job | Employment Type | new, required multi-select | Permanent · Fixed-Term · Internship · Apprenticeship · Freelance/Consultancy · Temporary/Seasonal — **Permanent and Fixed-Term cannot be combined** |
| Job | Work Schedule | new, required | Full-Time · Part-Time |
| Job | Employment Duration | new, conditional | number + Months / Years; **Permanent** as an option |
| Job | Minimum Qualification | new, required | expanded Education lookup (Primary … PhD, No Formal Education, Other) — **GUIDE ONLY**, a weight never a gate |
| Job | Experience Level | new, required | None (No Previous Experience Required) · Entry / Junior (1–3) · Mid (4–6) · Senior (7+) — filterable metadata, not a gate |
| Job | Preferred Skills | new, optional | EMSI; informational "bonus skills" |
| Job | Industry | new, required | UN ISIC section level |
| Job | Job Category | new, required | ISCO-08 two-digit sub-major group |
| Impact Task | Difficulty | moved from core to CF | Entry Level · Experience Needed · Skills Required |
| Impact Task | Tools Required | new, optional multi-select | controlled list + Other with description |
| Impact Action | Verified Activity Type | new, optional | controlled generic list (phase one by script) |
| Event | Difficulty | moved from core to CF | Open to All · Familiarity Needed · Experienced Individuals |
| Learning / Other | Difficulty | moved from core to CF | Beginner · Intermediate · Advanced · Any Level |

**User preset (User sheet) — what the wizard captures**

| Preset field | Status | Mapping | Null rule |
| --- | --- | --- | --- |
| User Goal | new, single-select | Get a Job → Type Job · Learn New Skills → Learning · Volunteer / Make an Impact → Impact Task · **Start a Business → Category "Business, Finance & Marketing"** (web maps it to the Entrepreneurship type since 2026-10-01, pending BA — see Decisions); Attend events → Event is a design proposal | not applied when unset |
| Target Career Categories | new, multi-select | Opportunity Categories, any overlap | not applied when empty |
| Maximum Time Commitment | new (in contention — AWAITING SIGN-OFF) | interval + count, normalised, ≤ | **include Not specified** |
| Engagement Preference | new, **multi-select** (BA feedback) | Engagement Type | **exclude opportunities with no engagement type** |
| Paid Work Preference | proposed | Any · Paid · Unpaid → Is Paid | not paid still displayed, sorted last — **removed as a stored preference 2026-08-31; session filter only** |
| Preferred Languages | proposed | Opportunity Languages, any overlap | remain visible if other fields match |
| Self-Reported + Verified Skills | new / existing | Job Required Skills only, any overlap | — |
| Accessibility Needs | new, opt-in, sensitive | same accommodations lookup; never shared | include Not specified for now |
| Country / Date of Birth / Gender / Education | existing profile fields, read only | country → Location; DoB → Min/Max Age (open bounds, skipped when unknown); Gender → ranking only vs Targeted Groups; Education → no filter | — |

## Unresolved before build

Open questions carried from the canvas review (`Screens Review.pdf`, "Open for review") and the
BA sheets. Owner placeholders: Client / BA / API / Web.

| # | Question | Owner | Status |
| --- | --- | --- | --- |
| 1 | Should the question-title voice ("How do you want to take part?") carry into the dialog's section headers, or stay popover-only with plain nouns in the dialog? Built popover-only. | Client | open |
| 2 | Loading artboard shows blur + shimmer; the build uses a plain opacity fade (2026-09-03 browser feedback). Should the artboard match the build? Built: fade. | Client / Web | open |
| 3 | "Attend events" goal is a design proposal — confirm or drop. Built selectable → Type Event. | BA | open |
| 4 | Engagement null rule: BA says hide while set; the search includes. Move the API or the rule? Built: copy states the API behaviour. | API / BA | open (README ask #9) |
| 5 | Commitment null rule: BA says include; the search excludes. | API | open (README ask #2) |
| 6 | Time commitment as a stored preference is "in contention" on the BA sheet. Built with "Awaiting BA sign-off". | BA | open |
| 7 | Gender → ranking only: privacy and business rules to confirm before any implementation. Nothing built. | BA | open |
| 8 | Is Paid: approve capturing explicitly (not derived). Web assumes explicit. | BA / API | decided by the API 2026-09-28 — explicit nullable `incentivized` (any incentive, not only pay); the Paid half of the section and the incentive preference use it |
| 9 | Distance / "Jobs near me": live device coordinates, stored User Location, or both? | API (Adrian) / Web | decided 2026-09-28 — stored user location (city centroid, never the device fix); "Use my location" only fills it. Badge shipped; search live 2026-09-29 (distance needs opportunity coordinates) |
| 10 | Task `displayName` → "Impact task": reference-data change and CSV alias. | API | resolved 2026-09-28 — `ImpactAction`, displayed "Impact Action" (README ask #7) |
| 11 | Engagement value rename with IDs preserved; when it ships, delete `lib/engagementLabels.ts`. | API | resolved 2026-09-28 — Remote / OnSite / Hybrid + `displayName`; the map is deleted (README ask #8) |
| 12 | Per-badge live counts: not without a batched count endpoint. | API (suggestion) / Web | open (README ask #13) |
| 13 | Should ZLTO stay hidden (built) or grey with the note when Type includes Job alongside other types? An already-set ZLTO filter remains only in the chips row. | Client / Web | decided hide (Jason, 2026-09-23); revisit if the mixed-type case confuses |

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1262](https://linear.app/didx/issue/YOM-1262)
- Pairs with: [YOM-1261](../YOM-1261-ui-manage-user-presets/feature.md)
- Builds on: [YOM-1260](../YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/feature.md)
- Blocked by: [YOM-1257](https://linear.app/didx/issue/YOM-1257) · [YOM-1258](https://linear.app/didx/issue/YOM-1258) · [YOM-1264](https://linear.app/didx/issue/YOM-1264)
- Design + brief: out of repo — see the [2026-08-27 handoff](../handoffs/2026-08-27-b.md), Deliverables
- Handoff: [`../handoffs/2026-08-27-b.md`](../handoffs/2026-08-27-b.md)
