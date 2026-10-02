# Round 10 follow-ups — welcome fit, welcome → step 1 motion, section notes (2026-10-02)

- **Input:** Jason's three follow-ups after reviewing round 10 (relayed by the lead), plus the
  developer's welcome measurements from the anon browser on the current build (quoted in F1).
- **Who wins:** the feature's Decisions (including 2026-10-02 round 10), then this file. Each
  departure is listed under its task and waits on Jason.
- **Line numbers** are from the uncommitted round-10 working tree on `31dabdbc`. Paths are
  relative to `src/web/src/`.
- **No browser was run for this spec** (the developer held the only throwaway slot). It is built
  from the code, the existing screenshots under `~/.cache/cdp-tools/shots/` and the developer's
  numbers.
- **Jason's answers (2026-10-02): every recommendation in this file is approved.**
  - F1: the welcome takes its content's height, on md too.
  - F2: the height may animate in Chromium only.
  - F3: a plain line with no icon, and all nine strings as written.
  - **F4 is added:** when the welcome opens, focus moves to Get started, so keyboard users start
    inside it. Before this, Tab started in the page behind it.
- **Behaviour is unchanged in all three tasks:** the same sections, conditions, filters,
  actions and step order. The classic detail layout and the `CUSTOM_FIELDS_ENABLED=false` path
  are not touched. F1 and F2 live in discovery, and F3's files are tabbed-only (tasks file, 0.1).

---

## F1 — The desktop welcome never scrolls (down to 560px tall)

### Current

- **Screens:**
  - `2026-10-02-r10-after-welcome/dev-round2/welcome-1440x900.png`: the bands;
  - `…/dev-round2/welcome-1280x720.png`;
  - `…/dev-round2/welcome-1024x560-scrolled.png`: it scrolls;
  - `…/dev-round2/welcome-768x1024.png` and `-scrolled-to-end.png`: md;
  - `2026-10-02-r10-after-welcome/welcome-390x844.png` and `welcome-390x667.png`.
- **The developer's measurements.** These are the inner scroller's overflow:

  | Width | Viewport | Overflow |
  | --- | --- | --- |
  | lg | 1366×657, 1536×730, 1280×610, 1440×789, 1920×969, 1280×800 | 0 |
  | lg | **1280×577** | **19px** |
  | lg, ≥ 1104 wide | below about 596 tall | scrolls |
  | lg, 1024–1103 wide (the tip wraps to 3 lines) | below about 616 tall | scrolls |
  | md (768–1023) | any; for example 960×900 has 683 of content in a 513 box | **always, about 170px** |
  | Mobile | 390×844 | 0 |
  | Mobile | 390×740 | 90 |

- **What's wrong.**
  - **The box is a fixed height.** It is always `min(600px, 100vh − 64px)` (`PersonalizeDialog.tsx:162`).
    The content needs about 532px, so a tall window gets dead bands. The left column centres
    68px of slack (34 / 34) on top of its 40px padding. The panel floats its content 86px from
    its top and bottom edges.
  - **A short window gets no compression at all.** From about 596px tall (616px at 1024–1100
    wide) the content scrolls, even though about 70px of the box is empty space.
  - **md always scrolls,** because a one-column layout of about 770px (683 plus the 87px
    pinned footer) sits in the 600px box.

### Changes

**1. The box takes its content's height, from md up.** This departs from a Decision; see below.

- In the welcome frame (`PersonalizeDialog.tsx:162`; in F2 it becomes the persistent frame),
  replace `md:h-[min(600px,calc(100vh-64px))]` with `md:h-auto md:max-h-[calc(100vh-64px)]`.
- The cap must reach the scroller. A percentage height does not resolve against a `max-height`,
  so the chain must be flex `min-h-0` all the way down:
  - the frame is `flex flex-col`;
  - the `WelcomeStep` root (`WelcomeStep.tsx:142`) changes `h-full` to `min-h-0 grow`;
  - the scroller (:157) keeps `min-h-0 grow overflow-y-auto`.
