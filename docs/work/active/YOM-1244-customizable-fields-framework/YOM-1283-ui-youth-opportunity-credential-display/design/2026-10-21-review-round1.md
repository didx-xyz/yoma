# Design review, round 1 of 2 — the built pages against the opportunity detail page

- **Date:** 2026-10-21 · **Role:** designer · **Reference:** `/opportunities/a6d4831b-07b4-4a4b-a973-49020c2c361d`
  (Impact Action, Pending verification for testuser)
- **Captured:** 1440, 768, 390, 320, signed in as testuser (approved), headless Chrome on the throwaway slot.
  Shots in `~/.cache/cdp-tools/shots/2026-10-21-design-r1/` (paths below are relative to it).
- **Scope:** presentation, copy and motion only. Behaviour, filters, mappings and the Decisions in
  `YOM-1283/feature.md` and `YOM-1255/feature.md` (2026-10-20/21) stand; nothing below asks for new
  API data unless marked **API-gated**.
- **Headless caveat:** the browser has no emoji font, so every emoji renders as a tofu box (▯) in
  the shots. Where I call out an emoji it is because the io5-only decision (2026-10-20, answer 1)
  already covers that surface, not because of the box.

## The reference language (what everything else is measured against)

`ref-detail-1440.png`, `ref-detail-390.png`, `ref-pending-dialog-1440.png`, `ref-pending-dialog-390.png`

- **Hero/header card:** purple band, a white card with the type chip (`typeBadgeClass`), eyebrow
  organisation line, Nunito black title, fact pills, then one solid green primary and outline-green
  secondaries (`rounded-full`, `h-10`).
- **Sections:** `DetailDisclosure` — `rounded-[18px] border-gray` white cards, a 40 px tinted icon
  square (`TONE.*`), `text-[15px] font-extrabold` title with ` · count` in `text-gray-dark`, a
  one-line grey preview; groups sit under `text-[11px] font-bold tracking-widest uppercase`
  eyebrows. Chips inside are `bg-green-light text-green rounded-full px-3 py-[5px] text-[13px] font-bold`.
- **Dialogs (submitted / pending):** plain white sheet, 80 px tinted icon circle in the type colour,
  `font-nunito text-2xl font-black` heading, one-sentence body, eyebrow + `TONE` rows, outline +
  solid `rounded-full` buttons, ghost circle close.
- **Sticky panel:** white bar under the navbar with the tab pills.

---

## 1. Opportunity detail page + "Upload your completion files"

Shots: `ia-detail-1440.png`, `ia-detail-390.png`, `ia-sticky-390.png`, `ia-form-open-1440.png`,
`ia-form-open-1440-s1.png`, `ia-form-errors-1440-s1.png`, `ia-form-errors-1440-s2.png`,
`ia-form-open-390.png`, `ia-form-open-390-s1.png`, `ia-form-errors-390.png`, `ia-form-errors-390-s1.png`,
`ent-form-open-1440-bottom.png` (Entrepreneurship: "Where is your business?" section),
`ref-pending-dialog-{1440,390}.png`. Opportunities used: `48935af2…` (Impact Action, 4 proof types),
`eb6de6c5…` (Entrepreneurship).

**Matches the reference:** the header card, the outline-green Upload button in the header, the desktop
sticky bar and the phone bottom bar (link line), the four `DetailDisclosure` sections with status lines,
the error summary (red `FormMessage`, one underlined link per field), red italic field errors, the
pending dialog. At 390 the form reads well; nothing overflows at 320.

**Differs from the reference:**

- **The form's chrome is the old dialog's, not the redesigned one** (`ia-form-open-1440.png` vs
  `ref-pending-dialog-1440.png`): a solid `bg-green` strip with `shadow-lg`, a white circle holding an
  orange `IoSparkles` overlapping it, an Open Sans `text-xl font-bold` heading, and square `btn`
  Close/Submit. The submitted and pending dialogs that bracket this form already use the white sheet,
  the type-tinted circle, the Nunito heading and `rounded-full` buttons — the youth sees three dialogs
  in two languages in one flow.
