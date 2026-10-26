# Design spec — desktop wallet, overview and the user-menu drawer (2026-10-22)

- **Brief (Jason, 2026-10-22):** on desktop the wallet / overview sections are too wide. Wallet page: the
  informational message (friendly, coloured wallet icon, more information, engaging) and the "My Wallet"
  card side by side, not stacked. Overview: the same judgement for every section. Drawer
  (`components/NavBar/UserMenu.tsx`): the Yo-ID pages' design — Nunito headings, io5 icons, the palette,
  expandable sections (`DetailDisclosure`) instead of the tiles; no profile image and no "!" in the
  greeting of its purple banner.
- **Captured:** 1440, 1024 and 390, signed in as `testuser` (approved), headless Chrome on the throwaway
  slot. Shots in [`./2026-10-22/`](./2026-10-22/) (paths below are relative to it). `/yoid`,
  `/yoid/wallet`, the drawer opened from the avatar (scrolled in two frames, Passport expanded), and an
  opportunity detail page for the section language (`opportunity-1440.png`; the brief's reference ID
  404s after the reseed, so `543f5ba8…` — an Other-type fixture with every section group — stands in).
- **Decisions that still win:** YOM-1283 `feature.md`, the epic README. Behaviour is unchanged
  throughout: the same queries, the same gates (`walletReady`, `passport_enabled`,
  `CUSTOM_FIELDS_ENABLED`), the same links. Departures from recorded decisions are listed in §5.
- Headless Chrome has no emoji font: the drawer's "💸 🏆 ⚡ 🌐" render as tofu in the shots
  (`drawer-1440-0.png`); that is the capture, not a bug — and the emoji go anyway.

## 1. Wallet page — `/yoid/wallet`

### Current

`wallet-1440.png`, `wallet-1024.png`, `wallet-390.png`.

- Three full-width rows at 1 248 px: the one-line `YoIDIntro` strip, "My Wallet" (the ledger), "My
  Products". The ledger's three rows span 1 200 px — "Available … 0" with the figure a screen-width away
  from its label — and the card is 125 px tall with nothing beside it. The intro strip is a sentence
  with a 20 px icon: informational, not inviting.
- 1024 is the same picture at 992 px; at 390 the stack is right (one column), the strip wraps to five
  lines.
- What is wrong: rhythm (three thin bands, each as wide as the page), density (the page's only figures
  float in white), affordance (the explainer looks like a system notice, not like something to read).

### Changes

**Row 1 — two tiles from `lg`, equal height.** `pages/yoid/wallet/[[...query]].tsx:239-249`. Replace the
`YoIDIntro` (`:229-236`) and the full-width "My Wallet" tile with one grid under the breadcrumb:

```
<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
  <YoIDTile title="My Wallet" icon={YOID_TABS.wallet.icon} bodyClassName="min-h-0">…WalletCard…</YoIDTile>
  <YoIDTile title="How ZLTO works" icon={IoInformationCircleOutline} bodyClassName="min-h-0 justify-between gap-4">
    <WalletInfoCard />
  </YoIDTile>
</div>
```

- DOM order: **My Wallet first, the explainer second** — on a phone the youth's balance is the first
  card; from `lg` (1 024 px) they share the row, balance left, explainer right. Each column is
  `(container − 16 px) / 2`: 616 px at 1440, 488 px at 1024. No extra max-width: the overview's Wallet
  card is already 616 px at 1440 and the ledger reads fine there (`overview-1440.png`).
- `lg:items-stretch` plus `YoIDTile`'s `grow` body: the two cards end on the same line. `WalletCard`'s
  ledger already centres itself in spare height (`ZltoLedger className="flex-1 justify-center"`), so a
  taller explainer never leaves the balance pinned to the top with dead white under it.
- "My Products" (`:251-348`) is unchanged below the row, full width, with the wallet-pending panel and
  the grid as today. Spacing between the row and My Products stays the page's `gap-8`.
- `Head`, breadcrumb, `LoadingStatus`, modal: unchanged.

**The explainer tile's body — `components/YoID/WalletInfoCard.tsx` (new, presentation only, no
data).** Uses only strings and links; never a request.

