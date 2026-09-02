# Feature: UI — Apply User Presets to Opportunity Discovery

## Meta

- **Feature**: Preset-driven opportunity discovery — search, filters and results
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1262](https://linear.app/didx/issue/YOM-1262)
- **Owner**: Jason
- **Areas**: web
- **Status**: in-progress — mocked; blocked on the presets API for live data
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
| [YOM-1257](https://linear.app/didx/issue/YOM-1257) / [YOM-1258](https://linear.app/didx/issue/YOM-1258) (api) | No preset model, no preset→filter mapping. Preferences are mocked behind one façade |
| [YOM-1264](https://linear.app/didx/issue/YOM-1264) (BA/design) | The preference set and the final filter mapping are not signed off |
| [YOM-1260](https://linear.app/didx/issue/YOM-1260) must land first | Presets resolve to filter criteria, so this builds on that feature's clause shape and operator matrix |
| User Location decision (Adrian) | `Jobs near me` needs coordinates. Ships visible and unavailable meanwhile |

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
blocks became seven):

```
1  free-text search input      (recent searches render beneath it as a typeahead, ≤5, removable)
2  quick searches
3  your preferences            (master switch + inherited chips)
4  what kind of opportunity    (type row — always open, drives block 5)
5  type-specific filters       (collapsible, purple; from the definitions endpoint)
6  the sections                (primary seven: Categories, Location, Engagement, Time commitment,
                                Paid and rewards, Accessibility, Language — then Skills, SDGs and
                                Provider behind one "More filters" disclosure, collapsed by
                                default. "Who it is for" removed from the youth surface: admin
                                targeting never restricts who can apply)
7  sticky footer               (Clear all + "Show N results")
```

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
- [x] `Jobs near me` ships **visible and unavailable** with a tooltip (decision: not hidden).
- [ ] Browser pass of the manual test script (brief §10) — nothing verified on screen yet.
- [ ] Where section: "my country only" switch + province/city reserved-slot note.
- [ ] Raise the API asks with Adrian: public sort options, commitment null rule, public
      `TotalCountOnly`, `ApplyUserPresets` exposure (see the 2026-08-27-c handoff).
- [ ] **Blocked**: live preset data, pending YOM-1257 / YOM-1258; mock-removal list in the
      2026-08-27-c handoff.
- [ ] Client decision on the per-type card layouts (canvas page 4) — if taken up, it becomes its own
      ticket with two new opportunity fields.

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

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1262](https://linear.app/didx/issue/YOM-1262)
- Pairs with: [YOM-1261](../YOM-1261-ui-manage-user-presets/feature.md)
- Builds on: [YOM-1260](../YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/feature.md)
- Blocked by: [YOM-1257](https://linear.app/didx/issue/YOM-1257) · [YOM-1258](https://linear.app/didx/issue/YOM-1258) · [YOM-1264](https://linear.app/didx/issue/YOM-1264)
- Design + brief: out of repo — see the [2026-08-27 handoff](../handoffs/2026-08-27-b.md), Deliverables
- Handoff: [`../handoffs/2026-08-27-b.md`](../handoffs/2026-08-27-b.md)