- **The box fills the viewport at 1440×900** (`md:max-h-[900px] md:w-[700px]` — the same height as the
  viewport): no top/bottom inset, so it reads as a page, not a sheet; the pending dialog sits inset.
- **An all-optional form submits an empty completion.** On an opportunity with no proof types
  (`43480a94…`, Impact Action with one optional custom field) Submit on an untouched form sent
  `PUT /myopportunity/action/{id}/verify` with `customFields: []`; the API returned **500** and the
  youth sees "An unknown error has occurred". Nothing was recorded (500, no row). Behaviour, not
  presentation — recorded here for the lead; see Questions.
- Minor: the map's controls (Map/Satellite, fullscreen, pegman) appear on the Entrepreneurship form
  but not the Impact Action one (timing of the Maps script; cosmetic).

## 2. `/opportunities/discover` — landing and results

Shots: `disc-landing-{1440,768,390,320}.png`, `disc-landing-1440-featured.png` (scrolled),
`disc-results-{1440,768,390,320}.png` (`?all=1&prefsOff=1`).

**Matches:** the hero, the quick-search pills, the segmented search bar, the category pills, the
preferences panel, the results heading / sort / view, the cards (band, chip, title, facts, type-coloured
action), the "Previous · Page 1 of 142 · Next" pager, the "No matches" empty state with its outline +
solid pair. This page is the source of the card and pill language; nothing to change here.

**Notes:** the Featured rail is blank in the full-page captures only because its cards are `opacity-0`
until the rail intersects at `REVEAL_THRESHOLD` (`DiscoveryRail.tsx:88-108`); scrolled into view it
draws (`disc-landing-1440-featured.png`). Not a defect. The sticky "Filters" button overlaps the rail
headings when scrolled — pre-existing, out of scope. At 768 the site navbar's links overflow ("…etplace")
on every page — pre-existing, outside this epic.

## 3. `/yoid` — overview

Shots: `yoid-overview-{1440,768,390,320}.png`, `yoid-overview-1440-sticky.png`.

**Matches:** the hero band on the purple with the world map, the chip row, the sticky chip bar (white,
`shadow-md`, pinned under the navbar, current chip solid green), the five `DetailDisclosure` cards with
`TONE` squares, ` · count` on Passport and Skills, blurb notes, "Open … →" feet, the green inset edge on
the section under the bar, the CV static row.

**Differs — the section bodies are the old tiles, dropped into the new cards:**

- **Passport body** (`PassportCard.tsx`): a 50 %-opacity passport-stamp PNG beside two rows that read
  "💳 Identity 1" and "🏆 Opportunities 129" as grey daisyUI `badge-xs` chips. Three languages collide:
  emoji (io5-only decision), a decorative image the reference never uses, and labels that disagree with
  the passport page one tap away ("YoID Identity", "Other opportunities", type chips with counts).
- **Opportunities body** (`OpportunitiesSummary.tsx`): four 96 px circles with an orange conic ring
  (`#F9AB3E` / `#387F6A` inline hex, not tokens) and an emoji before each count ("✅ 44", "💖 31" — the
  tofu in the shots). "View graph" is an underlined grey text button floating top-right — no other
  surface uses an underlined toggle; the detail page and discovery use pills.
- **Wallet body** (`WalletCard.tsx:50-65`): an italic "*ZLTO* - Your digital wallet for rewards." line
  with a lone ⓘ, directly under the card's own note "ZLTO you earn by completing opportunities — spend it
  in the marketplace." Two intros for one card; the italic bold is the only italic on the page.
