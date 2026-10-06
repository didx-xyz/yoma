# Compare: the build against Jason's 2026-10-05 feedback-round spec

- **Spec:** [`2026-10-05-feedback-round.md`](2026-10-05-feedback-round.md), approved by Jason with
  every recommendation (its "Jason's answers").
- **Build:** the uncommitted working tree on `feature/cf-implementation`, on top of base
  `b7705af5`: W1 (F1–F5) and W2 (G1–G6, P1–P2, D1–D6) with their fix rounds. Its tracked and
  untracked files are byte-identical to the lead's "W2 r2" snapshot. That snapshot is a local
  commit on no branch, so its SHA is not cited here. Paths are relative to `src/web/src/`.
- **Screens:** `~/.cache/cdp-tools/shots/2026-10-05-compare/` (machine-local). Local stack,
  1440 × 900, 390 × 844 (2x) and 320 × 640 (2x), plus 360 × 740 for G5. All captures start with
  `c-`.
- **Session:** signed out, in fresh throwaway profiles. One anonymous wizard ("Get a job") was
  saved for G1, then cleared.
  - I signed in once as `testuser`, through the Login page and in a fresh profile, only to read
    the `payout` flags from the profile response the app loads anyway. The browser made no
    write calls.
  - I opened no detail page while signed in. The reason is under "Couldn't see".

## Verdict

**The build matches the spec, with one mismatch.**

1. **F4 chips at 1440:** the new operator words are cut off on desktop. `Chip.tsx:82`
   (`max-w-40 md:truncate`, unchanged since the base) caps a chip label at 160 px from `md` up.
   Four of the wordings this round introduced need more room than that:

   | Label | Width needed | Visible at 1440 |
   | --- | --- | --- |
   | Other tool description: Contains “dri” | 212 px | "Other tool description: Contai…" |
   | Employment duration: Up to 12 | 177 px | "Employment duration: Up …" |
   | Salary disclosed: Has any value | 174 px | "Salary disclosed: Has any val…" |
   | Minimum salary: 5000 – 9000 | 164 px | "Minimum salary: 5000 – 9…" |

   - The first and last are the spec's own acceptance examples.
   - The full label is still in the chip's `title` and in the × button's `aria-label`.
   - At 390 and 320 every one of them wraps to 2 lines and reads in full.
   - A fix is proposed under "Fix now".

I accept all nine deviations the lead listed. Two optional polish notes go to Jason: the P1
sentence's orphan at 390, and the header tiles' alignment at 320.

## F: Filters, the type-specific block

### F1: Typed values commit on blur or Enter

| Spec item | Result | Screens |
| --- | --- | --- |
| Type 5000 into Minimum salary From: no request, and the footer doesn't change | Matches: no POST, and the footer stays "Show 505 matches" | — |
| Tab to To: still no request | Matches (focus moves to "Minimum salary to") | — |
| Click outside the pair: exactly one results and one count request, carrying `GreaterThanOrEqual` `"5000"`; chip "Minimum salary: From 5000" | Matches: two POSTs to `/opportunity/search` (results and count), both 200, both with that clause | `c-f-1440-minsal-from5000.png` |
| Add 9000 in To and press Enter: one pair with `Between`; focus stays; chip "5000 – 9000" | Matches for the requests and focus. The chip text is cut at 1440 (see F4) | `c-f-1440-minsal-between.png` |
| Type 9000 into From (above To) and blur: the error shows, and no request fires; error in `text-pink` | Matches: no request; "The 'from' value must not be greater than 'to'." in `--color-pink` (`CustomFieldFilters.tsx:1226`) | `c-f-1440-minsal-inverted.png` |
| Empty both ends and blur: the clause is gone, no 400, and the chip goes | Matches: one pair with no `customFields`, both 200; the chip goes; the footer returns to 505 | — |
| Remove a chip: its field empties | Matches: on reopening the dialog, both ends are empty. The chips sit behind the modal, so this was tested by reopening | — |
| Impact Action → Other tool description: "dri" sends nothing; Enter sends one pair with `Contains`; chip "Other tool description: Contains “dri”" | Matches for the requests. The chip text is cut at 1440 (see F4) | `c-f-1440-impact-contains.png` |
| Salary disclosed offers Any / Yes / No; Any removes the clause | Matches: Yes sends `Equals` `"true"` and shows the chip "Salary disclosed: Yes". Any removes the chip; that query was served from cache, so no new request | — |
| L5, at 390 and 320: typing in From, then one tap on "Show N matches", commits and closes the sheet | Matches: the sheet closes on the first tap, with one pair carrying `GreaterThanOrEqual` `"5000"` | `c-f-390-after-show.png`, `c-f-320-after-show.png` |

