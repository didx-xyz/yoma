# Detail header badges, and a plain-language copy pass (2026-10-09)

- **Input:** Jason, 2026-10-09:
  - Badges: "the badges look terrible especially on mobile. revise these badges completely. make
    it engaging and exciting. make badges expandable. add icons and informative text. add 'x days
    left' etc".
  - Copy: "revise all copy-text for easy understanding, e.g. this phrase is too complex: 'What
    providers describe, not entry requirements. Each provider decides who is suitable.'" He also
    flagged the wizard titles as wrong, e.g. "How much time…".
  - Also read: `feature.md` Decisions to 2026-10-09, and
    [`../handoffs/2026-10-09-a.md`](../handoffs/2026-10-09-a.md).
- **Status:** approved by Jason (2026-10-09), with every recommendation:
  1. **Places** follows the card's rule (D1).
  2. **Phones** get the bordered list.
  3. **"N days left"** runs up to 30 days, pink in the last 7.
  4. **Every rename is accepted**, and "verified" stays. Gender is not used to filter, so its
     caption reads "Not used to filter".
- **Surfaces:**
  - Part A: the tabbed header card's fact strip (`components/Opportunity/TabbedDetails/DetailHeaderCard.tsx`
    and `detailFacts.ts`).
  - Part B: youth-facing copy in `features/discovery/**` and `components/Opportunity/TabbedDetails/**`.
  - Paths are relative to `src/web/src/`.
- **Base:** `c86f09f2` plus the uncommitted working tree. The lead is editing the search bar, the
  wizard and results loading in parallel, so **strings are cited by file and quoted text, not by
  line number**. Re-find each one before you edit it.
- **Screens:** `~/.cache/cdp-tools/shots/designer-1009/` (machine-local). All are signed out, on
  the local stack, with the consent prompt dismissed. Phones are 2x; 1440 and 768 are 1x.

  | File | What |
  | --- | --- |
  | `f08-start-{1440,390,320}.png`, `f08-768-768.png` | Fixture 08, Event: Reward Z 200 · How "10 minutes / Remote" · Starts 8 Nov · "216 spots left" |
  | `f01-job-{1440,390,320}.png` | Fixture 01, Job: Pay USD 1 000 / mo · How On-site · Ends 8 Nov · "441 spots left" |
  | `f14-event-*.png` | Fixture 14, Event: Reward · How "5 hours / Remote" · Ends · spots |
  | `endstoday-*.png` | A seeded Other that ends today (`c06a130e…`): the header says "Ends 9 Oct" |
  | `f09-noend-*.png` | Fixture 09: the only tile is "Ends / Ongoing" |
  | `landing-*.png`, `filters-*.png` | The first-visit welcome over the landing (copy reference only) |

- **Classic is untouched.** Only the tabbed layout renders `DetailHeaderCard`.
- **No new data and no new requests** (Part A section 3 lists each field).
- **Behaviour:** the badges gain expand and collapse. Two display rules change, flagged as
  departures in section 6: the places count follows the cards' rule, and a passed deadline reads
  "Closed". Sections, actions, the sticky bars and the kill-switch are unchanged.

---

# Part A — the header badges

## A1. Current (what is wrong)

| # | Problem | Evidence |
| --- | --- | --- |
| 1 | **Half-empty rows on phones.** Three tiles with a wide How tile lay out as Reward (half) / How (full) / Starts (half), leaving two blank half-rows. With Pay it is Pay (full) / How + Ends. | `f08-start-390.png`, `f08-start-320.png`, `endstoday-390.png` |
| 2 | **No icons below 768.** The tiles are flat tinted boxes with a grey word and a bold word. | all `*-390`, `*-320` |
| 3 | **The values don't explain themselves.** "Z 200" is cryptic. "How" is vague. "Ends / Ongoing" reads as broken English. "Starts / 8 Nov" gives no sense of when that is. | `f08-*`, `f09-noend-*` |
| 4 | **No urgency.** An opportunity closing today shows "Ends 9 Oct", while the sticky bar and the cards say "Ends today". | `endstoday-1440.png` |
| 5 | **The places count is a 12px grey caption,** easy to miss. Its rule also differs from the card's (see A6). The card says "places", the header says "spots". | `f08-start-1440.png` vs `landing-1440.png` cards ("216 places left") |
| 6 | **Nothing to learn.** The only explanation is a desktop `title` tooltip on How. Touch can't reach it, and the other tiles have none. | `DetailHeaderCard.tsx` `FactTile` |
| 7 | **Rhythm.** At 1440 the three tiles stretch to 390px each, so a short value like "Z 200" floats in a big beige block. | `f08-start-1440.png` |

## A2. The design: "fact badges"

Each fact becomes a **badge**: a button with an icon, a bold self-describing value, and one
informative line beneath it. Tapping it opens more detail inline. The set and order stay as they
are, with Places added at the end:

**Pay · Reward · How · Dates · Places**

A fact the opportunity lacks drops out, as today.

### A2.1 Anatomy

**From 768 up (`md:`), as tinted cards:**