- **Skills body** (`SkillsCard.tsx:9-10`): square `rounded px-2 py-1 text-xs` chips, while the reference's
  `ChipList` chips (and the completed card's "Skills developed") are `rounded-full … text-[13px] font-bold`.
  "+71 more" is a bare text link; the reference says "Show all N".
- **Greeting** (`Layout/YoID.tsx:183-191`): the time-of-day emoji (☀️/🌙) still leads the `h1` — the
  only emoji left in a header after the 👋 was removed. Flagged as a question, not a task (the
  2026-10-20 answer kept "the greeting's emoji"; the 2026-10-21 fix list says "no 👋").
- **Column:** the overview is `max-w-4xl` (896 px) while every subpage and the sticky bar are
  `max-w-7xl`. Acceptable — a single column of disclosures reads better narrow — but at 1440 the chips in
  the sticky bar centre on a wider axis than the cards. Left as is; see Questions.

Responsiveness: fine at 768/390/320; the chip row scrolls with the fade; circles go 2 × 2 at 390.

## 4. `/yoid/wallet`

Shots: `yoid-wallet-{1440,768,390,320}.png`.

**Matches:** breadcrumb, `YoIDIntro` card (white, green ⓘ, green links), `TileHeader` (Nunito + io5 icon —
discovery's rail-header language, accepted in place of the reference's eyebrows), the "still being set up"
panel (green clock, bold line, grey body, link), skeletons.

**Differs:**

- **"My Wallet" is a 400 px card with ~90 px of empty white under the ledger** (`YoIDTile` default
  `bodyClassName="min-h-[185px]"`, `className="w-full md:max-w-[25rem]"` at `wallet/[[...query]].tsx:240-244`):
  the only card on any page with dead space, and the only one narrower than its row.
- The same redundant italic "ZLTO - …" line + ⓘ as the overview (the intro card above it already says it).
- At 390 the ledger's dashed leaders read fine; the card's dead space grows (`yoid-wallet-390.png`).

## 5. `/yoid/passport`

Shots: `yoid-passport-{1440,768,390,320}.png`.

**Matches:** intro card, type chips with counts (`PILL_*`), group headings with the type dot and count,
"See all →", the credential cards (band, chip, "Verified" badge, title, issuer, "Issued …", type-coloured
"View credential"), Load more + "Showing 100 of 130 credentials". This is the best-aligned page.

**Notes:** "YoID Identity 1+" — the "+" on a group that cannot grow reads as a glitch (a youth has one
identity credential). Exact per-type counts are **API-gated** (feature.md 2026-10-21); see Questions.
A one-off 1045 px `scrollWidth` showed on the first 390/320 load (the off-canvas user menu during
hydration); on reload `scrollWidth` = 390 — not reproducible, no task.

## 6. `/yoid/skills`

Shots: `yoid-skills-{1440,768,390,320}.png`.

**Matches:** breadcrumb with the count, intro card, grid (`CARD_GRID_CLASS`), skeleton.

**Differs:** 79 identical `shadow-custom` tiles, each "Name / Skill issued by 1 partner / one 32 px logo",
`min-h-28` with the logo pushed to the floor by `mt-auto` — a wall of white with three facts repeated 79
times, no grouping, no scanning aid. The reference never spends a card on one fact. A real fix (group by
partner or letter, a filter chip row) is a redesign — **deferred**. A one-batch improvement is in the tasks:
tighten the tile so the page is half as tall and the logo sits beside the partner line.

## 7. `/yoid/opportunities/{completed,pending,declined,saved}`

Shots: `yoid-opp-completed-{1440,768,390,320}.png`, `yoid-opp-completed-320-top.png`,
`yoid-opp-completed-320-card.png`, `yoid-opp-pending-{1440,768,390,320}.png`,
`yoid-opp-pending-390-card.png`, `yoid-opp-declined-{…}.png`, `yoid-opp-saved-{…}.png`.

**Matches:** breadcrumb, the banner above the sub-tab pills (per Jason), pills with counts, "Showing 12 of
44 completed" in the results-heading type, the cards (band, chip, status badge, title, organisation,
summary, "Completed/Submitted {date}", "Comment:", "Skills developed", type-coloured action, outline
download button), 320 single column.