```
<div class="flex items-start gap-4">
  <span aria-hidden class="bg-orange-light text-yellow flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
    <IoWallet class="h-7 w-7" />                        ← io5 solid wallet, the "friendly coloured icon"
  </span>
  <div class="flex min-w-0 flex-col gap-1">
    <p class="font-nunito text-base font-black text-black md:text-lg">Earn it, then spend it</p>
    <p class="text-sm text-black">ZLTO is Yoma's reward. Complete an opportunity, get it verified, and the ZLTO lands here.</p>
  </div>
</div>
<ul class="flex flex-col gap-2 text-sm text-black">
  <li class="flex items-start gap-2"><IoTrophyOutline aria-hidden class="text-green mt-0.5 h-4 w-4 shrink-0" />Every verified opportunity pays the ZLTO shown on its page.</li>
  <li class="flex items-start gap-2"><IoTimeOutline   aria-hidden class="text-green mt-0.5 h-4 w-4 shrink-0" />Pending rewards are on their way — allow up to 24 hours.</li>
  <li class="flex items-start gap-2"><IoBagHandleOutline aria-hidden class="text-green mt-0.5 h-4 w-4 shrink-0" />Spend what is available in the marketplace; what you buy appears under My Products.</li>
</ul>
<div class="flex flex-wrap gap-2">
  <Link href="/marketplace" class="{PILL_CLASS} {PILL_TOUCH_CLASS} {PILL_IDLE_CLASS}"><IoBagHandleOutline class="h-4 w-4" />Browse the marketplace</Link>
  <Link href={OPPORTUNITIES_SEARCH_URL} class="{PILL_CLASS} {PILL_TOUCH_CLASS} {PILL_IDLE_CLASS}"><IoSearchOutline class="h-4 w-4" />Find opportunities</Link>
</div>
```

- The icon square is the overview Wallet section's tone (`TONE.gold` = `bg-orange-light text-yellow`,
  tokens `orange-light` / `yellow`), one size up from the disclosure's 40 px square (56 px, `rounded-2xl`)
  so it reads as the card's illustration, not a row icon. Solid `IoWallet` rather than the outline: the
  tint carries the colour, the solid glyph carries the weight.
- The three bullets paraphrase `ZltoModal` (`components/YoID/ZltoModal.tsx:46-71`): pending = in
  transfer, up to 24 h; available = spend now. Nothing new is claimed about the marketplace.
- Links are discovery's idle pills (`lib/pill.ts`), the Yo-ID page language; the pills sit at the foot
  because the tile body is `justify-between`. "What is ZLTO?" stays in the ledger card (round 1).
- Tile header icon: `IoInformationCircleOutline` (the `YoIDIntro` icon, so the "info" meaning carries
  over). Title "How ZLTO works".
- `YOID_TABS.wallet.blurb` keeps serving the overview's Wallet note; the wallet page no longer renders it.

**Motion:** none new. **390:** the row is one column (`grid-cols-1`); the explainer tile sits under the
wallet tile, then My Products.

## 2. Overview — `/yoid`

### Current

`overview-1440.png`, `overview-1024.png`, `overview-390.png`.

- Wallet | Passport two-up from `lg` (fine). Skills and Opportunities span both columns
  (`SECTIONS[].wide`, `index.tsx:64-65`). Skills at 1 248 px is one 1 130 px row of eight chips — long,
  but legible. Opportunities is the bad one: four 96 px circles clustered in a `sm:max-w-lg` band in the
  middle of a 1 248 px card, the "Graph" pill alone at the far right, white on both sides.
- The section order (Wallet, Passport, Skills, Opportunities) disagrees with the chip order (Wallet,
  Passport, Opportunities, Skills — `YOID_TABS` order), so the hero's fourth chip lands on the third
  card.
- 1024: same at 992 px. 390: one column, correct.

### Changes

`pages/yoid/index.tsx`.

- **Every data section is half width from `lg`; only the static CV row spans.** Drop `wide` from
  `SECTIONS` (`:61-66`) and the `lg:col-span-2` on the section wrapper (`:306`); the CV `div`
  (`:405`) keeps `lg:col-span-2`. Grid (`:286`): `mx-auto grid w-full max-w-7xl grid-cols-1 gap-3
  lg:grid-cols-2 lg:items-start` — `items-start` is the detail page's rule
  (`OpportunityDetailSections.tsx:997`): a card never stretches to its open neighbour's height.
