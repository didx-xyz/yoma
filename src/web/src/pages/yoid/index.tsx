import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { env } from "process";
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { IoConstructOutline, IoDocumentTextOutline } from "react-icons/io5";
import { searchCredentials } from "~/api/services/credentials";
import { searchMyOpportunitiesSummary } from "~/api/services/myOpportunities";
import { UserSkillType } from "~/api/models/user";
import { getUserSkills } from "~/api/services/user";
import {
  YoIDSectionsRegistrar,
  type YoIDSectionId,
} from "~/components/YoID/yoidSections";
import { SectionLink, SKILLS_LINK_CLASS } from "~/components/YoID/SectionLink";
import {
  opportunitiesPreview,
  passportPreview,
  skillsPreview,
  walletPreview,
  YOID_TABS,
} from "~/components/YoID/yoidTabs";
import Suspense from "~/components/Common/Suspense";
import YoIDLayout from "~/components/Layout/YoID";
import NoRowsMessage from "~/components/NoRowsMessage";
import {
  DetailDisclosure,
  TONE,
} from "~/components/Opportunity/TabbedDetails/DetailDisclosure";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { OpportunitiesBody } from "~/components/YoID/OpportunitiesBody";
import { PassportCard, passportRows } from "~/components/YoID/PassportCard";
import { SkillsCard } from "~/components/YoID/SkillsCard";
import { WalletCard } from "~/components/YoID/WalletCard";
import {
  LoadingStatus,
  TileBodySkeleton,
} from "~/components/YoID/YoIDSkeletons";
import { MAXINT32 } from "~/lib/constants";
import { userProfileAtom } from "~/lib/store";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

/** The fixed navbar plus the layout's sticky chip bar: what a jumped-to section clears. */
const STICKY_OFFSET_PX = 80 + 56;
/** Room between the sticky bar and the section a chip lands on. */
const LANDING_GAP_PX = 12;

/**
 * The overview's sections in the chips' order, with their icon tints (the detail page's `TONE`).
 * From `lg` each row holds two sections — Wallet | Passport, Opportunities | Skills — and only the
 * static CV row spans the grid (Jason, 2026-10-22, superseding the 2026-10-21 Q3 spans).
 */
const SECTIONS: { id: YoIDSectionId; toneClass: string }[] = [
  { id: "wallet", toneClass: TONE.gold },
  { id: "passport", toneClass: TONE.lilac },
  { id: "opportunities", toneClass: TONE.blue },
  { id: "skills", toneClass: TONE.green },
];

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  // check if passport is enabled
  const passport_enabled =
    env.NEXT_PUBLIC_PASSPORT_ENABLED?.toLowerCase() == "true" ? true : false;

  return {
    props: {
      passport_enabled,
    },
  };
}

/**
 * The Yo-ID overview as the opportunity page's expandable sections (Jason, 2026-10-21): one
 * `DetailDisclosure` per section, open by default so the dashboard still shows its data, with
 * the layout's chips opening and scrolling to a section and following the scroll (scroll-spy).
 */
