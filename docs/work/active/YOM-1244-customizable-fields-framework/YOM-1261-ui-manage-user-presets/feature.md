# Feature: UI — Manage User Presets

## Meta

- **Feature**: Youth-managed Opportunity-discovery preferences
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1261](https://linear.app/didx/issue/YOM-1261)
- **Owner**: Jason
- **Areas**: web
- **Status**: in-progress — live on the preferences API (2026-09-29); DEV pass and BA list outstanding
- **Started**: 2026-08-27 (design); 2026-08-27 (implementation, behind the mock façade)

> Folder created 2026-08-27 to hold the design. Implementation started the same day **behind the
> mock façade** (see the build brief §6) — the blockers below still gate real persistence and the
> final preference list, not the UI build.

## Problem / Goal

Youth have no way to tell Yoma what they are looking for. Every visit starts from an unfiltered feed,
and the profile data we already hold (country, birth date) is not used to shape discovery. This
feature captures a small set of **search preferences** — a preset — and stores them as User-domain
data so discovery can inherit them.

Applying them is [YOM-1262](../YOM-1262-ui-apply-user-presets-to-opportunity-discovery/feature.md).
This ticket is capture and management only.

## Blockers

| Blocker | Note |
| --- | --- |
| [YOM-1264](https://linear.app/didx/issue/YOM-1264) (BA/design) | The preset list is not final. The design accommodates additions by construction — see Plan — but the field set cannot be signed off |
| ~~[YOM-1257](https://linear.app/didx/issue/YOM-1257) (api)~~ | **Resolved 2026-09-29** — `GET` / `PATCH /user/preferences` landed; the wizard is wired to it and the mock is gone |
| ~~[YOM-1258](https://linear.app/didx/issue/YOM-1258) (api)~~ | **Superseded by YOM-1262 (PM, 2026-09-30)** — discovery composes preferences into filters client-side; no API mapping will come |

~~Consequence for the build: preferences are mocked behind one façade.~~ Superseded 2026-09-29 —
see Decisions. The shape the wizard edits is still the web model in `api/models/userPreferences.ts`;
`api/services/userPreferencesLive.ts` is the one adapter to the API's shape.

## Out of Scope

- **Presets are User-domain data, not custom fields.** Do not build this through `CustomFields.tsx`,
  `CustomFieldFilters.tsx` or the CF models. Separate models, separate service, separate components.
  This is the epic's explicit rule, not a preference.
- Real persistence — mocked until YOM-1257 / YOM-1258 land.
- Applying presets to discovery, chip provenance, override behaviour — YOM-1262.
- Any AI ranking or weighting of preferences.

## Design

**Canvas**: `yoma-search-discovery.html`, page 1 (desktop + mobile, six steps, clickable) — held
**out of repo**; supplied to build sessions as PNG exports.
**Build brief**: `IMPLEMENTATION-PROMPT.md` — §6 (mock and mapping), §8 (the dialog), §9
(acceptance criteria) — held **out of repo**, pasted into the build session. Authoritative over
this summary for implementation detail.

A single dialog: a split panel with a fixed-width live result count on the left and a six-step
wizard on the right. Below `md` it collapses to a column with the count as a row above the wizard.

## Plan

### Data-driven by construction

`preferenceSteps.ts` is a typed array of steps; each step declares typed **blocks**; one
`<StepBlock kind=… />` maps kind → control. Block kinds: `cards`, `chips`, `rows`, `pills`,
`toggle`, `lookupSearch`, `readonly`.

Adding a preference must be a **data change with no new JSX**. This is the direct answer to the
YOM-1264 blocker: the field set is not final, so the surface is built so that the final set costs a
data edit.

Six steps cover the seven editable preferences: Goal · Interests · Skills · Time + Format ·
Language · Accessibility. (Pay was removed as a stored preference on 2026-08-31 — see Decisions;
it stays a session filter.)

### Preference shape (mock only)

```ts
type UserGoal = "job" | "learn" | "event" | "impact" | "biz";

type UserPreferences = {
  goal: UserGoal | null;                  // single-select
  targetCategories: string[];             // Opportunity Categories taxonomy
  selfReportedSkills: string[];           // EMSI skills lookup
  maxCommitment: { intervalId: string; count: number } | null;
  engagement: string | null;                    // proposed, unconfirmed
  languages: string[];                          // proposed, unconfirmed
  accessibility: { enabled: boolean; needs: string[] };  // opt-in, sensitive
};
```

Added to the user-profile shape **in the mock only**. No fields on the real `User` model, and no
writes to identity fields. The two proposed fields (engagement, languages) carry a code comment
marking them as awaiting BA sign-off.

### Identity fields are read, never written

The last step carries a **read-only** block for the four fields the mapping reads and never writes —
Country, date of birth, Gender, Education — each labelled with what it maps to. Preferences save to
a separate preset object; nothing in this dialog touches the profile or the YoID.

### Accessibility

Opt-in, off by default, never auto-applied from the profile. Never included in any outbound payload,
partner sync, credential, or analytics event — **including the mere fact that the filter is
enabled**. The UI states, before it is switched on, that enabling it excludes opportunities which
have not described their accommodations.

### Entry points

Opens automatically on the first visit to the discovery surface, then never again. Afterwards
reachable from the preference banner, the mobile sheet's preferences block, and the avatar menu.
Anonymous visitors get it too — answers held in session, with an offer to keep them at sign-in.

## Tasks

- [x] Design complete and reviewed — canvas page 1, desktop and mobile.
- [x] Build brief written and handed off.
- [x] Mock façade (`api/services/userPreferences.ts` + live + mock modules), YOM-1282 pattern.
- [x] `preferenceSteps.ts` registry + `<StepBlock>` switch — six steps, all seven editable
      preferences (pay removed 2026-08-31); adding one demonstrated as a data-only change (see
      the 2026-08-27-c handoff).
- [x] `PersonalizeDialog` with the fixed-340px live-count panel, floor state, read-only identity
      block, single-select goal with `COMING SOON` on `biz`.
- [x] First-visit auto-open + re-entry from the preference banner and the sheet's block.
- [x] Edit path seeds the wizard from stored preferences (mount-on-open contract, 2026-09-02);
      empty-state invites on both banners are the re-entry point after an unsaved dismiss.
- [ ] Browser pass of the manual test script — partially done by Jason (2026-08-31→09-02
      sessions were its findings); full §10 run outstanding. The 2026-09-03 additions (skills
      pairs, keep-answers offer, avatar entry) are implemented-but-unverified on screen.
- [x] Saved skills render as raw GUIDs when re-editing — fixed 2026-09-03: skills stored as
      `{id, name}` pairs (see Decisions). Confirmed working by Jason's browser pass same day.
- [x] Avatar-menu re-entry point — "My preferences" in the UserMenu drawer navigates to
      `/opportunities/discover?personalize=1`; the surface opens the wizard and strips the param.
- [x] Anonymous → sign-in "keep your answers" offer — `useAnonymousMigration` +
      `KeepAnswersPrompt`, merge through the façade, never a silent overwrite (see Decisions).
- [x] Location block in step 5 above Languages (2026-09-28; first built under Engagement in step 4) — profile country read-only (signed
      in) or a country picker (anonymous), then region / city through the shared
      `LocationInput`. The Country row left the identity block. Detail in YOM-1262's Decisions.
- [x] Real persistence (2026-09-29): wizard wired to `GET` / `PATCH /user/preferences`, the place
      to the full `PATCH /user`; mock, DEV allowance and dev pill removed (the 2026-08-27-c
      removal list is done). New preferences: incentive, accessibility requirements (+ Other
      description); engagement back to single-select. Signed-in local pass in the
      [epic handoff](../handoffs/2026-09-29-a.md).
- [ ] Signed-in pass on DEV once the branch API is deployed there (profile with no gender / DOB:
      the place save must report its failure; the preferences still save).
- [ ] **Blocked**: final preference list, pending YOM-1264.
- [ ] Confirm with the BA whether `Start a business` gets a filter mapping or stays inert.
- [ ] Confirm the privacy position on Gender before it appears in any visible filter UI.

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-08-27: **Goal is single-select and stays that way.** A youth selecting three goals gives no
  signal — the feed collapses back to "everything" and the most valuable question on the page is
  spent. Breadth belongs one step later at Interests, which is multi-select by design. If product
  asks for multiple goals, the answer is a ranked primary plus secondaries, which is a mapping
  decision rather than a UI toggle. The sub-heading says "One choice only" on screen so the
  constraint does not read as a defect.
- 2026-08-27: **`Attend events` added as a fifth goal.** The BA sheet mapped four goals to Job,
  Learning, Impact Task and one Category, which left `Event` reachable from no goal at all. A
  preference-driven feed built on that mapping could make every event on the platform structurally
  invisible to a personalised youth. `Attend events` → type `Event` closes it. `Other` remains
  unreachable from any goal; that gap is smaller — `Other` is a residual type rather than something
  a youth sets out to find — and is flagged rather than papered over.
- 2026-08-27: **`Start a business` ships visible and inert**, marked `COMING SOON`. It is the one
  goal with no agreed filter mapping. Modelled as `comingSoon: true` in the registry, not as a
  branch in the component, so it becomes the reusable pattern for every other preference the BA has
  not settled. Visible and inert beats quietly missing: the option stays in the conversation with
  the client instead of disappearing from the design.
- 2026-08-27: The live-count panel is `flex: 0 0 340px`. An earlier revision sized it to its content
  and it resized as the youth moved between steps, which read as the layout breaking.
- 2026-08-27: The count is floored — below a threshold it swaps to a "widen your feed" state rather
  than rendering a dead `0`, which would read as the preferences having broken the product.
- 2026-08-27: Preferences save to a **separate preset object**, never to identity or profile fields.
  Recorded here because the natural implementation — extending the profile — is the one the epic's
  out-of-scope rule forbids.
- 2026-08-27 (build): **Anonymous preferences live in the REAL service, not the mock.**
  `userPreferencesLive.ts` owns the `sessionStorage` path because session-held anonymous answers
  remain the design after the presets API lands; the mock delegates to it and adds only the
  signed-in fixture store. Signed-in scope throws loudly until YOM-1257 — a 404 against an
  invented endpoint would read as a bug.
- 2026-08-27 (build): The façade exports are typed `typeof real.X` so a drifting mock fails the
  build (the YOM-1282 rule, kept). Mocked/live is a per-session `localStorage` choice read per
  call, switchable from the preference banner.
- 2026-08-31 (revision): **`paidWork` removed as a stored preference** — dropped from the mock
  `UserPreferences` type, the wizard registry and the mapping; pay remains fully available as the
  "Paid & rewards" session filter. Step 5 is language-only, retitled "What languages work for
  you?" — the wizard is now six steps covering seven editable preferences. The live-count caption
  now reads "opportunities match your answers so far", an explicitly filtered total.
- 2026-09-03: **Skills are stored as `{id, name}` pairs, not bare ids.** The EMSI lookup is
  search-by-name only, so a stored bare id can never be resolved back to a label when the wizard
  re-edits a preset — chips rendered raw GUIDs. `UserPreferenceSkill { id, name }` carries the
  label with the value; `normalizeUserPreferences` runs every store read and **drops** legacy
  bare-id entries rather than keeping unresolvable GUID chips (mock-era data only). When the
  presets API lands (YOM-1257), the preset model should either store the pair or the API must
  return labels — flag for Adrian.
- 2026-09-03: **The sign-in "keep your answers" offer merges, never overwrites.**
  `useAnonymousMigration` (state/) + `KeepAnswersPrompt` (shared/): when a signed-in youth still
  holds session answers, one prompt offers keep/discard. Keep merges into the stored preset via
  `mergeUserPreferences` — multi-selects union, the session's answers win where both set a single
  value — through the façade only. Either choice marks personalization seen and clears the
  session store, which retires the offer; the wizard auto-open yields to a pending offer
  (tri-state `pendingAnonymous`, `undefined` while the store is being read).
- 2026-09-03: **The preferences mock is enabled on the DEV preview** — a deliberate departure
  from the local-only rule, so the team/client can preview the prototype while the presets API is
  built. Deployed images all bake `NEXT_PUBLIC_ENVIRONMENT=production` (one image, per-env
  runtime config), so DEV is recognised at runtime by hostname (`DEV_PREVIEW_HOSTS =
  ["dev.yoma.world"]` in the façade). Stage/production remain excluded. Add the host gate to the
  mock-removal list (2026-08-27-c) when YOM-1257/1258 land.

- 2026-09-05 (design-refinement round, committed separately from rounds 2–7):
  - **`yoma.discovery.personalizationSeen` moved to `localStorage` for both scopes.** On
    `sessionStorage` an anonymous visitor met the auto-opening wizard again in every new tab,
    which is the opposite of "once". Per device, like `yoma.discovery.viewMode` — and ONE marker
    across scopes, so signing in after dismissing the wizard does not spring it open a second
    time (the sign-in path a youth WITH answers takes is the keep-answers offer, which is
    unaffected).
  - **The mocked/live preferences switch left the preference banner** for a fixed dev-tools
    corner (`PreferencesMockDevTool`, collapsed to a small pill). A youth on the DEV preview was
    being told about an API that does not exist yet, inside their own content, in the same
    warning style the product uses for real warnings. The gate is unchanged
    (`USER_PREFERENCES_MOCK_ENABLED` — local or `DEV_PREVIEW_HOSTS`), so stage and production
    still mount nothing; add the component to the mock-removal list.
  - **Wizard copy**: step 4's "A ceiling, not a target — and how you'd like to take part." became
    "The most time you can give, and how you'd like to take part." (plain, second person, no
    metaphor), and its pills read "Up to an hour" — the article now follows the sound, in
    `upToIntervalLabel`, shared with the How-long filter section.
  - **The wizard's live-count panel states a failed count** ("Couldn't count matches right
    now — your answers still save") instead of shimmering forever, and its first-load placeholder
    block became the word "Counting…": one loading treatment across the surface.

- 2026-09-28: **The wizard captures the youth's location, in step 5 above Languages** (no new
  step; moved there from under Engagement in Jason's review, and the step reads "Where are you,
  and what languages work for you?"). Region / city / centroid are a preference saved through a separate user-location PATCH
  (API in development); country stays the global profile field, shown read-only when signed in
  and picked in the wizard only by an anonymous youth. The sign-in merge keeps an anonymous place
  only when it is in the profile's country. Full rule set, mocks and verification:
  [YOM-1262 feature doc](../YOM-1262-ui-apply-user-presets-to-opportunity-discovery/feature.md),
  Decisions 2026-09-28.

- 2026-09-29: **Wired to the real preferences API (YOM-1257); the mock is removed.** The wizard
  still edits the web model; `userPreferencesLive.ts` is the one adapter (contract: the
  [YOM-1257 handoff](../YOM-1257-api-extend-the-user-model-with-user-presets/handoffs/2026-09-28-a.md)).
  - **The place is a profile field**, not a preference: region / city / centroid are written with
    the full `PATCH /user` (every other profile field resent as freshly read, coordinates as
    `[longitude, latitude]`, `places` → `Lookup`). A failed place save — e.g. a profile missing a
    required field — keeps the dialog open and says the preferences saved but the place did not.
    The panel copy no longer claims the profile is untouched.
  - **Goals stay web keys** (`job` / `learn` / `event` / `impact` / `biz`) because `/user/goal` is
    authenticated and anonymous youth answer too; the adapter resolves them to the lookup by
    exact name ("Get a job" …). Never-saved preferences read back as `null`, so first-visit
    behaviour is unchanged.
  - **Engagement is single-select again** — the API stores one `engagementTypeId`. This reverses
    2026-09-22's BA-driven multi-select; the Engagement FILTER stays multi. Filed as an ask.
  - **New: incentive preference** (`incentivized`: Paid or rewarded / Unpaid / neither = no
    preference) in step 4 — the BA's Paid Work Preference, back as a stored preference.
  - **Accessibility is the real requirements list** (16 options + an Other description the
    wizard requires before Finish), replacing the toggle. Saved, **not applied** to the feed —
    see YOM-1262's Decisions for why.
  - **Skills are self-attested**: search needs 3+ letters (the API minimum), already-verified
    skills show "Already verified" and cannot be picked, and a skill verified since it was
    picked is dropped on save rather than failing it.
  - **Interests use the full category list when signed in** (`/opportunity/category`), so a
    stored interest with no published opportunity stays visible.
  - The save path finally reports failure — Finish shows the error and keeps the draft;
    "Make this my default" shows a one-line error.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1261](https://linear.app/didx/issue/YOM-1261)
- Pairs with: [YOM-1262](../YOM-1262-ui-apply-user-presets-to-opportunity-discovery/feature.md)
- Blocked by: [YOM-1264](https://linear.app/didx/issue/YOM-1264) · [YOM-1257](https://linear.app/didx/issue/YOM-1257) · [YOM-1258](https://linear.app/didx/issue/YOM-1258)
- Builds on: [YOM-1260](../YOM-1260-ui-custom-field-filtering-for-opportunities-and-completions/feature.md) (presets resolve to filter criteria)
- Mock pattern: [YOM-1282 handoff](../YOM-1282-ui-opportunity-credential-schema-selection/handoffs/2026-08-17-a.md)
- Design + brief: out of repo — see the [2026-08-27 handoff](../handoffs/2026-08-27-b.md), Deliverables
- Handoff: [`../handoffs/2026-08-27-b.md`](../handoffs/2026-08-27-b.md)