### F2: Multi-selects grow and never widen the panel

| Spec item | Result | Screens |
| --- | --- | --- |
| Four Industry values (`K, E, D, J`): the control grows, the chips truncate, no sideways scrollbar, no overlap | Matches at all three widths. The control is 142 px tall; the chip labels end in an ellipsis (213 px boxes at 390, 143 px at 320); the scroller's `scrollWidth` equals its `clientWidth` (810, 390, 320); the next field starts 20 px below | `c-f-1440-industry4.png`, `c-f-390-industry4.png`, `c-f-320-industry4.png` |
| The spec's simulation: a 212 px control | The build is 142 px, because each truncated chip is one line. That is better than the simulation, not a miss | same |
| Every caller (Q7): the legacy `/opportunities` filter | Matches: it keeps its operator select ("Any of", "Is"); four values grow it to 142 px and truncate, with no overflow | `c-f2-legacy-1440.png`, `c-f2-legacy-1440-industry4.png` |
| The admin filter | Not seen (no admin sign-in) | — |

### F3: One operator per data type

| Spec item | Result | Screens |
| --- | --- | --- |
| No "Any of" / "Is" / "Has any value" select; each field is one control | Matches on all 14 Job fields and all 4 Impact Action fields | `c-f-1440-jobdetails-0.png`, `-1.png`, `-2.png` |
| Placeholders: Option and lookups "Any"; Skills "Search skills..."; String "Contains…"; numbers "From" / "To"; Boolean first option "Any" | All match (`CustomFieldFilters.tsx:724`, `:752`, `:770`, `:795`) | same |
| `inputMode`: `numeric` for Integer, `decimal` for Decimal | Matches: the salaries are `decimal`, Employment duration is `numeric` | — |
| Accessible names "{title} from" / "{title} to"; multi-selects keep their `inputId` | Matches. On the sheet the title carries its sub-group ("Compensation · Minimum salary from"), the same text as the visible label | — |
| Sizes: 40 px from `md`, 44 px below; at 320 the pair is two 134 px inputs | Matches: every control is 40 px at 1440 and 44 px at 390 and 320; the pair is 134 + 134 px at 320 and 169 + 169 px at 390 | `c-f-320-jobdetails-compensation.png`, `c-f-390-jobdetails-compensation.png` |
| `supportsMultiple` fields (Employment type, Preferred skills, Tools required) offer Any of only | Matches | — |
| Date and DateTime ranges (and L2) | Not seen: no such definition exists locally | — |

### F4: Chip wording

| Clause | Result | Screens |
| --- | --- | --- |
| Any of (Option) | Matches: the values only | `c-f5-1440-equalsK.png` |
| From only: "Minimum salary: From 5000" | Matches (fits in 160 px) | `c-f4-1440-chips.png` |
| To only: "Minimum salary: Up to 9000" | Matches: `LessThanOrEqual` `"9000"` | — |
| Between: "5000 – 9000" | The wording matches. **Mismatch at 1440:** shown as "Minimum salary: 5000 – 9…" | `c-f4-1440-chips.png` (the same cut on "Maximum salary") |
| Contains: "Contains “incub”" / "Contains “dri”" | The wording matches. **Mismatch at 1440:** shown as "Other tool description: Contai…" | — (measured; see the Verdict table) |
| Boolean: "Salary disclosed: Yes" | Matches | `c-f4-1440-chips.png` |
| Old link, Exists: "Has any value" | The wording matches. Cut at 1440 ("Has any val…"), as it already was before this round | — |
| Old link: "Is 5000", "Greater than 100", "All of Permanent, Internship", "Less than 12" | The wording matches. "Employment duration: Less than 12" and "…: Up to 12" are cut at 1440 | `c-f5-1440-oldmix.png` |
| Old link, Option Is: no prefix | Matches: "Industry: Telecommunications, …" | `c-f5-1440-equalsK.png` |
| 390 and 320 | Every label above reads in full, on at most 2 lines (`line-clamp-2` below `md`) | — |

