# Feature: UI — Youth Opportunity Credential Display

## Meta

- **Feature**: Youth opportunity credential display
- **Epic**: [YOM-1244](../README.md)
- **Ticket**: [YOM-1283](https://linear.app/didx/issue/YOM-1283/ui-youth-opportunity-credential-display)
- **Owner**: Jason
- **Areas**: web
- **Status**: review — merged in #2004 (`1c2ee4ed0`) and on Stage; Stage-feedback fixes on
  `fix/YOM-1283-stage-feedback`, uncommitted; credential field check on Stage pending
- **Started**: 2026-08-13

## Problem / Goal

Display issued Opportunity credentials — static, generic and type-specific custom-field
attributes plus structured Skills — through the existing youth wallet experience, rendering only
what the youth credential API returns. Scalar attributes render API-provided `nameDisplay` and
`valueDisplay` with no UI-side interpretation or formatting; the Skills attribute renders a
structured `itemsDisplay` collection (one item per Skill) alongside scalar `valueDisplay`.
Detail attributes also carry API-controlled `group`, optional `subGroup` and `sortOrder`
presentation metadata and are already returned in display order.

## Out of Scope

- Parsing provider JSON or legacy comma-delimited Skills — the API owns normalization.
- Merging fields from the Opportunity's current schema selection, the latest schema version,
  another Opportunity type or Admin schema-management endpoints; the response reflects the exact
  issued schema/version.
- Youth access to Admin schema-management endpoints.
- Any hardcoded credential fields per Opportunity type.

## Plan

The whole feature is the credential detail modal on the youth passport page, fed by one call:
`POST /ssi/wallet/user/{id}` (`SSIWalletService.ParseCredential`). The API owns everything shown —
labels, formatted values, structured item lists, group headings and the order of the collection —
so web's entire job is to render it faithfully and add nothing.

Three facts govern the implementation, all verified against the running API's schema rather than the
ticket:

1. **Attributes are detail-only.** `ParseCredential` returns before populating them for
   `SSICredentialInfo`, so wallet _search_ items carry no `attributes` property at all. The list
   renders the fixed header (issuer, title, date issued) and nothing else.
2. **`itemsDisplay` is authoritative for complex attributes**, and is a `[{ name }]` collection.
   `valueDisplay` flattens it for convenience but must never be split — an individual value may
   contain the delimiter. It is still the fallback: a complex attribute issued with no value comes
   back as an _empty_ item list plus the API's own `"n/a"`.
3. **The collection arrives ordered and group-contiguous**
   (`SSIAttributePresentationHelper.OrderCredentialAttributes`), with core properties and custom
   fields deliberately interleaved.

Files:

| Purpose                                                    | File                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| Grouped, item-aware attribute rendering                    | `src/web/src/components/Credentials/CredentialAttributes.tsx` |
| Passport card                                              | `src/web/src/components/Credentials/CredentialCard.tsx`       |
| `toCredentialGroups` — credentials grouped by type         | `src/web/src/lib/credentials/credentialGroups.ts`             |
| Passport chips + type sections                             | `src/web/src/components/Credentials/PassportCredentials.tsx`  |
| Wallet page — Load more, detail modal with type header     | `src/web/src/pages/yoid/passport/[[...query]].tsx`            |
| `itemsDisplay`, `typeContext`, detail-vs-list split        | `src/web/src/api/models/credential.ts`                        |
| `groupLabelOf` — shared credential heading rule (YOM-1282) | `src/web/src/lib/credentials/attributePresentation.ts`        |
| BA Review type palette, credential type key/label          | `src/web/src/lib/typeColours.ts`                              |

Sections are built as **consecutive runs** of the same group/subGroup label — not a group-by and not
a re-sort. Exact matching group/subgroup labels form one section, a null subgroup renders directly
under its group, and null-group attributes render ungrouped (no heading) after the configured groups,
which is where the API already places them. Shared contract in the
[epic README](../README.md#credential-schema-context).

### Stage round — 2026-10-20

Adrian's Stage review (2026-10-20, shared with Jason outside the repo)
reported a stale breadcrumb, passport cards with no type identity, and possibly missing fields.
Jason's direction: take the type colours from the BA Review workbook, and give the discovery
cards, the YoID opportunity cards and the passport cards one design, with the discovery card taking
precedence; group the passport by type as rails.

**The type palette** (the BA's `BA Considerations.xlsx`, Yoma Credentials sheet, revised on
2026-10-21 for AA white text and a distinct Learning / YoID — the BA sheet is
[design/2026-10-21-type-colours.md](./design/2026-10-21-type-colours.md)), as `--color-type-*` in
`styles/colors.css`:

| Type              | Token                         | Hex       | BA's original       |
| ----------------- | ----------------------------- | --------- | ------------------- |
| Job               | `type-job`                    | `#cc473d` | `#de574a` (3.77:1)  |
| Impact Action     | `type-impact-action`          | `#23836a` | `#4ca78c` (2.91:1)  |
| Event             | `type-event`                  | `#391350` | unchanged           |
| Entrepreneurship  | `type-entrepreneurship`       | `#a66700` | `#c6820f` (3.18:1)  |
| Learning          | `type-learning`               | `#007cb4` | shared `#5a6675`    |
| Other             | `type-default` (BA "Default") | `#5a6675` | unchanged           |
| YoID (family)     | `type-yoid`                   | `#a3195b` | `#3b1251` (≈ Event) |
| unknown / no type | `type-default`                | `#5a6675` | —                   |

`lib/typeColours.ts` is the single consumer of those tokens: solid (chip, action button), band
(10% tint behind the logo) and outline. It replaced `features/discovery/components/Results/typeBadge.ts`
and, on 2026-10-21, the colour fields of `opportunityTypeTheme`'s `TYPE_CONFIG` (now labels and CTA
text only), so every surface that shows a type — discovery, the YoID cards, the passport, the
detail page badge, the admin info page, the share preview, the referral task rows and the legacy
cards — reads the same token.

## Tasks

- [x] Confirm the YOM-1280 wallet contract (`nameDisplay` / `valueDisplay` / Skills
      `itemsDisplay`) is live on `feature/custom-fields-framework`.
- [x] Render all returned attributes schema-driven: scalar `nameDisplay` + `valueDisplay`
      verbatim, no type-specific formatting, option/lookup resolution or raw-value interpretation.
- [x] Render attributes under the API-provided `group` and optional `subGroup`, preserving the
      response order across both core and custom fields.
- [x] Render Skills from the structured `itemsDisplay` collection as individual items, not a delimited
      string.
- [x] Tolerate missing optional attributes without breaking credential details.
- [x] Regression: existing generic `Opportunity|Default` and historical scalar credentials
      display through the same view.
- [x] Verify against a running API with generic and type-specific issued credentials, including
      a historical credential.
- [x] Stage round: opportunity breadcrumb returns to `OPPORTUNITIES_SEARCH_URL`
      (`/opportunities/discover` while the framework is on), not `/opportunities`.
- [x] Stage round: BA Review type palette shared by discovery, YoID opportunities and passport.
- [x] Stage round: YoID opportunity cards (completed / pending / declined / saved) in the
      discovery card's design, in the shared `CARD_GRID_CLASS` grid (1 / 2 / 3 / 4 columns at
      600 / 900 / 1200 px).
- [x] Stage round: passport cards in the discovery card's design, typed by
      `schemaType` / `typeContext`, neutral when neither identifies a type.
- [x] Stage round: passport grouped by type — type chips, one section per type and "Load more
      credentials" (100 per load); see the 2026-10-20 "accumulates pages" decision.
- [x] Stage round: detail modal header in the type colour ("<type> · YoID") with a type pill.
- [ ] Stage round: compare actual credential-detail fields per type against the reference —
      blocked locally (see the 2026-10-20 handoff); do it on Stage now the replay is done.
- [x] Stage round (2026-10-20): the opportunity breadcrumb goes back in history when the youth
      came from discovery, else to `OPPORTUNITIES_SEARCH_URL`.
- [x] 2026-10-20: local-only passport mock for `testuser@gmail.com` (`PASSPORT_MOCK_ENABLED` in
      `api/services/credentials.ts`, fixtures in `lib/credentials/passportMock.ts`); the stale
      commented-out local fixtures in `searchCredentials` / `getCredentialById` deleted.
- [x] Remove the passport mock (PASSPORT_MOCK_ENABLED + passportMock.ts) before push — removed
      2026-10-22 in the pre-commit clean-up.