- **Badge** (`<button type="button">`):
  - shape: `rounded-[14px] p-3.5 flex items-start gap-3 text-left`, at least 88px tall, with the
    tone's tile background (A2.3);
  - icon disc: 40px, `rounded-[10px] bg-white`, holding a 20px icon in the tone's icon colour
    (the size and shape of today's disc);
  - text column (`min-w-0 grow`):
    - eyebrow label: `text-xs text-gray-dark`;
    - value: today's `TILE_VALUE` style (Nunito black, 17px from `md`). It may wrap to 2 lines,
      at spaces only;
    - info line: `text-[13px] leading-snug text-gray-dark line-clamp-2`;
    - Places only: a 4px progress bar 6px under the info line (A2.5);
  - chevron: `IoChevronDown`, 16px, `text-gray-dark`, at the top right (`shrink-0 mt-0.5`).
- **Open:** the badge gets `ring-2 ring-inset` in its tone's icon colour, and the chevron
  rotates 180°.
- **Hover** (fine pointer only): `hover:shadow-md`.

**Below 768, as one grouped list** (this replaces the tile grid):

- **Container:** `rounded-2xl border border-gray bg-white divide-y divide-gray overflow-hidden`.
- **Row** (`<button>`): `flex w-full items-center gap-3 px-3.5 py-3 min-h-14 text-left`.
  - icon disc: 36px, `rounded-[10px]`, with the tone's tile background and an 18px icon in the
    tone's icon colour;
  - text: the value at 15px Nunito black (14px below 360, as today's `max-[359px]` rule), then
    the info line at 13px `text-gray-dark`. **The eyebrow label is hidden below `md`**: each
    value is worded to stand alone, and the info line names the rest;
  - chevron on the right, as above.
- **Urgent date row:** the whole row is `bg-pink/10` (A2.3), so the deadline stands out in the
  list.
- **Height:** each row is about 62px, or about 70px with the Places bar. Five rows come to about
  330px. Today's three tiles plus the caption are about 240px at 390, but half of that is blank
  space.

**Why a list on phones:** a two-column grid leaves about 155px per badge at 390 and about 120px
at 320. That is too narrow for an icon, a value and an informative line, and it was the cause of
today's orphaned half-rows. A full-width list is the shape the detail page's sections already use
(`DetailDisclosure`). It never leaves a gap and it reads top to bottom.

### A2.2 Columns per width

| Badges | below 768 | 768–1279 (`md:grid-cols-6`) | from 1280 (`xl:`) |
| --- | --- | --- | --- |
| 1 | list | spans 3 (half width, left) | `grid-cols-4`, one cell |
| 2 | list | spans 3 + 3 | `grid-cols-4`, two cells, left-aligned |
| 3 | list | spans 2 + 2 + 2 | `grid-cols-3` |
| 4 | list | spans 3 + 3 / 3 + 3 | `grid-cols-4` |
| 5 | list | spans 2 + 2 + 2 / 3 + 3 | `grid-cols-5` |

- The gap is `gap-3`, the strip's top margin `mt-5`, and the actions' spacing as today.
- At 1440 the card's content is 1200px, so five badges are about 230px each. Pay's "USD 8 000–12 000
  / mo" then takes 2 lines, which is allowed.
- Keep the 1- and 2-badge cases at a quarter width. The 2026-10-02 rule still holds: a single
  stretched tile reads like an alert.
- `STRIP_COLUMNS`, `STRIP_COLUMNS_WITH_PAY`, `PAY_SPAN` and the wide-How rule go away for the
  public strip.
- **The admin stat strip keeps its look.** `OpportunityAdminInfo.tsx` imports `stripColumns`,
  `TILE`, `TILE_LABEL` and `TILE_VALUE`, so keep those exports exactly as they are (or move them
  into the admin file unchanged).

### A2.3 Tones (tokens only)

| Badge | Tile / row-disc background | Icon colour (and open ring) |
| --- | --- | --- |
| Pay | `bg-orange-light` | `text-yellow` / `ring-yellow` |
| Reward | `bg-orange-light` | ZLTO icon (`public/images/icon-zlto.svg`), ring `ring-orange` |
| How | `bg-blue-light` | `text-blue-dark` / `ring-blue-dark` |
| Dates, open, more than 7 days left, or no deadline | `bg-purple-tint` | `text-purple` / `ring-purple` |
| Dates, urgent (`closingInfo().urgent`: today, tomorrow, or 7 days or fewer) | `bg-pink/10` | `text-pink` / `ring-pink` |
| Dates, closed | `bg-gray-light` | `text-gray-dark` / `ring-gray-dark` |
| Places | `bg-green-light` | `text-green` / `ring-green` |
| Places, almost full (10 or fewer left, or at least 90% taken) | `bg-green-light` | `text-pink`; the bar fill is `bg-pink` |
| Places, none left | `bg-gray-light` | `text-gray-dark` |

- Pink now means **"act soon"** only: a near deadline, or few places. Today every date tile is
  pink, which dilutes it.
- The badges are not recoloured per opportunity type. The type chip above them already carries
  the type colour (`opportunityTypeTheme.tsx`), and each badge's tone carries a meaning of its
  own. The CTA keeps the type's `ctaClassName`.

### A2.4 Icons (react-icons io5, plus the existing ZLTO svg)

| Badge | Icon |
| --- | --- |
| Pay | `IoCashOutline` |
| Reward | `icon-zlto.svg` (as today, `alt=""`) |
| How | `IoTimeOutline` when the effort is known. With the engagement type alone: Remote `IoWifiOutline` (the filters' engagement icon), On-site `IoLocationOutline`, Hybrid `IoSwapHorizontalOutline` |
| Dates | `IoCalendarOutline`; `IoHourglassOutline` while urgent; `IoLockClosedOutline` when closed |
| Places | `IoPeopleOutline` |
| Chevron | `IoChevronDown` |

Every icon is `aria-hidden`.

### A2.5 Expanded state: an inline accordion (recommended over a popover)

**Why inline:**

- It works the same on touch, mouse and keyboard, and needs no outside-click, portal or Escape
  handling to avoid trapping.
- Nothing gets clipped at 320.
- It never covers the CTA.
- It reuses the page's own pattern: `DetailDisclosure`'s 0fr → 1fr height ease.
- A popover's anchoring would fight the sticky bars and the 4-line title.

**Behaviour:**

- Every badge has expandable content. **One is open at a time**: opening another closes the
  first. Tapping the open badge closes it. Everything starts closed, and the state resets when
  the opportunity changes (key the strip on `opportunity.id`).
- **Escape,** while focus is on a badge or inside its panel, closes the panel and puts focus on
  its badge.
- **ARIA:**
  - the badge: `aria-expanded`, and `aria-controls="fact-{id}-panel"`;
  - the panel: `id="fact-{id}-panel"`, `role="region"`, `aria-labelledby` the badge, and
    `inert` while closed (as `DetailDisclosure` does).
- **Accessible name:** the button's text, i.e. the value then the info line ("3 days left,
  Closes Mon 12 Oct"). Don't add an `aria-label` that drops the visible text (WCAG 2.5.3, as the
  card facts do).
- **Placement, from one DOM** (no duplicated panels): each badge and its panel sit in a wrapper
  `div`.
  - Below `md`, the wrapper is the list row, so the panel opens directly under its own row.
  - From `md` the wrapper is `md:contents`, and the panel is `md:order-last md:col-span-full`.
    So the open panel spans the card under the whole badge grid, and the open badge's ring shows
    which one it belongs to.
  - Note for the reviewer: from `md` the keyboard order is badge → its panel → the next badge,
    while the panel is drawn below the row. Only Reward's panel holds a focusable element (the
    marketplace link), so this is acceptable.
- **Panel layout:**
  - From `md`: `rounded-[14px]` in the open badge's tile tone, `p-4`, with text at 14px
    `text-black`, secondary lines `text-gray-dark`, and at most 3 short sentences plus an
    optional 2-column fact list (`dl`, `grid-cols-[auto_1fr] gap-x-4 gap-y-1`, terms in
    `text-gray-dark`).
  - Below `md`: inside the row, on white (pink tint for an urgent date),
    `px-3.5 pb-3.5 pl-[62px]` so it lines up with the row's text, and the same type sizes.

### A2.6 Motion (all `motion-safe:` / `motion-reduce:transition-none`)

| What | How | Duration |
| --- | --- | --- |
| The badges appear | `animate-[fade-in_240ms_ease-out_both]` (the keyframe in `styles/globals.css`), staggered with `animation-delay: i × 50ms` | 240ms each; the fifth starts at 200ms |
| A panel opens or closes | `transition-[grid-template-rows]` 0fr ↔ 1fr, `ease-out` | 220ms (as `DetailDisclosure`) |
| The panel's content | `animate-[fade-in_220ms_ease-out_both]` on open | 220ms |
| The chevron | `transition-transform`, `rotate-180` when open | 220ms |
| Urgent date icon | `animate-[pulse_2s_ease-in-out_3]` on the icon disc: **3 cycles, then still** (no endless motion, WCAG 2.2.2) | 6s in total |
| Places bar | width from 0 to its value after mount, `transition-[width] ease-out` | 700ms |
| Hover lift (from `md`) | `transition-shadow` | 150ms |

Under reduced motion: no fade or stagger, the panel snaps open and shut, the chevron flips at
once, there is no pulse, and the bar is drawn at its value.

### A2.7 Hydration (dates)

The relative labels depend on the youth's clock, which is why the sticky bar's deadline renders
only after mount.

- The Dates badge renders **today's absolute form** on the server and before mount, worded as
  in A4 ("Ends 8 Nov" / "Starts 8 Nov" / "No deadline").
- After mount it swaps to the relative form. It is the same number of lines, so nothing shifts.
- Use a `now` set in a mount effect, as `OpportunityDetailSections` does.
- The urgent tint and the pulse also wait for mount.

## A3. Data per badge (only fields `OpportunityInfo` already has)

| Badge | Shown when | Fields | Rules reused |
| --- | --- | --- | --- |
| Pay | `resolveMoneyBadge(moneyFactsOf(opp, currencies)).payLine` | `customFields` (Job salary keys), `rewardType`, `partnerIncentiveAmount` / `Currency`, `incentivized`; currencies from `useCurrenciesQuery()` (already loaded, same key) | `money.ts`; unchanged |
| Reward | `zltoRewardEstimate != null` | `zltoRewardEstimate`; the panel adds `cashOutClosed`, which the host already computes (`isCashOutClosed(userProfile?.payout)` in `OpportunityPublicDetails.tsx`). Pass it to `DetailHeaderCard` as a prop, plus `preview` so the marketplace link isn't a link in the editor. | `detailSectionCopy.ts` `cashOutLine` |
| How | the effort or the engagement type is known | `commitmentInterval`, `commitmentIntervalCount`, `commitmentIntervalTotalHours` (`effortLabel`), `engagementType` (`getEngagementConfig`); for an On-site panel, `countries[].city / region / name` | `detailFacts.ts` `effortLabel` |
| Dates | `status === "Active"` (unchanged) | `dateStart`, `dateEnd` | `calendarDaysUntil` and `closingInfo` (`features/discovery/lib/dates.ts`); `startsText` and `fullDate` from `cardFacts.ts` (export them, or move them to `dates.ts`) |
| Places | `cardStatus(opp, now).places !== null` | `participantLimit`, `participantCountTotal`, `participantLimitReached`, `status`, `dateEnd` | `cardStatus.ts`; the same string as the card (departure D1) |

The bar's ratio is `participantCountTotal / participantLimit`, clamped to 0–1. When anything is
taken, the bar shows at least 4% so it is visible.

## A4. Copy per badge

Values and info lines are the visible text. "Eyebrow" is shown from `md` only. Numbers use
`formatNumber` ("1 000"). Dates use `fullDate` ("Fri 9 Oct", with the year when it isn't this
year).

### Pay (eyebrow "Pay")

| State | Value | Info line | Panel |
| --- | --- | --- | --- |
| Job salary | payLine, verbatim ("USD 1 000 / mo") | "Salary from the employer" | **"USD 1 000 per month"** (the payLine with the suffix spelled out: "/ yr" → "per year", "/ mo" → "per month", "/ hr" → "per hour", "once-off" → "paid once"). "This is the pay the employer shared. Check the details with them before you accept." |
| Partner incentive | payLine ("USD 150") | "Paid by the partner, not Yoma" (replaces the inline "partner-paid") | **"USD 150"** "The partner running this pays it, not Yoma. Ask them how and when you'll get it." |
| Paid, no amount (Job) | "Paid — amount not disclosed" (verbatim) | "Ask about pay when you apply" | "This job is paid, but the employer hasn't shared how much. Ask them when you apply." |
| Paid, no amount (other types) | as above | "Ask the provider about pay" | "This opportunity pays, but the amount isn't shared. Ask the provider for details." |

### Reward (eyebrow "Reward")

| State | Value | Info line | Panel |
| --- | --- | --- | --- |
| Estimate > 0 | "{n} ZLTO" (was "Z {n}") | "Earn it when you finish" | **"About {n} ZLTO"** "ZLTO is Yoma's reward currency. You get it once your completion is verified. This amount is an estimate — you may get less if the reward runs low." Then `cashOutLine`: "Spend your Zlto in the [marketplace], or swap it for money in some countries." (only "Spend your Zlto in the [marketplace]." when Cash Out is closed) |
| 0 (depleted) | "ZLTO ran out" (was "Depleted") | "No reward left to earn" | "The ZLTO for this opportunity has run out, so finishing it now earns no Zlto. You can still take part." |

"ZLTO" is the currency's name, and "Zlto" is used in prose, as `lib/payout/copy.ts` has it. The
cash-out wording follows Part B's change to `cashOutLine`.

### How (eyebrow "How")

| State | Value | Info line | Panel |
| --- | --- | --- | --- |
| Effort + engagement | "10 minutes · Remote", on **one line** | engagement meaning: Remote "Online, from anywhere" · On-site "In person" · Hybrid "Online and in person" · another value: "How you take part" | Two short paragraphs, each with a bold lead word: **"Time:"** "About 10 minutes. It's a guide, not a deadline." **"Remote:"** "You take part online, from wherever you are." / **"On-site:"** "You go there in person{, in Cape Town, Western Cape}." / **"Hybrid:"** "Some of it is online and some in person." |
| Effort only | "10 minutes" | "Roughly how long it takes" | the Time paragraph only |
| Engagement only | "Remote" | as above | the engagement paragraph only |

- **The On-site place:** name it only when `countries` holds exactly one entry with a city or
  region: "in {city}, {region}", or "in {region}". Otherwise the sentence ends at "in person."
- **One line:** in a full-width phone row and in the `md` cards, "10 minutes · Remote" fits on
  one line (about 145px). The 2026-10-09 one-half-per-line rule was for a 100px tile, which no
  longer exists (D3).

### Dates (eyebrow "Dates"; was "Starts" / "Ends")

The day counts use `calendarDaysUntil`. "Closed" is the deadline instant, exactly as in
`closingInfo`.

| State (after mount) | Value | Info line | Tone |
| --- | --- | --- | --- |
| Start still to come | `startsText`: "Starts today" / "Starts tomorrow" / "Starts Fri" / "Starts 14 Nov" | "Closes {fullDate(end)}", or "No deadline" | purple |
| Started, no end date | "No deadline" (`closingInfo`; was "Ongoing") | "Join any time" | purple |
| Ends today | "Ends today" | "Closes {fullDate(end)}" | pink, urgent |
| Ends tomorrow | "Ends tomorrow" | "Closes {fullDate(end)}" | pink, urgent |
| 2–7 days | "{n} days left" | "Closes {fullDate(end)}" | pink, urgent |
| 8–30 days | "{n} days left" | "Closes {fullDate(end)}" | purple |
| More than 30 days | "Apply by {d MMM}" (`closingInfo`'s label) | "{n} days left" | purple |
| Deadline passed (still Active) | "Closed" | "Ended {fullDate(end)}" | grey |
| Before mount (server) | "Starts {d MMM}" / "Ends {d MMM}" / "No deadline" | the same info line, from the stored dates alone ("Closes …" / "No deadline") | purple |

**The panel** is a fact list, then at most one line:

| Term | Value |
| --- | --- |
| "Starts" / "Started" (past) | `fullDate(start)` |
| "Closes" / "Closed" | `fullDate(end)`, or "No deadline" |
| "Time left" (open, with an end) | "{n} days" / "Less than a day" (0) / "1 day" |

The closing line:

- urgent: "Don't wait — this closes soon.";
- start still to come: "It hasn't started yet. Save it so you don't miss it.";
- closed: "This opportunity has closed.";
- otherwise none.

"Time left" counts calendar days, so on the last day it reads "Less than a day", never "0 days".

### Places (new badge; eyebrow "Places"; replaces the "N spots left" caption)

| State | Value | Info line | Bar | Panel |
| --- | --- | --- | --- | --- |
| Open, none taken | `cardStatus().places`: "216 places left" | "Be one of the first" | empty track | "Up to 216 people can take part. A place is taken when someone finishes, or sends proof that's waiting to be verified." |
| Open, some taken | "441 places left" | "1 of 442 taken" | green fill | "Up to 442 people can take part. 1 place is taken so far. A place is taken when someone finishes, or sends proof that's waiting to be verified." |
| Almost full (10 or fewer left, or at least 90% taken) | "5 places left" / "1 place left" | "Almost full" | pink fill | as above |
| Full | "No places left" | "All {limit} places are taken" | full, grey | "All {limit} places are taken." |
| Closed, or no limit | no badge | | | |

The track is `bg-white`, the fill `bg-green` (`bg-pink` when almost full, `bg-gray-dark` when
full), with `h-1 rounded-full`. The bar is `aria-hidden`: the info line says the same thing in
words.

## A5. Acceptance checks

Use fixture 08 (Reward · How · Starts · Places), fixture 01 (Pay · How · Ends · Places), fixture
09 (Dates only), an opportunity that ends today (any seeded one whose `dateEnd` is today), and
fixture 14.

**At 1440:**

1. Fixture 08 shows four badges in one row (`grid-cols-4`), each with a white icon disc, an
   eyebrow, a value and an info line. It reads: Reward "200 ZLTO" / "Earn it when you finish";
   How "10 minutes · Remote" / "Online, from anywhere"; Dates "Starts {…}" / "Closes {…}";
   Places "216 places left" / "Be one of the first" with an empty bar.
2. The "216 spots left" caption is gone.
3. **Clicking Reward:**
   - a panel eases open under the row, across the card (220ms);
   - the Reward badge gets an orange ring and its chevron flips;
   - the panel holds the ZLTO text and a working "marketplace" link.
   Then clicking How closes Reward and opens How; clicking How again closes it.
4. **Keyboard:** Tab reaches every badge in order, Enter or Space toggles one, Escape closes the
   panel with focus back on its badge, and `aria-expanded` follows.
5. **The ends-today opportunity:** "Ends today" in a pink badge with the hourglass icon, pulsing 3
   times then still. The sticky bar's deadline reads "Ends today" too.
6. **Fixture 09:** one badge, "No deadline" / "Join any time", a quarter of the width, left-aligned.
7. **Fixture 01:** Pay "USD 1 000 / mo" / "Salary from the employer". Its panel reads "USD 1 000
   per month".

**At 768:** fixture 08's four badges show as 2 × 2 (`md:grid-cols-6`, spanning 3 each), and an
open panel spans both columns under the grid.

**At 390 and 320:**

8. **Fixture 08** is one bordered white list of four rows with hairlines between them. Each row
   has a 36px tinted icon disc, the value, the info line and a chevron. There are no eyebrows and
   no half-empty rows. Tapping a row opens its panel **directly under that row**, and the rows
   below move down.
9. **Fixture 01 at 320:** "USD 1 000 / mo" on one line, and "Paid — amount not disclosed" (on any
   opportunity that has it) in at most 2 lines. No word breaks mid-word.
10. **The ends-today row** has a pink background across its full width.
11. **No sideways scroll:** `scrollWidth === clientWidth` at 390 and 320, with every panel open
    in turn.
12. **Every row's tap target is at least 56px tall.**

**Under reduced motion** (`Emulation.setEmulatedMedia` with `prefers-reduced-motion: reduce`):
there is no fade, no stagger and no pulse, panels snap, and the bar is drawn at its value.

**In the console:** no hydration warnings on any of the pages above.

## A6. Departures from the current build or decisions

| # | Departure | Reason |
| --- | --- | --- |
| D1 | **Places follows the card's rule** (`cardStatus`: `participantCountTotal`, so pending completions take a place; "places", not "spots"; "No places left" shown when full). Today the header counts only completed ones (`participantCountCompleted`), hides at the limit, and says "spots". | So the header and the card never disagree. Fixture 01 already shows "441" on both only because it has no pending completions. **Jason question 1.** |
| D2 | **A passed deadline reads "Closed"** (`closingInfo`), where today it reads "Ends {date}". It is still shown only while `status === "Active"`. | The cards and the sticky bar already say "Closed". |
| D3 | **How is one line** ("10 minutes · Remote"), revising 2026-10-09's one-half-per-line rule. The wide-How and wide-Pay spans are removed. | The rule fixed a 100px tile. The phone list and the `md` cards have room for one line. |
| D4 | **The phone layout is a list,** not tiles, and every badge has an icon at every width. This revises the 2026-10-06 note "icons from `md` only". | Jason: "terrible on mobile", "add icons". |
| D5 | **Reward reads "200 ZLTO"** (was "Z 200"), and depleted reads "ZLTO ran out" (was "Depleted"). | "Z" means nothing to a new youth. |
| D6 | **The date tone is purple until it is urgent,** then pink. Today it is always pink. | Pink keeps one meaning: act soon. |
| D7 | **The `title` tooltip on How is removed.** Its text moves to the info line and the panel. | Touch can't reach a `title`. |
| D8 | **`DetailHeaderCard` gains two props,** `cashOutClosed` and `preview`, passed by `OpportunityPublicDetails` from values it already computes. | The Reward panel follows the same Cash Out and Preview rules as the Incentive section. No request is added. |

---

# Part B — plain-language copy pass

**Audience:** 16–35, across Africa, often reading English as a second language, on a phone.

**Rules applied:**

- one idea per sentence, and at most about 15 words;
- everyday words: "show / hide" over "include / leave out"; "support" over "accommodations";
  "online / in person" over "remote / on-site engagement"; "finish" over "complete";
- no em-dash clauses in body text; a full stop instead;
- say what it means for the youth;
- **every rule line stays true to the code.** Lines marked ⚠ keep a nuance the shorter version
  must not lose. Read the comment above each string before you change it.

**Tests:**

- Strings asserted in `detailSectionCopy.test.ts`, `chipModel.test.ts` and
  `preferenceMapping.test.ts` change with them.
- `railCopy` and `resultsOrder` strings may be asserted in `landingRails.test.ts` /
  `resultsOrder.test.ts`.
- Update the assertions; don't weaken them.

## B1. Priority 1 — Jason's examples and wrong titles

### Wizard (`registry/preferenceSteps.ts`)

Each step title is checked against what the step actually asks.

| Step | Asks for | Current title (quoted) | New title | Why |
| --- | --- | --- | --- | --- |
| 1 | the goal | "What brings you to Yoma?" | keep | correct |
| 2 | categories | "What are you interested in?" | keep | correct |
| 3 | skills | "What skills do you have?" | keep | correct |
| 4 | time, online/in person, AND pay | "How much time do you have?" | **"What works for you?"** | **Wrong today:** it covers three questions, and the first block repeats "How much time…" as a heading |
| 5 | place AND languages | "Your area and languages?" | **"Where are you, and what languages do you speak?"** | not a real question; 2 lines at 320, which is allowed for a title |
| 6 | support needs (+ the read-only profile block) | "Anything we should accommodate?" | **"Do you need support to take part?"** | "accommodate" is hard for ESL readers |

| Where (quoted current) | New |
| --- | --- |
| step 1 subheading "One choice only — it sets the shape of your feed, and you can change it any time." | "Pick one. We'll show you opportunities that match it. You can change it any time." |
| step 2 subheading "Pick as many as you like — these shape which categories lead your feed." | "Pick as many as you like. We'll show you opportunities in these areas." |
| step 3 subheading "Search and add skills — verified skills from your YoID count automatically." | "Search and add your skills. Skills you've earned on Yoma are added for you." |
| step 3 note "Your skills narrow jobs only: a job that asks for none of them is hidden, and one that lists no skills stays in." | ⚠ "Your skills only affect jobs. We hide jobs that need none of your skills. Jobs that don't list skills still show." |
| step 4 subheading "The most time you can give, and the ways you'd like to take part." | "How much time you have, how you want to take part, and if you want pay." |
| step 4 heading "How long" | "Time you have" (the comment says it matches the filter section's name; that name changes in B2 too) |
| step 4 note "Ones with no time commitment stay in your feed." | "Opportunities that don't say how long they take still show." |
| step 4 heading "How you take part" | "Online or in person" |
| step 4 note "Pick any that suit you. Ones that don't say how you take part stay in your feed." | "Pick any that suit you. Opportunities that don't say still show." |
| step 4 heading "Pay or rewards" | "Pay or rewards" (keep) |
| step 4 note "Leave both off if it doesn't matter. Ones with no incentive specified stay in, after the ones that match." | ⚠ "Leave both off if it doesn't matter. Opportunities that don't say still show, after the ones that match." |
| step 5 subheading "Where you're based, and the languages you're comfortable working in." | "Where you live, and the languages you understand well." |
| step 6 subheading "Opt-in, private to Yoma, and never shared with anyone." | "Only if you want to. We keep this private." |
| step 6 note "Opportunities that say No, or whose list misses something you pick, are hidden from your feed. Ones that haven't said stay in. Your needs are never shared outside Yoma — not with partners, not in credentials, not in analytics." | ⚠ "We hide opportunities that say they offer no support, or that don't offer something you picked. Ones that haven't said still show. We never share your needs: not with partners, not on your YoID, not in our statistics." |
| step 6 heading "From your profile — read, never changed here" | "From your profile" |
| step 6 note "These are used to shape your feed and are never written by this dialog." | "We use these to choose what you see. You can change them in your profile." |
| step 6 caption "Maps to: your age — shows opportunities open to it; you can switch it off per search" | "Shows opportunities for your age. You can switch this off for a search." |
| step 6 caption "Ranking only — privacy sign-off pending" | ⚠ **"Not used to filter"**. The current text is internal status shown to youth. Jason: confirm gender isn't used for anything yet (Q4) |
| step 6 caption "No filter" | "Not used to filter" |

`IdentityReadonly` seems to render signed out too ("Date of birth · Not set"). Whether it should
show signed out is a behaviour call, not part of this spec. It is flagged for the lead.

### The type-specific filter note (`components/Filters/TypeSpecificFilters.tsx`)

| Current | New |
| --- | --- |
| `TYPE_FILTERS_NOTE` "What providers describe, not entry requirements. Each provider decides who is suitable." | "These describe the opportunity. They are not entry rules. The provider decides who can join." |
| `ANY_TYPE_NOTE` "Picking a type's filter selects that type." | "Choosing one also picks its type." |

### Detail page "Additional details" (`TabbedDetails/OpportunityDetailSections.tsx`)

| Current | New |
| --- | --- |
| note "What the provider describes, not entry requirements. They decide who is suitable." | "Details from the provider. They are not entry rules. The provider decides who can join." |

## B2. Priority 2 — the Filters dialog, sheet and search-bar popovers (`registry/filterSections.ts`)

| Where | Current (quoted) | New |
| --- | --- | --- |
| `TYPE_ROW_HINT` | "Pick one or more. Each type adds its own filters." | keep |
| `typeRowGoalLine` | "Your goal also brings in {category} opportunities of any type." | "Your goal also shows all {category} opportunities, of every type." |
| `FILTER_GROUPS` how, description | "How much time you have, and whether you join remotely or in person." | "How much time you have, and if you want to join online or in person." |
| `FILTER_GROUPS` requirements, question | "Any language or accessibility needs?" | "Any language or support needs?" |
| `FILTER_GROUPS` requirements, description | "The languages you can take part in, and the accommodations you need." | "Languages you understand, and any support you need." |
| where, nullRule | "Ones that don't name a region or city stay in. Your country from your preferences also brings in worldwide ones, except in a distance search." | ⚠ "Opportunities that don't give a region or city still show. If your country comes from your preferences, worldwide ones show too, but not in a distance search." |
| engagement, label | "Engagement" | **"Online or in person"** (the chip group too: B4) |
| engagement, nullRule | "Picked here, opportunities that don't say how you take part are left out. From your preferences, they stay in." | ⚠ "If you pick here, we hide opportunities that don't say. If it comes from your preferences, they still show." |
| time, label | "How long" | "Time you have" |
| time, nullRule | "Opportunities that don't state a time commitment stay in your results." | "Opportunities that don't say how long they take still show." |
| accessibility, label | "Accessibility" | keep (a known word, and the details page uses it) |
| accessibility, question | "Need accommodations?" | "Do you need support to take part?" |
| accessibility, nullRule | "Needs every accommodation you pick; ones that say No are left out. Picked here, so are ones with no list; from your preferences, they stay in." | ⚠ "Shows only opportunities that offer everything you pick, and hides ones that say No. If you pick here, ones that don't say are hidden too. From your preferences, they still show." |
| language, nullRule | "Shows opportunities in any language you pick. Ones that don't list a language are left out." | "Shows opportunities in any language you pick. We hide ones that don't list a language." |
| pay, label | "Paid and rewards" | "Pay and rewards" |
| pay, question | "Should it pay or reward you?" | "Do you want pay or a reward?" |
| pay, nullRule | "Opportunities that haven't specified an incentive stay in, listed after the ones that match." | ⚠ "Opportunities that don't say if they pay still show, after the ones that match." |
| skills, hint | "The skills in your preferences already narrow jobs; jobs that list no skills stay in." | "Your saved skills already affect jobs. Jobs that don't list skills still show." |
| skills, pendingNote | "Coming soon — you can't pick skills here yet." | "Coming soon. You can't pick skills here yet." |
| sdgs, label | "SDGs" | "Global goals" |
| sdgs, nullRule | "Opportunities that don't name a goal stay in your results." | "Opportunities that don't name a goal still show." |
| provider, hint | "The provider named on the opportunity — type part of it, e.g. KFC." | "Type part of the provider's name, for example KFC." |
| provider, nullRule | "Opportunities that don't name a provider are left out." | "We hide opportunities that don't name a provider." |

**Other filter strings:**

| File | Current | New |
| --- | --- | --- |
| `lib/location.ts` `DISTANCE_NOTE` | "Distance only finds opportunities that have a mapped city — many don't have one yet." | "Distance only finds opportunities with a city on the map. Many don't have one yet." |
| `components/Filters/WhereControl.tsx` | "Region, city and distance need a country — not Worldwide." | "Region, city and distance need a country. Worldwide doesn't count." |
| `components/Filters/useSectionModel.ts` notice | "Jobs do not carry ZLTO." | "Jobs don't give ZLTO." |
| `components/Filters/FilterSection.tsx`, `FilterSectionGroup.tsx` title attr | "This search inherits a value here from your preferences" | "This comes from your preferences" |
| `components/Filters/PreferencesBlock.tsx` | "No preferences yet. Set them once and every search uses them." | "No preferences yet. Set them once and we'll use them on every search." |
| `components/Filters/PreferencesBlock.tsx` | "Removing one here does not change your profile. Tap the arrow to put it back." | "Removing one here doesn't change your profile. Tap the arrow to bring it back." |
| `components/Filters/PreferencesBlock.tsx` | "Switched off for this search. Your profile has not changed." | "Off for this search. Your profile hasn't changed." |
| `components/Personalize/blocks/AccessibilityBlock.tsx` placeholder | "Describe the accommodation you need" | "Describe the support you need" |
| `components/Personalize/PersonalizeDialog.tsx` | "Tell us what you need under Other, or deselect it, before finishing." | "Tell us what you need under Other, or untick it, before you finish." |

## B3. Priority 3 — the hero, banners, results and wizard panels

| File | Current (quoted) | New |
| --- | --- | --- |
| `components/Discover/DiscoverySurface.tsx` | "Refine your search with the filters" | "Use the filters to narrow your search" |
| same | "Your preferences shape these results — adjust any chip below" | "These results use your preferences. Change them below" |
| same | "Switch your preferences off any time — this search only" | "You can switch your preferences off for this search" |
| same | "Set your preferences once — every search uses them" | "Set your preferences once. Every search uses them" |
| same | "Opportunities across jobs, learning, events and more" | keep |
| `components/shared/PreferenceBanner.tsx` | "Tell us what you're looking for — set once, used on every search. Your YoID is never touched." | "Tell us what you're looking for. We'll use it on every search. It doesn't change your YoID." |
| same | "Set once, used on every search. Your YoID is never touched." | "Used on every search. It doesn't change your YoID." |
| same | "Preferences switched off for this search. Your profile has not changed." | "Your preferences are off for this search. Your profile hasn't changed." |
| same | "{n} preferences are off for this search. Keep them off from now on?" | keep |
| same, button | "Make this my default" | "Save as my default" |
| `components/Results/CurrentFilters.tsx` | "For this search only. Your preferences don't change." | keep |
| `components/Results/NoMatches.tsx` | "No matches — yet" / "Nothing matches this search." | "Nothing here yet" / "Nothing matches this search." |
| same | "Your preferences may be too narrow for this search. Try it without them — nothing is changed in your profile." | "Your preferences may be hiding results. Try searching without them. Your profile won't change." |
| same | "Remove a filter or two, or clear them all — your preferences stay as they are." | "Remove a filter or two, or clear them all. Your preferences stay the same." |
| same | "Check the spelling, or try a shorter or broader word." | "Check the spelling, or try a shorter or more general word." |
| `components/Results/IncentiveDivider.tsx` | "Incentive not specified" | "Pay or reward not stated" (the second line, "These opportunities don't match your pay filter.", is Jason's wording: keep it) |
| `lib/resultsOrder.ts` | "Jobs don't carry ZLTO, so they're shown newest first." | "Jobs don't give ZLTO, so they're sorted newest first." |
| `components/shared/CountFooter.tsx` | "Count unavailable right now." | "Can't count results right now." |
| `components/Personalize/LiveCountPanel.tsx` | "Couldn't count matches right now — your answers still save." | "We can't count matches right now. Your answers will still be saved." |
| same | "That's a narrow feed — consider widening a choice or two." | "Only a few match. Try changing a choice or two." |
| same | "Tuning your feed" | "Your feed" |
| same | "Every step is optional and nothing is locked. These are saved as search preferences — your YoID is untouched, and only the place you pick is added to your profile." | ⚠ "You can skip any step and change your answers later. They don't change your YoID. Only the place you pick is saved to your profile." (keep the place exception: the comment explains why it is there) |
| `components/shared/KeepAnswersPrompt.tsx` | "They become your saved preferences and shape every search." | "We'll save them and use them on every search." |
| same | "They will be added to your saved preferences — nothing you saved is removed." | "We'll add them to your saved preferences. Nothing you saved is removed." |
| `components/Personalize/WelcomeStep.tsx` | "Tap "Get started" to choose your preferences and narrow down your feed. Every step is optional." (the lead is editing this; the live build adds "Don't be overwhelmed!") | "Tap "Get started" and tell us what you want. We'll show you what fits. Every step is optional." |

## B4. Priority 4 — chips, rails, sort

| File | Current (quoted) | New |
| --- | --- | --- |
| `lib/chipGroups.ts` `PREF_GROUPS.engagement`, `FACET_GROUPS.engagementTypes` | "Engagement" | "How" (chip "How: Remote", matching the How section and the search bar) |
| `lib/chipGroups.ts` `FACET_GROUPS.sdgs` | "SDGs" | "Global goal" (singular, like every one-value chip since 2026-10-08) |
| `lib/chipGroups.ts` `JOB_SKILLS_NOTE` | "Skills you added or earned by completing opportunities. Jobs that ask for none of these are left out; jobs that list no skills stay in. Other types aren't affected." | ⚠ "Skills you added, or earned by finishing opportunities. We hide jobs that need none of them. Jobs that don't list skills still show. Other types aren't affected." |
| `lib/chipGroups.ts` `JOB_SKILLS_INAPPLICABLE_NOTE` | "Not applied — this search has no jobs." | "Not used: this search has no jobs." |
| `lib/chipGroups.ts` `ACCESSIBILITY_NOTE` | "Leaves out opportunities that say No, or whose list misses one of your needs. Ones that haven't said stay in." | ⚠ "Hides opportunities that say No, or that miss one of your needs. Ones that haven't said still show." |
| `lib/chipGroups.ts` `COUNTRY_NOTE` | "Also includes opportunities open worldwide, except in a distance search." | "Also shows worldwide opportunities, but not in a distance search." |
| `lib/chipModel.ts` `locationNote` | "Not applied — this search uses the place you picked here." / "…covers every country." / "…pick one country to use your place." / "…this search is for {country}." | the same, with "Not used:" in place of "Not applied —" |
| `components/Discover/railCopy.ts` | "Because your feed is tuned to {values}" | "Based on your choices: {values}" |
| same | "Latest start dates first" | "Newest start dates first" (still true: the API orders by start date, 2026-10-06 (b)) |
| same | "Within the time you said you have" | "Fits the time you said you have" |

## B5. Priority 5 — the detail page sections (`TabbedDetails/`)

| File | Current (quoted) | New |
| --- | --- | --- |
| `OpportunityDetailSections.tsx` title | "Incentive" | ⚠ "Pay and rewards" (the admin pages show the same section) |
| same, Skills note (not Job) | "Skills you'll build by completing this. They're added to your YoID." | ⚠ "Skills you'll gain by finishing this. They're added to your YoID once it's verified." |
| same, title | "Targeted groups" | "Who it's aimed at" |
| same, note | "Who this is aimed at. It doesn't limit who can take part." | "It's aimed at these groups, but others can take part too." |
| same, note | "The UN global goals that taking part helps towards." | "The UN global goals this helps with." |
| same, note | "What this opportunity offers people with disabilities." | "Support this opportunity offers people with disabilities." |
| `detailSectionCopy.ts` `incentiveCopy` | "The provider hasn't said whether this pays or rewards." (admin) | "The provider hasn't said if this pays or gives a reward." |
| same | "You earn Zlto once your completion is verified. The amount isn't shown for this opportunity." | "You get Zlto once your completion is verified. The amount isn't shown." |
| same | "An estimate. You earn it once your completion is verified, and you may get less if the reward pool runs low." | "This is an estimate. You get it once your completion is verified. You may get less if the reward runs low." |
| same | "This opportunity's ZLTO reward pool has run out, so completing it now earns no Zlto." | "The ZLTO for this opportunity has run out, so finishing it now earns no Zlto." |
| same | "Offered and paid by the partner that runs this opportunity, not by Yoma. Ask them how and when it's paid." | "The partner running this pays it, not Yoma. Ask them how and when you'll get it." |
| same | "The partner that runs this opportunity offers an incentive. Ask them for the details — Yoma doesn't pay or process it." | "The partner running this offers a reward. Ask them for details. Yoma doesn't pay it." |
| same `cashOutLine` | ", or cash it out for real money in supported countries." | ⚠ ", or swap it for money in some countries." (keeps the hedge: Cash Out depends on the country) |
| same `accessibilityNote` | "The provider says it offers no accessibility accommodations." | "The provider says it can't offer support for people with disabilities." |
| same | "The provider hasn't said whether it offers accessibility accommodations." | "The provider hasn't said if it offers support for people with disabilities." |
| same | "The provider can arrange support if you ask. Ask them what's possible before you start." | keep |
| same `accessibilityClosing` | "These aren't in place by default. Ask the provider to arrange what you need before you start." | keep |

Kept as they are (already plain): "Roughly how long it takes. It's a guide, not a deadline.",
"Skills this job asks for. Mention the ones you have when you apply.", "The languages you can
take part in.", "Where this opportunity is available.", "What this opportunity is about.", the
age notes, "No pay, ZLTO or other reward.", "This job is paid. The employer hasn't shared the
amount.", and the tab labels.

**Kept on purpose:** "verified". It is Yoma's own word for an approved completion, and youth see
it on their YoID and in "Pending verification". A plainer synonym on this page alone would read
as a different thing.

## B6. Acceptance checks (copy)

1. Every "New" string in B1–B5 appears verbatim, and no "Current" string remains in those files.
2. At 320, wizard step 5's title takes at most 2 lines. "Save as my default" and "Search without
   my preferences" take at most 2 lines.
3. The unit tests that assert any of these strings are updated and pass.
4. The ⚠ rule lines still describe the code's behaviour. The reviewer checks each against the
   comment above it.

---

## Questions for Jason

1. **Places on the details page:** use the card's count (pending completions take a place, the
   word "places", and "No places left" shown when full) instead of today's completed-only "spots",
   which hides at the limit? *Recommended: yes, so the card and the page always agree.*
2. **The phone layout:** one tidy list with a row per badge (about 330px for five, every row
   tappable and expanding in place), or a swipeable row of badge cards (shorter, but hides some
   facts off-screen)? *Recommended: the list.*
3. **"x days left" range:** show "{n} days left" for up to 30 days (pink only in the last 7), and
   "Apply by 8 Nov" beyond that? *Recommended: yes. The cards keep their 7-day rule.*
4. **Renames that touch named concepts:**
   - "Engagement" → "Online or in person" (section) / "How" (chip);
   - "Incentive" → "Pay and rewards" (details section);
   - "SDGs" → "Global goals";
   - "Targeted groups" → "Who it's aimed at";
   - wizard step 4 → "What works for you?";
   - gender's caption "Ranking only — privacy sign-off pending" → "Not used to filter" (please
     confirm gender isn't used yet).

   *Recommended: accept all, and keep "verified" as is.*
