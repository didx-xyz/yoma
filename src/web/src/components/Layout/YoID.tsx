import { useAtom } from "jotai";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { IoIosInformationCircleOutline } from "react-icons/io";
import AnimatedText from "~/components/Opportunity/AnimatedText";
import { JumpToTop } from "~/components/Common/JumpToTop";
import { PillRow, centrePillInRow } from "~/components/Common/PillRow";
import {
  YoIDSectionsRegistrar,
  type YoIDSectionsState,
} from "~/components/YoID/yoidSections";
import { YOID_TABS, currentYoIDTab } from "~/components/YoID/yoidTabs";
import { PILL_CLASS, PILL_CURRENT_CLASS, PILL_IDLE_CLASS } from "~/lib/pill";
import { userProfileAtom } from "~/lib/store";
import { getTimeOfDayAndIcon } from "~/lib/utils";
import { PageBackground } from "../PageBackground";
import MainLayout from "./Main";
import { YoIdModal } from "../YoID/YoIdModal";

const NO_SECTIONS: YoIDSectionsState = { active: null, jump: null };

/**
 * The Yo-ID chips: the hero's row and, once the hero has scrolled away, the sticky bar's. On the
 * overview a chip opens its section and scrolls to it (`sections.jump`), as the opportunity
 * page's tabs do; everywhere else it is a link to the page. `current` is the page's own tab, or on
 * the overview the section under the bar.
 */
const YoIDChips: React.FC<{
  path: string;
  sections: YoIDSectionsState;
  shadowFromClassName: string;
  className?: string;
}> = ({ path, sections, shadowFromClassName, className }) => {
  // On the overview the current chip follows the scroll: keep it in view on a phone.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const pill = rootRef.current?.querySelector<HTMLElement>(
      '[aria-pressed="true"]',
    );
    if (pill) centrePillInRow(pill);
  }, [sections.active]);

  return (
    <div ref={rootRef}>
      <PillRow shadowFromClassName={shadowFromClassName} className={className}>
        {(Object.keys(YOID_TABS) as (keyof typeof YOID_TABS)[]).map((key) => {
          const tab = YOID_TABS[key];
          const current = sections.jump
            ? (sections.active ?? "overview") === key
            : tab.isCurrent(path);
          const pill = `${PILL_CLASS} min-h-9 ${current ? PILL_CURRENT_CLASS : PILL_IDLE_CLASS}`;
          const label = (
            <>
              <tab.icon aria-hidden className="h-4 w-4 shrink-0" />
              {tab.label}
            </>
          );
          return sections.jump ? (
            <button
              key={key}
              type="button"
              aria-pressed={current}
              className={pill}
              title={tab.description}
              onClick={() => sections.jump?.(key)}
            >
              {label}
            </button>
          ) : (
            <Link
              key={key}
              href={tab.url}
              aria-current={current ? "page" : undefined}
              className={pill}
              title={tab.description}
              draggable={false}
            >
              {label}
            </Link>
          );
        })}
      </PillRow>
    </div>
  );
};

export type TabProps = ({
  children,
}: {
  children: ReactElement;
}) => ReactElement;

