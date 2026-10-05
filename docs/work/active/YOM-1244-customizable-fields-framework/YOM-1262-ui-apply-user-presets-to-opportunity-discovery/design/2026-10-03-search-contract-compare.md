# W3 compare: the build against the search-contract spec (2026-10-03)

- **Spec:** [`2026-10-03-search-contract.md`](2026-10-03-search-contract.md), approved by Jason
  with every recommendation, the "Business category never selected" answer and the
  "Skills you've earned still apply." row.
- **Build:** the uncommitted working tree on `feature/cf-implementation`, on top of base `c2ca0eb9`.
  Paths are relative to `src/web/src/`.
- **Screens:** `~/.cache/cdp-tools/shots/2026-10-03-w3/` (machine-local), local stack, at 1440 × 900
  and 390 × 844 (2x), plus 360, 768 and 1024 for Sort. My captures start `c-`; `sim-c-` files are DOM
  simulations of a proposed change, not builds. The tester's `t-` captures are cited where I
  could not reproduce a state without writing data.
- **Session:** an anonymous wizard (Start a business; one skill, "Accredited Business
  Communicator"; Up to a week; Remote, then On-site; Wheelchair accessible and Sign language
  interpretation). Signed in through the Login page, as approved: the seeded admin for S6 and S7,
  and `testuser` for a read-only look at the signed-in banner. Each sign-in used a fresh browser
  profile, so no anonymous answers were merged. The first-login settings dialog was closed with
  "Skip for now", which only sets client state. No Approve, Decline, Upload, "Make this my
  default" or preference save was clicked, and the network log showed no write.

## Verdict

**The build matches the spec.** Every string in S1–S7 is as written. Four items differ from
the spec's measurements or acceptance wording, and none of them needs a code change:

1. The Accessibility rule wraps to 4 lines at 390 and 360. The spec measured 3. This is within
   the spec's budget, and an optional 3-line rewrite is offered to Jason.
2. The Sort segment widths differ, because the spec's measured numbers were wrong.
3. On a Learning search, the skills chip stays active while "Start a business" is on. The later
   build Decision requires this.
4. The engagement chip shows the saved order. The spec predicted lookup order, but its
   acceptance allowed either.

I accept all seven of the developer's deviations.

## S1: Personalize steps 3, 4 and 6

| Spec item | Result | Screens |
| --- | --- | --- |
| Engagement multi-select: tapping Remote, then On-site, fills both, each with `aria-pressed="true"`; tapping one again leaves the other | Matches (On-site toggled off and back on) | `c-s1-1440-step4-both.png` |
| Edit my preferences again: both still selected at step 4 | Matches | `c-s1-390-step4-edit.png` |
| Copy: `registry/preferenceSteps.ts:133`, `:142-143`, `:152`, `:162`, `:172`, `:223` | All six strings match | `c-s1-1440-step4.png`, `c-s1-390-step3.png`, `c-s1-390-step6.png` |
| 390 × 844: step 4 doesn't scroll; the last note ends above Continue | Matches: no scrolling element in the dialog; the last note ends at 750, and Continue starts at 784 (CSS px) | `c-s1-390-step4-edit.png` |
| Every pill ≥ 44px at 390 | Matches: all 10 pills are 44px | — |
| Banner "Engagement: Remote +1" or "On-site +1", and the tooltip lists both | Matches: "Engagement: Remote +1", title "… — Remote, On-site" | `c-s3-1440-landing.png` |
| Sign-in keeps the answers (union, L3) | Not seen: it writes to `testuser` (the tester passed it) | — |

## S2: Section rule copy

| Spec item | Result | Screens |
| --- | --- | --- |
| Each of the nine strings (`registry/filterSections.ts:105`, `:150`, `:166`, `:181`, `:198`, `:213`, `:231`, `:244`, `:272`) | All match: the dialog, the sheet, and the ENGAGEMENT and HOW LONG popovers | `c-s2-1440-dialog-where.png`, `c-s2-1440-dialog-eng-time-acc.png`, `c-s2-1440-dialog-more.png`, `c-s2-1440-popover-eng.png`, `c-s2-1440-popover-howlong.png` |
| No "for now" or "once the search API …" anywhere | Matches | — |
| 390 heights: Where 3, Engagement 2, How long 2, Language 2, Paid 2, Provider 1 | Matches (measured in the 314px box) | `c-s3-390-sheet-top.png` |
| 390 height: Accessibility 3 | **Mismatch:** it is 4 lines at 390 (314px box) and at 360 (284px box), and the fourth line is the two-word orphan "left out." | `c-s2-390-sheet-accessibility.png` |