**Differs:**

- **Completion custom fields on the card** (`CustomFieldsView.tsx:259-270`, `wrapValues`): from `sm` the
  row is label-left / value-right-aligned **bold** — "Impact Achieved:   Lorem ipsum dolor sit amet…" wraps
  ragged against the right edge of a 280 px card (`yoid-opp-pending-1440.png`, first card); at 390 the
  value is bold and heavier than the title (`yoid-opp-pending-390-card.png`). The card's own "Comment:"
  row is the model: bold label, grey normal value.
- **Dates in those fields are the input format** ("Employment Start Date: 2026-10-14",
  `yoid-opp-completed-1440.png`) next to "Completed 21 Oct 2026" — `CustomFieldsView.tsx:216-217` runs
  `utcToDateInput`, which is the `<input type=date>` format, not `DATE_FORMAT_HUMAN`.
- **Two info-row styles on one page:** the "Just completed an opportunity?" banner is `FormMessage` Info
  (thin grey border, no shadow, `text-xs`) while the intro on every other Yo-ID page is the `YoIDIntro`
  card (`shadow-custom rounded-xl p-4 text-sm`). Same again on the add page's bottom "Note:".
- **Three pagers in the product:** discovery's "Previous · Page 1 of 142 · Next" pills, the passport's
  Load more, and here the legacy round « » buttons with a page input (`PaginationButtons`). The round
  pager is the only one not in the pill language.

## 8. `/yoid/opportunities/add`

Shots: `yoid-opp-add-{1440,768,390,320}.png`.

**Matches:** intro card with three green links, "Recently viewed 2 486" rail header with blurb, the grid
of cards with "Viewed {date}", Load more + "Showing 12 of 2 486 viewed opportunities".

**Differs:**

- **The search is a 400 px input with a grey square button** (`add.tsx:151-156`): the only grey primary
  on any page; discovery's search is a segmented bar and every other submit on the page is green.
- The bottom "Note: If the opportunity requires verification…" is a second `FormMessage` Info row under
  the grid, 1 400 px from the intro that should carry it.

---

## Developer tasks — one batch, ordered by impact

Each: files → change → acceptance. Classes are Tailwind v4 / tokens from `styles/colors.css`.

1. **Completion form: the redesigned dialog chrome.**
   `components/Opportunity/OpportunityCompletionEdit.tsx:1162-1199` (header + badge + heading),
   `:1302-1318` (buttons); `components/Opportunity/OpportunityPublicDetails.tsx:113-124` (`DIALOG_*`),
   `:1096` (modal class).
   - Export `DIALOG_BODY`, `DIALOG_CLOSE`, `DIALOG_ICON_CIRCLE`, `DIALOG_HEADING`, `DIALOG_PRIMARY`
     and a new `DIALOG_SECONDARY = "btn border-green text-green hover:bg-green-dark w-full rounded-full
     bg-white normal-case hover:text-white"` from one module (`components/Opportunity/dialog.ts`) so the
     form and both dialogs share them; the form receives `typeTint` (`typeBandClass(type) +
     typeOutlineClass(type)`) from `OpportunityPublicDetails` as the success dialog does.
   - Replace the `bg-green … shadow-lg` strip + overlapping white circle with the pending dialog's top:
     `<div className="flex justify-end p-3">` ghost close (`DIALOG_CLOSE`), then the
     `DIALOG_ICON_CIRCLE ${typeTint}` circle holding `IoSparkles` (`h-10 w-10`, keep the
     `motion-safe` pop + wiggle on the circle/icon), heading in `DIALOG_HEADING`, body
     `text-gray-dark text-sm md:text-base`. Keep the `rise-in` body animation.
   - Buttons: Close → `DIALOG_SECONDARY`, Submit → `DIALOG_PRIMARY`; keep the icons; `md:flex-1`.
   - Modal: `md:max-h-[900px]` → `md:max-h-[calc(100vh-3rem)]` so the sheet is inset top and bottom
     at 900 px tall viewports.
   - Accept: `ia-form-open-1440` re-shot shows no green strip; the circle is the Impact Action tint
     (`bg-type-impact-action/10 text-type-impact-action`), the heading is Nunito, Close/Submit are
     rounded pills matching `ref-pending-dialog-1440.png`; the box has ≥ 24 px above and below at
     1440×900; at 390 the sheet is unchanged in height behaviour (scrolls inside).

