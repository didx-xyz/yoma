# Round 3 — what changed, our answers to your feedback, and how to test it (2026-10-21)

For the BA. This covers the youth web (`/opportunities/discover`, the opportunity page and its
completion form, and all Yo-ID pages). Everything below is built and tested locally; it reaches
Stage with the next deploy. Testing is best done signed in as a youth who has some completed
opportunities and credentials.

## 1. Answers to "Search and CF Testing — Staging"

| Row | Your note | What we did | Why |
| --- | --- | --- | --- |
| Pop-up: header font differs from the platform | Fixed | The welcome pop-up headings now use the platform's heading font (Open Sans). Every dialog on the site also now uses the platform font; before, dialogs fell back to the system font. |
| Form: goals not multi-select | Unchanged | A goal is one choice by design (the API stores one). Multi-goal would be an API change; say so if it matters and we will raise it with Adrian. |
| Form: skills don't change matched opportunities | Explained, unchanged | Skills only narrow **Jobs**, and only Jobs that list skills (partner job feeds list none). That is deliberate: skills are not reliable enough to hide courses or events. Ranking results by skill overlap would need a new API sort; we have noted it for Adrian as a possible follow-up. |
| Availability: multi-select pay/rewards; "Up to a minute" | Wording fixed; pay unchanged | "Paid or rewarded" already covers pay, ZLTO and partner rewards, and "Unpaid" is the opposite, so there is nothing to multi-select — leaving both off means "either". "Up to a minute" is now **"A few minutes"** (up to 15 minutes) in the wizard, the filter and the landing rail. |
| Language: use a search, allow several | Done | The wizard's language step now has a search over the full language list, and you can pick as many as you like (it always allowed several — the four shown on Stage were the only languages used by a published opportunity there). The filter dialog keeps the list of languages actually in use and gets a search box when the list is long. |
| Profile: gender as a filter / targeted groups | Done (targeted groups) | A new **"Who it's aimed at"** section under More filters (Women / girls, Youth with disabilities, Rural youth, …). Picking a group also keeps opportunities that are open to all, so the filter never hides something a youth could join. Gender from the profile is **not** applied automatically; that is a privacy question we would rather settle with you first. |
| Feed: move Featured up | Done | "Featured" is now the second rail, right after "Picked for you". |
| Toggle preferences off when a quick search is used | Unchanged | Jason's call: a quick search adds to your preferences rather than replacing them (for example goal "Learn" + quick search "Jobs in South Africa" shows learning **or** jobs). The "Your feed" switch turns preferences off in one tap. |
| Quick filters: decouple Paid & Remote | Done | The quick search is now **"Paid or rewarded"**; "Remote" is its own quick search as before. |
| Job card: show education level, work schedule, positions | Partly | Work schedule now shows with the employment type ("Permanent · Full-time"); "N places left" reads "N positions left" for jobs. Title, partner and location stay (Jason). **Education level required** needs an API change (Adrian) before the card can show it. |
| Event card: none to test | — | Stage had no published Events. We tested locally; please re-test on Stage once an Event is published. |
| Preference toggle: how do filters and preferences combine? | Explained | See §3. |
| Type selection: grey out Entrepreneurship | Unchanged | Entrepreneurship is fully supported (type, category, custom fields, credential). If Stage shows none, it has no published Entrepreneurship opportunities yet — a content gap, not a product one. |

## 2. What else changed this round

- **One card design everywhere.** Discovery results, the Yo-ID opportunity lists (completed,
  pending, declined, saved, recently viewed) and the passport credentials all use the same card.
  Cards no longer stretch on tablets: at most four per row, never wider than ~425px.
- **Type colours.** One palette for every type chip, card band, button and badge, on every page.
  We adjusted five of the seven colours from your credentials sheet so that white text is readable
  (WCAG AA) and so that Learning no longer shares grey with Other, and YoID is no longer the same
  purple as Event. The full sheet with the reasons is
  [`2026-10-21-type-colours.md`](../YOM-1283-ui-youth-opportunity-credential-display/design/2026-10-21-type-colours.md).
  **Please review and tell us if you want any hue changed — each is one value.**
- **Passport.** Credentials are grouped by type with filter chips that show counts; "Load more"
  adds 100 at a time; each credential's pop-up has a coloured header ("JOB · YoID"). Older
  credentials with no recorded type are shown under "Other opportunities".
- **Yo-ID pages.** The header, tabs, headings and loading placeholders now match discovery; the
  greeting highlights the youth's name and the welcome line rotates.