### F5: Cleared fields and old links

| Spec item | Result | Screens |
| --- | --- | --- |
| `Equals` `"K"`: "Telecommunications…" is selected in the multi-select | Matches; the request carries the clause as sent | `c-f5-1440-equalsK.png` |
| `Exists`: it filters, shows the chip, and "From a shared link: Has any value." sits under the field in `text-gray-dark text-xs` | Matches at 1440, 390 and 320 (478 of 505 matches; `--color-gray-dark`, 12 px) | `c-f5-1440-exists.png`, `c-f5-390-exists.png`, `c-f5-320-exists.png` |
| `Equals` with `value: null`: no clause, no chip, no 400 | Matches: the request has no `customFields`; both 200; the heading reads "505 matches for Job" | `c-f5-1440-nullclause.png` |
| Other kept clauses each get their note | Matches: "From a shared link: Is 5000." and "From a shared link: Greater than 100." | `c-f5-1440-oldmix.png` |
| Editing a kept field replaces its clause | Matches: typing From 6000 and blurring sends `GreaterThanOrEqual` `"6000"`; the note goes; the other kept clauses are untouched | — |

## G: 320 px

Across every G surface at 320, the document never scrolls sideways (`scrollWidth` equals the
viewport) and no control passes its parent.

| Spec item | Result | Screens |
| --- | --- | --- |
| G1: with goal "Get a job" and `?q=zzqqxx`, the purple button takes 2 lines inside the card, with Clear search below | Matches: 2 lines, 240 px in a 240 px column; Clear search sits under it | `c-g1-320-nomatches.png` |
| G1: 1 line inside the card at 390; 1440 unchanged | Matches: 308 px in 310; at 1440 both buttons sit side by side on one line | `c-g1-390-nomatches.png`, `c-g1-1440-nomatches.png` |
| G2: at 320, "View impact action", "Go to programme" and "Go to opportunity" take 2 lines; Apply now, View event and Start learning take 1; all inside 48 px; Save and Share unchanged | Matches, with deviation 3's `px-2`. Save and Share are 48 × 48 circles | `c-g2-320-ImpactAction.png`, `c-g2-320-Learning.png`, `c-g2-320-Event.png`, `c-g2-320-Entrepreneurship.png`, `c-g2-320-Other.png`, `c-g2-320-Job.png` |
| G2: 390 and 1440 unchanged | Matches: `px-6`, 1 line for every type | — |
| G3: on steps 1–6 at 320, Continue is fully visible with no sideways scroll; Back is a 44 px circle named "Back" | Matches on all six steps: the row's `scrollWidth` 288 equals its `clientWidth` 288; Back is 44 × 44 and its "Back" span is `sr-only` | `c-g3-320-step1.png` … `c-g3-320-step6.png` |
| G3: 390 and 1440 keep the word | Matches: Back is 89 px wide, with its text; no row scrolls | — |
| G4: at 320 the Sort group ends at or before its row; every option is 44 px | Matches: the group spans 47–304 and the row's content edge is 304; the options are 63 / 106 / 81 × 44 | `c-g4-320-sort.png` |
| G4: 360, 390 and 1440 | 77 / 120 / 95 at 360 and 87 / 130 / 105 at 390, the same as the 2026-10-03 compare. 1440 is inline as before | `c-g4-390-sort.png`, `c-g45-1440-header-list.png` |
| G5: with `?type=ImpactAction,Entrepreneurship,Event,Other&view=list` at 320, no chip overlaps the status or the arrow; the status sits under the meta line; no title word is clipped | Matches on all 20 rows: the text column is 160 px; "1 day left" is the column's last line; titles clamp at 2 lines with an ellipsis, never mid-word | `c-g45-320-header-list.png`, `c-g5-320-list-2.png` |
| G5: at 390 and 360 the status stays in its column, and no meta item passes its left edge | Matches on all 20 rows at both widths (status left edge 257 and 227); "ENTREPRENEURSHIP" puts its ZLTO pill on a second line | `c-g45-390-header-list.png`, `c-g5-360-list-2.png` |
| G6: "Entrepreneurship" sits inside its tile at 320 | Matches: 83 px of text in an 88 px tile (2 px padding, 10 px type, −0.25 px tracking). 390 and 1440 are unchanged (11 px and 13 px) | `c-g6-320-welcome-tiles.png`, `c-g6-390-welcome.png`, `c-g6-1440-welcome.png` |
| No button or link renders 3 or more lines | Matches on the G surfaces | — |

