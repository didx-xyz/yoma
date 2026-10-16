# Design compare: card facts, fact tooltip, Filters pills, landing rails — 2026-10-07

- **Spec:** [`2026-10-07-cards-rails.md`](2026-10-07-cards-rails.md), with Jason's answers at its head
  taking priority.
- **Build:** the working tree on `feature/cf-implementation` (base `c86f09f2` plus the uncommitted
  2026-10-06 (b) and 2026-10-07 trees, plus the fix round).
- **How:** one pass, signed out, in the throwaway slot (9226/9336), at 1440, 390 and 320. I ran the
  wizard signed out with the lead's answers: Get a job · Technology, AI & Data, Creative, Media &
  Design, Hospitality & Tourism, Education & Teaching (in that order) · Up to a month · Paid or
  rewarded · South Africa / Western Cape / Cape Town.
- **Screens:** machine-local, in `~/.cache/cdp-tools/shots/2026-10-07-compare/`. Paths below are
  relative to that folder.
- **Expected changes, not counted as mismatches:**
  - the fix-round list from the lead;
  - the Picked-for-you subtitle in the " · " form ("Job · Technology, AI & Data +3 · +4").

## Verdict

**§1–§4 match the spec.** I found one mismatch, a copy defect in the difficulty fact. The spec
does not cover that text, but it now appears on far more cards because of §1's "difficulty
becomes a filler". There are also three small notes outside the spec.

## Mismatches, ranked

| # | Spec item | What I see | Screens |
| --- | --- | --- | --- |
| 1 | §1 Copy: "None new" beyond the table. The difficulty fact is a filler on Impact Action, Event and Other (§1 Departures), with its text unspecified. | The fact reads `${level} level` (`lib/cardFacts.ts:195`). `c86f09f2` drew the bare level name (`cardFacts.ts:106-108` there). Against the seeded levels this gives **"Any level level"** (7 cards on the landing), **"Entry level level"** (6), **"Open to all level"** (14), "Experienced individuals level", "Skills required level", "Familiarity needed level" and "Experience needed level". At 320 and 1440 the longer ones also truncate ("Experienced indivi…", "Familiarity needed l…"). The tooltip value is right ("DIFFICULTY / Any level"). | `prefs-1440-rail3.png` (the "Open to all level" Event card), `prefs-320-rail3.png`, `noprefs-1440-full.png` (Latest, fixture 08) |

**Recommended fix for #1:** draw the level name as the card text, with no suffix ("Beginner",
"Any level", "Open to all", "Entry level"), as `c86f09f2` did. The star icon and the tooltip name
("Difficulty") already say what it is. This change is copy only, at `lib/cardFacts.ts:195`. If
Jason wants a suffix, add " level" only when the name does not already contain "level", and never
after "Open to all", "… needed" or "… required". The simpler rule is better.

## §1 Card facts: matches

- **No "Started …" and no "… employment"** at 320 (I scanned 323 fact buttons across all nine
  rails). The same holds at 390 and 1440 by sight.
- **"Permanent"** appears in full on all 56 Job facts at 320, with none truncated
  (`prefs-320-rail0.png`).
- **Fixture 08 (future start)** reads "Starts 6 Nov", with no weekday at 30 days. Its tooltip
  reads "START DATE / Fri 6 Nov" (`tip-rail-320-f1.png`, `tip-rail-390-f1.png`).
- **End date:**
  - "Ends today", "Ends tomorrow" and "2–6 days left" are all `text-pink` on rail cards
    (`prefs-1440-rail0.png`, `prefs-320-rail0.png`);
  - "Ends tomorrow" is pink in the list row: the 1440 status column (`list-1440.png`), the
    right-hand status at 390 (`list-390.png`) and under the meta line at 320 (`list-320.png`);
  - "Ends tomorrow" is pink in the detail page's 1440 sticky bar (`detail-1440-sticky.png`).

  Nothing anywhere says "Closes today" or "1 day left".
