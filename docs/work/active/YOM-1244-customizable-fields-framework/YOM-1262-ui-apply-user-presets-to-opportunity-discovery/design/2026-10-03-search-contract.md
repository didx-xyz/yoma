# W3 — the search contract's visible changes (2026-10-03)

- **Input:** the lead's W3 brief; `feature.md` Decisions up to the 2026-10-03 entry (which wins);
  Adrian's contract [`../../handoffs/2026-10-01-c.md`](../../handoffs/2026-10-01-c.md) ("Typed
  criteria and defaults", "Web composition and binding — Jason").
- **Status:** approved by Jason on 2026-10-03, with the recommendation taken on every open
  question (answers below).
- **Base:** `c2ca0eb9`. Paths are relative to `src/web/src/`. W1 and W2 are editing the same files
  concurrently, so line numbers may drift by a few lines; every string is quoted so it can be
  found by text.
- **Screens:** `~/.cache/cdp-tools/shots/2026-10-03-w3/` (machine-local), local stack, at 1440 ×
  900 and 390 × 844 (2x). Signed out unless marked. Jason approved sign-in for this task: the admin
  views were captured as the seeded admin, signed in through the Login page. No data was written.
  Files whose name starts `sim-` are DOM simulations of this spec on the live page, not builds.
- **Behaviour is fixed** by the brief's table and the 2026-10-03 Decisions. This spec changes
  presentation and copy only. The exceptions are the engagement step becoming multi-select, which
  the brief asks for, and the open questions below, each marked as a choice for Jason.
- **No new request per card or tile anywhere.** One item (Q3) reuses a lookup the wizard already
  loads, cached once per session. It is flagged there.

---

## Jason's answers (2026-10-03)

Every recommendation is approved, and so is the rest of the spec as written:

- Q1: (a), Most ZLTO is hidden on Jobs-only searches.
- Q2: "Accessibility: your needs", a private chip.
- Q3: (a) and (b), collapsed "Your needs" and the full inherited list.
- Q4: the divider is built.
- Q5: the static rows are added.
- Q6: all three timing rows go for Jobs.
- Q7: "Goal: Starting a business", plus the type-row line.
- Q8: the skills chip is ghosted when the search has no Jobs.

**The lead added one question (asked with Q7): should the Business category show as selected
while the goal is active?** The answer is no, as L6 says. The category is never shown selected in
Categories or the header pills, because it is an alternative to the type, not a constraint.
Skipping the goal goes through its chip or by deselecting Entrepreneurship. This supersedes the
session brief's "deselecting the Business category skips the goal".

**Added during W2 (Jason, 2026-10-03): a copy row for the write-back offer.** "Make this my
default" on a skipped Skills chip clears only the skills the youth added. The skills they've earned
(verified) still apply on the next visit, while the skip lasts for this search. When `skills` is
among the savable skips and the youth has verified skills, the banner offer
(`components/shared/PreferenceBanner.tsx`, "Keep it off from now on?") gains the sentence
**"Skills you've earned still apply."** The rest of the offer is unchanged.

**Added after the compare (Jason, 2026-10-03):**
- The S2 Accessibility line is now **"Needs every accommodation you pick; ones that say No are
  left out. Picked here, so are ones with no list; from your preferences, they stay in."** The
  approved line wrapped to 4 lines at 390; this one fits in 3 at 390 and 360. See the
  [compare](2026-10-03-search-contract-compare.md).
- A manually picked need stays named in its chip, the URL and the recent-search list. Only
  inherited needs are private.

## Open questions for Jason (each with a recommendation)

1. **"Most ZLTO" on a Jobs-only search** (S4). Jobs carry no ZLTO, so every Job sorts as null. I
   checked this on local data: a Jobs-only Most ZLTO search comes back in ID order, which looks
   random.
   - **(a) Recommended.** Hide Most ZLTO while every effective type is Job. This mirrors Paid and
     rewards, which hides its ZLTO half for Jobs ("hide, not grey", 2026-09-23). If the URL already
     has `sort=mostZlto`, the option stays visible and selected, because a selected option is never
     hidden (2026-09-28). A one-line note under the header then explains the order. This needs W2
     to append a `DateCreated` descending tie-break (lead note L4), so the fallback order is newest
     first.
   - (b) Hide it, and add a reducer rule that resets the sort to Newest when the search becomes
     Jobs-only. This is a behaviour change.
   - (c) Always show all three options, and let Jobs-only fall back to the tie-break order.
2. **What the inherited accessibility chip says** (S3). These needs are sensitive and private,
   and the screen may be shared.
   - **Recommended:** the chip reads **"Accessibility: your needs"**. It never names the needs and
     never counts them.
   - Its value is also kept out of four places: the banner's "tuned to" line, the "Picked for you"
     subtitle, the results heading, and the recent-search labels. It still counts toward "+N".
   - The alternatives are a count ("2 needs"), which tells an onlooker more, or naming the needs,
     which this spec advises against.
3. **The Accessibility filter section when the needs are inherited** (S3).
   - **(a) Recommended.** The section stays collapsed until the youth opens it, and its header reads
     "Your needs" rather than "2 selected". This departs from the rule that a section with a
     selection opens by default; the header and the FROM PREFERENCES badge still show that it is
     active.
   - **(b) Recommended.** When open, the section shows every inherited need, including needs no
     published opportunity lists yet. Today the options come from the accommodation facet (3
     values locally), while the wizard offers the full list (16 values). A need outside the facet
     list still filters, but there is no chip to see or remove. Labelling those needs uses the
     accessibility lookup the wizard already loads: one cached request, never one per card.
4. **An "Incentive not specified" divider in the results** (S5). When a Paid filter is set, the
   API lists the explicit matches first and the unknowns after, whatever the sort.
   - With Sort back, an "Ending soonest" list visibly restarts its dates halfway down the page. I
     reproduced this on the fixtures: 2 Nov … 3 Nov, then back to 2 Nov.
   - **Recommended:** a one-line divider before the first unspecified result on the page. The
     2026-09-22 Decisions parked this divider because it needed "Is Paid" and a public sort, and
     both now exist.
5. **Accessibility when an opportunity hasn't said, on the detail page** (S5).
   - Today the public page shows nothing, so a youth whose feed keeps "not specified" opportunities
     can't tell them from the ones that are suitable.
   - **Recommended:** an "Accessibility · Not specified" static row, like the Age range row, on the
     tabbed public and admin pages. Support with no list ("Available on request", "No") becomes the
     same kind of static row, since it has nothing to open.
   - This changes which sections show, so it is your call.