- [x] 2026-10-20 YoID ↔ discovery alignment ([spec](./design/2026-10-20-yoid-discovery-alignment.md),
      §10 tasks 1–7): shared `CARD_GRID_CLASS` (YoID grids and discovery results); the YoID
      hero, pill tabs with io5 icons and Jump to top; opportunity sub-tab pills with counts;
      passport chips, sections and "Load more credentials"; overview grid; skills tiles.
- [x] 2026-10-20: `experimental.scrollRestoration` in `next.config.mjs` (back to discovery keeps
      the results position).
- [x] 2026-10-20 review fix round: passport keeps loaded cards when Load more or a refetch fails;
      a single-type wallet shows its section uncapped with no "See all"; "See all" centres the
      focused chip in the sideways chip row; overview passport tile no longer overlaps its stamp;
      detail modal scrolls inside its rounded box; shared card classes (`lib/card.ts`), one
      `YoIDTile`, the types lookup folded into `useOpportunityTypesQuery`.
- [x] 2026-10-21 round 3 ([spec](./design/2026-10-21-round3.md) §10, all tasks): H2 detail badge
      from the palette (tabbed and classic, admin info, share preview) and the rest of the D3
      audit (`TYPE_CONFIG` colour fields deleted; `PublicBadges`, `JobCardSmall` and the legacy
      cards on the palette); B1 untyped credentials merged into "Other opportunities"; B2 "N+"
      counts; discovery skeletons on every YoID page (`YoIDSkeletons.tsx`); A1 Recently viewed as
      `OpportunityListItem` in the shared grid with Load more (old `MyOpportunity/OpportunityCard`
      deleted); C1 message above the sub-tabs; C2 greeting with the orange first name and
      `AnimatedText`; C3 paging-info typography; F1/F2 `SavedOpportunitiesLink`; R16 "Paid or
      rewarded"; R19 work schedule in the employment fact and "positions" for Jobs; the revised
      palette with the new `type-learning` token; the add page's search to
      `OPPORTUNITIES_SEARCH_URL`.