The line audit flagged two places that are outside the G surfaces and are not wrapping labels:
- the stacked "Job filters" section header on the sheet: its title, meta line and badge read as 3
  line tops;
- the open Skills row on a Job detail page, whose note wraps by design.

## P: The wizard

| Spec item | Result | Screens |
| --- | --- | --- |
| P1, 1440, at 0 ("Get a job" + "Up to a minute" + Avestan) | Matches: a 40 px `IoWarningOutline`, `aria-hidden` and centred on the figure; "0" in `--color-yellow-light`; "opportunities match your answers so far"; then the sentence at 14 px | `c-p1-1440-0-avestan.png` |
| P1, at 1 ("Get a job" + Walloon) | Matches: a white "1", the singular "opportunity matches your answers so far", then the sentence | `c-p1-1440-1-walloon.png` |
| P1, at 5 or more | Matches: white, with no sentence ("Get a job" alone: 505) | `c-p1-1440-5plus-getajob.png` |
| P1, 390 and 320, compact row | Matches: a 24 px icon and a 13 px sentence; the panel grows from 107 to 151 px; nothing is clipped. The sentence is 2 lines at 390 (deviation 6) | `c-p1-390-0-avestan.png`, `c-p1-390-1-walloon.png`, `c-p1-320-0-avestan.png`, `c-p1-320-1-walloon.png` |
| P1, motion | Matches: with `prefers-reduced-motion: reduce` emulated, the number's `transition-property` is `none` and the sentence's `animation-name` is `none`; without it, a 0.3 s colour transition and `fade-in` | — |
| P2: "Your area and languages?" on 1 line at 1440, 390 and 320, with the subheading unchanged | Matches | `c-g3-320-step5.png` |

## D: The tabbed detail page

| Spec item | Result | Screens |
| --- | --- | --- |
| ZLTO (fixture 08), opened: the ZLTO icon and "200 ZLTO", the estimate sentence, then C1; "marketplace" goes to `/marketplace`; no chips | Matches. The icon is 20 px; the amount is 16 px / 800; the sentence is 14 px; C1 is 14 px `--color-gray-dark` with `mt-2`; the link is `--color-green`, 600, underlined | `c-d-1440-f08-incentive.png`, `c-d-390-f08-incentive.png`, `c-d-320-f08-incentive.png` |
| ZLTO preview "Earn 50 ZLTO" (fixture 02, closed) | Matches | — |
| No incentive (fixtures 05, 19, 01, 23): "Incentive · None" as a static row (no chevron, no hover) with its note | Matches | `c-d-1440-f05-incentive.png`, `c-d-320-f05-incentive.png` |
| Accessibility: 08 No, 05 Not specified, 19 On request (no list), each with its own value and note | All three match | `c-d-1440-f08-accessibility.png`, `c-d-1440-f05-accessibility.png`, `c-d-1440-f19-accessibility.png` |
| Accessibility with a list, opened (fixture 04, on request): no "Support:" line, then the on-request closing line | Matches | `c-d-1440-f04-accessibility.png` |
| Accessibility Yes with a list, opened (fixture 01): the Yes closing line | Matches: "Need something that isn't listed? Ask the provider before you start." | `c-d-1440-f01-accessibility.png` |
| Age range (fixture 19): "21–27 years" and "For people aged 21 to 27." | Matches. Fixtures 05 and 01 read "18 and over" / "For people aged 18 and over."; fixtures 02 and 06 read "Up to 30 years" / "For people aged 30 and under." | `c-d-1440-f19-age.png`, `c-d-320-f19-age.png` |
| Time needed (fixture 08): a static row, "About 1 week", with its note | Matches | `c-d-1440-f08-incentive.png` (the same frame) |
| Additional details: the open note | Matches on fixtures 05, 06 and 23 | `c-d-1440-f05-additionaldetails.png`, `c-d-320-f23-additionaldetails.png` |
| A paid Job: the preview is its salary, with the matching body | Matches on "Product Promoter - YogiPro (Sandton)" (`incentivized` true): preview "150–200 / hr"; body "The pay the employer has shared for this job." The pay line has no currency because none is stored, as on its card | `c-d-1440-yogiclosed-incentive.png`, `c-d-1440-yogi-incentive.png` |
| 390 and 320: the same content; notes wrap and never truncate; Accessibility No is 2 lines at 320; no row is clipped | Matches. Accessibility No is 2 lines at 320 and at 390; On request is 3 lines at 320 (the spec sets no count); no sideways scroll | `c-d-390-f08-accessibility.png`, `c-d-320-f08-accessibility.png`, `c-d-320-f19-accessibility.png`, `c-d-320-f05-accessibility.png` |
| Classic layout untouched (checked statically) | Matches: the classic class string at `OpportunityPublicDetails.tsx:615` is unchanged, and `Admin/opportunityCoreFields.ts` (`formatIncentivized`) has no diff since the base | — |
| C1 tailored, signed in with Cash Out closed | Not seen live (see "Couldn't see"). `testuser`'s profile has `payout.enabled: false`. Through `isCashOutClosed` (`components/Opportunity/TabbedDetails/detailSectionCopy.ts:174`) and the prop at `OpportunityPublicDetails.tsx:1283`, the build would show "Spend your Zlto in the marketplace." | — |

