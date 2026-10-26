import { useAtom } from "jotai";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ReactElement } from "react";
import { PillRow } from "~/components/Common/PillRow";
import { YoIDBreadcrumb } from "~/components/YoID/YoIDBreadcrumb";
import { INTRO_LINK_CLASS, YoIDIntro } from "~/components/YoID/YoIDIntro";
import { YOID_OPPORTUNITY_TABS, YOID_TABS } from "~/components/YoID/yoidTabs";
import { formatNumber } from "~/features/discovery/lib/format";
import {
  PILL_CLASS,
  PILL_COUNT_CLASS,
  PILL_CURRENT_CLASS,
  PILL_IDLE_CLASS,
  PILL_TOUCH_CLASS,
} from "~/lib/pill";
import { userProfileAtom } from "~/lib/store";
import YoIDLayout from "./YoID";

export type TabProps = ({
  children,
}: {
  children: ReactElement;
}) => ReactElement;

const YoIDOpportunities: TabProps = ({ children }) => {
  const router = useRouter();
  const [userProfile] = useAtom(userProfileAtom);
  const current = YOID_OPPORTUNITY_TABS.find((tab) =>
    router.asPath.startsWith(tab.url),
  );

  return (
    <YoIDLayout>
      <>
        <YoIDBreadcrumb
          trail={[
            {
              title: YOID_TABS.opportunities.label,
              url: YOID_TABS.opportunities.url,
            },
            ...(current ? [{ title: current.label }] : []),
          ]}
        />

        {/* Above the pills (Jason, 2026-10-21, superseding the day's earlier call): the prompt
            to add a completion leads, then the sub-pages */}
        <YoIDIntro>
          Just completed an opportunity?{" "}
          <Link className={INTRO_LINK_CLASS} href="/yoid/opportunities/add">
            Add it to your Yo-ID
          </Link>
        </YoIDIntro>

        {/* SUB-TABS — places, so they take the YoID tabs' tones; counts from the profile */}
        <nav aria-label="My opportunities">
          <PillRow
            shadowFromClassName="from-gray-light"
            className="md:flex-wrap"
          >
            {YOID_OPPORTUNITY_TABS.map((tab) => {
              const selected = tab === current;
              const count = userProfile?.[tab.count];
              return (
                <Link
                  key={tab.url}
                  href={tab.url}
                  aria-current={selected ? "page" : undefined}
                  title={tab.description}
                  draggable={false}
                  className={`${PILL_CLASS} ${PILL_TOUCH_CLASS} ${selected ? PILL_CURRENT_CLASS : PILL_IDLE_CLASS}`}
                >
                  <tab.icon aria-hidden className="h-4 w-4 shrink-0" />
                  {tab.label}
                  {count != null && (
                    <span className={PILL_COUNT_CLASS}>
                      {formatNumber(count)}
                    </span>
                  )}
                </Link>
              );
            })}
          </PillRow>
        </nav>

        {/* CHILDREN */}
        {children}
      </>
    </YoIDLayout>
  );
};

export default YoIDOpportunities;