- `overflow-y-auto` stays as the safety net, so nothing is ever clipped.
- Below md nothing changes: the frame stays `h-full w-full`, full screen.
- **Result at 1440 × 900:** 1072 × 532, centred.
  - The left column has no slack. The badge sits 40px under the top edge, and Get started
    sits 40px above the bottom edge.
  - The panel stretches to the left column's 452px and keeps `lg:justify-center`
    (WelcomeStep.tsx:223). Its content is now about 51px from its top and bottom edges (24px of
    padding plus 27px of slack), down from 86px.

**2. Two height tiers from lg.** Both use arbitrary variants stacked after `lg:`:

- **T1 = `lg:[@media(max-height:680px)]:`** compresses whitespace only.
- **T2 = `lg:[@media(max-height:600px)]:`** compresses sizes.

| Element | Where | Today (lg) | T1, ≤ 680px tall | T2, ≤ 600px tall |
| --- | --- | --- | --- | --- |
| Frame cap | `PersonalizeDialog.tsx:162` | `100vh − 64px` | `max-h-[calc(100vh-32px)]` (16px above and below: the dialog's own `md:p-4`) | (T1's) |
| Scroller padding, top and bottom | `WelcomeStep.tsx:157` | `lg:pt-10 lg:pb-10` (40) | `pt-8 pb-8` (32). The sides stay 48 / 40 | — |
| Left column gaps: badge → block, and the 3 inside the block | :163, :173 | `gap-4` (16) | `gap-3` (12) | — |
| Count | :51 | `lg:text-[104px]` | — | `text-[84px]` (the `text-7xl` size; `leading-none` stays) |
| Gold line | :192 | `lg:text-[34px]`, 2 × 42.5 | — | `text-[28px]`, 2 × 35 |
| Tip | :206 | `p-4` | — | `py-3` (12; the sides stay 16, the text stays 14px) |
| Get started | :113 | `min-h-[54px]` | — | `min-h-12` (48; it is still ≥ 44 touch, and the 6px halo ring stays) |
| Panel gaps | :223 | `gap-4` (16) | `gap-3` (12) | — |
| Panel padding | :223 | `lg:p-6` (24) | — | `p-5` (20) |
| Type tiles | :241 | `lg:h-[76px]` | — | `h-[66px]` (the mobile size; the 32px icon square and 13px label stay) |
| Panel's vertical centring | :223 | `lg:justify-center` | kept | kept: it absorbs the difference between the columns |

Unchanged at every height: the badge, the LIVE label, the body copy (16px), "Browse on my own",
the pill sizes and the 2-column quick-search grid.

**Rules the developer must keep:**

- **No property is set by both tiers.** The ranges overlap (≤ 600 is also ≤ 680), and Tailwind
  does not guarantee which of two arbitrary media variants comes later in the CSS. So T1 owns
  the cap, the scroller padding and the gaps. T2 owns the sizes and the panel padding.
- **The tier classes must win over the plain `lg:` value.** Tailwind sorts arbitrary variants
  after named ones, so a stacked `lg:[@media…]:` class lands later. The tester checks the
  computed values below, which catches it if not.
- **The bottom padding stays ≥ 24px.** Get started's halo swells to 12px, and the entrance
  `rise-in` moves items 8px. Neither may add a scroll during the opening animation.