## Verdicts on the accepted deviations

1. **F2, the empty multi-select at 40 / 44 px: reads well.** Every empty control in the block
   is the same height: 40 px at 1440 and 44 px at 390 and 320. With the spec's plain `h-fit`,
   the 46 px multi-selects would have broken the column's rhythm. Grown, the control keeps one
   empty input line under the chips. That line is where typing goes, so it is fine.
2. **An invalid draft survives unrelated changes: reads well.** After "6000 / 5000", the field
   kept its values and the error through a Salary disclosed change, and Clear filters removed
   it (`c-f-1440-invalid-kept.png`). While it is invalid, the chip still says "From 6000", but
   the error line directly under the field explains the difference. Back/forward and a
   replayed search were not exercised.
3. **G2 `max-[359px]:px-2`: reads well.** At 320, "Start learning" is 1 line, and the three
   long labels are 2 lines inside 48 px, centred beside the icon. Nothing touches the pill's
   edge (`c-g2-320-ImpactAction.png`).
4. **G5, the money item wrapping in its column: accepted on the code.** The long case wasn't
   visible. No local opportunity has a long pay line, or a pay line together with a ZLTO pill.
   The short Job pay lines ("150–200 / hr", "25 000 / mo") sit on one line beside the chip
   (`c-g5-320-joblist-pay.png`). The rule (`OpportunityRow.tsx:160`) can only wrap inside the
   column, never past the status.
5. **The 320 header tiles (`px-2`, 14 px, word breaking): reads acceptably.** On Event fixture
   01, "3 months" breaks at the space onto 2 lines, and nothing breaks mid-word or overflows
   (`c-g2-320-Event.png`). The tiles centre their content vertically
   (`DetailHeaderCard.tsx:75`, `items-center`), so the wrapped tile's "Effort" label sits
   higher than its neighbours' "Ends" and "Take part". This is optional question 3 below. The
   admin stat strip is not seen.
6. **The P1 sentence on 2 lines at 390: accept.** It leaves "two." alone on the second line
   (`c-p1-390-0-avestan.png`). At 320 the break falls well ("…widening a / choice or two.").
   This is optional question 2 below.
7. **A stored reward counts as rewarded: reads well.** Fixture 06 is a Job with `incentivized`
   unanswered and a disclosed USD 1 000 / mo salary. Its public page now shows "Incentive ·
   USD 1 000 / mo" with "The pay the employer has shared for this job."
   (`c-d-1440-f06-incentive.png`, `c-d-390-f06-incentive.png`). That matches what its card
   shows. Fixture 15 (unanswered, nothing stored) still has no Incentive row. The ZLTO and
   partner halves aren't visible locally: every local ZLTO opportunity has `incentivized`
   true.
8. **"marketplace" as a non-link span in the editor Preview: accept on the code.** It isn't
   visible without an admin sign-in. The same classes (`OpportunityDetailSections.tsx:389`)
   keep the preview honest about what the youth sees, and a link would lose the unsaved draft.