6. **Job completion review (admin)** (S6). The brief removes "Time to complete" for Jobs.
   - **Recommended:** remove "Started on" and "Finished on" for Jobs too, and show one line instead:
     "Jobs record a placement, not time spent."
   - Why the dates should go:
     - the youth's form never asks for a start date, so a Job's "Started on" is either missing or
       derived from the advertised effort (historical records);
     - the API fills "Finished on" with the submission day, or with the Job's deadline once that
       has passed.
   - The seeded pending Job shows exactly this: "Started on 01 Oct, Finished on 03 Oct, Time to
     complete 3 Days".
7. **The "Start a business" goal chip** (S3).
   - **Recommended:** **"Goal: Starting a business"**, with a tooltip naming both halves. The type
     row also gets one line while the goal is active: "Your goal also brings in Business, Finance &
     Marketing opportunities of any type."
   - The type row matters because the WHAT segment and the type row show only "Entrepreneurship",
     yet Learning cards from the Business category appear in the results.
   - This replaces 2026-10-01's "Type: …" for this one goal. The other goals keep "Type: Job" and
     so on.
8. **The skills chip when the search has no Jobs** (S3). The skills group narrows Jobs only, so
   with types such as Learning alone it does nothing.
   - **Recommended:** the chip takes the existing ghosted "inapplicable" class, with the note "Not
     applied — this search has no jobs". This is the same treatment the inherited place gets when
     it doesn't apply.

## Notes for the lead (W1 / W2 dependencies with a visible effect)

These are not W3 tasks, but W3 relies on them, or the screen would break.

- **L1. Worldwide only in the request.** It must never enter `effectiveFilters`, the chips, the
  WHERE segment or the mobile pill. The Where section unlocks region, city and distance only for
  exactly one effective country (`components/Filters/WhereControl.tsx:48-55`). An extra Worldwide entry would lock
  them, and the segment would read "South Africa +1".
- **L2. The Accessibility binding.** `FACET_FOR_BINDING.accommodations` (`registry/filterSections.ts:70`)
  must become `"accommodations"`, and `owningPreference` must find inherited needs. Otherwise:
  - the section never shows FROM PREFERENCES;
  - deselecting an inherited need adds a manual pick instead of skipping the preference.
  The stale comment at `components/Filters/useSectionModel.ts:200-201` goes with it.
- **L3. The anonymous merge.** Once step 4 is multi-select (S1), engagement should union like
  every other list (2026-09-22: "merge unions"). Today it is replaced on purpose "while the wizard
  step picks one at a time" (`api/models/userPreferences.ts:263-267`, and the comment at
  `state/useAnonymousMigration.ts:19`).
