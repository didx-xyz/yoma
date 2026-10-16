# Jason's feedback round: filters, 320 px, preferences, detail copy (2026-10-05)

- **Input:** Jason's 2026-10-05 feedback (quoted by the lead), `feature.md` Decisions up to the
  2026-10-03 W3 entry (they win), the handoff [`../handoffs/2026-10-03-a.md`](../handoffs/2026-10-03-a.md),
  and the previous spec [`2026-10-03-search-contract.md`](2026-10-03-search-contract.md).
- **Status:** approved by Jason on 2026-10-05, with every recommendation (answers below).

## Jason's answers (2026-10-05)

Every open question took its recommendation:

1. **P1:** 1–4 matches show the white number with the narrow-feed sentence beneath. Only 0 is a
   warning.
2. **P2:** "Your area and languages?" (his own wording).
3. **F3, String:** Contains.
4. **F3, numbers and dates:** the From–To pair, either end alone.
5. **F3, Boolean:** Any / Yes / No.
6. **F5, old links:** they search as sent; a note under the field shows a clause its control can't.
7. **F2:** fixed for every caller of the shared control.
8. **D5:** Time needed is a static row with a note.
9. **D1, C1:** the hedged cash-out line, tailored when signed in.
10. **G:** `max-[359px]:` (the lead's call; a technical choice).

**Goals stay single-select.** Jason and Adrian decided this together. It is not a deferral.
- **Base:** `b7705af5` (the tree was clean). Paths are relative to `src/web/src/`.
- **Screens:** `~/.cache/cdp-tools/shots/2026-10-05-feedback/` (machine-local). Local stack, signed
  out, at 1440 × 900, 390 × 844 (2x) and 320 × 640 (2x), with the consent prompt dismissed. Files
  starting `sim-` are DOM simulations of this spec on the live page, not builds.
- **Sign-in:** not used. Jason approved `testuser` for this task, but no signed-in screen changes
  this spec. The detail page's call to action, Save and Share are the same elements signed in and
  signed out. The signed-in-only states (Pending verification, Completed) render full width on
  their own row, so they can't wrap the way the call to action does.
- **Behaviour stays as it is**, with three exceptions. Each one comes from Jason's feedback and is
  marked where it appears:
  - F1: typed custom-field values commit on blur or Enter;
  - F3: discovery stops offering operators;
  - F5: a cleared field removes its clause. Today it sends an empty clause and the search fails
    with a 400.
- **No new requests.** The detail copy reads only the fields `OpportunityInfo` already carries,
  plus the currency lookup and the profile atom the page already has.

## Task index

| Id | Surface | Task | Priority |
| --- | --- | --- | --- |
| F1 | Filters, type-specific block | Typed values commit on blur or Enter, not on every keystroke | 1 |
| F2 | Filters, type-specific block | Multi-selects grow in height and never widen the panel | 1 |
| F3 | Filters, type-specific block | One fixed operator per data type; no operator select (discovery only) | 1 |
| F4 | Applied chips | Chip wording for the fixed operators | 1 |
| F5 | Filters / URL | Cleared fields remove their clause; old links keep working | 1 |
| G1 | No matches | "Search without my preferences" wraps inside its card | 2 |
| G2 | Detail header | The call to action fits in 2 lines at 320 | 2 |
| G3 | Wizard footer | Back is icon-only below 360 px, so the row stops scrolling | 2 |
| G4 | Results header | The Sort control fits its row at 320 | 2 |
| G5 | Results list (mobile) | The type chip and money wrap instead of running under the status; the status moves under the title below 360 px | 2 |
| G6 | Welcome | "Entrepreneurship" fits its tile at 320 | 2 |
| P1 | Wizard count panel | The count is always shown: a warning at 0, the narrow-feed hint below 5 | 3 |
| P2 | Wizard step 5 | Shorter title | 3 |
| D1 | Detail, Incentive | Says what you get, per state; ZLTO amount and the marketplace / cash-out line | 4 |
| D2 | Detail, static rows | Static rows show a one-line note | 4 |
| D3 | Detail, Accessibility | Distinct notes for No, Not specified and On request; better bodies | 4 |
| D4 | Detail, Age range | A note | 4 |
| D5 | Detail, Time needed | A static row with a note (Q8) | 4 |
| D6 | Detail, Additional details | A note | 4 |

**Not in this round:**
- **Several goals in step 1.** Jason and Adrian decided on 2026-10-05 to keep goals
  single-select. The API stores a single `GoalId`, and every goal surface stays as it is.

---

## Open questions for Jason (each with a recommendation)

1. **The count panel for 1–4 matches (P1).** Your note covers 0.
   - **(a) Recommended:** show the number in the normal white, and the narrow-feed sentence below
     it. Only 0 gets the warning colour. A real "3" is honest, and the hint still helps.
   - (b) Use the warning treatment for 1–4 as well.
   - (c) Show the number alone for 1–4, and the sentence only at 0.
2. **The step-5 title (P2).**
   - **Recommended:** your "Your area and languages?". It fits one line at 320, and the other
     titles are questions too.
   - The alternative is "Where you are, and your languages".
3. **The default for String fields (F3).**
   - **Recommended: Contains.** The String fields are free-text descriptions ("Other tool
     description", "Other programme"). Any of would need someone to type the exact stored text.
4. **Numbers and dates (F3).**
   - **Recommended:** a From–To pair. Either end alone works:
     - From alone sends ≥;
     - To alone sends ≤;
     - both send Between.

     That covers "salary at least 5 000" without an operator.
   - The alternative is Any of with comma-separated values, which nobody uses for salaries.
5. **Boolean fields (F3).**
   - **Recommended:** keep the select, with "Any" (no filter), "Yes" and "No". Any of on true /
     false filters nothing, which is why YOM-1260 left it out.
6. **Old links that carry another operator (F5).**
   - **Recommended:** a link searches exactly what it says.
     - A clause the new control can show is shown in it. These are Any of, the Option "Is", From,
       Up to, Between, Contains, and the Boolean "Is".
     - Any other clause still filters and keeps its chip. A one-line note under the field shows
       it, and editing the field replaces it.
   - The alternative is to rewrite or drop such clauses when the link is read. That would quietly
     change what a shared link returns.
7. **Fix the multi-select overflow for every caller (F2)?**
   - **Recommended: yes.** The bug is in YOM-1260's shared control, and it also overflows the
     admin list filter and the legacy `/opportunities` filter. The fix is the `h-fit` those other
     screens already use.
   - The alternative keeps it discovery-only, behind the same opt-in prop as F3.
8. **Time needed (D5).**
   - **Recommended:** a static row like Age range: "Time needed · About 1 week", with the note
     always visible. One value has nothing to open.
   - The alternative keeps the disclosure and rewrites its body.
   - Either way, the current body's "Most people finish in 1 week or less" goes. No data behind it
     says what most people do.
9. **The ZLTO cash-out line (D1).**
   - **Recommended wording:** "Spend your Zlto in the marketplace, or cash it out for real money
     in supported countries.", where "marketplace" links to `/marketplace` (Spend and Cash Out both
     live there).
   - It says "supported countries" because Cash Out is gated:
     - by environment (`payout.enabled`: on in Staging and Production, off locally and on DEV);
     - by the youth's profile country;
     - by a complete profile.
   - Two choices on top of the wording:
     - **"Zlto" in prose.** This follows the Cash Out copy rules in `lib/payout/copy.ts:16-19`
       ("Zlto" in prose, "ZLTO" as the unit, "cash out" as the verb).
     - **Signed in, it is tailored.** If the youth's profile says Cash Out isn't open to them
       (`payout.enabled === false`, or `payout.countryAvailability.supported === false`), the line
       keeps only its marketplace half.
10. **Breakpoint for the 320 fixes (G2–G4, G6).**
    - **Recommended:** `max-[359px]:`, so 360 px and up render exactly as today. The codebase
      already uses arbitrary narrow variants (`max-[370px]:` in `OpportunityPublicSmall.tsx:110`).
    - G1 and G5 also have to change at 390, because those overlaps happen at 390 too.

## Notes for the lead (logic, no visible change of their own)

- **L1. Incomplete clauses never reach the API** (F5).
  - Discovery never runs `sanitizeCustomFieldFilters`, so today a cleared field dispatches
    `{ operator: "Equals", value: null }` into the URL and the request. The results and the count
    then 400 (`f-320-cf-cleared-400.png`; 8 failed requests).
  - F1's commit removes the clause instead. `parseCustomFields` (`features/discovery/lib/urlCodec.ts:66-80`)
    should also drop incomplete clauses read from old links or recent searches. Use the existing
    `sanitizeCustomFieldFilters` (`components/Opportunity/CustomFieldFilters.tsx:165-176`).
- **L2. DateTime "To"** should send the end of that day: `dateInputToUTCEndOfDay`
  (`lib/utils.ts:125`), not `dateInputToUTC`. Otherwise "To 3 Nov" misses everything later on
  3 Nov. Date-only fields send the date as typed. **No Date or DateTime definition exists
  locally**, so this is unseen.
- **L3. D1 needs `moneyFactsOf`** inside the sections memo. It is computed today at
  `OpportunityDetailSections.tsx:724`, after the memo. It needs the currencies query the component
  already runs (`:321`), and no new request.
- **L4. Q9's tailoring** reads `userProfileAtom`, which `OpportunityPublicDetails` already has. It
  is only meaningful signed in; signed out, the full line shows.
- **L5. F1's commit timing.** A tap on "Show N matches", the sheet's X or a section header blurs
  the field first, so the commit lands before the click. Check that the sheet still closes on the
  first tap.

---

## F — Filters dialog / sheet, the type-specific block (block 5)

### Current

- **Screens:**
  - `f-320-sheet.png` and `f-320-cf-current.png`: Job details at 320. Every field is two stacked
    controls, the operator and then the value.
  - `f-1440-cf-current.png`: the same in the dialog. Four Industry values overflow it sideways and
    down.
  - `f-320-multiselect-overflow.png` and `f-390-multiselect-overflow.png`: the multi-select spills
    over the next field and widens the whole sheet to 806px.
  - `f-320-cf-cleared-400.png`: after a cleared value, the footer falls back to "Show results".
- **What's wrong:**
  - **A search runs on every keystroke.** Typing "123" into Minimum salary sent 3 results and 3
    count requests, each with a different value: `5000 1`, `5000 12`, `5000 123`.
    `CustomFieldFilters.tsx:780-786` calls `onChange` per keystroke, and `TypeSpecificFilters.tsx:242-249`
    dispatches straight into the search state.
  - **Clearing a value breaks the search.** The clause stays, with `value: null`, and the API
    rejects it (400). This applies to every typed field, and to a multi-select cleared with its ×
    (`values: null`).
  - **The operator select costs a row per field** and asks a question youth don't need to answer.
    Job details is 14 fields, so 28 controls at 390.
    - The defaults are uneven: `operators[0]` (`:801-803`) gives Any of for Option, Contains for
      String, and "Is" for numbers and dates. So "Minimum salary: 5000" means exactly 5 000.
  - **Multi-select overflow** has two causes:
    - `REACT_SELECT_CONTROL_CLASSES` (`:382-383`) lacks `h-fit`, so daisyUI's `.input` keeps the
      control at 40px while the chips grow;
    - the field is a daisyUI `.fieldset`, a grid, whose items keep `min-width: auto`. The row grows
      to the longest chip's width: 778px inside a 276px field at 320.

### Changes

**One opt-in API on the shared component.** `CustomFieldFilters` gains two props, both default
`false`, documented like `largeTouchTargets` (`:411-416`):

- `commitOnBlur` (F1, F5);
- `fixedOperators` (F3, F4, F5).

Only discovery's caller (`TypeSpecificFilters.tsx:236-250`) passes them. The admin filter
(`OpportunityAdminFilterVertical.tsx:159`) and the legacy filter (`OpportunityFilterVertical.tsx:709`)
render exactly as before, except for F2 if Jason takes Q7.

#### F1 — Typed values commit on blur or Enter (`commitOnBlur`)

- **Applies to** the typed controls: the String text input, both number inputs and both date
  inputs.
- **Each typed input keeps a local draft.** `onChange` updates the draft only. Nothing is
  dispatched while typing.
- **It commits:**
  - on blur;
  - on Enter (focus stays in the field);
  - for a From–To pair, only when focus leaves the pair. Tabbing from From to To doesn't commit,
    so one edit of both ends is one search.

  This matches `FreeTextSearchInput`'s rule (`features/discovery/components/shared/FreeTextSearchInput.tsx:28-31`):
  - trim the text;
  - an empty draft commits "no value", which removes the clause (F5);
  - nothing is dispatched when the committed value wouldn't change.
- **The draft follows the committed value when it changes from outside:**
  - a chip removed;
  - Clear filters;
  - a recent search replayed;
  - a type deselected.

  Use the same "adjust state on a prop change" pattern as `FreeTextSearchInput.tsx:19-26`
  (2026-10-02 Decision). Without it, a stale draft would commit back over the change on the next
  blur.
- **An invalid draft is never committed:**
  - a number error from `getCustomFieldNumberError`;
  - an inverted range.

  The committed clause stays as it was. The existing error line shows straight after the blur
  (`:846-852`). In discovery it takes the token `text-pink` instead of `text-red-500`; the text is
  unchanged.
- **Discrete controls still commit on change:** the Option multi-selects and the Boolean select.
  A pick is already a decision.
- **Motion:** none.

#### F2 — Multi-selects grow and never widen the panel

- Add `h-fit` to `REACT_SELECT_CONTROL_CLASSES` (`:382-383`). It becomes
  `"input w-full !border-gray pr-0 pl-2 h-fit py-1 text-sm"`, which is exactly
  `ListPageFilterDialog.tsx:21`'s string.
- Add `min-w-0` to:
  - the `fieldset` (`:807`);
  - its operator / value row (`:819`) and the value wrapper (`:841`), or in F3 mode the one
    control wrapper.

  The long option chips then truncate with an ellipsis inside the control. The full names are
  still in the menu and in the applied chip.
- Simulated on the live page: `sim-f-320-multiselect-fixed.png`. The four Industry values stack
  inside a 212px-tall control, and the sheet's scroll area is back to 320 = 320.
- **For every caller** (Q7). If Jason prefers discovery-only, put both classes behind
  `fixedOperators`.

#### F3 — One operator per data type (`fixedOperators`)

- **No operator select:** `:820-839` is not rendered. Each field is its label, then one control at
  full width.
- **The clause shapes are the API's own.** Nothing new reaches the request.

| Data type | Operator sent | Control | Placeholder |
| --- | --- | --- | --- |
| Option, inline options | `AnyOf` (`values`) | react-select multi, as today | "Any" |
| Option, Currency / Country / Language / Education lookup | `AnyOf` (lookup ids) | react-select multi, as today | "Any" |
| Option, Skill lookup | `AnyOf` | the async multi, as today | "Search skills..." (unchanged) |
| String | `Contains` (`value`) (Q3) | text input | "Contains…" |
| Integer / Decimal | From alone: `GreaterThanOrEqual`; To alone: `LessThanOrEqual`; both: `Between` (Q4) | two number inputs side by side, `grid grid-cols-2 gap-2`; `inputMode="numeric"` for Integer, `"decimal"` for Decimal | "From" / "To" |
| Date / DateTime | the same as numbers (L2 for DateTime To) | two date inputs, `grid grid-cols-2 gap-2` | "From" / "To" via `aria-label` (date inputs show no placeholder) |
| Boolean | `Equals`; "Any" sends nothing | the native select, as today | first option "Any" (was "Select...") |

- **Accessible names:** the range inputs get `aria-label="{title} from"` and `"{title} to"`. The
  multi-select keeps `inputId` (`:661`).
- **Sizes:** the controls keep their `largeTouchTargets` sizes: 44px below `md`, 40px from `md`.
  At 320 the range pair is two 134px inputs inside the sheet's indented column (276px).
- **Height saved:** about 50px per field below `md`, so Job details shrinks by roughly 700px at
  390.
- **Option fields with `supportsMultiple`** (Employment type, Preferred skills, Tools required)
  also get Any of. All of is not offered in discovery.

#### F4 — Chip wording for the fixed operators

- **Where:** `features/discovery/components/Results/AppliedChips.tsx:84-86`, discovery only. The
  shared labeler (`useCustomFieldFilterLabeler`) is unchanged, so admin and legacy badges are
  untouched.
- **The rule:** the chip reads "{field title}: {value}". The value is the labeler's text, prefixed
  with the operator's existing label (`CUSTOM_FIELD_FILTER_OPERATOR_LABELS`, `CustomFieldFilters.tsx:103-114`)
  when the value alone would mislead.

| Clause | Chip |
| --- | --- |
| Any of (Option) | "Industry: Construction, Mining and quarrying" (unchanged) |
| Contains | "Other programme: Contains “incub”" |
| From only (≥) | "Minimum salary: From 5000" |
| To only (≤) | "Minimum salary: Up to 9000" |
| Between | "Minimum salary: 5000 – 9000" (the labeler's own) |
| Boolean | "Salary disclosed: Yes" (unchanged) |
| Old link: Exists | "Salary disclosed: Has any value" (unchanged) |
| Old link: Is (number, string, date) / Greater than / Less than / All of | "Is 5000" / "Greater than 5000" / "Less than 5000" / "All of Permanent, Internship" |
| Old link: Is (Option) | "Industry: Construction" (no prefix; it reads as a selected value) |

#### F5 — Cleared fields and old links

- **Clearing removes the clause.** With `commitOnBlur`, the component never emits an incomplete
  clause:
  - an empty typed draft;
  - a multi-select cleared to nothing;
  - Boolean "Any";
  - a range with both ends empty.

  Each of these emits the clause list without that key. This mirrors the free-text search, which
  commits `null`. L1 drops incomplete clauses already sitting in old URLs.
- **Old links with another operator** (Q6), in `fixedOperators` mode:
  - **Shown in the control:** Option Any of, and Option Is (shown as the one selected value), ≥,
    ≤, Between, Contains, and Boolean Is. The first edit rewrites the clause to the fixed operator.
  - **Anything else is kept as sent.** It still filters and keeps its chip (F4 wording). The field
    shows its control empty, with one line under the label, `text-gray-dark text-xs`:
    **"From a shared link: {chip value}."**
    - Editing the control replaces the clause.
    - The chip's × removes it.
- **Motion:** none.

### Copy

| `file:line` | Current | New |
| --- | --- | --- |
| `components/Opportunity/CustomFieldFilters.tsx:660` (fixed mode) | Select... | Any |
| `components/Opportunity/CustomFieldFilters.tsx:692` (fixed mode) | Select... | Any |
| `components/Opportunity/CustomFieldFilters.tsx:778` (fixed mode, String) | Value... | Contains… |
| `components/Opportunity/CustomFieldFilters.tsx:748` / `:761` (fixed mode, number range) | From... / To... | From / To |
| new, fixed mode, under the label of a kept old clause | — | From a shared link: {chip value}. |
| `features/discovery/components/Results/AppliedChips.tsx:86` | {value} | {operator label} {value} for the cases in the F4 table; "Contains “{value}”" for Contains |
| `components/Opportunity/CustomFieldFilters.tsx:242` | The 'from' value must not be greater than 'to'. | unchanged (shared with admin and legacy) |

### Acceptance

- **1440, signed out.** Open `/opportunities/discover?type=Job`, then Filters → Job filters → Job
  details.
  - No field shows an "Any of" / "Is" / "Has any value" select. Every field is one control.
  - **Minimum salary:**
    - Type 5000 into From. No `/opportunity/search` request fires while typing, and the footer
      count doesn't change.
    - Tab to To. Still no request.
    - Click outside the pair. Exactly one results request and one count request, carrying
      `{"key":"jobSalaryMinimum","operator":"GreaterThanOrEqual","value":"5000"}`. The chip reads
      "Minimum salary: From 5000".
    - Add 9000 in To and press Enter. One pair, with `Between`. The chip reads "5000 – 9000".
    - Type 9000 into From (now greater than To) and blur. The error line shows, and no request
      fires.
    - Empty both ends and blur. The clause is gone from the next request, no request is
      answered 400, and the chip goes.
  - **Remove a chip:** its field empties.
  - **Impact Action → Other tool description:** type "dri". No request. Press Enter: one pair with
    `Contains`, and the chip reads "Other tool description: Contains “dri”".
  - **Salary disclosed** offers Any / Yes / No. Choosing Any removes its clause.
  - Load `?type=Job&cf=[{"key":"jobIndustry","operator":"AnyOf","values":["K","E","D","J"]}]`
    (URL-encoded) and open the field:
    - the control grows in height;
    - the chips truncate inside it;
    - the dialog has no horizontal scrollbar;
    - the next field doesn't overlap.
- **390 and 320, the sheet.**
  - The same checks pass.
  - With the four Industry values, the sheet's scroll area has `scrollWidth == clientWidth`.
  - The From–To pair sits side by side, and each input is 44px tall.
- **Old links:**
  - `cf=[{"key":"jobIndustry","operator":"Equals","value":"K"}]` shows Telecommunications…
    selected in the multi-select.
  - `cf=[{"key":"jobSalaryDisclosed","operator":"Exists"}]` filters, shows the chip "Salary
    disclosed: Has any value", and shows "From a shared link: Has any value." under the field.
  - `cf=[{"key":"jobSalaryMinimum","operator":"Equals","value":null}]` loads with no clause, no
    chip and no 400.
- **The other callers are unchanged:**
  - the admin opportunities filter and the legacy `/opportunities` filter still show the operator
    select;
  - their typed inputs still update as before;
  - only the F2 overflow is fixed there, if Q7 is taken.

### Departures

- **YOM-1260's operator matrix** (its `feature.md` "Operator matrix offered by the UI") is narrowed
  to one operator per type, on discovery only (Jason). Admin and legacy keep the full matrix.
- **YOM-1260 2026-08-11 "Badges show the value only"** no longer holds for discovery's chips. A
  bare "5000" can't say whether it is a minimum or a maximum now that the operator isn't on screen.
- **Commit on blur adds a step** for typed fields: one search per edit instead of one per
  keystroke. The free-text search already works this way.

---

## G — 320 px is the minimum mobile width

### Current

- **Swept** at 320 × 640 (and 390): the landing, the results grid and list, the filters sheet,
  the welcome, all six wizard steps and the tabbed detail page.
- **Measured:** every visible button and link's rendered text lines, overflow beyond its own box,
  and overflow beyond the viewport outside a scroller.

| # | Where | What happens at 320 | Screen |
| --- | --- | --- | --- |
| G1 | No matches, "Search without my preferences" (`features/discovery/components/Results/NoMatches.tsx:67-74`) | It doesn't wrap at all. The 324px button overflows its 240px column and the 320 viewport. At 390 it still overflows its column by 14px. daisyUI's `.btn` is `flex-shrink: 0` with a fixed height. | `g-320-nomatches.png`, `g-390-nomatches.png` |
| G2 | Detail header call to action (`components/Opportunity/OpportunityPublicDetails.tsx:606-622`) | "View impact action" wraps to 3 lines and is clipped by the 48px height. "Start learning", "View event", "Go to programme" and "Go to opportunity" wrap to 2 lines in a 148px button whose `px-6` and icon leave 76px for text. The mobile bottom bar is fine (1 line). | `d-320-impact-actions.png`, `d-320-f08-actions.png`, `d-320-impact-bottombar.png` |
| G3 | Wizard footer (`features/discovery/components/Personalize/PersonalizeDialog.tsx:322-350`) | Back + Skip this + Continue need 291px in 288px. The row scrolls sideways, so Continue is clipped at the right on steps 1–5 (on step 5 the row scrolled and Back was clipped). | `p-320-step1.png`, `p-320-step5.png` |
| G4 | Results header, Sort (`features/discovery/components/Results/SortControl.tsx:22-45`) | The segmented control overflows its row by 14px: it ends at 318 in a row that ends at 304. | `g-320-results-header.png` |
| G5 | Results list, mobile row (`features/discovery/components/Results/OpportunityRow.tsx:145-176`) | The text column is 94px. "ENTREPRENEURSHIP" (123px, `shrink-0`) and the ZLTO chip run under "1 day left" and the arrow, and long title words are clipped mid-word ("Collaboration"). At 360, 12 of 20 rows overlap; at 390, 4 do. | `g-320-results-list.png`, `g-390-results-list-overlap.png` |
| G6 | Welcome type tiles (`features/discovery/components/Personalize/WelcomeStep.tsx:302`, `:311`) | "Entrepreneurship" is 91px of text in an 80px content box (`whitespace-nowrap`), so it touches the tile edges. | `g-320-welcome-tiles.png` |

- **Checked and fine at 320:**
  - the landing, rails and cards (`g-320-landing-full.png`);
  - the grid cards, including "View impact action →" and "View programme →" on one line
    (`g-320-results-grid-impact.png`);
  - the filters sheet chrome and footer (`f-320-sheet.png`);
  - the wizard step contents;
  - the quick-search pills, which take 2 lines in the welcome's 2-column grid;
  - the detail tabs and section cards.

### Changes

- **G1.** Both NoMatches buttons (`SOLID_GREEN`, `:6-7`, and the purple outline, `:70`) add
  `h-auto max-w-full shrink whitespace-normal py-2.5 leading-tight max-md:px-4`. The label goes in
  a `<span className="min-w-0">`, so the text can wrap beside the icon.
  - Result: 1 line at 390 (the label needs 308px of 310), 2 lines at 360 and 320.
  - `min-h-12` stays.
- **G2.** The tabbed class string only (`:612`); the classic string is untouched. Add
  `leading-tight max-[359px]:px-3`.
  - At 320 that leaves 100px for text: Apply now, View event and Start learning take 1 line;
    View impact action, Go to programme and Go to opportunity take 2. Two lines of 14px fit the
    48px button.
  - No copy change: the CTA strings are shared with the classic page and the legacy cards.
- **G3.** Below 360 the Back button (`:326-333`) is icon-only:
  - the word goes in `<span className="max-[359px]:sr-only">Back</span>`;
  - the button adds `max-[359px]:w-11 max-[359px]:px-0`.

  It stays 44px, and its name is still "Back". The row then fits with no sideways scroll.
- **G4.** The Sort options (`:38`) add `max-[359px]:px-2`. That is 24px saved, so the group is
  245px in the 257px left beside "Sort".
- **G5.** In the mobile row:
  - the meta line (`:151`) adds `flex-wrap gap-y-1`. The chip, the money and the place wrap to a
    second line instead of overlapping;
  - the title (`:148`) adds `wrap-break-word`, as `NoMatches.tsx:87` does;
  - below 360 only:
    - the status column (`:163-167`) adds `max-[359px]:hidden`;
    - the same `closing.label` renders as the text column's last line:
      `hidden max-[359px]:block text-xs` plus `closesClass`.

    The text column grows from 94 to 160px.

  The desktop row is untouched.
- **G6.** Below 360:
  - the tile (`:302`) adds `max-[359px]:px-0.5`;
  - the label (`:311`) adds `max-[359px]:text-[10px] max-[359px]:tracking-tight`.

  That is about 80px of text in 84px.
- **Motion:** none.

### Copy

None. Every fix is layout only.

### Acceptance

- **320 × 640, signed out**, on each surface in the table above:
  - no button or link renders 3 or more lines of text, counting the distinct line boxes of its
    text nodes;
  - the document never scrolls sideways;
  - no control extends past its parent's content box.
- **G1:** reproduce with the anonymous goal "Get a job" and `?q=zzqqxx`. The purple button takes
  2 lines, fully inside the card, and Clear search sits below it. At 390 it takes 1 line inside the
  card.
- **G2:** "View impact action" (an Impact Action) takes 2 lines inside its 48px button, and
  "Start learning" takes 1. Save and Share are unchanged circles.
- **G3:** on steps 1–5 Continue is fully visible with no sideways scroll, and Back is a 44px
  circle with `aria-label` / text "Back" for screen readers.
- **G4:** the Sort group's right edge is at or before its row's right edge, and every option is
  44px tall.
- **G5:** with `?type=ImpactAction,Entrepreneurship,Event,Other&view=list`:
  - no chip overlaps the status or the arrow;
  - the status shows under the meta line;
  - no title word is clipped.
  - At 390 and 360 the status stays in its column, and no meta item passes the status's left
    edge.
- **G6:** "Entrepreneurship" sits inside its tile.
- **390 and 1440:** every surface above looks as it does today, except the G1 and G5 changes at
  390.

### Departures

- **2026-10-02's "button text never wraps at 390px"** (the wizard footer comment,
  `PersonalizeDialog.tsx:319-321`) still holds at 390. Below 360, Back loses its word rather than
  the row scrolling.
- **The mobile list row** (round 10, "title, then type chip · money · place") can take a third
  line when the chip and the money don't fit together, and below 360 the status moves into the
  text column.

---

## P — The preferences wizard

### P1 — The count panel always shows the count

#### Current

- **Screens:** `p-320-count-floored.png` (0 matches: Up to a minute + Walloon + Avestan, local
  data), `p-320-step1.png` and `p-390-step5.png` (normal).
- **What's wrong:** below `FLOOR = 5` (`features/discovery/components/Personalize/LiveCountPanel.tsx:10`)
  the number is replaced by "That's a narrow feed — consider widening a choice or two." (`:37-42`).
  The youth can't tell 0 from 4, and the sentence reads as a heading.

#### Changes

- **The number block** (`:43-57`) always renders once `count !== null`. The floored branch
  (`:37-42`) goes.
- **At 0:**
  - the number takes `text-yellow-light`;
  - an `IoWarningOutline` sits before it, `aria-hidden`, in `text-yellow-light`, sized to the
    number: `h-6 w-6 md:h-10 md:w-10`, `gap-2`, centred on the figure.

  Contrast is about 10:1 on `bg-purple`.
- **Below 5 (0–4, Q1 (a)):** the sentence renders under the label:
  - `mt-2 text-[13px] leading-snug font-semibold text-white md:text-sm`;
  - no icon of its own;
  - inside the blurring wrapper, so it blurs with the number while recounting.
- **At 1:** the label is singular (copy table).
- **Motion:**
  - the number's colour `transition-colors duration-300 motion-reduce:transition-none`;
  - the sentence `motion-safe:animate-[fade-in_200ms_ease-out_both]` when it appears. The keyframe
    is the one `DetailDisclosure.tsx:87` uses.
- **Height:**
  - from `md`, the 340px column has room;
  - below `md`, the panel grows by the sentence only while it shows: 1 line at 390, 2 at 320.

  The 390 × 844 "step 4 doesn't scroll" check (2026-10-03) applies to the normal state.
- Update the component comment at `:4-9`.

#### Copy

| `file:line` | Current | New |
| --- | --- | --- |
| `features/discovery/components/Personalize/LiveCountPanel.tsx:54` | opportunities match your answers so far | unchanged; at 1: "opportunity matches your answers so far" |
| `features/discovery/components/Personalize/LiveCountPanel.tsx:40` | That's a narrow feed — consider widening a choice or two. (in place of the number) | unchanged text, now under the number and label, for 0–4 |

#### Acceptance

- **1440:** pick Up to a minute (step 4), then Walloon + Avestan (step 5).
  - The panel shows the warning icon, "0" in yellow, "opportunities match your answers so far",
    then the sentence.
  - Deselect a language until the count is 5 or more: the sentence goes and the number turns
    white.
- **390 and 320:** the same, in the compact row. The sentence wraps under the label (1 line at
  390, 2 at 320), and nothing is clipped.
- **Reduced motion:** the colour and the sentence switch with no transition.

#### Departures

- **YOM-1261 2026-08-27, "the count is floored … rather than rendering a dead 0"**, is reversed at
  Jason's request. The warning colour and the sentence carry the "this is your answers, not a
  broken product" meaning instead.

### P2 — Step 5's title

#### Current

- **Screens:** `p-1440-step5-languages.png`, `p-390-step5.png`, `p-320-step5.png`.
- **What's wrong:** "Where are you, and what languages work for you?" takes 2 lines at 390 and
  320, and pushes the step down.

#### Changes

- Copy only (Q2). The new title is 1 line at 320.
- The subheading still fits and stays: "Where you're based, and the languages you're comfortable
  working in."

#### Copy

| `file:line` | Current | New |
| --- | --- | --- |
| `features/discovery/registry/preferenceSteps.ts:183` | Where are you, and what languages work for you? | Your area and languages? |

#### Acceptance

- At 1440, 390 and 320 the step-5 title reads "Your area and languages?" on one line, and the
  subheading is unchanged.

#### Departures

- None.

---

## D — The opportunity detail page (tabbed layout only; classic untouched)

### Current

- **Screens:**
  - `d-1440-f08-about-open.png`, `d-390-f08-about-open.png`: fixture 08, Learning, ZLTO 200,
    accessibility No.
  - `d-390-f19-closed.png`: fixture 19, no incentive, Available on request with no list, age
    21–27.
  - `d-390-f05-closed.png`: fixture 05, Entrepreneurship, no incentive, accessibility not
    specified, no time.
- **What's wrong:**
  - **Incentive:**
    - the preview says "Earn 200 ZLTO", but opened it is just "Yes" and "ZLTO" chips
      (`components/Opportunity/TabbedDetails/OpportunityDetailSections.tsx:334-345`, `:367-369`);
    - "No" opens to a single "No" chip;
    - a depleted reward previews "Yes · ZLTO" while the header strip says "Depleted";
    - a partner incentive previews "Yes · Partner incentive · 150 USD", with nothing about who
      pays.
  - **Static rows say nothing beyond the value:** "Accessibility · No", "Accessibility · Not
    specified", "Accessibility · Available on request", "Age range · 21–27 years" (`:434-446`,
    `:461-471`). No and Not specified mean different things, and neither says what it means for
    the youth.
  - **Time needed** opens to "Most people finish in 1 week or less." (`:388`). There is no data on
    what most people do. And "go at your own pace" (`:390`) sits beside an end date.
  - **Accessibility with a list** repeats itself: the preview says "On request: …", the note says
    "What the provider can arrange if you ask", and the body says "Support: Available on request"
    (`:489`).