const YoIDDashboard: NextPageWithLayout<{
  error?: number;
  passport_enabled: boolean;
}> = ({ error, passport_enabled }) => {
  const [userProfile] = useAtom(userProfileAtom);

  const {
    data: skills,
    error: skillsError,
    isLoading: skillsIsLoading,
  } = useQuery({
    queryKey: ["User", "Skills", UserSkillType.Verified],
    queryFn: () => getUserSkills(UserSkillType.Verified),
    enabled: !error,
  });

  const {
    data: myOpportunitiesSummary,
    error: myOpportunitiesSummaryError,
    isLoading: myOpportunitiesSummaryIsLoading,
  } = useQuery({
    queryKey: ["MyOpportunities", "Summary"],
    queryFn: () => searchMyOpportunitiesSummary(),
    enabled: !error,
  });

  const {
    data: credentials,
    error: credentialsError,
    isLoading: credentialsIsLoading,
  } = useQuery<{ schemaType: string; totalCount: number | null }[]>({
    queryKey: ["Credentials", "TotalCounts"],
    queryFn: (): Promise<{ schemaType: string; totalCount: number | null }[]> =>
      Promise.all([
        searchCredentials({
          pageNumber: MAXINT32,
          pageSize: 1,
          schemaType: "Opportunity",
        }),
        searchCredentials({
          pageNumber: MAXINT32,
          pageSize: 1,
          schemaType: "YoID",
        }),
      ]).then(([opportunityResult, yoidResult]) => [
        {
          schemaType: "Opportunity",
          totalCount: opportunityResult.totalCount,
        },
        { schemaType: "YoID", totalCount: yoidResult.totalCount },
      ]),
    enabled: !error && passport_enabled,
  });

  // ── sections: open state, jump and scroll-spy, published to the layout's chips ──
  const [open, setOpen] = useState<Record<YoIDSectionId, boolean>>({
    wallet: true,
    passport: true,
    skills: true,
    opportunities: true,
  });
  const [active, setActive] = useState<YoIDSectionId | null>(null);
  const sectionRefs = useRef<Partial<Record<YoIDSectionId, HTMLElement>>>({});
  const register = useContext(YoIDSectionsRegistrar);
  // A chip tap owns the highlight while its scroll runs — on a short page the section may never
  // reach the spy line, and the scroll events would otherwise hand the highlight back at once.
  const holdRef = useRef<number | null>(null);

  const jump = useCallback((id: YoIDSectionId | "overview") => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
    if (holdRef.current) window.clearTimeout(holdRef.current);
    holdRef.current = window.setTimeout(() => (holdRef.current = null), 900);
    if (id === "overview") {
      setActive(null);
      window.scrollTo({ top: 0, behavior });
      return;
    }
    setActive(id);
    setOpen((current) => (current[id] ? current : { ...current, [id]: true }));
    const el = sectionRefs.current[id];
    if (!el) return;
    const top =
      el.getBoundingClientRect().top +
      window.scrollY -
      STICKY_OFFSET_PX -
      LANDING_GAP_PX;
    window.scrollTo({ top, behavior });
    el.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  }, []);

  // scroll-spy: the active section is the lowest one whose top has passed the sticky bar. From
  // `lg` each row's two sections tie on their tops: the active one keeps the highlight while it
  // is in that row, else the first in `SECTIONS` order.
  useEffect(() => {
    let frame = 0;
    const spy = (): void => {
      frame = 0;
      if (holdRef.current) return;
      const line = STICKY_OFFSET_PX + LANDING_GAP_PX + 1;
      let row: YoIDSectionId[] = [];
      let rowTop = -Infinity;
      for (const { id } of SECTIONS) {
        const el = sectionRefs.current[id];
        if (!el) continue;
        const top = Math.round(el.getBoundingClientRect().top);
        if (top > line || top < rowTop) continue;
        if (top > rowTop) {
          row = [];
          rowTop = top;
        }
        row.push(id);
      }
      setActive((current) => {
        const next = current && row.includes(current) ? current : row[0];
        return next ?? null;
      });
    };
    const onScroll = (): void => {
      if (!frame) frame = window.requestAnimationFrame(spy);
    };
    spy();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    register({ active, jump });
    return () => register({ active: null, jump: null });
  }, [register, active, jump]);

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  const toggle = (id: YoIDSectionId): void =>
    setOpen((current) => ({ ...current, [id]: !current[id] }));
  const setRef =
    (id: YoIDSectionId) =>
    (el: HTMLElement | null): void => {
      if (el) sectionRefs.current[id] = el;
      else delete sectionRefs.current[id];
    };

  // closed-row previews from data the page already has (shared with the user-menu drawer)
  const credentialCount = credentials?.reduce(
    (sum, c) => sum + (c.totalCount ?? 0),
    0,
  );

  return (
    <>
      <LoadingStatus
        when={
          !userProfile ||
          (passport_enabled && credentialsIsLoading) ||
          skillsIsLoading ||
          myOpportunitiesSummaryIsLoading
        }
      />

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
        {SECTIONS.map(({ id, toneClass }) => {
          const tab = YOID_TABS[id];
          const Icon = tab.icon;
          const common = {
            id,
            icon: <Icon aria-hidden className="h-5 w-5" />,
            toneClass,
            title: tab.label,
            note: tab.blurb,
            open: open[id],
            onToggle: () => toggle(id),
            focused: active === id,
          };
          return (
            <section key={id} id={id} ref={setRef(id)} aria-label={tab.label}>
              {id === "wallet" && (
                <DetailDisclosure
                  {...common}
                  preview={walletPreview(userProfile)}
                >
                  <Suspense
                    isLoading={!userProfile}
                    loader={<TileBodySkeleton />}
                  >
                    <WalletCard
                      userProfile={userProfile!}
                      link={<SectionLink id={id} />}
                    />
                  </Suspense>
                </DetailDisclosure>
              )}
              {id === "passport" && (
                <DetailDisclosure
                  {...common}
                  count={passport_enabled ? credentialCount : undefined}
                  preview={
                    passport_enabled
                      ? passportPreview(
                          credentials && passportRows(credentials),
                        )
                      : "Update in progress"
                  }
                >
                  {passport_enabled ? (
                    <Suspense
                      isLoading={credentialsIsLoading}
                      error={credentialsError}
                      loader={<TileBodySkeleton />}
                    >
                      <PassportCard data={credentials!} />
                    </Suspense>
                  ) : (
                    <NoRowsMessage
                      title={"Update in Progress"}
                      description={
                        "Credentials will begin displaying again soon. Thanks for your patience."
                      }
                      icon={
                        <IoConstructOutline
                          aria-hidden
                          className="text-green h-5 w-5"
                        />
                      }
                    />
                  )}
                  <SectionLink id={id} />
                </DetailDisclosure>
              )}
              {id === "skills" && (
                <DetailDisclosure
                  {...common}
                  count={skills?.length}
                  preview={skillsPreview(skills)}
                >
                  <Suspense
                    isLoading={skillsIsLoading}
                    error={skillsError}
                    loader={<TileBodySkeleton />}
                  >
                    <SkillsCard data={skills!} />
                  </Suspense>
                  <SectionLink id={id} className={SKILLS_LINK_CLASS} />
                </DetailDisclosure>
              )}
              {id === "opportunities" && (
                <DetailDisclosure
                  {...common}
                  preview={opportunitiesPreview(userProfile)}
                >
                  <OpportunitiesBody
                    summary={myOpportunitiesSummary}
                    isLoading={myOpportunitiesSummaryIsLoading}
                    error={myOpportunitiesSummaryError}
                    showSaved
                  />
                </DetailDisclosure>
              )}
            </section>
          );
        })}

        {/* CV — nothing to open yet */}
        <div className="lg:col-span-2">
          <DetailDisclosure
            id="cv"
            icon={<IoDocumentTextOutline aria-hidden className="h-5 w-5" />}
            toneClass={TONE.grey}
            title="CV"
            note="A CV built from your Yo-ID — coming soon."
            static
            open={false}
            onToggle={() => undefined}
          />
        </div>
      </div>
    </>
  );
};

YoIDDashboard.getLayout = function getLayout(page: ReactElement) {
  return <YoIDLayout>{page}</YoIDLayout>;
};

export default YoIDDashboard;