- **L4. The sort mapping** (W2's call; S4 depends on it):
  - Newest = omit `ordering`, the same order as the "Newest on Yoma" rail and its See all;
  - Ending soonest = `DateEnd` ascending, then `DateCreated` descending;
  - Most ZLTO = `ZltoReward` descending, then `DateCreated` descending.
  Without the second key, ties fall back to ID order.
- **L5. The divider (S5) assumes a root `incentivized` criterion with Include.** That is the only
  shape that creates the two buckets. If W2 ever moves it into a group, the divider must go.
- **L6. The goal group.** Keep Entrepreneurship in `effectiveFilters.types`, because the type row
  and the per-type filters read it. Never show the Business category as selected in Categories or
  the carousel: it is an alternative to the type, not a constraint on it.
- **L7. The skills chip's N** is the deduplicated union W2 sends (self-attested plus verified).
  Signed in, the verified skills are one `GET /user/skills?type=Verified` per session, the same
  call the save path makes (`api/services/userPreferencesLive.ts:265-268`). Never one per card.
- **L8. Fragment order.** Append skills after languages, and accessibility last, so neither leads
  the banner.
- **L9. Data, for Adrian.**
  - Fixture 06, a partner-like Job, has a disclosed salary ("USD 1 000 / mo") but
    `incentivized: null`, so a Paid filter ranks it among the unknowns. Partner Jobs with salaries
    will do the same in production.
  - The completion CSV README (`src/api/src/other/Completions (Submissions) CSV Import - README.txt:28`,
    `:81`) says three Entrepreneurship columns are required for non-instant completions. The import
    runs `PatchAllowMissingRequired` (`MyOpportunityService.cs:1665`), and the handoff's
    capture-path table agrees with the code, so the README is stale. The web help already says
    "All optional here".
- **L10. Hybrid is not implied by Remote + On-site** (the contract). No copy is proposed for this.
  Revisit if youth who pick both report missing hybrid opportunities.

---

## S1 — Personalize step 4: engagement becomes multi-select (and the wizard's rule notes)

### Current

- **Screens:** `wz-1440-step4-picked.png`, `wz-390-step4-picked.png`, `wz-390-step4-picked-full.png`,
  `wz-390-step3.png`, `wz-390-step6.png`.
- **What's wrong.**
  - **Engagement is single-select** (`components/Personalize/StepBlock.tsx:59-61`, after W1's
    edit). Tapping a second pill replaces the first, and the note says "Pick the one that suits you
    best." The API now stores a list.
  - **The How long note is false.** "Opportunities that don't state a time commitment are left
    out by this for now" — a maximum now includes them.
  - **The Pay note says nothing about order.** Under a Pay preference, unspecified opportunities
    come after the matches.
  - **Step 6 (accessibility) is false.** It says "This doesn't hide anything from your feed".
    Accessibility needs are now inherited.
  - **Step 3 (skills) is half-true.** It doesn't say that jobs listing no skills stay in.
  - **Room at 390 × 844 is tight.** Step 4 has 24px between its last note and the pinned footer.

### Changes

1. **Multi-select engagement.** In the engagement branch of `pillSelection`
   (`StepBlock.tsx:58-62`), toggle membership with the file's `toggleIn`. The pill is removed if
   present and added if not; an empty list means no preference. `Pill` is unchanged: each pill
   keeps `aria-pressed`, and the look already reads as a toggle. Update the comment at
   `StepBlock.tsx:27-31` and the registry comment at `registry/preferenceSteps.ts:154-155`.
2. **Copy** as in the table below. No new block fields and no new elements. The multi-select cue
   is the plural subheading plus the note's first sentence.
3. **Height budget at 390 × 844: step 4 must not scroll**, as today. I measured the new notes in
   the live note box: How long 52 → 38px, Engagement 38 → 52px, Pay 52 → 52px, so the net change
   is 0. The developer re-measures after the build. If anything wraps differently, the How long
   note keeps its short form.
4. **The summaries** of the saved engagement (the banner's chip and "tuned to" line, the mobile
   pill, the ENGAGEMENT segment) already handle several values ("Remote +1"). S3 adds a tooltip
   that lists every value. There is no wizard-level summary (`LiveCountPanel` shows only the
   count).
5. **Motion:** none new.

### Copy

| `file:line` | Current | New |
| --- | --- | --- |
| `registry/preferenceSteps.ts:141` | The most time you can give, and how you'd like to take part. | The most time you can give, and the ways you'd like to take part. |
| `registry/preferenceSteps.ts:150` | Opportunities that don't state a time commitment are left out by this for now. | Ones with no time commitment stay in your feed. |
| `registry/preferenceSteps.ts:160` | Pick the one that suits you best. | Pick any that suit you. Ones that don't say how you take part stay in your feed. |
| `registry/preferenceSteps.ts:170` | Leave both off if it doesn't matter. Opportunities that haven't said stay in your feed. | Leave both off if it doesn't matter. Ones with no incentive specified stay in, after the ones that match. |
| `registry/preferenceSteps.ts:132` | Only jobs are matched on required skills; learning and volunteering award skills instead. | Your skills narrow jobs only: a job that asks for none of them is hidden, and one that lists no skills stays in. |
| `registry/preferenceSteps.ts:221` | This doesn't hide anything from your feed — to see only opportunities that list what you need, use the Accessibility filter. It is never shared outside Yoma — not with partners, not in credentials, not in analytics. | Opportunities that say No, or whose list misses something you pick, are hidden from your feed. Ones that haven't said stay in. Your needs are never shared outside Yoma — not with partners, not in credentials, not in analytics. |

The code comments that state the old rules go too: `preferenceSteps.ts:148-149` and `:213-216`.

### Acceptance

- **1440, signed out:**
  - Open Personalize and go to step 4.
  - Tap Remote, then On-site: **both** pills are filled, and both have `aria-pressed="true"`.
    Tapping Remote again leaves only On-site.
  - Finish. The banner shows "Engagement: Remote +1" or "Engagement: On-site +1" (the lookup
    order decides which comes first). Hovering the chip shows both values.
  - Edit my preferences again: both pills are still selected at step 4.
  - The four notes read as in the table.
- **390 × 844:**
  - Step 4 shows all three blocks and their notes with **no inner scroll**. The last note ends
    above the pinned Continue button.
  - Every pill is ≥ 44px tall.
- **Sign in keeping your answers** (anonymous Remote + On-site, with a stored Hybrid): the saved
  list holds all three, once L3 lands.

### Departures

- **This reverses 2026-09-29's single-select and returns to the 2026-09-22 design.** The 2026-10-03
  Decision already records the reversal.
- **The engagement note box now opens with an instruction.** 2026-09-05 reserved boxed callouts
  for null rules. The box still exists for its rule; the instruction rides in front of it, instead
  of adding a subtitle line that costs 18px at 390.

---

## S2 — Section rule copy (the filters dialog, the mobile sheet and the segment popovers)

### Current

- **Screens:** `f-1440-sections.png` and `f-390-sections.png` (Engagement, How long,
  Accessibility, Language); `f-1440-more.png` (Paid and rewards, Skills, SDGs, Provider).
- **What's wrong.** The lines state the old API behaviour, and most are now false.
  - **Engagement** says "includes … for now". A manual pick is now strict.
  - **How long** says "Excludes … for now". It now includes.
  - **Accessibility** says nothing about the inherited mode.
  - **Language** says "Every opportunity lists at least one language". **Four local opportunities
    list none** (fixtures 06, 12, 18 and 24, all partner-like), so the claim fails for partner
    data.
  - **Provider** says opportunities that don't name one "stay in". They are now left out.
  - **Paid** doesn't say that the unspecified ones come after the matches.
  - **The Skills row's hint** describes a filter that doesn't exist, and doesn't mention that saved
    skills now narrow jobs.
  - **Where** doesn't say that the inherited country also brings in worldwide opportunities.

### Changes

- **Copy only**, in `registry/filterSections.ts`. The look is unchanged: the 13px grey `Message`
  box under the open section, in every home (dialog, sheet, segment popover).
- **One static line per section.** Engagement and Accessibility state both modes in that one line,
  because adding a manual pick to an inherited value switches the whole criterion to strict ("the
  manual mode wins"). The line predicts what the next tap does.
- **Height at 390** (measured in the live box): Engagement 3 → 2 lines; How long 3 → 2;
  Accessibility 3 → 3; Language 2 → 2; Paid 1 → 2; Provider 1 → 1; Where 2 → 3. No section grows
  by more than one line.
- **Categories keeps no line.** No local opportunity lacks a category, including the partner-like
  fixtures, and the category is required on every capture path.
- **SDGs is unchanged.** `DISTANCE_NOTE` (`lib/location.ts:37-38`) is unchanged; it already shows
  beside the distance control whenever a radius is on. That is why the Where line drops its
  distance clause.
- Update the stale code comments with the strings:
  - `filterSections.ts:22-24`, `:56-62`, `:143-146`, `:160-161`, `:175-178`, `:192-193`,
    `:207-210`, `:224`;
  - `lib/types.ts` (`accommodations` and `engagementTypes` doc comments) if W2 hasn't.

### Copy

| `file:line` | Current | New |
| --- | --- | --- |
| `registry/filterSections.ts:139` (Where) | Opportunities that don't name a region or city stay in your results; a distance search leaves out those without a mapped city. | Ones that don't name a region or city stay in. Your country from your preferences also brings in worldwide ones, except in a distance search. |
| `registry/filterSections.ts:156` (Engagement) | Includes opportunities that don't say how you take part — for now; they'll be hidden while this is set once the search API applies the rule. | Picked here, opportunities that don't say how you take part are left out. From your preferences, they stay in. |
| `registry/filterSections.ts:171` (How long) | Excludes opportunities that don't state a time commitment — for now; the rule is to include them once the search API changes. | Opportunities that don't state a time commitment stay in your results. |
| `registry/filterSections.ts:188` (Accessibility) | Shows only opportunities that list every accommodation you pick — ones that haven't described their accommodations are left out. | Needs every accommodation you pick. Picked here, ones that haven't listed theirs are left out; from your preferences, they stay in. Ones that say No are always left out. |
| `registry/filterSections.ts:203` (Language) | Every opportunity lists at least one language, so none are left out for missing data. | Shows opportunities in any language you pick. Ones that don't list a language are left out. |
| `registry/filterSections.ts:220` (Paid and rewards) | Opportunities that haven't said whether they pay or reward stay in your results. | Opportunities that haven't specified an incentive stay in, listed after the ones that match. |
| `registry/filterSections.ts:232` (Skills hint) | For jobs this matches required skills; for everything else, the skills you will earn. | The skills in your preferences already narrow jobs; jobs that list no skills stay in. |
| `registry/filterSections.ts:101` (`pendingNote`, Skills only; not visible on a disabled row) | Coming soon — the search can't filter on this yet. | Coming soon — you can't pick skills here yet. |
| `registry/filterSections.ts:259` (Provider) | Opportunities that don't name a provider stay in your results. | Opportunities that don't name a provider are left out. |

### Acceptance

- **1440, signed out:**
  - Open Filters and expand Engagement, How long, Accessibility and Language, then More filters →
    Paid and rewards, Skills, SDGs and Provider. Each shows exactly the new line.
  - The ENGAGEMENT and HOW LONG segment popovers show the same lines.
  - No section shows a line about "for now" or "once the search API …".
- **390:**
  - Same checks in the sheet.
  - No line is taller than the measured heights above. Engagement is 2 lines; Where and
    Accessibility are 3.

### Departures

- **The 2026-09-22 rule set** ("How long — excludes for now", "Engagement — includes for now",
  "Accessibility — includes for now", "Language — no null case") is replaced to match the
  2026-10-03 Decisions and the measured data.
- **Paid now claims "listed after".** 2026-09-29 said that "sorted last" was not claimed because
  there was no public sort. The API now orders the buckets.

---

## S3 — Inherited chips: job skills, accessibility, "Start a business" (the purple banner)

### Current

- **Screens:** `pb-1440-banner-current.png`, `pb-1440-fold-current.png`, `pb-390-banner-current.png`,
  `pb-390-fold-current.png`. These come from an anonymous wizard: Start a business, Up to a week,
  Remote, Paid or rewarded, Wheelchair accessible. `what-1440-popover.png` shows the type row
  under that goal.
- **What's wrong** (or missing, once W2 lands):
  - There is no skills chip and no accessibility chip. Both preferences will filter.
  - **The goal chip reads "Type: Entrepreneurship"**, but the goal now also brings in the Business
    category. Learning cards appear under a WHAT that says "Entrepreneurship", and nothing on
    screen explains why.
  - **Every inherited chip value is repeated** in three places:
    - the banner ("Your feed is tuned to Entrepreneurship · Up to 1 week · +2");
    - the rail ("Because your feed is tuned to entrepreneurship, up to 1 week");
    - the results heading and the stored recent-search label.
    The chip values therefore must not include private needs.

### Changes

1. **The skills chip** (`lib/chipModel.ts`, `lib/chipGroups.ts`).
   - Group: `PREF_GROUPS.skills` = "Skills" (unchanged). Value: "{n} job skill" / "{n} job
     skills", where n is the count of the union in L7.
   - Shown only when n ≥ 1, in the inherited class, with skip, undo and "Make this my default"
     unchanged.
   - With no Job among the effective types, and the types not empty, it takes the
     `inheritedInapplicable` class with the note in the copy table (Q8).
   - **The results heading.** An inapplicable chip doesn't filter, so the heading leaves it out, as
     it already does for the inapplicable place (`components/Results/DiscoveryResults.tsx:68-74`).
2. **The accessibility chip** (Q2).
   - Group "Accessibility" (unchanged). Value **"your needs"**, always. It never names the needs and
     never counts them, in the label, the title or the `aria-label`.
   - Mark it private: a `private: true` field on `DiscoveryChip`. The private chip:
     - is **left out of the names** in `PreferenceBanner.tsx:96-104` (the `tunedTo` line) and
       counts toward its "+N". If no nameable value is left, it falls back to the existing "your
       preferences" (`:161`).
     - **The "Picked for you" rail** (`components/Discover/DiscoveryLanding.tsx:49-53`, `:71-74`)
       still renders while **any** inherited chip is active; today `tunedTo` decides both. Its
       subtitle names only the non-private values. With none left, the subtitle is "Because of
       your preferences".
     - **The results heading** (`DiscoveryResults.tsx:68-74`, `:97-114`) leaves its value out of
       the named filter and counts it in "+ N filters".
     - **The recent-search label** (`DiscoveryResults.tsx:82-84`) leaves it out entirely.
3. **The "Start a business" goal chip** (Q7).
   - For the `biz` goal only: group "Goal", value "Starting a business". Lower-cased in the rail
     subtitle, it reads "starting a business".
   - Every other goal keeps the facet's group ("Type: Job").
   - The `PREF_GROUPS` comment at `chipGroups.ts:6-8` changes to match.
4. **Chip tooltips.** `components/shared/Chip.tsx:30-32`: when `chip.note` is set, the `title` of
   an active (or switched-off) chip becomes `${label} — ${note}`, as the inapplicable chip
   already does (`:37`). The notes are in the copy table.
   - For inherited chips with several values (Interests, Language, Engagement), the note lists
     every value ("Remote, On-site"), so "+1" is never a dead end on desktop.
   - The accessibility chip's note states the rule and never names the needs.
5. **The type row's goal line** (Q7). In `components/Filters/TypeRow.tsx`, under the pills (after
   `:104`), in both homes (dialog, sheet, WHAT popover):
   - one line, `text-gray-dark text-[13px] leading-snug`, the same style as the popover hint at
     `:69-71`;
   - shown only while the `biz` goal's fragment is active (preferences on, goal not skipped);
   - the category name comes from the category lookup by id, the same id W2 sends.
6. **The Accessibility section with inherited needs** (Q3; `components/Filters/useSectionModel.ts:200-203`,
   `components/Filters/FilterSection.tsx:25`).
   - **The summary:** "Your needs" while inherited needs are active and there is no manual pick;
     "Your needs +{k}" with k manual picks. "N selected" stays when nothing is inherited.
   - **Default:** collapsed while the only selections are inherited. Open by default, as today,
     once there is a manual pick.
   - **The options:** the facet list plus any selected id it lacks, labelled from the full
     accessibility lookup (`usePreferenceOptions("accessibility")`'s query, cached). It is ordered
     like `ChipSet`, so nothing jumps.
7. **Chip classes, skip, undo and "Make this my default" are unchanged.** "Make this my default"
   on a skipped accessibility chip clears the saved needs, exactly as today
   (`lib/preferenceMapping.ts:237-239`).
8. **Motion:** none new. A new chip uses the existing pulse (`useChipPulse`, `motion-reduce` off).

### Copy

| `file:line` | Current | New |
| --- | --- | --- |
| `lib/chipModel.ts` `fragmentValue` (`:66-81`), skills fragment | (no chip) | "{n} job skill" / "{n} job skills" |
| skills chip `note` (new) | — | "Jobs that ask for none of these are left out; jobs that list no skills stay in. Other types aren't affected." |
| skills chip `note`, inapplicable (new) | — | "Not applied — this search has no jobs." |
| `lib/chipModel.ts`, accessibility fragment value | (no chip) | "your needs" |
| accessibility chip `note` (new) | — | "Leaves out opportunities that say No, or whose list misses one of your needs. Ones that haven't said stay in." |
| `lib/chipModel.ts:178` group for the `biz` goal (from `FACET_GROUPS.types`, `lib/chipGroups.ts:24`) | Type | Goal |
| `biz` goal chip value | Entrepreneurship | Starting a business |
| `biz` goal chip `note` (new) | — | "Entrepreneurship, plus {Business, Finance & Marketing} opportunities of any type." (names from the lookups) |
| multi-value inherited chips' `note` (new) | — | every value, comma-separated, e.g. "Remote, On-site" |
| inherited country chip `note` (new, optional polish) | — | "Also includes opportunities open worldwide, except in a distance search." |
| `components/Filters/TypeRow.tsx`, new line under the pills | — | "Your goal also brings in {Business, Finance & Marketing} opportunities of any type." |
| `components/Discover/DiscoveryLanding.tsx:74` (fallback only) | Because your feed is tuned to {values} | unchanged; when no non-private value exists: "Because of your preferences" |
| `components/Filters/useSectionModel.ts:115` summary, Accessibility only | {n} selected | "Your needs" / "Your needs +{k}" (inherited needs active) |

### Acceptance

- **1440, signed out.** Run the anonymous wizard: Start a business; one skill at step 3 (if the
  anonymous skill search works signed out; otherwise test signed in with Jason's approval);
  Wheelchair accessible at step 6.
  - **The banner chips** include "Goal: Starting a business", "Skills: 1 job skill" and
    "Accessibility: your needs".
  - "Your feed is tuned to Starting a business · Up to 1 week · +N" never contains "your needs" or
    any accommodation name.
  - The rail subtitle reads "Because your feed is tuned to starting a business, up to 1 week".
  - **Hover** (not testable headless; check the `title` attribute instead): each chip's `title` is
    as in the copy table. No accommodation name appears in any `title` or `aria-label` on the
    page outside the wizard and the opened Accessibility section.
  - **The results heading:** "N matches for Starting a business + K filters", where K counts the
    accessibility chip. `localStorage["yoma.discovery.recentSearches"]` (or the equivalent key)
    holds no "your needs" and no accommodation name.
  - **Skip the accessibility chip:** it is struck through with an undo. "1 preference is off for
    this search" appears. Undo restores it.
  - **Add `type=Learning`:** the skills chip is ghosted with the info icon and its note.
  - **Open the WHAT segment:** Entrepreneurship is selected and the goal line shows under the
    pills.
  - **Open Filters → Accessibility:** it is collapsed, and its header reads "Accessibility · Your
    needs · FROM PREFERENCES". Opened, "Wheelchair accessible" is selected. A need that no
    opportunity lists (pick "Sign language interpretation" in the wizard) is also shown, selected.
- **390:** the same chips scroll sideways in the banner. "Accessibility: your needs" is readable,
  and wraps to 2 lines at most. The goal line wraps under the type pills in the sheet. Nothing
  overflows.

### Departures

- **The `biz` goal chip's group changes from "Type" to "Goal"** (2026-10-01 said "The goal chip
  now reads 'Type: …'"). The goal is no longer a type.
- **A private chip class of data** is new: its value is never repeated outside the chip.
- **The Accessibility section stays collapsed with an inherited selection** (Q3a). This departs
  from "collapsed by default UNLESS the section already carries a selection"
  (`FilterSection.tsx:14-15`). The header says it is active, so it is not a hidden filter.
- **The skills chip reuses the inapplicable class** (2026-09-28 built it for the place).

---

## S4 — Sort, back in the results header

### Current

- **Screens:** `r-1440-results.png` and `r-390-results.png` (today, no Sort);
  `sim-1440-sort-list.png` and `sim-390-sort.png` (this spec, simulated).
- **What's wrong.**
  - Sort is commented out (`components/Results/DiscoveryResults.tsx:23-24`, `:149-153`), and its
    control still carries two disabled options and the 390-only "More sorts soon" pill
    (`components/Results/SortControl.tsx:14-21`, `:52-59`).
  - The old pills (`min-h-9`, a white pill each) don't match the view toggle sitting beside them.
  - At 390, three pills plus the toggle can't share the heading's row: 358px are available, and
    the heading alone takes about 252px.

### Changes

1. **The control** (`SortControl.tsx`, rewritten in place):
   - **Group:** a visible "Sort" label (`text-gray-dark text-xs`), then a segmented group with
     `role="group" aria-label="Sort results"`.
   - **The container** matches `ViewToggle` exactly (`components/Results/ViewToggle.tsx:14`):
     `border-gray flex items-center rounded-full border bg-white p-0.5`.
   - **Each option** is a `button` with `aria-pressed`:
     `rounded-full px-3 text-xs whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none`.
     - Below md: `min-h-11 flex-auto`, the 44px touch rule.
     - From md: `py-1.5`, the toggle's height.
     - Selected: `bg-purple font-semibold text-white`, as on the toggle. Otherwise
       `text-gray-dark`.
   - **Options**, in order: Newest · Ending soonest · Most ZLTO. All are enabled. `SOON_NOTE`, the
     `available` flag and "More sorts soon" are deleted, and the file comment is rewritten.
2. **Placement** (`DiscoveryResults.tsx`):
   - **From `lg`:** inline in the header's right group (`:146`), before `ViewToggle`, with `gap-3`
     between them.
   - **Below `lg`:** its own row under the heading row, inside the results anchor, so the pager's
     scroll lands above it. The anchor at `:121` becomes `scroll-mt-20 flex flex-col gap-3`.
     - Below `sm` the group grows to the row's width (`grow`), with content-sized segments
       (`flex-auto`).
     - From `sm` to `lg` it is content-width and left-aligned.
   - **Measured at 390:** the group is 327px and the segments are 105 / 112 / 105px. At 360 they
     are 66 / 112 / 86px in 297px, and no label clips. The row adds 44px plus a 12px gap.
     *Corrected after the build (compare, 2026-10-03):* `flex-auto` gives 87 / 130 / 105px at
     390 and 77 / 120 / 95px in 297px at 360. The figures above can't come from that class.
3. **Most ZLTO on a Jobs-only search** (Q1a). "Jobs-only" means the effective types are non-empty
   and all equal `OPPORTUNITY_TYPE_NANE_JOB` (`lib/constants.ts:87`).
   - On such a search the option is not rendered, unless `state.sort === "mostZlto"`.
   - In that case it stays selected, and an info `Message` renders under the header row with the
     note in the copy table. It reuses the slot that the distance note uses (`:161-163`).
4. **Behaviour that stays:**
   - the reducer's `setSort` (page back to 1), `sort=` in the URL, and Newest as the default;
   - no scroll on a sort change (2026-09-03, round 6);
   - the results fade (`:182-186`);
   - landing rails show no Sort.
   The request mapping is W2's (L4).
5. **With a Paid filter**, the explicit matches still come first whatever the sort. S5's divider
   makes the restart visible. Sort says nothing about it.
6. **Motion:** the colour transition only, 150ms, off under `motion-reduce`. There is no sliding
   indicator, because the toggle beside it has none.

### Copy

| `file:line` | Current | New |
| --- | --- | --- |
| `components/Results/SortControl.tsx:15-17` | Newest / Ending soonest / Most ZLTO | unchanged, all enabled |
| `components/Results/SortControl.tsx:20-21` | Coming soon — the search API doesn't offer this ordering yet. | (deleted) |
| `components/Results/SortControl.tsx:58` | More sorts soon | (deleted) |
| `components/Results/SortControl.tsx:36` | Sort | Sort (unchanged) |
| new group `aria-label` | — | Sort results |
| new note (Jobs-only, Most ZLTO selected) | — | Jobs don't carry ZLTO, so they're shown newest first. (needs L4. Without the tie-break, use "Jobs don't carry ZLTO, so this order doesn't rank them.") |

### Acceptance

- **1440:**
  - The results header reads "N matches for … | Sort [Newest | Ending soonest | Most ZLTO] [Grid
    | List]" on one row, and the two controls look like one family.
  - Newest is selected by default, and the URL has no `sort=`.
  - **Ending soonest:** `sort=endingSoonest`. Closing dates ascend down the page, and opportunities
    with no end date come last (fixture 09 is one).
  - **Most ZLTO:** ZLTO amounts descend, and opportunities without ZLTO come last.
  - The page resets to 1 and does not scroll.
  - With `type=Job` the header shows only Newest and Ending soonest. With
    `type=Job&sort=mostZlto` all three show, Most ZLTO is selected and the note shows.
    `type=Job,Learning` shows all three.
  - Keyboard: every segment is a tab stop with a visible focus ring.
  - Reduced motion: no colour transition.
- **390:** Sort is on its own full-width row under the heading.
  - Each segment is ≥ 44px tall, and "Ending soonest" is not clipped at 390 or at 360.
  - There is no "More sorts soon".
  - The header row does not scroll sideways because of Sort.
- **768 and 1024:**
  - At 768 Sort is on its own, content-width row.
  - At 1024 it is inline. With a long heading the header row scrolls sideways, as it does today
    for the toggle.

### Departures

- **2026-10-01 "Copy link and Sort are hidden" is reversed for Sort**, because the API now has a
  public order. Copy link stays hidden.
- **2026-09-05 "the sort row collapses to one disabled 'More sorts soon' pill below `md`" goes**,
  because nothing is unavailable any more.
- **A new layout below `lg`:** Sort gets its own row.
- **The options are a segmented control** matching the view toggle, not the loose pills.
- **Most ZLTO is hidden on Jobs-only searches** (Q1). This is new, modelled on the 2026-09-23
  ZLTO rule.

---

## S5 — "Not specified" wording: the results divider, the cards, the detail page

### Current

- **Screens:**
  - `paid-1440-list-current.png`: Unpaid, list view. The unknowns follow the explicit matches with
    no mark;
  - `sim-1440-divider-list.png` and `sim-390-divider.png`: the proposed divider, simulated;
  - `cards-1440-events.png`: Event cards and their accessibility fact;
  - detail: `d04-1440-accessibility.png`, `d04-390-accessibility.png` (Available on request with a
    list), `d09-1440-accessibility.png` (on request, no list), `d18-1440-accessibility.png`
    (No), `d20-1440-requirements.png` (not specified: no Accessibility card at all),
    `d04-1440-incentive.png`.
- **What's wrong.**
  - **The results.** Under a Paid filter the unknowns follow the matches with no mark. With
    Ending soonest, the dates visibly restart.
  - **The cards** (Events only): "Available on request" with a list renders the names alone
    ("Quiet workspace"), which reads as an offer (`lib/cardFacts.ts:136`).
  - **The tabbed detail, Available on request with a list.** The note "What this opportunity
    offers people with disabilities." sits over an on-request list, a claim the contract forbids
    (`components/Opportunity/TabbedDetails/OpportunityDetailSections.tsx:465-467`). The collapsed
    preview shows the bare names (`:460-461`).
  - **Not specified:** no accessibility card at all (`:451`), so it can't be told apart from "not
    relevant" (Q5).
  - **Already compliant, no change needed:**
    - the money badge and list "MONEY" column never label a gap as "pay": a gap renders nothing,
      or "—";
    - the admin Incentive card reads "Incentive · Not specified" (`formatIncentivized`), where the
      title supplies "Incentive";
    - the classic `OpportunityCoreDetails` prints "Support: Available on request" above its badges,
      so it doesn't overclaim. It stays untouched: it is the kill-switch path.

### Changes

1. **The incentive divider** (Q4). This is a new presentational component,
   `features/discovery/components/Results/IncentiveDivider.tsx`.
   - **When:** `effectiveFilters.incentivized !== null` and the page has an item with
     `incentivized == null`. It renders before the first such item.
     - If that item is first on page 1, the divider sits at the top: nothing on the page matched
       explicitly.
     - On page 2 or later it sits at the top whenever the page begins in the unknown bucket.
   - **Placement.** `DiscoveryResults` computes the index from `results.items` and passes it to
     `ResultsGrid` and `ResultsList` as `incentiveSplitAt?: number`.
     - In the grid the divider is a `col-span-full` child.
     - In the list it is a full-width row between rows, outside the `LIST_COLUMNS` grid.
   - **Look:** `flex items-center gap-3 py-2`.
     - Two hairlines, `bg-gray h-px grow hidden sm:block`. At 390 there are no hairlines and the
       text is centred.
     - Centred text: line 1 `text-xs font-semibold text-black`; line 2 `text-gray-dark text-xs`.
   - No icon, no motion; it fades with the results.
2. **Card fact** (`lib/cardFacts.ts:132-143`):
   - "Available on request" with a list → `On request: ${firstTwo(names)}`.
   - "Yes" with a list → names, unchanged.
   - "Available on request" with no list → "Accessibility: Available on request", unchanged.
   - Null or "No" → no fact, unchanged.
   Nothing new on the card for a null incentive. The card never claims, and a grey "not
   specified" line on every card is noise.
3. **The tabbed detail, accessibility** (`OpportunityDetailSections.tsx:444-480`). The same
   component serves the public page, the admin page and the editor Preview.
   - **With a list**, as today: a card with chips and a count. When the support is
     `AvailableOnRequest`, the preview reads `On request: ${previewOf(names)}`, and the note reads
     as in the copy table. "Yes" is unchanged.
   - **No list** (support set, or null) → a **static row** (Q5). It follows the Age range pattern
     (`:431-442`): `static: true`, `content: null`, `valueHint` as below, `IoAccessibilityOutline`,
     `TONE.lilac`, group "requirements".
     - `valueHint`: "Available on request", "No" or **"Not specified"**.
     - The condition at `:451` becomes "always".
   - Nothing changes for the Incentive card: it shows only once answered on the public page, and
     shows "Not specified" on the admin page.

### Copy

| `file:line` | Current | New |
| --- | --- | --- |
| `Results/IncentiveDivider.tsx` (new), line 1 | — | Incentive not specified |
| `Results/IncentiveDivider.tsx` (new), line 2 | — | These come after the ones that match your Pay filter. |
| `lib/cardFacts.ts:136` (Available on request with a list) | {names} | On request: {names} |
| `TabbedDetails/OpportunityDetailSections.tsx:460-461` preview (Available on request with a list) | {names} | On request: {names} |
| `TabbedDetails/OpportunityDetailSections.tsx:465-467` note (Available on request with a list) | What this opportunity offers people with disabilities. | What the provider can arrange if you ask. |
| `TabbedDetails/OpportunityDetailSections.tsx:462` preview with no list | Support: {support} | (static row) valueHint {support} |
| new static row, support null and no list (Q5) | (no row) | Accessibility · Not specified |

Line 2 of the divider deliberately doesn't say "they don't say whether they pay". Fixture 06 shows
a salary on its card while its incentive flag is unset (L9).

### Acceptance

- **1440,** `?q=Search%20fixture&paid=0&prefsOff=1&view=list&sort=endingSoonest`:
  - the divider sits between "Search fixture 23 - Job" (the last explicit Unpaid) and the first
    unspecified fixture;
  - closing dates ascend above it and restart below it.
  - Grid view: the divider spans all four columns.
  - Without `paid=` there is no divider. With `paid=1`, page 1 shows it before the first
    unspecified card.
- **390,** the same URL in grid view: the divider is centred text with no hairlines, between two
  cards (`sim-390-divider.png`).
- **Cards:** an Event whose support is "Available on request" with a list shows "On request: …".
  The fixtures have none, so simulate one or test after a fixture tweak. Fixture 01 (Yes) still
  shows "Other, Quiet workspace +1". Fixture 09 (on request, no list) shows "Accessibility:
  Available on request".
- **Detail, at 1440 and 390:**
  - fixture 04: the preview reads "On request: Quiet workspace", and opened, the note reads "What
    the provider can arrange if you ask.";
  - fixture 09: a static row, "Accessibility · Available on request";
  - fixture 18: "Accessibility · No";
  - fixture 20 (null): "Accessibility · Not specified" sits in the Requirements group, in the right
    cell beside Languages at `lg`;
  - fixture 01: unchanged (chips plus "What this opportunity offers…").
  - The admin info page shows the same rows.

### Departures

- **The divider** was listed under "Not built" on 2026-09-22 ("Pay not specified" results divider).
  It is built now, and named "Incentive not specified" per the contract.
- **The Not specified, "Available on request" and "No" accessibility rows** change which detail
  sections show (Q5). Round 10 matched the existing set and conditions.

---

## S6 — Job completion review (admin), without "Time to complete"

### Current

- **Screens (signed in as the seeded admin):** `jc-1440-modal.png` and `jc-390-modal.png`. They
  show Jobberman - Nigeria → Submissions → Pending → "STEM Skills Program Experience Creativity
  Management 1890943085" (a Job, advertised "3 Days") → the Pending button.
- **What's wrong.** It reads "Started on: 01 Oct 2026 · Finished on: 03 Oct 2026 · Time to
  complete: 3 Days". For a Job, all three are fabricated or automatic:
  - the API no longer derives timing for Jobs;
  - `getCommitmentDisplay` falls back to the opportunity's advertised effort when the completion
    has none (`components/Opportunity/opportunityTypeTheme.tsx:188-192`);
  - the youth's form never asks for a start date (`OpportunityCompletionEdit.tsx` has no
    `dateStart` input).

### Changes

- **In `components/Opportunity/OpportunityCompletionRead.tsx:253-311`,** when
  `data.opportunityType === OPPORTUNITY_TYPE_NANE_JOB`:
  - do not render "Time to complete";
  - per Q6, do not render "Started on" or "Finished on" either;
  - in place of the grid, render one line: `<p className="text-gray-dark text-sm">`.
- The Job's own completion fields (for example "Employment start date") keep rendering below
  through `MyOpportunityCustomFieldsSection`, unchanged.
- Every other type is unchanged.
- **If Jason keeps the dates** (Q6 "no"): only the "Time to complete" block (`:295-310`) is
  skipped for Jobs, and the line still renders under the dates.

### Copy

| `file:line` | Current | New |
| --- | --- | --- |
| `components/Opportunity/OpportunityCompletionRead.tsx:301` | Time to complete: | (not rendered for Jobs) |
| `components/Opportunity/OpportunityCompletionRead.tsx:260`, `:279` | Started on: / Finished on: | (not rendered for Jobs, Q6) |
| new, Jobs only | — | Jobs record a placement, not time spent. |

### Acceptance

- **1440 and 390, signed in as the admin:** the pending Job's review modal shows the name, email
  and country, then "Jobs record a placement, not time spent." It shows no timing rows. Cancel
  closes it.
- **A non-Job pending completion,** if the seed has one, still shows its dates and "Time to
  complete".
- **Not on the seed:** a Job completion with "Employment start date". Check by reading the code
  that the custom-fields section still renders.

### Departures

- Q6 removes two rows the brief didn't name.

---

## S7 — Completion-import help copy

### Current

- **Screens (signed in as the admin):** `imp-1440-help.png` and `imp-390-help.png` (Submissions →
  Actions → Import → "What must the file contain?").
- **Checked against the API sample.** `src/api/src/other/MyOpportunityInfoCsvImport_Sample.csv`
  has 23 headers: 8 core, then `CF:jobEmploymentStartDate`, `CF:impactActionImpactAchieved`,
  `CF:eventRole`, then the 12 `CF:entrepreneurship*`.
  - The help already lists all 23, with option keys that match the definitions migration (revenue,
    funding and client-location bands checked).
  - W1 syncs the downloadable web sample (`public/docs/MyOpportunityInfoCsvImport_Sample.csv`).
- **What's missing or wrong:**
  - "…must be provided for each opportunity", when each row is a submission;
  - nothing says the core columns' order matters, or that `CF:` headers are case-sensitive and a
    key without `CF:` is rejected;
  - nothing says imports need the opportunity's verification method to be Automatic (the API's
    error says so only after a failed upload);
  - the sample link uses `text-blue-600`, which is not a Yoma token.