### D2 — Static rows show a note (`components/Opportunity/TabbedDetails/DetailDisclosure.tsx`)

- **A static row renders its `note` under the title, always.** It uses the open note's style
  without its fade: `text-gray-dark mt-0.5 block text-[13px] leading-snug`. It wraps and never
  truncates.
- Today `note` shows only when `open` (`:86-90`), and a static row is never open.
- Update the prop docs at `:25-31` and `SectionDef` at `OpportunityDetailSections.tsx:104-109`.
- Simulated: `sim-d-320-static-note.png` (Accessibility · No at 320, 3 lines; the final copy below
  is shorter, 2 lines).

### D1 — Incentive (`OpportunityDetailSections.tsx:332-371`)

- **Which states show is unchanged:** public once `incentivized != null`; admin also "Not
  specified" (`showUnspecifiedIncentive`, `:333`).
- **The money strings** come from `resolveMoneyBadge(moneyFactsOf(opportunity, currencies))`
  (`features/discovery/lib/money.ts`). It is the same rule as the header and the sticky bar, with
  no new request (L3).
- **The open note stays** "What you could get for taking part." (`:366`) for every disclosure
  state.

| State (data) | Row | Preview (closed) | Body (open) |
| --- | --- | --- | --- |
| ZLTO, estimate > 0 (`incentivized`, `rewardType ZLTO`, `zltoRewardEstimate > 0`) | disclosure | "Earn 200 ZLTO" (unchanged, `:357`) | **Amount line:** the ZLTO icon (20px, `public/images/icon-zlto.svg`, as `DetailHeaderCard.tsx:41`) + "200 ZLTO" in `text-base font-extrabold`. **Then** (`text-sm`): "An estimate. You earn it once your completion is verified, and you may get less if the reward pool runs low." **Then** the cash-out line (C1). |
| ZLTO, no estimate (`zltoRewardEstimate == null`) | disclosure | "Earn ZLTO" (unchanged, `:355`) | Icon + "ZLTO reward"; "You earn Zlto once your completion is verified. The amount isn't shown for this opportunity."; C1. |
| ZLTO, depleted (`zltoRewardEstimate === 0`) | disclosure | "ZLTO rewards have run out" | "This opportunity's ZLTO reward pool has run out, so completing it now earns no Zlto." No C1. |
| Partner incentive with an amount | disclosure | "{USD 150} from the partner" | Amount line "{USD 150}" in `text-base font-extrabold`; "Offered and paid by the partner that runs this opportunity, not by Yoma. Ask them how and when it's paid." |
| Partner incentive, no amount | disclosure | "Partner incentive" | "The partner that runs this opportunity offers an incentive. Ask them for the details — Yoma doesn't pay or process it." |
| Paid Job with a disclosed salary (`rewardType None`, Job, salary pay line) | disclosure | "{ZAR 8 000–12 000 / mo}" | Amount line "{pay line}"; "The pay the employer has shared for this job." |
| Paid Job, salary not disclosed | disclosure | "Paid" | "This job is paid. The employer hasn't shared the amount." |
| Paid, not a Job, `rewardType None` | disclosure | "Paid or rewarded" | "This opportunity offers pay or a reward. Ask the provider for the details." |
| `incentivized === false` | **static** | "Incentive · None" | note: "No pay, ZLTO or other reward." |
| `incentivized == null`, admin only | **static** | "Incentive · Not specified" | note: "The provider hasn't said whether this pays or rewards." |

