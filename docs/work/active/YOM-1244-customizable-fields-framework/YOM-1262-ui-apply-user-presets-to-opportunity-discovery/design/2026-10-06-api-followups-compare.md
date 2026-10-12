# Compare: the build against the 2026-10-06 API follow-ups spec

- **Spec:** [`2026-10-06-api-followups.md`](2026-10-06-api-followups.md), approved by Jason with
  every recommendation. Its head wins over its body: "Jason's answers" and "Changed after the
  build" (S4's subtitle stays "Latest start dates first"; S7 gains "Skill name unavailable"; S8,
  the skills chip).
- **Build:** the uncommitted working tree on `feature/cf-implementation`, on top of base
  `c86f09f2`, after its review, test and one fix round. Paths are relative to `src/web/src/`.
- **Screens:** `~/.cache/cdp-tools/shots/2026-10-06-api-followups-compare/` (machine-local).
  - Local stack, fresh throwaway profile, consent prompt and first-visit welcome dismissed.
  - Sizes: 1440 × 900 and 768 × 1024 at 1x; 390 × 844, 360 × 740 and 320 × 640 at 2x.
  - The pre-change captures are the spec's `cur-*` files in `../2026-10-06-api-followups/`.
  - For legibility only, the S3 phone shots and the editor block shots hide the page's fixed and
    sticky bars, and the S6 keyboard runs insert a hidden button just before "Show full title"
    to Tab from (removed straight after). Nothing else on the page was changed.
- **Samples:** fixtures looked up by title through the API. 01 (Job), 04 (Event), 19 (Impact
  Action) and 20 (Entrepreneurship) still have the spec's IDs. The long title for S6 is the spec's
  `6a7c6bb4-…`.
- **Session:**
  - **Signed out:** S1, S3–S7.
  - **`testorgadminuser`, read-only:** the editor's Details step for fixtures 04, 01 and 19
    (opened from the step list; nothing changed, Next and Save never pressed) and the admin info
    page for fixture 01.
  - **`testuser`, read-only:** YoID Completed, the discovery skills chip, and the completion
    form opened from fixture 22 (Job). That is the tester's sample, so I added no Viewed record
    to a new opportunity. The form was left with "Close Window" and never submitted.
  - No "Choose your settings" dialog appeared for either account.

## Verdict

**The build matches the spec in everything it controls.** Every measured check passes at every
width, and no page scrolls sideways. Two acceptance checks read differently on screen, and
neither is caused by this batch's code:

| Spec item | What I see | Screen |
| --- | --- | --- |
| S3, 1440: "the note (2 lines) under 'Additional details · 10'" | **1 line** at 1440, and at 768 too. The copy is the approved line, verbatim. The spec measured "2 at 1440" on its simulation, which used the longer wording "…The provider decides who is suitable." The approved "They decide who is suitable." fits on one line. At 390, 360 and 320 it is 3 lines, as specced | `s3-job01-additional-1440.png` (compare `../2026-10-06-api-followups/sim-detail-job01-additional-1440.png`) |
| S7, 1440: "the chip reads 'Preferred skills: Skill no longer listed'" | At 1440 the chip reads **"Preferred skills: Skill no lo…"**. The chip's own desktop rule cuts it (`max-w-40 … md:truncate`, `features/discovery/components/shared/Chip.tsx:82`, unchanged by this batch; the base cut "Unknown …" the same way). The full label is in the tooltip and in the remove button's name. At 390 and 320 it reads in full on 2 lines | `s7-bad-chip-1440.png` (base: `../2026-10-06-api-followups/cur-skill-chip-1440.png`) |

The second matters more. The cut lands on the words that carry the meaning, "no longer listed",
so a desktop user sees "Skill no lo…". It is the chip's general rule rather than a defect here;
see Observations.

## S1: Discovery's type-specific filters

