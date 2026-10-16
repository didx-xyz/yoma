# Compare: the build against the 2026-10-06 detail-header spec

- **Spec:** [`2026-10-06-detail-header-mobile.md`](2026-10-06-detail-header-mobile.md), approved by
  Jason with every recommendation (its Status line).
- **Build:** the uncommitted working tree on `feature/cf-implementation`, on top of base
  `6cdf18d8`, after its review, test and one fix round. `DetailHeaderCard.tsx`, `lineClamp.ts` and
  `lineClamp.test.ts` are byte-identical to the lead's post-fix snapshot. That snapshot is a local
  commit on no branch, so its SHA is not cited here. Paths are relative to `src/web/src/`.
- **Screens:** `~/.cache/cdp-tools/shots/2026-10-06-detail-header-compare/` (machine-local).
  - Taken on the local stack, signed out, in a fresh throwaway profile, with the consent prompt
    and the first-visit welcome dismissed.
  - Sizes: 320 × 640, 360 × 740 and 390 × 844 (2x), plus 768 × 1024 and 1440 × 900 (1x).
  - Files: `build-*` is the header, `badge-*` the Filters badges, `wizard-*` the wizard footer.
    `build-measure.json` holds the raw measurements.
  - The pre-change captures are the `cur-*` files in `../2026-10-06-detail-header/`.
- **Session:** signed out throughout. No detail page was opened signed in.
  - The wizard was stepped to its last step and left without Finish, so nothing was saved.
  - The samples are the spec's a–h, found by title through the API. All eight still resolve to
    the spec's titles.

## Verdict

**The build matches the spec. I found no mismatches.**

- Every acceptance check passes at all five widths, for all eight samples, collapsed and
  expanded.
- No document scrolls sideways at the phone widths.
- No element in any card passes the card's padding (60 states checked).
- No title glyph passes its box (`scrollWidth` equals `clientWidth` everywhere).
- At 1440 every card is pixel-identical to its pre-change capture.
- At 768, samples a and c are identical above the toggle.

All six deviations the lead listed read well, or acceptably (3 and 6). The two smaller changes
outside the spec (the Filters badges and the wizard footer) read well.

**One observation, no action:** the clamp's "…" can still land inside the last visible word:
"Accra, Kumasi, Sunyan…" (sample a at 320, `build-a-job-real133-320-card.png`) and
"Creativit…" (sample d at 768, `build-d-event-768-card.png`).
- This is how Chrome places the ellipsis of a line clamp: it drops characters until "…" fits.
- The spec asks only for "4 lines ending in '…'", so this is not a mismatch.
- Defect 2 in the spec's "Current" (the "Transformatio…" case) therefore still happens, but much
  less often: the measure is wider and the clamp is 4 lines. When it happens, "Show full title"
  now shows the rest.
- There is no CSS-only way to make the ellipsis respect word breaks, so I propose nothing.

## H1: One grid; the logo joins the chip row below `md`

| Spec item | Result | Screens |
| --- | --- | --- |
| One grid, `grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 … md:gap-x-6` | Matches, with deviation 1's row template (`DetailHeaderCard.tsx:268`) | — |
| Public chip row `flex min-w-0 items-center gap-2 self-center md:self-start` | Matches (`:275`) | — |
| `LogoSquare`: `h-12 w-12 rounded-xl p-1.5 md:row-span-3 md:h-[76px] md:w-[76px] md:rounded-[20px] md:p-2`; the border, background and placeholder unchanged | Matches (`:138`). Below `md` the logo is 48 × 48 with a 12 px radius and a 34 px image. From `md` it is 76 × 76 with a 20 px radius and a 58 px image | `build-a-job-real133-320-card.png` |
| Below `md`, the chip row and the logo share row 1, with the chip centred on the logo | Matches for all 8 samples at 320, 360 and 390: the chip's centre and the logo's centre are both 44 px from the card's top | `build-c-entre-longorg-320-card.png` (the widest chip, "ENTREPRENEURSHIP") |
| At 320 the logo's left edge is 236 px from the card's left edge | Matches. It is 276 at 360 and 306 at 390 | — |
| Below `md`, the title, toggle and organisation line span both columns | Matches: they are 264, 304 and 334 px wide | — |
| From `md`, the logo spans rows 1–3 at the top right; the title and toggle sit in column 1 | Matches: the logo is at x 1156, y 28 at 1440 and at x 634, y 28 at 768. When the toggle shows, it takes the third row and the logo doesn't move | `build-a-job-real133-768-card.png` |
| 12 px from row 1 to the title; 8 px to the organisation line | Matches for all 8 samples at the three phone widths, collapsed and expanded | — |
| Admin chip row beside the 48 px logo | Not seen (it needs an admin sign-in) | — |

