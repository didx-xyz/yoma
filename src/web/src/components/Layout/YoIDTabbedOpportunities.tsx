import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, type ReactElement, useState } from "react";
import MainLayout from "./Main";
import { PageBackground } from "../PageBackground";
import iconCards from "public/images/cards.png";
import Image from "next/image";
import { userProfileAtom } from "~/lib/store";
import { useAtom } from "jotai";
import { IoMdArrowForward, IoMdPerson } from "react-icons/io";
import { toBase64, shimmer } from "~/lib/image";
import iconZlto from "public/images/icon-zlto.svg";
import iconCheckmark from "public/images/icon-checkmark.png";
import iconTools from "public/images/icon-tools.png";
import iconCredential from "public/images/icon-credential.png";
import iconSmiley from "public/images/icon-smiley.png";
import iconShare from "public/images/icon-share.png";
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

  // 🔔 dropdown navigation change event
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(e.target.value);
  };

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
        badgeCount: null, //TODO: api
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
      <div className="flex flex-col gap-4 rounded-lg bg-white p-4">
        <h5 className="font-bold tracking-wider">My Opportunities</h5>

        {/* TABBED NAVIGATION */}
        <div className="gap-2x tabs tabs-bordered" role="tablist">
          <div className="border-b border-gray text-center text-sm font-medium text-gray-dark">
            <ul className="-mb-px flex flex-wrap">
              {/* TABS */}
              {tabItems.map((tabItem, index) => (
                <li className="me-2">
                  <Link
                    href={tabItem.url}
                    key={`TabNavigation_${index}`}
                    className={`inline-block rounded-t-lg border-b-2 px-4 py-2 ${
                      tabItem.selected
                        ? "active border-green"
                        : "border-transparent hover:border-gray hover:text-gray"
                    }`}
                    role="tab"
                  >
                    {tabItem.icon && (
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full shadow">
                        <Image
                          src={tabItem.icon}
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
                          className={`text-sm ${
                            tabItem.selected ? "font-bold" : ""
                          }`}
                        >
                          {tabItem.title}
                        </div>
                        <div className="text-xs text-gray-dark">
                          {tabItem.description}
                        </div>
                      </div>
                      {tabItem.badgeCount && (
                        <div className="badge ml-2 rounded-md bg-warning text-[12px] font-semibold text-white">
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
