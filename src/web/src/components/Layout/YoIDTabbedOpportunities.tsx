import { useAtom } from "jotai";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, type ReactElement } from "react";
import type { TabItem } from "~/api/models/common";
import { userProfileAtom } from "~/lib/store";
import Breadcrumb from "../Breadcrumb";
import YoIDTabbedLayout from "./YoIDTabbed";

export type TabProps = ({
  children,
}: {
  children: ReactElement;
}) => ReactElement;

const YoIDTabbedOpportunities: TabProps = ({ children }) => {
  const router = useRouter();
  const [userProfile] = useAtom(userProfileAtom);
  const [tabItems, setTabItems] = useState<TabItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabItem | null>(null);

  // set the tab items based on the current route
  useEffect(() => {
    const localData = [
      {
        title: "✅ Completed",
        description: "Opportunities that you have completed",
        url: "/yoid/opportunities/completed",
        badgeCount: userProfile?.opportunityCountCompleted,
        selected: router.asPath.startsWith("/yoid/opportunities/completed"),
      },
      {
        title: "⌚ Pending",
        description: "Opportunities that are pending verification",
        url: "/yoid/opportunities/pending",
        badgeCount: userProfile?.opportunityCountPending,
        selected: router.asPath.startsWith("/yoid/opportunities/pending"),
      },
      {
        title: "❌ Rejected",
        description: "Opportunities that have been rejected",
        url: "/yoid/opportunities/rejected",
        badgeCount: userProfile?.opportunityCountRejected,
        selected: router.asPath.startsWith("/yoid/opportunities/rejected"),
      },
      {
        title: "💗 Saved",
        description: "Opportunities that you have saved",
        url: "/yoid/opportunities/saved",
        badgeCount: userProfile?.opportunityCountSaved,
        selected: router.asPath.startsWith("/yoid/opportunities/saved"),
      },
    ];

    setTabItems(localData);

    setSelectedTab(localData.find((tab) => tab.selected) || null);
  }, [router.asPath, setTabItems, setSelectedTab, userProfile]);

  return (
    <YoIDTabbedLayout>
      <div className="flex w-full flex-col gap-4">
        {/* BREADCRUMB */}
        <h5 className="font-bold tracking-wider text-black">
          <Breadcrumb
            items={[
              { title: "💳 Yo-ID", url: "/yoid" },
              {
                title: "🏆 Opportunities",
                url: "/yoid/opportunities",
                selected: false,
              },

              ...(selectedTab
                ? [
                    {
                      title: selectedTab.title,
                      selected: true,
                    },
                  ]
                : []),
            ]}
          />
        </h5>

        {/* NAVIGATION BUTTONS */}
        <div className="-mt-2 flex flex-row flex-wrap items-center justify-start gap-2">
          {tabItems.map((tab) => (
            <Link
              key={tab.title}
              href={tab.url!}
              rel="noopener noreferrer"
              className={`btn btn-sm tooltip tooltip-secondary flex items-center border-gray text-xs text-gray-dark hover:border-gray-dark ${
                tab.selected
                  ? "btn-secondary border-0 !text-gray hover:text-white"
                  : ""
              }`}
              data-tip={tab.description}
            >
              {tab.title}
            </Link>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-grow rounded-lg bg-white p-4">
          {/* CHILDREN */}
          {children}
        </div>
      </div>
    </YoIDTabbedLayout>
  );
};

export default YoIDTabbedOpportunities;