### Changes

- Copy rows below. The structure and the accordion are unchanged.
- The two new sentences are plain `<p className="mb-3">` paragraphs, as their neighbours are.
- The sample link class `text-blue-600` becomes `text-blue-dark`.

### Copy

| `file:line` | Current | New |
| --- | --- | --- |
| `components/Opportunity/Admin/VerificationImport.tsx:227-228` | The following properties must be provided for each opportunity: | Every row must have: |
| new paragraph, first in the "What must the file contain?" content (before `:224`) | — | Start from the sample file and keep its core columns in the same order. |
| new paragraph, after the Required list (after `:235`) | — | Imports work only for opportunities whose verification method is Automatic. |
| `components/Opportunity/Admin/VerificationImport.tsx:261-263` | These come after the core columns, each headed CF: plus the field key. Use each only for its opportunity type and leave it blank for the others: | These come after the core columns, each headed CF: plus the field key exactly as shown (headers are case-sensitive; a key without CF: is rejected). Use each only for its opportunity type and leave it blank for the others: |
| `components/Opportunity/Admin/VerificationImport.tsx:380` (class) | text-blue-600 | text-blue-dark |

### Acceptance

- **1440 and 390, signed in as the admin:** the help shows the four changed or new sentences, and
  the column list is unchanged.