## H2: Title size, measure and clamp

| Spec item | Result | Screens |
| --- | --- | --- |
| `h4` classes `font-nunito col-span-2 mt-3 text-xl leading-tight font-black wrap-break-word text-black min-[390px]:text-2xl md:col-span-1 md:mt-2 md:text-[32px]`, plus `line-clamp-4 md:line-clamp-2` while collapsed | Matches, plus `focus:outline-none` and `tabIndex={-1}` (deviation 3) (`:207–208`) | — |
| Below 390: 24 px on a 30 px line, Nunito 900; 264 px at 320 and 304 px at 360 | Matches. The tracking is −1.2 px, as before, and the colour is `--color-black` | `build-a-job-real133-320-card.png`, `build-a-job-real133-360-card.png` |
| 390–767: 30 px (`text-2xl`) on a 37.5 px line, 334 px at 390 | Matches (tracking −1.5 px) | `build-a-job-real133-390-card.png` |
| From `md`: 32 px, unchanged | Matches (32 / 40 px) | — |
| The clamp is 4 lines below `md` and 2 from `md` | Matches: the computed `-webkit-line-clamp` is 4 at 320–390 and 2 at 768 and 1440 | — |
| `wrap-break-word` as a safety net; no word clipped | Matches: "Pharmacotherapy:" is whole at 320, with no glyph past the box. No sample needed a break | `build-b-learning-pharma-320-card.png` |

## H3: The "Show full title" toggle

| Spec item | Result | Screens |
| --- | --- | --- |
| It shows only when the clamp hides text (half-line tolerance) | Matches. **320 and 360:** a, c, d, e and f show it; b, h and g don't. **390:** a and c–f show it; b and h, exactly 4 lines, don't, so the tolerance works. **768:** a and c–f (deviation 5). **1440:** none | `build-b-learning-pharma-390-card.png`, `build-h-job-real68-390-card.png` |
| Button: `text-green col-span-2 mt-1 inline-flex items-center gap-1 justify-self-start py-0.5 text-sm font-semibold md:col-span-1`, `type="button"`, `aria-expanded`, `aria-controls` = the `h4`'s id | Matches (`:221`). It is 14 px, 600, `--color-green`, 24 px tall and 4 px below the title. It is 119 px wide closed and 87 px open, so the rest of the row doesn't toggle | `build-a-job-real133-320-card.png` |
| "Show full title" with `IoChevronDown` ↔ "Show less" with `IoChevronUp`, both `h-4 w-4` | Matches: the chevron is 16 px and is swapped, not rotated | `build-a-job-real133-320-expanded-card.png` |
| Open drops the clamp: sample a is 7 lines at 320 | Matches: 7 lines and a 516 px card, against 509 in the simulation. Open, sample a is 6 lines at 360, 7 at 390 and 4 at 768 | `build-a-job-real133-320-expanded-card.png`, `build-a-job-real133-768-expanded-card.png` |
| Kept while open; measured again on collapse | Matches. Sample c, opened at 768 and widened to 1440, keeps "Show less" over its 2 lines. Closing it removes the toggle | — |
| Reset to collapsed when the opportunity changes | Matches. Client-side navigation from an expanded sample a opens sample c clamped, with "Show full title" | `build-c-entre-longorg-320-after-client-nav.png` |
| At 768: reachable with Tab; Enter toggles; `aria-expanded` flips | Matches. The Tab order is title → toggle → call to action. Enter goes from 2 lines, `false`, to 4 lines, `true`, and back. The toggle shows the browser's focus ring | `build-a-job-real133-768-keyboard-open.png` |
| Known trade-off: the toggle appears at hydration | As the spec says. The server HTML carries the clamp classes but no toggle | — |

## H4: The organisation line below `md`