9. **Cash Out "offline" keeps the full line: accept on the code.** It isn't visible locally. While
   the provider is offline, `supported` carries no information, so the hedged line ("in
   supported countries") is the truthful one.

## Fix now

**One small fix, for the F4 mismatch.** Give a chip label more room from `md` up. Desktop chips
wrap (`AppliedChips.tsx`), so the row can take it.

| `file:line` | Current | New |
| --- | --- | --- |
| `features/discovery/components/shared/Chip.tsx:82` (active chip label) | `line-clamp-2 max-w-40 font-semibold md:truncate` | `line-clamp-2 max-w-40 font-semibold md:max-w-64 md:truncate` |
| `features/discovery/components/shared/Chip.tsx:42`, `:58` (the ghosted and switched-off chips) | `max-w-40` | the same `md:max-w-64`, so every chip state shares one cap |

- **Width:** 256 px fits every label measured here; the widest is 212 px.
- **Below `md`:** nothing changes (still `max-w-40`, wrapping to 2 lines).
- **Departure:** the Chip comment's "Desktop keeps one line" still holds, with a wider line.
  Update its "`max-w-40 truncate`" sentence.
- **Other chips:** a few other long chips (for example "Interests: …") get wider at 1440 too.
  That is the reason this goes to Jason rather than straight to the developer.

## Questions for Jason

1. **Desktop chip width (the fix above):** raise the chip cap to 256 px from `md` up, so
   "Contains “dri”", "Up to 12" and "5000 – 9000" are readable at 1440? **I recommend yes.** The
   operator words were added so the chip says what it filters, and the cap cuts them off.
2. **Optional: balance the P1 sentence.** Add `text-balance` to
   `features/discovery/components/Personalize/LiveCountPanel.tsx:62`. The sentence then splits
   into two even lines at 390 instead of leaving "two." alone. It changes no copy and no
   height. I recommend yes; it is low priority.
3. **Optional: top-align the header tiles below 360.** Add `max-[359px]:items-start` to
   `components/Opportunity/TabbedDetails/DetailHeaderCard.tsx:75`. The labels then line up when
   one tile's value wraps. It is cosmetic, at 320 only. I'd take it with the chip fix, or leave
   it.

## Couldn't see (and why)

- **The signed-in C1 line.** On a published opportunity, the detail page's server side calls
  `PUT /myopportunity/action/{id}/view` for any signed-in user
  (`pages/opportunities/[opportunityId]/index.tsx:74-75`). That creates or updates a "Viewed"
  record on the account, which conflicts with "change nothing on the account", so I didn't open
  a detail page signed in. What I did confirm:
  - the flags: `testuser`'s `payout.enabled` is `false`;
  - the logic: in the D table above.

  To see it live, the lead or Jason needs to accept that `testuser` gains a "Viewed" entry for
  the fixture opened.
- **Cash Out "offline"** (deviation 9): no local provider state produces it.
- **D1 states with no local data:**
  - a depleted reward;
  - a partner incentive, with or without an amount;
  - ZLTO without an estimate;
  - a paid Job without a salary ("Paid");
  - a paid non-Job ("Paid or rewarded");
  - a stored ZLTO reward with `incentivized` unanswered;
  - the admin "Not specified".

  They are unit-tested (`detailSectionCopy.test.ts`).
- **Deviation 4's long pay line:** no seeded opportunity has one.
- **Needing an admin sign-in, which was not approved:**
  - the admin filter;
  - the editor Preview (deviation 8);
  - the admin Incentive row;
  - the admin stat strip at 320 (deviation 5).
- **Date and DateTime ranges (L2):** no such definition exists locally.
- **Drafts following a change while the sheet is open:** a chip's ×, a type deselected,
  back/forward and a replayed search. The chips sit behind the modal, so the chip case was
  tested by reopening. Clear filters was tested.
- **Hover:** the browser is headless. I checked the hover classes instead: static rows have
  none.
- **Accessibility "Yes" with no list:** the API forbids it.

## Seen, predating this round (no action asked)

- **The "Filters N" badge still counts no custom-field clauses.** It reads "Filters 1" with
  four clauses set (`c-f4-1440-chips.png`). The spec's "Seen, not in this round" already
  records this.
- **The welcome's close ×** stays at the top right while the welcome scrolls, so at 320 it sits
  over the corner of the "Don't be overwhelmed" card (`c-g6-320-welcome-tiles.png`). This
  round changed only the type tiles in `WelcomeStep.tsx`.
- **The legacy `/opportunities` filter overflowing at 320** is already in the follow-ups.