**Budget.** It uses the developer's numbers. "Wide" is ≥ 1104px wide; "narrow" is 1024–1103,
where the tip is 3 lines. "5–6 pills" covers a known country or point ("Jobs in …" / "Jobs near
me"), which adds a third pill row of +50.

| | Today | T1 | T2 |
| --- | --- | --- | --- |
| Left column, wide / narrow | 452 / 472 | 436 / 456 | 387 / 407 |
| Panel, 4 pills / 5–6 pills | 398 / 448 | 390 / 440 | 362 / 412 |
| Box = scroller padding + the taller column | 80 + 452 = **532** (narrow 552) | 64 + 456 = **≤ 520** | 64 + 412 = **≤ 476** |
| Cap | H − 64 | H − 32 | H − 32 |
| Fits from a viewport height of | 596 / 616 | 532–552 | 483–508 |
| Spare at the tier's lowest height, worst case | 681 tall: 617 − 552 = **65** | 601 tall: 569 − 520 = **49** | 560 tall: 528 − 476 = **52** |

The rule therefore holds with at least 49px to spare at every height from 560px up, at any
width ≥ 1024 and with up to six quick searches. Below about 500px tall, the scroller's safety
net scrolls.

**If a size still overflows**, add these in order. Each is T2-only, so it doesn't break the
one-tier-per-property rule:

1. body `text-[15px]` (−4);
2. gold line `leading-[1.15]` (−6);
3. count `text-[76px]` (−8).

**md (768–1023):** the frame takes its content's height (change 1), with no tiers. It fits a
window about 834px or taller (770 + 64). That covers 768 × 1024 and 960 × 900, which scrolls 170px
today. Shorter windows scroll with the buttons pinned, as today (W1 / W8).

**Mobile (< 768):** unchanged. It fits 390 × 844; on shorter screens the content scrolls and
the buttons stay pinned. The developer measured it as fitting from about 830px tall.

**Motion:** none added. The tier changes take effect on resize.

### Copy

None.

### Acceptance checks (signed out)

- **Every lg size below:** `scrollHeight <= clientHeight` on the scroller (`WelcomeStep.tsx:157`).
  The frame's rectangle sits inside the viewport with at least 16px of margin.
  - **≥ 681 tall** (the T1 margin starts at 680): 1440 × 900, 1920 × 969, 1536 × 730, 1280 × 800.
  - **T1:** 1366 × 657, 1280 × 610, 1024 × 640.
  - **T2:** 1280 × 577, 1280 × 600, 1440 × 560, 1100 × 560, 1024 × 560.
- **Computed values, read with `getComputedStyle`:**

  | Size | Count | Gold line | Scroller padding-top | Left gap | Tile | Get started | Panel padding |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | 1440 × 900 | 104 | 34 | 40 | 16 | 76 | 54 | 24 |
  | 1366 × 657 | 104 | 34 | 32 | 12 | 76 | 54 | 24 |
  | 1440 × 560 | 84 | 28 | 32 | 12 | 66 | 48 | 20 |

- **1440 × 900:**
  - the frame is 1072 × 532 ±2;
  - the badge's top is 40 ±1 below the scroller's top;
  - Get started's bottom is 40 ±1 above the scroller's bottom;
  - the panel's content starts and ends about 51px from the panel's edges.
- **Five pills, signed out:** open `/opportunities/discover?pt=-33.92,18.42`
  (`urlCodec.ts:101`, `parsePoint`), so "Jobs near me" joins. Then open the welcome. At
  1440 × 560 and 1024 × 560 nothing scrolls, and the fifth pill spans both columns.
- **md:** at 960 × 900 and 768 × 1024 nothing scrolls. At 960 × 700 the content scrolls and the
  footer buttons stay pinned.
- **390 × 844:** nothing scrolls, as today. At 390 × 740 and 390 × 667 the content scrolls and
  the buttons stay pinned.
- **Reduced motion:** layout identical to the above.

### Departures and decisions

- **D-F1a: content height instead of "1072 × 600 at lg"** (Decision 2026-10-02, round 10, and W1).
  - **Why:** the fixed 600 is what makes the dead bands Jason calls out. No fixed height can be
    both tight and safe, because the content runs 532–552 depending on width and pill count.
  - **Superseded:** W1's acceptance check "1280 × 720: 1072 × 600 with ≥ 60px to spare".
- **D-F1b: md is content-sized too.** W1 boxed md at 600 and let it scroll. Content height lets
  tablets and narrow desktop windows from about 834px tall show it whole. It stays one column;
  W1's reason for that (two columns don't fit under 1024) still holds.

