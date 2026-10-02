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
  finiteOrNull,
  formatAccessibilitySupport,
  formatIncentivized,
  formatPartnerIncentive,
  formatRewardType,
  formatSustainableDevelopmentGoal,
} from "~/components/Opportunity/Admin/opportunityCoreFields";
import { CustomFieldsView } from "~/components/Opportunity/CustomFieldsView";
import { getCommitmentDisplay } from "~/components/Opportunity/opportunityTypeTheme";
import { MoneyBadge } from "~/features/discovery/components/Results/MoneyBadge";
import { closingInfo } from "~/features/discovery/lib/dates";
import { formatNumber } from "~/features/discovery/lib/format";
import { moneyFactsOf } from "~/features/discovery/lib/money";
import {
  useCurrenciesQuery,
  useOpportunityCustomFieldDefinitionsQuery,
} from "~/hooks/useOpportunityMutations";
import { OPPORTUNITY_TYPE_NANE_JOB } from "~/lib/constants";
import { ClampedDescription } from "./ClampedDescription";
import { ChipList, DetailDisclosure } from "./DetailDisclosure";
import { effortLabel } from "./detailFacts";

// ─────────────────────────────────────────────────────────────────────────────
// OpportunityDetailSections — the TABBED detail body (round 7, artboards
// 11a–11e, 2026-09-30; the live layout behind the release kill-switch since
// 2026-10-01 — `CUSTOM_FIELDS_ENABLED` off falls back to the classic one;
// restyled in round 10, 2026-10-02). Under the header card:
//
//   anchor tabs  About · Requirements · Who it's for · Impact · Provider · Details (+ host
//                groups, e.g. the admin page's Rewards), as a pill bar with a sliding fill
//                (same-page anchors with scroll-spy; a tap opens that group's first
//                section; a group with nothing to show has no tab)
//   sections     one card per section, grouped, two columns from `lg` — the SAME
//                section set, content and conditions as the existing public page;
//                the passes regroup and restyle only
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

/** A tab's tint while inactive: `reward` is the admin page's gold Rewards pill (round 10). */
type GroupTone = "reward";

interface GroupDef {
  id: GroupId;
  label: string;
  tone?: GroupTone;
}

const GROUPS: GroupDef[] = [
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
  /** The icon square's tint (`TONE`). */
  toneClass: string;
  title: string;
  count?: number | null;
  valueHint?: string | null;
  preview?: string | null;
  /** The open card's one line on what its chips mean for the youth (chip sections only). */
  note?: string | null;
  content: React.ReactNode;
  defaultOpen?: boolean;
  /** A value row with nothing to open (Age range). */
  static?: boolean;
}

const ICON = "h-5 w-5";

/** The section icon squares' tints, per group (round 10). Provider keeps its grey card. */
const TONE = {
  gold: "bg-orange-light text-yellow",
  blue: "bg-blue-light text-blue-dark",
  lilac: "bg-purple-tint text-purple",
  green: "bg-green-light text-green",
  grey: "bg-gray-light text-gray-dark",
} as const;

/** "English, isiZulu +2" — the closed row's preview. */
const previewOf = (labels: string[], max = 2): string =>
  labels.length > max
    ? `${labels.slice(0, max).join(", ")} +${labels.length - max}`
    : labels.join(", ");

/**
 * "18–35 years" · "18 and over" · "Up to 35 years" — the tabbed age row's own wording. Null
 * exactly when `formatAgeRange` is (neither bound set), which classic still uses.
 */
const ageRangeLabel = (
  ageFrom: number | null | undefined,
  ageTo: number | null | undefined,
): string | null => {
  const from = finiteOrNull(ageFrom);
  const to = finiteOrNull(ageTo);
  if (from !== null && to !== null)
    return from === to ? `${from} years` : `${from}–${to} years`;
  if (from !== null) return `${from} and over`;
  if (to !== null) return `Up to ${to} years`;
  return null;
};

/** The fixed navbar the sticky panels hang from. */
const NAVBAR_PX = 80;
/** Room between the sticky panel and the group heading a tab tap lands on. */
const LANDING_GAP_PX = 12;