- **Accessibility relevance.** With no needs and no Accessibility filter, only Event cards show an
  accessibility fact: fixture 04 and 14 show "On request: Quiet workspace", fixture 12 shows
  "Accessibility: Quiet workspace". No Job card shows one.

  With Filters → Accessibility → Wheelchair accessible (preferences off, so there are any
  matches: `?acc=…&prefsOff=1`), Job, Impact Action and Entrepreneurship cards show
  "Accessibility: …". Example: fixture 01 shows "Permanent / Accessibility: Other, Quiet
  workspace +1".

  It lands in the **2nd** slot, not the 4th: these fixtures have no future start and no effort,
  so the next candidate moves up, exactly as the spec's relevance rule says. The acceptance line's
  "4th slot" assumed a full card. This is not a mismatch.
- **2 × 2 grid** with content-sized columns, and slots reserved when empty. This is unchanged
  from the current build on every card I saw.
- **List at 1440:** the fact column reads "Permanent", 130px wide, with no overflow
  (`list-1440.png`).

## §2 Fact tooltip: matches

- **Position:** anchored to the grid. Column 1 is 12px from the card's left edge and column 2 is
  12px from the right. Every tooltip I opened sat fully inside its card:
  - all three facts on the fixture 08 rail card at 320 and 390 (`tip-rail-{320,390}-f{1,2,3}.png`);
  - both facts on the fixture 11 results card at 320 and 390, including the long column-2 value
    "Other, Quiet workspace, Wheelchair accessible" on 2 lines (`tip-results-320-f2.png`,
    `tip-results-390-f2.png`).

  The page's `scrollWidth` equalled the viewport throughout, and only one tooltip showed at a
  time.
- **Look:**
  - the name is 11px, semibold, uppercase, `text-gray`;
  - the value is 14px, semibold, white;
  - the box is `bg-black` with an 8px radius, a shadow and no arrow.
- **1440 keyboard:** Tab onto a fact shows its tooltip with the focus ring visible
  (`tab-results-1440-3.png`).
- **No seeded value reached 3 lines,** so I did not see the `line-clamp-3` cut-off.

## §3 Filters pills: matches, Q3 included

- **Icons:** all 16 category pills show their 18 × 18 icon, and none is broken. This holds in the
  1440 dialog and the 390 and 320 sheets.
- **Inherited categories** are a white pill with a purple outline and ring, purple text and a
  `text-purple opacity-70` count. Shown at 1440 (`filters-1440-cats-inherited.png`), 390 and
  320. All four interests show this way; the spec's "three" assumed three picks.
- **Adding Beauty & Personal Care** gives a green outline, green text and a green count, and the
  four interests stay purple (`filters-1440-cats-plus-manual.png`, `filters-390-cats-plus-manual.png`,
  `filters-320-cats-plus-manual.png`).
- **At 320,** "Agriculture, Food, Environment and Climate" wraps to 2 lines, left-aligned beside
  its icon. The pill is 288px wide and nothing scrolls sideways.
- **Deselecting an inherited category** skips the whole "Interests" preference chip, struck
  through behind the dialog, and the category returns to unselected. This is behaviour, unchanged
  (`filters-1440-mixed-b.png`).
- **Q3, other chip sections:** inherited values are a white pill with a purple outline. Examples
  are Where → South Africa and How long → Up to a month. A manual pick (Worldwide) stays a solid
  green fill (`filters-390-type-where-b.png`, `filters-1440-mixed-b.png`).
- **Q3, Type row:** the inherited Job is purple-outlined, and a manual Learning is solid green,
  no longer solid purple (`filters-390-type-where-a.png`, `filters-1440.png`).

## §4 Landing rails: matches

- **Order with preferences, at every width:**
  1. Picked for you
  2. Opportunities near Cape Town
  3. Jobs for you
  4. Technology, AI & Data
  5. Creative, Media & Design
  6. Hospitality & Tourism
  7. Fits in up to a month
  8. Paid opportunities
  9. Featured

  That is three category rails in the order picked (Education & Teaching, the 4th, is left out,
  as Q1 says). Latest collapsed into "near", and Done in under an hour gave way to the
  commitment rail (`prefs-1440-full.png`, `prefs-390-full.png`, `prefs-320-full.png`).
- **Preferences off:** Featured · Latest opportunities · Done in under an hour, with no place in
  any subtitle. Latest has no See all, because its query is the landing itself, as before
  (`noprefs-{1440,390,320}-full.png`).
