import { useAtom } from "jotai";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, type ReactElement } from "react";
import type { TabItem } from "~/api/models/common";
import { userProfileAtom } from "~/lib/store";
import Breadcrumb from "../Breadcrumb";
import YoIDLayout from "./YoID";
import FormMessage, { FormMessageType } from "../Common/FormMessage";

export type TabProps = ({
  children,
}: {
  children: ReactElement;
}) => ReactElement;

const YoIDOpportunities: TabProps = ({ children }) => {
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
    <YoIDLayout>
      <div className="flex w-full flex-col gap-4 lg:max-w-7xl">
        {/* BREADCRUMB */}
        <div className="text-xs font-bold tracking-wider text-black md:text-base">
          <Breadcrumb
            items={[
              { title: "💳 Yo-ID", url: "/yoid" },
              {
                title: "🏆 Opportunities",
                url: "/yoid/opportunities/completed",
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
        </div>

        {/* NAVIGATION BUTTONS */}
        <div className="-mt-2 flex flex-row flex-wrap items-center justify-start gap-2">
          {tabItems.map((tab) => (
            <Link
              key={tab.title}
              href={tab.url!}
              rel="noopener noreferrer"
              className={`btn btn-sm border-gray text-gray-dark hover:border-gray-dark flex items-center text-xs ${
                tab.selected
                  ? "btn-secondary !text-gray border-0 hover:text-white"
                  : ""
              }`}
            >
              {tab.title}
            </Link>
          ))}
        </div>

        <FormMessage
          messageType={FormMessageType.Info}
          classNameLabel="!text-xs md:!text-sm"
        >
          Just completed an opportunity? Click
          <Link
            className="text-green mx-1 font-bold hover:underline"
            href="/yoid/opportunities/add"
          >
            here
          </Link>
          to add it.
        </FormMessage>

        {/* CHILDREN */}
        {children}
      </div>
    </YoIDLayout>
  );
};

export default YoIDOpportunities;
