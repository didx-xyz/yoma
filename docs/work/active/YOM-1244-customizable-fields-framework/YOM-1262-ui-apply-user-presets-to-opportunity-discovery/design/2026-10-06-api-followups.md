# API follow-ups: one-level groups, guidance notes, pay tile, rail (2026-10-06)

- **Input:**
  - the lead's brief for this batch (YOM-1262, epic YOM-1244), after Adrian's `5378337c`, which
    flattened every custom-field group (`subGroup` → `group`, `subGroup` null);
  - Adrian's handoff [`../../YOM-1254-api-custom-fields-framework-for-opportunity-and-myopportunity/handoffs/2026-10-05-a.md`](../../YOM-1254-api-custom-fields-framework-for-opportunity-and-myopportunity/handoffs/2026-10-05-a.md)
    ("Agreed Review Decisions", "Guidance Labels and Tooltips", "One-Level CF Grouping");
  - `feature.md` Decisions to 2026-10-06 (they win) and [`../handoffs/2026-10-06-a.md`](../handoffs/2026-10-06-a.md).
- **Jason's decisions for this batch (not reopened here):**
  1. The editor and the youth completion form keep the "Additional details" title, with no type
     heading. The API's groups are the headings.
  2. Guidance wording is generic section notes only, never keyed to a field: one note on the detail
     page's "Additional details" and one line under discovery's type-specific filters. Definition
     `description`s are written for admins and are not shown to youth. Never "you qualify", never a
     verdict.
  3. A paid Job's detail header shows its pay. The title gets a visible focus after "Show less"
     moves focus there (`preventScroll` is the developer's).
- **Status:** awaiting Jason.
- **Surfaces:** discovery's type-specific filters, the tabbed detail page (header and "Additional
  details"), the editor's Details step, the youth completion form, the discovery landing. Paths are
  relative to `src/web/src/`.
- **Base:** `c86f09f2`. The logic batch is being built in the same checkout while this is
  reviewed. It has already touched `CustomFieldsView.tsx`, `CustomFields.tsx`,
  `CustomFieldFilters.tsx`, `TypeSpecificFilters.tsx` (`resolveSkillsById`) and
  `DetailHeaderCard.tsx` (`preventScroll`), and added `lib/customFields/skillLabels.ts`. Lines
  are cited at the base; `[wt N]` is the working-tree line where it differs.
- **Screens:** `~/.cache/cdp-tools/shots/2026-10-06-api-followups/` (machine-local), local stack
  rebuilt today. 1440 × 900 and 768 × 1024 at 1x; 390 × 844, 360 × 740 and 320 × 640 at 2x.
  - `cur-*` are the current build; `sim-*` are DOM simulations of this spec on the live page, not
    builds.
  - Public pages were signed out. Signed in, read-only: `testorgadminuser` for the editor's Details
    step and the admin info page, `testuser` for YoID Completed and Pending. Nothing was saved or
    submitted. A first-sign-in "Choose your settings" dialog was hidden in the DOM for the
    screenshots, never answered.
- **Behaviour is unchanged.** S1 removes one level of disclosure (UI-only state), S5 adds a tile
  from data the page has, S7 changes a label. Filters, clause shapes, mappings, which sections show
  and the kill-switch are untouched. Grouping stays metadata-driven: no code compares a group's
  text.
- **No new requests.** S5 reads the currency lookup that `OpportunityDetailSections.tsx:318`
  already loads on every host of the header (same query key, `staleTime: Infinity`).

## Jason's answers

Jason approved the spec as written (2026-10-06), with:

1. **Q1, pay tile scope:** every type whose card shows a pay line (the recommendation).
2. **Q2, youth completion form, descriptions and subtitle:** hide both (the recommendation).
3. **Q3, YoID completion values on phones:** fix it in this batch (the recommendation). He also
   asked for an investigation of the inherited chip "Skills: 57 job skills".
4. **Q4, a retired skill in a shared link:** not asked. The lead files it as an API ask for Adrian
   (an unknown lookup value matches nothing); the web drops nothing.

**Changed after the build (Jason, 2026-10-06):**

- **S4's subtitle is "Latest start dates first", not "Most recently added first".** The writer
  found that the API's default youth order is the start date, descending
  (`OpportunityInfoService.cs` ~170), not the date created that Adrian's handoff and this spec
  assumed. The title stays "Latest opportunities".
- **S7 gains a third label, "Skill name unavailable",** for a skill whose lookup failed. "Skill no
  longer listed" now appears only when a successful lookup leaves the ID out. The reviewer found
  that a failed request labelled valid skills as retired.
- **S8 (not in this spec):** the inherited skills chip reads "Skills: {n} of yours", with the note
  "Skills you added or earned by completing opportunities. Jobs that ask for none of these are
  left out; jobs that list no skills stay in. Other types aren't affected." Summaries that print
  the value without its group say "{n} of your skills".

## Task index (priority order)

| Id | Surface | Task | Priority |
| --- | --- | --- | --- |
| S1 | Discovery, type-specific filters | A one-group type shows its fields directly; "1 filter"; the guidance line | 1 |
| S3 | Detail page, "Additional details" | The guidance note; stays flat; values wrap instead of truncating | 1 |
| S5 | Detail header | A Pay tile, from the money rule the cards use | 2 |
| S7 | Detail value, chips, editor select | The label for a skill the catalogue no longer returns | 2 |
| S2 | Editor Details step, youth completion form | "1 field"; the subtitle per host | 3 |
| S4 | Discovery landing | "Latest opportunities" and its subtitle | 3 |
| S6 | Detail header | A quiet focus outline on the title | 4 |

The metadata these items are designed against (local API, `GET /opportunity/custom/field/definition?types=…`):

| Type | Groups (fields) |
| --- | --- |
| Job | Classification (2) · Compensation (5) · Employment (4) · Requirements (3) |
| Impact Action | Activity (1) · Requirements (3) |
| Learning · Event · Other | Requirements (1: Difficulty) |
| Entrepreneurship | Programme (3) |
| Completion: Job · Impact Action · Event | Placement (1) · Impact (1) · Participation (1) |
| Completion: Entrepreneurship | Outcomes (7) · Venture (5) |

No definition is generic, so "Details (all types)" doesn't render today, and `subGroup` is null
everywhere, so the sub-group tier never renders.

---

## S1: Discovery's type-specific filters under one-level groups (priority 1)

`features/discovery/components/Filters/TypeSpecificFilters.tsx`

### Current

Screens: `cur-filters-{job,learning,impact,entre,job-event}-groups-{closed,open}-{1440,390,320}.png`
(Impact Action and Entrepreneurship at 390 only).

- **A one-group type is a disclosure inside a disclosure.** "Learning filters · 1 filters" opens to
  a single row, "Requirements 1", which opens to Difficulty: three taps to one control, and the
  middle row repeats what the section already says (`cur-filters-learning-groups-*`). In
  Entrepreneurship, "Programme 3" opens to a field also titled "Programme". Event and Other are
  the same as Learning.
- **"1 filters"** (`TypeSpecificFilters.tsx:124`).
- **Nothing says what these filters are.** On every non-Job type the only group the youth sees is
  "Requirements", which reads as an entry rule: the reading decision 2 rules out.
- **What works:** Job's four group rows (Classification 2 · Compensation 5 · Employment 4 ·
  Requirements 3) scan well at every width. The rows are 44 px, and nothing overflows at 320
  (audit clean).