- "sample import file" downloads the W1-synced CSV, whose header row equals the API sample's.
- Nothing is uploaded.

### Departures

- None.

---

## Developer task list

Every string is in the copy tables above, and the open questions decide T6–T8, T11 and T12. Run
static checks (`tsc`, `eslint --max-warnings=0`, `prettier --check`) on every changed file. Add no
request per card or tile.

1. **Step 4 multi-select** (S1). Engagement branch of `pillSelection` (`StepBlock.tsx:58-62`) uses
   `toggleIn`; comments `:27-31` and `preferenceSteps.ts:154-155`. The lead routes L3 (union on
   the anonymous merge).
2. **Wizard copy** (S1): `preferenceSteps.ts:132`, `:141`, `:150`, `:160`, `:170`, `:221` and the
   comments `:148-149`, `:213-216`. Re-measure step 4 at 390 × 844: no inner scroll.
3. **Section rule copy** (S2): `filterSections.ts:101`, `:139`, `:156`, `:171`, `:188`, `:203`,
   `:220`, `:232`, `:259`, and the stale comments listed in S2.
4. **Chip model** (S3.1–3): the skills value and note (plus its inapplicable state), the
   accessibility value, note and `private` flag, and the `biz` goal's "Goal" group, value and note,
   in `lib/chipModel.ts` and `lib/chipGroups.ts`. Add multi-value notes. Optional: the country
   note.
