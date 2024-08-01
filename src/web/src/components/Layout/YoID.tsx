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
        url: "/yoid/opportunities",
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
      {
        title: "🔧 Settings",
        description: "My settings & app data",
        url: "/yoid/settings",
        badgeCount: null,
        selected: router.asPath.startsWith("/yoid/settings"),
        iconImage: iconCog,
      },
    ]);
  }, [router.asPath, setTabItems]);

  // const [processing, setProcessing] = useState("");
  // const [available, setAvailable] = useState("");
  // const [total, setTotal] = useState("");

  // useEffect(() => {
  //   if (userProfile?.zlto) {
  //     if (userProfile.zlto.zltoOffline) {
  //       setProcessing(userProfile.zlto.pending.toLocaleString());
  //       setAvailable("Unable to retrieve value");
  //       setTotal(userProfile.zlto.total.toLocaleString());
  //     } else {
  //       setProcessing(userProfile.zlto.pending.toLocaleString());
  //       setAvailable(userProfile.zlto.available.toLocaleString());
  //       setTotal(userProfile.zlto.total.toLocaleString());
  //     }
  //   }
  // }, [userProfile]);

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
          {/* USER CARD */}
          {/* <div className="flex items-center justify-center">
            <div className="group relative mx-4 flex h-[220px] w-full flex-col items-center justify-center rounded-lg bg-orange shadow-lg before:absolute before:left-0 before:top-0 before:-z-10 before:h-[220px] before:w-full before:rotate-[3deg] before:rounded-lg before:bg-orange before:brightness-75 before:transition-transform before:duration-300 before:ease-linear before:content-[''] md:mx-0 md:h-[200px] md:w-[410px] md:before:h-[200px] md:before:w-[410px] md:hover:before:rotate-0">
              <div className="grid w-full grid-cols-3 gap-4 p-2 md:grid-cols-4 md:p-6">
                <div className="col-span-1 mx-auto my-auto scale-95 md:scale-100">
                  <AvatarImage
                    icon={userProfile?.photoURL ?? null}
                    alt="User Logo"
                    size={85}
                  />
                </div>
                <div className="col-span-2 -ml-2 flex flex-col items-start md:col-span-3 md:ml-0 md:items-stretch">
                  <div className="flex flex-grow flex-col">
                    <div className="flex flex-row items-center justify-between">
                      <p className="flex-grow text-left text-xs !tracking-[.25em] text-[#FFD69C]">
                        MY YoID
                      </p>
                      <Link href="/yoid/credentials">
                        <IoMdArrowForward className="h-8 w-8 cursor-pointer rounded-full p-1 text-white transition-all duration-500 ease-in hover:shadow group-hover:scale-105 group-hover:bg-orange-light group-hover:text-orange md:h-6 md:w-6" />
                      </Link>
                    </div>

                    <h5 className="text-xl tracking-wide text-white">
                      Welcome, {userProfile?.firstName}
                    </h5>

                    * ZLTO Balances
                    <div className="mt-2 flex flex-col gap-2 text-white">
                      <div className="flex flex-col gap-1 border-y-2 border-dotted border-[#FFD69C] py-px md:py-2">
                        <div className="flex flex-row items-center">
                          <p className="w-28 text-xs tracking-widest">
                            Available:
                          </p>

                          <div className="flex items-center text-xs font-semibold text-white">
                            <Image
                              src={iconZlto}
                              className="mr-2"
                              alt="ZLTO"
                              width={18}
                              height={18}
                            />
                            {available ?? "Loading..."}
                          </div>
                        </div>
                        <div className="flex flex-row items-center">
                          <p className="w-28 text-xs tracking-widest">
                            Processing:
                          </p>

                          <div className="flex items-center text-xs font-semibold text-white">
                            <Image
                              src={iconZlto}
                              className="mr-2"
                              alt="ZLTO"
                              width={18}
                              height={18}
                            />
                            {processing ?? "Loading..."}
                          </div>
                        </div>
                      </div>

                      <div className="relative flex flex-row items-center">
                        <p className="w-28 text-xs tracking-widest">Total:</p>
                        <div className="badge -ml-2 !rounded-full bg-white px-2 py-2 text-xs !font-semibold text-black">
                          <Image
                            src={iconZltoColor}
                            className="mr-2"
                            alt="ZLTO"
                            width={18}
                            height={18}
                          />
                          {total ?? "Loading..."}
                        </div>
                        <span
                          className="btn absolute left-10 border-none p-0 shadow-none hover:scale-110 md:left-auto md:right-0"
                          onClick={() => setZltoModalVisible(true)}
                        >
                          <IoIosInformationCircleOutline className="h-6 w-6 transform-gpu duration-500 ease-linear group-hover:scale-110 md:h-5 md:w-5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div> */}

          {/* NAVIGATION BUTTONS */}
          {/* <div className="mt-3 flex h-[80px] flex-row flex-wrap items-center justify-center gap-2">
            {tabItems.map((tab) => (
              <Link
                key={tab.title}
                href={tab.url!}
                rel="noopener noreferrer"
                className={`btn btn-sm flex items-center border-gray text-xs text-gray hover:border-gray-dark ${
                  tab.selected ? "btn-secondary border-0 hover:text-white" : ""
                }`}
              >
                {tab.title}
              </Link>
            ))}
          </div> */}

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
              <div className="-mb-2 max-w-lg truncate text-lg font-semibold text-white md:text-2xl">
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