| Spec item | Result | Screens |
| --- | --- | --- |
| A one-group section shows its fields directly, in `flex flex-col gap-2 pt-1 pb-3`, with no group row | Matches (`TypeSpecificFilters.tsx:129`, `:148`). **Learning:** "Difficulty" and its select directly under the note. **Entrepreneurship:** "Programme", "Other programme", "Venture stage targeted", with no "Programme" row | `s1-learning-open-{1440,390,320}.png`, `s1-entre-open-{1440,390,320}.png` |
| Two or more groups keep the `GroupDisclosure` rows, a one-field group included | Matches. **Job:** Classification 2 · Compensation 5 · Employment 4 · Requirements 3, closed. **Impact Action:** "Activity 1" and "Requirements 3". Every row is 44 px. Job's Requirements opens to Experience level, Minimum qualification, Preferred skills | `s1-job-open-*.png`, `s1-impact-open-*.png`, `s1-job-requirements-*.png` |
| "1 filter", "N filters" | Matches (`:137`): "Learning filters · 1 filter", "Event filters · 1 filter", "Entrepreneurship filters · 3 filters", "Job filters · 14 filters". With a value set: "1 filter · 1 set" | `s1-difficulty-set-1440.png` |
| The note is the header's subtitle, only while open (`:140`): 13 px, `text-gray-dark`, `leading-snug`, `pb-2`, no indent | Matches: 13 px, `--color-gray-dark`, flush with the header's left edge. 1 line at 1440 (762 px), 2 at 390 (358 px), 3 at 320 (288 px) | `s1-learning-open-320.png` |
| Every open section carries it; a collapsed one doesn't | Matches. `type=Job,Event` with both open shows the note under each. Closing Job removes Job's note and leaves Event's. Closed, no section shows it, so the closed panel is unchanged | `s1-job-event-open-{1440,390,320}.png`, `s1-*-closed-*.png` |
| 390: each control 44 px | Matches: the selects are 44 px at 390 and 320 (40 px at 1440, the pointer size, as before) | — |
| 320: nothing overflows | Matches: `scrollWidth` 320 for all five cases. No button runs to 3 lines | — |
| Behaviour: a Difficulty pick gives the chip and the count, and the same `cf` shape | Matches: `cf=[{"key":"learningDifficulty","operator":"AnyOf","values":["Beginner"]}]`, the chip "Difficulty: Beginner", "Filters 2". The shape is that of the group-row path: the same `CustomFieldFilters` props (`GroupFields`) | `s1-difficulty-chip-1440.png` |
| Copy: "What providers describe, not entry requirements. Each provider decides who is suitable." | Matches (`TypeSpecificFilters.tsx:103–104`) | — |
| Motion: none added | Matches. The chevrons keep `motion-reduce:transition-none` | — |

## S3: The detail page's "Additional details"

| Spec item | Result | Screens |
| --- | --- | --- |
| The note: "What the provider describes, not entry requirements. They decide who is suitable." | Matches (`OpportunityDetailSections.tsx:627`). Lines: **3** at 390, 360 and 320; **1** at 768 and 1440 (see the Verdict) | `s3-*-additional-*.png` |
| The fade: `motion-safe:animate-[fade-in_220ms_ease-out_both]`, nothing under reduced motion | Matches: `fade-in`, 0.22 s; with `prefers-reduced-motion: reduce` emulated, `animation: none` | — |
| Stays flat: no group headings, rows in group order | Matches: no heading element in the view. Fixture 01's ten rows run classification, pay, employment, experience | `s3-job01-additional-1440.png` |
| `wrapValues` row: `flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4` | Matches (`CustomFieldsView.tsx:262`) | — |
| Label `text-[13px] sm:shrink-0 sm:text-sm`, `text-gray-dark`; value `min-w-0 font-bold wrap-break-word sm:text-right` | Matches (`:264`, `:267`). Below `sm`: label 13 px above its value, 14 px, 700. From `sm`: one row, value right-aligned. Grid `gap-4`, one column | `s3-impact19-additional-390.png` |
| 1440: fixture 01's ten values each on one line | Matches | `s3-job01-additional-1440.png` |
| 390 / 360 / 320: no value ends in "…"; every value's `scrollWidth` equals its `clientWidth` | Matches for fixtures 01, 04, 19 and 20 at all three widths | `s3-job01-additional-{390,360,320}.png`, `s3-impact19-additional-{390,360,320}.png`, `s3-entre20-additional-*.png` |
| 320: "Science and Engineering Associate Professionals" and "No formal education (No schooling attended)" wrap to 2 lines; the page doesn't scroll sideways | Matches. Both are 2 lines at 320 and 360; at 390 only the first is | `s3-job01-additional-320.png` |
| Unchanged: the closed row's count and preview | Matches: "Additional details · 10 · Industry, Job category +8"; "· 3 · Verified activity type, Difficulty +1"; "· 2 · Programme, Venture stage targeted"; "· 1 · Difficulty" | — |
| Unchanged: the classic page and the admin "info" classic section | Not seen (see "Couldn't see"). The admin info page renders the tabbed sections, so it shows S3's rows | — |