- **Order: Wallet, Passport, Opportunities, Skills** — the chip order. Rows: Wallet | Passport,
  Opportunities | Skills, CV. Update the `SECTIONS` comment (`:57-60`) and the scroll-spy comment
  (`:201-203`: "Wallet and Passport share a row" → "each row's two sections tie"). The spy already
  resolves a tied row generically (`:210-226`), so no logic change; `jump`, refs, ids unchanged.
- Opportunities at 616 px: the circles band (`sm:max-w-lg`) is now the card, the Graph pill sits over
  them — nothing else to change in `OpportunitiesSummary`. At 1024 the body is ≈ 394 px wide, the
  four circles shrink to ≈ 89 px (`w-full max-w-24`), labels still fit (11 px).
- Skills at 616 px: the eight chips wrap to two or three rows and stop after `SHOWN_SKILLS`; "Open
  Skills →" closes the card. No clamp, no "Show all" (round 2).
- Open-by-default stays (decision 2026-10-21). 390 unchanged apart from the order swap.

## 3. User-menu drawer — `components/NavBar/UserMenu.tsx`

### Current

`drawer-1440-0.png`, `drawer-1440-1.png`, `drawer-390-0.png`, `drawer-390-1.png`.

- A 320 px cream panel (`bg-[#FFF5E7]`, `:197`) with a world map and two stamps bleeding through the
  cards; an 80 px avatar, the name, "Verified ✓", three orange daisyUI `btn-warning` buttons, a divider,
  "My Yo-ID ⓘ", then four white tiles under `Common/Header` emoji headings (`:337`, `:361`, `:410`,
  `:445`): the ledger, three circles with a floating underlined "View Graph", a 180 px *scrolling* box
  of skills chips (a scrollbar inside a scrolling drawer), a collapsible Passport with an orange
  "Open Passport →" button, and the purple Logout.
- Nothing of the Yo-ID pages' language: no Nunito, no io5, the old orange buttons, emoji headings, the
  cream background, the stamps. The two chevrons mean two things (Wallet's `>` is a link, Passport's
  `v` toggles).
- At 390 the panel covers 320 of 390 px (`drawer-390-0.png`); the same tiles, 1 296 px tall.

### Changes

Three parts: banner, sections, chrome. Width: `h-screen w-[22rem] max-w-[calc(100vw-2rem)]
overflow-y-auto rounded-tl-lg rounded-bl-lg bg-gray-light` (`:197`) — 352 px, leaving a strip of
overlay at 390 (358 px cap) so it still reads as a drawer.

**3a. Banner — the Yo-ID hero, in the drawer.** Replaces `:200-312` (map, stamps, avatar, name,
Verified, close, the three buttons).

```
<PageBackground class="px-5 pt-5 pb-4">                       ← wrapper mode: purple `bg-theme`, world map at 10 %
  <div class="flex w-full flex-col gap-3">
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <p class="text-lg font-semibold text-white">
          <TimeOfDayIcon aria-hidden class="text-orange mr-1.5 inline-block h-5 w-5 align-[-0.15em]" />
          Good {timeOfDay}{firstName && <>, <span class="text-orange">{firstName}</span></>}
        </p>
        {emailConfirmed && yoIDOnboarded && (
          <p class="flex items-center gap-1 text-xs text-white/80"><IoCheckmarkCircle aria-hidden class="text-green-dark h-4 w-4" />Verified Yo-ID</p>
        )}
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <button aria-label="What is Yo-ID?" title="What is Yo-ID?" class="inline-flex h-11 w-11 items-center justify-center rounded-full text-white"><IoInformationCircleOutline class="h-5 w-5" /></button>
        <label for="userMenu-drawer" aria-label="Close" title="Close" class="drawer-close inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-white hover:bg-white/10"><IoClose class="h-6 w-6" /></label>
      </div>
    </div>
    <div class="flex flex-wrap gap-2">                                    ← discovery pills, as the hero's chip row
      <Link href="/user/profile"  class="{PILL_CLASS} {PILL_TOUCH_CLASS} {PILL_IDLE_CLASS}"><IoPersonOutline class="h-4 w-4" />Profile</Link>
      <Link href="/user/settings" class="…"><IoSettingsOutline class="h-4 w-4" />Settings</Link>
      {CUSTOM_FIELDS_ENABLED && <Link href="/opportunities/discover?personalize=1" class="…"><IoOptionsOutline class="h-4 w-4" />My preferences</Link>}
    </div>
  </div>
</PageBackground>
```

