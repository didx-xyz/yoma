# YoID ↔ discovery alignment: card grids, passport sections, YoID look and feel (2026-10-20)

- **Input:** Jason's 2026-10-20 batch for YOM-1283, through the lead:
  1. every opportunity and credential card gets a max-width; cards in a grid that is not a
     carousel may go full width on mobile; today they stretch on tablets;
  2. the passport gets additive paging ("Load more", 100 per load), filter chips (All plus one
     per type present), sections per type without a carousel, and Jump to top;
  3. ~~the same grouping on the YoID opportunity pages~~ — **skipped by Jason** until Adrian adds
     an opportunity-type filter to the youth `myopportunity/search` (the running API's
     `MyOpportunitySearchFilter` has `action`, `verificationStatuses`, `customFields` and paging
     only). The card grid and look-and-feel items still apply to these pages;
  4. the detail-page breadcrumb (behaviour, decided by Jason: browser back only when the
     previous in-app page was `/opportunities/discover`, else a link to it) — **not in this
     spec**; its look and its "Opportunities" label stay as they are;
  5. a responsiveness and readability pass, and every `/yoid` page in discovery's look and feel.
- **Read:** `feature.md` Decisions to 2026-10-20, `handoffs/2026-10-20-a.md`, `src/web/AGENTS.md`.
- **Status:** approved by Jason on 2026-10-20 (with his §9 answers) and implemented; §11 is the
  build comparison.
- **Paths** below are relative to `src/web/src/`. Line numbers are those of the working tree
  on 2026-10-20 (uncommitted Stage round included).
- **Screens:** `~/.cache/cdp-tools/shots/2026-10-20-yoid-align/` (machine-local), signed in as
  `testuser@gmail.com` (approved by Jason for this task), full pages at 1440 × 900 (1x),
  768 × 900 (1x), 390 × 844 (2x) and 320 × 844 (2x): `discover-*`, `yoid-*`, `wallet-*`,
  `skills-*`, `passport-*`, `opp-{completed,pending,declined,saved}-*`, plus viewport crops
  `opp-completed-{320,390,640,700,1024}-top.png`. The passport was captured twice: empty
  (`passport-*`, before the mock) and with the developer's local-only passport mock, 130
  credentials across 8 types (`passport-mock-{1440,768,390,320}.png`).
  Headless Chrome has no emoji font, so every emoji shows as a box in these captures; on a
  device they render.
- **Data:** no new requests and no new API fields. Everything below uses what the pages already
  load: wallet search items (`typeContext`, `schemaType`), `totalCount`, the type lookup
  (`useOpportunityTypes`), and the profile's `opportunityCount*`.
- **One batch.** Every item below is presentation on files already touched by this ticket, plus
  one new constant. Items that depend on an open question say so.

---

## 1. Card grid — every non-carousel grid of cards

### Current

Measured on `/yoid/opportunities/completed` (`grid grid-cols-1 gap-4 md:grid-cols-2
xl:grid-cols-3`, `pages/yoid/opportunities/*/[[...query]].tsx:120`, saved `:173`):

| Viewport | Columns | Card width |
| --- | --- | --- |
| 320 | 1 | 288 |
| 390 | 1 | 358 |
| 640 | 1 | **608** (`opp-completed-640-top.png`) |
| 700 | 1 | **608** (`opp-completed-700-top.png`) |
| 768 | 2 | 360 |
| 1024 | 2 | **483** (`opp-completed-1024-top.png`) |
| 1440 | 3 | **≈405** (`opp-completed-1440.png`) |

The discovery card it copies is 288 px in the rails and ≈300 px in the 4-across results grid.
Between 600 and 767 the YoID card is a single 608 px slab, and at 1024 two 483 px cards: that is
the "stretch" Jason reported. The wallet's products grid (`pages/yoid/wallet/[[...query]].tsx:295`)
and the skills grid (`pages/yoid/skills/[[...query]].tsx:106`) use the same classes.

### Changes

One shared constant, new file `lib/cardGrid.ts`:

```ts
/**
 * The grid for discovery-style cards outside a carousel (YoID opportunities, passport sections,
 * wallet products, skills). Columns switch where each one stays 272–425 px wide; below 600 a
 * card takes the full width (Jason, 2026-10-20). Rows stretch to the tallest card.
 */
export const CARD_GRID_CLASS =
  "grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1200px]:grid-cols-4";
```