2. **Overview Passport body: pills, no stamp, no emoji.**
   `components/YoID/PassportCard.tsx`.
   - Remove the `stamp1` image and the emoji. Render one line of pills, one per summary row, in the
     passport page's chip language: `<Link href={YOID_TABS.passport.url} className={`${PILL_CLASS}
     ${PILL_TOUCH_CLASS} ${PILL_IDLE_CLASS}`}>` with a 10 px dot `rounded-full ${typeBadgeClass(key)}`
     (key `YOID_TYPE` for `schemaType === "YoID"`, else `OTHER_TYPE` — the summary has no per-type
     split; exact per-type counts are **API-gated**), the label (`credentialTypeLabel(types, YOID_TYPE)`
     → "YoID Identity"; the Opportunity row → "Opportunities"), then the count in `PILL_COUNT_CLASS`.
     The sentence above stays (`text-gray-dark text-sm`). Empty state keeps `NoRowsMessage` but drop
     the 🤝 and 🌐 (`IoIdCardOutline` via the `icon` prop).
   - Accept: the Passport section shows "● YoID Identity 1" and "● Opportunities 129" pills that open
     `/yoid/passport`; no image, no emoji; 390 wraps to two rows cleanly.

3. **Overview Opportunities body: io5 icons, tokens, a pill toggle.**
   `components/YoID/OpportunitiesSummary.tsx:6-62,76-91`, `pages/yoid/index.tsx:349-357`,
   `components/Layout/YoIDOpportunities.tsx:32-61`.
   - Move `SUB_TABS` to `components/YoID/yoidTabs.ts` (export `YOID_OPPORTUNITY_TABS`) and give each
     summary circle the tab's `icon` (`IoCheckmarkCircleOutline`, `IoTimeOutline`,
     `IoCloseCircleOutline`, `IoHeartOutline`, `h-4 w-4` before the count) instead of `emoji`.
   - `background`: `conic-gradient(from 180deg, var(--color-orange) N%, var(--color-green) 0)`.
   - "View graph / View summary" → a pill: `${PILL_CLASS} min-h-9 ${graphView ? PILL_PRESSED_CLASS :
     PILL_IDLE_CLASS}` with `aria-pressed`, `IoStatsChartOutline h-4 w-4`, label "Graph"; keep it
     right-aligned.
   - Accept: no tofu/emoji in the circles at any width; the toggle is a pill that shows the pressed
     state while the graph is up.

4. **Card custom fields: stacked rows, grey normal values, human dates.**
   `components/Opportunity/CustomFieldsView.tsx:216-217, 258-270`.
   - `wrapValues` rows: `flex flex-col gap-0.5` only (drop `sm:flex-row sm:items-baseline
     sm:justify-between sm:gap-4` and `sm:text-right`); label `font-semibold text-black`; value
     `text-gray-dark wrap-break-word` (no `font-bold`). The detail page's non-wrapping branch is untouched.
   - DateTime values: format with `DATE_FORMAT_HUMAN` (`Moment`/`moment(raw).utc().format(...)`), not
     `utcToDateInput`, in both branches.
   - Accept: the pending card reads "Impact Achieved:" over a grey wrapped value (left-aligned) at 1440
     and 390; the completed Job card reads "Employment Start Date: 14 Oct 2026".