## S5: The Pay tile

| Spec item | Result | Screens |
| --- | --- | --- |
| The fact: id `pay`, label "Pay", value `payLine` verbatim, first | Matches (`detailFacts.ts:83`): "Pay · USD 1 000 / mo", then Ends, then How you take part | `s5-job01-header-1440.png` |
| Tone: tile `bg-orange-light`, icon `IoCashOutline` in `text-yellow`, from `md` only | Matches (`DetailHeaderCard.tsx:43`): the tile is `--color-orange-light`, the icon `--color-yellow`, shown at 768 and 1440 and hidden below | `s5-job01-header-768.png` |
| 1440: three across, the value on one line | Matches: `grid-cols-2 md:grid-cols-3`, three tiles of 392 px | `s5-job01-header-1440.png` |
| 768: three in one row, the value on one line | Matches: three tiles of 218 px | `s5-job01-header-768.png` |
| 390 and 360: Pay spans the row (334 / 304 px); Ends and Take part share the next | Matches: 334 and 304 px; the second row's tiles are 161 and 146 px | `s5-job01-header-390.png`, `s5-job01-header-360.png` |
| 320: Pay spans the row (264 px), 1 line, `scrollWidth` 320 | Matches | `s5-job01-header-320.png` |
| Event fixture 04 unchanged: Reward · Effort · Ends · Take part, 2 × 2 below `lg` | Matches. The card is **pixel-identical** to the pre-change capture at all five widths (0 differing pixels). So are Impact Action 19 and Entrepreneurship 20, which have no pay line | `s5-event04-header-*.png` |
| Fixture 01's card otherwise unchanged | Matches. At 1440 and 768 the only differing band is the strip (y 132–193). On phones the card is 71 px taller: one tile row and its gap | — |
| Admin info page: the same Pay tile above the stat strip | Matches at 1440, 390 and 320. The stat strip ("1 completed") keeps its own columns | `s5-admininfo-job01-header-{1440,390,320}.png` |
| Known trade-off: the server's first paint reads "1 000 / mo" | As the spec says: the server HTML has the tile with "1 000 / mo", which gains "USD" once the lookup lands. The tile is there from the first paint | — |
| "partner-paid" suffix; "Paid — amount not disclosed"; five tiles | Not testable locally (see "Couldn't see"). The suffix is in code (`DetailHeaderCard.tsx:135`) | — |

## S6: The title's focus outline

| Spec item | Result | Screens |
| --- | --- | --- |
| Classes: `rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-green` | Matches (`DetailHeaderCard.tsx:264`) | — |
| Keyboard path, 768 → 1440, 390 → 1440 and 320 → 1440 | Matches all three. After Enter on "Show less", focus is on the `h4`, `:focus-visible` is true, and the computed outline is `solid 2px` `--color-green`, offset 4 px, radius 8 px | `s6-keyboard-from{768,390,320}-1440.png` |
| The page doesn't scroll | Matches. With the page scrolled so the title sat 30 px above the viewport, Enter on "Show less" moved focus to the title and `scrollY` stayed at 250 (`preventScroll`, `:237`) | — |
| Mouse path: no outline | Matches: focus is on the `h4`, `:focus-visible` false, no outline | `s6-mouse-from{768,390,320}-1440.png` |
| Tab again: the outline goes and focus moves to the call to action | Matches: "Apply now" | `s6-keyboard-from*-1440-tab.png` |
| 768 alone, where the title stays clamped | Matches: the toggle stays, focus stays on it, and the title shows no outline | `s6-keyboard-768-alone.png` |
| 390 and 320: the toggle as before; no outline on the clamped title | Matches | `s6-390-after-toggle.png`, `s6-320-after-toggle.png` |

## S7: Skill labels

The spec's link, signed out, plus a known skill ("ActivePython"), both together, and a failed
lookup (the `lookup/skill/ids` request blocked in the browser).