- **Copy:** every title and subtitle matches the copy table (`components/Discover/railCopy.ts`):
  - "Every type, close to where you are";
  - "Because you want to get a job, near Cape Town";
  - "One of your interests, near Cape Town";
  - "Within the time you said you have, near Cape Town";
  - "Paid or rewarded, near Cape Town";
  - "Hand-picked by the Yoma team, near Cape Town";
  - "Latest start dates first";
  - "Quick wins that fit into your day".

  "AI" keeps its case.
- **Icons:** only the category rails show one, 20 × 20 and untinted (`prefs-1440-rail3.png`).
- **Header:**
  - the title is Nunito black, 16px below `md`, and wraps to at most 2 lines. "Opportunities
    near Cape Town" and the category titles take 2 lines at 320 (`prefs-320-rail3.png`,
    `prefs-390-rail1.png`);
  - the subtitle is `text-gray-dark` and takes at most 2 lines;
  - "See all N →" is green, 12px below `md` and 14px at 1440, right-aligned and never wrapped.
- **Card widths and peek:**

  | width | card | gap | what shows |
  | --- | --- | --- | --- |
  | 320 | 272px | 12px | 20px of the next card |
  | 390 | 290px | 12px | ~72px of the next card |
  | 1440 | 288px | 12px | four cards and ~40–44px of the 5th |

  At 1440 the headless scrollbar takes 10px, so the 5th card shows slightly less than the
  spec's ~48px. The right edge fade on the grey page is visible on every row
  (`prefs-1440-rail0.png`).
- **Header → cards gap:** 12px (`pb-1` plus the scroller's `pt-2`).
- **"Searching…" placeholder:** I blocked the search request to see it. Each pending rail keeps
  its header and shows one `text-sm text-gray-dark` line, "Searching…", top-left, in a body the
  same height as a loaded rail: 445 at 1440 and 352 at 390, as loaded. There is no shimmer and
  there are no frames. The See all room stays empty until the count arrives
  (`placeholder-1440.png`, `placeholder-390.png`).

## Outside the spec (notes for Jason, not mismatches)

1. **A card's place line can contradict its rail.** On "Technology, AI & Data — One of your
   interests, near Cape Town", two cards read "Jobberman - Ghana · Bahrain · Remote" and
   "JobJack · Republic of the Congo". Both list South Africa among their countries; the org line
   shows the first country in their list. The org line comes from the card (`OpportunityCard.tsx`
   around `:240-244`), not from this batch (`prefs-1440-rail3.png`). A fix would show the
   country that matched the search first. That needs no request, but it is a behaviour call, so
   I am not proposing it in this batch.
2. **A results card at 320 truncates its status** beside a long CTA: "Apply by 6…" and
   "595 place…" next to "View impact action →" (`tip-results-320-f2.png`). Rail cards at 320 fit
   because "View event →" is shorter. This predates the spec.
3. **The Picked-for-you subtitle's trailing "+4"** ("… AI & Data +3 · +4") is expected (it
   matches the banner), but read cold it does not say what the 4 are. If the banner ever names
   them, the subtitle should follow.

## Not seen, and why

- **"Starts today", "Starts tomorrow" and "Starts {weekday}":** no seeded opportunity starts
  0–6 days from today. Fixture 08 starts 30 days after the seed.
- **The `line-clamp-3` tooltip cut-off:** no seeded value runs past 2 lines at 320.
- **Start a business's "See all →" without a number:** this run's goal was Get a job, and one
  pass covers one goal.
- **A rail that loads empty, a failed rail, "Couldn't load more. Retry", sideways loading and
  reduced motion:** these are behaviour, which the tester has verified; the lead asked me not to
  re-run them.
- **The legacy `/opportunities` carousels with the kill-switch off:** the switch is not
  something a signed-out pass can flip.
- **The mobile detail page's sticky deadline:** below `md` the "split" sticky mode has no
  deadline by design (`OpportunityDetailSections.tsx:870`), so there is nothing to compare at
  390 or 320. The 390 header tile reads "Ends 8 Oct" in the pink tile (`detail-390-top.png`).