- **C1, the cash-out line** (Q9): `text-gray-dark text-sm`, after the estimate sentence, `mt-2`.
  - "marketplace" is a `next/link` to `/marketplace`, `text-green font-semibold underline`.
  - Signed in, with Cash Out closed to this youth, it keeps only "Spend your Zlto in the
    marketplace." (L4).
- **Body layout:** `flex flex-col gap-1.5`, inside the existing body padding (`DetailDisclosure.tsx:136`).
- **Motion:** none new. The body eases open as today.

### D3 — Accessibility (`OpportunityDetailSections.tsx:448-498`)

- **Static rows** (no list), with a D2 note each:

| `accessibilitySupport` | Value | Note |
| --- | --- | --- |
| `No` | No | The provider says it offers no accessibility accommodations. |
| none (`null`) | Not specified | The provider hasn't said whether it offers accessibility accommodations. |
| `AvailableOnRequest` | Available on request | The provider can arrange support if you ask. Ask them what's possible before you start. |
| `Yes` with no list (the API requires a list, so only as a fallback) | Yes | The provider says it's accessible but hasn't listed how. Ask them before you start. |

- **The disclosure (with a list):**
  - the preview and note are unchanged (`:481-486`);
  - the body drops the "Support: …" line (`:489`), which repeats the preview and note;
  - after the chips and the Other description, a closing line in `text-gray-dark text-sm`:
    - Yes: "Need something that isn't listed? Ask the provider before you start."
    - On request: "These aren't in place by default. Ask the provider to arrange what you need
      before you start."