## S3: Inherited chips, the private chip, the goal and the Accessibility section

| Spec item | Result | Screens |
| --- | --- | --- |
| Chips "Goal: Starting a business", "Skills: 1 job skill", "Accessibility: your needs" | Matches | `c-s3-1440-landing.png`, `c-s3-390-landing.png` |
| "Your feed is tuned to Starting a business · Up to 1 week · +N", with no need named | Matches: "+3" counts Engagement, Skills and Accessibility | same |
| Rail "Because your feed is tuned to starting a business, up to 1 week" | Matches | same |
| Chip `title`s as in the copy table; the country note (optional) | Match, and the country note is built ("Where: South Africa — Also includes …") | `c-s3-1440-signedin-landing.png` |
| No need name in text, `title`, `aria-label` or the URL outside the wizard and the opened section | Matches: zero hits, anonymous | — |
| Heading "N matches for Starting a business + K filters", where K counts the accessibility chip | Matches: "54 matches for Starting a business + 4 filters" | `c-s3-1440-results.png` |
| The recent-search label holds no "your needs" and no need | Matches: "Starting a business · Up to 1 week · Remote +1 · 1 job skill" | — |
| Skip the accessibility chip: struck through with an undo, and "1 preference is off …"; undo restores it | Matches; "+3" becomes "+2" | `c-s3-1440-acc-skipped.png` |
| `type=Learning` ghosts the skills chip with its note | **The Decision wins over the spec's acceptance.** While "Start a business" is on, the chip stays active, because Business-category Jobs come in through the goal's category branch (the 2026-10-03 build Decision, `jobSkillsApply`). With the goal skipped, the chip is ghosted with the info icon and "Not applied — this search has no jobs." | `c-s3-1440-learning-banner.png`, `c-s3-1440-learning-goalskipped-banner.png` |
| WHAT: Entrepreneurship selected, goal line under the pills (`registry/filterSections.ts:120`) | Matches in the popover, the dialog and the sheet (2 lines at 390) | `c-s3-1440-what-popover.png`, `c-s3-1440-filters-collapsed.png`, `c-s3-390-sheet-top.png` |
| The Business category is never shown as selected (Jason's answer, L6) | Matches: the carousel pill is plain and Categories reads "Any" | `c-s3-1440-landing.png` |
| Accessibility collapsed: "Accessibility · Your needs · FROM PREFERENCES"; opened, both needs selected, including the one no opportunity lists | Matches; "Sign language interpretation" sits after "Other" (deviation 7) | `c-s3-1440-filters-collapsed.png`, `c-s3-1440-filters-acc-open.png` |
| 390: chips scroll; "Accessibility: your needs" readable, ≤ 2 lines | Matches: 1 line, 36px chip | `c-s3-390-banner-chips-scrolled.png` |
| "Skills you've earned still apply." on the offer | Not seen live (see "Couldn't see"). The tester's capture matches the spec, appended to "Keep it off from now on?" | `t-wb-offer-1440.png` |

## S4: Sort

| Spec item | Result | Screens |
| --- | --- | --- |
| 1440: "N matches for … · Sort [Newest · Ending soonest · Most ZLTO] [Grid · List]" on one row, one family | Matches | `c-s3-1440-results.png` |
| `type=Job`: Newest and Ending soonest only; `type=Job&sort=mostZlto`: all three, Most ZLTO selected, note; `type=Job,Learning`: all three | Matches; the note reads "Jobs don't carry ZLTO, so they're shown newest first." | `c-s4-1440-job.png`, `c-s4-1440-job-mostzlto.png`, `c-s4-1440-job-learning.png` |
| No scroll on a sort change | Matches, from page 1 and page 2, at 1440 and 390 (scrollY and the control's position unchanged, clicked in place) | — |
| 390: its own full-width row; segments ≥ 44px; no "More sorts soon"; the header row doesn't scroll sideways | Matches: group 327 × 50, segments 44px; header row `scrollWidth` = `clientWidth` (358) even with "54 matches for Starting a business + 4 filters" | `c-s4-390-header.png`, `c-s4-390-header-prefs.png` |
| 360: "Ending soonest" not clipped | Matches: 77 / 120 / 95 in 297, no overflow | `c-s4-360-header.png`, `c-s4-360-header-prefs.png` |
| Segment widths 105 / 112 / 105 (390) and 66 / 112 / 86 (360) | **Measurement mismatch** (deviation 1): 87 / 130 / 105 and 77 / 120 / 95 | same |
| 768 own content-width row; 1024 inline | Matches (768: group 271 × 34, left-aligned) | `c-s4-768-header.png`, `c-s4-1024-header.png` |
| Focus ring; reduced motion | The tester's capture shows the ring (`t-s4-1440-focus-ring.png`); `motion-reduce:transition-none` is on every segment (`components/Results/SortControl.tsx:38`) | — |

## S5: Divider, cards and the detail page

| Spec item | Result | Screens |
| --- | --- | --- |
| `paid=0 … view=list&sort=endingSoonest`: the divider sits after "Search fixture 23 - Job"; dates restart below it | Matches (3 Nov above, then 2 Nov) | `c-s5-1440-paid0-list-ending.png` |
| Grid: spans all four columns | Matches (1248px) | `c-s5-1440-paid0-grid-ending.png` |
| No `paid=`: no divider. `paid=1`: before the first unspecified card | Matches. On the full catalogue, page 1 of `paid=1` is all explicit, so it has no divider. On the fixtures it appears. | `c-s5-1440-paid1-grid.png`, `c-s5-1440-paid1-grid-fixture.png` |
| 390: centred text, no hairlines | Matches | `c-s5-390-paid0-grid-ending.png` |
| Cards: fixture 01 "Other, Quiet workspace +1"; fixture 09 "Accessibility: Available on request" | Matches | `c-s5-1440-cards-events.png` |
| Cards: "On request: …" | Not seen: no fixture has one. The code is at `lib/cardFacts.ts:142`, and the tester simulated it (`t-s5-1440-cards-events-sim.png`) | — |
| Detail 04: "On request: Quiet workspace"; opened, "What the provider can arrange if you ask." | Matches at 1440 and 390 | `c-s5-d04-1440.png`, `c-s5-d04-1440-open.png`, `c-s5-d04-390.png`, `c-s5-d04-390-open.png` |
| Detail 09 "Accessibility · Available on request", 18 "· No", 20 "· Not specified" beside Languages at `lg`, 01 unchanged | Matches at 1440 and 390 | `c-s5-d09-*.png`, `c-s5-d18-*.png`, `c-s5-d20-*.png`, `c-s5-d01-1440.png` |

## S6: Job completion review (admin)

| Spec item | Result | Screens |
| --- | --- | --- |
| Name, email and country, then "Jobs record a placement, not time spent." (`components/Opportunity/OpportunityCompletionRead.tsx:261`, `text-gray-dark text-sm`); no timing rows; Cancel closes it | Matches at 1440 and 390 | `c-s6-1440-modal.png`, `c-s6-390-modal.png` |
| A non-Job pending completion still shows its dates | Not seen: none is seeded. The non-Job branch is the unchanged grid. | — |

## S7: Import help (admin)

| Spec item | Result | Screens |
| --- | --- | --- |
| The four new or changed sentences (`components/Opportunity/Admin/VerificationImport.tsx:224-227`, `:230`, `:237-240`, `:265-269`); the column list is unchanged | Matches at 1440 and 390 | `c-s7-1440-help-top.png`, `c-s7-390-help-top.png`, `c-s7-390-help-cf.png` |
| The sample link is `text-blue-dark` | Matches: `rgb(36, 135, 197)`, the `--color-blue-dark` token | `c-s7-1440-help-link.png`, `c-s7-390-help-link.png` |
| The served CSV header equals the API sample | Matches: 23 columns, byte-equal header | — |

## Verdicts on the developer's deviations

1. **Sort segments 87 / 130 / 105 at 390: accept.** The spec gave the class (`flex-auto`:
   content width plus an equal share of the free space). Its measured figures can't come from
   that class: at 360 they add up to 264 in a 291px inner box. The build is what the class
   produces, so each label carries equal padding and the selected pill hugs its label. Every
   segment is 44px, and nothing clips at 360. Only the spec's numbers are wrong (lead's docs,
   S4 Changes 2).
2. **"N matches for your preferences" and the recent label "Your preferences" when the private
   chip is the only filter: accept.** The spec didn't cover this case: dropping the value would
   leave "N matches for + 1 filter". The fallback uses the same words as the banner ("Your feed
   is tuned to your preferences") and the rail ("Because of your preferences"). It is honest
   that a filter applies, and it names nothing. Screen: `c-s3-1440-accessibility-only-results.png`.
3. **A sort change never scrolls, even from page 2: accept. This is the spec** (S4 Changes 4,
   and 2026-09-03). The control sits at the top of the results, so the youth is already looking
   at it. Verified in place at 1440 and 390.
4. **Manual accessibility picks still name the need: accept.** S3.2 makes only the inherited
   chip private. A manual pick is a choice made on this screen and is already in the URL
   (`acc=`). Its chip must name what it removes, and the "This search is filtered by …" row must
   say what the search is doing. No change is recommended. The one place a manual need lingers
   is the recent-search list (shown when the search box has focus, on this device). That is
   question 2.
5. **The engagement chip leads with the saved order: accept.** The spec allowed either value
   first. More importantly, every summary agrees: the chip, its tooltip ("Remote, On-site"),
   the ENGAGEMENT segment and the mobile pill all read "Remote +1". The section pills keep lookup
   order, as every section does.
6. **`mt-3 mb-3` on "Imports work only…": accept.** It is the file's own pattern for a
   paragraph that follows a list (`VerificationImport.tsx:286`, already at `c2ca0eb9`). It gives
   12px under the list and 16px to "Optional Properties".
7. **Inherited needs that no opportunity lists come after the facet options: accept.** It
   serves the spec's own reason ("so nothing jumps") better than interleaving. Deselecting an
   inherited need skips the whole preference, so those extra options vanish. Appended last,
   they vanish without moving any other chip. Interleaved, they would shift the chip under the
   finger (`sim-c-s3-390-sheet-accessibility-lookup-order.png` shows the alternative). The cost
   is a selected need after "Other". If Jason wants "Other" last, insert the extras before it,
   at `components/Filters/useSectionModel.ts:213`. Then only "Other" moves when they vanish.
   That is optional, and I don't recommend it now.

## Fix now

**No code fix is required.** One optional copy change goes to Jason (question 1). If he takes
it:

| `file:line` | Current | New |
| --- | --- | --- |
| `registry/filterSections.ts:198` (Accessibility `nullRule`) | Needs every accommodation you pick. Picked here, ones that haven't listed theirs are left out; from your preferences, they stay in. Ones that say No are always left out. | Needs every accommodation you pick; ones that say No are left out. Picked here, so are ones with no list; from your preferences, they stay in. |

- **Measured in the live box:** 3 lines at 390 (314px) and at 360 (284px), against 4 for the
  current string.
- **Screen:** `sim-c-s2-390-sheet-accessibility-short.png`.
- **What it keeps:** the every-need rule, the No rule in both modes, and the
  manual-versus-preferences split. It also keeps "say No", which the wizard and the chip note
  use.
- **What it changes:** it drops "always", because the No clause now comes before the
  mode-dependent sentence and reads as unconditional.
- **Rejected:** keeping "always" ("…ones that say No are always left out. Picked here, so are
  ones with no list; …") still wraps to 4 lines at 360.
- **The code comment** at `registry/filterSections.ts:185-188` needs no edit.

**For the lead (docs):** in the spec's S4 Changes 2, replace the measured widths with 87 / 130 /
105 (390) and 77 / 120 / 95 in 297 (360). In S2, record Accessibility as 4 lines, or 3 if
question 1 is taken.

## Questions for Jason

1. **The Accessibility rule line at 390 and 360:** keep the approved string at 4 lines (within
   the one-line budget; the last line is the orphan "left out."), or take the 3-line rewrite
   above? I recommend the rewrite.
2. **A manually picked need in the recent-search list:** it is stored on the device and shown
   when the search box has focus. Should it be left out the way inherited needs are? I recommend
   no: the youth picked it on this screen, and it is already in the URL.

## Couldn't see (and why)

- **"Skills you've earned still apply." live.** `testuser` has 69 verified skills and no
  self-attested ones. Skipping Skills therefore offers no "Make this my default", which is
  correct (`lib/preferenceMapping.ts:374-383`). Showing the sentence needs a self-attested
  skill saved to the account, and I wrote nothing. The tester's `t-wb-offer-1440.png` shows it.
- **The L3 sign-in union.** It writes to `testuser`'s preferences.
- **An Event card with "On request: …".** No fixture has one.
- **A non-Job pending completion, or a Job with "Employment start date".** None is seeded.
- **Hover and reduced motion.** The browser is headless: I checked `title` attributes and the
  `motion-reduce:` classes instead.

## Seen, predating W3 (no action asked)

- **The Where section lists "Worldwide" as an ordinary country pill** (`c-s2-1440-dialog-where.png`).
  It predates this work (`components/Filters/WhereControl.tsx` is unchanged since `c2ca0eb9`).
  With an inherited home country, the request already sends Worldwide silently, while the pill
  shows unselected. Picking it is a manual place, which replaces the inherited country.
  Worth a look when Where is next touched.
- **The admin review modal:** it uses a fallback sans font and has a tall empty band between the
  participant card and the comments, at both widths. Both were in the "before" captures
  (`jc-1440-modal.png`, `jc-390-modal.png`).
- **At 390,** the Grid/List toggle beside the heading is 34px tall, under the 44px rule that
  Sort now meets on the row below it.
