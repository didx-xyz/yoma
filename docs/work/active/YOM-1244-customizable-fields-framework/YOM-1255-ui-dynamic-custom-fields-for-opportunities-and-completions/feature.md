# Feature: UI — Dynamic Custom Fields for Opportunities and Completions

## Meta

- **Feature**: Dynamic custom fields — capture and display
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1255](https://linear.app/didx/issue/YOM-1255)
- **Owner**: Jason
- **Areas**: web
- **Status**: in-progress
- **Started**: 2026-07-21

> Retro-created on 2026-08-11 from the branch, the tickets and an out-of-repo context pack.
> The two handoffs dated before 2026-08-11 are **reconstructed**, not contemporaneous.

## Problem / Goal

Render, capture and display custom fields on every Opportunity and completion surface,
driven entirely by the definitions the API returns. Filtering is a separate ticket
([YOM-1260](../YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/feature.md)).

Surfaces:

- Opportunity **create / edit** (admin, org admin) — `/organisations/[id]/opportunities/[opportunityId]`
- Opportunity **details** — org-admin `…/info` and public `/opportunities/[opportunityId]`
- **Completion capture** (user) — `OpportunityCompletionEdit`, and its read view
- **List cards** — the user's opportunity lists and search-result cards

The shared API contract lives in the [epic README](../README.md#shared-api-contract); this doc
only covers what is specific to capture and display.

## Out of Scope

- Custom-field **filtering** — YOM-1260.
- Phase-2 admin CRUD for definitions/options, credential mapping UI, User Presets — see the epic.
- Any hardcoded definition key, title, option or opportunity type.

## Plan

### Components

| Component                                                                     | Role                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CustomFields.tsx`                                                            | The editable surface. One control per `DataType`; Option fields resolve to inline options (submitting option **keys**), Country/Language selects or an async Skill search (both submitting **GUIDs**); `supportsMultiple` picks single vs multi. Groups by Group → SubGroup unless `hideGrouping` |
| `CustomFieldsView.tsx`                                                        | Read-only `{Title}: {Value}` display. Resolves option keys and Country/Language/Skill GUIDs to names. Optional `fields` whitelist for compact card use                                                                                                                                            |
| `OpportunityCustomFieldsSection.tsx` / `MyOpportunityCustomFieldsSection.tsx` | Fetch the right definitions and render `CustomFieldsView` as an "Additional details" section                                                                                                                                                                                                      |
| `DetailSection.tsx`                                                           | Shared sidebar section chrome extracted while doing this work                                                                                                                                                                                                                                     |

### Validation

`getCustomFieldError(definition, entry)` / `getCustomFieldErrors(definitions, values)` are pure and
**exported**, so the component's inline errors and the caller's zod schema apply one rule set:
required, Int32 range for Integer, invariant + `decimal.MaxValue` for Decimal (compared as digit
strings — the value exceeds JS `Number` precision), and `validationRegex` for String.
`getCustomFieldNumberError` is exported separately for reuse by the filter UI.

### Form integration (create / edit)

Custom-field state is held **outside** the react-hook-form object and merged on submit, because
`zodResolver` strips unknown keys. The wizard binds it through `<Controller name="customFields">`
so it participates in step 2's zod `superRefine` (gating "Next" and the tab jump) and in the
unsaved-changes dialog. On submit the collection is reconciled against the **current type's**
definitions, empties dropped, and the **full** collection resubmitted (replacement semantics).

`CustomFields` updates local state on every keystroke and debounces the parent `onChange` (400ms)
with a blur flush; the seeding effect ignores echoes of its own emissions to avoid a feedback loop.

### Completion

Definitions come from `GET /myopportunity/{opportunityId}/custom/field/definition`; the submission
is `multipart/form-data` with `CustomFields` as one JSON-encoded form field
(`api/services/myOpportunities.ts`).

## Tasks

- [x] **T1 — Create / edit.** Definition-driven fields in step 2, zod + dirty integration,
      type-change refetch and reconciliation, replacement-semantics submit.
- [x] **T2 — Completion (user) + list cards.** MyOpportunity definitions hook, multipart submit,
      completion read view, custom-field metadata on `MyOpportunity/OpportunityListItem`.
- [x] **T3 — Details.** `OpportunityCustomFieldsSection` on the org-admin and public detail pages;
      sidebar sections refactored onto `DetailSection`.
- [x] **Entrepreneurship type** (Adrian's `f0194e90`, 2026-10-01 —
      [`../handoffs/2026-10-01-b.md`](../handoffs/2026-10-01-b.md)): editor effort optional and
      paired; incentive "Not specified"; the programme Other ↔ description rule; Integer
      `validationRegex`; both import help texts. The completion form needed no change.
- [x] **PascalCase CF keys** (Adrian's 2026-10-11 rename,
      [`../handoffs/2026-10-12-a.md`](../handoffs/2026-10-12-a.md)): the rule and card-fact key
      constants, both import help texts (plus ProviderURL, ProviderLogoURL, ProviderCountry and
      CountryCompleted), the three CSV samples copied from the API, tests and mock data.
- [x] Provider website, logo and country in the editor, the details page and on Worldwide cards;
      the Entrepreneurship business location on the completion form; the completion location
      on the admin completion card and the verifications list (2026-10-12, same handoff).
- [x] **One-sided salary and Contract employment** (Adrian's Jobberman CF mapping, `ddb36f1ca`
      / #1988, 2026-10-19): "From" / "Up to" pay line on cards, rows and details; Contract's
      optional, paired term in the editor rules ([`handoffs/2026-10-20-a.md`](./handoffs/2026-10-20-a.md)).
- [x] Check the salary line and the Contract rule in a browser against an API that has the
      `20261019110000_ApplicationDb_Job_Employment_Contract` migration (2026-10-20; "Up to" and
      Jobberman records not in local data — see the handoff).
- [x] **Completion form redesign** (Jason's round-3 H1/H3, 2026-10-21; spec
      [`design/2026-10-21-completion-form.md`](./design/2026-10-21-completion-form.md)): four
      `DetailDisclosure` sections with status lines, auto-advance, error timing, the error
      summary and scroll-to-first-error, the new copy, outline-green Upload on the details page
      and in the sticky bars, and the site font in every `CustomModal`. Round-3 fix round
      applied 2026-10-21 (see Decisions); lead's lint + tests pending.
- [x] **Completion dialogs, Jason's 2026-10-22 list** (developer): the layout shift on open, the
      celebratory Submitted icon, the form's new heading and trophy, and the check / cross beside
      every required field (see Decisions, 2026-10-22).
- [x] **Completion dialogs, Jason's 2026-10-22 feedback round 2** (developer): yellow trophy,
      required mark to the left of the label and orange by default, and the confirmation before
      "Delete files" (see Decisions, 2026-10-22 round 2).
- [x] **"Completed" chip tooltip, Jason's 2026-10-22 todo** (developer): "Well done — you
      completed this on {date}" on the chip in the header card and sticky bars (see Decisions,
      2026-10-22 completed chip).
- [ ] Drive the Entrepreneurship editor (Rewards "Not specified", the programme Other rule) and a
      youth completion (the three required venture fields, "Jobs created" = -1) signed in. Not
      done 2026-10-01: that session had no signed-in API or browser access.
- [ ] Re-verify every surface once the BA-approved definitions land (YOM-1264). No code change
      should be needed — that is the point of the definition-driven rule.
- [ ] Resolve the Skill label fallback if a batch skill get-by-ids ever appears (see Gotchas).

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-07-21: Definitions are fetched per selected opportunity **type name** and the query is keyed
  on it, so changing the type in the wizard refetches and re-renders the applicable fields.
- 2026-07-22: Contract corrections after reading the API branch: `lookupType` **exists**,
  `defaultValue` was **removed**, entity responses **do** hydrate `customFields`. The planning notes
  said the opposite on all three.
- 2026-07-22: Custom-field state sits outside the RHF form (zodResolver strips unknown keys) and
  validation is shared with the caller's zod through exported pure functions.
- 2026-07-22: Saves resubmit the full collection reconciled to the current type's definitions.
  Omitted keys are deleted server-side, so a partial diff would silently destroy data.
- 2026-07-22: `CustomFields` renamed from `OpportunityCustomFields` and made context-agnostic —
  it takes definitions and values, and knows nothing about Opportunity vs MyOpportunity.
- 2026-07-27: Completion reuses the same editor and validators; only the definitions source and
  the multipart submission differ.
- 2026-10-01 (Jason): **Entrepreneurship's Rewards step offers "Not specified"** beside Yes / No,
  mirroring the API's Manual rule set. While it is unanswered there is no reward; submit forces
  None, because the API rejects a rewarded non-Job that is not marked incentivized. Effort is
  optional and paired, as for Jobs. The type is detected by the selected type's enum **name**
  (`OPPORTUNITY_TYPE_NAME_ENTREPRENEURSHIP`), never its GUID.
- 2026-10-01: **`validationRegex` now also applies to Integer values**, tested against the
  normalised text the API tests (`int.ToString()`, so "007" → "7"), and Strings are trimmed
  first, as the API does. Previously only Strings were checked, so `entrepreneurshipJobsCreated`
  = -1 failed only on save. Other data types stay API-only: no definition gives them a pattern.
- 2026-10-12 (Jason): **Provider details and the completion location**, following the API's
  2026-10-11 contract (README; YOM-1277).
  - **Editor, step 1:** Provider website, Provider logo (a link, with a live preview) and Provider
    country (no Worldwide), under Provider. The view model carries all three, because the update
    replaces them: before this, any save from the web cleared values set by an import or a
    partner.
  - **Provider links follow the API, not the Link field** (Jason, same day): any absolute
    http(s) link with a host is valid, localhost and query strings included (`absoluteWebURL`).
    The Link field's pattern wants a dot-and-TLD host, so it refused
    `http://localhost:3000/_next/image?url=…`. A link typed without a scheme gains https:// on
    submit, because the API stores absolute links only.
  - **Details page:** the Provider card shows the logo, the name (else the website's host),
    "Based in {country}" and the website, opening in a new tab. `ProviderLogo` is unoptimised
    with a storefront fallback, because the logo can be any host and `next/image` optimises only
    the allow-listed ones. The classic layouts are untouched: `CUSTOM_FIELDS_ENABLED` is `true`.
  - **Cards and rows** say "Worldwide · from South Africa" when a Worldwide opportunity's
    provider country is known (`cardPlace`), because a country search now also returns those.
  - **Completion form:** Entrepreneurship only, an optional "Where is your business?" (country,
    then region and city via `LocationInput`). It is never prefilled from the profile. Other
    types send no location, because the API rejects it.
  - **Admin:** the completion card shows "Business location" or "Completed in" under the
    profile country. The verifications table has a Location column, and its mobile card a row.
    The youth's own list doesn't show it (Jason). The text is built from city, region and
    country (`completionLocation`), because the API's `location` is never filled.
- 2026-10-20 (Jason): **Salary bounds and Contract employment**, following `ddb36f1ca` (#1988).
  - **Pay line** (`resolveMoneyBadge`, so cards, rows, the details header, badges and the
    Rewards section agree): a minimum alone reads "From ZAR 5 000", a maximum alone "Up to
    ZAR 5 000", equal bounds one amount, different bounds a range. The interval is appended only
    when supplied. Before this, either one-sided case showed a bare amount, which turned a
    partner's "Above NGN 5 000 000" into what looked like an exact salary.
  - **Contract rule** (`applyCustomFieldRules`, mirroring the API's `AssertCrossFieldRules`):
    Contract alone needs no term; a duration or unit that is given needs the other. Any other
    non-permanent type still requires both, so Contract never waives Fixed-term's term.
    Permanent is unchanged. The required-term messages now say "for the selected employment
    type", because "unless … a contract" misread with Contract + Fixed-term both selected.
  - **No change needed:** the Contract option and its label, the card's employment fact and
    the 24 rewritten help texts all come from the definitions.
- 2026-10-21 (Jason): **Completion form as sections** (spec `design/2026-10-21-completion-form.md`).
  - **Sections** are `DetailDisclosure` cards, in order: Proof of completion (the verification
    types), "Tell us about it" (the completion custom fields, fixed copy at Jason's choice — not
    the API group name, which the BA may rename — with " · N" keeping D-87's count), "Where is
    your business?" (Entrepreneurship) and "Before you go". Each header carries a status line:
    Done, Needs attention · n to do / to fix (red icon after a failed submit), or Optional. The
    rule is `completionSections.ts` (pure, tested). Ids use the `completion-` prefix so they never
    collide with the detail page's `section-*` ids. The `TONE` tints moved into `DetailDisclosure`.
  - **Errors wait for a submit or a change.** One rule for every field: a message shows once
    `isSubmitted`, or once the field was touched or dirtied (uploads and the pin go through
    `setValue(…, { shouldTouch, shouldDirty })`; custom fields keep their own `touched`). Nothing
    shows on open. `isValid` and the requiredness are unchanged. Field messages are `FormError`
    (red italic); the top summary and the line above the buttons are `FormMessage` Error.
  - **First open** is decided once, after the definitions settle and the first validation runs:
    the first section that needs attention, else the first. Manual toggles always win.
  - **Auto-advance** applies only to sections with required fields. When the youth's own change
    turns one from Needs attention to Done, it closes and the next not-Done section opens, with a
    scroll if its header isn't in view — but never while focus is inside it: the advance waits
    for `focusout`, then (after the pointer is up and a frame) runs only if focus landed outside
    every section card; focus in another card cancels it. A "Continue" button in the Done state
    covers focus stuck on a radio.
  - **Submit with errors** (`shouldFocusError: false`, `onInvalid`): every section with an error
    opens, then the first `[data-completion-error]` wrapper in document order scrolls to the
    centre and its first control takes focus (Upload button, "use your current location", the
    custom field's control, the textarea). The summary lists each error as a button that does
    the same for its field.
  - **Empty feedback counts as not given**: `""` becomes `null` in the schema, so typing and
    clearing no longer blocks Submit. The 500 maximum stays, with a live counter.
  - **Validator copy** is the shared rule set, so the editor and the filters get the new wording
    too; `getCustomFieldNumberError` takes an optional `title` for the field-named versions.
  - **Modal font, site-wide** (Jason): `CustomModal`'s portal root carries the `next/font`
    variables (`lib/fonts.ts`, shared with `_app`) and `#modal-root` joins the `#mainContent`
    font rule, so every dialog renders in Open Sans instead of the system font.
  - **Icons:** io5 only in the form; the 🎉 emoji is an `IoSparkles` badge that pops in and
    wiggles (`motion-safe`). `FileUpload` and `LocationPicker` gained `plain` for the card-less
    layout; the admin imports keep their grey cards.
  - **Upload your completion files** is outline green (Jason's pick over solid) in the tabbed
    header, and now also in the desktop sticky bar (outline button) and the mobile bottom bar (a
    link on its own line; the bar wraps and its spacer is measured).
  - **Departures from the spec:** `DetailDisclosure` got no `className` prop (the form wraps each
    card in its own `div` for the ref, `focusout` and `scroll-mt-4`); error visibility uses
    touched *or* dirty (dirty alone turns false again when an upload is removed).
- 2026-10-21 (Jason, round-3 fix round): **Keyboard auto-advance is Continue only.** Tab out of a
  Done section lands on the next card's header, which is "focus in another section" and cancels
  the pending advance; a keyboard user presses Continue (shown while a Done section is open and
  has something after it). Kept as is — Tab never collapses a section under the youth. The same
  rule now holds for a Done that arrives while the youth is already in another section (an upload
  finishing while they type in "Before you go"): `requestAdvance` drops it rather than closing
  Proof under them. Also this round: a Done section with nothing after it stays open and shows no
  Continue; open and close both wait on the body's `transitionend` (`afterSectionTransition`);
  "use your current location" sets the geometry (it only moved the marker before); custom-field
  inline errors show on change as well as blur, to match the header's live count; the custom-field
  labels point at their controls (`input_customfield_<key>`); the rating radios, the recommend
  toggle and the plain Upload buttons have accessible names; the outline-green pill is one
  constant, `BTN_OUTLINE_GREEN` beside `BTN_PRIMARY`; `PROOF_FIELDS` carries each upload's file
  rules and message noun, replacing the five zod blocks and the nested ternary.
- 2026-10-21 (Jason's fix list, developer): **Completion form and its dialogs.**
  - **"Maximum update depth exceeded" — cause and fix.** `FileUpload` called the parent's
    `onUploadComplete` from *inside* its `setFiles(prev => …)` updater once a TUS upload
    finished (and from the error path with a stale `data`). React runs updater functions while
    rendering the component — twice in StrictMode, and again whenever it rebases a queue — so
    the parent's `setValue` became a render-phase update of another component ("Cannot update a
    component (`OpportunityCompletionEdit`) while rendering a different component
    (`FileUpload`)"), and with several uploads finishing together the re-render → re-run →
    `setValue` cycle never settled: the tab's main thread hung, which is the loop React reports
    as the depth error. Reproduced on the Job fixture with three uploads at once; the earlier
    suspects (the mount `trigger()` effect, `setOpen`, `afterSectionTransition`) were checked and
    are not involved. Fix: the next list is computed from a `dataRef` of the last rendered
    state, `setFiles(next)` is queued, and `onUploadComplete(next)` runs after it, outside any
    updater. Clean after: the same three uploads leave the page responsive with no console error.
  - **The sticky bars show "Pending verification" when the completion is under review**, in the
    slot Upload uses (outline button on desktop, link line on phones), and open the pending
    dialog — the header's rule (`verificationStatus.status == "Pending"`, partner-managed label
    with the percentage) is now one `isPendingVerification` / `onPendingVerification` pair that
    the header card and both bars share.
  - **The "submitted" and "pending verification" dialogs are redesigned in the detail page's
    language**: a plain white sheet that rises in (`motion-safe:animate-[rise-in_…]`, static
    under reduced motion), the type's band tint behind an io5 icon in the type colour
    (`typeBandClass` + `typeOutlineClass`), a Nunito heading, a one-sentence body and "What
    happens next" / "What to expect" rows in the sections' tinted icon squares (`TONE`):
    verification (3–4 business days), the Passport credential and CV, and ZLTO only when the
    opportunity rewards it. Submitted has one primary button (Done). Pending explains that the
    submission can't be changed while under review, links to Yo-ID → Opportunities → Pending,
    and keeps the withdraw path (note + outline "Delete files") for the youth's own submissions
    only; partner-managed submissions keep their read-only wording and progress. The green
    header bar, the `IoMd*` icons and the hardcoded "3-4 business days" underline are gone.
- 2026-10-21 (design review round 1, developer — [review](../YOM-1283-ui-youth-opportunity-credential-display/design/2026-10-21-review-round1.md)
  §1, task 1, Q2): **The completion form wears the dialogs' chrome.** `DIALOG_BODY`, `DIALOG_CLOSE`,
  `DIALOG_ICON_CIRCLE`, `DIALOG_HEADING`, `DIALOG_EYEBROW`, `DIALOG_PRIMARY` and the new
  `DIALOG_SECONDARY` live in `components/Opportunity/dialog.ts`, shared by the form and the
  submitted / pending dialogs. The form's green strip and overlapping white circle are gone:
  ghost close, the type-tinted circle (`typeTint` from `OpportunityPublicDetails`, as the success
  dialog) holding `IoSparkles` with its pop and wiggle, a Nunito heading, a `text-gray-dark`
  body, and Close / Submit as outline / solid `rounded-full` pills. The modal is
  `md:max-h-[calc(100vh-3rem)]` so the sheet is inset at 900 px tall viewports.
  ~~Submit is disabled until something is given~~ — **reverted the same day, see below.**
- 2026-10-21 (Jason): **Submit is never disabled.** The disabled gate stopped the one thing the
  button is for on an empty form — jumping to the error summary and the first invalid field. It
  was also built on a wrong diagnosis: the 500 on `43480a94…` (and Jason's `f4573494…`) is the
  API's "manual verification enabled but opportunity has no mapped verification types" data
  inconsistency (local seed gap, noted for Adrian in the epic README), not an empty payload.
  The detail page now hides "Upload your completion files" when the opportunity has no
  verification types, matching the API's admin rule.
- 2026-10-22 (Jason's fix list, developer): **Completion dialogs — the shift on open, the icons,
  the per-field marks.**
  - **Layout shift on open — causes and fixes.** Three things moved, measured with a
    per-frame `getBoundingClientRect` recorder over the first ~700 ms (`cdp-tools/f22.mjs`,
    headless Chromium with classic scrollbars forced on, 10 px; shots in
    `cdp-tools/shots/2026-10-22-form/`; the reference opportunity `05476807…` now 404s, so
    `4e6869e2…` (Entrepreneurship, four proof types + 12 completion fields) stood in):
    1. The 2026-10-21 `rise-in` sat on the sheet's *body* (`DIALOG_BODY`, the form), which is
       `h-full` inside the `CustomModal` box — a box with `overflow-y-auto` and a fixed height
       (`inset-0` + `m-auto` + `max-h`). A transformed child counts towards scrollable overflow,
       so for the animation's 240 ms the box had 8 px of overflow and a scrollbar, and when the
       bar went the content reflowed — measured: `scrollHeight` 860 against `clientHeight` 852
       and `clientWidth` 690 → 700 at the end, the heading's x 401 → 406. The rise now runs on the box itself
       (`CustomModal animationStyle="rise"`, `--animate-rise-in`; fade-out on exit), which hangs
       in the non-scrolling `fixed inset-0` wrapper, and the three dialogs pass it. `DIALOG_BODY`
       and the form carry no animation.
    2. The form decided its first open section only after the mount `trigger()` resolved, so the
       Proof section eased open a tick after the sheet appeared — the biggest visible jump, on
       every platform. Proof is always required and always empty at mount, so with it present
       the decision is made in the initial state and it is open in the first paint; without it
       the decision still waits for the definitions.
    3. `useDisableBodyScroll` hid the root's overflow, which drops a classic scrollbar: the page
       widened by its width and everything behind the overlay shifted — measured: the main
       column 1430 → 1440 wide, the title, sticky panel and Upload button each 5 px to the
       right (overlay scrollbars — phones, macOS — measure 0 and never showed it). The hook now measures
       `innerWidth - clientWidth` and sets `--scrollbar-gap` on `<html>` while locked; `body`
       and `.scroll-lock-pad` (`globals.css`) keep it as right padding. The class is on the
       navbar's row, the opportunity page's sticky panel and the Yo-ID sticky bar; the mobile
       pin and bottom bar (`md:hidden`, overlay scrollbars) are left alone. The daisyUI drawer
       rule (`scrollbar-gutter: auto`) stays: a stable gutter would leave a page-coloured strip
       beside the overlay, which is the white-space bug that rule exists for.
       After: over open and close of all three dialogs, the main column, title, sticky panel,
       Upload button and every visible navbar item hold their rects; inside the sheet the box
       scroll geometry is constant and only the sheet's `top` moves, by the 8 px rise.
  - **Submitted dialog:** `IoBalloon` in `text-orange` on a `bg-orange-light` circle with a
    `ring-4 ring-current/20` in the type colour (`typeOutlineClass`) and a small `IoSparkles`
    in the type colour at the top right; the circle pops (`bounce-once`) and the sparkle wiggles
    twice, both `motion-safe:` only. Balloon over ribbon and sparkles: the one io5 glyph that
    reads as a party rather than an award or a shine.
  - **Upload dialog:** heading "Completed an opportunity?" (was "Well done for completing this
    opportunity!"); `IoTrophy` in the type colour on the type-tinted circle with an orange
    `IoSparkles` accent at the top right — the mirror of the Submitted circle, so the two read
    as one pair.
  - **Check / cross beside every required field** (`components/Opportunity/RequiredMark.tsx`):
    `IoCheckmarkCircle` `text-green` once the field has a value and no error, else
    `IoCloseCircle` — `text-gray-dark` "not yet" before a submit was tried, `text-pink` after —
    with `sr-only` "Required — done" / "Required — missing". On each proof upload and the pin
    (`FileUpload` / `LocationPicker` `mark`, plain mode) from the form's `proofGiven` + zod
    errors, and on each required custom field (`CustomFields` completion labels) from
    `getCustomFieldError` with `showErrors` as the after-submit switch. Optional fields keep
    "(optional)" and no icon. The section header's status line uses the same cross (grey → pink)
    in place of the yellow / red alert icon, so header and fields are one vocabulary.
    `text-gray` (#dce0e5) is a border grey and would vanish on white, hence `text-gray-dark`.
- 2026-10-22 (Jason's feedback on the above, round 2, developer):
  - **Trophy** (`OpportunityCompletionEdit`): `IoTrophy` is now `text-yellow`, like the rating
    stars, on the type-tinted circle; the orange sparkle accent stays.
  - **Required mark on the left, orange by default** (`RequiredMark`, `FileUpload` /
    `LocationPicker` plain labels, `CustomFields` completion labels): the mark sits before the
    label text, where the section header's "Needs attention" icon sits, so field and header line
    up. The not-yet cross is `text-orange` (visible without shouting) and turns `text-pink` after
    a failed submit; done stays the green check. The section status line (`StatusLine`) follows
    the same orange → pink.
  - **"Delete files" asks first** (`OpportunityPublicDetails` `onOpportunityCancel`): the shared
    `useConfirmationModalContext().showConfirmation` (the one `OpportunityActions` / `LinkActions`
    use, warning icon + "Delete files?" + what it destroys) runs before the existing delete
    path, which is otherwise unchanged; Cancel resolves `false` and leaves the pending dialog
    open. The partner-managed guard still short-circuits before the confirm.
  - Shots: `~/.cache/cdp-tools/shots/2026-10-22-form2/`.
- 2026-10-22 (Jason's todo, developer): **"Completed" chip says well done, with the date.**
  `OpportunityPublicDetails` `completedChip`: one renderer for the header card and — new, in
  the slot Upload / Pending verification already use (outline beside the actions on desktop,
  its own line in the mobile bottom bar) — both sticky bars, shown when the verification status
  is `Completed`. It wears the daisyUI `tooltip tooltip-secondary` wrapper the badges use,
  `data-tip` = `title` = `aria-label` = "Well done — you completed this on 14 Oct 2026"
  (`verificationStatus.dateCompleted`, already on the `MyOpportunityResponseVerify` response, so
  no extra request; `DATE_FORMAT_HUMAN`, date only per Jason). When the date is null or
  unparseable the copy is "Well done — you completed this opportunity". The chip gets
  `tabIndex={0}` so keyboard focus and a tap on touch both open the tooltip; `title` covers
  assistive tech. The tip sits to the **left** on md+ (`md:tooltip-left`): in the header the
  chip is at the card's right edge and a top tip clipped there; on mobile it stays on top.
  Shots: `~/.cache/cdp-tools/shots/2026-10-22-detail/` (1440 hover / focus / sticky hover,
  390 tap in the header and bottom bar).
- 2026-10-26 (Jason, Stage feedback): **The submit overlay covers the whole dialog.** The
  dialog box keeps a transform from its entry animation (computed `matrix(1, 0, 0, 1, 0, 0)`),
  which makes it the containing block for anything `position: fixed` inside it, so the
  "Loading…" overlay was pinned to the box's scrolled content: scrolled 435 px, it started at
  −411 px and stopped 48 px short of the bottom. `<Loading />` is now portalled to `<body>` from
  the completion form and the pending dialog (both only render it after a click, so `document`
  exists); on `<body>` it covers the viewport and sits above the dialog (z-50 over z-40).
- 2026-10-26 (Jason): **More colour on the upload and submitted dialogs.** Both use
  `CelebrationIcon`: a warm gradient circle (yellow → orange → pink) with a white ring, the icon
  in its own colour (yellow trophy / pink balloon) and confetti in the site colours around it;
  the circle pops and the sparkle wiggles, static under reduced motion. The type tint is gone
  from these two (the pending dialog keeps it), so `OpportunityCompletionEdit` loses `typeTint`.
- 2026-10-26 (Jason, second pass, experimental — may be removed): **Only the confetti moves.**
  The circle and the trophy / balloon stay still; the star and two confetti bits bounce
  (staggered 0 / 300 / 600 ms), the green square pulses and the sparkle wiggles, all looping and
  `motion-safe` only. The submitted dialog's Verification step now ends "We'll notify you once
  it's reviewed."
- 2026-10-26 (Jason): **Celebration icon animations removed** — supersedes the experimental entry
  above. The confetti, circle and icon are all static; the colours and shapes stay.
- 2026-10-30 (BA comment on YOM-1260, 2026-10-29): **every detail-page section starts open**,
  Additional details most of all; the youth closes what they are done with. The open state is now
  the set of sections the youth has *closed*, not opened, so a section that mounts later —
  Additional details waits for its custom-field definitions — starts open too. `defaultOpen` is
  gone (it only ever opened a Job's Skills). Tab taps and header-chip jumps still open their
  section if the youth had closed it.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1255](https://linear.app/didx/issue/YOM-1255)
- Depends on: [YOM-1254](https://linear.app/didx/issue/YOM-1254) (API) · [YOM-1264](https://linear.app/didx/issue/YOM-1264) (final definitions)
- Sibling: [YOM-1260](../YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/feature.md)
