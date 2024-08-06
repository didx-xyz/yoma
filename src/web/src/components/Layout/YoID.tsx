import { useAtom } from "jotai";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import iconCheckmark from "public/images/icon-checkmark.png";
import iconCog from "public/images/icon-cog.webp";
import iconCredential from "public/images/icon-credential.png";
import iconTools from "public/images/icon-tools.png";
import { useEffect, useState, type ReactElement } from "react";
import { IoIosInformationCircleOutline } from "react-icons/io";
import type { TabItem } from "~/api/models/common";
import { userProfileAtom } from "~/lib/store";
import { getTimeOfDayAndEmoji } from "~/lib/utils";
import { AvatarImage } from "../AvatarImage";
import { PageBackground } from "../PageBackground";
import { ZltoModal } from "../YoID/ZltoModal";
import MainLayout from "./Main";

export type TabProps = ({
  children,
}: {
  children: ReactElement;
}) => ReactElement;

const YoIDLayout: TabProps = ({ children }) => {
  const router = useRouter();
  const [userProfile] = useAtom(userProfileAtom);
  const [tabItems, setTabItems] = useState<TabItem[]>([]);
  const [zltoModalVisible, setZltoModalVisible] = useState(false);
  const [timeOfDay, timeOfDayEmoji] = getTimeOfDayAndEmoji();

  // set the tab items based on the current route
  useEffect(() => {
    setTabItems([
      {
        title: "💳 Yo-ID",
        description: "Overview of your Yo-ID",
        url: "/yoid",
        badgeCount: null,
        selected: router.asPath == "/yoid",
        iconImage: iconCheckmark,
      },
      {
        title: "🏆 Opportunities",
        description: "Completed, pending, rejected & saved opportunities",
        url: "/yoid/opportunities/completed",
        badgeCount: null,
        selected: router.asPath.startsWith("/yoid/opportunities/completed"),
        iconImage: iconCheckmark,
      },
      {
        title: "⚡ Skills",
        description: "Skills gained through opportunities",
        url: "/yoid/skills",
        badgeCount: null,
        selected: router.asPath.startsWith("/yoid/skills"),
        iconImage: iconTools,
      },
      {
        title: "🌐 Passport",
        description: "My digital credentials",
        url: "/yoid/passport",
        badgeCount: null,
        selected: router.asPath.startsWith("/yoid/passport"),
        iconImage: iconCredential,
      },
      {
        title: "👤 Profile",
        description: "My personal data",
        url: "/yoid/profile",
        badgeCount: null,
        selected: router.asPath.startsWith("/yoid/profile"),
        iconImage: iconCog,
      },
    ]);
  }, [router.asPath, setTabItems]);

  return (
    <MainLayout>
      <>
        <Head>
          <title>Yoma | Yo-ID</title>
        </Head>

        <PageBackground className="h-[16rem]" includeStamps={true} />

        <ZltoModal
          isOpen={zltoModalVisible}
          onClose={() => setZltoModalVisible(false)}
        />

        <div className="container z-10 mt-20 p-4 md:mt-24">
          {/* HEADER */}
          <div className="flex flex-row justify-center gap-4">
            <div className="hidden sm:flex sm:scale-75 md:scale-90">
              <AvatarImage
                icon={userProfile?.photoURL ?? null}
                alt="User Logo"
                size={85}
              />
            </div>
            <div className="w-fullx flex flex-col gap-2 lg:w-auto">
              {/* WELCOME MSG */}
              <div className="-mb-2 max-w-xs truncate text-lg font-semibold text-white md:max-w-xl md:text-2xl">
                {timeOfDayEmoji} Good {timeOfDay} {userProfile?.firstName}!
              </div>

              <div className="flex flex-row items-center gap-2 text-white">
                {/* DESCRIPTION */}
                <span className="truncate text-sm md:text-base">
                  Welcome to your Yo-ID
                </span>

                {/* TOOLTIP */}
                <button type="button" onClick={() => setZltoModalVisible(true)}>
                  <IoIosInformationCircleOutline className="h-6 w-6" />
                </button>
              </div>

              {/* NAVIGATION */}
              <div className="flex h-[70px] flex-row flex-wrap gap-2">
                {tabItems.map((tab) => (
                  <Link
                    key={tab.title}
                    href={tab.url!}
                    rel="noopener noreferrer"
                    className={`btn btn-xs flex items-center border-gray text-xs text-gray lg:btn-sm hover:border-gray-dark ${
                      tab.selected
                        ? "btn-secondary border-0 hover:text-white"
                        : ""
                    }`}
                  >
                    {tab.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="mt-[2rem] flex flex-grow flex-col items-center justify-center md:mt-[1rem]">
            {/* CHILDREN */}
            {children}
          </div>
        </div>
      </>
    </MainLayout>
  );
};

export default YoIDLayout;