---

## F2 — Welcome → step 1: fade through, and morph the box

### Current

- **Screens:** `2026-10-02-r10-after-welcome/welcome-1440.png` →
  `2026-10-02-r10-after-welcome/behaviour-getstarted-1440.png`.
- **What's wrong.**
  - Get started (`WelcomeStep.tsx:112` → `PersonalizeDialog.tsx:166`, `setWelcome(false)`)
    renders a different wrapper element (`:161` / `:174`). So the purple 1072 × 600 box cuts
    to the white-and-purple 896 × 736 split in one frame.
  - No motion is possible, because nothing persists between the two.
  - Focus is lost: the focused button unmounts, so keyboard focus drops to `<body>`, and the
    next Tab starts from the page behind the dialog.

### Changes

**1. One persistent frame.** Merge the two wrappers (`PersonalizeDialog.tsx:162` and `:175`) into
one element whose classes switch with `welcome`. Its children swap as today.

```tsx
const frame = welcome
  ? "bg-purple md:h-auto md:max-h-[calc(100vh-64px)] md:max-w-[1072px] lg:[@media(max-height:680px)]:max-h-[calc(100vh-32px)]" // F1
  : "bg-white md:h-[min(85vh,46rem)] md:max-w-4xl md:flex-row"; // today's wizard frame
const morph = cameFromWelcome
  ? "[interpolate-size:allow-keywords] transition-[max-width,height,background-color] duration-300 ease-in-out motion-reduce:transition-none"
  : "";
// className: `flex h-full w-full flex-col overflow-hidden md:rounded-2xl ${frame} ${morph}`
```

- **The frame carries the purple while the welcome fades,** so the backdrop never shows through.
  `WelcomeStep`'s root keeps its own `bg-purple`, which is harmless.
- **`cameFromWelcome`** is new state, set to `true` by Get started and never reset while the
  dialog is mounted. A wizard opened directly (preferences exist) gets no transition and no
  entrance animation, exactly as today.

**2. The timeline (motion-safe).**

| t (ms) | What moves | Classes (existing keyframes only: `globals.css` `fade-out` :119, `fade-in` :111, `rise-in` :325) |
| --- | --- | --- |
| 0 | Get started is pressed. The welcome's content fades out; the purple box holds its size. The welcome turns `inert`, so nothing in it can be pressed twice. | `WelcomeStep` root (:142): its entrance classes swap for `animate-[fade-out_100ms_ease-in_both]` while a new `leaving` prop is true. |
| 100 | `welcome` becomes false and step 1 renders: the same state change as today, 100ms later. The box eases 1072 × 532 → 896 × 736 (at 1440 × 900), and its fill eases purple → white. | the frame's `morph` above (300ms, `ease-in-out`) |
| 160 | The count panel's text fades in. The panel's purple is opaque from 100ms, so the left 340px stays purple throughout. | `LiveCountPanel` gets an additive `className` prop on its root (`LiveCountPanel.tsx:58`): `*:motion-safe:animate-[fade-in_200ms_ease-out_60ms_both]` (its two children only, never the purple root) |
| 160 | Step 1's column rises 8px and fades in over the whitening fill. | the column (`PersonalizeDialog.tsx:181`): `motion-safe:animate-[rise-in_240ms_ease-out_60ms_both]`, only when `cameFromWelcome` |
| 400 | Everything has settled. | — |

- **Mechanics.**
  - Get started sets `cameFromWelcome` and `leaving`, then a 100ms `setTimeout` calls
    `setWelcome(false)`. Clear the timer on unmount, because Escape, Back or × during the
    fade still close the dialog as today.
  - Read reduced motion at click time with the same query `useCountUp` uses
    (`state/useCountUp.ts:18`).
- **Reflow.** The column's text reflows while the box narrows. It is below about 50% opacity
  for the first ~120ms of the morph, which hides the reflow.
