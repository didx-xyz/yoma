import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { IoOptionsOutline, IoSearchOutline } from "react-icons/io5";
import { JumpToTop } from "~/components/Common/JumpToTop";
import AnimatedText from "~/components/Opportunity/AnimatedText";
import { firstPlus } from "../../lib/chipModel";
import { formatNumber } from "../../lib/format";
import { whereSummary } from "../../lib/location";
import { jobSkillsApply } from "../../lib/searchRequest";
import {
  SEGMENT_TONE_TEXT,
  segmentTone,
  type SegmentTone,
} from "../../lib/segmentTone";
import { personalizeStepIndex } from "../../lib/wizardReturn";
import { useDiscovery } from "../../state/DiscoveryContext";
import { FiltersDialog } from "../Filters/FiltersDialog";
import { FiltersSheet } from "../Filters/FiltersSheet";
import { PersonalizeDialog } from "../Personalize/PersonalizeDialog";
import { CurrentFilters } from "../Results/CurrentFilters";
import { DiscoveryResults } from "../Results/DiscoveryResults";
import { SegmentedSearchBar } from "../SearchBar/SegmentedSearchBar";
import { FloatingFilterButton } from "../shared/FloatingFilterButton";
import { KeepAnswersPrompt } from "../shared/KeepAnswersPrompt";
import { PreferenceBanner } from "../shared/PreferenceBanner";
import { CategoryCarousel } from "./CategoryCarousel";
import { DiscoveryLanding } from "./DiscoveryLanding";
import { SavedOpportunitiesLink } from "./SavedOpportunitiesLink";
import { QuickSearchRow } from "./QuickSearchRow";

/**
 * The whole discovery surface under one provider: the purple hero (badges above the segmented
 * bar on desktop; badges above one search pill on mobile), then landing or results. Personalization opens
 * automatically on the first visit only; afterwards the banner, the sheet's preference block and
 * this surface's Edit entry points reopen it.
 *
 * Round 7 layout (2026-09-30, artboard 12a): the hero holds title · count · quick searches · bar ·
 * Browse by category (pills); the white area opens with the preference banner and the framed
 * Current filters row — ONE instance of each for landing and results — then the page body.
 */
