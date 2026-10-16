# claude.design review, round 10 — implementation brief (2026-10-02)

> Saved verbatim from claude.design’s delivery to Jason on 2026-10-02: the README and the four
> prompts, in order. The artboards are in [`2026-10-02/`](2026-10-02/). The README’s "full
> context" files (`REVIEW-2026-10-02.md`, `Design Review 2026-10-02.dc.html`) were not supplied
> and are not in the repo.
>
> **This brief is visual guidance.** The feature’s Decisions win wherever the two conflict. The
> task split, the conflicts and the questions for Jason are in
> [`2026-10-02-tasks.md`](2026-10-02-tasks.md).

---

## README

# Round 10 handoff: one session per prompt
Attach **one** `.md` plus its PNGs. Each prompt is self-contained.

1. 01-welcome.md — p1-welcome-1440.png, p1-welcome-390.png
2. 02-detail.md — p2-detail-1440.png, p2-detail-390.png, p2-detail-admin-header.png
3. 03-landing-rails.md — p3-rails-plan.png, p3-rails-390.png
4. 04-copy.md — p4-*.png (4 files)

Green numbered pins in the screens match the numbered "Exact changes" in each prompt (P1, P2).
Full context: ../REVIEW-2026-10-02.md and Design Review 2026-10-02.dc.html.

---

## 01-welcome.md

# P1 · Welcome step
Screens: p1-welcome-1440.png (dialog over dimmed page), p1-welcome-390.png