Why 600 / 900 / 1200 rather than `sm` / `md` / `lg` / `xl`: with the 1248 px content width and
16 px gaps, these are the widths where one more column still leaves ≥ 272 px per card (the
discovery card's narrowest width, at 320). `md:grid-cols-3` would give 235 px cards at 768, and
`sm:grid-cols-2` up to `lg` gives 487 px cards at 1023.

Resulting widths (content = viewport − 32, capped at 1248):

| Viewport | Columns | Card width |
| --- | --- | --- |
| 320 / 390 | 1 | 288 / 358 |
| 599 | 1 | 567 (mobile, full width allowed) |
| 600 – 899 | 2 | 276 – 425 |
| 900 – 1199 | 3 | 278 – 378 |
| 1200 – 1440+ | 4 | 280 – 300 |

So no card is wider than 425 px from 600 up. Use `CARD_GRID_CLASS` in place of the grid classes
at:

- `pages/yoid/opportunities/{completed,pending,declined}/[[...query]].tsx:120` and
  `saved/[[...query]].tsx:173`;
- the passport section grids (§2);
- `pages/yoid/wallet/[[...query]].tsx:295` (products);
- `pages/yoid/skills/[[...query]].tsx:106`;
- **only if Jason agrees (Q2):** `features/discovery/components/Results/ResultsGrid.tsx`
  (`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4`), which today gives 296–487 px cards
  from 640 to 1023 and 236 px cards at 1024.

`PAGE_SIZE` (12) divides by 1, 2, 3 and 4, so the paged YoID opportunity grids always end on a
full row. Carousels are unchanged: their slides already have fixed widths
(`w-[min(18.125rem,calc(100vw-3rem))] sm:w-72`).

### Copy

None.

### Acceptance checks

On `/yoid/opportunities/completed` (and pending, declined, saved), measuring the first
`article`'s width and the number of distinct card `left` values:

| Viewport | Columns | Card width (±2) |
| --- | --- | --- |
| 1440 | 4 | 300 |
| 1024 | 3 | 320 |
| 768 | 2 | 360 |
| 390 | 1 | 358 |
| 320 | 1 | 288 |

- At 640 and 700: 2 columns, 296 and 326 px.
- No row ends with a gap except the last page's last row.
- `document.documentElement.scrollWidth === innerWidth` at every width.

### Departures

- **Arbitrary breakpoints** (`min-[600px]`, `min-[900px]`, `min-[1200px]`) instead of the
  Tailwind scale. Reason above; the scale cannot keep every column between 272 and 425 px.
- **4 across from 1200** on YoID (3 today). It matches discovery's results grid and keeps the
  cards at the discovery card's width.

---

## 2. Passport — chips, inline sections, Load more (`/yoid/passport`)

Supersedes the 2026-10-20 Decision "the passport groups into type rails over a 100-credential
page": Jason asked for sections with no carousel and additive paging. The grouping and its
order (`toCredentialRails`, `components/Credentials/CredentialCard.tsx:106`) are unchanged; only
what each group renders into changes.

### Current

- Empty: `passport-{1440,768,390,320}.png`.
- With the mock (130 credentials): `passport-mock-{1440,768,390,320}.png`.
  - Page 1 of 2 holds 100 credentials, headed "Showing 1 - 100 out of 130 results".
  - Eight rails: "YoID Identity 1" and seven others of 14–15 each.
  - The remaining 30 credentials are behind the pager.
  - At 1440 each rail shows 4 cards and a fifth peeking. At 390 and 320 each shows one card and
    a sliver, so the page is a column of eight single cards (2871 CSS px tall at 320).

What is wrong:

- **One carousel per type** (`pages/yoid/passport/[[...query]].tsx:350-388`). A youth with
  three types sees three sideways rows; nothing filters to one type, and each rail hides most
  of its cards off to the side.
- **A pager past 100** (`:392-402`), which splits a type across pages.
- **No way back up** after a long scroll.
- "Showing 1 - 13 out of 13 results" (`:341`) sits above the content and repeats what the rail
  counts say.
- The breadcrumb (`:312-322`) repeats the hero's selected tab (see §3).

### Changes

Page structure, top to bottom, inside the YoID `<main>` (§3):

1. **Page heading** (§3, "Page heading"): `Passport`, subtitle `My digital credentials`.
2. **Chip row.**
3. **Content:** the sections (All) or one section's full grid (a type).
4. **Load more** block, only while `loaded < totalCount`.
5. **Jump to top**, from the layout (§3).

Remove the breadcrumb, `PaginationInfoComponent`, `PaginationButtons`, `handlePagerChange`,
the `page` query parameter and `CustomCarouselV3` from this page.

#### Data (presentation contract for the developer)

- Pages of `PASSPORT_PAGE_SIZE` (100) accumulate (`useInfiniteQuery`, or equivalent). "Load more"
  requests the next page; the loaded credentials are concatenated in API order and grouped with
  `toCredentialRails` over **everything loaded**. The rail naming is now inaccurate; renaming it
  (e.g. `toCredentialGroups`) is the developer's call.
- `total` = the latest page's `totalCount`; `loaded` = the number of credentials loaded.
- Selected chip: component state, default All. It survives Load more and is reset by a reload.

#### Chip row

Reuse the category pill of discovery
(`features/discovery/components/Discover/CategoryCarousel.tsx:87-127`): white pill, count in a
lighter weight, selected state outlined inside its edge.

- Container: `<div role="group" aria-label="Filter by credential type">`.
  - Below `md`: one row through `components/Carousel/ScrollableContainer`
    (`className="flex gap-2 overflow-x-auto pb-1"`, `showShadows`,
    `shadowFromClassName="from-gray-light"`; the page behind it is `bg-gray-light`).
  - From `md`: `flex flex-wrap gap-2`.
- Chip: `<button type="button" aria-pressed={selected}>` with
  `inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold whitespace-nowrap md:min-h-9`
  and the tone:
  - idle: `border-gray hover:border-green bg-white text-black`;
  - selected: `border-green inset-ring inset-ring-green bg-white text-green`.
- Chips, in order:
  1. **All**, always first, count = `total`.
  2. One per group, in `toCredentialRails` order (YoID, the types in lookup order, unknown types,
     then untyped), label = the group's `label`, led by a type dot
     `<span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${typeBadgeClass(key)}`} />`
     (`lib/typeColours.ts:66`, the same dot as today's rail header, `:359-362`).
- Count: `<span className="font-normal opacity-70">{formatNumber(n)}</span>`, as on the
  category pill.
  - The All chip always shows `total`.
  - The type chips show their group's size **only when `loaded === total`** (with up to 100
    credentials, the first load). Before that, a type count would be a count of what is loaded,
    which reads as the youth's total; the chip then shows its label alone. Exact per-type
    counts at any wallet size are **API-gated** (the `typeContext` wallet-search filter already
    asked of Adrian, or a facet count).
- Hidden when there are fewer than two groups: with one type, "All" and that type show the
  same thing.
- Selecting a chip: the content swaps with no motion except a
  `motion-safe:animate-[fade-in_150ms_ease-out]` on the content wrapper (keyed on the
  selection). If the chip row has scrolled above the viewport, it is scrolled back into view:
  `scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" })`.

#### Sections (All selected)

One `<section aria-labelledby>` per group, stacked `flex flex-col gap-8 md:gap-10` (the landing's
rhythm, `features/discovery/components/Discover/DiscoveryLanding.tsx:43`).

Header, in DiscoveryRail's shape (`features/discovery/components/Discover/DiscoveryRail.tsx:122-158`):

```
<div className="flex items-start justify-between gap-3 pb-1">
  <h2 className="font-nunito flex min-w-0 items-start gap-2 text-base font-black tracking-normal md:text-lg">
    <span aria-hidden className="mt-1.5 h-3 w-3 shrink-0 rounded-full {typeBadgeClass(key)} md:mt-2" />
    <span className="line-clamp-2">{label}</span>
    <span className="text-gray-dark mt-0.5 text-sm font-semibold md:mt-1">{count}</span>
  </h2>
  {count > 2 && <button …>See all {count} →</button>}
</div>
```