| Spec item | Result | Screens |
| --- | --- | --- |
| `<p className="col-span-2 mt-2 line-clamp-2 text-base font-semibold wrap-break-word text-black md:hidden">` with the countries span | Matches (`:300`). The countries are computed as `OpportunityOrgCountriesRow` does it | — |
| Sample a at 320: "Jobberman - Ghana · Ghana" on one line with no ellipsis; the name 16 px semibold black; "· Ghana" 14 px `text-gray-dark` | Matches: the name is 16 px, 600, `--color-black`; the countries are 14 px, 400, `--color-gray-dark` | `build-a-job-real133-320-card.png` |
| Sample c: 2 lines ending in "…"; the countries drop off | Matches at 320, 360 and 390 | `build-c-entre-longorg-320-card.png` |
| No 60% cap; the full width | Matches. The no-country names (d, e, f) wrap to 2 lines with no gap; "Umuzi" (g) is 1 line | `build-g-impact-short-320-card.png` |
| From `md`, the shared row is unchanged | Matches: "Org · Countries" sits beside the chip at 768 and 1440 | — |

## Motion and copy

| Spec item | Result |
| --- | --- |
| No motion added; nothing for `motion-reduce` to switch off | Matches. With `prefers-reduced-motion: reduce` emulated, the title, the toggle and the chevron all have `transition: all 0s` and no animation. The toggle swaps instantly |
| "Show full title" / "Show less" | Matches (`DetailHeaderCard.tsx:223`). "Show less" is the wording of `ClampedDescription.tsx:93` |
| " · {countries}" | Matches: the same separator, in the header's own line (`:300–308`) |

## Acceptance checks by width

| Width | Check | Result |
| --- | --- | --- |
| all | `scrollWidth` equals the viewport; nothing passes the card's padding | Matches at 320, 360 and 390. At 768 and 1440, `scrollWidth` is 10 px short of the window, because the desktop emulation has a classic scrollbar; there is no sideways scroll. No card element passes its 20 / 32 px padding |
| 320 | Checks 1–7 (row 1, title, a, b, h, g, the organisation lines) | All match. See the tables above |
| 320 | 8: sample a's call to action ends within the first screen (≤ 640; 543 in the simulation) | Matches: it ends at 550 (`build-a-job-real133-320-first-screen.png`). b and h end at 522 |
| 360 | Title 304 px at 24 px; a is 4 lines with the toggle (6 open); h is 3 lines, no toggle | Matches (`build-a-job-real133-360-card.png`, `build-h-job-real68-360-card.png`) |
| 390 | Title 334 px at 30 / 37.5 px; a is 4 lines with the toggle; b and h are 4 lines, no toggle | Matches |
| 1440 | Each card matches its `cur-…-1440-card.png`; no toggle | Matches. A pixel diff of every card against its pre-change capture finds 0 differing pixels for a, b, d, e, f and g. Sample c differs only in the top 50 px, where the pre-change capture caught the sticky section bar fading out (see "Seen, predating"). Below that band it is 0 |
| 768 | Sample a is clamped at 2 lines with the toggle, and is 4 lines open | Matches. a and c are pixel-identical to their `cur-…-768-card.png` above the toggle; everything below it moves down 28 px |
| other | Client-side navigation from an expanded a shows the new title clamped | Matches (see H3) |

## Verdicts on the accepted deviations

1. **`md:grid-rows-[auto_min-content_1fr]`: reads well.** At 1440 the seven pre-change samples are
   pixel-identical. At 768, a and c are identical down to the toggle. When the toggle shows, it
   lands in the `1fr` row, so the logo and the title don't move; when it doesn't, that row
   absorbs the logo's extra height (0–4 px), as the spec intended.
2. **The title is measured again once web fonts load: accepted on the code** (`:192`, guarded for
   a missing Font Loading API). On a fresh profile, every sample's toggle agreed with its laid-out
   lines. I didn't slow the font down to watch the second measurement happen.
3. **Focus moves to the title when the toggle disappears: reads acceptably.** I checked it two
   ways:
   - with the toggle focused at 768, widening the window to 1440 moves focus to the `h4`;
   - with sample c opened at 768 and the window widened, Enter on "Show less" removes the toggle
     and focus lands on the `h4`.

   There is no outline (`build-c-entre-longorg-1440-after-widen-focus.png`), so nothing visible
   marks focus at that moment. The next Tab goes to the call to action, which is where the user
   was heading. It only happens after a resize or zoom, so I'd leave it.