5. **Chip tooltips** (S3.4): `components/shared/Chip.tsx:30-32` uses `${label} — ${note}` when a
   note is set.
6. **Private chip handling** (S3.2, Q2): `PreferenceBanner.tsx:96-104`; `DiscoveryLanding.tsx:49-53`
   and `:71-74` (the render condition is separate from the subtitle); `DiscoveryResults.tsx:68-74`,
   `:82-84`, `:97-114`.
7. **The type row's goal line** (S3.5, Q7): `components/Filters/TypeRow.tsx` after `:104`.
8. **The Accessibility section** (S3.6, Q3): the summary in `useSectionModel.ts` (`listModel`,
   accommodations only), the default-collapsed rule in `FilterSection.tsx:25`, and the options
   union with the accessibility lookup. This depends on L2.
9. **Sort** (S4, Q1):
   - rewrite `SortControl.tsx`;
   - re-enable it in `DiscoveryResults.tsx`, deleting the `:17-18` and `:23-24` comments and
     uncommenting `:150-153`, but leave Copy link hidden;
   - make the anchor `:121` a `flex flex-col gap-3`, with the inline (`lg`) and own-row (below
     `lg`) placements;
   - add the Jobs-only rule and its note. This depends on L4.
10. **The incentive divider** (S5.1, Q4): the new `Results/IncentiveDivider.tsx`, an
    `incentiveSplitAt` prop on `ResultsGrid.tsx` and `ResultsList.tsx`, computed in
    `DiscoveryResults.tsx`. This depends on L5.
