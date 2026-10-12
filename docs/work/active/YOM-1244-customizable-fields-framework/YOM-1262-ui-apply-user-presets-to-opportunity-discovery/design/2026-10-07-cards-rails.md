# Design spec: card facts, fact tooltip, Filters category pills, landing rails — 2026-10-07

- **Feature:** YOM-1262. **Base:** `c86f09f2` plus the uncommitted 2026-10-06 (b) and 2026-10-07 trees.
- **Author:** designer role (Jason opted in for this batch). Presentation only; the rail
  catalogue and its results hook (`lib/landingRails.ts`, `state/useRailResults.ts`) are the
  developer's and are not specified here.
- **Screens** (signed out, throwaway slot, wizard answered: Get a job · Technology, AI & Data,
  Creative, Media & Design, Hospitality & Tourism · up to a month · paid · South Africa / Cape
  Town). Machine-local, in `~/.cache/cdp-tools/shots/2026-10-07-cards-rails/`:
  `cur-landing-prefs-1440-full.png`, `cur-landing-prefs-390-full.png`,
  `cur-landing-noprefs-1440-full.png`, `cur-card-job-1440.png`, `cur-tip-1440.png`,
  `cur-tip-col1-390.png`, `cur-tip-col2-390.png`, `cur-card-tip-320.png`,
  `cur-filters-1440.png`, `cur-filters-categories-mixed-1440.png`,
  `cur-sheet-categories-390.png`, `cur-sheet-categories-320.png`,
  `ref-wizard-step2-1440.png`.

Order is by reach: §1 and §2 change every card on every surface, §3 is one filter section,
§4 is the new landing. One batch.

## Jason's answers (2026-10-07)

Jason approved the spec as written, with every recommendation. On the questions (below), and on
the developer's:

- **Q1, category rails:** at most **3**, in the order the youth picked them. There is **no total
  cap**, so at most 9 rails. This replaces the logic batch's `MAX_LANDING_RAILS = 8`.
- **Q2, empty rail:** collapse.
- **Q3, Filters tones:** fix **all** chip sections in this batch. A preference value is a white
  pill with a purple outline, and this search's own picks stay green. The Type row follows: its
  manual picks are no longer solid purple.
- **Q4, placeholder:** "Searching…" text in the reserved space.
- **Place rails leave out Worldwide.** The place is a plain filter, so a rail's See all reuses
  its query exactly. Worldwide opportunities still reach Picked for you, Latest with no place,
  and search.
- **Start a business:** its See all is drawn without the number (`seeAllExact: false`), as §4
  says.