### D4 — Age range (`:434-446`)

- A D2 note, from the same bounds as `ageRangeLabel` (`:133-144`):

| Bounds | Note |
| --- | --- |
| from and to (different) | For people aged {from} to {to}. |
| from = to | For people aged {n}. |
| from only | For people aged {from} and over. |
| to only | For people aged {to} and under. |

- It says "for people aged", not "open to". The API doesn't gate taking part by age.

### D5 — Time needed (`:373-394`) (Q8)

- **A static row:**
  - the value is "About {effort}" when the effort is a quantity, else the interval text as today
    (`:385`);
  - the D2 note reads "Roughly how long it takes. It's a guide, not a deadline.";
  - the body (`:386-393`) goes.
- **If Jason keeps the disclosure:**
  - the open note becomes "Roughly how long it takes.";
  - the body becomes "Expect about {time}." / "It's a guide, not a deadline."

### D6 — Additional details (`:572-598`)

- Add the open note "More details for this type of opportunity."
- **Provider (`:773-784`) is left as it is.** The group heading already says "Provider", and
  nothing on the opportunity says how the provider relates to the organisation, so any sentence
  would guess.

### Copy (D)

| `file:line` | Current | New |
| --- | --- | --- |
| `OpportunityDetailSections.tsx:350` (preview, depleted ZLTO) | Yes · ZLTO | ZLTO rewards have run out |
| `OpportunityDetailSections.tsx:350` (preview, partner with amount) | Yes · Partner incentive · 150 USD | {USD 150} from the partner |
| `OpportunityDetailSections.tsx:350` (preview, partner, no amount) | Yes · Partner incentive | Partner incentive |
| `OpportunityDetailSections.tsx:350` (preview, paid Job, salary) | Yes | {pay line, e.g. ZAR 8 000–12 000 / mo} |
| `OpportunityDetailSections.tsx:350` (preview, paid Job, no salary) | Yes | Paid |
| `OpportunityDetailSections.tsx:350` (preview, paid, not a Job) | Yes | Paid or rewarded |
| `OpportunityDetailSections.tsx:367-369` (body, every state) | chips: Yes / No / Not specified / ZLTO / Partner incentive / amount | the bodies in the D1 table |
| new, ZLTO body | — | An estimate. You earn it once your completion is verified, and you may get less if the reward pool runs low. |
| new, ZLTO body, no estimate | — | You earn Zlto once your completion is verified. The amount isn't shown for this opportunity. |
| new, C1 | — | Spend your Zlto in the marketplace, or cash it out for real money in supported countries. |
| new, C1 tailored (signed in, Cash Out closed) | — | Spend your Zlto in the marketplace. |
| new, depleted body | — | This opportunity's ZLTO reward pool has run out, so completing it now earns no Zlto. |
| new, partner body | — | Offered and paid by the partner that runs this opportunity, not by Yoma. Ask them how and when it's paid. |
| new, partner body, no amount | — | The partner that runs this opportunity offers an incentive. Ask them for the details — Yoma doesn't pay or process it. |
| new, paid Job body | — | The pay the employer has shared for this job. / This job is paid. The employer hasn't shared the amount. |
| new, paid non-Job body | — | This opportunity offers pay or a reward. Ask the provider for the details. |
| new, Incentive static value / note (No) | (disclosure "No") | None / No pay, ZLTO or other reward. |
| new, Incentive static value / note (admin, unanswered) | (disclosure "Not specified") | Not specified / The provider hasn't said whether this pays or rewards. |
| `OpportunityDetailSections.tsx:468` + new note | No (no note) | No / The provider says it offers no accessibility accommodations. |
| `OpportunityDetailSections.tsx:468` + new note | Not specified (no note) | Not specified / The provider hasn't said whether it offers accessibility accommodations. |
| `OpportunityDetailSections.tsx:468` + new note | Available on request (no note) | Available on request / The provider can arrange support if you ask. Ask them what's possible before you start. |
| `OpportunityDetailSections.tsx:489` | Support: {support} | (removed) |
| new, Accessibility body closing, Yes | — | Need something that isn't listed? Ask the provider before you start. |
| new, Accessibility body closing, on request | — | These aren't in place by default. Ask the provider to arrange what you need before you start. |
| new, Age range note | — | For people aged {from} to {to}. / For people aged {n}. / For people aged {from} and over. / For people aged {to} and under. |
| `OpportunityDetailSections.tsx:388` | Most people finish in {time} or less. | (removed; D5) |
| `OpportunityDetailSections.tsx:390` | It's only a guide — go at your own pace. | (removed; the note replaces it) |
| new, Time needed note | — | Roughly how long it takes. It's a guide, not a deadline. |
| new, Additional details open note | — | More details for this type of opportunity. |

