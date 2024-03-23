import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, type ReactElement, useState } from "react";
import Image from "next/image";
import { userProfileAtom } from "~/lib/store";
import { useAtom } from "jotai";
import { toBase64, shimmer } from "~/lib/image";
import type { TabItem } from "~/api/models/common";
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

  // set the tab items based on the current route
  useEffect(() => {
    setTabItems([
      {
        title: "Completed",
        description: "",
        url: "/yoid/opportunities/completed",
        badgeCount: userProfile?.opportunityCountCompleted,
        selected: router.asPath.startsWith("/yoid/opportunities/completed"),
      },
      {
        title: "Submitted",
        description: "",
        url: "/yoid/opportunities/submitted",
        badgeCount: userProfile?.opportunityCountPending,
        selected: router.asPath.startsWith("/yoid/opportunities/submitted"),
      },
      {
        title: "Declined",
        description: "",
        url: "/yoid/opportunities/declined",
        badgeCount: userProfile?.opportunityCountRejected,
        selected: router.asPath.startsWith("/yoid/opportunities/declined"),
      },
      {
        title: "Saved",
        description: "",
        url: "/yoid/opportunities/saved",
        badgeCount: userProfile?.opportunityCountSaved,
        selected: router.asPath.startsWith("/yoid/opportunities/saved"),
      },
    ]);
  }, [router.asPath, setTabItems, userProfile]);

  return (
    <YoIDTabbedLayout>
      <div className="mb-8 mt-2 flex w-full flex-col gap-4 rounded-lg bg-white p-4">
        <h5 className="font-bold tracking-wider">My Opportunities</h5>

        {/* TABBED NAVIGATION */}
        <div className="flex w-full gap-2">
          {/* LEFT BUTTON MOBILE */}
          <div className="-ml-2 flex items-center md:hidden">
            <button
              className="bg-white focus:outline-none"
              onClick={() => {
                const tabList = document.querySelector('[role="tablist"]');
                if (tabList) {
                  tabList.scrollLeft -= 100;
                }
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          {/* TABS */}
          <div
            className="tabs tabs-bordered gap-2 overflow-x-scroll md:overflow-hidden"
            role="tablist"
          >
            <div className="border-b border-transparent text-center text-sm font-medium text-gray-dark">
              <ul className="-mb-px flex w-full md:flex-wrap md:gap-6">
                {tabItems.map((tabItem, index) => (
                  <li className="me-2" key={`TabNavigation_${index}`}>
                    <Link
                      href={tabItem.url}
                      className={`inline-block rounded-t-lg border-b-4 px-2 py-2 md:px-4 ${
                        tabItem.selected
                          ? "active border-green"
                          : "border-transparent hover:border-gray hover:text-gray"
                      }`}
                      role="tab"
                    >
                      {tabItem.iconImage && (
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full shadow">
                          <Image
                            src={tabItem.iconImage}
                            alt={`${tabItem.title} icon`}
                            width={20}
                            height={20}
                            sizes="(max-width: 20px) 30vw, 50vw"
                            priority={true}
                            placeholder="blur"
                            blurDataURL={`data:image/svg+xml;base64,${toBase64(
                              shimmer(20, 20),
                            )}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              maxWidth: "20px",
                              maxHeight: "20px",
                            }}
                          />
                        </div>
                      )}

                      <div className="flex flex-row">
                        <div className="flex flex-col">
                          <div
                            className={`my-auto text-sm ${
                              tabItem.selected ? "font-bold" : ""
                            }`}
                          >
                            {tabItem.title}
                          </div>

                          {tabItem.description && (
                            <div className="text-xs text-gray-dark">
                              {tabItem.description}
                            </div>
                          )}
                        </div>

                        {!!tabItem.badgeCount && (
                          <div className="badge my-auto ml-2 bg-warning text-[12px] font-semibold text-white">
                            {tabItem.badgeCount}
                          </div>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT BUTTON MOBILE */}
          <div className="-mr-2 flex items-center md:hidden ">
            <button
              className="bg-white focus:outline-none"
              onClick={() => {
                const tabList = document.querySelector('[role="tablist"]');
                if (tabList) {
                  tabList.scrollLeft += 100;
                }
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-grow">
          {/* CHILDREN */}
          {children}
        </div>
      </div>
    </YoIDTabbedLayout>
  );
};

export default YoIDTabbedOpportunities;