- Greeting exactly as the hero (`components/Layout/YoID.tsx:166-192`): `getTimeOfDayAndIcon()` from
  `lib/utils`, io5 time-of-day icon in orange, the first name in orange, **no "!"**, **no avatar**
  (the 44 px navbar trigger at `:158-177` stays — that is the button, not the banner). One size down
  from the hero (`text-lg`, not `text-xl md:text-2xl`): it is a 352 px panel.
- "Verified" moves under the greeting as a line, io5 `IoCheckmarkCircle` in `green-dark` on the purple;
  same gate (`emailConfirmed && yoIDOnboarded`, `:249`).
- The ⓘ "What is Yo-ID?" sits in the banner next to Close (it still opens `YoIdModal`); the "My Yo-ID"
  label row (`:317-331`) goes — the banner *is* "my Yo-ID".
- Profile / Settings / My preferences become idle pills with io5 icons; `onClick` closes the drawer
  and `tabIndex` follows `isDrawerOpen` as today. The pills are `justify-start`, wrapping to a second
  row only if the names do not fit (they fit at 352 px: ≈ 92 + 100 + 142 px).

**3b. Sections — four `DetailDisclosure`s, the overview's.** Replaces `:333-493`. Body wrapper:
`<div class="flex flex-col gap-3 p-4">`. Each section takes `YOID_TABS[id]` for its icon and label and
the overview's tone (`TONE.gold` / `lilac` / `blue` / `green`), `note` = `YOID_TABS[id].blurb` while
open, `bodyClassName="px-5 pb-5"` (§3d — the 74 px desktop indent would leave 258 px for content).
Order and open-by-default rule — **open: the two the youth checks at a glance (balance, progress);
closed: the two that lead to a list** — each toggles locally (`useState` in `UserMenu`, kept while
the navbar lives):

| # | Section | Tone / icon | Default | Count · preview (closed) | Body (open) |
|---|---|---|---|---|---|
| 1 | Wallet | gold · `IoWalletOutline` | **open** | `walletPreview(userProfile)` — "N ZLTO available" / "Your ZLTO rewards" | `Suspense(!userProfile)` → `WalletCard`; then `SectionLink wallet` |
| 2 | Passport | lilac · `IoIdCardOutline` | closed | count = sum of `totalCount`; "Your verified credentials" / "Update in progress" | `passport_enabled` ? `Suspense` → `PassportCard onClick={close}` : the existing `NoRowsMessage` (`:472-478`); then `SectionLink passport` |
| 3 | Opportunities | blue · `IoTrophyOutline` | **open** | `opportunitiesPreview(summary)` — "37 completed · 34 pending · 30 saved" | `flex justify-end` → the overview's Graph pill (`PILL_CLASS min-h-9` + `PILL_PRESSED_CLASS`/`PILL_IDLE_CLASS`, `aria-pressed`, `IoStatsChartOutline`); `Suspense` → `graphView ? LineChart forceSmall : OpportunitiesSummary onClick={close}` (three circles, no Saved — four in a row at 258 px would be 56 px each); then `SectionLink opportunities` |
| 4 | Skills | green · `IoFlashOutline` | closed | count = `skills.length`; "Skills you've earned" | `Suspense` → `SkillsCard onClick={close}` (eight chips + "Show all N →", no scroll box, no `max-h`); then `SectionLink skills` |

- `SectionLink` is the overview's "Open … →" (`index.tsx:68-76`), with an `onClick` so the drawer
  closes; the orange "Open Passport" button (`:484-492`) is gone.
- Previews come from the same helpers the overview uses (§3c) — one wording on both surfaces.
- No CV row in the drawer: it has nothing to open and the drawer is a summary.
- `LoadingInline` spinners (`:347`, `:384`, `:422`, `:463`) → the overview's `TileBodySkeleton` /
  `SummaryCirclesSkeleton` (`YoIDSkeletons.tsx`).
- Motion: `DetailDisclosure`'s own 220 ms ease (`motion-reduce` honoured); daisyUI's drawer slide
  unchanged.

**3c. Shared pieces (so the drawer and the overview cannot drift).**

- `components/YoID/yoidTabs.ts`: `walletPreview(profile)` and `opportunitiesPreview(summary)` next to
  `zltoAvailable`, moved verbatim from `index.tsx:260-273`; the overview imports them.