### Changes

**S1.1: A level has to earn its place.** This extends the 2026-09-05 sub-group rule to groups.
For each "«Type» filters" section (and "Details (all types)" when it renders), count the distinct
`group` values among its definitions:

- **One group:** no group row. Render the group's fields directly in the section body, as
  `flex flex-col gap-2 pt-1 pb-3` with no indent: the universal sections' body
  (`FilterSection.tsx:85`). The group's name isn't shown.
  - `CustomFieldFilters` gets exactly the props it gets today: `largeTouchTargets`,
    `fixedOperators`, `commitOnBlur`, `resetKey`, `resolveSkillsById`, and the
    `setCustomFieldClauses` dispatch keyed to these definitions.
  - The sub-group rule (`prefixed`, :157, and the compact heading rule) still applies inside,
    unchanged. A later API that uses `subGroup` again keeps working.
  - The fields show whenever the section is open. The section's own initial-open rule (:111) is
    unchanged.
- **Two or more groups:** today's `GroupDisclosure` rows (`pl-3 md:pl-7`, 44 px, count, chevron),
  including a one-field group (Impact Action's "Activity 1"). A section is either all group rows or
  bare fields, never a mix, so the eye scans one kind of thing.
- **The count is of distinct `group` values.** Never compare a group's text, and never key on a
  type.

**S1.2: Count.** "1 filter", and "N filters" from 2.

**S1.3: The guidance line.** Pass it as the section header's `subtitle`, only while the section is
open (`subtitle={open ? note : null}`). This is exactly how the universal sections show their hint
(`FilterSection.tsx:67`).

- **Style:** the `SectionHeader` subtitle: 13 px, `text-gray-dark`, `leading-snug`, `pb-2`, under
  the header row, no indent.
- **Every open section carries it.** With Job and Event both open, each says it, because each
  qualifies its own fields. A collapsed section doesn't show it, so the closed panel is the same
  height as today.
- **Measured:** 1 line at 1440 (762 px), 2 at 390 (358 px), 3 at 320 (288 px). It is helper text,
  not a label, so the two-line label limit doesn't apply.

**Motion:** none added. A section opens instantly, as today, and the existing chevrons keep
`motion-reduce:transition-none`.

**Simulated:** `sim-filters-{learning,job,impact,job-event}-{1440,390,320}.png`.

### Copy

| `file:line` | Current | New |
| --- | --- | --- |
| `features/discovery/components/Filters/TypeSpecificFilters.tsx:124` | "{n} filters" ("1 filters") | "1 filter" / "{n} filters" |
| `features/discovery/components/Filters/TypeSpecificFilters.tsx` (new: header subtitle while open) | — | "What providers describe, not entry requirements. Each provider decides who is suitable." |

### Acceptance checks

Signed out, `/opportunities/discover?type=…`, then Filters.

- **1440** (dialog):
  - `type=Learning`: open "Learning filters". The header value reads "1 filter". Under the header
    is the note on one line, then "Difficulty" and its select directly, with no "Requirements" row.
  - `type=Entrepreneurship`: three fields directly ("Programme", "Other programme", "Venture stage
    targeted"), with no "Programme" row.
  - `type=Job`: the note, then the four group rows, closed. Open "Requirements": Experience level,
    Minimum qualification, Preferred skills, as today.
  - `type=ImpactAction`: the note, then two rows, "Activity 1" and "Requirements 3".
  - Close a section: its note goes with it.
- **390** (sheet): the same, with the note on 2 lines. Each control is still 44 px tall.
  `type=Job,Event`: both sections open, each with its own note. Event's Difficulty sits directly
  under its note.
- **320:** the note is 3 lines, and nothing overflows (`scrollWidth` 320).
- **Behaviour:** choose a Difficulty in a one-group section. The chip and the count appear as
  today, and the URL's `cf` clause is the same shape as before the change.

### Departures

| Current build / decision | This spec | Why |
| --- | --- | --- |
| `feature.md` Plan, "The type-specific block": grouped Group → SubGroup → SortOrder, one disclosure per group | A single-group section shows its fields without the group row | The row was a second disclosure that said nothing the section didn't, and 4 of 6 types now have one group |
| 2026-09-05: "A sub-group heading has to earn its level" (sub-groups only) | The same rule applied to groups, by count | The API moved the meaningful level from `subGroup` to `group` |

---

## S3: The detail page's "Additional details" (priority 1)

`components/Opportunity/TabbedDetails/OpportunityDetailSections.tsx:607–634`, rendered by
`components/Opportunity/CustomFieldsView.tsx`.

### Current

Screens: `cur-detail-{job01,event04,impact19,entre20}-additional-{1440,768,390,360,320}.png`.

- **The rows are flat** (`hideGrouping`), one "Title: value" row each, in one column.
- **The note says nothing about meaning:** "More details for this type of opportunity." (:625).
- **Values truncate on phones.** The label is `min-w-40 truncate text-nowrap`
  (`CustomFieldsView.tsx:232` [wt 230]). The value is `line-clamp-2 truncate` (:237 [wt 235]);
  `truncate` forces one line, so the clamp never wraps. At 320 the value column is 94 px:
  - 5 of fixture 01's 10 values are cut: "Entry / Junior (1–3 ye…", "No formal education…",
    "Science and Enginee…";
  - all 3 of Impact Action fixture 19's are cut ("Experience ne…");
  - 1 of Entrepreneurship's 2 is cut.

  At 390, 3 of 10 are cut, and at 360, 4. The guidance values are among them, so the note would
  sit above values the youth can't read.

### Groups: stay flat

The new groups don't show here:

1. **The page already has a "Requirements" tab and group** (Skills required, Languages, Age range,
   Accessibility). A "REQUIREMENTS" heading inside "Details" would repeat it. It is also the one
   heading decision 2 can't let read as eligibility.
2. **Most types carry 1–3 values** (Event 1, Entrepreneurship 2, Impact Action 3), so the headings
   would be as many as the rows.
3. **The rows already come in group order** (`CustomFieldsView` sorts by group), so a Job's ten
   rows still cluster: classification, pay, employment, experience.

### Changes

**S3.1: The note.** New copy, in the same `note` slot with the same fade
(`motion-safe:animate-[fade-in_220ms_ease-out_both]`, nothing under reduced motion). Measured: 3
lines at 320, 360 and 390 (a 178–248 px slot), 2 at 1440. The fuller "…The provider decides who
is suitable." takes 4 lines at 320.

**S3.2: Values wrap and never truncate.** Add an additive prop to `CustomFieldsView`, e.g.
`wrapValues`, off by default. Classic (`OpportunityCustomFieldsSection`) and YoID
(`MyOpportunityCustomFieldsSection`) stay as they are unless Q3 says otherwise. The tabbed page
passes it. With it on:

| Element | Classes |
| --- | --- |
| row (each field) | `flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4` |
| label | `text-[13px] sm:shrink-0 sm:text-sm`, without `min-w-40 truncate text-nowrap`; colour stays the grid's `text-gray-dark` |
| value | `min-w-0 font-bold wrap-break-word sm:text-right`, without `line-clamp-2 truncate` |
| grid | unchanged: `gap-4`, `columns={1}` |

- **Below `sm`:** the label sits above its value.
- **From `sm`:** they share the row, and a long value wraps, right-aligned.

**Simulated:** `sim-detail-{job01,impact19,entre20}-additional-{320,360,390,1440}.png` (the sims
use a 12–14 px row gap; the build keeps `gap-4`). No value truncates. The longest values take 2
lines at 320: "Science and Engineering Associate Professionals" and "No formal education (No
schooling attended)".

### Copy

| `file:line` | Current | New |
| --- | --- | --- |
| `components/Opportunity/TabbedDetails/OpportunityDetailSections.tsx:625` | "More details for this type of opportunity." | "What the provider describes, not entry requirements. They decide who is suitable." |

### Acceptance checks

Signed out. Open "Additional details" on fixture 01 (Job), fixture 19 (Impact Action) and
fixture 20 (Entrepreneurship).

- **1440:** the note (2 lines) under "Additional details · 10". There are no group headings. The
  rows are label left and value right; fixture 01's ten values each fit on one line.
- **390:** the note is 3 lines. Each label (13 px) sits above its value (14 px bold), and no value
  ends in "…".
- **320:** the same. "Science and Engineering Associate Professionals" wraps to 2 lines, every
  value's `scrollWidth` equals its `clientWidth`, and the page doesn't scroll sideways.
- **Unchanged:**
  - the classic page (`CUSTOM_FIELDS_ENABLED` off), the admin "info" classic section and the YoID
    card render exactly as before;
  - the closed row's count and preview ("Industry, Job category +8").

### Departures

| Current build / decision | This spec | Why |
| --- | --- | --- |
| `CustomFieldsView` truncates every value to one line | Opt-in wrapping rows on the tabbed page | A truncated guidance value can't be read; the prop is additive, as the 2026-08-27 rule for shared building blocks requires |

---

## S5: The Pay tile in the detail header (priority 2)

`components/Opportunity/TabbedDetails/DetailHeaderCard.tsx` and `detailFacts.ts`.

### Current

Screens: `cur-detail-job01-header-{1440,768,390,360,320}.png` and
`cur-admininfo-job01-header-{1440,390,320}.png` (signed in).

- Fixture 01 is a Job with a disclosed salary: USD, monthly, minimum 1 000. Its strip shows only
  Ends · Take part.
- Its discovery card shows "USD 1 000 / mo" (`cur-landing-rail-320.png`), and so does the sticky
  bar's `MoneyBadge`.
- `detailFacts` has no money input (`detailFacts.ts:57–105`), so the header is the one place that
  doesn't show the pay.

### Changes

- **Data:** `resolveMoneyBadge(moneyFactsOf(opportunity, currencies)).payLine` (`money.ts:113`),
  the rule the cards and the sticky bar use. Currencies come from `useCurrenciesQuery()` (cached,
  see "No new requests"). `detailFacts` takes the money facts as an optional input and stays pure.
- **When:** whenever `payLine` isn't null (salary, then partner incentive, then "Paid — amount not
  disclosed"). For every type or for Jobs only: Q1.
- **The fact:**
  - id `pay`, label "Pay";
  - the value is `payLine` verbatim ("USD 1 000 / mo", "ZAR 8 000–12 000 / mo", "Paid — amount
    not disclosed");
  - a partner-paid amount adds the badge's suffix after the value, "partner-paid", in
    `text-gray-dark pl-1 text-[13px] font-normal` (the wording of `MoneyBadge.tsx:27`).
- **Tone:** `FACT_TONE.pay` is the tile `bg-orange-light` with the icon `text-yellow`: Reward's
  tone and the Incentive section's gold (`TONE.gold`), so "what you get" keeps one colour. The icon
  is `IoCashOutline` (`h-5 w-5`), shown from `md` only, like every tile icon.
- **Position:** first, so the strip reads Pay · Reward · Effort · Ends / Starts · Take part. The
  badge also puts the pay line before the ZLTO pill.
- **Columns:** `stripColumns` gains the Pay case. Counts include Pay.

  | Tiles | Without Pay (today) | With Pay |
  | --- | --- | --- |
  | 1, 2, 4 | `STRIP_COLUMNS` as today | the same |
  | 3 | `grid-cols-3` | `grid-cols-2 md:grid-cols-3`; Pay `col-span-2 md:col-span-1` |
  | 5 | — | `grid-cols-2 xl:grid-cols-5`; Pay `col-span-2 xl:col-span-1` |

  - **Why 3 tiles change:** at 320 three tiles are 80 px wide with a 64 px value. A salary range
    took 4 lines and "Paid — amount not disclosed" 5, broken as "disclose / d"
    (`sim-pay-n3naive-*`). On its own row, Pay is 1 line at 320–390.
  - **Five tiles** only happen on inconsistent data: a ZLTO estimate beside a pay line (Jobs carry
    no ZLTO). Five across fits from 1280 at 2 lines; at 1024 the values reach 3 lines, so Pay
    keeps its own row below `xl`.
  - **The admin header's stat strip** also calls `stripColumns`. It has no Pay, so it is
    unchanged.
- **Measured lines of the Pay value:**

  | Tiles | 320 | 360 | 390 | 768 | 1440 |
  | --- | --- | --- | --- | --- | --- |
  | 3 (fixture 01's case) | 1 | 1 | 1 | 1; 2 for a range, "Paid — …" or partner-paid | 1 |
  | 2 or 4 | 1 for "USD 1 000 / mo"; 2 for the long values | same | same | 1 | 1; 2 for "Paid — amount not disclosed" |
  | 5 | 1 | 1 | 1 | 1 | 2 |

  Nothing overflows at any width (`sim-pay-{n2,n3,n4,n5}-{sal,range,paid,partner}-{320,360,390,768,1440}.png`,
  `sim-pay-{n4,n5}-{range,paid}-{1024,1280}.png`).
- **Every host gets it:** the public page, the admin info page and the editor Preview render the
  same card.
- **Known trade-off:** the server render has no currency lookup, so the first paint reads
  "1 000 / mo" and gains "USD" when the lookup lands, as the sticky bar does today. The tile is
  there from the first paint, so nothing reflows.
- **Motion:** none.

### Copy

| `file:line` | Current | New |
| --- | --- | --- |
| `components/Opportunity/TabbedDetails/detailFacts.ts` (new fact, before :63) | — | label "Pay"; value: `payLine` verbatim, no new string |
| `components/Opportunity/TabbedDetails/DetailHeaderCard.tsx` (`FactTile`, new suffix) | — | "partner-paid" (the wording of `features/discovery/components/Results/MoneyBadge.tsx:27`) |

### Acceptance checks

Signed out, fixture 01 (`/opportunities/{id}`, the ID looked up by title).

- **1440:** three tiles across (`grid-cols-3`). First a `bg-orange-light` tile with the cash icon, "Pay", "USD 1 000 / mo" on one line, then Ends, then How you take part.
- **768:** the same three tiles in one row, the value on one line.
- **390 and 360:** Pay spans the row (334 / 304 px), and Ends · Take part share the next row.
- **320:** Pay spans the row (264 px), the value is 1 line, and `scrollWidth` is 320.
- **Event fixture 04** (ZLTO, no pay line): unchanged. Reward · Effort · Ends · Take part, 2 × 2
  below `lg`.
- **Signed in (approved, read-only):** the admin info page for fixture 01 shows the same Pay tile
  above the stat strip.
- **Not testable locally:** partner-paid, "Paid — amount not disclosed" and 5 tiles. Check the sims,
  or DEV data if any exists.

### Departures

| Current build / decision | This spec | Why |
| --- | --- | --- |
| Round 10 D1 strip: Reward · Effort · Ends · Take part | Pay · Reward · Effort · Ends · Take part | Jason's decision 3: the header shows what the card and the sticky bar show |
| 2026-10-06 header: 1440 byte-identical to before | True only for opportunities without a pay line | The new tile |
| `STRIP_COLUMNS` by count only | Pay changes the 3- and 5-tile columns | Long pay values can't sit in an 80 px tile |

---

## S7: A skill the catalogue no longer returns (priority 2)

`lib/customFields/skillLabels.ts` (working tree, new) and its callers: `CustomFieldsView`
(detail value), `CustomFieldFilters` (chip labeller and the filter control) and `CustomFields`
(editor select).

### Current

Screens: `cur-skill-chip-{1440,390,320}.png` and `cur-skill-control-390.png`. They were opened
signed out from a link carrying an unknown ID in `jobPreferredSkills`.

- At the base, the raw GUID showed in all three places.
- The logic batch already names skills by ID and labels a miss "Unknown skill" (`:23`), with "…"
  while the lookup is pending (`:26`). It reads "Preferred skills: Unknown skill" in the chip
  (2 lines at 320) and "Unknown skill ×" in the control.

### Change

One label everywhere: **"Skill no longer listed"**.

- **It says what happened.** The API validated the ID when the opportunity was saved, so a miss
  now means the catalogue retired it. It also tells an admin in the editor to remove or replace
  it, where "Unknown" reads as a fault.
- **The pending "…" stays.**
- **Nothing else changes:**
  - in the editor the skill stays selected and removable;
  - on the detail page it sits inline with the names ("Python, Skill no longer listed");
  - at 320 the chip wraps to 2 lines, as it already does.

### Copy

| `file:line` | Current | New |
| --- | --- | --- |
| `lib/customFields/skillLabels.ts:23` (working tree) | "Unknown skill" | "Skill no longer listed" |
| `lib/customFields/skillLabels.ts:26` (working tree) | "…" | unchanged |

### Acceptance checks

- **1440, 390, 320**, signed out: open
  `/opportunities/discover?type=Job&cf=[{"key":"jobPreferredSkills","operator":"AnyOf","values":["01a0e88e-0000-7000-8000-000000000001"]}]`
  (URL-encoded):
  - the chip reads "Preferred skills: Skill no longer listed" (2 lines at 320, no overflow);
  - in Filters → Job filters → Requirements, the control's value reads "Skill no longer listed ×";
  - no GUID shows anywhere, at any moment (watch the first paint).
- **The detail page and the editor:** no local opportunity has a Preferred skills value. The unit
  tests in `skillLabels.test.ts` cover the label; a check on DEV data, if any exists, is optional.

---

## S2: The editor's Details step and the youth completion form (priority 3)

`components/Opportunity/CustomFields.tsx:778–880` [wt 787–889], used by
`pages/organisations/[id]/opportunities/[opportunityId]/index.tsx:3255` and
`components/Opportunity/OpportunityCompletionEdit.tsx:806`.

### Current

Screens: `cur-editor-{job01,event04,impact19}-{1440,…}.png` and
`cur-editor-{job01,event04}-{390,320}.png` (signed in, `testorgadminuser`).

- **The headings read well.** Each is the group name in green tracked capitals, a rule, and a count
  (`cur-editor-job01-1440.png`: CLASSIFICATION 2 fields · COMPENSATION 5 fields · EMPLOYMENT
  4 fields · REQUIREMENTS 3 fields). The green sub-group badges (:854) are gone, as `subGroup` is
  null. "CLASSIFICATION" fits beside its rule and count at 320.
- **"1 fields":**
  - in the editor, Event "REQUIREMENTS 1 fields" and Impact Action "ACTIVITY 1 fields";
  - in the completion form, every Job, Impact Action and Event group has one field, so a youth
    would read "PLACEMENT 1 fields".
- **The subtitle is implementation-speak:** "Extra structured fields for this opportunity type,
  defined centrally and rendered here automatically." (:783–784). It takes 3 lines at 320, and
  because the component is shared, the same line shows to youth in the completion form.
- **Every field's `description` shows as its sub-label.** That suits the editor. In the
  completion form the descriptions reach youth, against decision 2's rationale:
  - "Actual placement start date, when known. Distinct from the Job application deadline; use
    yyyy-MM-dd.";
  - "Role at the event, when known. No role is inferred from attendance.";
  - "Economic sector of this venture: UN ISIC Revision 5, Section level…".

  This is Q2.

### Changes

- **S2.1: Count.** "1 field", and "N fields" from 2.
- **S2.2: The subtitle per host.** Add an optional prop on `CustomFields` (additive), e.g.
  `intro`, so each host sets its own line:
  - **editor:** the new line below, in the editor's own voice (cf. the Provider field's "This is
    shown to people and is searchable.", `index.tsx:2609`);
  - **completion form:** none. The title and the group headings are enough, and the current line
    is wrong for youth. This depends on Q2.
- **S2.3 (only if Q2 is yes):** the completion form hides the `subLabel` descriptions (a prop such
  as `hideDescriptions`). The editor keeps them.
- **Unchanged:**
  - the "Additional details" title (decision 1);
  - no type heading;
  - the heading row's look;
  - the `hideGrouping` path.

### Copy

| `file:line` | Current | New |
| --- | --- | --- |
| `components/Opportunity/CustomFields.tsx:833–834` [wt 842–843] | "{n} fields" | "1 field" / "{n} fields" |
| `components/Opportunity/CustomFields.tsx:783–784` [wt 792–793] (editor) | "Extra structured fields for this opportunity type, defined centrally and rendered here automatically." | "Details for this type of opportunity. They're shown to people and are searchable." |
| the same line (completion form) | as above | none (Q2) |

### Acceptance checks

Signed in as `testorgadminuser` (read-only: open the Details step, change nothing, don't press
Next).

- **1440:** fixture 04 (Event) reads "REQUIREMENTS · 1 field", and fixture 01 reads
  "CLASSIFICATION · 2 fields". The subtitle is the new line.
- **390 and 320:** the same. The subtitle is no more than 2 lines at 390, and each heading row fits
  on one line with no overflow.
- **The completion form** can't be opened under this task's access rules (see Not seen). The
  developer checks it in code: the same block without the subtitle, plus S2.3 if Q2 is yes.

---

## S4: The landing rail (priority 3)

`features/discovery/components/Discover/DiscoveryLanding.tsx:105–111`.

### Current

Screens: `cur-landing-rail-{1440,390,320}.png`.

- The title is "Newest on Yoma".
- The subtitle, "Latest start dates first", is wrong. The rail sends no ordering, so it gets the
  API's default: latest by date created. That is not by start date, and not a rolling week.
  Fixture 08, which starts in the future, leads it.

### Change

Copy only. The rail's `aria-label` follows the title (`DiscoveryRail.tsx`). The code comments that
name the rail (`DiscoveryLanding.tsx:38`, `lib/searchRequest.ts:53`) should follow too. The
results Sort's "Newest" is the same order and stays.

### Copy

| `file:line` | Current | New |
| --- | --- | --- |
| `features/discovery/components/Discover/DiscoveryLanding.tsx:107` | "Newest on Yoma" | "Latest opportunities" |
| `features/discovery/components/Discover/DiscoveryLanding.tsx:108` | "Latest start dates first" | "Most recently added first" |

### Acceptance checks

Signed out, `/opportunities/discover`, with the welcome closed ("Browse on my own"):

- at 1440, 390 and 320 the rail reads "Latest opportunities" with "See all N →" on the same line,
  and "Most recently added first" on one line below it (simulated: the title is 173 px of the
  288 px row at 320, `sim-landing-rail-*`);
- "See all" lands on the same results as before.

---

## S6: The title's focus outline after "Show less" (priority 4)

`components/Opportunity/TabbedDetails/DetailHeaderCard.tsx:204–211` [wt 205–212].

### Current

Screens: `cur-focus-title-from{390,768}-1440.png`. Sample: the 114-character title of
`6a7c6bb4-…`, which is clamped at 390 and 768 and fits in 2 lines at 1440.

1. Tab to "Show full title" and press Enter.
2. Widen the window to 1440 and press Enter on "Show less".
3. The toggle goes, and focus moves to the title (`:focus-visible` matches), but
   `focus:outline-none` (:208) shows nothing.

By mouse, the same steps leave `:focus-visible` false.

### Change

On the `h4`, replace `focus:outline-none` with
`rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-green`.

- **When it shows:** only when focus arrived from the keyboard. Script focus inherits
  `:focus-visible` from the toggle that had it. A mouse "Show less" shows nothing, because nothing
  needs finding.
- **The look:** 2 px in `green`, the toggle's own colour, offset 4 px with rounded corners. It is
  quiet against the 900-weight title and passes 3:1 against `white`.
- **`outline-solid` is needed.** In Tailwind v4, `outline-none` sets `--tw-outline-style: none`, and
  `outline-2` alone reads that variable.
- **`preventScroll`** is in the logic batch already.
- **Motion:** none. The outline appears instantly.

**Simulated:** `sim-focus-title-from{390,768}-1440.png`.

### Acceptance checks

Use the steps above at 768 → 1440 and at 390 → 1440, and run them at 768 alone where the title stays
clamped.

- **The keyboard path:** the title shows a 2 px `green` outline, 4 px out, with rounded corners
  (computed `outline-style: solid`, `outline-width: 2px`). The page doesn't scroll.
- **The mouse path:** no outline.
- **Tab again:** the outline leaves the title, and focus moves to the call to action.
- **390 and 320:** the toggle behaves as in the 2026-10-06 checks, and the clamped title shows no
  outline until focus reaches it this way.

---

## Open questions for Jason

1. **Q1: Pay tile scope.** I recommend **every type whose card shows a pay line**: one rule,
   `resolveMoneyBadge`, so the header never disagrees with the card. In practice that means a
   Job's salary, or "Paid — amount not disclosed", plus a partner incentive on any type (the card
   reads "USD 150 partner-paid"). The alternative is Jobs only, which leaves a partner-paid
   Learning's card and header saying different things.
2. **Q2: The youth completion form.** Decision 2 says definition descriptions are for admins and
   not shown to youth. The completion form shows them today as each field's hint, under the
   editor's subtitle. I recommend **hiding the descriptions there, and showing no subtitle**:
   - some are clear ("Zero is a valid reported outcome");
   - others are internal ("UN ISIC Revision 5, Section level", "use yyyy-MM-dd" above a date
     picker);
   - field titles and option names carry the meaning.

   If a field needs a youth hint, that is new metadata from Adrian (API-gated). The alternative is
   keeping the descriptions there as form instructions.
3. **Q3: YoID "Completed" cards hide the completion value on phones.** "Employment start date:" is
   followed by nothing at 390 and 320: the value is 0 px wide (`cur-yoid-completed-cf-{390,320}.png`).
   The same `CustomFieldsView` row, in 2 columns. I recommend **including it in this batch**: turn
   on S3's `wrapValues` with `columns={1}` in `MyOpportunityCustomFieldsSection`. The alternative
   is a follow-up ticket.
4. **Q4: A retired skill in a shared link fails the whole search.** The API rejects the request with
   400 ("Custom field 'Preferred skills' contains an invalid lookup value"), so the page shows
   "Couldn't load these results" and "Count unavailable right now" (`cur-skill-chip-320.png`). I
   recommend **asking Adrian to treat an unknown lookup value in a search filter as matching
   nothing**: 200 with no results, so the chip "Skill no longer listed" can be removed like any
   other (API-gated). The alternative is for the web to drop unknown IDs from the clause. Then the
   chip would claim a filter the search ignores.

## Seen, not changed

- **"Requirements" stays the group label for Job and Impact Action in discovery,** under a note
  saying "not entry requirements". In a filter panel the youth is choosing, not being judged, and
  "Tools required" really is a requirement. A rename is API configuration (Adrian).
- **The Entrepreneurship completion form asks Outcomes before Venture.** The business name comes
  after revenue, because groups sort alphabetically, in the API and in `CustomFields.tsx:108–114`.
  A group order needs API metadata.
- **"Minimum salary: 1000" is unformatted in "Additional details,"** while the header and Incentive
  read "USD 1 000 / mo". The Compensation rows repeat Incentive. This predates the batch.
- **The working tree:** S7's label and S6's `preventScroll` are in the logic batch's uncommitted
  files. Its other changes were not reviewed here.

## Not seen

- **The youth completion form** (`OpportunityCompletionEdit`). It opens only from the public detail
  page, signed in, which this task ruled out because the page writes a Viewed record. Its block is
  the editor's component, so S2's completion changes are specced from the code and the API seed
  (`…_CF_Configuration_Seeding_MyOpportunity.cs`, `…_Entrepreneurship.cs`).
- **A partner incentive, "Paid — amount not disclosed" and a 5-tile strip.** No local opportunity
  has them: 1,402 searchable, 1 paid Job, no partner incentives. They are simulated.
- **A saved Preferred skills value.** No local Job has one. The chip and the filter control were
  seen through a link; the detail value and the editor select were not.
- **The editor Preview header.** It is the same component as the public header, and was not
  captured.
- **iOS Safari:** only headless Chrome is available.
