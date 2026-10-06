# Detail header on mobile: title, organisation and logo (2026-10-06)

- **Input:** Jason's 2026-10-06 feedback on YOM-1262: "Detail page: opportunity title and
  organisation is too small on mobile and not truncating correctly (mobile - 320px). is there a
  way to wrap the titles around the image?" Also read: round-10 D1 in
  [`2026-10-02-tasks.md`](2026-10-02-tasks.md) (it set this header's shape), the `feature.md`
  Decisions to 2026-10-05, and [`../handoffs/2026-10-05-a.md`](../handoffs/2026-10-05-a.md).
- **Status:** approved by Jason on 2026-10-06 with every recommendation:
  1. **Stack.** Below 768 the logo moves into the type-chip row, rather than the title
     wrapping around it.
  2. **Four title lines on phones,** with "Show full title" / "Show less" only when text is
     hidden.
  3. **Title size:** 30 px from 390, 24 px below.
- **Surface:** the tabbed header card, `components/Opportunity/TabbedDetails/DetailHeaderCard.tsx`.
  Paths are relative to `src/web/src/`.
- **Base:** `6cdf18d8`. This file is unchanged in the working tree; the parallel developer is
  only editing discovery files.
- **Screens:** `~/.cache/cdp-tools/shots/2026-10-06-detail-header/` (machine-local). Taken on the
  local stack, signed out, with the consent prompt dismissed, at 320 × 640, 360 × 740 and
  390 × 844 (all 2x), plus 1440 × 900 and 768 × 1024 (1x).
  - `cur-*` files are the current build.
  - `sim-*` files are DOM simulations of this spec on the live page, not builds.
  - `cur-measure.json` holds the raw measurements.
- **Classic is untouched.** Every change is inside `DetailHeaderCard.tsx`, which only the tabbed
  layout renders. `OpportunityPublicDetails.tsx`, `OpportunityAdminInfo.tsx` and
  `opportunityTypeTheme.tsx` are not edited.
- **No new data and no new requests.** Everything below uses fields the page already has: the
  title, `organizationName`, `countries` and `organizationLogoURL`.
- **Behaviour:** one addition, a "Show full title" toggle (H3). Sections, facts, actions, the
  sticky bars and the kill-switch are unchanged.

## Samples

All of these are live in the local data. The 63 real imports (Jobberman, JobJack, Alison) are
the realistic titles. The seeded titles are random word lists with a median length of 70
characters, so they are a stress test, not a guide. The API allows titles of up to 150
characters (`OpportunityService.Title_MaxLength`).

| Key | Type | Title (length) | Organisation (length) |
| --- | --- | --- | --- |
| a | Job | "Midwife At Ghana Armed Forces Medical Services (gafms) ? Accra, Kumasi, …" (133, real, the longest) | Jobberman - Ghana (17) · Ghana |
| b | Learning | "Pharmacotherapy: Cardio, Respiratory, Gastro & Endocrine Systems" (64, real, one long word) | Alison (6) · Worldwide |
| h | Job | "Merchandiser Learnership - Pick n Pay The Grove - Smollan (Pretoria)" (68, real) | JobJack · South Africa |
| c | Entrepreneurship | seeded, 121 | "Stellar Innovations Prodigy Solutions Horizon Dynamics NextGen Enterprises 808988362" (84, the longest) · 3 countries |
| d · e · f | Event · Impact Action · Other | seeded, 119–120 | 42–64 |
| g | Impact Action | "Employ Strategy Training 650070874" (34, short) | Umuzi |

**Without a logo:** none of the 4051 searchable opportunities lacks a logo URL. The no-logo case
is simulated (`sim-cur-nologo-…`, `sim-rec-nologo-…`). Every local logo is the same placeholder
image.

---

## 1. Current

### Metrics

| | 320 | 360 | 390 | 1440 |
| --- | --- | --- | --- | --- |
| Card content width | 264 | 304 | 334 | 1200 |
| **Title column** (content less logo and gap) | **184** | **224** | **254** | 1100 |
| Title | Nunito 900, 24/30, tracking −1.2px, 2-line clamp | same | same | 32/40, 2-line clamp |
| **Title fully visible: real titles** | **21%** | 29% | 44% | 98% |
| Title fully visible: all titles | 1% | 1% | 3% | 99% |
| Organisation line | Open Sans 14px, name 600 black, capped at **60% = 110px**; countries 14px `text-gray-dark` | 134px cap | 152px cap | in the chip row, 1051px wide |
| Logo | 56 × 56 at the top right (x 228, y 20), image 38px | x 268 | x 298 | 76 × 76 at the top right, image 58px |

"Fully visible" was measured over every searchable title, laid out at each column width.

### What "not truncating correctly" is

There are four defects, all caused by the 184px column at 320. The logo (56px) and the gap
(24px) take 30% of the card's width.

1. **A long word is clipped mid-glyph, with no ellipsis.** At 24px, "Pharmacotherapy:" is 231px
   wide, so it overflows the 184px column and is cut at the column edge ("Pharmacotherap|"). It
   happens on a line that isn't the last, so there is no ellipsis
   (`cur-b-learning-pharma-320-card.png`). The title's `scrollWidth` exceeds its width on four of
   the seven samples at 320. "Transformation" (190px), "Internship" and "Opportunity" do the
   same.
2. **On the last line, the ellipsis lands inside the word** that doesn't fit: "Transformatio…"
   (`cur-e-impact-320-card.png`).
3. **About two words show.** "Midwife At / Ghana Armed…" is 22 of 133 characters
   (`cur-a-job-real133-320-card.png`). The full title appears nowhere else on a phone:
   - the breadcrumb truncates it;
   - the sticky panel that carries it is hidden on mobile.

   At 768 the same title is also cut at 2 of its 4 lines (`cur-a-job-real133-768-card.png`).
4. **The organisation name is cut while its line still has room.** The 60% cap in
   `OpportunityOrgCountriesRow` (`opportunityTypeTheme.tsx:278–283`) applies whether or not
   countries follow:
   - "Jobberman - … · Ghana" leaves a gap between the ellipsis and the dot;
   - "Summit Strat…", which has no countries, leaves 74px empty;
   - "Stellar Innova… · Anguilla…" has two ellipses on one 184px line
     (`cur-c-entre-longorg-320-card.png`).

**"Too small."** The title's glyphs are already 24px. What reads as small is the box: a 184px
measure holds about 10 characters per line, so a title shows as a stub. The organisation line is
14px, the body-small size.

### Current screens

- `cur-{a,b,c,d,e,f,g}-…-{320,360,390,1440}-card.png`
- `cur-{a,b,c}-…-{320,360,390,1440}-first-screen.png`
- `cur-{a,c}-…-768-card.png`

---

## 2. "Wrap the title around the image": is it feasible?

**Short answer:** a literal wrap and the line clamp exclude each other. The recommended layout
(A) gives the same result, a title that uses the full width under the logo, without the
conflict.

- **A float and a clamped title can't meet.** `line-clamp` needs `overflow: hidden`, which makes
  the title its own block formatting context. Beside a float, such a box shrinks to the space
  left over for its whole height; it doesn't flow underneath. In `sim-feas-float-clamp3-320.png`,
  every line stays 192px wide, even below the logo.
- **Unclamped, the wrap works,** but the 133-character title runs to 8 lines at 320 (240px)
  (`sim-feas-float-noclamp-320.png`).
- **The float inside the clamped title** works in this headless Chrome (154)
  (`sim-feas-floatInH4-clamp3-320.png`). It relies on how the engine treats a float inside a
  `-webkit-box`, which I can't verify on iOS Safari here. It also puts the logo inside the
  heading and moves it off the chip row. Not recommended.
- **The chip row is mostly empty below `md`.** Since round 10 the organisation line sits under
  the title, so the type chip is alone on its row. Moving the logo into that row frees the title
  from its first line: the same effect as a wrap, with no float.

| Option | Title width at 320 | Clamp possible | 320 card, sample a | Screens |
| --- | --- | --- | --- | --- |
| Today: logo column beside the title | 184px | yes | 304px, 22 characters visible | `cur-a-…-320-card` |
| **A. Stack (recommended):** the logo moves into the chip row; title and organisation run full width | 264px (+43%) | yes | 419px with 4 lines + toggle | `sim-rec-*` |
| B. Float right, title unclamped | 208px beside the logo, then 264px | no | 489px, 8 lines | `sim-alt-float-noclamp-*` |
| C. Float inside the clamped title | 264px after line 2 | Chromium only | 339px with 3 lines | `sim-feas-floatInH4-*` |
| D. Small inline logo (28px) before the organisation name; no logo top right | 264px | yes | 399px | `sim-alt-inline-*` |

**How the organisation line and chips flow:**

- **A and D:** the organisation line is full width under the title.
- **B:** the chips, the title's first lines and the organisation line sit left of the float until
  they pass its 56px; the fact strip is always full width.
- **Admin chips:** in A they wrap in the left cell beside the logo (`sim-rec-adminchips-…`); in B
  they wrap left of the float.

**Recommendation: A.** It is robust in every engine and keeps the clamp. It keeps D1's
"logo top-right", which matches desktop. It costs 24px for the chip row (48px against 24px
today), which D doesn't. Q1 asks Jason to choose.

---

## 3. Changes

Everything below is in `TabbedDetails/DetailHeaderCard.tsx`. Below `md` changes. From `md` up,
the card is pixel-identical to today, except for the toggle when a title is clamped (H3).

### H1: One grid; the logo joins the chip row below `md` (priority 1)

Replace the header grid (`DetailHeaderCard.tsx:167–202`) with a single grid whose placement
changes at `md`. The children, in DOM order:

| # | Element | Classes |
| --- | --- | --- |
| — | grid | `grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 md:grid-rows-[auto_auto_1fr] md:gap-x-6` |
| 1 | chip row, public | `flex min-w-0 items-center gap-2 self-center md:self-start`, holding the type chip and `hidden min-w-0 flex-1 md:block` with `OpportunityOrgCountriesRow` (as today) |
| 1 | chip row, with host chips (admin) | `flex min-w-0 flex-wrap items-center gap-2` (top-aligned, as today; the `flex-[1_1_12rem]` org wrapper is unchanged) |
| 2 | `LogoSquare` (:126–144) | `h-12 w-12 rounded-xl p-1.5 md:row-span-3 md:h-[76px] md:w-[76px] md:rounded-[20px] md:p-2`. Everything else is unchanged: border, `bg-white` / `bg-gray-light`, `IoMdPerson`. |
| 3 | title `h4` | H2 |
| 4 | toggle (only when clamped) | H3 |
| 5 | organisation line | H4 (`md:hidden`) |

How the grid places them:

- **Below `md`:** the chip row and the 48px logo share row 1, with the chip centred on the logo.
  The title, toggle and organisation line span both columns (`col-span-2`).
- **From `md`:** the logo spans rows 1–3 (`md:row-span-3`), top-right. The title and toggle sit in
  column 1.
- **`md:grid-rows-[auto_auto_1fr]`:** when the chip row plus the title is shorter than the 76px
  logo, the empty third row absorbs the difference. The title then sits exactly where it does
  today.
- **Spacing:** 12px from row 1 to the title (`mt-3`); 8px from the title or toggle to the
  organisation line (`mt-2`, 6px today).
- **Why 48px:** it matches the call to action, Save and Share (`h-12`) underneath. A 56px logo
  would add 8px to a row whose chip is 24px.

### H2: Title size, measure and clamp (priority 1)

`h4` classes:
`font-nunito col-span-2 mt-3 text-xl leading-tight font-black wrap-break-word text-black min-[390px]:text-2xl md:col-span-1 md:mt-2 md:text-[32px]`,
plus `line-clamp-4 md:line-clamp-2` while collapsed.

**Size steps:**

| Width | Size | Measure |
| --- | --- | --- |
| below 390 | `text-xl`, 24px: today's pixel value, as the token | 264px at 320, 304px at 360 |
| 390–767 | `text-2xl`, 30px | 334px at 390 |
| `md` and up | `text-[32px]`, unchanged | — |

- `leading-tight` (1.25) stays at every size, and the `h4` base tracking-tighter stays.
- **Why not 30px at 320:** "Entrepreneurship" is 278px and "Pharmacotherapy:" is 293px at
  30px. Both are wider than the 264px measure, so they would break mid-word. At 24px the widest
  sample word is 231px. From 390 the measure is 334px, and every sample word fits at 30px.
- **The clamp below `md` is 4 lines.** Measured in full width:

  | Real titles shown in full | 320 | 360 | 390 |
  | --- | --- | --- | --- |
  | 4 lines | 94% | 95% | 94% at 30px |
  | today | 21% | 29% | 44% |

  From `md` the clamp stays at 2 lines (98% of real titles at 1440).
- **`wrap-break-word`** is the safety net for a single word wider than the measure. Such a word
  breaks instead of being clipped (defect 1). No sample needs it at these sizes.

### H3: The full-title fallback, a "Show full title" toggle (priority 1)

This reuses `ClampedDescription`'s pattern and look (`ClampedDescription.tsx:29–38`, :86–100).

- **When it shows:** only when the clamp actually hides text. Measure the `h4` while collapsed,
  with a `ResizeObserver` on the `h4` and again when the title changes. It is clipping when
  `scrollHeight − clientHeight > lineHeight / 2`.
  - The half-line tolerance matters. Nunito's glyphs overhang a 1.2–1.25 line box, so a title
    of exactly 4 lines reports a few pixels of overflow. In the simulation at 390, samples h and b
    (exactly 4 lines) falsely showed the toggle without it (`sim-alt30-h-job-real68-390-card.png`).
  - Keep the toggle while open; re-measure on collapse.
- **Button:**
  `text-green col-span-2 mt-1 inline-flex items-center gap-1 justify-self-start py-0.5 text-sm font-semibold md:col-span-1`,
  with `type="button"`, `aria-expanded` and `aria-controls` set to the `h4`'s id.
  - "Show full title" with `IoChevronDown` (`h-4 w-4`) ↔ "Show less" with `IoChevronUp`.
  - `py-0.5` makes it 24px tall, the minimum touch target. `justify-self-start` keeps the empty
    rest of the row from toggling.
- **Open:** drop `line-clamp-4 md:line-clamp-2`. The title shows in full: sample a is 7 lines at
  320 (`sim-rec-expanded-a-job-real133-320-card.png`, card 509px).
- **Reset** to collapsed when `opportunity.id` changes, for client-side navigation between
  opportunities.
- **Where it shows:** at every width the clamp clips. On phones that is about 5% of real titles.
  At 768 it is sample a (2 of 4 lines). At 1440 it is about 1%.
- **Screen readers** already read the full title (`line-clamp` is visual only). The button is
  for sighted users and keyboard users.
- **Known trade-off:** the page is server-rendered and the measurement is client-side. For a
  clamped title, the toggle appears at hydration and moves what follows down by 24px.
  `ClampedDescription` has the same trade-off.

### H4: The organisation line below `md` (priority 2)

Below `md`, a header-local line replaces `OpportunityOrgCountriesRow` (:197–199). The shared row
stays as it is for classic, the legacy cards and this header from `md`.

```tsx
<p className="col-span-2 mt-2 line-clamp-2 text-base font-semibold wrap-break-word text-black md:hidden">
  {opportunity.organizationName}
  {countries && <span className="text-gray-dark text-sm font-normal"> · {countries}</span>}
</p>
```

- **Sizes:** the organisation name is `text-base` (16px, from 14px), 600, `text-black`. The
  countries are `text-sm` (14px), 400, `text-gray-dark`.
- **`countries`** is computed as `OpportunityOrgCountriesRow` does it (`opportunityTypeTheme.tsx:270–274`).
- **No 60% cap.** The line uses the full width and wraps to 2 lines, then ends in an ellipsis.
  - "Jobberman - Ghana · Ghana" and every real organisation fit on one line at 320.
  - The 84-character seeded name takes both lines, and its countries drop off. The Countries
    section still lists them.

### Admin info page and editor Preview

- **Admin** (`OpportunityAdminInfo.tsx:200–240`) passes host chips, so its chip row wraps
  top-aligned in the left cell beside the 48px logo. The rest is as public: the title, toggle,
  organisation line and fact strip. The stat strip, the views line and Manage (`children`) are
  unchanged. Simulated in `sim-rec-adminchips-c-entre-longorg-320-card.png`: Active · Visible ·
  Featured · ENTREPRENEURSHIP wrap onto 3 rows, with no overflow.
- **Editor Preview** (`pages/organisations/[id]/opportunities/[opportunityId]/index.tsx:4475`)
  renders the same card. The breakpoints follow the viewport:
  - on a phone it is the stacked layout;
  - on desktop it is today's `md` layout, in the editor's narrower column.

  The toggle works in the Preview. It is not an action, so "Buttons are inactive in preview."
  (`OpportunityPublicDetails.tsx:1208–1212`) doesn't cover it.

### Motion

None is added. A clamp cannot ease, so the toggle swaps instantly, and the chevron is swapped,
not rotated. There is nothing for `motion-reduce` to switch off.

---

## 4. Copy

| `file:line` | Current | New |
| --- | --- | --- |
| `TabbedDetails/DetailHeaderCard.tsx` (new, after the title) | — | Show full title |
| `TabbedDetails/DetailHeaderCard.tsx` (new, same button, open) | — | Show less (the wording of `ClampedDescription.tsx:93`) |
| `TabbedDetails/DetailHeaderCard.tsx` (H4 line) | " · {countries}" (`opportunityTypeTheme.tsx:284`) | unchanged: the same separator, now in the header's own line |

The lead expected no copy. The two toggle strings exist only if Jason keeps a clamp (Q2). With
"no clamp" there are none.

---

## 5. Acceptance checks

The tester runs these signed out. IDs change on reseed, so find samples a, b, c and h by title or
organisation through the API (`POST /api/v3/opportunity/search`). For all widths:

- `document.documentElement.scrollWidth` equals the viewport width;
- nothing in the card extends past its 20px padding (32px from `md`).

**320 × 640 (2x):**

1. **Row 1:** the type chip on the left, a 48 × 48 logo on the right (its left edge 236px from
   the card's left edge), with the chip vertically centred on the logo. In the no-logo case, a
   `bg-gray-light` square holds the person icon (cannot be tested locally).
2. **Title:** 264px wide, Nunito 900, 24px / 30px line, starting 12px below row 1.
3. **Sample a:** 4 lines ending in "…", then "Show full title ⌄" in green, 14px semibold.
   - Tapping it shows all 7 lines, and the button reads "Show less ⌃".
   - Tapping again returns to 4 lines.
4. **Sample b:** all 4 lines, every glyph visible ("Pharmacotherapy:" whole), and no toggle.
5. **Sample h:** 4 lines, no toggle. **Sample g:** 2 lines, no toggle.
6. **Organisation line, sample a:** "Jobberman - Ghana · Ghana" on one line, with no ellipsis. The
   name is 16px semibold black; "· Ghana" is 14px `text-gray-dark`.
7. **Organisation line, sample c:** 2 lines ending in "…".
8. **Call to action, sample a:** its bottom edge is within the first screen (≤ 640; 543 in the
   simulation).

**360 × 740 (2x):**

- The title is 304px wide at 24px.
- Sample a: 4 lines with the toggle (6 lines open).
- Sample h: 3 lines, no toggle.

**390 × 844 (2x):**

- The title is 334px wide at 30px (`text-2xl`), with a 37.5px line.
- Sample a: 4 lines with the toggle.
- Sample b: 4 lines, **no** toggle (this checks the H3 tolerance).
- Sample h: 4 lines, no toggle.

**1440 × 900:**

- Each sample's card matches its `cur-…-1440-card.png`:
  - the chip and "Org · Countries" on one line;
  - the 32px title clamped at 2 lines;
  - the 76px logo at the top right (x 1156, y 28 from the card);
  - the same title position (y 60).
- No sample shows the toggle (all fit 2 lines).

**768 × 1024:**

- Sample a is clamped at 2 lines with the toggle; open, it shows 4 lines.
- The toggle is reachable with Tab, Enter toggles it, and `aria-expanded` flips.

**Other checks:**

- **Reduced motion:** nothing animates, as before.
- **Client-side navigation** from an expanded sample a to another opportunity shows the new title
  clamped.
- **Signed in (only if approved):** the admin info page and the editor Preview at 320, following
  the H1 admin and Preview notes.

---

## 6. Departures from the round-10 decisions (D1)

| D1 said | This spec | Why |
| --- | --- | --- |
| Below `md`, the chip is alone above the title; the logo sits top-right in its own column | The logo moves into the chip row; the title spans the card | Jason's ask. The title's measure goes from 184 to 264px at 320 (+80px at every phone width). |
| Logo 56px below `md` | 48px (`h-12`) | It shares a row with a 24px chip, and matches the 48px buttons below |
| Title `text-[24px] md:text-[32px] line-clamp-2` | `text-xl` (the same 24px) → `min-[390px]:text-2xl` (30px) → `md:text-[32px]`; `line-clamp-4` below `md`, 2 from `md`; `wrap-break-word` | 2 lines in 184px showed 21% of real titles in full; 4 lines in full width show 94–95% |
| No way to read a clamped title | The "Show full title" toggle (new interaction, at every width) | Fallback for the titles the clamp still hides, including at 768 |
| Below `md`, the organisation row is the shared `OpportunityOrgCountriesRow` | A header-local line: 16px name, no 60% cap, 2 lines | The shared row is also used by classic and the legacy cards, so it can't change. Its cap cut names while the line had room. |

---

## 7. Open questions for Jason

1. **Wrap or stack?** I recommend **A, the stack**: the logo moves up beside the type chip, and
   the title and organisation run the card's full width.
   - A literal wrap (B) only works with no line limit on the title. Then the longest real title
     is 8 lines at 320.
   - The small inline logo beside the organisation name (D) is the most compact: 20px shorter at
     320. It shrinks the logo to 28px and differs from desktop.
2. **How many title lines on phones?** I recommend **4, with "Show full title"**. 94–95% of real
   titles show in full.
   - 3 lines saves 30px, but only 79% show in full at 320.
   - No limit needs no toggle or new copy. A 150-character title then takes 7–8 lines, and
     the call to action can drop below a 320 × 640 screen.
3. **Title size from 390?** I recommend **30px (`text-2xl`) from 390, 24px (`text-xl`) below
   it**. At 390, 30px loses almost nothing (94% of real titles in 4 lines against 95% at 24px).
   - Below 390, 30px would break words like "Entrepreneurship", so it isn't offered there.
   - The alternative is 24px on every phone.

---

## Seen, not changed

- **`OpportunityOrgCountriesRow` caps the organisation name at 60% even without countries**
  (`opportunityTypeTheme.tsx:279`). It is shared with classic, the legacy cards
  (`OpportunityPublicSmall.tsx:143, 200, 255`) and the classic admin `info.tsx:259`, so it is left
  alone. H4 sidesteps it in this header below `md`.
- **The desktop sticky panel truncates the title to one line**
  (`OpportunityDetailSections.tsx:879–881`). It is unchanged and was not part of the feedback.

## Not seen

- **The admin info page and the editor Preview:** they need a sign-in, which was not approved
  for this task. The admin chip row is simulated only.
- **An opportunity without a logo:** none exists locally. Simulated.
- **iOS Safari:** only headless Chrome is available. This is why option C is not recommended.
- **Real logo shapes in the 48px square:** every local logo is the same placeholder.