4. **Measured before paint: reads well.** I traced every animation frame of a client-side
   navigation:
   - from an expanded sample a to sample c, the frames go from a's state straight to c's, with
     "Show full title" already there (card 516 → 519 px);
   - from c to b, the toggle is gone in the same frame (519 → 398 px).

   No frame shows the new title without its toggle.
5. **c–f show the toggle at 768: reads well.** Titles of 119–121 characters run to 4 lines at
   32 px. The 2-line clamp cut them off before, and now they can be read
   (`build-d-event-768-card.png`; open, the card grows by 80 px).
6. **Sample c's call to action ends at 643 at 320 × 640: reads acceptably.** The label "Go to
   programme" reads in full; only the bottom 3 px of the pill is below the fold
   (`build-c-entre-longorg-320-first-screen.png`). It's a stress title. The real titles end at
   522–550.

## Outside the spec

**The Filters count badges: read well.** I checked them at one filter (`?type=Job`) and at
eleven: Job, 2 countries, 2 languages, Featured, Reward and 4 Job clauses.

- **The count includes type-specific filters.** Every place reads 11, so the 4 Job clauses are
  counted (`features/discovery/state/DiscoveryContext.tsx:417`).
- **The round badges:**
  - places: the desktop bar's button (`SearchBar/SegmentedSearchBar.tsx:166`), the floating
    button (`shared/FloatingFilterButton.tsx:45`) and the dialog and sheet headers
    (`Filters/FiltersDialog.tsx:42`, `Filters/FiltersSheet.tsx:51`);
  - size: a 20 × 20 circle for "1", and a 22 × 20 pill for "11". The height is the same and the
    digits stay centred;
  - colours: `--color-green` on white in the buttons, white on `--color-green` in the headers.
- **The mobile green button** shows the bare number beside the icon (`Discover/DiscoverySurface.tsx:263`),
  named "Filters (11)". At 320 the search pill beside it still reads "Search opportunities" in
  full.
- **Screens:** `badge-many-1440-bar.png`, `badge-many-1440-floating.png`,
  `badge-many-1440-dialog-head.png`, `badge-many-390-green.png`, `badge-many-320-green.png`,
  `badge-many-320-sheet-head.png`, `badge-many-320-floating.png`, and the `badge-one-*`
  equivalents.

**The wizard footer: reads well.**

- **"Skip this" is gone.** No step has it, from step 1 to the last (Accessibility).
- **Back is on the left; Continue and Finish sit flush with the row's right edge**
  (`Personalize/PersonalizeDialog.tsx:341`):

  | Width | Row | Continue |
  | --- | --- | --- |
  | 1440 | 644–1136 | 1002–1136 |
  | 390 | 16–374 | 240–374 |
  | 320 | 16–304 | 170–304 |

- **Back** is a 44 px circle, icon only, at 320.
- **No row scrolls:** `scrollWidth` equals `clientWidth` at all three widths.
- **Screens:** `wizard-1440-step1.png`, `wizard-390-step1-footer.png`,
  `wizard-320-step1-footer.png`, `wizard-320-last-footer.png`.

## Couldn't see (and why)

- **The admin info page and the editor Preview** (the H1 admin row, and the Preview at phone and
  desktop widths). They need an admin sign-in, which was not approved, and opening a detail page
  signed in writes a "Viewed" record.
- **An opportunity without a logo:** none exists locally.
- **Real logo shapes in the 48 px square:** every local logo is the same placeholder.
- **iOS Safari and real devices:** only headless Chrome is available.
- **Deviation 2 with a slow font:** not exercised (see its verdict).
- **Space on the toggle:** the browser daemon has no Space key. Enter was tested. It is a native
  `<button>`, so Space should work too.
- **The hydration shift, frame by frame:** not traced. The server HTML has no toggle, so the
  spec's known 28 px shift at hydration stands for clamped titles.

## Seen, predating this round (no action asked)

- **The desktop sticky section bar over the header after load.** For a moment after a page load,
  the bar (About · Requirements · …) can still be visible over the top of the header card. It is
  in the pre-change `cur-c-entre-longorg-1440-card.png` and `cur-c-entre-longorg-768-card.png`
  too. It was gone when I took the shots again, and I didn't isolate what triggers it. The sticky
  bars are unchanged this round.
- **At 768, the site's fixed "Feedback" tab** overlaps the card's right edge beside the action
  row. It does the same in `cur-c-entre-longorg-768-card.png`.