- The group count here is the loaded count; it is never shown as "of N" (see chip counts).
- "See all N →" is a `button`, not a link: it selects that type's chip. Its classes are the rail
  link's (`text-green text-xs font-semibold whitespace-nowrap md:text-sm`) plus
  `inline-flex min-h-11 items-center md:min-h-0` for the touch target. After selecting, focus
  moves to the now-pressed chip, so a screen reader announces the new state.
- It shows when the group has **more than 2** credentials, the smallest number a section hides
  (below).

Grid: `CARD_GRID_CLASS` with `pt-2` (room for the card shadow, as the rail scroller), rendering
**the group's first 4 credentials** and hiding the ones that would start a second row:

```
`${CARD_GRID_CLASS} pt-2 max-[899px]:[&>*:nth-child(n+3)]:hidden max-[1199px]:[&>*:nth-child(n+4)]:hidden`
```

So an All section is exactly one row: 2 cards below 900 px (stacked below 600), 3 from 900 px, 4
from 1200 px. Hidden cards are `display: none`, so they are out of the tab order too. Each card is
`CredentialCard` unchanged (it is `h-full`, so a row stretches to its tallest card).

#### One type selected

- The section header without "See all".
- The group's **every loaded** credential in `CARD_GRID_CLASS pt-2`, with no cap and no hiding.

#### Load more

Shown below the content while `loaded < total`, whichever chip is selected (a type's next
credentials can be on the next page):

```
<div className="flex flex-col items-center gap-2 pt-2">
  <button type="button" className="btn border-green text-green hover:bg-green-light min-h-12 rounded-full bg-white px-6 text-base font-semibold" …>
  <p aria-live="polite" className="text-gray-dark text-xs">Showing {loaded} of {total} credentials</p>
</div>
```

- The button is the outline twin of discovery's `SOLID_GREEN`
  (`features/discovery/components/Results/NoMatches.tsx:14`), in green because it extends the
  same list.
- **Loading:** the button is `disabled` with `aria-busy="true"`. Its label becomes
  `<span className="loading loading-spinner loading-sm" aria-hidden /> Loading…`, and its width is
  held with `min-w-56` so it does not jump.
- New cards just appear, as appended rail cards do; there is no rise-in animation and no scroll
  jump. Under All, new credentials join their groups: a new group adds a section and a chip in
  its ranked place.
- **Failure:** the button returns, and above it shows
  `<Message kind="error">Couldn't load more. <button className="font-semibold underline">Retry</button></Message>`
  in DiscoveryRail's wording (`DiscoveryRail.tsx:182-190`). If importing `Message` from
  `features/discovery/components/shared/Message.tsx` into a page is unwanted, use the same
  classes inline: `flex items-start gap-2 rounded-lg p-2.5 text-xs bg-pink/10 text-pink`.
- When everything is loaded, the block disappears. "Showing N of N" is not kept: the All chip
  carries the total.

#### Empty states

- **The wallet is empty:** the existing `NoRowsMessage` (`:326-335`), unchanged, with no chip
  row, no Load more and no sections.
- **A type chip with nothing to show cannot occur:** chips exist only for groups that have at
  least one loaded credential.
- **The passport kill-switch** (`passport_enabled` false, `:150-167`) is unchanged.

#### Detail modal

Unchanged (the Stage round's typed header). "View credential" opens it exactly as today.

### Copy

| file:line | Current | New |
| --- | --- | --- |
| `pages/yoid/passport/[[...query]].tsx:315-319` | Breadcrumb "💳 Yo-ID › 🌐 Passport" | removed (§3 page heading) |
| — (new heading) | — | "Passport" (h1) · "My digital credentials" (subtitle, the tab description at `components/Layout/YoID.tsx:53`) |
| `pages/yoid/passport/[[...query]].tsx:341-347` | "Showing 1 - 13 out of 13 results" | removed |
| — (new chip) | — | "All" |
| — (new chip group label) | — | "Filter by credential type" (`aria-label`) |
| — (new section link) | — | "See all {n} →" |
| — (new button) | — | "Load more credentials" · loading "Loading…" |
| — (new status) | — | "Showing {loaded} of {total} credentials" |
| — (new error) | — | "Couldn't load more. Retry" |
| `pages/yoid/passport/[[...query]].tsx:329-331` | "No credentials found" / "Credentials that you receive … 24 hours to reflect." | unchanged |

### Acceptance checks

These need credentials in the wallet: the developer's local-only passport mock (130 credentials
for `testuser`), or Stage.

- **1440:**
  - The chip row fits on one line. It reads "All 130", then a chip with a type dot per group, in
    the current rail order: YoID Identity, then the types in lookup order (locally
    Entrepreneurship, Event, Impact Action, Job, Learning, Other), unknown types, then
    "Opportunity".
  - After the first load (100 of 130) the type chips have no counts. After "Load more" they
    show them, and those counts add up to 130.
  - Each section header has a type dot, the label, the count and, when the count is above 2,
    "See all n →" at the right.
  - Each section shows one row of up to 4 cards, each 300 px wide.
  - There is no carousel, no edge fade and no pager.
- **768:**
  - The chip row wraps.
  - Sections show at most 2 cards side by side, each 360 px wide.
  - "See all n →" on a section with 3 or more selects that chip, and the chip row is in view.
- **390:**
  - The chip row is one sideways-scrolling line with a gray fade at the edge; the chips are 44 px
    tall.
  - Sections show 2 stacked full-width cards (358 px).
  - Selecting a type shows all of its loaded cards stacked.
- **320:**
  - Same as 390, with 288 px cards.
  - `scrollWidth === innerWidth`.
  - "See all n →" never wraps under the title; a long type label wraps to 2 lines at most.
- **Over 100 credentials** (mock):
  - "Load more credentials" sits under the content with "Showing 100 of N credentials" below it.
  - Pressing it shows the spinner and "Loading…", then appends cards in place without a scroll
    jump.
  - The type chips show no counts until everything is loaded, then show them.
  - A failure shows the pink "Couldn't load more. Retry" above the button.
- Jump to top appears under the content and scrolls to the top (instantly with reduced motion).
- Detail modal: unchanged from the Stage round.

### Departures

- **Inline sections replace the type rails** (Decision 2026-10-20). Jason asked for it.
- **Load more replaces the pager.** Jason asked for it.
- **Type chip counts are withheld while the wallet is partly loaded.** A loaded-count would
  misstate the youth's total. Exact counts are API-gated.