- **Other browsers.** The height eases where `interpolate-size` is supported (Chromium 129+).
  Elsewhere the height switches at 100ms, while the box is an empty purple, and the width
  (`max-width`) still eases (Q2).
- **Below md** there is no size change (both modes are full screen). The fade-out, the purple →
  white fill, the count row's text fade and the column's rise run as above.

**3. Reduced motion.**

- There is no exit phase and no timer: `setWelcome(false)` runs at once.
- The frame is `motion-reduce:transition-none`, so its size and fill switch instantly.
- One 150ms opacity fade, shared by the column (`motion-reduce:animate-[fade-in_150ms_ease-out_both]`)
  and the count panel's children (`*:motion-reduce:animate-[fade-in_150ms_ease-out_both]`).
- Nothing translates.

**4. Focus.**

- Step 1's heading (`PersonalizeDialog.tsx:202`, `{current.title}`) gets a `ref`, `tabIndex={-1}`
  and `outline-none`. It is not interactive, so it needs no ring.
- An effect focuses it once, with `focus({ preventScroll: true })`, when `welcome` turns false
  and `cameFromWelcome` is true. With motion that is at 100ms; with reduced motion it is
  immediate.
- A screen reader announces the step title. The next Tab reaches step 1's first control.
- Continue and Back keep today's focus behaviour.

### Copy

None.

### Acceptance checks (signed out)

- **1440 × 900:**
  - press Get started (with `a click`);
  - about 50ms after the click, the welcome's opacity is below 1 and the frame is still 1072 wide;
  - about 250ms after, the frame's width is strictly between 896 and 1072 (Chromium);
  - at 450ms the frame is 896 × 736, and the step reads "Step 1 of 6";
  - `document.activeElement` is the h1 "What brings you to Yoma?";
  - in no capture is the box transparent or the backdrop visible through it;
  - `getComputedStyle(frame).transitionDuration` reads `0.3s`.
- **Keyboard, 1440:**
  - focus Get started and press Enter;
  - the h1 is focused, and Tab lands on the first goal card ("Get a job");
  - Escape pressed during the 100ms fade closes the dialog, with no console error and no
    flash of step 1.
- **390 × 844:** no size change. The screen fades from purple to white, except the count row.
  The h1 is focused.
- **Reduced motion, 1440 and 390:** step 1 appears at once with a single 150ms fade. Nothing
  moves or resizes in steps. The h1 is focused.
- **Behaviour:**
  - the count carries over unchanged;
  - Back is disabled on step 1, and Skip and Continue work;
  - finishing, then reopening the dialog from "Personalize my feed", opens the wizard with no
    entrance animation, as today;
  - Browse on my own, a type tile and a quick search behave as today (they never enter the
    exit phase).

### Departures and decisions

- **D-F2a: Get started's effect lands 100ms later.** The steps and the outcome are unchanged.
- **D-F2b: the frame persists, and it owns the fill colour.** Today `WelcomeStep` and the wizard
  wrapper each own theirs.
- **Out of scope, but it affects keyboard users:**
  - The welcome is non-modal by design (2026-09-03), so Tab still reaches it only after the
    page behind it (handoff 2026-10-02-b, Gotchas).
  - F2 makes the *second* half right (Get started → step 1).
  - Recommendation: a follow-up that focuses Get started when the welcome opens.

---

## F3 — A short note above the chips of an open section (tabbed layout only)

### Current

- **Screens:**
  - `2026-10-02-r10-after-detail/designer/08-detail-job-1440-sections-open.png`;
  - `…/designer/08-detail-job-390-sections-open.png`;
  - `…/tester-round2/job-1440-all-open.png`;
  - `…/tester-round2/job-390-open.png`.