5. **One info-row style on Yo-ID: the `YoIDIntro` card.**
   `components/Layout/YoIDOpportunities.tsx:83-94`, `pages/yoid/opportunities/add.tsx:234-240`.
   - Sub-pages: replace the `FormMessage` Info banner with `<YoIDIntro>Just completed an opportunity?
     <Link className={INTRO_LINK_CLASS} href="/yoid/opportunities/add">Add it to your Yo-ID</Link></YoIDIntro>`.
   - Add page: delete the bottom `FormMessage`; append its sentence to the intro card as
     "If the opportunity needs verification, submit your proof first; it is added once approved."
   - Accept: every Yo-ID page has exactly one white intro card under the breadcrumb and no bordered
     grey rows; the add page ends at Load more.

6. **Wallet: drop the duplicate ZLTO line, fill the card, full width.**
   `components/YoID/WalletCard.tsx:49-65`, `pages/yoid/wallet/[[...query]].tsx:240-248`,
   `pages/yoid/index.tsx:289-298`.
   - Remove the italic "ZLTO - Your digital wallet for rewards." span and its ⓘ button; under the
     ledger add `<button type="button" className={INTRO_LINK_CLASS}>What is ZLTO?</button>` opening
     `ZltoModal` (same handler).
   - Wallet page tile: `className="w-full"` (drop `md:max-w-[25rem]`), `bodyClassName="min-h-0"`.
   - Accept: no italic text on `/yoid` or `/yoid/wallet`; the wallet card ends 16 px under its last
     row at 1440 and 390; "What is ZLTO?" opens the modal.

7. **Overview Skills chips in the reference chip style.**
   `components/YoID/SkillsCard.tsx:9-10, 44-52`.
   - `CHIP_CLASS` → `bg-green-light text-green rounded-full px-3 py-[5px] text-[13px] font-bold
     line-clamp-1 max-w-full`; container `gap-2`.
   - "+71 more" → `Show all 79 →` (`text-green text-[13px] font-bold`, `min-h-9` on phones) linking to
     the skills page as now.
   - Accept: the chips match the detail page's Languages/Skills chips side by side; the link reads
     "Show all 79 →".

8. **Yo-ID sub-pages and wallet: discovery's pager.**
   `pages/yoid/opportunities/{completed,pending,declined,saved}/[[...query]].tsx`,
   `pages/yoid/wallet/[[...query]].tsx:335-342` — each renders `PaginationButtons` with `showPages={false}`.
   - New `components/YoID/Pager.tsx` copying `features/discovery/components/Results/DiscoveryResults.tsx:230-250`
     markup (`btn btn-sm border-gray rounded-full bg-white text-xs disabled:opacity-40`, "Previous",
     `Page N of M` in `text-gray-dark text-xs`, "Next"); props `page`, `pages`, `onChange`. Wallet has no
     total: show "Previous / Page N / Next" and disable Next when the page is short.
   - Accept: the pager under the grids is identical to discovery's at 1440 and 390; the « » pager and
     the page input are gone from the five pages.

9. **Add page search: discovery's green submit.**
   `pages/yoid/opportunities/add.tsx:151-156`.
   - `buttonClassName="!bg-green hover:!bg-green-dark !text-white"`, keep the white input; `maxWidth`
     → the intro card's width on phones (`w-full md:max-w-[28rem]`).
   - Accept: the search button is the same green as "View opportunity" on discovery; at 390 the input
     spans the card width.

10. **Skills page tiles: compact.**
    `pages/yoid/skills/[[...query]].tsx:108-140`.
    - Tile: `shadow-custom flex flex-col gap-1 rounded-xl bg-white p-3` (drop `min-h-28`, `gap-2`,
      `p-4`); partner line and avatars on one row: `<div className="flex items-center justify-between
      gap-2">` with the "Skill issued by N partner(s)" text left and the avatar stack right (`size={24}`,
      `-mr-2`). Drop `href="#noaction"` for tiles without `infoURL` — render a `div`, not a dead link.
    - Accept: tile height ≈ 72 px at 1440 (was ≈ 112); the page is roughly half as tall; no `#noaction`
      links in the DOM. (Grouping/filtering: **deferred**, see below.)

