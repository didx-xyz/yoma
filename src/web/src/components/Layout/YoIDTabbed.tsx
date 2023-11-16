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
import iconMap from "public/images/icon-map.png";
import iconSaved from "public/images/icon-saved.png";
import iconHourglass from "public/images/icon-hourglass.png";

export interface TabItem {
  title: string;
  description: string;
  url: string;
  badgeCount?: number | null;
  selected: boolean;
  icon?: any;
}

export type TabProps = ({
  children,
}: {
  children: ReactElement;
}) => ReactElement;

const YoIDTabbedLayout: TabProps = ({ children }) => {
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
        title: "My Passport",
        description: "My verified opportunities",
        url: "/yoid/passport",
        badgeCount: null,
        selected: router.asPath === "/yoid/passport",
        icon: iconCheckmark,
      },
      {
        title: "My Skills",
        description: "Skills gained through opportunities",
        url: "/yoid/skills",
        badgeCount: null,
        selected: router.asPath === "/yoid/skills",
        icon: iconTools,
      },
      {
        title: "Travel History",
        description: "Track my journey through Yoma so far",
        url: "/yoid/history",
        badgeCount: null,
        selected: router.asPath === "/yoid/history",
        icon: iconMap,
      },
      {
        title: "Saved",
        description: "My saved learning and task opportunities",
        url: "/yoid/saved",
        badgeCount: null,
        selected: router.asPath === "/yoid/saved",
        icon: iconSaved,
      },
      {
        title: "Submitted",
        description: "My opportunities submitted for verification",
        url: "/yoid/submitted",
        badgeCount: null,
        selected: router.asPath === "/yoid/submitted",
        icon: iconHourglass,
      },
    ]);
  }, [router.asPath, setTabItems]);

  return (
    <MainLayout>
      <>
        <PageBackground />

        <div className="container z-10 max-w-6xl py-4">
          {/* USER CARD */}
          <div className="flex items-center justify-center">
            <div className="relative h-[215px] w-[410px]">
              <Image
                src={iconCards}
                alt="Logo"
                layout="fill"
                objectFit="cover"
                priority={true}
              />
              <div className="absolute left-[30px] top-[30px]  w-[335px] p-4 ">
                <div className="flex flex-col text-white">
                  <div className="flex flex-row items-center justify-center">
                    <p className="flex-grow text-center text-sm tracking-widest brightness-95">
                      MY YoID
                    </p>
                    <IoMdArrowForward className="h-4 w-4" />
                  </div>
                  <div className="flex flex-row gap-2">
                    <div className="flex">
                      {/* USER IMAGE: NONE */}
                      {!userProfile?.photoURL && (
                        <div className="relative h-11 w-11 cursor-pointer overflow-hidden rounded-full border-2 shadow">
                          <IoMdPerson className="absolute -left-1 h-12 w-12 text-white animate-in slide-in-from-top-4" />
                        </div>
                      )}

                      {/* USER IMAGE: EXISTING */}
                      {userProfile?.photoURL && (
                        <div className="relative h-16 w-16 cursor-pointer overflow-hidden rounded-full shadow">
                          <Image
                            src={userProfile.photoURL}
                            alt="User Logo"
                            width={60}
                            height={60}
                            sizes="(max-width: 60px) 30vw, 50vw"
                            priority={true}
                            placeholder="blur"
                            blurDataURL={`data:image/svg+xml;base64,${toBase64(
                              shimmer(44, 44),
                            )}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              maxWidth: "60px",
                              maxHeight: "60px",
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-grow flex-col">
                      <h5>{userProfile?.displayName}</h5>

                      <div className="divider m-0" />

                      {/* TODO */}
                      <div className="flex flex-row gap-2">
                        <p className="text-xs uppercase tracking-widest">
                          Profile Level:
                        </p>

                        <p className="text-xs uppercase tracking-widest brightness-95">
                          Adventurer
                        </p>
                      </div>
                      <div className="divider m-0" />

                      <div className="badge bg-green-light py-3 font-bold brightness-95">
                        <Image
                          src={iconZlto}
                          className="mr-2"
                          alt="ZLTO"
                          width={18}
                          height={18}
                        />
                        {userProfile?.zltoBalance ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-5">
            {/* MENU NAVIGATION: MEDIUM DISPLAY */}
            <div className="hidden md:block">
              <ul className="menu w-64 gap-2 md:rounded-2xl">
                {/* TABS */}
                {tabItems.map((tabItem, index) => (
                  <li key={`MenuNavigation_${tabItem.url}`}>
                    <Link
                      href={tabItem.url}
                      key={index}
                      className={`${
                        tabItem.selected ? "bg-gray" : "bg-gray-light"
                      }`}
                    >
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
                      <div className="flex flex-col">
                        <div className="text-sm font-bold uppercase tracking-widest">
                          {tabItem.title}
                        </div>
                        <div className="text-xs text-gray-dark">
                          {tabItem.description}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
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
                      key={`DropdownNavigation_${tabItem.url}`}
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
        </div>
      </>
    </MainLayout>
  );
};

export default YoIDTabbedLayout;