- **Opportunity page: completion form.** Four collapsible sections (Proof of completion · Tell us
  about it · Where is your business? · Before you go) with a status on each. The first unfinished
  section opens; a finished section closes and the next opens when you click elsewhere or press
  Continue. Submitting with errors opens the sections that need fixing, lists them at the top and
  jumps to the first one. Plain-language error messages. The "Upload your completion files"
  button is also in the sticky bar (desktop) and bottom bar (mobile).
- **Back from an opportunity.** The "Opportunities" link on an opportunity page takes you back to
  the discovery results exactly where you were (same filters, same scroll position).
- **Discovery search bar.** "My opportunities" is now "Saved" with the saved count, linking to the
  saved list; on tablets it shows as a heart with the count.

## 3. How filters and preferences combine (your question)

Your saved preferences are a standing layer, shown in **purple**. Anything you pick in this
search is shown in **green** and sits on top of it. The site sends one combined search; the server
never reads your preferences itself.

- When both set a **list** (types, categories, languages, engagement), the lists are combined — an
  opportunity matching either shows.
- When both set a **single value** (time available, paid/unpaid, a place), your pick for this
  search replaces the saved one.
- Engagement and accessibility start lenient (opportunities that don't say stay in); once you pick
  one by hand, that filter becomes strict.
- Switch off one preference by tapping its chip, or all of them with the "Your feed" switch.
  Clearing filters never switches preferences off.

## 4. Testing steps

Sign in as a youth with completions and credentials. Check desktop (≥1200px wide), tablet
(~768px) and phone (~390px) unless a step says otherwise.

**A. Cards and colours**

1. Open `/opportunities/discover`. Cards sit in a grid of 1 / 2 / 3 / 4 columns as the window
   widens; none is wider than about 425px. Each card's chip, logo band and button share the type's
   colour.
2. Open a Learning, a Job and an Event opportunity: the badge in the page header has the same
   colour as that type's card.
3. Yo-ID → Opportunities → Completed / Pending / Declined / Saved: same cards, same colours.
4. Yo-ID → Passport: the chips, section headings and cards use the same colours; "YoID Identity"
   is pink-berry, distinct from every opportunity type.

**B. Passport**

5. Chips read "All N", then one chip per type with its count. If more than 100 credentials, counts
   show "14+" until you press **Load more credentials**, then exact.
6. Tap a chip: only that type shows. Tap "See all →" on a section: it selects that chip.
7. Open a credential: header in the type colour, title, type pill, then the details. YoID
   credentials show "AnonCreds" as the artifact type.
8. Older credentials without a recorded type appear under "Other opportunities".

**C. Yo-ID pages**

9. `/yoid`: greeting with the name highlighted; the welcome line changes every few seconds. The
   overview tiles show a loading placeholder before content (throttle your network to see it).
10. `/yoid/opportunities/*`: the Completed / Pending / Declined / Saved pills sit **above** the
    "Just completed an opportunity?" banner and show counts.
11. `/yoid/opportunities/add`: "Recently viewed" shows cards with a **Load more**; the search box
    goes to discovery.

**D. Completion form** (an opportunity with several custom fields, e.g. an Entrepreneurship
programme)

12. Open "Upload your completion files" from the header, the sticky bar (desktop) or the bottom
    bar (phone, shown as a link).
13. Four sections with a status each. Press **Submit** with nothing filled: the sections that need
    attention open, a list of what to fix appears at the top, and the first missing field is focused.
14. Fill a section's required fields and click outside the form text: that section closes as
    "Done" and the next opens. Pressing **Continue ↓** does the same. (On a keyboard, Tab never
    closes a section — use Continue.)
15. Error messages name the field in plain words (e.g. "Choose Yes or No for Business
    Registered.").
16. Do **not** submit a real completion on Stage unless you want the credential issued.

**E. Discovery**

17. Open the preferences wizard → Language step: search for a language and pick two or more.
18. Time available: the first option reads "A few minutes"; the filter dialog and the landing rail
    use the same words.
19. More filters → **Who it's aimed at**: pick "Women / girls". Results still include opportunities
    marked "Open to all". Remove the chip to clear.
20. Quick search **Paid or rewarded**: results are paid or rewarded; "Remote" is separate.
21. With preferences on, the landing rails read: Picked for you, **Featured**, then the rest.
22. On a tablet (~768px) the search bar fits with no sideways scrolling; "Saved" shows as a heart
    with a count and opens your saved list.
23. Scroll down the results, open an opportunity, press "Opportunities" in the breadcrumb: you are
    back at the same place with the same filters.

## 5. Still open on our side

- Education level on the Job card, exact per-type passport counts before "Load more", and grouping
  the Yo-ID opportunity lists by type all wait for small API changes (Adrian has the list).
- The old `/opportunities` search page is being retired before production; please test on
  `/opportunities/discover`.
- A Stage check of each credential type's fields against Adrian's reference is still to do (the
  local wallet has no issued credentials).
