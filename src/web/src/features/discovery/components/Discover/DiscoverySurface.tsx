import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { IoOptionsOutline, IoSearchOutline } from "react-icons/io5";
import AnimatedText from "~/components/Opportunity/AnimatedText";
import { formatNumber } from "../../lib/format";
import { whereSummary } from "../../lib/location";
import {
  SEGMENT_TONE_TEXT,
  segmentTone,
  type SegmentTone,
} from "../../lib/segmentTone";
import { isDefaultDiscoveryState } from "../../lib/urlCodec";
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
import { MyOpportunitiesLink } from "./MyOpportunitiesLink";
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
    effectiveFilters,
    resolveLabel,
  } = useDiscovery();
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const landing = isDefaultDiscoveryState(state);
  // One clock per render pass, so every card row shares identical urgency math.
  const now = useMemo(() => new Date(), []);

  // The page must not scroll behind an open dialog/sheet.
  useEffect(() => {
    document.body.style.overflow =
      filtersOpen || personalizeOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [filtersOpen, personalizeOpen]);

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

  // Deep link from outside the surface (the avatar menu's "My preferences"): ?personalize=1
  // opens the wizard, then leaves the URL clean — the param is an instruction, not state.
  useEffect(() => {
    if (!ready || router.query.personalize !== "1") return;
    setPersonalizeOpen(true);
    const query = { ...router.query };
    delete query.personalize;
    void router.replace({ pathname: router.pathname, query }, undefined, {
      shallow: true,
      scroll: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot per param sighting
  }, [ready, router.query.personalize]);

  const editPreferences = (): void => setPersonalizeOpen(true);

  // The compact pill's second line — "Jobs · South Africa · Remote +1 · +3": the three facets the
  // desktop bar names (type, where, engagement — each first value "+N"), then a count of the other
  // facets in play. Effective filters, so the inherited layer shows on landing as it does on the
  // desktop bar.
  // Each named part carries its segment's tone — the round-7 colour rule (green = this search,
  // purple = preferences), as on the desktop bar.
  const pillSummary = ((): { text: string; tone: SegmentTone }[] | null => {
    const f = effectiveFilters;
    const firstPlus = (facet: "types" | "engagementTypes"): string | null => {
      const values = f[facet];
      if (values.length === 0) return null;
      const first = resolveLabel(facet, values[0]!);
      return values.length > 1 ? `${first} +${values.length - 1}` : first;
    };
    const named = (
      [
        [firstPlus("types"), "type"],
        [whereSummary(f, (id) => resolveLabel("countries", id)), "where"],
        [firstPlus("engagementTypes"), "engagement"],
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
      f.accommodations.length > 0,
      f.sdgs.length > 0,
      f.provider !== null,
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
                sentences={
                  landing
                    ? [
                        count !== null
                          ? `${formatNumber(count)} open right now`
                          : "Opportunities across jobs, learning, events and more",
                        "Set your preferences once — every search uses them",
                        "Earn ZLTO while you build your future",
                      ]
                    : [
                        count !== null
                          ? `${formatNumber(count)} match your search`
                          : "Refine your search with the filters",
                        // The chips sit BELOW the hero, so "above the results" pointed the
                        // wrong way (browser feedback, 2026-09-05).
                        "Your preferences shape these results — adjust any chip below",
                        "Switch your preferences off any time — this search only",
                      ]
                }
              />
            </div>
          </div>
          {/* `block`, not a centring flex row: as a flex ITEM the scroller sized itself to its
              content (1322px of badges), so `overflow-x-auto` never engaged — between md and
              ~1350px the row ran off both edges of the hero, the first badge was unreachable at
              a negative x, and the whole PAGE scrolled sideways. As a block it takes the hero's
              width and scrolls inside it; the row centres itself when it fits. */}
          <div className="hidden min-w-0 md:block">
            <QuickSearchRow wrap={false} />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <div className="grow">
              <SegmentedSearchBar onOpenFilters={() => setFiltersOpen(true)} />
            </div>
            <MyOpportunitiesLink />
          </div>
          {/* Below md the badge row sits ABOVE the search pill, inside the purple header, matching
              desktop (2026-09-22). It scrolls sideways at compact density; `min-h-8` reserves its
              line so the header does not jump when the lookups resolve and the badges appear. */}
          <div className="min-h-8 min-w-0 md:hidden">
            <QuickSearchRow wrap={false} />
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex min-h-12 min-w-0 grow items-center gap-3 rounded-full bg-white px-4 py-1.5 text-left text-black"
            >
              <IoSearchOutline className="text-gray-dark h-5 w-5 shrink-0" />
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
            </button>
            {/* The Filters entry, green like the desktop bar's (green = filters). Same sheet
                as the pill — the pill kept its tap target, the count moved out here. */}
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label={
                chips.length > 0 ? `Filters (${chips.length})` : "Filters"
              }
              className="bg-green hover:bg-green-dark flex min-h-12 shrink-0 items-center justify-center gap-1 rounded-full px-3.5 text-sm font-semibold text-white"
            >
              <IoOptionsOutline className="h-5 w-5" />
              {chips.length > 0 && <span>{chips.length}</span>}
            </button>
            <MyOpportunitiesLink />
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
        <CurrentFilters />
        {landing ? (
          <DiscoveryLanding now={now} />
        ) : (
          <DiscoveryResults now={now} />
        )}
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
      {personalizeOpen && (
        <PersonalizeDialog onClose={() => setPersonalizeOpen(false)} />
      )}
    </div>
  );
};