### Acceptance (D)

- **1440, signed out:**
  - **A ZLTO opportunity** (fixture 08, or any "Earn n ZLTO" preview):
    - opened, Incentive shows the ZLTO icon and "200 ZLTO", then the estimate sentence, then C1;
    - "marketplace" goes to `/marketplace`;
    - no "Yes" / "ZLTO" chips.
  - **A no-incentive opportunity** (fixture 05, 13 or 19): "Incentive · None" is a static row (no
    chevron, no hover) with its note.
  - **Accessibility:**
    - fixture 08 (No), fixture 05 (not specified) and fixture 19 (on request, no list) each show
      their own value and note;
    - fixture 04 or 14 (on request with a list), opened: no "Support:" line, and the on-request
      closing line.
  - **Age range** (fixture 19): "Age range · 21–27 years" and "For people aged 21 to 27."
  - **Time needed** (fixture 08): a static row, "Time needed · About 1 week", with its note.
  - **A paid Job** (any Job with `incentivized` true and no reward type): preview "Paid", or its
    salary, and the matching body.
- **390 and 320:**
  - the same content;
  - static notes wrap and are never truncated;
  - at 320 the Accessibility No note is 2 lines;
  - no row is clipped.
- **Classic layout** (kill-switch off; check statically): `OpportunityPublicDetails`' classic
  branch and `formatIncentivized` are untouched.