const YoIDLayout: TabProps = ({ children }) => {
  const router = useRouter();
  // The path only: the server's `asPath` never has the `#hash` the client's may, and a query
  // string must not stop the Overview tab matching.
  const path = router.asPath.split(/[?#]/)[0] ?? "";
  const [userProfile] = useAtom(userProfileAtom);
  const [yoIdModalVisible, setYoIdModalVisible] = useState(false);
  const [timeOfDay, TimeOfDayIcon] = getTimeOfDayAndIcon();
  const firstName = userProfile?.firstName;

  // The welcome line rotates, as discovery's hero does, and says what the current page is for
  // (Jason, 2026-10-21): the sentences come from the tab registry, with the youth's own numbers.
  const tab = currentYoIDTab(path);
  const greetingSentences = useMemo(
    () => tab.sentences(userProfile),
    [tab, userProfile],
  );

  // The overview registers its expandable sections and unregisters when it unmounts; a subpage
  // never registers. (A path-keyed reset here would run after the overview's own register effect
  // on first mount — child effects run first — and leave the chips as links.)
  const [sections, setSections] = useState<YoIDSectionsState>(NO_SECTIONS);
  const register = useCallback(
    (state: YoIDSectionsState) => setSections(state),
    [],
  );

  // The sticky chip bar hangs from the fixed navbar once the hero has scrolled away, as the
  // opportunity page's sticky panel does (Jason, 2026-10-21).
  const headerRef = useRef<HTMLElement>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeaderVisible(!!entry?.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" }, // the fixed navbar covers the top 80px
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const showBar = !headerVisible;

  return (
    <MainLayout>
      {/* MainLayout centres a flex child, so the root claims the full width itself, as discovery's. */}
      <div className="flex w-full flex-col">
        <Head>
          <title>Yoma | Yo-ID</title>
        </Head>

        <YoIdModal
          isOpen={yoIdModalVisible}
          onClose={() => setYoIdModalVisible(false)}
        />

        {/* Discovery's hero band (`DiscoverySurface`), in flow, with the Yo-ID world map on it
            (Jason, 2026-10-20). */}
        <header ref={headerRef} className="w-full">
          <PageBackground className="px-4 pt-20 pb-4 md:pt-24">
            <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3">
              {/* GREETING — discovery's heading design: the first name in orange, then the
                  rotating line under it, centred (no avatar, no "!": Jason, 2026-10-22) */}
              <div className="flex max-w-full min-w-0 flex-col items-center text-center">
                <div className="flex max-w-full items-center justify-center gap-1">
                  <h1 className="line-clamp-2 min-w-0 text-xl font-semibold md:text-2xl">
                    <TimeOfDayIcon
                      aria-hidden
                      className="text-orange mr-1.5 inline-block h-6 w-6 align-[-0.15em] md:h-7 md:w-7"
                    />
                    Good {timeOfDay}
                    {firstName && (
                      <>
                        , <span className="text-orange">{firstName}</span>
                      </>
                    )}
                  </h1>
                  <button
                    type="button"
                    aria-label="What is Yo-ID?"
                    title="What is Yo-ID?"
                    className="-m-2.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                    onClick={() => setYoIdModalVisible(true)}
                  >
                    <IoIosInformationCircleOutline
                      aria-hidden
                      className="h-5 w-5"
                    />
                  </button>
                </div>
                <div className="flex justify-center pt-1">
                  <AnimatedText sentences={greetingSentences} />
                </div>
              </div>

              {/* TABS */}
              <nav aria-label="Yo-ID" className="w-full min-w-0">
                <YoIDChips
                  path={path}
                  sections={sections}
                  shadowFromClassName="from-purple"
                  className="justify-center-safe"
                />
              </nav>
            </div>
          </PageBackground>
        </header>

        {/* STICKY BAR — the same chips, pinned under the navbar while the hero is off screen */}
        <div
          aria-hidden={!showBar}
          inert={!showBar}
          className={`scroll-lock-pad fixed inset-x-0 top-20 z-30 bg-white shadow-md transition-[opacity,transform] duration-200 motion-reduce:transition-none ${
            showBar
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0"
          }`}
        >
          <nav
            aria-label="Yo-ID sections"
            className="mx-auto w-full max-w-7xl px-4 py-2"
          >
            <YoIDChips
              path={path}
              sections={sections}
              shadowFromClassName="from-white"
              className="justify-center-safe"
            />
          </nav>
        </div>

        <YoIDSectionsRegistrar.Provider value={register}>
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4">
            {children}
            <JumpToTop />
          </div>
        </YoIDSectionsRegistrar.Provider>
      </div>
    </MainLayout>
  );
};

export default YoIDLayout;