- **No chip row with a single type.** "All" and that one chip would be the same view.
- **Chips are 44 px tall below `md`,** where the category pills they copy are 32 px. Those
  pills sit in the hero; these are the page's main control on a phone.

---

## 3. YoID shell — hero, tabs, page heading, rhythm (`components/Layout/YoID.tsx`)

Covers every `/yoid` page: overview, wallet, passport, opportunities and its four subpages, and
skills.

### Current

`yoid-1440.png`, `yoid-768.png`, `yoid-390.png`, `opp-completed-320-top.png`; compare with
`discover-1440.png`.

- **Hero:** `PageBackground` in overlay mode with a hand-measured height (`YoID.tsx:85`,
  `h-[14rem] md:h-[16rem]`, world map), then `container mt-20 p-4 md:mt-24` (`:92`). Discovery
  has a flat `bg-purple` header in normal flow
  (`features/discovery/components/Discover/DiscoverySurface.tsx:192`).
- **Tabs** (`:142`) are solid orange daisy buttons, 24 px tall on phones (`btn-xs`), with the
  selected one purple on purple. Discovery's pills in the same position are white with green
  for selected (`QuickSearchRow.tsx:21-24`).
- **Content** (`:157`) is `mt-8 md:mt-12 flex grow flex-col items-center justify-center`, and
  each page re-caps itself with `lg:max-w-7xl`. Discovery uses one
  `mx-auto max-w-7xl px-4 py-4` main (`DiscoverySurface.tsx:277`).