- [x] 2026-10-21 design review round 1 ([review](./design/2026-10-21-review-round1.md), tasks
      1–12 + Jason's answers): the completion form in the dialogs' chrome (`dialog.ts`); overview
      Passport pills, io5 summary circles with the Graph pill, Wallet "What is ZLTO?", reference
      chips with "Show all N →"; stacked grey card custom fields with human dates; one `YoIDIntro`
      style; full-width wallet tile; discovery's pager (`Pager.tsx`) on the five paged pages; green
      add-page search; compact skills tiles; exact "YoID Identity" count; io5 sun/moon greeting;
      `max-w-7xl` two-column overview; Submit gated until something is given.
- [x] 2026-10-21 design review round 2 ([review](./design/2026-10-21-review-round2.md), tasks
      1–8 + Jason's answers): overview Skills chips wrap (no clamp) and hide "Show all N →"
      (`showAll={false}`); summary circles cluster in a `sm:max-w-lg` band; Passport card drops
      its body intro and leads with YoID Identity; form error copy says "things"; no empty hint
      slot under the form buttons (`pb-6` on the sheet); skills page two columns on phones; the
      full-width wallet ledger recorded.
- [x] 2026-10-22 Jason's Yo-ID fix list, code items: pager info reads "Pending opportunities
      (12 of 44)"; hero loses the avatar and the "!"; no emoji in any `<title>` site-wide.
- [x] 2026-10-22 desktop wallet / overview / drawer
      ([spec](./design/2026-10-22-desktop-wallet-overview-drawer.md) §7, tasks 1–9 + Jason's
      answers): wallet page "How ZLTO works" explainer beside "My Wallet" (`WalletInfoCard`);
      overview two-up for every section in chip order; the user-menu drawer in the Yo-ID language
      (hero banner greeting, pills, `DetailDisclosure` sections); `walletPreview` /
      `opportunitiesPreview` / `SectionLink` shared; `DetailDisclosure.bodyClassName`;
      `Common/Header.tsx` deleted.
- [x] 2026-10-22 Jason's drawer / overview fix list (todo items 1–14 of the user menu): richer
      closed-row previews from the profile and the totals query; centred banner pills; "See
      graph" / "See summary" link above "Open Opportunities →" (graph default when drawable), in
      the shared `OpportunitiesBody`; `LineChart` on tokens and io5 icons; no "Show all" in
      Skills; passport chips deep-link `?type=`; wallet preview, tighter "Open" links, inline
      marketplace link; new-tab clicks let through; `YoIdModal` / `ZltoModal` in the dialog
      chrome.
- [x] 2026-10-22 Jason's second Yo-ID list (`docs/work/tmp/2026-10-22-todo (2).md`, menu /
      paging items): paging scrolls back to the results on the five paged pages
      (`usePagerScroll`); the wallet's closed row quotes the pending rewards while the wallet is
      being set up; drawer banner with a centred avatar, a one-line greeting and the verified
      mark beside it; "See graph" / "Open Opportunities →" and the skill chips get the wallet's
      spacing; the stamp stencil back on the Passport card; the hero's rotating line as
      data-driven hints; the pager info's "(12 of 44)" as sub-text.
- [ ] Design review deferred (needs a design pass, next Yo-ID ticket): skills page as a
      grouped/filterable list; Opportunities summary circles → `TONE` stat cards; scroll-spy
      "header below the bar" on short pages.
- [ ] R19 education level on the Job card — API-gated: `JobMinimumQualification` is not a
      system-controlled key and its labels need the Education lookup (ask Adrian).

## Decisions

<!-- Append-only. Date each entry. -->

- 2026-08-13: Folder created ahead of implementation as a lean planning stub; the Plan section is
  owed by the first implementation session.
- 2026-08-13: Marked blocked rather than planning — YOM-1280's youth wallet normalization and
  custom-field display-value tasks are unticked, and its interim contract (raw JSON in
  `valueDisplay` for Skills) is explicitly not to be parsed by Web.
- 2026-08-14: Supersedes the blocker above. The wallet contract is ready and includes structured
  `itemsDisplay`, API-formatted scalar values, and API-owned grouping/order metadata.
- 2026-08-18: **Sections are consecutive runs of the group label, and the response order is not
  re-derived client-side.** The epic README asked YOM-1283 to order wallet attributes through
  `attributePresentation`; reading the contract showed that ordering them at all is the wrong move.
  The API returns one already-ordered, group-contiguous collection, so a second client-side ordering
  is a second source of truth that can silently disagree — JS `localeCompare` and .NET's `OrderBy`
  do not agree on every string pair, and the API's rule also depends on configured-group precedence
  the client cannot see. `groupLabelOf` _is_ taken from the shared module, so the heading rule stays
  single-sourced; `byPresentationOrder` deliberately is not used. If a response ever arrives
  non-contiguous, runs render it as sent rather than quietly rearranging it. The epic README was
  corrected to match.
- 2026-08-18: **`itemsDisplay` renders as badges, with `valueDisplay` as the fallback for an empty
  item list.** Emptiness is load-bearing and easy to miss: a complex attribute issued with no value
  returns `itemsDisplay: []` _plus_ `valueDisplay: "n/a"`, so testing for the property's presence
  rather than its length would render an attribute with no value at all. Scalars have no item list.
  Badge styling matches the existing skills treatment on the opportunity pages.
- 2026-08-18: **The web model now separates wallet detail from wallet list.** `attributes` moved off
  `SSICredentialBase` onto `SSICredential`; `SSICredentialInfo` no longer declares it, matching the
  running API's schema, which omits the property from list items entirely. The passport page's
  `activeCredential` state was typed as the _list_ type while holding the _detail_ response — it
  happened to work only because the base declared the attributes both shared. Pre-existing.
- 2026-08-18: **Fixed, adjacent to scope:** the detail header rendered `artifactType` raw, so an
  AnonCreds credential showed youth the bare enum name `ACR`. It now goes through
  `ARTIFACT_TYPE_LABELS`, which YOM-1281 added for exactly this. The header is otherwise untouched —
  fixed headers stay outside attribute grouping by contract.
- 2026-08-18: **The detail modal's fixed scroll box was removed** (Jason), along with the list card's
  `max-h`/`max-w` clamps on issuer and title. Grouped sections make the credential detail taller than
  the flat attribute list it replaced, and an inner `md:max-h-[480px]` scroll area was the wrong
  container for it — `CustomModal` already bounds the dialog at `md:max-h-[650px]`. Worth recording
  because a fixed height looks like an intentional constraint and is easy to reinstate.
- 2026-08-18: **No mock for this surface.** Wallet reads reach the credential provider, but per Jason
  the provider serves reads fine and only schema create/update is failing, so the whole feature is
  live-testable. Nothing was added to the `credentialSchemaAdmin` façade, which still governs schema
  traffic only.
- 2026-10-20: **Type colours are the BA Review's, exactly, in one module.** Jason chose the
  workbook's colours over the two palettes already in the repo (discovery's `typeBadge.ts` and
  `opportunityTypeTheme`'s `TYPE_CONFIG`, which disagreed on Event and Impact Action). The hex
  values became `--color-type-*` tokens rather than the nearest existing token: several are close
  (Impact Action is `green-dark`'s exact value, Entrepreneurship near `yellow`), but a near match
  is a silent second palette. Learning and Other share the BA's "Default" slate by design; the
  chip label tells them apart.
- 2026-10-20: **One card language, discovery's.** The YoID opportunity and passport cards copy the
  discovery card's shape (logo on the type's tinted band, chip, reserved title / organisation /
  summary slots, type-coloured action at the foot) instead of sharing a component with it: the
  discovery card is a fixed-height box with discovery-only facts and status, and a YoID card must
  grow to the youth's own record (comment, skills, completion custom fields). Grid rows stretch to
  the tallest card. The cards drop `overflow-hidden` and round the band instead, so the status
  badge tooltips are not clipped.
- 2026-10-20: **The passport groups into type rails over a 100-credential page.** Wallet search
  filters by `schemaType` only, so a per-type rail cannot page on its own; one page of
  `PAGE_SIZE_MEDIUM` normally holds the whole wallet, and past that the pager returns and each
  page's rails cover that page. The exact fix is an API `typeContext` filter on wallet search —
  asked of Adrian in the epic README. Rail order: YoID, the Opportunity Types in lookup order, any
  type the lookup does not know, then credentials with no supported type ("Opportunity").
- 2026-10-20: **The YoID family is labelled "YoID Identity"**, the BA Review's name, and the
  detail modal header reads "<TYPE> · YoID" as in the BA mocks. A credential's type comes only
  from `schemaType` (YoID) and `typeContext`; no schema-name or title inference.
- 2026-10-20: **Not in the BA palette yet: the opportunity detail page and the legacy
  `/opportunities` cards.** Both still colour by `TYPE_CONFIG` (Event blue, Impact Action yellow),
  so a youth leaving a discovery card for the detail page sees a different Event colour. Out of
  the requested scope; left for Jason to call.
- 2026-10-20: **A temporary local passport mock, against the "No mock" decision of 2026-08-18.**
  That decision assumed the wallet was live-testable; locally every issuance for `testuser` is
  Pending, so the wallet is empty and neither the tester nor the designer can see the passport.
  The mock serves only when `NEXT_PUBLIC_ENVIRONMENT` is `local` _and_ the client session is
  `testuser@gmail.com`; server-side calls stay real. ~130 credentials shaped like Adrian's
  reference (one YoID, every Opportunity type, untyped historical ones), so the 100-per-page pager
  is reachable. To remove before push: delete `lib/credentials/passportMock.ts`, and in
  `api/services/credentials.ts` its import, `PASSPORT_MOCK_ENABLED` and the two guarded branches.
- 2026-10-20: **The opportunity breadcrumb uses browser back only when the previous in-app page
  was discovery** (Jason). `/opportunities/discover` with any query → `router.back()`, so the
  youth's filters and page are kept; a new tab, a deep link or any other previous page → a normal
  navigation to `OPPORTUNITIES_SEARCH_URL`. The link keeps its real `href` and only a plain left
  click is intercepted, so middle-click and "open in new tab" still work. The previous route is
  tracked once, app-wide, by `lib/previousRoute.ts` (`routeChangeComplete`, registered in
  `_app`); a same-path navigation (discovery's shallow query updates) does not count as leaving
  the page. **Open:** going back keeps the filters but lands at the top of the results — Next's
  pages router scrolls to top on popstate unless `experimental.scrollRestoration` is set in
  `next.config.mjs` (it is not), so the browser back button behaves the same. Raised with the lead.
- 2026-10-20: **Jason's answers to the alignment spec's open questions.**
  1. Emoji → `react-icons/io5` icons in the YoID tabs, the opportunity sub-tabs and the tile
     headings; the greeting keeps its emoji. One registry, `components/YoID/yoidTabs.ts`, gives
     the tabs, breadcrumbs and overview tiles their label and icon.
  2. Discovery's results grid (and its loading skeleton, so nothing jumps) uses the shared
     `CARD_GRID_CLASS` too.
  3. **Hero: not the spec's flat header.** The YoID band is discovery's hero band (same padding,
     purple, in flow) with the world-map stencil kept on it, through `PageBackground`'s wrapper
     mode instead of its hand-measured overlay.
  4. **Breadcrumbs stay** on the YoID subpages. The spec's page heading ("Passport" / "My
     digital credentials", …) was dropped: directly under "Yo-ID › Passport" it only repeated
     the last crumb. The skills total, which the spec moved into that heading, follows the
     breadcrumb instead (`YoIDBreadcrumb`'s `count`).
- 2026-10-20: **The passport accumulates pages** (`useInfiniteQuery`, 100 per load) and groups
  everything loaded; supersedes "type rails over a 100-credential page" above. The pager, the
  `page` query parameter and the rails' `CustomCarouselV3` are gone. Type chips show counts only
  once every credential is loaded — a partial count would misstate the youth's total.
- 2026-10-20: **The tile header restyle is a new `TileHeader`, not `Common/Header`.** The spec
  assumed `Header` served only `/yoid`; the user-menu drawer uses it too, so it stays as it was.
- 2026-10-20: **Scroll restoration is Next's own** (`experimental.scrollRestoration: true`), no
  custom system. Nothing on discovery fights it: its router updates pass `scroll: false` and its
  only `scrollIntoView` runs on a youth's action. Needs a dev-server restart to apply.
- 2026-10-20: **Scroll restoration is set**, so the breadcrumb decision's "Open" note above (back
  lands at the top of the results because `experimental.scrollRestoration` "is not" set) is
  superseded: back to discovery keeps the results position, whether by the breadcrumb or the
  browser's Back.
- 2026-10-20: **Fix round: the card pieces are shared classes, not a shared component.**
  `lib/card.ts` (which absorbed `lib/cardGrid.ts`) holds the band, logo, type chip, title and
  action classes the discovery card, the YoID opportunity card and the passport card had each
  repeated; each card adds its own layout to them. This keeps the "one card language, not one
  component" decision above — discovery's markup is unchanged. `typeBadgeClass` is the one solid
  type fill (the identical `typeButtonClass` is gone), and Learning / Other reach the BA Default
  slate through the fallback rather than their own entries.
- 2026-10-20: **Fix round: the Opportunity Type lookup is `useOpportunityTypesQuery`**, the
  existing hook on the same `opportunityTypes` key, now with `staleTime: Infinity` (a static
  lookup); the duplicate `hooks/useOpportunityTypes.ts`, with its own fetcher for the same
  endpoint, is deleted.
- 2026-10-20: **Fix round: one `YoIDTile`** (`components/YoID/YoIDTile.tsx`, with `TileHeader`)
  replaces the header-plus-body wrapper the overview repeated five times and the wallet page
  once; the body class is private to it.
- 2026-10-20: **Fix round: the detail modal scrolls its body, not its box.** The box is still
  bounded only by `CustomModal`'s `md:max-h-[650px]` (no fixed inner height, per 2026-08-18); the
  type header stays put and the body scrolls below it, ending clear of the bottom radius, so the
  scrollbar sits inside the rounded corners.
- 2026-10-21: **The legacy `/opportunities` search pages are not restyled; they are deleted before
  the production release** (Jason). Supersedes the 2026-10-20 "not in the BA palette yet" note for
  those pages: their `TYPE_CONFIG` colours stay until deletion. The opportunity _detail_ page
  (`/opportunities/[id]`) is not legacy and moves to the palette (round 3).
- 2026-10-21: **Untyped credentials are Other** (Jason, B1). `credentialTypeKey` maps a non-YoID
  credential with a null `typeContext` to `"Other"` — one rule, so the card chip, the passport
  group, the chip and the modal all read Other. The group's chip and heading say "Other
  opportunities" (`CredentialGroup.label`); the card and modal keep the type's word, "Other"
  (`typeLabel`). Supersedes the "then credentials with no supported type ('Opportunity')" clause
  of the 2026-10-20 rail-order decision: no group is keyless any more, and Other ranks by its
  lookup position.
- 2026-10-21: **A passport count that is not final reads "N+"** ("at least N" to a screen
  reader) on the type chips, the section headings and, as "See all →" with no number, the See all
  link; exact once every page is loaded. Supersedes "type chips show counts only once every
  credential is loaded" (2026-10-20): a bare partial count misstated the total, but hiding it
  left the chips empty and the headings wrong. Exact per-type counts at any wallet size remain
  API-gated (wallet-search `typeContext` filter or a facet count).
- 2026-10-21: **The type palette is the BA's, revised for AA and distinct Learning / YoID**
  (Jason: build the designer's proposal now; [BA sheet](./design/2026-10-21-type-colours.md)).
  Job, Impact Action and Entrepreneurship are darkened in lightness only until white text passes
  4.5:1; Learning gets its own blue token `type-learning` (`#007cb4`: yellow cannot carry white
  text at AA without becoming Entrepreneurship's ochre); YoID becomes berry `#a3195b`, far from
  Event. Supersedes "Type colours are the BA Review's, exactly" and "Learning and Other share the
  slate by design" (2026-10-20). Jason: "if you change Learning to blue, apply consistently on ALL
  pages" — so `TYPE_CONFIG` lost its colour fields and every former consumer (detail badge in both
  layouts, admin info page, `SocialPreview`, `PublicBadges` referral rows, `JobCardSmall` and the
  legacy `/opportunities` cards) reads `typeBadgeClass` / `typeBandClass`. The legacy cards moved
  too rather than keep a second palette until their deletion (cheapest consistent option).
- 2026-10-21: **The YoID pages load with discovery's skeleton** (Jason, B3/C4): `CardSkeleton` /
  `GridSkeleton` and the exported `SKELETON_BONE_CLASS` from `ResultSkeletons.tsx`; the YoID-only
  shapes (tile body, summary circles, skill tile, passport chips and sections, Recently viewed
  header) live in `components/YoID/YoIDSkeletons.tsx`, each `aria-hidden` with one sr-only
  "Loading…" status. `Suspense` and `LoadingSkeleton` are unchanged for the other areas. The
  passport's card placeholder is taller than a `CredentialCard` (354 vs ≈264 px at `md`), a
  one-time shift accepted to keep the identical skeleton.
- 2026-10-21: **Recently viewed is the YoID card in the shared grid with Load more** (Jason, A1):
  `OpportunityListItem` (the Saved page's config minus its badge and progress, plus "Viewed
  {date}"), `CARD_GRID_CLASS`, `useInfiniteQuery` at `PAGE_SIZE` with the passport's Load more
  block, a rail header with the exact count and an empty state. The carousel and
  `components/MyOpportunity/OpportunityCard.tsx` (its only consumer) are gone.
- 2026-10-21: **The add page's search opens `OPPORTUNITIES_SEARCH_URL`** (Jason, Q2) with the words
  in `OPPORTUNITIES_SEARCH_QUERY_PARAM` (`q` on discovery, `query` on the legacy page while the
  kill-switch is off), since `/opportunities` is deleted before production.
- 2026-10-21: **The YoID greeting takes discovery's hero design** (Jason, C2): only the first name
  in `text-orange` (Jason, Q4), the ⓘ button at the end of the heading row with an `aria-label`,
  and the welcome line as `AnimatedText` with three sentences (the third is the youth's completed
  count, else an invitation). `AnimatedText` gained `motion-reduce:transition-none` and runs no
  interval below two sentences, which also stops discovery's single-sentence hero blinking.
- 2026-10-21: **Paging info uses discovery's results-heading type** (Jason, C3): `PaginationInfo`
  is `text-base font-bold md:text-lg` in black, the "N matches for …" analogue, not the Nunito
  rail header (which names a section).
- 2026-10-21: **Discovery's YoID link is "Saved"** (Jason, F1/F2): `SavedOpportunitiesLink`, count
  `opportunityCountSaved`, `/yoid/opportunities/saved`; below `lg` the label is `sr-only` (heart
  and count, `px-3`), which fixes the 768 px overflow. The mobile row keeps the same component.
- 2026-10-21: **"Paid or rewarded" quick search is `{ incentivized: true }` alone** (Jason, BA
  R16/R23): the Pay chip's wording, decoupled from Remote (its own badge). An OR with
  ZLTO-rewarded is API-gated and not needed: `incentivized` already means any incentive.
- 2026-10-21: **Job card facts (BA R19):** the work schedule (`JobWorkSchedule`, a protected key)
  joins the employment fact as "type · schedule · duration" and the fact is named "Employment";
  a Job's status row says "positions" ("3 positions left", "No positions left") — `CardStatus`
  carries `full` so nothing compares the wording. Education level is API-gated (see Tasks).
- 2026-10-21: **Round-3 fix round** (reviewer B5/B7, tester T4, nits):
  - **YoID sub-pages: the pill row sits ABOVE the "Just completed an opportunity?" banner**
    (Jason's brief over the spec's C1 step 6; T4) — `YoIDOpportunities.tsx`.
  - **One "Loading…" status per page**, not per shape (B7): the skeleton shapes are `aria-hidden`
    and silent; each YoID page renders one `<LoadingStatus when={…}>` while any of its shapes
    shows (the overview mounted four live regions at once).
  - **A Job's Places badge says "positions" on every line** (B5): `placesNoun` is exported from
    `cardStatus.ts` and feeds the eyebrow ("Positions"), the info ("All 20 positions are taken")
    and the panel; `detailBadges.test.ts` has the Job case.
  - **`AnimatedText` under reduced motion swaps with no opacity change at all** (Jason): no
    fade-out, no blink — the sentence changes in place; the inner fade timer is cleared on unmount.
  - **Other's detail badge reads "OTHER"**, as the discovery card's chip does (spec §8); with
    that, `badgeLabel` was identical to `label` for every type and is gone from `TypeConfig`.
  - The passport and the add page share one `LoadMore` component (`components/YoID/LoadMore.tsx`);
    `credentialTypeKey` treats an empty `typeContext` as Other; the Saved count is `formatNumber`ed.
- 2026-10-21: **Yo-ID copy and overview round** (Jason, lead session, no roles):
  - **The hero's rotating line is context-sensitive.** Each tab in `yoidTabs.ts` carries
    `sentences(profile)` — what the page is for, then the youth's own numbers the profile already
    has (completed, saved, ZLTO available once the wallet exists). The overview's lines point at
    each section ("Check Passport to see your credentials"). `AnimatedText` restarts when its
    text changes and indexes modulo its length, so a shorter list never shows `undefined`. The
    👋 is gone; the greeting reads "Good morning, Test!".
  - **The overview is the opportunity page's expandable sections** (`DetailDisclosure`), one per
    tab — Wallet, Passport, Skills, Opportunities, plus a static CV row — open by default so the
    dashboard still shows its data, each ending in "Open … →". The layout's chips become
    anchor tabs on the overview (a chip opens and scrolls to its section; scroll-spy follows,
    a tap holds the highlight for 900 ms as the detail page's tabs do) and stay links on every
    subpage. **A sticky chip bar** pins under the navbar once the hero scrolls away, as the
    detail page's sticky panel. Wiring: `yoidSections.ts` (context + registrar); the overview
    registers `{ active, jump }`, the layout renders the chips from it. Tile blurbs
    (`YOID_TABS[...].blurb`) are the sections' notes.
  - **Empty states show what will fill them**: the Opportunities summary always draws its four
    circles (zeros included) and adds a "Find opportunities →" prompt only when all are zero.
  - **Wallet page** reads `zlto.walletCreationStatus` and never requests products while the
    wallet is pending: the "Your wallet is still being set up" panel replaces the API's
    validation error, with the marketplace link. Every subpage has a `YoIDIntro` note (passport,
    skills, wallet, add) saying what it holds; the add page's note links to Passport, Skills and
    Saved.
  - **Not built (idea only, Jason):** "Find more opportunities for your skills" quick links on
    the skills page — needs a skills → search mapping; recorded here, not implemented.
- 2026-10-21: **Jason's Yo-ID fix list** (developer, after a look at the built pages):
  - **Hero line ≤ ~40 characters, in a one-line box.** Every `sentences()` line in `yoidTabs.ts`
    now fits a single line at 390 ("Opportunities: completed and saved", "Wallet: the ZLTO
    you've earned"); `AnimatedText` reserves exactly one line (`h-5 line-clamp-1`, an ellipsis
    on overrun) at every width — it was two lines below `md` and `h-fit` above, so a wrap moved
    the avatar. Measured on `/yoid`: the avatar's top and the chip row's top are unchanged
    across ticks at 1440 and 390. The dead `md:text-md` class went with it. Discovery's hero
    and the classic opportunities page keep longer lines (up to 53 characters, 365px at 390),
    so they pass `linesBelowMd={2}`: a fixed two-line box on phones, one line from `md` — fixed
    either way, so nothing moves there either.
  - **`YoIDIntro` is a white card** (`shadow-custom rounded-xl bg-white p-4`) with the wallet
    card's green info icon (`text-green h-5 w-5`), `text-sm text-black` body and green links —
    the grey `Message` look sank into the page. Passport and skills copy shortened to "what the
    page holds + what to do"; skills links "Find opportunities" to discovery.
  - **Add page:** the white panel around the intro and the search is gone — the intro is its
    own card and the search sits on the page background (white input, grey button).
  - **Opportunities sub-pages: the "Just completed an opportunity?" banner sits ABOVE the
    pills** — Jason, 2026-10-21, superseding the day's earlier call (T4) that put the pills
    first.
  - **Pager info reads "Showing 12 of 37 completed"**: `PaginationInfoComponent` takes the
    page's noun (`completed` / `pending` / `declined` / `saved` / `products`) and shows the rows
    loaded through the current page and the total (no total on wallet products: "Showing 12
    products"). Only the Yo-ID pages use it, so the old "Showing 1 - 12 out of 37 results"
    wording is gone rather than kept behind a prop.
- 2026-10-21: **Design review round 1 applied** (developer; [review](./design/2026-10-21-review-round1.md)
  tasks 1–12, Jason's answers to its three questions):
  - **Q1 — the greeting's time-of-day glyph is an io5 icon, not an emoji** (Jason):
    `getTimeOfDayAndIcon()` in `lib/utils.ts` (`IoSunnyOutline` morning/afternoon,
    `IoMoonOutline` evening, one private hour helper shared with `getTimeOfDayAndEmoji`, which
    the organisation dashboard still uses) rendered in `text-orange` inside the `h1`,
    `aria-hidden`. The heading keeps discovery's `text-xl font-semibold md:text-2xl`.
  - **Q2 — Submit on the completion form is disabled until something is given** (Jason): a proof
    (any upload or pin), a non-empty custom-field value, or feedback text; derived from the form's
    watched values, with a hint under the buttons ("Add a file, a photo, a location, a field or
    feedback to submit.") linked by `aria-describedby` and `disabled:opacity-40` (the `btn`
    disabled look is overridden by the `bg-green` utility). The API's 500 on an empty submit is
    recorded for Adrian in the epic README's Cross-Area Notes. Details in the YOM-1255 Decisions.
  - **Q3 — the overview column is `max-w-7xl`, Wallet and Passport side by side from `lg`**
    (Jason): a `grid-cols-1 lg:grid-cols-2` with Skills, Opportunities and CV spanning both
    columns (`SECTIONS[].wide`); order, ids and refs unchanged. The scroll-spy picks the lowest
    _row_ whose top has passed the sticky line and, within that row, keeps the active section if
    it is in the row, else the first in order — so a Passport chip tap holds after its 900 ms.
    While wiring it, a pre-existing race was fixed: the layout reset the registered sections on
    `[path]` _after_ the overview's own register effect on first mount (child effects run
    first), so the chips stayed links until the spy changed `active`. The overview now
    unregisters in its effect's cleanup and the layout has no path reset.
  - **Overview bodies in the reference language** (tasks 2, 3, 6, 7): Passport is one line of
    `PILL_*` pills (type dot, label, count) opening the passport — "YoID Identity" via
    `credentialTypeLabel`, the Opportunity row under the palette's Other tone since per-type
    counts are API-gated; no stamp image, no emoji. The summary circles take the sub-tab
    registry's io5 icons (`YOID_OPPORTUNITY_TABS` in `yoidTabs.ts`, moved out of
    `YoIDOpportunities.tsx`) and a token conic ring (`var(--color-orange)` /
    `var(--color-green)`); "View graph" is a `PILL_PRESSED_CLASS` "Graph" pill with
    `aria-pressed`. Wallet drops the italic "ZLTO - …" line for a "What is ZLTO?" link
    (`INTRO_LINK_CLASS`) opening `ZltoModal`; the overview page's own unused `ZltoModal` state is
    gone. Skills chips are the detail page's `bg-green-light text-green rounded-full … text-[13px]
font-bold` with "Show all N →".
  - **Card custom fields** (task 4): stacked label-over-value, `font-semibold` label and
    `text-gray-dark` value (the card's "Comment:" model); `DateTime` _and_ `Date` values render
    `DATE_FORMAT_HUMAN` ("14 Oct 2026") — `Date` parsed strictly as `DATE_FORMAT_SYSTEM` with no
    UTC shift, `DateTime` through `moment.utc`.
  - **One intro style** (task 5): the sub-pages' "Just completed an opportunity?" banner and the
    add page's bottom note are `YoIDIntro` copy (the add page's sentence appended to its card).
  - **Discovery's pager on every paged Yo-ID page** (task 8): `components/YoID/Pager.tsx`
    (`page`, `pages?`, `hasNext?`, `onChange`; "Page N" with no total; nothing on a single page)
    replaces `PaginationButtons showPages={false}` on completed / pending / declined / saved and
    the wallet products (Next disabled when the page is short). `PaginationButtons` stays for
    its admin consumers.
  - **Add page search** (task 9): the submit is `!bg-green hover:!bg-green-dark !brightness-100`
    (the component bakes in `brightness-[1.12]`), in a `w-full md:max-w-[28rem]` wrapper since
    `SearchInputLarge.maxWidth` is numeric.
  - **Skills tiles compact** (task 10): `p-3 gap-1`, partner line and 24 px avatar stack on one
    row, a `div` (not a `#noaction` link) when there is no `infoURL`.
  - **Passport "YoID Identity · 1"** (task 12): `groupCount` is exact when the wallet is complete
    or the group is `YOID_TYPE` (one identity credential by contract); other groups keep "N+"
    while a page is pending.
  - **Deferred** (review): the skills page as a grouped/filterable list; the summary circles as
    `TONE` stat cards.
- 2026-10-21: **Design review round 2 applied** (developer; [review](./design/2026-10-21-review-round2.md)
  tasks 1–8 and Jason's answers to its two questions).
  - **Q1 — skills page ships two columns on phones now** (Jason): `grid grid-cols-2 gap-3
min-[600px]:grid-cols-3 min-[900px]:grid-cols-4` on the skills page only (task 7);
    `CARD_GRID_CLASS` stays one column under 600 px for the card pages. The grouped / filterable
    skills list is a later ticket.
  - **Q2 — the summary circles release as they are** (Jason): the cleaned-up io5/token circles stay
    on the overview, clustered in a `mx-auto sm:max-w-lg` band inside the wide card (task 3). The
    four `TONE` stat cards are deferred to the next Yo-ID ticket.
  - **Overview Skills** (tasks 1, 2): the chip is `inline-flex max-w-full items-center` with no
    `line-clamp-1` — a long name wraps inside the pill as `ChipList` does. `SkillsCard` takes
    `showAll?: boolean` (default `true`); the overview passes `false` because its foot "Open
    Skills →" already leads there and the title carries the count; the user-menu drawer keeps
    "Show all N →".
  - **Passport card** (task 4): the body intro sentence is gone (the header note says it); pills
    sort YoID Identity first, as the passport page does.
  - **Completion form** (tasks 5, 6): the footer error row says "thing(s)" like the summary; the
    `mb-10 min-h-4` hint slot is gone — the hint `<p>` renders only while nothing is given and the
    sheet's padded column carries `pb-6`, so an enabled form ends ≈ 24 px under the buttons.
  - **Wallet page ledger stays full width** (task 8, no code change): the round-1 full-width card
    with the ledger's dashed leaders carrying the eye is intentional; do not narrow it again.
- 2026-10-22: **Jason's Yo-ID fix list** (developer, code items; the wallet/overview/drawer
  design items follow the designer's spec):
  - **Pager info reads "Pending opportunities (12 of 44)"** — the list's name first, the count in
    brackets; "Products (12)" on the wallet, which has no total. `PaginationInfoComponent` takes
    `label` (capitalised, "Completed opportunities") instead of `noun`; typography unchanged.
    The passport's Load more block is a different component and is untouched.
  - **The hero greeting has no avatar and no "!"**: "Good morning, Test" with the io5 time-of-day
    icon and the ⓘ button, centred. `UserInitialsAvatar` leaves `Layout/YoID.tsx`; the avatar's
    `shrink-0` column and its wrapper row are gone, so the greeting column is the band's child
    directly. `AnimatedText`'s one-line box stays (it now protects the chip row, not the avatar).
  - **The user drawer (`UserMenu.tsx`) has no greeting of its own** — a cream banner with the
    avatar, the user's name and "Verified" — so nothing there changes in this round.
  - **No emoji in `<title>`**: every page title is "Yoma | Opportunities" style (admin and
    organisation pages too, `Layout/Marketplace.tsx`, the referral pages' "Refer a friend");
    "⚡Skills" / "💰Treasury" read "Skills" / "Treasury". Wording otherwise unchanged.
- 2026-10-22: **Desktop wallet, overview and the user-menu drawer** (developer;
  [spec](./design/2026-10-22-desktop-wallet-overview-drawer.md) §7 tasks 1–9, Jason's answers to
  its two questions). Presentation only: the same queries, gates and links.
  - **Q1 — the wallet page row reads explainer LEFT, balance RIGHT** (Jason): under the
    breadcrumb, `grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch` with the "How ZLTO
    works" `YoIDTile` (`IoInformationCircleOutline`, body `justify-between`) first and "My Wallet"
    second, so the explainer leads on a phone too. `WalletInfoCard` is new, presentation only:
    the gold 56 px `IoWallet` square, "Earn it, then spend it", three io5 bullets paraphrasing
    `ZltoModal`, idle pills to `/marketplace` and `OPPORTUNITIES_SEARCH_URL`. Supersedes **"Wallet
    page ledger stays full width … do not narrow it again"** (2026-10-21 round 2, task 8): the
    ledger is half the row beside the explainer; its dashed leaders read fine at 616 px, as the
    overview showed. The wallet page's `YoIDIntro` is gone — the explainer tile is its note —
    an exception to **"every subpage has a `YoIDIntro` note"** (2026-10-21); passport, skills
    and add keep theirs. `YOID_TABS.wallet.blurb` still serves the overview.
  - **Q2 — drawer sections: Wallet and Opportunities open, Passport and Skills closed by
    default** (Jason): the two the youth checks at a glance open, the two that lead to a list
    closed; each toggles locally (`useState` in `UserMenu`, kept while the navbar lives).
  - **Overview: every data section is half width from `lg`, in the chips' order** — rows
    Wallet | Passport, Opportunities | Skills, then the static CV row spanning. Supersedes
    **"Skills, Opportunities and CV span both columns"** (2026-10-21, Q3): Opportunities' four
    circles were a 512 px cluster in a 1 248 px card, and two columns is the detail page's rule.
    The grid gains `lg:items-start` (a card never stretches to its open neighbour). Skills ↔
    Opportunities swapped so the hero's fourth chip lands on the fourth card; the scroll-spy's
    tied-row rule already covers every row, so `jump`, refs and ids are unchanged.
  - **The drawer takes the Yo-ID pages' language.** A 352 px `bg-gray-light` panel
    (`w-[22rem] max-w-[calc(100vw-2rem)]`); a `PageBackground` wrapper banner with the hero's
    greeting one size down (`text-lg`, io5 time-of-day icon and first name in orange, **no
    avatar, no "!"**, following the 2026-10-22 hero decision — today's drawer had no greeting to
    strip), "Verified Yo-ID" with `IoCheckmarkCircle`, ⓘ (opens `YoIdModal`) and × (`IoClose`,
    `aria-label="Close"`) top right, Profile / Settings / My preferences as idle pills with io5
    icons; four `DetailDisclosure`s (`YOID_TABS` label and icon, the overview's `TONE`, blurb as
    note, `bodyClassName="px-5 pb-5"`), the overview's skeletons, the Graph pill, three summary
    circles (no Saved: four would be 56 px each at 258 px), `SectionLink` "Open … →" closing the
    drawer; the purple `SignOutButton` at the foot. Cream background, stamps, map images, emoji
    headings, the skills scroll box, the orange `btn-warning` buttons, the "My Yo-ID" row and
    the dividers are gone.
  - **Shared so the drawer and the overview cannot drift:** `walletPreview(profile)` and
    `opportunitiesPreview(summary)` in `yoidTabs.ts`; `components/YoID/SectionLink.tsx`
    (`onClick?`, `tabIndex?`); `PassportCard` `onClick?` on its pills.
  - **`DetailDisclosure` grows one optional prop**, `bodyClassName` (default today's
    `"px-5 pb-5 md:pl-[74px]"`); every existing caller keeps its indent.
  - **`Common/Header.tsx` is deleted.** Supersedes **"the tile header restyle is a new
    `TileHeader`, not `Common/Header` — the user-menu drawer uses it too, so it stays"**
    (2026-10-20): the drawer now uses `DetailDisclosure`, and no consumer remained (grep).
  - **Built-and-looked (1440 / 1024 / 390, `~/.cache/cdp-tools/shots/2026-10-22-desk/`):** the
    banner's ⓘ and × sit in the band's padding (`-mt-2.5 -mr-3`, the hero's `-m-2.5` idea) — at
    the spec's `gap-1` buttons "Good morning, Test" wrapped onto two lines in the 352 px panel;
    with the pull it is one line at every width. Scroll-spy on the paired row: at 390 (page
    scrolls) the Opportunities | Skills row lights "Opportunities"; at 1440 / 1024 the overview is
    shorter than the viewport plus the sticky offset (≈ 1 000 px), so the second row can never
    reach the spy line — the already-deferred "scroll-spy on short pages" item, not new.
- 2026-10-22: **Jason's drawer / overview fix list (`docs/work/tmp/2026-10-22-todo.md`)**
  (developer, second round):
  - **Closed rows say more, from data already in hand.** `yoidTabs.ts` now holds four previews:
    `walletPreview(profile)` — "x available · x pending · x total" (`formatZlto`; pending is
    `pendingRewards`, the ledger's movement) once the wallet is `Created` and `available` is not
    null, else "Your ZLTO rewards"; `opportunitiesPreview(profile)` — the four
    `YOID_OPPORTUNITY_TABS` counts from the **profile**, not the summary query (supersedes
    `opportunitiesPreview(summary)`): it shows before any request answers and the circles only
    repeat it; `passportPreview(rows)` — "1 YoID Identity · 129 Opportunities" from
    `passportRows` (the totals query), zero families dropped; `skillsPreview(skills)` — the first
    three names then "…" (the count already sits beside the title). The drawer's totals query now
    runs as soon as the drawer opens (was: when the Passport section opened) — the same two
    requests, earlier, so the closed row has its counts; no new call.
  - **`DetailDisclosure`'s closed preview clamps to two lines (`line-clamp-2`, was `truncate`).**
    Four counts cannot sit on one line in the 352 px drawer; on the opportunity page the previews
    are short and still take one line. Jason asked for the counts, so the shared chrome bends.
  - **Banner pills:** a `grid-cols-2` — Profile | Settings equal width, My preferences
    `col-span-2` — every pill `justify-center` (`DRAWER_PILL_CLASS`). Cash out is already
    `w-full` inside the ledger's actions slot (`CashOutButton`), nothing to do.
  - **Graph toggle is a text link above "Open Opportunities →"**: "See graph" / "See summary"
    in `SECTION_LINK_CLASS`, in a new shared `components/YoID/OpportunitiesBody.tsx` that both
    the drawer (`forceSmall`, three circles) and the overview (`showSaved`) render. **Default:
    the graph when `hasChartData(summary)`** — at least two distinct dates with a non-zero value;
    otherwise the chart would open on its own "Not enough data" note, so the circles lead. The
    youth's pick wins once made (`choice` state), until the section remounts.
  - **`LineChart` design pass:** legend rows take their label, io5 icon and URL from
    `YOID_OPPORTUNITY_TABS` by series index (the API's "Rejected" used to build
    `/yoid/opportunities/rejected`, a 404 — it is `declined`); the emoji are gone; the count sits
    in a `bg-gray-light` capsule; the series colours are the tokens `green / blue / pink /
orange` read from `:root` with `getComputedStyle` (Google Charts paints SVG attributes, so a
    `var()` cannot be handed to it) and the legend underline / icon use the same token classes.
    The summary is no longer mutated (`x.date = new Date(...)` wrote into the react-query cache).
  - **Skills:** `SkillsCard` loses "Show all N →" and its `onClick` / `showAll` props: "Open
    Skills →" leads to the same URL. Its empty-state emoji is `IoFlashOutline`; the three
    "Update in progress" gears are `IoConstructOutline`.
  - **Passport chips deep-link:** `passportRows(data)` (exported from `PassportCard.tsx`) gives
    each family its `href` — **YoID Identity → `/yoid/passport?type=YoID`**, Opportunities →
    `/yoid/passport`. The Opportunities row spans every opportunity type and the passport has no
    "all opportunities" chip (per-type counts are API-gated, see 2026-10-20), so All is the
    honest landing. The passport page reads `?type`, hands it to `PassportCredentials`'s
    `initialKey` (a key not among the loaded groups starts on All) and **strips the param**
    (shallow `router.replace`, as discovery's `?personalize`): the param is an instruction, not
    state, so a chip pressed afterwards cannot contradict the URL.
  - **"Open … →" is a real link, and new-tab clicks work everywhere in the drawer.**
    `SectionLink` keeps `next/link` and takes `onFollow` (was `onClick`); `isPlainClick(e)`
    (`button === 0`, no modifier) gates every drawer close — `SectionLink`, the banner pills,
    `PassportCard`, `OpportunitiesSummary` and the chart legend (`onClick` typed
    `MouseEventHandler<HTMLAnchorElement>`). A middle / ctrl / cmd click opens the tab and the
    drawer stays. `SECTION_LINK_CLASS` is shared with the graph toggle; the link's margin is
    `mt-2` (was `mt-3`) and the drawer body `pb-4` — the white under the links is gone.
  - **`WalletInfoCard`** links "marketplace" inline (`INTRO_LINK_CLASS`) in its spend bullet;
    the two pills stay. `WalletCard`'s empty note is `NoRowsMessage` HTML and keeps its text.
  - **`YoIdModal` and `ZltoModal` in the dialogs' chrome** (`dialog.ts`, `animationStyle="rise"`,
    `md:w-[600px]`): a `TONE.lilac` / `TONE.gold` icon circle (`IoIdCardOutline` /
    `IoWalletOutline` — the passport webp and ZLTO svg are gone), `DIALOG_HEADING`, one line of
    intro, `DIALOG_EYEBROW` sections of `DialogStep` rows, one `DIALOG_PRIMARY` "Got it". The
    ZLTO intro links the marketplace. `DialogStep` moved to `components/Common/DialogStep.tsx`,
    shared by `OpportunityPublicDetails.tsx` (its local copy deleted) and the two Yo-ID dialogs.
  - **The drawer banner is `bg-purple!`.** `PageBackground` paints `bg-theme`, which follows the
    page's `data-theme` — white on the home page, where the greeting was white on white
    (built-and-looked). The drawer is the same panel on every page, so its band is pinned.
  - **Built-and-looked (1440 / 390, `~/.cache/cdp-tools/shots/2026-10-22-drawer/`):** pills
    Profile | Settings 147 px each, My preferences 302 px, centred; closed rows read
    "1 YoID Identity · 129 Opportunities" and the first three skill names; "See graph" sits
    above "Open Opportunities →" in both places; ctrl-click on "Open Wallet →" leaves the drawer
    open; the YoID Identity pill lands on `/yoid/passport` (param stripped) with that chip
    pressed and its section alone. The test user's summary has one date (`2026-10-25`), so the
    chart cannot draw and both surfaces default to the circles — the graph shows the "Not enough
    data" note on toggle, now with an io5 icon. Below `md` the two stacked 44 px text links in the
    Wallet body ("What is ZLTO?", "Open Wallet →") still show the touch-target gap; that is the
    rule, not padding.
- 2026-10-22: **Jason's second Yo-ID list (`docs/work/tmp/2026-10-22-todo (2).md`): menu and
  paging items**
  - **Paging scrolls to the results (`components/YoID/usePagerScroll.ts`).** Discovery's rule
    (`DiscoveryResults`: a page change is a scroll trigger, nothing else is) on the five paged
    Yo-ID pages: completed / pending / declined / saved and the wallet's products. The pages keep
    pushing the page number into the URL, now with `scroll: false` so Next's own jump to the top
    of the page cannot race the hook; the hook watches the `pageNumber` prop and scrolls its ref
    into view — the box around the list (`<Suspense>` on the opportunity pages, the "My
    Products" column on the wallet), which stays mounted while the next page loads, so no retry
    loop is needed (discovery retries because its anchor sits behind a closing overlay).
    `scroll-mt-[148px]` (`PAGER_SCROLL_MARGIN_CLASS`) clears the fixed navbar and the sticky
    chip bar (`STICKY_OFFSET_PX` + `LANDING_GAP_PX`); reduced motion gets `behavior: "auto"`;
    the first render never scrolls.
  - **Wallet closed row while the wallet is pending.** `walletPreview` returned the bare "Your
    ZLTO rewards" for any wallet other than `Created` — the test user's wallet is `Pending`
    with 13 366 pending rewards, so the row said nothing (Jason: "not working"). The profile
    always carries `pendingRewards`, so a pending wallet now reads "Wallet being set up ·
    13,366 pending" and an unreachable provider "Balance unavailable · N pending"; the
    three-figure line stays for a created, reachable wallet; "Your ZLTO rewards" only until the
    profile has loaded. `DetailDisclosure` was not at fault: `note` never hides the preview and
    the drawer passes no `status`. The row is open by default in the drawer (2026-10-22), so the
    preview shows once the youth collapses it.
  - **Link spacing.** `OpportunitiesBody`'s link column takes `md:gap-2`, the wallet's gap
    between "What is ZLTO?" and "Open Wallet →" (below `md` the 44 px rows already space them).
    The Skills "Open Skills →" takes `SKILLS_LINK_CLASS` (`mt-1 md:mt-3`, exported from
    `SectionLink.tsx`) in the drawer and on the overview: the chips are dense, `md:mt-2` read as
    touching.
  - **Drawer banner.** A centred 48 px `UserInitialsAvatar` (`alt=""`, the greeting names the
    youth) leads; the greeting under it is `text-base` (was `text-lg`), `whitespace-nowrap
truncate`, centred, with "Verified Yo-ID" to its right in the same row (`shrink-0`, so the
    greeting truncates before the mark moves). **The mark's text drops before the greeting
    truncates, measured, not counted:** a `useLayoutEffect` lays the row out with the text,
    reads `scrollWidth > clientWidth` on the greeting and, if so, sends the text `sr-only`
    (`markIconOnly`; the `title` stays) — re-measured when the name, the time of day or the
    viewport changes. A character count was tried first (24) and was 2 px wrong for
    "Good afternoon, Test" at 1440; the font decides. The What-is-Yo-ID and Close targets are
    `absolute` at the band's top-right corner, over the avatar row, so the avatar centres on the
    panel. `displayName` is computed once and shared with the navbar's toggle avatar.
  - **Stamp stencil on the Passport card** (`public/images/stamp-1.png`, as the previous
    design): `next/image` `alt=""` `aria-hidden`, `opacity-40`, `w-16 md:w-20`, `shrink-0` in a
    `flex items-center justify-between` row beside the pills — right-middle of the body, in
    flow, so it never overlaps a pill (the previous card positioned it `absolute` and the
    2026-10-20 fix round had to stop it overlapping). Not shown with the empty-state note.
  - **Rotating line = hints.** `yoidTabs.ts` builds one `hints(profile)` set from the profile
    alone — "13,366 ZLTO ready to spend" (`zltoAvailable`), "N ZLTO on its way"
    (`pendingRewards`), "N opportunities pending verification", "N opportunities saved to pick
    up", "Open Passport to see your credentials" (any completion) else "Complete an opportunity
    to earn ZLTO", and "Find a new opportunity" — and each tab lists the ones that belong to it
    (`lines()` drops the nulls). "Welcome to your Yo-ID", the section blurbs and "Spend ZLTO in
    the marketplace" without a balance are gone; the wallet keeps that line only when there is a
    balance to spend. Every line ≤ 40 characters at four-digit counts.
  - **Pager info sub-text.** `PaginationInfoComponent` renders the label in the heading
    typography and "(12 of 44)" as `text-sm font-normal text-gray-dark`, `items-baseline`, on
    every page that uses it (the four opportunity lists and the wallet's "Products (12)").
  - **Built-and-looked (1440 / 390, `~/.cache/cdp-tools/shots/2026-10-22-menu/`):** Next on
    `/yoid/opportunities/completed` lands `?page=2` with the count line's top at 148 px (both
    widths; `scrollY` 277 / 274, not 0); the count line reads "Completed opportunities" bold with
    "(12 of 44)" at 14 px / 400 / `gray-dark`; the hero hint is "Add a completed opportunity";
    the drawer's collapsed Wallet row reads "Wallet being set up · 12,791 pending" (the test
    user's wallet is Pending), Opportunities "44 completed · 34 pending · 29 declined · 30
    saved"; "Good afternoon, Test" fits beside "Verified Yo-ID" untruncated at both widths; a
    simulated "Bartholomew" keeps the row (mark icon only, no truncation); the stamp is 80 × 60
    (64 × 48 at 390) at opacity 0.4, overlapping no pill; "See graph" → "Open Opportunities →"
    gap 8 px at `md` (0 at 390 inside the 44 px rows), chips → "Open Skills →" 12 px (4 at 390).
- 2026-10-22 (Jason): **Drawer identity block restored to the previous design** — 80 px
  picture, the name under it (truncated at 200 px), then "Verified" with the green check, all
  centred, on the purple banner. Supersedes today's one-line greeting + "Verified Yo-ID" row; the
  drawer has no greeting (the Yo-ID hero keeps its own) and the overflow-measuring effect is gone.
- 2026-10-22 (Jason): **"How ZLTO works" no taller than "My Wallet".** `WalletInfoCard` is
  compact — a 40 px icon + headline row and three one-line bullets with the opportunity and
  marketplace links inline; the pill row is gone. Measured equal bodies: 156 px at 1440, 176 px
  at 1024.
- 2026-10-22 (Jason): **A card's links share one row, the "Open … →" link first, spread
  `justify-between`**: "Open Wallet →" left, "What is ZLTO?" right; "Open Opportunities →" left,
  "See graph/summary" right (overview and drawer). `WalletCard` takes the section link as a
  `link` prop (the wallet page passes none); `OpportunitiesBody` orders its row the same way.
  Link rows are 32 px below `md`, 24 px from it, with no gap between stacked links.
- 2026-10-22 (Jason): **The wallet page uses the overview / user-menu section cards** for its two
  cards: My Wallet (gold) and How ZLTO works (blue) are `DetailDisclosure`s — icon square, title,
  note, chevron, open by default, collapsed preview from the same data (`walletPreview`) — sharing
  a row from `lg`. `WalletInfoCard` is the bullets only (the header carries icon and headline).
  **My Products is not a card** (Jason, same day: it is a list of results): a rail-style Nunito
  heading with its icon over the product grid / pending / empty panels, spanning the row.
  `YoIDTile` / `TileHeader` had no consumer left and are deleted.
- 2026-10-26 (Jason, Stage feedback): **The Opportunities section opens on the summary
  circles, whatever the data.** Supersedes 2026-10-22's "graph whenever it can draw one";
  "See graph" still switches for the session. `hasChartData` is internal to `LineChart` again.
  Its loading skeleton is two circles, not four (Jason, same day).
- 2026-10-26 (Jason): **Empty states say what's missing, what fills it, and the next step.**
  One `EmptyState` (`components/YoID/EmptyState.tsx`): the section's icon on its tint, a short
  title, one line, and usually "Find opportunities →". `card` variant (dashed outline, icon
  left) in the overview / drawer cards — Wallet, Passport, Skills and the not-enough-data graph;
  `page` variant (centred, Nunito title) on Completed, Pending, Declined (no action), Saved,
  Recently viewed, Skills, Passport and My Products ("Go to the marketplace →"). The collapsed
  previews of empty Passport / Skills read "No credentials yet" / "No skills yet". Wallet's
  page-2+ "no more products" panel is unchanged.
- 2026-10-26 (Jason): **The top bar doesn't shift while it loads.** "Refer a friend" waits on
  the runtime env, so the youth bar holds its place with a bone of the same width (174 px at
  1440, measured) until the env answers; the avatar slot shows a 44 px bone while the session
  or the profile loads. Bones are the bar's text colour at 20% (`navBone.tsx`), so they read on
  every page theme. Measured under throttling: "Home" stays at x 376.5 through both swaps. Not
  covered: "New to Yoma?" (referees only) is known only after the profile and the referee query,
  so it still re-centres the links when it arrives (to 288).
- 2026-10-26 (Jason): **Left drawer design pass.** One row style for every link, organisation
  and admin row — Nunito 15 px semibold, 44 px tall, an io5 icon slot (`TabItem.iconElement`;
  the desktop bar keeps its emoji chips), the current page on light grey with its icon in the
  page theme; groups split by hairlines instead of daisyUI dividers; the close is the dialogs'
  `DIALOG_CLOSE`; Logout full width; the footer sits at the drawer's foot. Organisation emoji
  (🏢 🛠️ 📈) became io5 icons; the admin chevron rotates and the toggle carries
  `aria-expanded`.
- 2026-10-26 (Jason, second pass): **No skeletons for anonymous visitors.** The "Refer a friend"
  bone shows only once the session is authenticated; while the session itself is loading, the
  avatar slot holds its 44 px width with an empty box instead of a bone (the visitor may get the
  sign-in button next). The signed-in profile wait keeps its avatar bone. **"New to Yoma?" gets
  no reserved slot** (Jason): its late re-centring is accepted.
- 2026-10-26 (Jason, second pass): **Card empty states have no icon** — the card's header
  already carries the section's tinted icon, so a second one inside was nested; the `page`
  variant keeps its icon (`EmptyState` props are a union, so a card can't be given one).
  **The Opportunities section shows neither circles nor graph with no data**: when every count
  (completed, pending, declined, saved) is zero, `OpportunitiesBody` shows the empty state
  ("No opportunities yet") and drops the "See graph" toggle; the zero-circles prompt in
  `OpportunitiesSummary` is gone. Same on the overview and in the drawer.
- 2026-10-26 (Jason): **Idle chips fill green on hover** (`hover:bg-green`, white text) — the
  Yo-ID hero tabs, sub-tabs, passport chips and the user menu's Profile / Settings / My
  preferences (all `PILL_IDLE_CLASS`), and discovery's quick searches, category pills and "Show
  all". A green border alone was lost on the purple hero. The category icons are self-contained
  badges on their own circle, so they hold up on green.
- 2026-10-26 (Jason): **Category pills are not filled green** — supersedes the category part of
  the entry above. A green fill (tried for picked pills too) made the category icons look poor,
  so picked stays white with the green inset outline, and hover is the light green tint
  (`hover:bg-green-light`) with the green border. "Show all" (no icon) keeps the green fill.
- 2026-10-26 (Jason): **The drawer's "Open … →" links get a little room above.** The drawer's
  section bodies are a column with an 8 px gap (`bodyClassName`), so every "Open … →" line sits
  8 px below its content (Skills 16, keeping its extra `mt-2` under the dense chips). Links
  within one row ("Open Wallet →" / "What is ZLTO?") stay on that row. Measured at 1440.
- 2026-10-26 (Jason, Stage): **Organisation logos load unoptimized.** On Stage the logos were
  missing from the opportunity cards (discovery and Yo-ID). #2004 moved the Yo-ID cards from
  `AvatarImage` (which sets `unoptimized`) to a plain `next/image` that goes through the
  `/_next/image` optimizer, and the discovery card already did. The optimizer path is the
  suspected failure (not reproduced locally; the cause on Stage is not confirmed), so every
  organisation logo — `OpportunityCard`, `OpportunityRow`, `OpportunityListItem`,
  `DetailHeaderCard`, the detail page's sticky title — now sets `unoptimized`, like
  `AvatarImage` and the passport's `CredentialCard`. Needs a Stage check after deploy.

## Links

- Epic: [YOM-1244](../README.md)
- Ticket: [YOM-1283](https://linear.app/didx/issue/YOM-1283/ui-youth-opportunity-credential-display)
- Parent capability: [YOM-1277](../YOM-1277-opportunity-credential-schemas-by-type-and-custom-fields/feature.md)
- API contract: [YOM-1280](../YOM-1280-api-opportunity-credential-issuance-with-custom-fields/feature.md)
- Siblings: [YOM-1281](../YOM-1281-ui-admin-credential-schema-management-by-type/feature.md) ·
  [YOM-1282](../YOM-1282-ui-opportunity-credential-schema-selection/feature.md)
- Handoffs: [2026-08-18-a](./handoffs/2026-08-18-a.md) · [2026-10-20-a](./handoffs/2026-10-20-a.md) ·
  [2026-10-26-a](./handoffs/2026-10-26-a.md)