- **What's wrong.**
  - An open card shows the title, a count and the chips, with nothing to say what the list
    means for the youth. Is "Countries · 1 South Africa" where it happens, or who may join?
    Does "Targeted groups" exclude me?
  - Today the closed card's grey preview line sits under the title. Opening the card hides it,
    leaving 36px of empty space between the title and the chips (the icon square's height plus
    the row's 18px).

### Changes

**Which sections get a note.** These are the tabbed sections whose open body is a chip list,
from `OpportunityDetailSections.tsx`:

| Section | Defined at | Body | Note |
| --- | --- | --- | --- |
| Incentive | :314 (title :319) | `ChipList` ("Yes", "ZLTO", "150 USD") | yes |
| Skills required (Job) / Skills you will learn (others) | :356 (title :361) | `ChipList` | yes, one note per title |
| Languages | :373 (title :378) | `ChipList` | yes |
| Accessibility | :406 (title :411) | "Support: …" line + `ChipList` of accommodations + the Other description | **only when accommodations exist**, so only when chips render |
| Targeted groups | :435 (title :440) | `ChipList` | yes |
| Countries | :455 (title :460) | `ChipList` | yes |
| Global goals (SDGs) | :471 (title :476) | `ChipList` | yes |
| Topics | :487 (title :492) | `ChipList` | yes |
| Time needed | :333 (title :338) | text, already explained ("It's only a guide — go at your own pace.") | no |
| Age range | :387 (title :392) | static row, nothing to open | no |
| Additional details | :508 (title :513) | `CustomFieldsView` labelled rows ("Industry: …"), not chips | no |
| Provider card | :706–719 | a name, not a disclosure | no |

**Build.**

- `SectionDef` (:90–104) gains `note?: string | null`, set per section (the copy table below).
  - Accessibility: `note: accommodations.length > 0 ? "…" : null`.
  - Skills: the note follows `isJob`, as its title does.
- `DetailDisclosure` (`DetailDisclosure.tsx:12–32`) gains `note?: string | null`, passed at
  `OpportunityDetailSections.tsx:721–733` (`note={s.note}`).
- **Where it renders: the preview's slot.** That is inside the heading's text column, right after
  the title (`DetailDisclosure.tsx:77–81`). Closed, the slot shows the preview, as today. Open,
  it shows the note:

  ```tsx
  {open && note && (
    <span className="text-gray-dark mt-0.5 block text-[13px] leading-snug motion-safe:animate-[fade-in_220ms_ease-out_both]">
      {note}
    </span>
  )}
  ```

- **Style:** the filter panel's expanded hint, reused: `text-gray-dark text-[13px] leading-snug`
  (`features/discovery/components/Filters/SectionHeader.tsx:100–103` and
  `FilterSection.tsx:84–88`). It is the same idea already in use: a grey line that appears
  only while a section is expanded, above its controls.
  - It has no icon (Q3). The card already leads with its tinted icon square, a second icon on
    up to eight cards is noise, and an icon would push the note off the title's left edge.
  - It wraps; it is never truncated, unlike the preview.
- **Spacing:**
  - The note is 2px under the title (`mt-0.5`) and starts at the title's left edge (74px into the
    card from md; under the title, not at the card's edge, at 390).
  - The chips start 18px below the note's last line: the row's existing `py-[18px]` bottom,
    unchanged.
  - The "Show all N" link stays where it is, inline at the end of the chip row
    (`DetailDisclosure.tsx:161–171`, `text-green text-xs font-semibold`), so it is also 18px
    below the note. It never sits above it or beside it.
  - With a one-line note the header grows from 76px to about 78px. At 390 a two-line note adds
    about 18px when the card opens. The title doesn't move, because the row is top-aligned.
- **Motion:** the note fades in over 220ms, the same time as the body's `grid-template-rows`
  ease. It vanishes instantly on close, as the preview does today. Under reduced motion it
  appears with no fade (`motion-safe:` only), matching the instant body.
- **Where it shows:** every tabbed host, because the section set is shared. That is the public
  page, the admin `…/info` page and the editor's Preview, which must match public. The classic
  layout is untouched; it never imports these files.

### Copy

There is no i18n; these are the exact strings. Each sits on the section's `SectionDef` in
`components/Opportunity/TabbedDetails/OpportunityDetailSections.tsx`:

| `file:line` (title) | Current | New `note` |
| --- | --- | --- |
| :319 Incentive | — | What you could get for taking part. |
| :361 Skills required (Job) | — | Skills this job asks for. Mention the ones you have when you apply. |
| :361 Skills you will learn | — | Skills you'll build by completing this. They're added to your YoID. |
| :378 Languages | — | The languages you can take part in. |
| :411 Accessibility (with accommodations) | — | What this opportunity offers people with disabilities. |
| :440 Targeted groups | — | Who this is aimed at. It doesn't limit who can take part. |
| :460 Countries | — | Where this opportunity is available. |
| :476 Global goals (SDGs) | — | The UN global goals that taking part helps towards. |
| :492 Topics | — | What this opportunity is about. |

Where the claims come from:

- **Targeted groups:** the editor's own help text, "Informational only — it does not restrict
  who can take part." (`pages/organisations/[id]/opportunities/[opportunityId]/index.tsx:3103`).
- **YoID:** "Skills that you receive by completing opportunities will be diplayed here."
  (`pages/yoid/skills/[[...query]].tsx:87`; the typo is in the source).
- **Skills:** the editor's "Which skills will the Youth be awarded with upon completion?" (:3775).

### Acceptance checks (signed out)

- **1440, Job detail.** Skills required is open by default.
  - Under its title, in 13px `text-gray-dark` on one line, it reads "Skills this job asks for.
    Mention the ones you have when you apply."
  - The first chip row starts 18 ±1px below the note's bottom, and "Show all 10" is inline at
    the end of the chips.
  - Closing the card hides the note and brings back the preview ("Android ButterKnife,
    Bioinformatics +8").
  - Opening Languages, Countries and Topics shows their notes. Time needed and Additional
    details show none.
- **1440, Learning or Entrepreneurship:** Skills reads "Skills you'll build by completing this.
  They're added to your YoID." Incentive (the Entrepreneurship sample) reads "What you could get
  for taking part."
- **390:**
  - Each note wraps to at most 2 lines in the title column, with no truncation and no
    sideways scroll.
  - The chips start at the card's left padding below it.
  - The pinned tabs and the bottom bar are unchanged.
- **Reduced motion:** the note appears with the body, with no fade.
- **Kill-switch off** (code check, or the one-time flip): the classic page shows no notes.
- **Not seen:**
  - SDGs and accommodations (not in the seed);
  - the admin page and the editor Preview (they need a sign-in).

### Departures and decisions

- **D-F3a: the note sits in the preview's slot, not at the top of the body.** In the body it
  would float 36px under the title, separated from it by the button's padding. In the slot,
  the card reads the same way closed and open: title, a grey line, then the content.
  - **Cost:** the note becomes part of the toggle's accessible name while the card is open, as
    the preview is while it's closed.
- **D-F3b: Accessibility gets its note only when chips render.** That follows the brief: no
  notes on sections without chips.

---

## Questions for Jason

1. **F1: the welcome takes its content's height** (1072 × about 532 at 1440), instead of the
   fixed 1072 × 600 of round 10. md is content-sized too. *Recommend yes:* it removes the dead
   bands, and it is what lets the welcome fit down to 560px without shrinking anything above
   680px.
2. **F2: in Safari and Firefox the box's height switches instead of easing,** because
   `interpolate-size` is Chromium-only today. The width still eases, and the switch happens
   behind the empty purple box. *Recommend accepting it.* The alternative is a few lines of JS
   that measure the height, no library.
3. **F3: the note style.** The options are a plain grey line in the preview's slot (the filter
   panel's hint, no icon) or the same line with `IoInformationCircleOutline`. *Recommend no icon.*
4. **F3: the nine strings above.** Two of them promise something: "It doesn't limit who can
   take part" and "They're added to your YoID". *Recommend approving them:* both restate the
   app's own copy.