- `components/YoID/SectionLink.tsx`: the overview's `SectionLink`, plus `onClick?: () => void` and
  `tabIndex?`. The overview imports it.
- `components/YoID/PassportCard.tsx`: `onClick?` on the pills (`:69-74`), as `SkillsCard` has.

**3d. `DetailDisclosure` — one additive prop.** `components/Opportunity/TabbedDetails/DetailDisclosure.tsx:169`:
`bodyClassName?: string` defaulting to `"px-5 pb-5 md:pl-[74px]"` (today's literal); the drawer passes
`"px-5 pb-5"`. Nothing else in the component changes; every existing caller keeps its indent.

**3e. Chrome.** Delete the map/stamp `Image`s (`:204-229`) and their imports, `Common/Header` (`:31`,
and the file `components/Common/Header.tsx` — the drawer was its last consumer), `FaArrowRight`,
`IoIosCheckmarkCircle`, `IoIosInformationCircleOutline`, `IoMdClose`, `MdKeyboardArrow*`,
`isCollapsedPassport`. Foot: `<div class="mt-auto flex flex-col gap-3 pt-2">` with
`<SignOutButton class="!btn-sm w-full" tabIndex=… />` — the `bg-theme` purple, Nunito button stays;
the `divider` rows (`:314`, `:496`) go, the gaps do the separating.

## 4. Copy

| `file:line` | Current | New |
|---|---|---|
| `pages/yoid/wallet/[[...query]].tsx:229-236` | "{blurb} Browse the marketplace to see what your ZLTO can buy; products you buy appear under My Products." (`YoIDIntro`) | removed — replaced by the explainer tile |
| `pages/yoid/wallet/[[...query]].tsx:241` | "My Wallet" | unchanged |
| `pages/yoid/wallet/[[...query]].tsx` (new tile) | — | "How ZLTO works" |
| `components/YoID/WalletInfoCard.tsx` (new) | — | "Earn it, then spend it" |
| ″ | — | "ZLTO is Yoma's reward. Complete an opportunity, get it verified, and the ZLTO lands here." |
| ″ | — | "Every verified opportunity pays the ZLTO shown on its page." |
| ″ | — | "Pending rewards are on their way — allow up to 24 hours." |
| ″ | — | "Spend what is available in the marketplace; what you buy appears under My Products." |
| ″ | — | "Browse the marketplace" · "Find opportunities" |
| `pages/yoid/index.tsx:57-60`, `:201-203` | comments: Wallet and Passport share a row; the rest span | each row holds two sections; only CV spans |
| `components/NavBar/UserMenu.tsx:247` | `{session?.user?.name ?? "Settings"}` | "Good {timeOfDay}, {firstName}" (no "!"; "Good {timeOfDay}" alone without a first name) |
| `components/NavBar/UserMenu.tsx:251` | "Verified" | "Verified Yo-ID" |
| `components/NavBar/UserMenu.tsx:281`, `:291`, `:308` | "Profile", "Settings", "My preferences" | unchanged (now pills with icons) |
| `components/NavBar/UserMenu.tsx:319` | "My Yo-ID" | removed |
| `components/NavBar/UserMenu.tsx:327` | title "What is Yo-ID?" | unchanged (also `aria-label`) |
| `components/NavBar/UserMenu.tsx:337` | "💸 Wallet" | `YOID_TABS.wallet.label` — "Wallet" |
| `components/NavBar/UserMenu.tsx:361` | "🏆 Opportunities" | `YOID_TABS.opportunities.label` — "Opportunities" |
| `components/NavBar/UserMenu.tsx:373-375` | "📈 View Graph" / "📋 View Summary" | "Graph" (pill, `aria-pressed`) |
| `components/NavBar/UserMenu.tsx:410` | "⚡ Skills" | `YOID_TABS.skills.label` — "Skills" |
| `components/NavBar/UserMenu.tsx:445` | "🌐 Passport" | `YOID_TABS.passport.label` — "Passport" |
| `components/NavBar/UserMenu.tsx:473-475` | "Update in Progress" / "Credentials will begin displaying again soon. Thanks for your patience." | unchanged |
| `components/NavBar/UserMenu.tsx:490` | "Open Passport" (button) | "Open Passport →" (`SectionLink`) — plus "Open Wallet →", "Open Opportunities →", "Open Skills →" |
| `components/NavBar/UserMenu.tsx:259-267` | close `title="Close"`, `aria-label="close sidebar"` | `aria-label="Close"`, `title="Close"` |

## 5. Acceptance checks

**Wallet — 1440** (`wallet-1440.png` to compare): under "Yo-ID › Wallet", two tiles on one row, each
≈ 616 px, same height; left "My Wallet" with the ledger (Available / Pending rewards / Total, dashed
leader, "What is ZLTO?"), right "How ZLTO works" with a 56 px gold-tinted square holding a solid wallet
icon, a Nunito bold line "Earn it, then spend it", one sentence, three icon bullets, and two white pills
"Browse the marketplace" / "Find opportunities" at the foot. No `YoIDIntro` strip. "My Products" full
width below, unchanged (the "still being set up" panel for `testuser`). **1024:** the same two columns
at ≈ 488 px; nothing clipped; pills may wrap to two rows. **390:** one column — My Wallet, then How ZLTO
works, then My Products; the explainer's icon square and text sit side by side, bullets under.

**Overview — 1440** (`overview-1440.png`): three rows — Wallet | Passport, Opportunities | Skills, CV.
Opportunities' four circles fill their card with the Graph pill above right; Skills' chips wrap in a
half-width card. Card tops align within a row; a card does not stretch to its neighbour (collapse
Wallet: Passport keeps its height). The hero chips' order matches the cards' order; the sticky bar's
highlight follows the rows (scroll Opportunities | Skills under the bar → "Opportunities" lights). **1024:**
same, circles ≈ 89 px. **390:** one column, Wallet, Passport, Opportunities, Skills, CV.

**Drawer — 1440** (`drawer-1440-0.png`, `drawer-1440-1.png`): a 352 px panel on `gray-light`; a purple
banner with the faint world map, "☀ Good morning, **Test**" (first name orange, no "!", no avatar),
"✓ Verified Yo-ID", ⓘ and × top right, then three white pills Profile / Settings / My preferences with
icons. Below: four white bordered cards with the overview's tinted icon squares — Wallet (open, the
ledger, "Open Wallet →"), Passport (closed, "Passport · 130", "Your verified credentials"),
Opportunities (open, Graph pill, three circles, "Open Opportunities →"), Skills (closed, "Skills · 84",
"Skills you've earned"); the purple Logout at the foot. Tapping Passport opens it (two pills), tapping a
pill or any "Open … →" navigates and closes the drawer. No emoji, no cream, no stamps, no inner scroll
box. **390:** the same panel at 352 px with ≈ 38 px of overlay; the section bodies have the 20 px
indent, the three circles fit one row.