| Spec item | Result | Screens |
| --- | --- | --- |
| Unknown ID: the chip "Preferred skills: Skill no longer listed" | Matches at 390 and 320, on 2 lines; the chip row scrolls sideways as before, and the page doesn't. At 1440 it is cut (see the Verdict) | `s7-bad-chip-{390,320}.png`, `s7-bad-chip-1440.png` |
| The control reads "Skill no longer listed ×" | Matches at all three widths; the remove button is named "Remove Skill no longer listed" | `s7-bad-control-{1440,390,320}.png` |
| No GUID anywhere, at any moment | Matches. An observer running from document creation recorded the chip as "Preferred skills: …" for 30–70 ms, then the label; no GUID ever reached the page text. The server HTML carries none | — |
| A known skill shows its name | Matches: "Preferred skills: ActivePython", "ActivePython ×" | `s7-good-chip-*.png`, `s7-good-control-*.png` |
| Names sit inline with a retired one | Matches: "Preferred skills: ActivePython, Skill no longer listed" | `s7-mixed-chip-1440.png` |
| "Skill name unavailable" when the lookup failed | Matches: after react-query's retries (about 8 s), the chip and then the control read "Skill name unavailable" | `s7-failed-chip-1440.png`, `s7-failed-control-1440.png` |
| The pending "…" stays | Matches (`lib/customFields/skillLabels.ts:31`) | — |
| Copy: `skillLabels.ts:28` "Skill no longer listed", `:37` "Skill name unavailable" | Matches | — |
| The detail page and the editor | Not testable locally (no saved Preferred skills value), as the spec says | — |

The search itself still fails with "Couldn't load these results" for the unknown ID. That is
API ask 25, as expected.

## S2: The editor's Details step and the youth completion form

| Spec item | Result | Screens |
| --- | --- | --- |
| Editor, 1440: fixture 04 "REQUIREMENTS · 1 field", fixture 01 "CLASSIFICATION · 2 fields" | Matches (`CustomFields.tsx:117`, `:857`). Fixture 19 reads "ACTIVITY · 1 field" and "REQUIREMENTS · 3 fields" | `s2-editor-event04-block-1440.png`, `s2-editor-job01-block-1440.png`, `s2-editor-impact19-block-1440.png` |
| Editor intro: "Details for this type of opportunity. They're shown to people and are searchable." | Matches (`pages/organisations/[id]/opportunities/[opportunityId]/index.tsx:3262`, rendered at `CustomFields.tsx:812`): 1 line at 1440, 2 at 390 and 320 | `s2-editor-job01-block-320.png` |
| 390 and 320: each heading row on one line, no overflow | Matches: every row is 20 px tall, its `scrollWidth` equals its width, and the document is 390 / 320 wide | `s2-editor-*-block-{390,320}.png` |
| The editor keeps the descriptions | Matches, e.g. "Employer economic sector: UN ISIC Revision 5, Section level." | `s2-editor-job01-block-320.png` |
| Completion form: "Additional details", no intro, no descriptions (Q2) | Matches on fixture 22 at 1440, 390 and 320. The block is the title, "PLACEMENT · 1 field" and "Employment start date" with its date input. The base showed "Actual placement start date, when known. …" under the field; it is gone (`OpportunityCompletionEdit.tsx:819`) | `q2-completion-{1440,390,320}.png` |
| Unchanged: the title, no type heading, the heading row's look | Matches | — |

## S4: The landing rail

| Spec item (as changed after the build) | Result | Screens |
| --- | --- | --- |
| "Latest opportunities" with "See all N →" on the same line | Matches at 1440, 390 and 320 (`DiscoveryLanding.tsx:107`): "See all 1 402 →". At 320 the title is 173 px of the 288 px row | `s4-rail-{1440,390,320}.png` |
| Subtitle "Latest start dates first", one line | Matches (`:108`). It is accurate: fixture 08, which starts in 30 days, leads the rail | `s4-rail-320.png` |
| The region's `aria-label` follows the title | Matches: "Latest opportunities" | — |
| "See all" lands on the same results | Matches: `/opportunities/discover?prefsOff=1`, the query string the code passed before | — |

## S8: The inherited skills chip (testuser)

| Spec item | Result | Screens |
| --- | --- | --- |
| "Skills: {n} of yours" | Matches: "Skills: 58 of yours" (`features/discovery/lib/chipGroups.ts:66`) on the landing, `?type=Job` and `?type=Learning`, in the inherited purple. It is 1 line at 1440, 390 and 320, and nothing overflows | `s8-landing-{1440,390,320}.png`, `s8-job-{1440,390,320}.png` |
| The note: "Skills you added or earned by completing opportunities. Jobs that ask for none of these are left out; jobs that list no skills stay in. Other types aren't affected." | Matches (`:77`). It is the chip's tooltip, after its label: "Skills: 58 of yours — Skills you added…" | — |
| Summaries without the group say "{n} of your skills" | Matches where a summary reaches it: the recent-search label reads "Job · Retail & Food Services +1 · South Africa · 20 years · Remote · Paid or rewarded · 58 of your skills" (`chipModel.ts:183`). The banner and the "Picked for you" subtitle name only the first two values, so the skills fall in their "+5" / "+1" | `s8-recent-1440.png` |