export const DiscoverySurface: React.FC = () => {
  const {
    state,
    ready,
    count,
    preferences,
    migration,
    readPersonalizationSeen,
    chips,
    filterCount,
    hasFilters,
    search,
    lookups,
    effectiveFilters,
    resolveLabel,
  } = useDiscovery();
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  // The step a deep link named (`?personalize=<step id>`, back from the profile page); `undefined`
  // for every other opening, which starts at the welcome or step 1.
  const [personalizeStep, setPersonalizeStep] = useState<number | undefined>();
  // The wizard seeds its draft from the stored preferences when it mounts, and Finish saves a
  // COMPLETE replacement: opened before they load, it would edit an empty draft and wipe them.
  // So it waits for them, however it was opened (`undefined` = not loaded, or the read failed).
  const wizardShown = personalizeOpen && preferences !== undefined;
  const closePersonalize = (): void => {
    setPersonalizeOpen(false);
    setPersonalizeStep(undefined);
  };
  // Results only once the search has a filter of its own (`hasActiveFilters`).
  const landing = !hasFilters;
  // One clock per render pass, so every card row shares identical urgency math.
  const now = useMemo(() => new Date(), []);

  // The page must not scroll behind an open dialog/sheet.
  useEffect(() => {
    document.body.style.overflow = filtersOpen || wizardShown ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [filtersOpen, wizardShown]);

  // Auto-open once: never captured (or skipped) before, and only after hydration. It yields to
  // the sign-in "keep your answers" offer — `pendingAnonymous` is `undefined` while that offer
  // is still being resolved and an object while it is on screen; only `null` clears the way.
  useEffect(() => {
    if (
      ready &&
      preferences === null &&
      migration.pendingAnonymous === null &&
      !readPersonalizationSeen()
    )
      setPersonalizeOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- first-visit check only
  }, [ready, preferences, migration.pendingAnonymous]);

  // Deep link from outside the surface: ?personalize=1 (the avatar menu's "My preferences") opens
  // the wizard; ?personalize=<step id> (back from the profile page, `lib/wizardReturn.ts`) opens
  // it on that step. Then the URL is left clean — the param is an instruction, not state. Not
  // before the preferences have loaded (signed in: `GET /user/preferences`; anonymous: the
  // session read), which the wizard is seeded from; a failed read leaves the param unread.
  const preferencesLoaded = preferences !== undefined;
  useEffect(() => {
    if (!ready || !preferencesLoaded || router.query.personalize === undefined)
      return;
    setPersonalizeStep(
      personalizeStepIndex(router.query.personalize) ?? undefined,
    );
    setPersonalizeOpen(true);
    const query = { ...router.query };
    delete query.personalize;
    void router.replace({ pathname: router.pathname, query }, undefined, {
      shallow: true,
      scroll: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot per param sighting
  }, [ready, preferencesLoaded, router.query.personalize]);

  const editPreferences = (): void => setPersonalizeOpen(true);

  // The hero's rotating line. On results, the two preference sentences only while a preference
  // actually applies (round 10): signed out with no answers they would describe nothing.
  const refine = "Use the filters to narrow your search";
  // "1 matches your search" / "2 530 match your search" — the verb agrees with the count.
  const matching =
    count !== null
      ? `${formatNumber(count)} ${count === 1 ? "matches" : "match"} your search`
      : null;
  const resultsSentences = chips.some((c) => c.provenance === "inherited")
    ? [
        matching ?? refine,
        // The chips sit BELOW the hero, so "above the results" pointed the wrong way (browser
        // feedback, 2026-09-05).
        "These results use your preferences. Change them below",
        "You can switch your preferences off for this search",
      ]
    : matching !== null
      ? [matching, refine]
      : [refine];
  const heroSentences = landing
    ? [
        count !== null
          ? `${formatNumber(count)} open right now`
          : "Opportunities across jobs, learning, events and more",
        "Set your preferences once. Every search uses them",
        "Earn ZLTO while you build your future",
      ]
    : resultsSentences;

  // The compact pill's second line — "Jobs · South Africa · Remote +1 · +3": the three facets the
  // desktop bar names (type, where, engagement — each first value "+N"), then a count of the other
  // facets in play. Effective filters, so the inherited layer shows on landing as it does on the
  // desktop bar.
  // Each named part carries its segment's tone — the round-7 colour rule (green = this search,
  // purple = preferences), as on the desktop bar.
  const pillSummary = ((): { text: string; tone: SegmentTone }[] | null => {
    const f = effectiveFilters;
    const named = (
      [
        [firstPlus("types", f.types, resolveLabel), "type"],
        [whereSummary(f, (id) => resolveLabel("countries", id)), "where"],
        [
          firstPlus("engagementTypes", f.engagementTypes, resolveLabel),
          "engagement",
        ],
      ] as const
    ).flatMap(([text, segment]) =>
      text === null
        ? []
        : [{ text, tone: segmentTone(state.filters, f, segment) }],
    );
    const others = [
      f.categories.length > 0,
      f.commitment !== null,
      f.incentivized !== null ||
        f.hasReward !== null ||
        f.zltoRanges.length > 0,
      f.languages.length > 0,
      // Counted, never named: the needs are private, and the skills only while they narrow Jobs.
      f.accommodations.length > 0,
      jobSkillsApply(search, lookups),
      f.sdgs.length > 0,
      f.targetedGroups.length > 0,
      f.provider !== null,
      f.featured !== null,
      f.age !== null,
      f.customFields.length > 0,
    ].filter(Boolean).length;
    const parts = [
      ...named,
      ...(others > 0
        ? [{ text: `+${others}`, tone: "empty" as SegmentTone }]
        : []),
    ];
    return parts.length > 0 ? parts : null;
  })();

  return (
    // MainLayout centres a flex child, so the root must claim the full width itself —
    // the purple band then bleeds edge to edge while the content stays contained.
    <div className="flex w-full flex-col">
      <header className="bg-purple w-full px-4 pt-20 pb-4 text-white md:pt-24">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          {/* Rendered on landing AND results, so switching between them never shifts the layout. */}
          <div className="text-center">
            <h3 className="text-xl font-semibold md:text-2xl">
              Find <span className="text-orange mx-2">opportunities</span> to{" "}
              <span className="text-orange mx-2">unlock</span> your future.
            </h3>
            <div className="flex justify-center pt-1">
              <AnimatedText
                // Remounted when the number of sentences changes, so it never holds an index
                // past the end of a shorter list (it only wraps on its 6s tick).
                key={heroSentences.length}
                sentences={heroSentences}
                linesBelowMd={2}
              />
            </div>
          </div>
          {/* `block`, not a centring flex row: as a flex ITEM the scroller sized itself to its
              content (1322px of badges), so `overflow-x-auto` never engaged — between md and
              ~1350px the row ran off both edges of the hero, the first badge was unreachable at
              a negative x, and the whole PAGE scrolled sideways. As a block it takes the hero's
              width and scrolls inside it; the row centres itself when it fits.
              `min-h-10` = the 36px badges plus the scroller's 4px bottom padding: the row's
              height is spoken for before the lookups resolve, as the mobile row's is below. */}
          <div className="hidden min-w-0 md:block md:min-h-10">
            <QuickSearchRow wrap={false} />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <div className="grow">
              <SegmentedSearchBar onOpenFilters={() => setFiltersOpen(true)} />
            </div>
            <SavedOpportunitiesLink />
          </div>
          {/* Below md the badge row sits ABOVE the search pill, inside the purple header, matching
              desktop (2026-09-22). It scrolls sideways at compact density; `min-h-8` reserves its
              line so the header does not jump when the lookups resolve and the badges appear. */}
          <div className="min-h-8 min-w-0 md:hidden">
            <QuickSearchRow wrap={false} />
          </div>
          {/* Below md the search input collapses into this ONE pill, which opens the filters
              sheet itself — so there is no separate Filters button beside it (Jason, 2026-10-22:
              it duplicated the tap target). The filter count rides inside the pill instead, as
              the green badge the floating button and the desktop bar use. */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex min-h-12 min-w-0 grow items-center gap-3 rounded-full bg-white px-4 py-1.5 text-left text-black"
            >
              <IoSearchOutline
                aria-hidden
                className="text-gray-dark h-5 w-5 shrink-0"
              />
              <span className="min-w-0 grow">
                <span className="block truncate text-sm font-semibold">
                  {state.filters.q ?? "Search opportunities"}
                </span>
                {pillSummary && (
                  <span className="text-gray-dark block truncate text-[11px] font-semibold">
                    {pillSummary.map((part, index) => (
                      <React.Fragment key={part.text}>
                        {index > 0 && " · "}
                        <span className={SEGMENT_TONE_TEXT[part.tone]}>
                          {part.text}
                        </span>
                      </React.Fragment>
                    ))}
                  </span>
                )}
              </span>
              <span className="text-green flex shrink-0 items-center gap-1 text-xs font-semibold">
                <IoOptionsOutline aria-hidden className="h-5 w-5" />
                <span className="sr-only">Filters</span>
                {filterCount > 0 && (
                  <span className="bg-green flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-white">
                    {filterCount}
                  </span>
                )}
              </span>
            </button>
            <SavedOpportunitiesLink />
          </div>
          <CategoryCarousel />
        </div>
      </header>

      <FloatingFilterButton onOpen={() => setFiltersOpen(true)} />

      {/* 32px is the page's vertical rhythm — hero → banner → Current filters → results — held
          to 24px below md, where the fold is the scarcer resource. */}
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4">
        <KeepAnswersPrompt />
        <PreferenceBanner onEdit={editPreferences} />
        <CurrentFilters onOpenFilters={() => setFiltersOpen(true)} />
        {landing ? (
          <DiscoveryLanding now={now} />
        ) : (
          <DiscoveryResults now={now} />
        )}
        {/* Under the rails or the pager: both run long, more so on a phone (2026-10-08). */}
        <JumpToTop />
      </main>

      {/* Same filter state, two containers — the breakpoint picks the chrome, never the content. */}
      <div className="hidden md:contents">
        <FiltersDialog
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          onEditPreferences={editPreferences}
        />
      </div>
      <div className="md:hidden">
        <FiltersSheet
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          onEditPreferences={editPreferences}
        />
      </div>
      {/* Mounted only while open — the dialog seeds its draft from stored preferences at mount. */}
      {wizardShown && (
        <PersonalizeDialog
          onClose={closePersonalize}
          initialStep={personalizeStep}
        />
      )}
    </div>
  );
};
