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
        description: "", //"Completed, pending & saved",
        url: "/yoid/opportunities/completed",
        badgeCount: 17,
        selected: router.asPath === "/yoid/opportunities/completed",
        //icon: iconCheckmark,
      },
      {
        title: "Submitted",
        description: "", //"Skills gained through opportunities",
        url: "/yoid/opportunities/submitted",
        badgeCount: null,
        selected: router.asPath === "/yoid/opportunities/submitted",
        //icon: iconTools,
      },
      {
        title: "Declined",
        description: "", //"Digital credentials",
        url: "/yoid/opportunities/declined",
        badgeCount: null,
        selected: router.asPath === "/yoid/opportunities/declined",
        //icon: iconCredential,
      },
      {
        title: "Saved",
        description: "", //"My personal data",
        url: "/yoid/opportunities/saved",
        badgeCount: null,
        selected: router.asPath === "/yoid/opportunities/saved",
        //icon: iconSmiley,
      },
    ]);
  }, [router.asPath, setTabItems]);

  return (
    <YoIDTabbedLayout>
      <div className="flex flex-col gap-4 rounded-lg bg-white p-4">
        <h5 className="font-bold tracking-wider">My Opportunities</h5>

        {/* TABBED NAVIGATION */}
        <div className="gap-2x tabs tabs-bordered" role="tablist">
          {/* TABS */}
          {tabItems.map((tabItem, index) => (
            <Link
              href={tabItem.url}
              key={`TabNavigation_${index}`}
              className={`tab w-[3px] justify-start border-b-2 ${
                tabItem.selected ? "border-green" : "border-gray"
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
                  <div className="font-boldx uppercasex tracking-widestx text-sm">
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
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-grow">
          {/* DROPDOWN NAVIGATION: SMALL DISPLAY */}
          <div className="visible flex flex-none items-center justify-center pb-4 md:hidden">
            <select
              className="select max-w-lg"
              onChange={handleChange}
              value={router.asPath}
            >
              {tabItems.map((tabItem, index) => (
                <option
                  value={tabItem.url}
                  key={`DropdownNavigation_${index}`}
                  selected={tabItem.selected}
                >
                  {tabItem.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            {/* CHILDREN */}
            {children}
          </div>
        </div>
      </div>
    </YoIDTabbedLayout>
  );
};

export default YoIDTabbedOpportunities;
