import Image from "next/image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  IoAccessibilityOutline,
  IoBulbOutline,
  IoEarthOutline,
  IoGiftOutline,
  IoInformationCircleOutline,
  IoLanguageOutline,
  IoLocationOutline,
  IoPeopleCircleOutline,
  IoPersonOutline,
  IoPricetagsOutline,
  IoStorefrontOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { RewardType, type OpportunityInfo } from "~/api/models/opportunity";
import {
  formatAccessibilitySupport,
  formatAgeRange,
  formatIncentivized,
  formatPartnerIncentive,
  formatRewardType,
  formatSustainableDevelopmentGoal,
} from "~/components/Opportunity/Admin/opportunityCoreFields";
import { CustomFieldsView } from "~/components/Opportunity/CustomFieldsView";
import { getCommitmentDisplay } from "~/components/Opportunity/opportunityTypeTheme";
import { MoneyBadge } from "~/features/discovery/components/Results/MoneyBadge";
import { closingInfo } from "~/features/discovery/lib/dates";
import { moneyFactsOf } from "~/features/discovery/lib/money";
import {
  useCurrenciesQuery,
  useOpportunityCustomFieldDefinitionsQuery,
} from "~/hooks/useOpportunityMutations";
import { OPPORTUNITY_TYPE_NANE_JOB } from "~/lib/constants";
import { ClampedDescription } from "./ClampedDescription";
import { ChipList, DetailDisclosure, KeyValueRows } from "./DetailDisclosure";

// ─────────────────────────────────────────────────────────────────────────────
// OpportunityDetailSections — the EXPERIMENTAL detail body (round 7, artboards
// 11a–11e, 2026-09-30). One column under the header card:
//
//   anchor tabs  About · Requirements · Who it's for · Impact · Provider · Details (+ host
//                groups, e.g. the admin page's Rewards)
//                (same-page anchors with scroll-spy; a tap opens that group's first
//                section; a group with nothing to show has no tab)
//   sections     disclosures, grouped — the SAME section set, content and conditions
//                as the existing public page; this pass regroups and restyles only
//   sticky bar   once the header card scrolls away: desktop — logo, title, money,
//                deadline, the host's actions and the tabs; mobile — the tabs at the
//                top and the host's actions in a bottom bar. Not in preview (the
//                editor's step 8 would get a bar floating over the form).
//
// Shared by the public page, the admin info page and the editor preview; each host
// renders its own header card and passes its own actions.
// ─────────────────────────────────────────────────────────────────────────────

/** The built-in groups, plus any a host appends (`extraGroups` — the admin page's Rewards). */
type GroupId = string;

const GROUPS: { id: GroupId; label: string }[] = [
  { id: "about", label: "About" },
  { id: "requirements", label: "Requirements" },
  { id: "who", label: "Who it's for" },
  { id: "impact", label: "Impact" },
  { id: "provider", label: "Provider" },
  { id: "details", label: "Details" },
];

