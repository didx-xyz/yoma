# Design review, round 2 of 2 — re-review after the round-1 batch

- **Date:** 2026-10-21 · **Role:** designer · **Reference:** `/opportunities/a6d4831b-07b4-4a4b-a973-49020c2c361d`
- **Against:** `design/2026-10-21-review-round1.md` (tasks 1–12, Q1–Q3) and the developer's result
  (`agent://DevDesign1`); Decisions in `YOM-1283/feature.md` and `YOM-1255/feature.md` win, including
  Jason's today: io5 time-of-day icon, overview `max-w-7xl` with Wallet/Passport side by side on desktop,
  Submit disabled until something is given.
- **Captured:** 1440, 768, 390, 320, signed in as testuser (approved), headless Chrome on the throwaway
  slot. Shots in `~/.cache/cdp-tools/shots/2026-10-21-design-r2/` (paths below are relative to it).
  Same pages as round 1: discovery landing + results, the Impact Action detail `48935af2…` with the
  completion form open and its errors, `/yoid`, wallet, passport, skills, the four opportunities
  sub-pages, add.
- **Form errors, how:** Submit is now disabled on an empty form, so the error state was reached by
  typing feedback only ("Great experience.") and submitting; zod stops it on the four required proofs
  and nothing reaches the API (the capture's network log has no `PUT …/verify`). Nothing was submitted;
  `43480a94…` was not opened.
- **Headless caveat:** no emoji font; a tofu box (▯) in a shot is an emoji. None remain on these pages.

---

## (a) Round-1 tasks — matches / mismatches

| # | Task | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Completion form in the dialogs' chrome | **Matches.** White sheet with 24 px inset top and bottom at 1440×900, ghost circle close, 80 px circle in the Impact Action tint (`bg-type-impact-action/10`, icon `text-type-impact-action`, measured `oklab(… / 0.1)` / `rgb(35,131,106)`), Nunito 900 heading (`DIALOG_HEADING`; measured 28 px at 1440, 30 px at 390), `rounded-full` Close (outline) and Submit (solid). The error summary and the per-field italics are unchanged. | `ia-form-open-1440.png`, `ia-form-open-1440-s1.png`, `ia-form-errors-1440.png`, `ia-form-errors-1440-s2.png`, `ia-form-open-390.png`, `ia-form-errors-390.png`, `ia-form-errors-390-s1.png` |
| 2 | Overview Passport body: pills, no stamp, no emoji | **Matches.** "● Opportunities 129" (grey dot) and "● YoID Identity 1" (pink dot) pills open `/yoid/passport`; no image; 390/320 wrap to two rows. One nit: the pills come in API order (Opportunities first) while the passport page lists YoID Identity first — see B5. | `yoid-overview-1440.png`, `yoid-overview-390.png` |
| 3 | Overview Opportunities body: io5 icons, tokens, pill toggle | **Matches.** Check / clock / close / heart icons before the counts, orange-on-green conic ring from tokens, "Graph" pill with `aria-pressed`. | `yoid-overview-1440.png`, `yoid-overview-320.png` |
| 4 | Card custom fields: stacked, grey values, human dates | **Matches.** Pending card: "Impact Achieved:" bold over a grey, normal, left-aligned value at 1440 and 390. Completed Job card: "Employment Start Date: 14 Oct 2026". (Developer departure accepted: the `Date` type was the raw input string and is now formatted too.) | `yoid-opp-pending-1440.png` (first card), `yoid-opp-pending-390-card.png`, `yoid-opp-completed-1440.png` (4th and 12th cards) |
| 5 | One intro style on Yo-ID | **Matches.** Every Yo-ID page has one white `YoIDIntro` card under the breadcrumb; the sub-pages' banner is now "Just completed an opportunity? Add it to your Yo-ID" in that card; the add page ends at Load more and its intro carries the verification sentence. | `yoid-opp-pending-1440.png`, `yoid-opp-completed-1440.png`, `yoid-opp-add-1440.png`, `yoid-opp-add-390.png` |
| 6 | Wallet: no duplicate ZLTO line, full card, full width | **Matches.** The italic line and the ⓘ are gone on both pages; "What is ZLTO?" is a green underlined link under the ledger; the wallet page's card is full width and ends under the link. See B6 for a side effect of the full width. | `yoid-wallet-1440.png`, `yoid-wallet-390.png`, `yoid-overview-1440.png` |
| 7 | Overview Skills chips in the reference chip style | **Matches at 1440/768/390; mismatch at 320.** Chips are `bg-green-light text-green rounded-full … text-[13px] font-bold`; "Show all 79 →" links to the skills page. At 320 (and any width where a name is wider than the card) `line-clamp-1` clips the second line *inside the pill's padding*, so "Board Certified Geriatric… / Pharmacist (BCGP)" bleeds out under the chip as a cut-off second line. The reference's `ChipList` chip is `inline-flex` and simply wraps. → Task 1. | `yoid-overview-320-skills.png`, `yoid-overview-1440-sticky.png` |
| 8 | Discovery's pager on the five pages | **Matches.** "Previous · Page 1 of 3 · Next" pills under the grids; the round « » pager and the page input are gone. | `yoid-opp-pending-1440.png`, `yoid-opp-completed-1440.png`, `yoid-opp-pending-390-pager.png` |
| 9 | Add page search: green submit, card-width input on phones | **Matches.** Green square button with the white input; at 390 the input spans the card. | `yoid-opp-add-1440.png`, `yoid-opp-add-390.png` |
| 10 | Skills page tiles: compact | **Matches.** One row "Skill issued by 1 partner" + avatar; the 1440 page is 2 321 px tall (was ≈ 4 300). At 390 it is still 7 561 CSS px of single-column tiles → Task 7. | `yoid-skills-1440.png`, `yoid-skills-390.png` |
| 11 / Q1 | Greeting: io5 time-of-day icon | **Matches (Jason's decision).** An orange `IoMoonOutline` precedes "Good evening, Test!" on every Yo-ID page; no emoji left in the hero. | `yoid-overview-1440.png`, `yoid-wallet-390.png` |
| 12 | Passport "YoID Identity · 1", no "+" | **Matches.** Chip and heading read "YoID Identity 1" with 130 credentials and a next page pending; the other groups keep "N+". | `yoid-passport-1440.png` |
| Q2 | Submit gate | **Matches (Jason's decision).** On the untouched form Submit is `disabled`, 40 % opacity, `cursor-not-allowed`, with "Add a file, a photo, a location, a field or feedback to submit." under it, linked by `aria-describedby`; typing feedback enables it. | `ia-form-open-1440-s1.png`, `ia-form-enabled-1440.png`, `ia-form-open-390-s1.png` |
| Q3 | Overview `max-w-7xl`, Wallet/Passport side by side | **Matches (Jason's decision).** `lg:grid-cols-2`, Skills / Opportunities / CV span both columns; the sticky chips and the cards share an axis at 1440. At 768 it is one column; the chip row scrolls with the fade at 390/320. | `yoid-overview-1440.png`, `yoid-overview-768.png`, `yoid-overview-1440-sticky.png` |

Unchanged and still matching: discovery landing and results at all four widths (`disc-landing-*.png`,
`disc-results-*.png`), the opportunity header card and sticky bars (`ia-detail-{1440,390}.png`,
`ia-sticky-{1440,390}.png`), the passport page (`yoid-passport-*.png`), the declined / saved sub-pages.
No horizontal overflow on any page once hydrated (the 1 038 px `scrollWidth` that the capture logged on
a few first loads at 390/320 is the off-canvas user-menu drawer during hydration — `scrollWidth`
settles to the viewport width within two seconds and `scrollX` stays 0; pre-existing, outside this epic).

## (b) What still reads differently from the reference — by impact

- **B1 — Overview Skills chip bleeds at 320** (`yoid-overview-320-skills.png`): the only visible
  defect on the pages. `line-clamp-1` on a padded pill shows the top of the clipped second line below
  the chip. The reference chip (`DetailDisclosure.tsx:180-181`) has no clamp and wraps.
- **B2 — Four summary circles spread across a 1 200 px card** (`yoid-overview-1440.png`,
  `yoid-overview-1440-sticky.png`): with the card now `lg:col-span-2`, `grid-cols-4 justify-items-center`
  puts the circles ~290 px apart (lefts 258 / 549 / 840 / 1 131) with the "Graph" pill alone top-right.
  At 768 the same markup reads well (`yoid-overview-768.png`) because the card is narrower. The
  circles themselves stay the last legacy visual on the overview (deferred in round 1; still deferred).
- **B3 — Skills page on phones is 79 single-column tiles, 7 561 px tall** (`yoid-skills-390.png`):
  `CARD_GRID_CLASS` is one column under 600 px, right for opportunity cards (band, chip, title, facts,
  button) but each skill tile is one line of name and one line of partner. Grouping/filtering remains
  the real fix (deferred); two columns on phones is the one-line win.
- **B4 — Two links to the same page, 40 px apart, in the Skills card** (`yoid-overview-1440.png`):
  "Show all 79 →" and the card's own foot "Open Skills →" both go to `/yoid/skills`. The count is
  already in the title ("Skills · 79"). The reference's "Show all N" expands in place; here it cannot,
  so it duplicates the foot.
- **B5 — Passport card says its sentence twice and orders the pills unlike the passport page**
  (`yoid-overview-1440.png`): the header note "Verified credentials for every opportunity you complete."
  sits over the body's "Your digital passport contains the credentials you receive from completing
  opportunities." — the same two-intro smell round 1 removed from the wallet. The pills come in API
  order (Opportunities, then YoID Identity); the passport page's chip row and groups lead with YoID
  Identity (`yoid-passport-1440.png`).
- **B6 — Wallet page ledger at 1 200 px** (`yoid-wallet-1440.png`): the full-width card (round-1
  task 6) means "Available … 0" spans the whole row; the dashed leader on "Pending rewards" is what
  makes it readable. Acceptable; noted so nobody "fixes" it back to a narrow card with dead space.
- **B7 — Form copy and the empty hint slot** (`ia-form-errors-1440.png`, `ia-form-errors-1440-s2.png`):
  the summary says "4 **things** to fix before you submit", the footer "Fix the 4 **items** marked
  above". And once Submit is enabled, the `mb-10 min-h-4` hint slot is 56 px of white under the buttons
  inside the sheet.
- **B8 — Scroll-spy on a short page at 1440** (`yoid-overview-1440-sticky.png`): at maximum scroll
  (330 px) Skills' top sits 157 px from the viewport top, just under the spy's line, so the bar keeps
  "Wallet" lit while Skills and Opportunities fill the screen. Inherent to "lowest section whose top
  passed the bar" on a page 1.4 screens tall; the developer flagged it. Not a task this round.
- **B9 — "What is ZLTO?" is the only underlined link inside a disclosure body** (`yoid-overview-1440.png`):
  `INTRO_LINK_CLASS` belongs to the intro cards; the card's foot "Open Wallet →" is bold green without
  underline. Cosmetic; left as is (it reads as a help link, which it is).
- Minor, unchanged from round 1: the map controls appear only after a submit attempt on the Impact
  Action form (Maps script timing); at 768 the site navbar's links overflow ("…etplace") — pre-existing.

## (c) Final developer batch — numbered, small sure wins (last round)

Each: files → change → acceptance. Tailwind v4, tokens from `styles/colors.css`.

1. **Overview Skills chips: wrap like the reference, no clamp.** `components/YoID/SkillsCard.tsx:10-11`.
   - `CHIP_CLASS` → `bg-green-light text-green inline-flex max-w-full items-center rounded-full px-3
     py-[5px] text-[13px] font-bold` (drop `line-clamp-1`). A name wider than the card wraps inside the
     pill, as `ChipList` does on the detail page.
   - Accept: at 320 "Board Certified Geriatric Pharmacist (BCGP)" is a two-line pill with nothing
     bleeding below it (`yoid-overview-320-skills.png` re-shot); 1440 unchanged.

2. **Overview Skills: one way out, not two.** `components/YoID/SkillsCard.tsx:13-17, 45-53`,
   `pages/yoid/index.tsx:360`.
   - Add a `showAll?: boolean` prop (default `true`) and render the "Show all {n} →" `Link` only when
     it is true. The overview passes `showAll={false}`: its foot "Open Skills →" (`SectionLink`) already
     leads there and the title carries "· 79". The user-menu drawer (`NavBar/UserMenu.tsx:428-431`,
     outside this epic) keeps the link and its `onClick`.
   - Accept: on `/yoid` the Skills body is eight chips then "Open Skills →"; the drawer still shows
     "Show all 79 →".

3. **Summary circles: cluster in the wide card.** `components/YoID/OpportunitiesSummary.tsx:79-83`.
   - Grid wrapper: add `mx-auto sm:max-w-lg` (`grid w-full mx-auto sm:max-w-lg justify-items-center
     gap-3 …`). Phones keep 2 × 2 at full width.
   - Accept: at 1440 the four circles sit in a ≈ 512 px band centred in the card (≈ 40 px apart), the
     "Graph" pill stays top-right; at 768 and 390 nothing moves.

4. **Passport card: one intro, YoID first.** `components/YoID/PassportCard.tsx:57-61, 64`.
   - Remove the `<div className="text-gray-dark">Your digital passport …</div>` (the header note
     already says it); the body is the pill row, then the foot.
   - Order the pills `[...data].sort((a, b) => Number(b.schemaType === YOID_TYPE) - Number(a.schemaType === YOID_TYPE))`
     so YoID Identity leads, as on the passport page.
   - Accept: Passport body reads "● YoID Identity 1 · ● Opportunities 129" then "Open Passport →"; at
     1440 Wallet and Passport cards are closer in height (both ≈ 200 px).

5. **Form copy: one noun for the error count.** `components/Opportunity/OpportunityCompletionEdit.tsx:1315`.
   - `Fix the {count} {count === 1 ? "item" : "items"} marked above, then submit again.` →
     `Fix the {count} {count === 1 ? "thing" : "things"} marked above, then submit again.` (matches
     `:1227-1228` "N things to fix before you submit").
   - Accept: both red rows say "things" (`ia-form-errors-1440.png` / `-s2.png` re-shot).

6. **Form: no empty slot under the buttons once Submit is live.**
   `components/Opportunity/OpportunityCompletionEdit.tsx:1341`.
   - `mb-10 min-h-4 text-center` → `mb-6 text-center` and keep rendering the `<p>` only while
     `!anythingGiven`. (The sheet's bottom padding stays the `md:pb-6`-class rhythm of the dialogs.)
   - Accept: with feedback typed, the sheet ends ≈ 24 px under the buttons at 1440 and 390; with the
     form empty, the hint still sits under Submit.

7. **Skills page: two columns on phones.** `pages/yoid/skills/[[...query]].tsx:109`.
   - Replace `CARD_GRID_CLASS` on this page only with
     `grid grid-cols-2 gap-3 min-[600px]:grid-cols-3 min-[900px]:grid-cols-4` (keep `CARD_GRID_CLASS`
     for the card pages). Tile text is short enough: name `text-sm` wraps, partner line stays one row.
   - Accept: at 390 the page is roughly half as tall (≈ 3 800 px), tiles ≈ 165 px wide, nothing
     overflows at 320; 1440 unchanged.

8. **Wallet page ledger: keep full width (no change) — record it.** `pages/yoid/wallet/[[...query]].tsx:240-249`.
   - No code change. Note in `YOM-1283/feature.md` Decisions that the wallet card is full width with
     the ledger's dashed leaders carrying the eye (round-1 task 6), so it is not narrowed again.
   - Accept: `feature.md` has the line; `yoid-wallet-1440.png` unchanged.

Eight tasks; the batch is deliberately presentation-only and touches no behaviour.

### Deferred (larger than this round)

- **Skills page as a scannable list** (group by partner / initial, filter chips) — needs a design pass;
  task 7 is the stop-gap.
- **Summary circles → four `TONE` stat cards** — the last legacy visual on the overview; task 3 only
  tidies the spacing.
- **Scroll-spy on short pages** (B8) — a "header below the bar" rule would need the spy to measure
  the sticky bar's real height; not worth the risk in the last round.
- **Off-canvas user-menu drawer** widening `scrollWidth` during hydration (pre-existing, outside the
  epic).

### Copy (file:line → current → new)

| Where | Current | New |
| --- | --- | --- |
| `components/Opportunity/OpportunityCompletionEdit.tsx:1315` | `Fix the {count} item(s) marked above, then submit again.` | `Fix the {count} thing(s) marked above, then submit again.` |
| `components/YoID/SkillsCard.tsx:51` | `Show all {data.length} →` | (hidden on `/yoid` via `showAll={false}` — the foot "Open Skills →" remains; the drawer keeps it) |
| `components/YoID/PassportCard.tsx:59-60` | `Your digital passport contains the credentials you receive from completing opportunities.` | (removed — the header note remains) |

### Acceptance pass for the tester (after the batch)

1440 and 390 (320 for task 1 and 7), signed in as testuser: `/yoid` top (Passport pills, Skills chips
and foot, circle cluster), `/yoid/skills`, Impact Action `48935af2…` form with feedback typed then
Submit (error rows' copy, space under the buttons; never on an all-optional opportunity, never with
proof attached). Compare against `~/.cache/cdp-tools/shots/2026-10-21-design-r2/`.

## Questions for Jason

1. **Skills page on phones:** ship two columns of tiles now (task 7) and keep the grouped / filterable
   list for a later ticket, or hold the page as is until that redesign?
2. **Summary circles:** the orange-ring circles are now clean (io5, tokens) but remain the one element
   on the overview that is not in the detail page's language. Release with them, or schedule the
   four-stat-cards version (`TONE` tints, like the dialogs' rows) as the next Yo-ID ticket?