## 6. Departures from the current build and decisions

- **Wallet ledger full width (round 2 task 8; `feature.md` 2026-10-21 "do not narrow it again").**
  Superseded by Jason's 2026-10-22 brief: the card is half the row beside the explainer. The dashed
  leaders still carry the eye at 616 px, as the overview proves.
- **"Every subpage has a `YoIDIntro` note" (2026-10-21).** The wallet page's note becomes the
  explainer tile, which is what Jason asked for; passport, skills and add keep theirs.
- **"The tile header restyle is a new `TileHeader`, not `Common/Header` — the user-menu drawer uses it
  too, so it stays" (2026-10-20).** The drawer now uses `DetailDisclosure`; `Common/Header.tsx` has no
  consumer and is deleted (clean cutover).
- **Overview Q3 (2026-10-21): "Skills, Opportunities and CV span both columns."** Skills and
  Opportunities now pair; CV still spans. Reason: Opportunities' circles were a 512 px cluster in a
  1 248 px card, and the two-column grid is the detail page's rule.
- **Overview order:** Skills ↔ Opportunities swapped to the chip order (`YOID_TABS`), so the fourth
  chip lands on the fourth card.
- **Drawer:** balance of open/closed sections is a new rule (Wallet + Opportunities open; Passport +
  Skills closed) — the old drawer had only Passport collapsible; three circles stay (no Saved) for
  width. Cream background, stamps, avatar and orange `btn-warning` buttons dropped for the Yo-ID
  language. The hero's `text-xl md:text-2xl` greeting is `text-lg` in the panel.
- **`DetailDisclosure` grows one optional prop** (`bodyClassName`); the shared component is otherwise
  untouched and every page keeps its indent.
- **No `!` to remove in today's drawer:** its banner shows the account name, not a greeting; the
  greeting it gains follows the hero's "no avatar, no '!'" decision of 2026-10-22.

