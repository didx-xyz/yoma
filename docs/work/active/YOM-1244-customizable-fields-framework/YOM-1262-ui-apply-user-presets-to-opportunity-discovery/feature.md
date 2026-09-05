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
4  what kind of opportunity    (type row — always open, MULTI-select since 2026-09-03,
                                provenance-aware, drives block 5)
5  type-specific filters       (one collapsible "«Type» filters" section per EFFECTIVE type;
                                from the definitions endpoint)
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
- [ ] Browser pass of the manual test script (brief §10) — first full pass by Jason 2026-09-03
      (findings fixed same day, see Decisions); re-verify the round-2 fixes on screen.
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

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1262](https://linear.app/didx/issue/YOM-1262)
- Pairs with: [YOM-1261](../YOM-1261-ui-manage-user-presets/feature.md)
- Builds on: [YOM-1260](../YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/feature.md)
- Blocked by: [YOM-1257](https://linear.app/didx/issue/YOM-1257) · [YOM-1258](https://linear.app/didx/issue/YOM-1258) · [YOM-1264](https://linear.app/didx/issue/YOM-1264)
- Design + brief: out of repo — see the [2026-08-27 handoff](../handoffs/2026-08-27-b.md), Deliverables
- Handoff: [`../handoffs/2026-08-27-b.md`](../handoffs/2026-08-27-b.md)
