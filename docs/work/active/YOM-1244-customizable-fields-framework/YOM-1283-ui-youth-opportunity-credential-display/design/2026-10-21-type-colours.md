# Opportunity type colours — what changed and why (2026-10-21)

For the BA. This is the colour sheet behind the type chips, cards and buttons on the youth
pages. We started from your Yoma Credentials palette and changed five of the seven colours;
this page says what we changed, by how much, and why. Built on 2026-10-21 (Jason's call); the
tester's pass follows. If you want a different hue anywhere, say so and we change the one token.

## The colours

"Contrast" is the WCAG contrast ratio of **white text on the solid colour**, which is how the
chips ("JOB", "LEARNING") and the card buttons ("View event →") are drawn. The accessibility
floor (WCAG AA) for text of this size is **4.5 : 1**; anything below it is hard to read for many
people and fails an automated check.

| Type                  | Your hex  | Contrast | Our hex                     | Contrast | Why                                                                                                                                                                                                            |
| --------------------- | --------- | -------- | --------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Job                   | `#de574a` | 3.77 ✗   | `#cc473d`                   | 4.63 ✓   | The same red-orange, a little darker so white text passes. Side by side it still reads as your colour.                                                                                                        |
| Impact Action         | `#4ca78c` | 2.91 ✗   | `#23836a`                   | 4.64 ✓   | The same green, darkened to pass. It is close to Yoma's own green, which Impact Action already used.                                                                                                          |
| Event                 | `#391350` | 15.18 ✓  | `#391350` (unchanged)       | 15.18 ✓  | Already passes; kept exactly.                                                                                                                                                                                 |
| Entrepreneurship      | `#c6820f` | 3.18 ✗   | `#a66700`                   | 4.60 ✓   | The same amber, darkened to pass. It reads as a dark amber or ochre.                                                                                                                                          |
| Learning              | `#5a6675` | 5.85 ✓   | `#007cb4` (new)             | 4.62 ✓   | Your palette gave Learning and Other the same grey, so the two types looked identical on every page. Learning now has its own colour: blue (Yoma's blue, darkened to pass). See "Why blue, not yellow" below. |
| Other                 | `#5a6675` | 5.85 ✓   | `#5a6675` (unchanged)       | 5.85 ✓   | Keeps your neutral grey. Any type we don't know yet, and older credentials without a type, also show as Other.                                                                                                |
| YoID Identity (family)| `#3b1251` | 15.09 ✓  | `#a3195b`                   | 7.38 ✓   | Your YoID purple was the same colour as Event to the eye (a difference no one can see). It is now a deep berry pink that no opportunity type uses, so a YoID credential never looks like an Event.            |

## Why

**Readability first.** Three of the original colours (Job, Impact Action, Entrepreneurship) fail
the WCAG AA contrast floor for the white text we put on them, which means a real share of youth
would struggle to read the chip, and an accessibility audit would flag every card. We kept each
hue and only darkened it until white text passes with a small margin, so the palette still looks
like yours. **Learning versus Other:** the original sheet gave both the same grey, so on the
passport, in the discovery results and on the detail page a Learning course and an "Other"
opportunity were indistinguishable except by the word in the chip. Learning is the biggest type
on Yoma, so it needed a colour of its own. **Why blue, not yellow:** Jason suggested yellow, but no
yellow can carry white text at 4.5 : 1 without turning into a brown-ochre, which is already
Entrepreneurship's hue, and switching to dark text on just that one chip would break the single
rule the chips and buttons follow (white text on a solid colour, everywhere). Blue is a Yoma
colour no type was using, and it is clearly apart from the grey it replaces. **YoID versus
Event:** the YoID purple and the Event purple differed by less than the eye can detect, so a youth
scanning their passport could not tell an identity credential from an event credential by colour.
The berry pink is far from every type colour, including under the common forms of colour
blindness (the only weak pair left, Job and Entrepreneurship under deuteranopia, comes from your
original red and amber hues and is unchanged). Every chip still carries its label, so colour is
never the only cue.

## Where the colours appear

One palette (`src/web/src/lib/typeColours.ts`, tokens in `styles/colors.css`) feeds every
surface below, so a type is the same colour wherever a youth meets it:

- **Discovery (`/opportunities/discover`):** the result cards (band behind the logo, type chip,
  "View …" button), the compact list rows (chip, outline button, arrow), the welcome pop-up's
  "Pick a type" tiles, and the goal cards in the preferences wizard.
- **Opportunity detail page (`/opportunities/{id}`):** the type badge in the header, in both the
  tabbed and the classic layout. (Event was blue here before; it now matches its card.)
- **Yo-ID — Opportunities (`/yoid/opportunities/*`):** the completed, pending, declined and saved
  cards, and the Recently viewed cards on the Add page (band, chip, progress bar, button).
- **Yo-ID — Passport (`/yoid/passport`):** the type chips with their dots, the section headings,
  the credential cards, and the credential pop-up's coloured header and pill.
- **Partner / admin:** the opportunity info page badge, the social-share preview badge, and the
  referral pathway task rows (the small type tag on each task).
- **Legacy `/opportunities` search pages:** their cards now read from the same palette too, until
  those pages are deleted before the production release.

Not type colours (unchanged): the green/purple of the filter chips and search-bar values, which
mean "this search" versus "your preferences", and the neutral counters on the Yo-ID overview.