- **Done in under an hour** sits in the commitment slot while a preference applies, and stays
  last with nothing in play (lead's call, following the approved catalogue order).

---

## 1. Card facts (B)

### Current

`cur-card-job-1440.png`, `cur-landing-prefs-1440-full.png`, `cur-tip-col1-390.png`.

- **"Started 5 Oct" is on almost every card** (every seeded opportunity has started). A start
  date in the past tells the youth nothing they can act on, and it takes one of four slots.
- **"Permanent employment" truncates** to "Permanent employme…" at 390 and 320; Jason wants
  "Permanent".
- **Dates are absolute only.** "Starts Fri 6 Nov" needs a calendar to read; "Starts tomorrow"
  does not.
- **The end date reads two ways.** The status row says "1 day left" while the band says
  "Ending soon". The band badge is decided (2026-09-30) and stays; the status row's wording
  is what changes.

### Changes

**Ownership.** The status row (`closingInfo`, `lib/dates.ts`) owns the end date. The facts never
show it. The start date is a fact, but only while it is still to come.

**Day arithmetic (both dates).** Count calendar days, not hours:
`days = (UTC calendar date of the stored date) − (the youth's local calendar date of now)`.
The stored dates are calendar days in UTC (the existing labelling convention, `lib/dates.ts:18-21`).
Today `closingInfo` uses `Math.ceil` of milliseconds (`lib/dates.ts:13`), so a deadline at
23:59 UTC tomorrow can read "2 days left".

**Start date (the `date` fact, `lib/cardFacts.ts:175-192`):**

| days until start | card text | tooltip value |
| --- | --- | --- |
| < 0 (started) | no fact, so the next fact takes the slot | — |
| 0 | Starts today | Wed 7 Oct |
| 1 | Starts tomorrow | Thu 8 Oct |
| 2–6 | Starts Fri (short weekday) | Fri 9 Oct |
| ≥ 7 | Starts 14 Nov (no weekday) | Sat 14 Nov, plus the year when it isn't this year (Wed 6 Jan 2027) |

**End date (the status row, `closingInfo`):**

| days until end | label | urgent (pink) |
| --- | --- | --- |
| no end date | No deadline (unchanged) | no |
| < 0 | Closed (unchanged) | no |
| 0 | Ends today | yes |
| 1 | Ends tomorrow | yes |
| 2–7 | N days left (unchanged) | yes |
| ≥ 8 | Apply by 6 Nov (unchanged) | no |

Read together, a card says "Starts tomorrow" in the facts and "Apply by 6 Nov" in the status
row, and the two never name the same date. A one-day event shows "Starts today" and
"Ends today", which are two different facts.

**Employment text** is the type name(s) only: "Permanent", "Internship", "Fixed term · 6
months". Delete `BARE_EMPLOYMENT_TYPES` and the suffix (`lib/cardFacts.ts:91`, `:137-139`). The
tooltip still names it: "Employment type: Permanent".

**Relevance, per fact.** A fact is drawn only when the rule holds. Empty facts are skipped and
the next candidate moves up. The cap stays at 4 (`MAX_FACTS`, `lib/cardFacts.ts:93`).

| fact | shown when | never because |
| --- | --- | --- |
| employment | Job, an employment type is set | — |
| date | the start is today or later (table above) | a past start is not actionable; the end date belongs to the status row |
| effort | `commitmentIntervalDescription` is set | — |
| difficulty | the type has a difficulty key (`KEYS.difficulty`) and a level is set | — |
| tools | Impact Action, tools are listed | — |
| programme | Entrepreneurship, a programme is set | — |
| accessibility | Event: whenever the opportunity says something (as today). **Every other type: only while accessibility is part of this search**, i.e. the surface's effective `accommodations` is non-empty (inherited needs or picked by hand). Support "No" is never shown (unchanged). | it names the opportunity's accommodations, never the youth's needs (2026-10-03 privacy rule holds) |

Slots the card already fills elsewhere are never facts: money (beside the chip), place and
engagement (org line), places left and the end date (status row), Featured and Ending soon
(band).

**Priority per type** (`PRIORITY`, `lib/cardFacts.ts:52-59`). The first four that pass their
rule are drawn. `a11y*` is the accessibility fact under the "only while part of this search"
rule.

| type | candidates, in order |
| --- | --- |
| Job | employment · date · effort · a11y* |
| Learning | effort · difficulty · date · a11y* |
| ImpactAction | tools · effort · date · a11y* · difficulty |
| Event | date · accessibility · effort · difficulty |
| Entrepreneurship | programme · effort · date · a11y* |
| Other | effort · date · a11y* · difficulty |

`cardFacts` takes one more argument, `accessibilityInSearch: boolean`, which the card reads
from `useDiscovery().effectiveFilters.accommodations.length > 0`. That is context already on
the page: no request.

**Layout:** unchanged, a 2 × 2 grid with content-sized columns
(`OpportunityCard.tsx:183`) and slots reserved when empty.

**Compact list row** (`OpportunityRow.tsx:45`, `:125-130`). There is no component change. It
shows `cardFacts(...)[0]`, so it inherits the new text: "Permanent" for a Job, and for an Event
whose start has passed, its accessibility or effort. The status column and the mobile status
show the new "Ends today" / "Ends tomorrow".

### Copy

| file:line | current | new |
| --- | --- | --- |
| `lib/cardFacts.ts:138` | `${types} employment` ("Permanent employment") | `${types}` ("Permanent") |
| `lib/cardFacts.ts:189` | `Starts ${weekday day month}` ("Starts Fri 6 Nov") | "Starts today" · "Starts tomorrow" · "Starts Fri" · "Starts 6 Nov" |
| `lib/cardFacts.ts:189` | `Started ${day month}` ("Started 5 Oct") | none (no fact) |
| `lib/cardFacts.ts:28` (doc comment) | ("Permanent employment", … "Starts Mon 5 Oct") | ("Permanent", … "Starts tomorrow") |
| `lib/dates.ts:15` | Closes today | Ends today |
| `lib/dates.ts:17` | 1 day left | Ends tomorrow (2–7 unchanged: "N days left") |

### Acceptance checks

- **1440, 390, 320:** no grid card or rail card shows "Started …" or "… employment". A Job card
  reads "Permanent" in full at 320, not truncated.
- A seeded fixture 08 card (future start) reads "Starts {d Mon}", or "Starts {weekday}" within 6
  days. Its tooltip gives the full date.
- A card whose end is tomorrow reads "Ends tomorrow" in pink. That holds on the grid card, the
  list row (desktop status column, and the mobile right-hand status at 390 and under the meta
  line at 320) and the detail page's sticky deadline (`OpportunityDetailSections.tsx:772`).
- **Accessibility:** with no needs and no Accessibility filter, a Job card has no accessibility
  fact. Pick "Wheelchair accessible" in Filters → Accessibility and Job cards that list
  accommodations show "Accessibility: …" in their 4th slot.
- **List view at 1440 (`xl`):** the fact column shows "Permanent" for Jobs. Nothing overflows
  its 130px.

### Departures

- **"Closes today" becomes "Ends today"**, in Jason's own word. It also changes the detail page's
  sticky bar, which uses the same `closingInfo`. One rule, everywhere.
- **The 2026-10-07 "Started 5 Oct" wording goes.** A past start is no longer a fact.
- **Difficulty becomes a filler** on Impact Action, Event and Other (their keys already exist in
  `KEYS.difficulty`). Without it, dropping the past start would leave most of those cards with 2
  facts.

---

## 2. Fact tooltip (C)

### Current

`cur-tip-1440.png`, `cur-tip-col1-390.png`, `cur-tip-col2-390.png`, `cur-card-tip-320.png`.

- 11px on black (`OpportunityCard.tsx:81`) is small for a hint on a phone. It is a single string
  ("Start date: Mon 5 Oct"), so the name and the value carry the same weight.
- **It is anchored to its own `li`.** A right-column tooltip `right-0` of a content-sized column
  can run past the card's left edge when the value is long. The card root is `overflow-hidden`
  (`OpportunityCard.tsx:131`), so it would be cut off. It did not happen with the seeded values,
  but a long accommodations list would hit it.
- It covers the fact beside or above it.

### Changes

- **Anchor to the fact grid, not the fact.** Put `relative` on the `ul`
  (`OpportunityCard.tsx:183`) and drop it from the `li` (`:68`). The tooltip is
  `absolute bottom-full mb-2`, with `left-0` for column 1 and `right-0` for column 2 (the
  `alignEnd` prop stays). The grid spans the card's content width, so the tooltip can never
  leave the card, at any width down to 320. It always sits above the whole grid, so it never
  covers another fact.
- **Size:** `w-max max-w-full`, `whitespace-normal wrap-break-word`, value `line-clamp-3`.
- **Two lines, two weights:**
  - name: `text-[11px] leading-4 font-semibold tracking-wide uppercase text-gray` ("START DATE");
  - value: `text-sm leading-5 font-semibold text-white` ("Fri 9 Oct").

  `CardFact` gains `name` and `value` (it has `text` and `tip` today). `tip` stays as the
  button's `aria-label`.
- **Box:** `bg-black rounded-lg px-3 py-2 shadow-lg z-20`.
- **No arrow.** A column-2 tooltip is anchored to the grid's right edge, so an arrow could not
  point at its fact without measuring. Leaving it out is cleaner than an arrow that points at the
  wrong thing.
- **Motion:** on open, `motion-safe:animate-[fade-in_120ms_ease-out]`; `motion-reduce` shows it
  at once. The open and close behaviour (tap to toggle, tap elsewhere, hover, focus-visible) is
  unchanged.

### Copy

None new. The name is the `NAMES` entry (`lib/cardFacts.ts:61-69`) and the value is the
existing `value`.

### Acceptance checks

- **320 and 390:** tap each of the four facts on a rail card and a results card. Each tooltip is
  fully inside the card, with no part cut off, and no sideways scroll on the page.
- **1440:** focus a fact with Tab and the tooltip shows. Its value text is 14px semibold white
  with an uppercase name above it.
- A long value (fixture 04's accommodations) wraps to at most 3 lines and stays inside the card.

### Departures

None.

---

## 3. Filters dialog: category pills with icons (A)

### Current

`cur-filters-categories-mixed-1440.png`, `cur-sheet-categories-390.png`,
`cur-sheet-categories-320.png`; the wizard reference is `ref-wizard-step2-1440.png`.

- **No icons**, while the wizard step 2 and Browse by category both show them
  (`Pill.tsx:26-35`, `CategoryCarousel.tsx:92-101`).
- **Inherited and manual categories look the same.** Both are green-filled (`OptionChip`,
  `FilterControl.tsx:22-24`), which breaks the green/purple rule (2026-09-30): in the screenshot,
  "Beauty & Personal Care" (picked here) and the three interests (from preferences) are
  identical. Only the section's FROM PREFERENCES badge hints at provenance.
- **At 320 a long name wraps and centres** ("Agriculture, Food, Environment and Climate").
  Beside an icon that would break the icon/label pairing.

### Changes

These apply only to `OptionChip` options that carry an icon. Today that is the Categories
section, in both homes (`FiltersDialog.tsx` and `FiltersSheet.tsx`, both through
`FilterSection.tsx:92` → `FilterControl`).

- **Data:** `SectionOption` gains `imageURL?: string`, and the `categories` case
  (`useSectionModel.ts:171-179`) passes `c.imageURL`. `SectionModel` gains `inherited: string[]`
  (effective minus manual; `listModel` already has both at `useSectionModel.ts:97-98`). Both are
  presentation fields with no behaviour change, and `toggle` is untouched.
- **Pill:** `flex min-h-11 md:min-h-9 items-center gap-1.5 rounded-full border pl-2.5 pr-3
  text-left text-xs`, `py-1` so a 2-line name at 320 keeps its padding. The icon is the
  wizard's: `next/image`, 18 × 18, `h-4.5 w-4.5 shrink-0`, never tinted.
- **States (icon pills):**

  | state | classes | count |
  | --- | --- | --- |
  | unselected | `border-gray bg-white text-black hover:border-green` | `text-gray-dark` |
  | selected, this search's (manual) | `border-green ring-1 ring-green bg-white text-green font-semibold` | `text-green opacity-70 font-normal` |
  | **selected, inherited** | `border-purple ring-1 ring-purple bg-white text-purple font-semibold` | `text-purple opacity-70 font-normal` |
  | zero count | unchanged (`opacity-50`, disabled) | — |

  An inherited selected category reads as a white pill, purple outline and purple text, with its
  own icon. It is the wizard's outlined look in the preference colour. Manual wins when a value
  is both (as in `segmentTone`).
- **Pills without an icon** keep today's look (green fill), unchanged.
- **Motion:** `transition-colors duration-150 motion-reduce:transition-none`.

### Copy

None.

### Acceptance checks

- **1440 dialog, 390 and 320 sheet:** every category pill shows its icon, and none is broken.
  With the wizard answers above, the three interests are purple-outlined. Pick one more and it is
  green-outlined. Deselect an inherited one and it returns to unselected, and its chip shows as
  skipped (behaviour unchanged).
- **320:** "Agriculture, Food, Environment and Climate" wraps to 2 lines, left-aligned beside its
  icon. No pill is wider than the sheet and there is no sideways scroll.
- Other chip sections (Where, Engagement, Languages, …) look exactly as before.

### Departures

- **The inherited state on these pills goes purple.** It was green, against the 2026-09-30
  colour rule. Whether the same fix should reach the icon-less chip sections is question 3.

---

## 4. Landing rails (D)

### Current

`cur-landing-prefs-1440-full.png`, `cur-landing-prefs-390-full.png`,
`cur-landing-noprefs-1440-full.png`.

- Four fixed rails (Picked for you · Featured · Latest · Done in under an hour). At 1440 they are
  a 4-card grid with no way to see a 5th; at 390 a snap scroller of 290px cards
  (`DiscoveryRail.tsx:106-130`).
- **Featured, Latest and Under an hour show the same fixture cards** in a different order,
  because they ignore the youth's place.
- **The Picked for you subtitle lowercases names:** "tuned to job, technology, ai & data +2"
  (`DiscoveryLanding.tsx:66`).
- **At 320 the 290px card leaves about 4px of the next card**, so nothing says "scroll"
  (`cur-card-tip-320.png`).
- A rail not yet revealed is an empty gap in a full-page capture (`cur-landing-noprefs-1440-full.png`,
  Latest). That is the reveal's `opacity-0`, fine in a real scroll.

### Changes

**Structure, per rail** (`DiscoveryRail.tsx`, rendering one `LandingRail` from the catalogue):

```
<section aria-labelledby>            our header, unchanged in style
  header: [icon?] title ............ See all N →
          subtitle
  <CustomCarouselV3 id data loadData renderSlide />   no title/subtitle/viewAllUrl passed
</section>
```

- **The header stays ours, not V3's.** V3's header forces the title to `whitespace-nowrap
  shrink-0` with the subtitle inline and truncated (`CustomCarouselV3.tsx:177-184`). A category
  title ("Agriculture, Food, Environment and Climate") would be clipped at 320, and the subtitle
  lost at 390. Our header:
  - title: `font-nunito text-base md:text-lg font-black line-clamp-2`, as today
    (`DiscoveryRail.tsx:84`) plus the clamp;
  - subtitle: `text-sm text-gray-dark line-clamp-2`;
  - See all: `text-green text-xs md:text-sm font-semibold whitespace-nowrap shrink-0
    min-w-24 text-right`. `min-w-24` reserves its room before the count arrives, so the title
    never rewraps when it appears.
- **Category rails** prefix the title with the category's icon (`rail.category.imageURL`,
  20 × 20, `h-5 w-5 shrink-0`, untinted, `gap-2`), the same badge Browse by category draws. No
  other rail has an icon.
- **"See all N →"** is drawn only when `seeAllQueryString !== ""` (unchanged rule). With
  `seeAllExact === false` it reads "See all →" without the number. It fades in
  (`motion-safe:animate-[fade-in_150ms_ease-out]`) when the count arrives.
- **Header → cards gap: 12px.** Spacing between rails stays `gap-8 md:gap-10`
  (`DiscoveryLanding.tsx:85`).

**Scroller (CustomCarouselV3).** It needs three small additions. All are optional props or
guards with today's defaults, so the legacy `/opportunities` page is unchanged:

1. **Skip the header block when no header prop is given** (no `title`, `badgeText`,
   `subTextAvailable` or `viewAllUrl`). Today it always renders an empty `mb-4` div
   (`CustomCarouselV3.tsx:157`). Every legacy caller passes a title, so they are unaffected.
2. **`scrollerClassName`** (default `"flex gap-3"`, `:219`), passed through to
   `ScrollableContainer`. Discovery passes `"flex gap-3 -mx-4 px-4 pt-2 scroll-px-4 sm:mx-0
   sm:px-1"`: edge-to-edge bleed on phones as today, and top room for the card shadow. V3's
   forced `padding-bottom: 12px` (`:242`) gives the bottom room.
3. **`shadowFromClassName`**, forwarded to `ScrollableContainer`. Discovery passes
   `from-gray-light`, the page colour behind the rails (`main.bg-gray-light`), so the edge fades
   are visible. Today V3 uses the default near-invisible `from-gray-light/5`.

Also, under `prefers-reduced-motion: reduce` the drag-release snap uses
`behavior: "auto"`, not `"smooth"` (`CustomCarouselV3.tsx:136`). This is a guard, not a prop.

**Card width in the scroller** (the `renderSlide` wrapper):

| width | card | what shows |
| --- | --- | --- |
| 320 | `w-[min(18.125rem,calc(100vw-3rem))]` → 272px | one card + 20px of the next |
| 390 | same → 290px (as today) | one card + ~72px of the next |
| ≥ 640 (`sm`) | `w-72` → 288px | 768: two cards + a peek; 1440 (1248px content): four cards + ~48px of the 5th |

The card's height is unchanged and fixed (`h-71 md:h-90`, `OpportunityCard.tsx:131`). At 1440
this replaces the 4-column grid with a scroller whose 5th card peeks. That peek is the sideways
affordance.

**Sideways-load affordance** (no new UI):

- the next card peeks at every width;
- the right edge fade (`from-gray-light`) shows while there is more, and the left fade once
  scrolled;
- on desktop, V3's thin scrollbar under the row (kept as is), drag-to-scroll and the grab cursor;
- the next 20 load 300px before the end (V3's sentinel), so a youth scrolling at a normal pace
  never sees a gap. Nothing is drawn while a page loads, and the row simply gets longer.

**Before a rail loads** (placeholder, so nothing jumps):

- The header renders at once: title and subtitle come from the catalogue, and the See all room
  is reserved.
- The body reserves the scroller's exact height: card + 8px top + 12px bottom = **304px below
  `md`, 380px from `md`**. It holds one line, "Searching…", in `text-sm text-gray-dark` at the
  top-left, the copy the 2026-09-05 "one loading treatment" uses. There is no shimmer and no card
  frames (question 4).
- The rail requests its first page when it comes within ~400px of the viewport, so most rails
  are loaded before they are seen. That is the developer's hook; the visible result is that
  "Searching…" is rarely on screen.

**A rail that fails:** the header stays and the body becomes one line in its place,
`<Message kind="error">Couldn't load these. Retry</Message>` (the existing component and
retry pattern, `FilterControl.tsx:238-249`). Fetch failures are stated, never silent
(2026-09-05).

**A rail that loads empty: collapse** (recommended, question 2). The header and the reserved
body unmount at once, with no animation. Because loading starts ~400px early, a collapse almost
always happens below the fold; the browser's scroll anchoring keeps the youth's place. Today an
empty rail renders nothing (`DiscoveryRail.tsx:78`, `if (!drawn) return null`), so this keeps
that rule.

**First-reveal rise:** it stays (`DiscoveryRail.tsx:112-130`). The first time the loaded rail is
15% on screen, the **first five** cards rise 8px over 240ms, staggered 40ms; under reduced
motion it is a 150ms fade. Cards appended by sideways loading appear without animation (they
arrive off-screen).

**Accessibility:** the `section` is labelled by its title. The scroller is not a tab stop; each
card's single link scrolls into view when tabbed to (as today).

### Copy (titles and subtitles)

Every string is new, in the rail renderer (`DiscoveryRail.tsx`, or a `railCopy(rail)` helper
beside it), except where an existing line is cited.

`{place}` comes from `rail.place`:

| `rail.place` has | `{place}` |
| --- | --- |
| a city | near Cape Town |
| a region | in Western Cape |
| a country name | in South Africa |
| none of these, or `rail.place` is `null` | nothing (and the comma before it is dropped) |

Names keep their own case. **Never lowercase lookup names** (it produced "ai" today).

| kind | title | subtitle |
| --- | --- | --- |
| picked | Picked for you (`DiscoveryLanding.tsx:88`) | Because your feed is tuned to {Job, Technology, AI & Data} +N (`:91`; drop the `toLowerCase` at `:66`); without nameable values, "Because of your preferences" (`:92`) |
| near | Opportunities {near Cape Town \| in Western Cape \| in South Africa} | Every type, close to where you are |
| goal `job` | Jobs for you | Because you want to get a job{, place} |
| goal `learn` | Learning for you | Because you want to learn new skills{, place} |
| goal `event` | Events for you | Because you want to attend events{, place} |
| goal `impact` | Impact actions for you | Because you want to volunteer and give back{, place} |
| goal `biz` | Programmes to start a business | Because you want to start a business{, place} |
| category | {icon} {Category name} | One of your interests{, place} |
| commitment | Fits in {up to a month} (the interval label, first letter lowercased); "Fits your time" when it is `null` | Within the time you said you have{, place} |
| under-an-hour | Done in under an hour (`:116`) | Quick wins that fit into your day{, place} (`:117`) |
| paid | Paid opportunities | Paid or rewarded{, place} |
| featured | Featured (`:101`) | Hand-picked by the Yoma team{, place} (`:102`) |
| latest | Latest opportunities (`:108`) | Latest start dates first (`:109`) |
| (all) | See all {N} → (`DiscoveryRail.tsx:95`, unchanged); "See all →" when `seeAllExact` is false | — |
| (loading) | — | Searching… |
| (failed) | — | Couldn't load these. Retry |

At 320 the longest subtitle ("Because you want to volunteer and give back, near Cape Town")
takes 2 lines, and the clamp allows 2.

### Acceptance checks

- **1440, with the wizard answers above:** in order, Picked for you · Opportunities near Cape
  Town · Jobs for you · three category rails, each with its icon · Fits in up to a month · Paid
  opportunities · Featured. Latest collapses into "near". Each row shows four cards and a peek of
  the 5th. Dragging or shift-scrolling sideways past card ~15 loads more with no visible gap.
  The edge fades are visible on the grey page.
- **390:** one card plus a clear peek. Titles wrap to at most 2 lines and nothing overflows.
- **320:** cards are 272px with ~20px of the next card visible. A category title of 2 lines and a
  subtitle of 2 lines fit, and the page has no sideways scroll (`scrollWidth === 320`).
- **Scroll down slowly:** no rail shifts the content above it when it loads. A rail that loads
  empty is gone before it reaches the viewport.
- **Reduced motion (DevTools emulation):** cards fade, they don't rise, and the drag-release snap
  jumps instead of gliding.
- **Preferences off:** Featured · Latest opportunities · Done in under an hour, with no place in
  any subtitle.
- **The legacy `/opportunities` page** (kill-switch off) carousels look exactly as before.

### Departures

- **The rails cap of 4 (2026-10-02) and "every rail but Picked for you ignores preferences"
  are superseded** by Jason's approved catalogue (the place base layer, a rail per category).
- **The 1440 grid becomes a scroller** (2026-10-02 had a 4-column grid from `lg`). This was
  implied by the approval of CustomCarouselV3 with sideways loading.
- **V3's own header is not used.** Its one-line, no-wrap layout clips long category titles at
  320. The header stays discovery's.
- **V3's See All styling is purple** (`CustomCarouselV3.tsx:204`). Discovery keeps its green
  See all, because purple means "from preferences" on this surface.
- **CustomCarouselV3 gains two optional props and two guards** (shared component, additive,
  defaults unchanged: the epic's rule for shared building blocks). The reduced-motion guard on
  the snap also applies to the legacy page, for reduced-motion users only.
- **Card width at 320 drops 290 → 272px** so the next card is visibly there.

---

## Questions for Jason

1. **Cap the per-category rails?** A youth who picks all 16 interests gets 16 rails, 22 in all.
   **Recommend: at most 3**, in the order they were picked. "Picked for you" already covers the
   rest, and Browse by category is one tap away.
2. **A rail that loads empty: collapse, or keep a "Nothing here yet" line?** **Recommend
   collapse.** Loading starts before a rail is on screen, so a collapse happens out of sight,
   and an empty titled row is a dead end.
3. **The Filters dialog's other chip sections** (Where, Engagement, Languages, SDGs…) also show
   inherited values in green. **Recommend: fix all of them in this batch** with the same purple
   tone, as a white pill with a purple outline. It is the same `OptionChip` and one class map,
   and fixing only Categories leaves the colour rule half-applied. (The Type row's pills are
   solid purple for manual picks too, `TypeRow.tsx:108-110`. That would follow the same fix.)
4. **Rail placeholder: "Searching…" text in the reserved space, or static card frames?**
   **Recommend the text.** It matches the 2026-09-05 "one loading treatment" decision, which
   rejected skeletons. The space is reserved either way, so nothing jumps.