/**
 * The anchor tabs as a segmented pill bar (round 10): one purple fill slides under the active
 * tab. Each home — in flow, the sticky panel, the mobile pin — renders its own instance and
 * measures its own fill. The bar scrolls sideways when it does not fit; below `md` it then
 * fades out at its right edge while more tabs are hidden there.
 */
const DetailTabs: React.FC<{
  groups: GroupDef[];
  active: GroupId;
  onSelect: (group: GroupId) => void;
}> = ({ groups, active, onSelect }) => {
  const navRef = useRef<HTMLElement>(null);
  const [fill, setFill] = useState<{ left: number; width: number } | null>(
    null,
  );
  const [moreRight, setMoreRight] = useState(false);
  const groupKey = groups.map((g) => g.id).join(",");

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = (): void => {
      const tab = nav.querySelector<HTMLElement>('[aria-current="location"]');
      // a hidden home (display: none) measures 0 — it is re-measured once it shows
      const next =
        tab && tab.offsetWidth > 0
          ? { left: tab.offsetLeft, width: tab.offsetWidth }
          : null;
      // the bar's own scrolling re-measures too: keep the state when nothing moved
      setFill((current) =>
        current &&
        next &&
        current.left === next.left &&
        current.width === next.width
          ? current
          : next,
      );
      setMoreRight(nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    for (const tab of Array.from(nav.children)) observer.observe(tab);
    nav.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      nav.removeEventListener("scroll", measure);
    };
  }, [active, groupKey]);

  return (
    <nav
      ref={navRef}
      aria-label="Opportunity sections"
      className={`border-gray relative flex w-fit max-w-full gap-1 overflow-x-auto overflow-y-hidden rounded-full border bg-white p-1.5 ${
        moreRight
          ? "max-md:[mask-image:linear-gradient(to_right,black_calc(100%-40px),transparent)]"
          : ""
      }`}
      // inline: the global unlayered `* { scrollbar-width: thin }` outranks any utility class
      style={{ scrollbarWidth: "none" }}
    >
      {fill && (
        <span
          aria-hidden
          className="bg-purple absolute inset-y-1.5 rounded-full transition-[left,width] duration-220 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
          style={{ left: fill.left, width: fill.width }}
        />
      )}
      {groups.map((g) => (
        <a
          key={g.id}
          href={`#${g.id}`}
          aria-current={active === g.id ? "location" : undefined}
          onClick={(e) => {
            e.preventDefault();
            onSelect(g.id);
          }}
          className={`relative z-10 shrink-0 rounded-full px-4 py-2 text-sm font-extrabold whitespace-nowrap transition-colors duration-220 motion-reduce:transition-none ${
            active === g.id
              ? // filled by the sliding span once measured; until then (first paint) by itself
                `text-white ${fill ? "" : "bg-purple"}`
              : g.tone === "reward"
                ? // the gold pill carries the tint; a dark label keeps it readable (AA)
                  "bg-orange-light text-black/85 hover:text-black"
                : "text-gray-dark hover:text-black"
          }`}
        >
          {g.label}
        </a>
      ))}
    </nav>
  );
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
  /**
   * Host groups appended after Details, each with its own tab (admin: Rewards, `tone: "reward"`
   * for its gold pill).
   */
  extraGroups?: {
    id: string;
    label: string;
    tone?: GroupTone;
    content: React.ReactNode;
  }[];
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
      // A ZLTO reward reads as what you earn (round 10): "Earn 293 ZLTO", or "Earn ZLTO" when
      // there is no estimate. A depleted reward (0), other reward types and "Not specified"
      // keep their labels — the strip already says "Depleted".
      const estimate = opportunity.zltoRewardEstimate;
      let incentivePreview = labels.join(" · ");
      if (
        opportunity.incentivized === true &&
        opportunity.rewardType === RewardType.ZLTO
      ) {
        if (estimate == null) incentivePreview = "Earn ZLTO";
        else if (estimate > 0)
          incentivePreview = `Earn ${formatNumber(estimate)} ZLTO`;
      }
      list.push({
        id: "incentive",
        group: "about",
        icon: <IoGiftOutline className={ICON} />,
        toneClass: TONE.gold,
        title: "Incentive",
        preview: incentivePreview,
        note: "What you could get for taking part.",
        content: (
          <ChipList items={labels.map((label) => ({ id: label, label }))} />
        ),
      });
    }

    // Time needed — the interval ("4 minutes"), else the total hours; an interval given only
    // as a description is shown as it is, without "About"
    const commitment = getCommitmentDisplay(opportunity);
    const effort = effortLabel(opportunity);
    const time = effort ?? commitment?.label ?? null;
    if (time)
      list.push({
        id: "time",
        group: "about",
        icon: <IoTimeOutline className={ICON} />,
        toneClass: TONE.blue,
        title: "Time needed",
        preview: effort ? `About ${effort}` : time,
        content: (
          <div className="text-sm">
            {`Most people finish in ${time} or less.`}
            <p className="text-gray-dark mt-2">
              It&apos;s only a guide — go at your own pace.
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
        toneClass: isJob ? TONE.lilac : TONE.blue,
        title: isJob ? "Skills required" : "Skills you will learn",
        count: skills.length,
        preview: previewOf(skills.map((s) => s.label)),
        note: isJob
          ? "Skills this job asks for. Mention the ones you have when you apply."
          : "Skills you'll build by completing this. They're added to your YoID.",
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
        toneClass: TONE.lilac,
        title: "Languages",
        count: languages.length,
        preview: previewOf(languages.map((l) => l.label)),
        note: "The languages you can take part in.",
        content: <ChipList items={languages} />,
      });

    // Age range — one static row: the range is the whole answer, there is nothing to open
    const ageRange = ageRangeLabel(opportunity.ageFrom, opportunity.ageTo);
    if (ageRange)
      list.push({
        id: "age",
        group: "requirements",
        icon: <IoPersonOutline className={ICON} />,
        toneClass: TONE.lilac,
        title: "Age range",
        valueHint: ageRange,
        content: null,
        static: true,
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
        toneClass: TONE.lilac,
        title: "Accessibility",
        count: accommodations.length > 0 ? accommodations.length : null,
        preview:
          accommodations.length > 0
            ? previewOf(accommodations.map((a) => a.label))
            : `Support: ${support}`,
        // only with chips: the "Support: …" line alone already says what it is
        note:
          accommodations.length > 0
            ? "What this opportunity offers people with disabilities."
            : null,
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
        toneClass: TONE.green,
        title: "Targeted groups",
        count: groups.length,
        preview: previewOf(groups.map((g) => g.label)),
        note: "Who this is aimed at. It doesn't limit who can take part.",
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
        toneClass: TONE.green,
        title: "Countries",
        count: countries.length,
        preview: previewOf(countries.map((c) => c.label)),
        note: "Where this opportunity is available.",
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
        toneClass: TONE.blue,
        title: "Global goals (SDGs)",
        count: goals.length,
        preview: previewOf(goals.map((g) => g.label)),
        note: "The UN global goals that taking part helps towards.",
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
        toneClass: TONE.blue,
        title: "Topics",
        count: topics.length,
        preview: previewOf(topics.map((t) => t.label)),
        note: "What this opportunity is about.",
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
        toneClass: TONE.grey,
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
    ...extraGroups.map(({ id, label, tone }) => ({ id, label, tone })),
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

  // ── the top offset the tabs and anchors clear: the navbar plus whichever sticky panel this
  //    viewport shows — the full panel, or the mobile tab pin — measured, since the pill bar
  //    changed their heights. The one not shown is display: none and measures 0. ──
  const stickyRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const offsetTop = useCallback(
    (): number =>
      NAVBAR_PX +
      LANDING_GAP_PX +
      Math.max(
        stickyRef.current?.offsetHeight ?? 0,
        pinRef.current?.offsetHeight ?? 0,
      ),
    [],
  );

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
      const line = offsetTop() + 8;
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
          el.getBoundingClientRect().top + window.scrollY - offsetTop();
        window.scrollTo({ top, behavior: "smooth" });
      }
      if (!preview) window.history.replaceState(null, "", `#${group}`);
    },
    [sections, preview, offsetTop],
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
    <DetailTabs groups={visibleGroups} active={active} onSelect={goTo} />
  );

  const money = moneyFactsOf(opportunity, currencies ?? []);
  const deadline = closingInfo(opportunity.dateEnd, now).label;
  const showBars = !preview && !headerVisible;
  // The bars slide 8px and fade (round 10); under reduced motion they simply switch. Tailwind
  // v4's `translate-y-*` sets the `translate` property, not `transform`, so that is what eases.
  // Shown, it is `none`, not 0: any other value makes the bar the containing block of its
  // `position: fixed` descendants (the Manage menu's full-screen <Loading/> would shrink to
  // the panel). Hidden, the bars are inert as well as aria-hidden, so they leave the tab order.
  const barMotion =
    "transition-[opacity,translate] duration-180 ease-out motion-reduce:transition-none";
  const barShown = "translate-none opacity-100";

  return (
    <>
      {/* In-flow tabs, under the header card */}
      {tabs}

      <div className="flex flex-col gap-6 pt-2">
        {visibleGroups.map((g) => {
          const groupSections = sections.filter((s) => s.group === g.id);
          const hostContent = extraGroups.find((x) => x.id === g.id)?.content;
          const showProvider = g.id === "provider" && !!provider;
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
              {/* Two columns from `lg`: the description and host content span both; cards flow
                  into the next cell (an odd one out, a lone card too, takes the left), and a
                  closed card never stretches to an open neighbour's height */}
              <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 lg:items-start">
                {g.id === "about" && (
                  <div className="border-gray rounded-[18px] border bg-white px-5 py-5 md:px-[30px] md:py-[26px] lg:col-span-2">
                    <ClampedDescription value={opportunity.description} />
                  </div>
                )}
                {hostContent && (
                  <div className="lg:col-span-2">{hostContent}</div>
                )}
                {showProvider && (
                  // Provider is a card, not a disclosure — informational provider text,
                  // not the owning organisation
                  <div className="border-gray flex items-center gap-3.5 rounded-[18px] border bg-white px-5 py-[18px]">
                    <span className="bg-gray-light text-gray-dark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                      <IoStorefrontOutline className={ICON} />
                    </span>
                    <span className="min-w-0 text-[15px] font-extrabold text-black">
                      {provider}
                    </span>
                  </div>
                )}
                {groupSections.map((s) => (
                  <DetailDisclosure
                    key={s.id}
                    id={s.id}
                    icon={s.icon}
                    toneClass={s.toneClass}
                    title={s.title}
                    count={s.count}
                    valueHint={s.valueHint}
                    preview={s.preview}
                    note={s.note}
                    static={s.static}
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
            </section>
          );
        })}
      </div>

      {/* The sticky panel — hangs from the fixed navbar once the header card is gone. Desktop
          always; mobile too in "full" mode. */}
      <div
        ref={stickyRef}
        aria-hidden={!showBars}
        inert={!showBars}
        className={`fixed inset-x-0 top-20 z-30 bg-white shadow-md ${barMotion} ${
          stickyMode === "full" ? "block" : "hidden md:block"
        } ${
          showBars ? barShown : "pointer-events-none -translate-y-2 opacity-0"
        }`}
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
          <div className="pt-2 pb-2.5">{tabs}</div>
        </div>
      </div>

      {/* Mobile, "split" mode: the tabs pinned under the navbar, the actions in a bottom bar */}
      {stickyMode === "split" && (
        <div
          ref={pinRef}
          aria-hidden={!showBars}
          inert={!showBars}
          className={`fixed inset-x-0 top-20 z-30 bg-white px-4 py-2 shadow-md md:hidden ${barMotion} ${
            showBars ? barShown : "pointer-events-none -translate-y-2 opacity-0"
          }`}
        >
          {tabs}
        </div>
      )}
      {/* room for the mobile bottom bar, so it never covers the last section or the footer */}
      {stickyMode === "split" && barActions && !preview && (
        <div className="h-[74px] md:hidden" />
      )}
      {stickyMode === "split" && barActions && (
        <div
          aria-hidden={!showBars}
          inert={!showBars}
          className={`fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 bg-white px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] md:hidden ${barMotion} ${
            showBars ? barShown : "pointer-events-none translate-y-2 opacity-0"
          }`}
        >
          {barActions}
        </div>
      )}
    </>
  );
};