## Q3: YoID "Completed" values on phones

| Spec item | Result | Screens |
| --- | --- | --- |
| `wrapValues` with `columns={1}` in `MyOpportunityCustomFieldsSection` | Matches (`MyOpportunityCustomFieldsSection.tsx:56–57`) | — |
| The value is readable on phones | Matches. "Employment start date:" sits above "2026-09-29": the value is 326 px wide at 390 and 256 px at 320, where the base had 0 px | `q3-yoid-completed-390.png`, `q3-yoid-completed-320.png` |
| 1440 | One row, the value right-aligned at the card's far edge (see Observations) | `q3-yoid-completed-1440.png` |

## Observations for Jason (no action implied)

1. **A cut chip on desktop.** The chip's `md:truncate` at `max-w-40` (160 px) leaves 160 px for
   "group: value". A long value loses its meaning on desktop: "Preferred skills: Skill no lo…".
   Phones wrap to 2 lines and read in full. This predates the batch and applies to every chip.
2. **The YoID value on desktop is far from its label.** At 1440 "2026-09-29" sits at the card's
   right edge, about 1,000 px from "Employment start date:". The base put it about 370 px away,
   at the end of the first of two columns. The other lines in the same card ("Comment: Local
   fixture: …") read inline. This is S3's row as specced (`sm:justify-between`), on a card three
   times wider than the detail page's.
3. **A failed skill lookup shows "…" again when Filters opens.** Opening the panel re-runs the
   failed shared lookup. For about 7 s the chip goes back to "…" and the control shows "…",
   then both read "Skill name unavailable" again. It follows the rule ("…" while it loads); it is
   only a long wait when the API is down.
4. **`testuser` is not in the state `src/web/AGENTS.md` "Local data" describes.** It now has
   saved preferences: Type Job, Interests Retail & Food Services +1, Where South Africa, Age 20
   years, Engagement Remote, Pay Paid or rewarded. It also has 58 verified skills, not 57. The
   tester's 14:24 capture shows the same (machine-local:
   `~/.cache/cdp-tools/shots/tester-1262/s8-learning-1440.png`), so it predates my pass. Because
   of it, "58 of your skills" shows only in the recent-search label, not in the banner or the
   "Picked for you" subtitle.
5. **The skills note is a tooltip only** (the chip's `title`). There is no way to read it on a
   touch screen. This is the 2026-10-03 note pattern, unchanged here.

## Couldn't see (and why)

- **The classic page and the classic custom-fields section** (`CUSTOM_FIELDS_ENABLED` off). The
  kill-switch isn't something a read-only pass can flip, and the admin info page renders the
  tabbed sections. In code, the classic host (`OpportunityCustomFieldsSection`) gained only
  `resolveSkillsById`, not `wrapValues`.
- **A partner-paid tile, "Paid — amount not disclosed", five tiles, and the sticky bar's pay line
  beside a ZLTO pill.** No local opportunity has them. The spec's simulations stand.
- **A saved Preferred skills value** on the detail page and in the editor select. No local Job
  has one. The labels are covered by `lib/customFields/skillLabels.test.ts`.
- **The completion form for an Event, an Impact Action or Entrepreneurship.** I opened only
  fixture 22 (Job), to avoid writing Viewed records on more opportunities. The block is the same
  component with the same props.
- **The editor Preview header.** It is the same card as the public and admin info headers.
- **The tooltip itself** (S8's note). It was read from the `title` attribute; headless Chrome
  doesn't show tooltips.
- **iOS Safari and real devices.** Only headless Chrome is available.

## Seen, predating this batch (no action asked)

- **"Searching…" stays over "Couldn't load these results"** after the 400 for a retired skill.
  The base shows the same (`../2026-10-06-api-followups/cur-skill-chip-1440.png`).
- **"1 results · just now"** in the recent searches (`features/discovery/components/Filters/RecentSearches.tsx:89`).
- **The completion modal uses the system font** (`ui-sans-serif, system-ui…`) where the page uses
  Nunito and the site font. The tester's capture shows the same. I didn't isolate why.
- **The group heading's rule disappears on the completion form.** `border-gray-light` on the
  form's grey panel. The editor, on white, shows it.
- **The editor select cuts "Science and Engineering …" at 320** (fixture 01's Job category).