## 7. Implementation tasks (one batch)

1. **Wallet page row** — `pages/yoid/wallet/[[...query]].tsx:229-249`: delete the `YoIDIntro`; the
   `grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch` with the "My Wallet" tile (first) and a
   "How ZLTO works" `YoIDTile` (`IoInformationCircleOutline`, `bodyClassName="min-h-0 justify-between
   gap-4"`) holding `WalletInfoCard`. Drop the now-unused `YoIDIntro` / `INTRO_LINK_CLASS` imports if
   nothing else on the page uses them (the pending panel at `:266` still does — keep `INTRO_LINK_CLASS`).
   - Accept: §5 Wallet 1440 / 1024 / 390.
2. **`components/YoID/WalletInfoCard.tsx`** (new) — the §1 markup and copy verbatim: `IoWallet` in the
   `TONE.gold` 56 px square, Nunito title, sentence, three icon bullets, two idle pills (`/marketplace`,
   `OPPORTUNITIES_SEARCH_URL`). No props, no data.
   - Accept: renders without a request; pills are `PILL_CLASS PILL_TOUCH_CLASS PILL_IDLE_CLASS`.
3. **Overview grid** — `pages/yoid/index.tsx`: `SECTIONS` order Wallet, Passport, Opportunities,
   Skills, no `wide`; the wrapper drops `lg:col-span-2`; the grid gains `lg:items-start`; CV keeps
   `lg:col-span-2`; comments at `:57-60` and `:201-203` updated.
   - Accept: §5 Overview; scroll-spy and chip jumps behave as before.
4. **Shared helpers** — `walletPreview(profile)` and `opportunitiesPreview(summary)` into
   `components/YoID/yoidTabs.ts` (moved from `index.tsx:260-273`); `SectionLink` into
   `components/YoID/SectionLink.tsx` with `onClick?` and `tabIndex?`; `PassportCard` gains `onClick?`
   on its pills. The overview imports all three.
   - Accept: overview previews and foot links unchanged in the browser.
5. **`DetailDisclosure.bodyClassName`** — `components/Opportunity/TabbedDetails/DetailDisclosure.tsx:169`,
   optional, default `"px-5 pb-5 md:pl-[74px]"`. Message `DevForm-2` before editing (shared component).
   - Accept: the opportunity page and the overview render pixel-identical.
6. **Drawer banner** — `UserMenu.tsx:197-312`: panel classes (§3, 352 px, `bg-gray-light`);
   `PageBackground` wrapper with the greeting (`getTimeOfDayAndIcon`, no avatar, no "!"), "Verified
   Yo-ID", ⓘ (opens `YoIdModal`) and × (io5 `IoClose`), the three pills with io5 icons; the map/stamp
   images and the avatar removed.
   - Accept: §5 Drawer banner at 1440 and 390; keyboard: Enter on the trigger opens, × closes,
     `tabIndex` still follows `isDrawerOpen`.
7. **Drawer sections** — `UserMenu.tsx:314-493`: the four `DetailDisclosure`s of §3b with the
   open-by-default rule, previews from task 4, `bodyClassName="px-5 pb-5"`, the Graph pill, the
   overview's skeletons, `SectionLink` with `onClick` closing the drawer; `isCollapsedPassport`, the
   skills scroll box and the orange "Open Passport" button removed; "My Yo-ID" row removed.
   - Accept: §5 Drawer sections; every link and pill in a body closes the drawer on navigation.
8. **Drawer chrome and dead code** — `UserMenu.tsx`: foot with `SignOutButton` `!btn-sm w-full`,
   dividers gone; unused imports (`Header`, `FaArrowRight`, `IoIos*`, `IoMdClose`, `MdKeyboardArrow*`,
   `worldMap`, `stamp1`, `stamp2`, `LoadingInline` if unused) removed; delete `components/Common/Header.tsx`.
   - Accept: `pnpm lint` clean on the file; no consumer of `Common/Header` remains (grep).
9. **Docs** — `YOM-1283/feature.md`: a 2026-10-22 Decisions entry recording §6 (the superseded
   full-width wallet line, the `YoIDIntro` exception, `Common/Header` deleted, the overview pairing and
   order, the drawer's rules), and a ticked task line pointing at this spec.
   - Accept: the Decisions entry is dated and names this file.

Nine tasks; presentation only — no query, gate or route changes.