- **Breadcrumbs on every subpage** repeat the selected hero tab ("💳 Yo-ID › 🏆 Opportunities ›
  ✅ Completed"). At 320 that line runs edge to edge (`opp-completed-320-top.png`). Discovery has
  none.
- **Headings:** subpages have no heading; the overview's `Header` is
  `text-sm font-semibold tracking-wider`. Discovery's section titles are
  `font-nunito text-base font-black md:text-lg`.
- **No Jump to top** on any `/yoid` page; skills runs to 3574 px at 1440 (`skills-1440.png`).
- The greeting truncates on one line (`:110`, `truncate max-w-xs`).

### Changes

Layout root (replaces `YoID.tsx:85-161`; `YoIdModal`, `Head` and the tab data unchanged):

```
<div className="flex w-full flex-col">                     // MainLayout centres a flex child
  <header className="bg-purple w-full px-4 pt-20 pb-4 text-white md:pt-24">
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3">
      {/* greeting row */}
      <div className="flex max-w-full items-center gap-3">
        <div className="hidden shrink-0 sm:block"><UserInitialsAvatar … size={56} /></div>
        <div className="flex min-w-0 flex-col">
          <h1 className="line-clamp-2 text-xl font-semibold md:text-2xl">…greeting…</h1>
          <div className="flex items-center gap-1 text-sm md:text-base">
            Welcome to your Yo-ID
            <button … className="-m-2.5 inline-flex h-11 w-11 items-center justify-center rounded-full">
              <IoIosInformationCircleOutline className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      {/* tabs */}
      <nav aria-label="Yo-ID" className="w-full min-w-0">
        <ScrollableContainer className="flex justify-center-safe gap-2 overflow-x-auto pb-1"
          showShadows shadowFromClassName="from-purple">
          …tab links…
        </ScrollableContainer>
      </nav>
    </div>
  </header>
  <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4">
    {children}
    <JumpToTop />
  </main>
</div>
```

- **Hero:** the greeting is the discovery hero headline's size (`text-xl font-semibold
  md:text-2xl`, `DiscoverySurface.tsx:196`), allowed 2 lines instead of truncating. The avatar
  is a plain 56 px avatar, replacing the `scale-75 md:scale-90` of an 85 px one. The tab row is
  centred while it fits and scrolls sideways when it does not (`justify-center-safe`, as the
  quick-search row, `DiscoverySurface.tsx:209-216`).
- **Tabs:** links with `aria-current={tab.selected ? "page" : undefined}`, classes
  `inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold whitespace-nowrap`.
  - Idle: `border-gray hover:border-green bg-white text-black`.
  - Selected: `border-green bg-green text-white`.
  - These are QuickSearchRow's tones; 36 px on every width, because this is navigation, not the
    compact 28 px hero filter row.
  - Each tab keeps its `title` (the description). Drop `rel="noopener noreferrer"`, which means
    nothing on an internal link.
- **Icons instead of emoji in the tabs — only if Jason agrees (Q1):** `react-icons/io5` at
  `h-4 w-4 shrink-0` before the label: Overview `IoGridOutline`, Wallet `IoWalletOutline`,
  Passport `IoIdCardOutline`, Opportunities `IoTrophyOutline`, Skills `IoFlashOutline`. The
  labels lose their emoji (copy table). If Jason says no, the emoji stay in the labels and there
  are no icons.
- **Page heading** (new, on every subpage; the overview has none, the greeting is its heading),
  replacing the breadcrumbs (Q4):

  ```
  <div className="flex flex-col gap-0.5">
    <h2 className="font-nunito text-xl font-black tracking-normal md:text-2xl">{title}</h2>
    <p className="text-gray-dark text-sm">{subtitle}</p>
  </div>
  ```

  The title is the tab label without emoji; the subtitle is the tab's existing `description`
  (`YoID.tsx:45,53,61,69`). It is an `h2` because the greeting is the page's `h1`.
- **Rhythm:** `main` is discovery's (`gap-4 px-4 py-4`). Pages drop their own wrappers' caps
  (`w-full lg:max-w-7xl`, `mb-4` breadcrumb blocks) and stack their parts with
  `flex w-full flex-col gap-4`. Card grids are `CARD_GRID_CLASS`; tiles and cards are
  `rounded-xl bg-white shadow-custom`, the discovery card's surface.
- **Jump to top:** `components/Common/JumpToTop.tsx`, once, last in the layout's `main`, as on
  discovery (`DiscoverySurface.tsx:287`). It already honours reduced motion.
- `YoIdModal`, the tab URLs and their `selected` rules are unchanged.

### Copy

| file:line | Current | New |
| --- | --- | --- |
| `components/Layout/YoID.tsx:36` | "💳 Overview" | "Overview" (Q1; icon instead) |
| `components/Layout/YoID.tsx:44` | "💸 Wallet" | "Wallet" (Q1) |
| `components/Layout/YoID.tsx:52` | "🌐 Passport" | "Passport" (Q1) |
| `components/Layout/YoID.tsx:60` | "🏆 Opportunities" | "Opportunities" (Q1) |
| `components/Layout/YoID.tsx:68` | "⚡ Skills" | "Skills" (Q1) |
| `components/Layout/YoID.tsx:111` | "{emoji} Good {timeOfDay} {firstName}! 👋" | unchanged |
| `components/Layout/YoID.tsx:117` | "Welcome to your Yo-ID" | unchanged |
| — (nav landmark) | — | "Yo-ID" (`aria-label`) |

### Acceptance checks

- **1440:**
  - A flat purple header with no world map, with the greeting and tabs centred.
  - The tabs are white pills, 36 px tall; the current one is green with white text.
  - The content starts 16 px under the header, capped at 1248 px.
  - A subpage shows its heading (Nunito black, 24 px) and subtitle; there is no breadcrumb.
  - "Jump to top" sits under the content on every `/yoid` page.
- **768:** as 1440, with all five tabs on one centred line.
- **390:**
  - The greeting wraps to at most 2 lines.
  - The tab row scrolls sideways with a purple edge fade; the current tab is visible on load.
  - The info button is a 44 px target.
- **320:**
  - No horizontal page scroll on any `/yoid` route (`scrollWidth === innerWidth`).
  - The heading wraps to 2 lines at most.
- **Reduced motion:** Jump to top scrolls instantly.

### Departures

- **World-map band → flat purple header (Q3).** It matches discovery, sits in normal flow
  rather than a hand-measured overlay, and the band's `bg-theme` is purple for youth anyway.
- **Orange tabs → white pills.** Discovery's pill language, with green for the current place.
- **Breadcrumbs removed (Q4).** The hero tabs and the page heading say where the youth is, and
  the "Yo-ID" link is the Overview tab.
- **Emoji → icons in the tabs and headings (Q1).** Discovery uses io5 icons and no emoji in its
  UI. The greeting keeps its emoji.

---

## 4. YoID opportunity pages (`/yoid/opportunities/{completed,pending,declined,saved}`)

Grouping, chips and per-type paging are **skipped** (Jason, 2026-10-20) and **API-gated**: the
youth search has no opportunity-type filter. The card grid (§1), the shell (§3) and the items
below apply.

### Current

`opp-{completed,pending,declined,saved}-{1440,768,390,320}.png`, `opp-completed-320-top.png`.

- The **sub-tabs** (`components/Layout/YoIDOpportunities.tsx:88-103`) are daisy `btn-sm` with a
  shadow, with "Saved" wrapping alone onto a second line at 320. Their counts are computed
  (`badgeCount`, `:30,37,44,51`) but never drawn.
- A **three-level breadcrumb** (`:65-85`).
- The "**Click here**" link text in the info banner (`:109-116`).
- **Skill chips truncate** long names (`components/MyOpportunity/OpportunityListItem.tsx:278`,
  `truncate`).
- The 608 px cards at 600–767 (§1).

### Changes

- **Heading:** "Opportunities" / "Completed, pending, declined & saved opportunities" (§3).
- **Sub-tabs → pills**, the passport chip size with QuickSearchRow tones (these are places, not
  filters):
  - `<nav aria-label="My opportunities">`. Below `md`, a `ScrollableContainer`
    (`flex gap-2 overflow-x-auto pb-1`, `shadowFromClassName="from-gray-light"`); from `md`,
    `flex flex-wrap gap-2`.
  - Link classes:
    `inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold whitespace-nowrap md:min-h-9`.
    Idle: `border-gray hover:border-green bg-white text-black`; current:
    `border-green bg-green text-white`, with `aria-current="page"`.
  - After the label, the profile count already in `badgeCount`:
    `<span className="font-normal opacity-70">{formatNumber(n)}</span>`, omitted while the
    profile is loading (`undefined`). No new request: these are the profile's
    `opportunityCount*`.
  - Icons, if Q1 is yes: Completed `IoCheckmarkCircleOutline`, Pending `IoTimeOutline`, Declined
    `IoCloseCircleOutline`, Saved `IoHeartOutline` (the heart of discovery's "My opportunities"
    link, `MyOpportunitiesLink.tsx:3`).
- **Info banner:** keep `FormMessage`, with better link text (copy table).
- **Grid:** `CARD_GRID_CLASS` (§1). The pager and "Showing 1 - 12 out of 37 results" stay: this
  is still a paged list.
- **Card readability** (`OpportunityListItem.tsx:278`): skill chips wrap instead of truncating,
  `bg-green-light text-green line-clamp-2 max-w-full rounded px-1.5 py-0.5 text-left text-[10px] font-semibold`
  (2 lines at most).
- **Jump to top** comes from the layout (§3).

### Copy

| file:line | Current | New |
| --- | --- | --- |
| `components/Layout/YoIDOpportunities.tsx:27` | "✅ Completed" | "Completed" (Q1) |
| `components/Layout/YoIDOpportunities.tsx:34` | "⌚ Pending" | "Pending" (Q1) |
| `components/Layout/YoIDOpportunities.tsx:41` | "❌ Declined" | "Declined" (Q1) |
| `components/Layout/YoIDOpportunities.tsx:48` | "💗 Saved" | "Saved" (Q1) |
| `components/Layout/YoIDOpportunities.tsx:68-80` | Breadcrumb "💳 Yo-ID › 🏆 Opportunities › {tab}" | removed (Q4) |
| — (new heading) | — | "Opportunities" · "Completed, pending, declined & saved opportunities" (`YoID.tsx:61`) |
| `components/Layout/YoIDOpportunities.tsx:109-116` | "Just completed an opportunity? Click **here** to add it." | "Just completed an opportunity? **Add it to your Yo-ID**" (the bold part is the link) |
| — (nav landmark) | — | "My opportunities" (`aria-label`) |

### Acceptance checks

- **1440:**
  - The heading, then four white pills with counts (e.g. "Completed 37"), the current one green.
  - The banner, then a 4-column grid of 300 px cards, the pager, and Jump to top.
- **768:** the pills fit one line; 2 columns of 360 px.
- **390:**
  - The pills are one sideways row of 44 px targets; the current one is in view.
  - Cards are full width (358 px).
  - A long skill ("Momentum Accounting And Triple-Entry Bookkeeping") shows in full, on 2 lines
    at most.
- **320:** no pill wraps onto a second line, `scrollWidth === innerWidth`, and cards are 288 px.
- On all four subpages: empty states, badges, the download button and "View opportunity"
  (new tab) are unchanged.

### Departures

- **Counts on the sub-tabs** were computed but not drawn. Drawing them reuses loaded data and
  matches the discovery pills.
- **The sub-tabs become pills,** not daisy buttons with shadows.

---

## 5. Overview (`/yoid`)

### Current

`yoid-{1440,768,390,320}.png`.

- **Overflows at 320:** the page measures 338 px wide. The Opportunities summary's four circles
  (`components/YoID/OpportunitiesSummary.tsx:85`, `w-[30%] min-w-[80px]` in a `flex gap-3` row)
  need 356 px in a 256 px box; the first and last circles are cut off (`yoid-320.png`).
- **Tiles are hand-sized** (`pages/yoid/index.tsx:142,162,191,203`,
  `sm:w-[300px] md:w-[350px] lg:w-[400px]`; Opportunities `:217`, `sm:w-[616px] md:w-[716px]
  lg:w-[816px]`) in a centred `flex-wrap`.
- "View Graph" is placed absolutely at `left-[9rem]` (`:222-230`), tied to the title's width.
- **The Skills tile** is a 185 px scroll box of solid green badges that truncate at 200 px; its
  last row is cut in half (`yoid-1440.png`).
- **Tile headers** (`components/Common/Header.tsx`) are small spaced caps-like text with a bare
  chevron as the only "see more" cue.

### Changes

- **Grid:** `pages/yoid/index.tsx:140` →
  `grid w-full grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2 xl:grid-cols-3`.
  - Each tile wrapper is `flex flex-col gap-2`, with no fixed widths.
  - The Opportunities wrapper is `md:col-span-2`.
  - The order is unchanged (Wallet, Passport, Skills, CV, Opportunities), so xl gives "Wallet ·
    Passport · Skills" then "CV · Opportunities (2 wide)", and md gives pairs then Opportunities
    full width.
- **Tile bodies:** `rounded-lg … shadow` → `shadow-custom rounded-xl bg-white p-4`, and
  `h-[185px]` → `min-h-[185px] grow`, so a row's tiles share its height. The CV body loses
  `xl:h-[300px]`; Opportunities `md:h-[300px]` → `md:min-h-[300px]`.
- **`components/Common/Header.tsx`** (used only by `/yoid` and the wallet):
  - Title: `font-nunito line-clamp-1 text-base font-black tracking-normal text-black md:text-lg`
    (the rail title), in an `h2`.
  - Link: the chevron is replaced by the rail's text link "See all →"
    (`text-green inline-flex min-h-11 items-center text-xs font-semibold whitespace-nowrap md:min-h-0 md:text-sm`).
  - The fixed `h-[24px]` row becomes `flex min-h-6 items-center justify-between gap-3`.
  - A new optional `action?: ReactNode` prop renders before the link. The Opportunities tile
    passes the "View graph" / "View summary" toggle through it, styled
    `text-gray-dark text-xs font-semibold underline min-h-11 md:min-h-0`; the absolute
    positioning at `index.tsx:222-224` is removed.
- **`components/YoID/OpportunitiesSummary.tsx:79-98`:**
  - Row: `grid grid-cols-2 justify-items-center gap-3 sm:grid-cols-4`.
  - Circle: `w-full max-w-24` (replacing `w-[30%] min-w-[80px]`).
  - Label: `text-[11px] leading-tight` (replacing the inline `0.65rem` style).
  - At 320 the circles sit 2 × 2 at 96 px; from 640 they are 4 across.
- **`components/YoID/SkillsCard.tsx`:**
  - Show the first **8** skills, then a "+{n} more" link to `/yoid/skills` when there are more.
  - Chips are the card skill style:
    `bg-green-light text-green line-clamp-2 max-w-full rounded px-2 py-1 text-xs font-semibold`
    (no truncation).
  - The tile body loses `overflow-y-auto` (`index.tsx:194`).
  - The data is the list the tile already has.
- PassportCard, WalletCard, the CV tile's content and the LineChart are unchanged apart from the
  tile surface.

### Copy

| file:line | Current | New |
| --- | --- | --- |
| `pages/yoid/index.tsx:143` | "💸 Wallet" | "Wallet" (Q1) |
| `pages/yoid/index.tsx:163` | "🌐 Passport" | "Passport" (Q1) |
| `pages/yoid/index.tsx:192` | "⚡ Skills" | "Skills" (Q1) |
| `pages/yoid/index.tsx:204` | "🏦 CV" | "CV" (Q1) |
| `pages/yoid/index.tsx:219` | "🏆 Opportunities" | "Opportunities" (Q1) |
| `pages/yoid/index.tsx:226-228` | "📋 View Summary" / "📈 View Graph" | "View summary" / "View graph" |
| `components/Common/Header.tsx:31` | chevron, `title="View all"` | "See all →" |
| — (`SkillsCard`) | — | "+{n} more" |

### Acceptance checks

- **1440:**
  - Row 1 is Wallet, Passport and Skills in equal 405 px columns; row 2 is CV, then
    Opportunities 2 columns wide.
  - Headers are Nunito black with a green "See all →"; "View graph" sits in the Opportunities
    header and is not overlapping the title.
- **768:** Wallet | Passport, Skills | CV, then Opportunities full width, with 4 circles in a row.
- **390:**
  - One column. Skills shows at most 8 chips plus "+47 more" (testuser has 55); no chip is cut
    off and none truncates.
  - The circles are 2 × 2.
- **320:** `scrollWidth === innerWidth` (338 today); all four circles are fully visible, 2 × 2.

### Departures

- **Skills tile capped at 8 chips** instead of a scroll box: a cut-off row read as broken, and
  the full list is one tap away.

---

## 6. Wallet (`/yoid/wallet`)

### Current

`wallet-{1440,768,390,320}.png`. Local data shows the balance tile and "Your wallet creation is
currently pending…"; **the products grid could not be seen** (no purchases). Breadcrumb, then
`Header` "💸 My Wallet" over a fixed-width tile, then "🛒 My Products".

### Changes

- **Heading:** "Wallet" / "My digital wallet" (§3). The breadcrumb (`:214-225`) is removed.
- The balance tile wrapper (`:228`) → `flex w-full flex-col gap-2 md:max-w-[25rem]`; the body
  surface → `shadow-custom rounded-xl` (as §5).
- **Headers** restyle through `Header` (§5).
- **Products grid** (`:295`) → `CARD_GRID_CLASS`. `TransactionItem` is otherwise untouched: it
  was not seen with data, so restyling it is deferred.
- The voucher modal is unchanged.

### Copy

| file:line | Current | New |
| --- | --- | --- |
| `pages/yoid/wallet/[[...query]].tsx:217-221` | Breadcrumb "💳 Yo-ID › 💸 Wallet" | removed (Q4) |
| `pages/yoid/wallet/[[...query]].tsx:229` | "💸 My Wallet" | "My Wallet" (Q1) |
| `pages/yoid/wallet/[[...query]].tsx:248` | "🛒 My Products" | "My Products" (Q1) |

### Acceptance checks

- **1440 / 768:** the heading, then the balance tile at most 400 px wide, then "My Products"
  with its state.
- **390 / 320:** the tile is full width and `scrollWidth === innerWidth`.
- With purchases (Stage): the product cards follow the §1 columns.

### Departures

None beyond §3.

---

## 7. Skills (`/yoid/skills`)

### Current

`skills-{1440,768,390,320}.png`.

- 55 skills as 150 px-tall tiles, 3 across: the page is 3574 px tall at 1440 with no way back up.
- "Showing 1 - 55 out of 55 results" for a list that is never paged.
- The empty state has a typo.

### Changes

- **Heading:** "Skills" with the count in the rail style:
  `<h2 …>Skills <span className="text-gray-dark text-sm font-semibold">55</span></h2>`.
  - Subtitle: "Skills gained through opportunities" (`YoID.tsx:69`).
  - `PaginationInfoComponent` (`:97-103`) and the breadcrumb (`:68-78`) are removed.
- **Grid:** `CARD_GRID_CLASS`.
- **Tile:** `shadow-custom flex min-h-28 flex-col gap-2 rounded-xl bg-white p-4`, replacing
  `h-[150px]`.
  - Name: `line-clamp-2 text-sm leading-5 font-semibold md:text-base` (2 lines at most).
  - "Skill issued by …": `text-gray-dark text-xs`.
  - Partner logos: `AvatarImage size={32}`.
- **Jump to top** comes from the layout (§3).
- The link behaviour (`infoURL` or `#noaction`) is unchanged.

### Copy

| file:line | Current | New |
| --- | --- | --- |
| `pages/yoid/skills/[[...query]].tsx:71-74` | Breadcrumb "💳 Yo-ID › ⚡ Skills" | removed (Q4) |
| `pages/yoid/skills/[[...query]].tsx:87` | "…will be diplayed here." | "…will be displayed here." |
| `pages/yoid/skills/[[...query]].tsx:97-103` | "Showing 1 - 55 out of 55 results" | removed (the count moves into the heading) |

### Acceptance checks

- **1440:** "Skills 55", then 4 columns of 300 px tiles at least 112 px tall; the page is roughly
  half today's height. Jump to top is at the end.
- **768:** 2 columns. **390 / 320:** 1 column, with names clamped to 2 lines.
- No horizontal scroll at 320.

### Departures

- **Pagination info replaced by a heading count.** The list is not paged.

---

## 8. Found on the way — deferred (not in this batch)

- **`/opportunities/discover` overflows at 768:** the page measured 832 px wide in a 768 px
  viewport (`discover-768.png`). I did not isolate the element before handing the browser slot
  on. It is on the reference page, so it needs its own triage.
- **The global navbar at 768** draws its links under the logo ("etplace" in `yoid-768.png`,
  `opp-completed-768.png`). This is the site header, outside `/yoid`.
- **Completion custom-field rows on the YoID card** render at `text-sm`, larger than the card's
  `text-xs` (`opp-completed-1440.png`, "Employment Start Date"). They come from the shared
  `CustomFieldsView`, which the verification modal also uses.
- **Pre-existing per-card request:** `MyOpportunityCustomFieldsSection` loads completion
  definitions per opportunity, once per card that has values
  (`components/Opportunity/MyOpportunityCustomFieldsSection.tsx`). This spec adds none; it is
  noted for the epic.
- **`TransactionItem` (wallet products)** was not seen with data; any restyle waits for a Stage
  look.
- **The opportunity detail page** and the legacy `/opportunities` cards still use `TYPE_CONFIG`
  colours (the open question from the 2026-10-20 handoff), unchanged here.

## 9. Open questions for Jason

1. **Emoji → icons.** Replace the emoji in the YoID tabs, the opportunity sub-tabs and the tile
   and section headings with `react-icons/io5` icons, as discovery does? The greeting keeps its
   emoji. Recommended: yes. If no, the labels keep their emoji and the §3–§7 copy rows marked
   Q1 do not apply.
2. **Discovery's results grid too?** Your "all cards get a max-width" also covers discovery's
   results grid, which gives 487 px cards at 1023 and 236 px cards at 1024. Should it use the
   same `CARD_GRID_CLASS`? That would make it 3 across between 900 and 1199. Recommended: yes.
3. **Hero band.** Should the YoID header become discovery's flat purple header, without the world
   map? Recommended: yes.
4. **Breadcrumbs.** Remove the breadcrumbs on the YoID subpages, now that the hero tabs and the
   new page heading show the location? Recommended: yes.

## 10. Implementation tasks (one developer batch)

1. `lib/cardGrid.ts` with `CARD_GRID_CLASS`; apply it to the four YoID opportunity pages, the
   wallet products and the skills grids (§1). Apply it to `ResultsGrid.tsx` only if Q2 is yes.
2. `components/Layout/YoID.tsx`: the header, tabs and main, with `JumpToTop` (§3). The tab
   icons only if Q1 is yes.
3. The page heading on the wallet, passport, opportunities and skills pages; remove the
   breadcrumbs if Q4 is yes (§3, §4, §6, §7).
4. Passport: accumulated pages, chips, sections, the one-type view, Load more and its states;
   remove the pager and carousel (§2).
5. `components/Layout/YoIDOpportunities.tsx`: pill sub-tabs with counts, and the banner copy
   (§4). `OpportunityListItem.tsx:278`: skill chips clamp to 2 lines.
6. Overview: the grid, tile surfaces, the `Header` restyle with its `action` prop,
   `OpportunitiesSummary` (the 320 overflow) and the `SkillsCard` cap (§5).
7. Skills page: heading count, tiles and the typo (§7).

Check afterwards: `pnpm lint` and `tsc --noEmit`. The tester then runs the acceptance checks in
§1–§7 at 1440, 768, 390 and 320. The passport checks use the developer's local-only passport
mock (130 credentials, so Load more is exercised).

## 11. Build comparison (2026-10-20)

Compared against this spec as amended by Jason's §9 answers and the `feature.md` Decisions of
2026-10-20 (hero keeps the world map; breadcrumbs stay and the subpage headings are dropped;
`lib/card.ts` replaces `lib/cardGrid.ts`). Evidence is the testers' captures; `R/` =
`~/.cache/cdp-tools/shots/2026-10-20-retest/`, `T/` = `~/.cache/cdp-tools/shots/2026-10-20-tester/`
(T/ predates the fix round, so the passport tile and modal are judged from R/ only). Widths were
judged by eye from the captures, not measured.

| Spec item | What I see | Screenshot |
| --- | --- | --- |
| §1 grid, 1440: 4 columns | 4 equal columns on Completed and on discovery results. **Matches.** | R/opp-completed-1440.png, R/discover-results-1440.png |
| §1 grid, 768: 2 columns | 2 columns on the passport and opportunity pages. **Matches.** | T/passport-768.png, T/opp-completed-768.png |
| §1 grid, 390 / 320: 1 column, full width | 1 full-width column, no sideways overflow visible. **Matches.** | R/opp-completed-320.png, T/passport-390.png |
| §1 discovery results use the shared grid (Q2) | 4 across at 1440, same card width as YoID. **Matches.** | R/discover-results-1440.png, R/discover-results-768.png |
| §2 chip row, 1440 | One line: "All 130", YoID Identity, Entrepreneurship, Event, Impact Action, Job, Learning, Other, Opportunity, each with a type dot. **Matches.** | T/passport-1440.png |
| §2 chip counts withheld until all loaded | No counts at 100 of 130; after Load more 1+18+19+19+19+18+18+18 = 130. **Matches.** | T/passport-1440.png, R/r-loadmore-all-1440.png |
| §2 section headers (dot, label, count, "See all n →" when > 2) | As specified; YoID Identity (1) has no "See all". **Matches.** | T/passport-1440.png |
| §2 one row of up to 4 cards, no carousel/fade/pager | **Matches.** | T/passport-1440.png |
| §2 768: chips wrap, 2 cards per section | **Matches.** | T/passport-768.png |
| §2 390: sideways chip line, 2 stacked cards; "See all" selects the chip and keeps it in view | Job chip selected and centred in the scrolled row, all cards stacked. **Matches** (incl. fix-round centring). | T/passport-390.png, R/r3-seeall-390-job.png |
| §2 Load more + "Showing 100 of 130 credentials" | **Matches.** | T/passport-1440.png |
| §2 failure: pink "Couldn't load more. Retry" above the button, loaded cards kept | **Matches** (fix-round behaviour). | R/r1-page2-fail-1440.png |
| §2 detail modal: type-coloured header "<TYPE> · YoID", type pill | Header stays, body scrolls inside the rounded box, Close clear of the radius. **Matches** the fix-round decision. | R/t2-modal-1440-top.png, R/t2-modal-390-scrolled.png |
| §3 hero (amended: discovery band + world map) | Purple in-flow band with the world-map stencil, greeting and tabs centred. **Matches the amended spec.** | R/yoid-1440.png |
| §3 tabs: white pills, current green, io5 icons | **Matches.** | R/yoid-1440.png, R/wallet-1440.png |
| §3 390: tab row scrolls sideways with edge fade, current visible | Fade on the right; Overview (current) visible. **Matches.** | R/yoid-390.png |
| §3 breadcrumbs kept, no duplicate page heading (amended) | "Yo-ID › Passport" etc., no repeated heading; skills total after the crumb ("Skills 79"). **Matches the amended spec.** | T/passport-1440.png, R/skills-1440.png |
| §3 Jump to top under content on every `/yoid` page | Present on overview, wallet, passport, opportunities, skills. **Matches.** | R/yoid-1440.png, R/wallet-1440.png, R/skills-1440.png |
| §4 sub-tab pills with counts, current green | "Completed 37 · Pending 32 · Declined 30 · Saved 30". **Matches.** | R/opp-completed-1440.png |
| §4 banner, grid, pager, Jump to top | **Matches.** | R/opp-completed-1440.png |
| §4 other subpages | Same layout on pending, declined, saved. **Matches.** | T/opp-{pending,declined,saved}-1440.png |
| §5 overview 1440: Wallet / Passport / Skills, then CV + Opportunities ×2 | **Matches**; "View graph" sits apart from the title. | R/yoid-1440.png |
| §5 skills tile capped at 8 + "+n more" | 8 chips + "+71 more" (testuser now has 79 skills, not 55). **Matches.** | R/yoid-1440.png, R/yoid-390.png |
| §5 390: one column, circles 2 × 2 | **Matches.** | R/yoid-390.png |
| §5 passport tile: stamp not overlapped (fix round) | Stamp clear of the counts at 320. **Matches.** | R/t1-passport-tile-320.png, R/t1-passport-tile-1440.png |
| §6 wallet: balance tile ≤ 400 px, then My Products | **Matches.** "My Wallet" stays as the tile header (`TileHeader`), not a page heading. | R/wallet-1440.png, R/wallet-320.png |
| §7 skills: 4 columns of tiles, count in the breadcrumb, Jump to top | **Matches.** | R/skills-1440.png, R/skills-320.png |

**Not mismatches, noted:** the greeting emoji, the "New to Yoma?" icon, the CV icon and the
Saved circle icon render as tofu boxes in every capture: the headless browser lacks an emoji font,
the same on unchanged pages. The navbar drawn mid-page in R/r-loadmore-all-1440.png is a stitched
full-page capture of the sticky header, not a layout fault.

**Not seen:** exact pixel widths (±2 px) and `scrollWidth === innerWidth` (judged visually only);
the 1024, 700 and 640 widths; reduced-motion Jump to top; the empty states; product cards with
purchases (Stage only).
