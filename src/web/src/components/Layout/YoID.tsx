import { useAtom } from "jotai";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import iconCheckmark from "public/images/icon-checkmark.png";
import iconCredential from "public/images/icon-credential.png";
import iconTools from "public/images/icon-tools.png";
import { useEffect, useState, type ReactElement } from "react";
import { IoIosInformationCircleOutline } from "react-icons/io";
import type { TabItem } from "~/api/models/common";
import { userProfileAtom } from "~/lib/store";
import { getTimeOfDayAndEmoji } from "~/lib/utils";
import { AvatarImage } from "../AvatarImage";
import { PageBackground } from "../PageBackground";
import MainLayout from "./Main";
import { YoIdModal } from "../YoID/YoIdModal";

export type TabProps = ({
  children,
}: {
  children: ReactElement;
}) => ReactElement;

const YoIDLayout: TabProps = ({ children }) => {
  const router = useRouter();
  const [userProfile] = useAtom(userProfileAtom);
  const [tabItems, setTabItems] = useState<TabItem[]>([]);
  const [yoIdModalVisible, setYoIdModalVisible] = useState(false);
  const [timeOfDay, timeOfDayEmoji] = getTimeOfDayAndEmoji();

  // set the tab items based on the current route
  useEffect(() => {
    setTabItems([
      {
        title: "💳 Overview",
        description: "Overview of your Yo-ID",
        url: "/yoid",
        badgeCount: null,
        selected: router.asPath == "/yoid",
        iconImage: iconCheckmark,
      },
      {
        title: "💸 Wallet",
        description: "My digital wallet",
        url: "/yoid/wallet",
        badgeCount: null,
        selected: router.asPath.startsWith("/yoid/wallet"),
        iconImage: iconCredential,
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
        title: "🏆 Opportunities",
        description: "Completed, pending, rejected & saved opportunities",
        url: "/yoid/opportunities/completed",
        badgeCount: null,
        selected: router.asPath.startsWith("/yoid/opportunities"),
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
    ]);
  }, [router.asPath, setTabItems]);

  return (
    <MainLayout>
      <>
        <Head>
          <title>Yoma | Yo-ID</title>
        </Head>

        <PageBackground className="h-[16rem]" includeStamps={true} />

        <YoIdModal
          isOpen={yoIdModalVisible}
          onClose={() => setYoIdModalVisible(false)}
        />

        <div className="z-10 container mt-20 p-4 md:mt-24">
          {/* HEADER */}
          <div className="flex flex-row justify-center gap-4">
            <div className="hidden sm:flex sm:scale-75 md:scale-90">
              <AvatarImage
                icon={userProfile?.photoURL ?? null}
                alt="User Logo"
                size={85}
              />
            </div>
            <div className="flex flex-col gap-2 lg:w-auto">
              {/* WELCOME MSG */}
              <div className="-mb-2 max-w-xs truncate text-lg font-semibold text-white md:max-w-xl md:text-2xl">
                {timeOfDayEmoji} Good {timeOfDay} {userProfile?.firstName}! 👋
              </div>

              <div className="flex flex-row items-center gap-2 text-white">
                {/* DESCRIPTION */}
                <span className="truncate text-sm md:text-base">
                  Welcome to your Yo-ID
                </span>

                {/* TOOLTIP */}
                <button
                  type="button"
                  className="rounded-md"
                  onClick={() => setYoIdModalVisible(true)}
                  title="What is Yo-ID?"
                >
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
                    className={`btn btn-xs border-orange bg-orange lg:btn-sm hover:border-orange hover:bg-purple flex h-8 items-center text-xs tracking-wide text-white shadow-md hover:text-white ${
                      tab.selected ? "border-orange bg-purple text-white" : ""
                    }`}
                    title={`Go to ${tab.title}`}
                  >
                    {tab.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="mt-[2rem] flex grow flex-col items-center justify-center md:mt-[1rem]">
            {/* CHILDREN */}
            {children}
          </div>
        </div>
      </>
    </MainLayout>
  );
};

export default YoIDLayout;