interface SectionDef {
  id: string;
  group: GroupId;
  icon: React.ReactNode;
  title: string;
  count?: number | null;
  valueHint?: string | null;
  preview?: string | null;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

const ICON = "h-5 w-5";

/** "English, isiZulu +2" — the closed row's preview. */
const previewOf = (labels: string[], max = 2): string =>
  labels.length > max
    ? `${labels.slice(0, max).join(", ")} +${labels.length - max}`
    : labels.join(", ");

/**
 * Top offset the tabs and anchors clear: navbar (80px) + the sticky bar — the full panel on
 * desktop (and on mobile in "full" mode), the tabs alone on mobile in "split" mode.
 */
const offsetFor = (mode: "split" | "full"): number => {
  if (typeof window === "undefined") return 136;
  if (window.innerWidth >= 768) return 200;
  return mode === "full" ? 200 : 136;
};

export const OpportunityDetailSections: React.FC<{
  opportunity: OpportunityInfo;
  /** The host's header card — the sticky bar appears once it has scrolled away. */
  headerRef: React.RefObject<HTMLElement | null>;
  /** The host's compact actions for the sticky bar and the mobile bottom bar. */
  barActions?: React.ReactNode;
  /** Editor preview: no fixed bars, nothing floats over the form. */
  preview?: boolean;
  /** Admin: keep Incentive when it is still unanswered ("Not specified"), as the info page does. */
  showUnspecifiedIncentive?: boolean;
  /** Host groups appended after Details, each with its own tab (admin: Rewards). */
  extraGroups?: { id: string; label: string; content: React.ReactNode }[];
  /**
   * `split` (public): on mobile the tabs pin at the top and the actions sit in a bottom bar.
   * `full` (admin): the whole sticky panel — title, money, deadline, actions, tabs — on mobile
   * too, and no bottom bar.
   */
  stickyMode?: "split" | "full";
}> = ({
  opportunity,
  headerRef,
  barActions,
  preview = false,
  showUnspecifiedIncentive = false,
  extraGroups = [],
  stickyMode = "split",
}) => {
  const now = useMemo(() => new Date(), []);
  const { data: currencies } = useCurrenciesQuery();
  const { data: definitions } = useOpportunityCustomFieldDefinitionsQuery(
    opportunity.type ? [opportunity.type] : null,
    { enabled: !!opportunity.type },
  );

  // ── the sections: exactly the existing public page's set and conditions ──
  const sections = useMemo((): SectionDef[] => {
    const list: SectionDef[] = [];
    const isJob = opportunity.type === OPPORTUNITY_TYPE_NANE_JOB;

    // Incentive — as `OpportunityCoreDetails` shows it (public: only once answered)
    if (showUnspecifiedIncentive || opportunity.incentivized != null) {
      const labels = [
        formatIncentivized(opportunity.incentivized),
        opportunity.rewardType !== RewardType.None
          ? formatRewardType(opportunity.rewardType)
          : null,
        opportunity.rewardType === RewardType.PartnerIncentive
          ? formatPartnerIncentive(
              opportunity.partnerIncentiveAmount,
              opportunity.partnerIncentiveCurrency,
            )
          : null,
      ].filter((l): l is string => !!l);
      list.push({
        id: "incentive",
        group: "about",
        icon: <IoGiftOutline className={ICON} />,
        title: "Incentive",
        preview: labels.join(" · "),
        content: (
          <ChipList items={labels.map((label) => ({ id: label, label }))} />
        ),
      });
    }

    // How much time you will need — the existing copy, unchanged
    const commitment = getCommitmentDisplay(opportunity);
    let commitmentSummary = "";
    if (commitment?.totalHours != null)
      commitmentSummary = `${commitment.totalHours} total hour${commitment.totalHours === 1 ? "" : "s"}`;
    else if (commitment?.label) commitmentSummary = commitment.label;
    if (commitmentSummary)
      list.push({
        id: "time",
        group: "about",
        icon: <IoTimeOutline className={ICON} />,
        title: "How much time you will need",
        preview: commitmentSummary,
        content: (
          <div className="text-sm">
            {`This task should not take you more than ${commitmentSummary}.`}
            <p className="text-gray-dark mt-2">
              The estimated times provided are just a guideline. You have as
              much time as you need to complete the tasks at your own pace.
              Focus on engaging with the materials and doing your best without
              feeling rushed by the time estimates.
            </p>
          </div>
        ),
      });

    // Skills — a Job's are its requirements (open by default); anyone else's are awarded
    const skills = (opportunity.skills ?? []).map((s) => ({
      id: s.id,
      label: s.name,
    }));
    if (skills.length > 0)
      list.push({
        id: "skills",
        group: isJob ? "requirements" : "impact",
        icon: <IoBulbOutline className={ICON} />,
        title: isJob ? "Skills required" : "Skills you will learn",
        count: skills.length,
        preview: previewOf(skills.map((s) => s.label)),
        content: <ChipList items={skills} />,
        defaultOpen: isJob,
      });

    const languages = (opportunity.languages ?? []).map((l) => ({
      id: l.id,
      label: l.name,
    }));
    if (languages.length > 0)
      list.push({
        id: "languages",
        group: "requirements",
        icon: <IoLanguageOutline className={ICON} />,
        title: "Languages",
        count: languages.length,
        preview: previewOf(languages.map((l) => l.label)),
        content: <ChipList items={languages} />,
      });

    const ageRange = formatAgeRange(opportunity.ageFrom, opportunity.ageTo);
    if (ageRange)
      list.push({
        id: "age",
        group: "requirements",
        icon: <IoPersonOutline className={ICON} />,
        title: "Age range",
        valueHint: ageRange,
        content: (
          <KeyValueRows
            rows={[
              ...(opportunity.ageFrom != null
                ? [{ label: "Minimum age", value: `${opportunity.ageFrom}` }]
                : []),
              ...(opportunity.ageTo != null
                ? [{ label: "Maximum age", value: `${opportunity.ageTo}` }]
                : []),
            ]}
          />
        ),
      });

    const support = formatAccessibilitySupport(
      opportunity.accessibilitySupport,
    );
    const accommodations = (opportunity.accommodations ?? []).map((a) => ({
      id: a.id,
      label: a.name,
    }));
    if (support || accommodations.length > 0)
      list.push({
        id: "accessibility",
        group: "requirements",
        icon: <IoAccessibilityOutline className={ICON} />,
        title: "Accessibility",
        count: accommodations.length > 0 ? accommodations.length : null,
        preview:
          accommodations.length > 0
            ? previewOf(accommodations.map((a) => a.label))
            : `Support: ${support}`,
        content: (
          <div className="flex flex-col gap-2">
            {support && <div className="text-sm">{`Support: ${support}`}</div>}
            {accommodations.length > 0 && <ChipList items={accommodations} />}
            {!!opportunity.accommodationOtherDescription && (
              <div className="text-gray-dark text-sm">
                {opportunity.accommodationOtherDescription}
              </div>
            )}
          </div>
        ),
      });

    const groups = (opportunity.targetedGroups ?? []).map((g) => ({
      id: g.id,
      label: g.name,
    }));
    if (groups.length > 0)
      list.push({
        id: "targeted-groups",
        group: "who",
        icon: <IoPeopleCircleOutline className={ICON} />,
        title: "Targeted groups",
        count: groups.length,
        preview: previewOf(groups.map((g) => g.label)),
        content: <ChipList items={groups} />,
      });

    // Countries, with the optional place: "South Africa — Cape Town, Western Cape"
    const countries = (opportunity.countries ?? []).map((country) => {
      const place = [country.city, country.region].filter(Boolean).join(", ");
      return {
        id: country.id,
        label: place ? `${country.name} — ${place}` : country.name,
      };
    });
    if (countries.length > 0)
      list.push({
        id: "countries",
        group: "who",
        icon: <IoLocationOutline className={ICON} />,
        title: "Countries",
        count: countries.length,
        preview: previewOf(countries.map((c) => c.label)),
        content: <ChipList items={countries} />,
      });

    const goals = (opportunity.sustainableDevelopmentGoals ?? []).map((g) => ({
      id: g.id,
      label: formatSustainableDevelopmentGoal(g),
    }));
    if (goals.length > 0)
      list.push({
        id: "sdgs",
        group: "impact",
        icon: <IoEarthOutline className={ICON} />,
        title: "Sustainable Development Goals",
        count: goals.length,
        preview: previewOf(goals.map((g) => g.label)),
        content: <ChipList items={goals} />,
      });

    const topics = (opportunity.categories ?? []).map((c) => ({
      id: c.id,
      label: c.name,
    }));
    if (topics.length > 0)
      list.push({
        id: "topics",
        group: "impact",
        icon: <IoPricetagsOutline className={ICON} />,
        title: "Topics",
        count: topics.length,
        preview: previewOf(topics.map((t) => t.label)),
        content: <ChipList items={topics} />,
      });

    // Additional details — the definition-driven custom fields, as CustomFieldsView renders them
    const defs = definitions ?? [];
    const valued = (opportunity.customFields ?? []).flatMap((value) => {
      const definition = defs.find(
        (d) => d.key.toLowerCase() === value.key.toLowerCase(),
      );
      const hasValue = (value.values?.length ?? 0) > 0 || !!value.value?.trim();
      return definition && hasValue ? [definition.title] : [];
    });
    if (valued.length > 0)
      list.push({
        id: "additional-details",
        group: "details",
        icon: <IoInformationCircleOutline className={ICON} />,
        title: "Additional details",
        count: valued.length,
        preview: previewOf(valued),
        content: (
          <CustomFieldsView
            definitions={definitions}
            values={opportunity.customFields}
            columns={1}
            hideGrouping={true}
          />
        ),
      });

    return list;
  }, [opportunity, definitions, showUnspecifiedIncentive]);

  const provider = opportunity.provider?.trim() ? opportunity.provider : null;
  const visibleGroups = [
    ...GROUPS.filter(
      (g) =>
        g.id === "about" ||
        (g.id === "provider"
          ? !!provider
          : sections.some((s) => s.group === g.id)),
    ),
    ...extraGroups.map(({ id, label }) => ({ id, label })),
  ];

  // ── open state: which disclosures are open, and the one a tab tap focused ──
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(sections.filter((s) => s.defaultOpen).map((s) => s.id)),
  );
  const [focused, setFocused] = useState<string | null>(null);
  const toggle = (id: string): void =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // ── header visibility → the sticky / bottom bars ──
  const [headerVisible, setHeaderVisible] = useState(true);
  useEffect(() => {
    const el = headerRef.current;
    if (!el || preview) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeaderVisible(!!entry?.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" }, // the fixed navbar covers the top 80px
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [headerRef, preview]);

  // ── scroll-spy: the active tab is the last group whose top has passed the offset line ──
  const groupRefs = useRef<Partial<Record<GroupId, HTMLElement | null>>>({});
  const [active, setActive] = useState<GroupId>("about");
  // A tab tap owns the highlight while its smooth scroll runs — otherwise the scroll events on
  // the way (or the bottom-of-page rule) would relabel it mid-flight.
  const tappedRef = useRef<{ group: GroupId; at: number } | null>(null);
  useEffect(() => {
    const onScroll = (): void => {
      const tapped = tappedRef.current;
      if (tapped && Date.now() - tapped.at < 1200) {
        setActive(tapped.group);
        return;
      }
      const line = offsetFor(stickyMode) + 8;
      let current: GroupId = "about";
      for (const g of visibleGroups) {
        const el = groupRefs.current[g.id];
        if (el && el.getBoundingClientRect().top <= line) current = g.id;
      }
      // At the very bottom the last groups can never reach the line — the page has run out —
      // so the last one is the one in view (a tap on "Rewards" must light "Rewards").
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      if (atBottom && visibleGroups.length > 0)
        current = visibleGroups[visibleGroups.length - 1]!.id;
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- group set is stable per opportunity
  }, [visibleGroups.map((g) => g.id).join(",")]);

  const goTo = useCallback(
    (group: GroupId): void => {
      setActive(group);
      tappedRef.current = { group, at: Date.now() };
      const first = sections.find((s) => s.group === group);
      if (first) {
        setOpen((current) => new Set(current).add(first.id));
        setFocused(first.id);
      }
      const el = groupRefs.current[group];
      if (el) {
        const top =
          el.getBoundingClientRect().top +
          window.scrollY -
          offsetFor(stickyMode);
        window.scrollTo({ top, behavior: "smooth" });
      }
      if (!preview) window.history.replaceState(null, "", `#${group}`);
    },
    [sections, preview, stickyMode],
  );

  // A #group in the URL on arrival opens and scrolls to it, like a tab tap.
  useEffect(() => {
    if (preview) return;
    const hash = window.location.hash.replace("#", "");
    if (visibleGroups.some((g) => g.id === hash))
      setTimeout(() => goTo(hash), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- arrival only
  }, []);

  const tabs = (
    <nav
      aria-label="Opportunity sections"
      className="flex gap-5 overflow-x-auto overflow-y-hidden text-sm whitespace-nowrap"
      // inline: the global unlayered `* { scrollbar-width: thin }` outranks any utility class
      style={{ scrollbarWidth: "none" }}
    >
      {visibleGroups.map((g) => (
        <a
          key={g.id}
          href={`#${g.id}`}
          aria-current={active === g.id ? "location" : undefined}
          onClick={(e) => {
            e.preventDefault();
            goTo(g.id);
          }}
          className={`-mb-px border-b-2 py-2.5 ${
            active === g.id
              ? "border-green font-semibold text-black"
              : "text-gray-dark border-transparent hover:text-black"
          }`}
        >
          {g.label}
        </a>
      ))}
    </nav>
  );

  const money = moneyFactsOf(opportunity, currencies ?? []);
  const deadline = closingInfo(opportunity.dateEnd, now).label;
  const showBars = !preview && !headerVisible;

  return (
    <>
      {/* In-flow tabs, under the header card */}
      <div className="border-gray border-b">{tabs}</div>

      <div className="flex flex-col gap-6 pt-2">
        {visibleGroups.map((g) => {
          const groupSections = sections.filter((s) => s.group === g.id);
          return (
            <section
              key={g.id}
              id={preview ? undefined : g.id}
              ref={(el) => {
                groupRefs.current[g.id] = el;
              }}
              aria-labelledby={`group-${g.id}`}
            >
              <h2
                id={`group-${g.id}`}
                className="text-gray-dark pb-2 text-[11px] font-bold tracking-widest uppercase"
              >
                {g.label}
              </h2>
              <div className="flex flex-col gap-3">
                {g.id === "about" && (
                  <div className="shadow-custom rounded-xl bg-white p-4 md:p-5">
                    <ClampedDescription value={opportunity.description} />
                  </div>
                )}
                {extraGroups.find((x) => x.id === g.id)?.content}
                {g.id === "provider" && provider && (
                  // Provider is a card, not a disclosure — informational provider text,
                  // not the owning organisation
                  <div className="shadow-custom flex items-center gap-3 rounded-xl bg-white p-4 md:p-5">
                    <span className="bg-gray-light text-gray-dark flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                      <IoStorefrontOutline className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold">{provider}</span>
                  </div>
                )}
                {groupSections.length > 0 && (
                  <div className="shadow-custom overflow-hidden rounded-xl bg-white">
                    {groupSections.map((s) => (
                      <DetailDisclosure
                        key={s.id}
                        id={s.id}
                        icon={s.icon}
                        title={s.title}
                        count={s.count}
                        valueHint={s.valueHint}
                        preview={s.preview}
                        open={open.has(s.id)}
                        focused={focused === s.id}
                        onToggle={() => {
                          setFocused(null);
                          toggle(s.id);
                        }}
                      >
                        {s.content}
                      </DetailDisclosure>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* The sticky panel — hangs from the fixed navbar once the header card is gone. Desktop
          always; mobile too in "full" mode. */}
      <div
        aria-hidden={!showBars}
        className={`fixed inset-x-0 top-20 z-30 bg-white shadow-md transition-opacity duration-200 motion-reduce:transition-none ${
          stickyMode === "full" ? "block" : "hidden md:block"
        } ${showBars ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-3 pt-3">
            {opportunity.organizationLogoURL && (
              <Image
                src={opportunity.organizationLogoURL}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 rounded-full object-contain"
              />
            )}
            <div className="min-w-0 grow">
              <p className="truncate text-base font-bold">
                {opportunity.title}
              </p>
              <p className="text-gray-dark flex items-center gap-2 text-xs">
                <MoneyBadge compact facts={money} />
                <span>{deadline}</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">{barActions}</div>
          </div>
          {tabs}
        </div>
      </div>

      {/* Mobile, "split" mode: the tabs pinned under the navbar, the actions in a bottom bar */}
      {stickyMode === "split" && (
        <div
          aria-hidden={!showBars}
          className={`fixed inset-x-0 top-20 z-30 bg-white px-4 shadow-md transition-opacity duration-200 motion-reduce:transition-none md:hidden ${
            showBars ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {tabs}
        </div>
      )}
      {/* room for the mobile bottom bar, so it never covers the last section or the footer */}
      {stickyMode === "split" && barActions && !preview && (
        <div className="h-16 md:hidden" />
      )}
      {stickyMode === "split" && barActions && (
        <div
          aria-hidden={!showBars}
          className={`fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 bg-white px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] transition-opacity duration-200 motion-reduce:transition-none md:hidden ${
            showBars ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {barActions}
        </div>
      )}
    </>
  );
};