## Rules (read first)
- Screens are **visual guidance only**. The current build, its behaviour and its data are settled; change only layout, hierarchy, motion and copy listed here.
- Use data the page already shows. No new API data, no per-card calls, no new sort options.
- Existing palette and Tailwind classes only (purple #41204B, gold #F9A93B, green #387F6A, page #F3F6F8, type colours from `opportunityTypeTheme.tsx`). The hex values in the screens are approximate.
- **prefers-reduced-motion: reduce** → no transforms, counting or loops; at most a single 150ms opacity fade.
- No i18n: copy is replaced at the `file:line` given (paths relative to `src/web/src/`).
- Earlier rounds and the BA sign-off still stand. If something conflicts, keep the earlier decision and flag it in the handoff.
- Don’t change section sets, visibility rules, routes, tab order, scroll-spy or sticky behaviour.

Files: WelcomeStep.tsx, PersonalizeDialog.tsx, LiveCountPanel.tsx (read only)


### Exact changes
1. **Dialog size.** Step 0 becomes 1072 × 600 at 1440 (was ~736 tall). height: min(600px, calc(100vh - 64px)), overflow: hidden. It fits 1280 × 720 with 60px to spare. Content is laid out to fit, so it never scrolls on desktop.
2. **Grid.** 500px | 1fr, gap 36, padding 40/40/40/48. The left column centres vertically between the badge and its bottom edge. The right column is an inset panel: rgba(255,255,255,.06) fill, 1px rgba(255,255,255,.12) border, radius 20, padding 24.
3. **Count.** 104px Nunito 900, tracking −0.045em, plus a LIVE dot (8px #5CC8A3 with a 4px 25% ring). Under it, the line in gold 34/900. The count is still the only number on the step.
4. **Count-up.** When LiveCountPanel resolves, tween 0 → N over 900ms, cubic-bezier(.16,1,.3,1), with tabular-nums so the width doesn’t jitter. If N later changes, tween from the old value over 400ms. Reduced motion: render N immediately.
5. **Entrance.** Dialog: opacity 0 → 1 and translateY 12 → 0 over 320ms ease-out. Left column children stagger in 60ms apart (badge, count, line, body, tip, buttons), 280ms each. Right panel tiles stagger 40ms apart, starting at 200ms. Reduced motion: a single 150ms opacity fade on the dialog only.
6. **Ambient.** Two blurred orbs behind the content (gold 13% at the top right, green 22% at the bottom left) drift ±16px on an 18s ease-in-out alternate loop. They’re decorative, aria-hidden and pointer-events none. Reduced motion: static.
7. **Type tiles.** A 3 × 2 grid, each tile 76px tall. A 32px rounded square in the type’s theme colour (opportunityTypeTheme.tsx) holds a white icon, with the label (13/700, one line, never truncated) centred below it. Hover/focus: background .08 → .14 and border to gold, 120ms. Press: scale .98 for 80ms (none under reduced motion). No counts, as before.
8. **Quick searches.** A 2 × 2 grid of white 42px pills, so there’s never an orphan. If "Jobs in my country" is present (signed in with a profile country), it’s 5 items and the grid becomes 3 + 2. The tap behaviour is unchanged: apply the filter and close the dialog.
9. **Get started.** A gold pill, 54px tall, with a 6px 22% gold halo. Once, 1.2s after the entrance finishes, the halo pulses 6 → 12px → 6px over 700ms. It doesn’t repeat, and doesn’t run under reduced motion. "Browse on my own" stays a white underlined text button.
10. **Mobile 390.** Single column with the count at 64px. Type tiles in a 3 × 2 grid (66px, icon over a short label). Quick searches wrap with no horizontal scroll. Get started and Browse on my own stay pinned at the bottom (already the case). It fits 390 × 844 without scrolling. On shorter screens the content area scrolls and the buttons stay pinned.

### Final copy

| Where | Current | Final |
|---|---|---|
| `WelcomeStep.tsx:93` | Welcome to the new Yoma search | NEW  ·  Yoma search  (badge: "NEW" chip + label) |
| `WelcomeStep.tsx:104` | opportunities we’ve already found for you. | opportunities are waiting for you. |
| `WelcomeStep.tsx:108` | Everything from jobs and learning courses to making friends at social events. You can save your preferences or filter your results any time. | Jobs, learning, impact actions, events and programmes to start a business — all in one place. |
| `WelcomeStep.tsx:115–116` | Don’t be overwhelmed! Click "Get started" to choose your preferences and narrow down your feed. | Don’t be overwhelmed! Tap "Get started" to choose your preferences and narrow down your feed. Every step is optional. |
| `WelcomeStep.tsx:131` | By type | Pick a type |
| `WelcomeStep.tsx:65 · 72 · 126 · 157` | Get started · Browse on my own · Or jump straight in · Quick searches | Unchanged |
| `new · type tile short labels (390 only)` | Impact Action · Entrepreneurship | Impact · Business (aria-label keeps the full type name) |

### Departures from the build
- **Dialog height fixed at 600 on desktop (was content + empty space).** Why: Removes the ~40% dead area and guarantees no scroll.
- **Right column wrapped in an inset panel; type tiles 3 × 2 with coloured icon squares.** Why: Gives the jump-in options their own surface and shows each type at a glance.
- **Count-up, staggered entrance, ambient drift and a one-time CTA pulse.** Why: The ask was "eye-catching through motion". Everything is one-shot except the drift, and all of it is off under reduced motion.
- **Body copy shortened; the tip gains "Every step is optional."** Why: The body and tip repeated each other. The new line reuses an existing promise (LiveCountPanel.tsx:68).
- **Mobile short labels: "Impact", "Business".** Why: Lets six tiles fit 3 across at 390. The full names stay in aria-labels.

---

## 02-detail.md

# P2 · Detail pages (public + admin)
Screens: p2-detail-1440.png (shown at 75%), p2-detail-390.png, p2-detail-admin-header.png

## Rules (read first)
- Screens are **visual guidance only**. The current build, its behaviour and its data are settled; change only layout, hierarchy, motion and copy listed here.
- Use data the page already shows. No new API data, no per-card calls, no new sort options.
- Existing palette and Tailwind classes only (purple #41204B, gold #F9A93B, green #387F6A, page #F3F6F8, type colours from `opportunityTypeTheme.tsx`). The hex values in the screens are approximate.
- **prefers-reduced-motion: reduce** → no transforms, counting or loops; at most a single 150ms opacity fade.
- No i18n: copy is replaced at the `file:line` given (paths relative to `src/web/src/`).
- Earlier rounds and the BA sign-off still stand. If something conflicts, keep the earlier decision and flag it in the handoff.
- Don’t change section sets, visibility rules, routes, tab order, scroll-spy or sticky behaviour.

Files: OpportunityPublicDetails.tsx, TabbedDetails/*, OpportunityAdminInfo.tsx


### Exact changes
1. **Header card.** Radius 20, padding 28/32, soft shadow 0 10 40 rgba(31,36,48,.10). The type chip sits on the same line as the org · location (moved above the title). Title 32/900. The logo becomes a 76px rounded square (radius 20) on the right, top-aligned with the chip row.
2. **Fact strip.** Replaces the grey meta line and the engagement + reward chips. 4 equal tiles (gap 12), 12/14 padding, radius 14. Each has a white 38px icon square, a 12px grey label and a 17/900 value. Tint per fact: Reward gold-50, Effort blue-50, Ends red-50, How you take part green-50. It only shows facts the page already has; a missing fact drops out and the grid reflows to 3 or 2. On 390: 3 tiles (Effort, Ends, Take part) with no icons; the reward moves into the CTA bar label area.
3. **Actions together.** Primary CTA (existing label logic) + Save + Share in one left-aligned group, gap 10, all 48px pills. Upload your completion files keeps its existing visibility rules and sits right-aligned in the same row as a neutral pill (#F3F6F8, purple text).
4. **Tabs.** A segmented pill bar (white, 1px #E3E7ED, padding 6). The active tab is filled purple with white text; inactive tabs are grey 14/800. The active fill slides between tabs over 220ms, cubic-bezier(.2,.8,.2,1). Scroll-spy, anchors and order are unchanged. Sticky behaviour is unchanged: when the header card leaves, the existing sticky bar shows title + CTA + Save + Share + these tabs, sliding in over 180ms (translateY −8 → 0 plus a fade).
5. **Description.** Full width, in a white card (radius 18, padding 26/30). Force the editor’s rendered font to Nunito Sans 16.5/1.7, #2B3240, with a max-width of 860px for the measure. Clamp and Show more/Show less are unchanged; the expand animates max-height over 240ms ease-out.
6. **Two-column sections (desktop ≥ 1024px).** Under each group overline, the short sections flow into grid-template-columns: repeat(2, minmax(0,1fr)), gap 14. This covers incentive, time, languages, age, accessibility, countries, targeted groups, SDGs, topics, skills and additional details. A section whose open content is a long chip list (skills, topics, SDGs) or Additional details spans both columns when it’s open (grid-column: 1 / -1) and returns to one column when closed. An odd section out fills the row’s left cell. The description is always full width. Section set, show rules, default open state and order are all unchanged.
7. **Section card.** White, radius 18, 1px #E3E7ED, padding 18/20. A 40px tinted icon square (radius 12) with the title 15.5/800, then " · {count}" in grey and a one-line preview in grey 14. The chevron is on the right. Group tints: About gold/blue, Requirements lilac, Who it’s for green, Impact blue, Details grey. Hover: border #CDD3DC, 120ms. Open/close animates height over 220ms ease-out and rotates the chevron 180°. Reduced motion: no height animation.
8. **Chips.** List chips become soft: background #E8F3EF, text #2B6555, 13/700, radius 999, padding 5/12. Solid green stays reserved for the primary CTA. "Show all N" stays as the green text link.
9. **Mobile 390.** Single column with the same cards. The pinned tab bar keeps the pill styling, scrolls sideways, and fades to transparent over its last 40px, so the cut-off tab reads as scrollable. The existing bottom bar shows CTA + Save + Share; its CTA is a 50px pill and Save/Share are 50px round outline buttons.
10. **Admin info.** The same public body. The header card swaps the youth actions for: status chip(s), a "Manage opportunity" menu button (existing), and a 3-up stat strip using the existing strings ({n} completed / {n} pending / Limit {n} or Limit reached). The Rewards tab is appended after Details as a gold-tinted pill. No bottom bar on mobile.

### Final copy

| Where | Current | Final |
|---|---|---|
| `OpportunityDetailSections.tsx:184` | How much time you will need | Time needed |
| `OpportunityDetailSections.tsx:177 (and OpportunityPublicDetails.tsx:179)` | {n} total hour(s) | About {n} hour(s) |
| `OpportunityDetailSections.tsx:188` | This task should not take you more than {…}. | Most people finish in {…} or less. |
| `OpportunityDetailSections.tsx:190` | The estimated times provided are just a guideline. You have as much time as you need… (52 words) | It’s only a guide — go at your own pace. |
| `OpportunityDetailSections.tsx:165 (value line)` | Yes · ZLTO | Earn Z {amount} in ZLTO  (when the reward amount is on the page; otherwise "Earn ZLTO") |
| `OpportunityDetailSections.tsx:237–246` | Age range › Minimum age {min} / Maximum age {max} | Age range › {min}–{max} years  ·  {min} and over  ·  Up to {max} years |
| `OpportunityDetailSections.tsx:327` | Sustainable Development Goals | Global goals (SDGs) |
| `new · fact strip labels` | (grey meta line) | Reward · Effort · Ends · How you take part   (390: "Take part") |
| `opportunityTypeTheme.tsx:298 · 306` | {n} {unit} effort · Ends {date} | Value only in the strip: "{n} {unit}" · "{date}" |

### Departures from the build
- **Grey meta line and engagement/reward chips replaced by a fact strip.** Why: These are the facts youth decide on. They move from a 12px footnote to the first thing read after the title.
- **Type chip moved above the title; logo becomes a 76px rounded square.** Why: Hierarchy: what it is → title → facts → act. The bigger logo makes the card feel owned by the organisation.
- **Save and Share sit next to the CTA; Upload moves into the same row.** Why: Related actions belong together. Nothing changes about when each one shows.
- **Tabs restyled as a pill bar with a sliding fill.** Why: Reads as navigation. Scroll-spy and sticky rules are unchanged.
- **Short sections in two columns on desktop; long open lists span both.** Why: Requested. It roughly halves the page height and keeps lists readable.
- **Description forced to Nunito Sans with a capped measure.** Why: The current editor output uses a different font and runs ~1200px wide, which is hard to read.
- **Solid green chips become soft green.** Why: Chips were as loud as buttons. Solid green stays a signal for "act".
- **Time and incentive copy shortened; age shown as one range.** Why: Friendlier and scannable. The data and conditions are the same.

---

## 03-landing-rails.md

# P3 · Search landing rails
Screens: p3-rails-plan.png, p3-rails-390.png

## Rules (read first)
- Screens are **visual guidance only**. The current build, its behaviour and its data are settled; change only layout, hierarchy, motion and copy listed here.
- Use data the page already shows. No new API data, no per-card calls, no new sort options.
- Existing palette and Tailwind classes only (purple #41204B, gold #F9A93B, green #387F6A, page #F3F6F8, type colours from `opportunityTypeTheme.tsx`). The hex values in the screens are approximate.
- **prefers-reduced-motion: reduce** → no transforms, counting or loops; at most a single 150ms opacity fade.
- No i18n: copy is replaced at the `file:line` given (paths relative to `src/web/src/`).
- Earlier rounds and the BA sign-off still stand. If something conflicts, keep the earlier decision and flag it in the handoff.
- Don’t change section sets, visibility rules, routes, tab order, scroll-spy or sticky behaviour.

Files: DiscoveryLanding.tsx, DiscoveryRail.tsx


### Rail plan

| # | Title | Subtitle | Driver | Shown to |
|---|---|---|---|---|
| 1 | Picked for you | Because your feed is tuned to {goal} | preferences (existing feed query) | Signed in + prefs |
| 2 | Featured | Hand-picked by the Yoma team | featured | Everyone |
| 3 | Newest on Yoma | Latest start dates first | sort: newest (start date) | Everyone |
| 4 | Done in under an hour | Quick wins that fit into your day | quick search: Under an hour | Everyone |
| 5 | Most completed | Popular with young people on Yoma | most completed | Everyone |
| 6 | Start learning | Courses and training to grow your skills | type: Learning | Everyone |
| 7 | Climate action | Work on climate and the environment | quick search: Climate action | Signed out / no prefs |

### Exact changes
1. **Rail set.** Use the table, in that order: at most 6 requests, one per rail. A rail with 0 results is not rendered, and there’s no empty state.
2. **Desktop rail.** The existing DiscoveryRail header (title 20/900, subtitle 14 grey, "See all {N} →" on the right) over one row of 4 cards. Gap between rails: 40px. The card component and sizes are unchanged.
3. **Mobile rail.** A horizontal scroller: cards 290px wide, gap 10, scroll-snap-type x mandatory, scroll-padding 16, and the next card peeks by ~70px. Scrollbar hidden; keyboard and screen readers get a labelled region with "See all" as the last focusable item. This replaces the vertical stack.
4. **Lazy loading.** Rails 1–3 request on load. Rails 4–7 request when within 600px of the viewport (IntersectionObserver), so the first paint still costs 3 requests. Each loading rail shows the existing card skeletons.
5. **Motion.** On first reveal, a rail’s cards fade up (opacity 0 → 1, translateY 8 → 0) over 240ms ease-out, staggered 40ms. Once only. Reduced motion: no transform, a 150ms fade.
6. **Order with preferences.** Signed in with saved preferences, rail 1 "Picked for you" leads and rail 7 is dropped. When the user switches preferences off for the search, rail 1 hides and rail 7 returns.

### Final copy

| Where | Current | Final |
|---|---|---|
| `DiscoveryLanding.tsx:45` | New this week | Newest on Yoma |
| `DiscoveryLanding.tsx:46` | The newest opportunities across Yoma | Latest start dates first |
| `DiscoveryLanding.tsx:37–38` | Because your feed is tuned to {…} · From your preferences | Title: Picked for you · Subtitle: Because your feed is tuned to {…} |
| `new · rails 2, 4–7` | — | Featured / Hand-picked by the Yoma team · Done in under an hour / Quick wins that fit into your day · Most completed / Popular with young people on Yoma · Start learning / Courses and training to grow your skills · Climate action / Work on climate and the environment |
| `DiscoveryRail.tsx:42` | See all | See all {N} →  (unchanged pattern) |

### Departures from the build
- **One rail becomes up to six.** Why: Requested. The landing currently ends after 4 cards.
- **"New this week" renamed "Newest on Yoma" / "Latest start dates first".** Why: The rail isn’t limited to a week. The new copy says exactly what the sort does.
- **Mobile rails scroll sideways instead of stacking.** Why: Six stacked rails would be ~9000px tall. Sideways rails keep each one to ~210px.
- **Rails 4–7 load when near the viewport.** Why: Keeps first paint at 3 requests while allowing 6.

---

## 04-copy.md

# P4 · Copy: filters, See more/less, no matches, age range
Screens: p4-no-matches-search.png, p4-no-matches-filters.png, p4-no-matches-preferences.png, p4-age-and-category-toggle.png

## Rules (read first)
- Screens are **visual guidance only**. The current build, its behaviour and its data are settled; change only layout, hierarchy, motion and copy listed here.
- Use data the page already shows. No new API data, no per-card calls, no new sort options.
- Existing palette and Tailwind classes only (purple #41204B, gold #F9A93B, green #387F6A, page #F3F6F8, type colours from `opportunityTypeTheme.tsx`). The hex values in the screens are approximate.
- **prefers-reduced-motion: reduce** → no transforms, counting or loops; at most a single 150ms opacity fade.
- No i18n: copy is replaced at the `file:line` given (paths relative to `src/web/src/`).
- Earlier rounds and the BA sign-off still stand. If something conflicts, keep the earlier decision and flag it in the handoff.
- Don’t change section sets, visibility rules, routes, tab order, scroll-spy or sticky behaviour.

Files: FreeTextSearchInput.tsx, PreferencesBlock.tsx, TypeSpecificFilters.tsx, filterSections.ts, CategoryCarousel.tsx, NoMatches.tsx, OpportunityDetailSections.tsx


### No-matches states
- **SEARCH WORD ONLY** — title "No matches for “{q}”" · body "Check the spelling, or try a shorter or broader word." · buttons: Clear search
- **FILTERS SET (WITH OR WITHOUT A WORD)** — title "No matches with these filters" · body "Remove a filter or two, or clear them all — your preferences stay as they are." · buttons: Clear filters
- **PREFERENCES ARE NARROWING IT** — title "No matches in your feed" · body "Your preferences may be too narrow for this search. Try it without them — nothing is changed in your profile." · buttons: Search without my preferences + Clear filters

### Exact changes
1. **No matches.** Choose the state with the existing logic: search word only → state 1; any filter → state 2; preferences applied → state 3 (it adds the existing "Search without my preferences" button, NoMatches.tsx:55). The card styling is unchanged.
2. **Filters panel rows.** Mobile shows the same one-line summary as desktop ("Any", "14 filters", "{n} selected") in grey 13px under the row title.
3. **Coming soon rows.** "Skills · Coming soon" renders disabled: 50% opacity, no chevron, aria-disabled, with the "Coming soon" pill at the right. It stays in place.
4. **Badges.** Remove "FROM THIS TYPE" and "OPT-IN". Keep "FROM PREFERENCES" (FilterSection.tsx:72): it carries real information.
5. **Category toggle.** Text-only change: "Show all {N}" / "Show fewer". It matches the list pattern used on the detail page and in filters. The description clamp keeps "Show more" / "Show less" (that’s for text, not lists).
6. **Age range.** One row with one value (three cases above). It stays under Requirements, with the same visibility rule.

### Final copy

| Where | Current | Final |
|---|---|---|
| `FreeTextSearchInput.tsx:47` | Search titles, summaries and keywords… | Search by title or keyword… |
| `PreferencesBlock.tsx:31` | No preferences set — personalize your feed once and every search uses it. | No preferences yet. Set them once and every search uses them. |
| `PreferencesBlock.tsx:39` | Set my preferences | Unchanged |
| `TypeSpecificFilters.tsx:86` | FROM THIS TYPE | (removed) |
| `Accessibility section badge` | OPT-IN | (removed — subtitle "Need accommodations?" stays) |
| `filterSections.ts:111` | Pick one or more — each type adds its own filters. | Pick one or more. Each type adds its own filters. |
| `CategoryCarousel.tsx:126` | See more  (+10) | Show all {N} |
| `CategoryCarousel.tsx:121` | See less | Show fewer |
| `NoMatches.tsx:33` | No matches — yet | State 1: No matches for “{q}” · State 2: No matches with these filters · State 3: No matches in your feed |
| `NoMatches.tsx:19` | Nothing matches this search. Try another word. | Check the spelling, or try a shorter or broader word. |
| `NoMatches.tsx (filters body)` | Nothing fits everything you’ve picked. Clear your filters to see more — your preferences stay as they are. | Remove a filter or two, or clear them all — your preferences stay as they are. |
| `NoMatches.tsx (state 3 body, new)` | — | Your preferences may be too narrow for this search. Try it without them — nothing is changed in your profile. |
| `NoMatches.tsx:45` | Clear filters (always) | State 1: Clear search (FreeTextSearchInput.tsx:60) · States 2–3: Clear filters |
| `OpportunityDetailSections.tsx:243 · 246` | Minimum age · Maximum age | (rows merged) {min}–{max} years · {min} and over · Up to {max} years |

### Departures from the build
- **No-matches card has 3 copy states and swaps Clear filters for Clear search when only a word is set.** Why: The current copy and button assume filters that may not exist.
- **"FROM THIS TYPE" and "OPT-IN" badges removed.** Why: Both repeat or obscure what the label and subtitle already say.
- **Mobile filter rows gain summaries.** Why: Brings mobile in line with desktop. It reuses the existing summary strings.
- **Category toggle says "Show all {N}" / "Show fewer".** Why: One pattern for lists across the product.
- **Age range merged into one value.** Why: Two rows for one fact. The data is the same.

## Also, if cheap
- Results subtitle "Your preferences shape these results — adjust any chip below" (DiscoverySurface.tsx:172) shows when signed out with no preferences (03-results). Show it only when preferences are applied; otherwise use :169 "Refine your search with the filters".
- At 390, the Grid/List toggle is clipped off the right edge on results and no-matches (04-list-390, 06-390). Wrap it below the heading, or show icon-only buttons at under 420px.
- Mobile list rows truncate titles to ~2 words (04-list-390). Allow 2 lines before the ellipsis; the row height grows to fit.