11. **Card fact** (S5.2): `lib/cardFacts.ts:132-143`, "On request:" for on-request lists.
12. **Detail accessibility** (S5.3, Q5): `OpportunityDetailSections.tsx:444-480`. The
    on-request preview and note, and the static rows for no list (Available on request, No, Not
    specified).
13. **Job completion review** (S6, Q6): `OpportunityCompletionRead.tsx:253-311`.
14. **Import help** (S7): `VerificationImport.tsx:224-236`, `:259-264`, `:380`.
15. **Self-check before hand-off:**
    - no accommodation name appears in the DOM outside the wizard and the opened Accessibility
      section (`document.body.innerText` and `[title]`, `[aria-label]` with an inherited need
      set);
    - the network log shows no new per-card request;
    - every new motion has `motion-reduce:` off.

## What I could not see (and why)

- **The new chips and the inherited Accessibility section.** W2 hasn't landed, so they are
  specified from the code. The skills chip's anonymous path depends on the step-3 skill search
  working signed out, which I did not test.
- **A signed-in banner with chips.** The seeded `testuser` has no saved preferences, and saving
  some would write to the seeded account. The anonymous banner is the same component.
- **An Event card with "Available on request" plus a list.** No fixture has one; the card copy is
  specified from `cardFacts.ts`.
- **A Job completion with "Employment start date",** or any non-Job pending completion: none is
  seeded.
- **Hover** (headless reports `hover: none`). Tooltips are specified as `title` attributes.
- **The Sort layout at 768 and 1024.** It wasn't captured; it is specified from the 390 and 1440
  measurements and the existing header behaviour.
- **Seen, out of scope, predating this work:**
  - the admin review modal renders in a fallback sans font, and its divider draws as two short
    lines (`OpportunityCompletionRead.tsx:154`);
  - inherited values in the Engagement and Paid section pills are green, not the preferences
    purple.