### Departures (D)

- **Round 10's follow-ups (2026-10-02)** said Time needed, Age range, Additional details and
  Provider get no note. Jason now asks for descriptive text on each section, so the first three
  get one; Provider stays without (D6).
- **Incentive "None" and Time needed become static rows**, the 2026-10-03 pattern for one-value
  sections. Which sections show, and when, is unchanged.
- **"Most people finish in…" is dropped.** It claimed data the page doesn't have.

---

## Seen, not in this round

- **The sheet's "Filters N" badge** (`features/discovery/components/Filters/FiltersSheet.tsx:50-54`)
  counts `chips.length`, which excludes custom-field clauses. With a type and two clauses set it
  reads "1". This predates the round. I'd count the clauses, but that is a behaviour question for
  Jason.
- **Grid cards at 320** truncate the places line ("969 of 969…"). That is truncation by design;
  nothing wraps or overflows.
- **A USD value for the ZLTO estimate is API-gated.** `convertZltoToUsd` is a separate request,
  and the detail page has no rate.

## Not seen (and why)

- **D1:** no local opportunity has:
  - a partner incentive (`rewardTypes: PartnerIncentive` returns 0);
  - a depleted reward (estimate 0);
  - a ZLTO reward type without an amount;
  - the admin "Not specified".

  Their rows are specified from the model and the code.
- **Accessibility "Yes" with no list:** the API forbids it, so there is no fixture.
- **F3 / L2 Date and DateTime ranges:** no Date or DateTime custom-field definition exists locally
  (the types define Option, Boolean, Decimal, Integer and String only). The mobile native date
  picker's blur behaviour is unverified.
- **Q9's tailored line:** needs a signed-in youth whose profile says Cash Out is closed. Locally
  `payout.enabled` is off, so a signed-in local tester would see only the marketplace half.
- **The admin info page and the editor Preview:** no admin sign-in was approved. They use the same
  component, so D applies there too.