11. **Hero greeting: the reference's heading weight.**
    `components/Layout/YoID.tsx:183-191`.
    - Keep `text-xl font-semibold md:text-2xl` (it is discovery's `DiscoverySurface.tsx:195`) — no
      change to size. Only if Jason answers Q1 "no emoji": delete `{timeOfDayEmoji} ` and the
      `timeOfDayEmoji` destructure; `getTimeOfDayAndEmoji` keeps serving the other callers.
    - Accept (if applied): "Good evening, Test!" with no leading glyph at 1440 and 390.

12. **Passport: no "+" on a group that is complete.** **API-gated** for exact counts, but one local rule
    is safe: when `hasNextPage` is false the counts are exact already; when it is true and the group is
    YoID, show the exact number (a wallet holds one identity credential by contract).
    `components/Credentials/PassportCredentials.tsx:93-100` (`groupCount`, used by the chip and the
    heading): take the group's key and render the exact count when `complete || key === YOID_TYPE`.
    - Accept: "YoID Identity · 1" with 130 credentials and a next page pending; the other groups keep "N+".

### Deferred (larger than one batch)

- **Skills page as a scannable list:** group by partner or initial, a filter chip row, or fold the page
  into chips with per-partner "Verified by" popovers. Needs a design pass.
- **Opportunities summary circles:** the orange conic ring + white-on-green discs are the last legacy
  visual on the overview; a "four stat cards in `TONE` tints" layout would match the dialogs' rows.
  Keep the circles this round (task 3 cleans them up).
- **Overview column width** (`max-w-4xl` vs `max-w-7xl`): leave, pending Q3.
- **Empty-submit on an all-optional completion** → API 500 (section 1). Behaviour: the lead decides
  whether Submit should be disabled until something is given, or the API should accept it.

### Copy (file:line → current → new)

| Where | Current | New |
| --- | --- | --- |
| `components/YoID/SkillsCard.tsx:50` | `+{more} more` | `Show all {data.length} →` |
| `components/YoID/WalletCard.tsx:52-53` | `ZLTO - Your digital wallet for rewards.` | (removed; link) `What is ZLTO?` |
| `components/YoID/PassportCard.tsx:49` | `Identity` | `YoID Identity` |
| `components/YoID/PassportCard.tsx:19` | `All verified work is stored to your passport using Blockchain digital certificates.🤝` | `Every opportunity you complete adds a verified credential here.` |
| `pages/yoid/index.tsx:355` | `View graph` / `View summary` | `Graph` (pressed pill) |
| `pages/yoid/opportunities/add.tsx:238-239` | `Note: If the opportunity requires verification, you will need to submit your proof and wait for approval before it's added.` | (in the intro) `If the opportunity needs verification, submit your proof first; it is added once approved.` |

### Acceptance pass for the tester (after the batch)

1440 and 390, signed in as testuser: `ia-form-open`, `ia-form-errors` (Impact Action `48935af2…`,
Submit on the empty form — never on an all-optional opportunity), `/yoid` top and scrolled past the
hero, `/yoid/wallet`, `/yoid/opportunities/pending` first card, `/yoid/opportunities/completed` a Job
card, `/yoid/opportunities/add`, `/yoid/skills`. Compare against the shots named above.

## Questions for Jason

1. **Hero emoji:** the 2026-10-20 answer kept "the greeting's emoji", the 2026-10-21 fix list dropped the 👋;
   the ☀️/🌙 still leads "Good evening, Test!". Keep it, or io5-only here too (task 11)?
2. **Submit on an all-optional completion** reaches the API and 500s ("An unknown error has occurred").
   Disable Submit until something is given, or is this an API fix?
3. **Overview width:** keep the narrower `max-w-4xl` column (one-column disclosures) or match the
   subpages' `max-w-7xl` so the sticky chips and the cards share an axis?
