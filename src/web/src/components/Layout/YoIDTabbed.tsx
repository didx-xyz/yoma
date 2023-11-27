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
        title: "Opportunities",
        description: "Completed, pending & saved",
        url: "/yoid/opportunities/completed",
        badgeCount: null,
        selected: router.asPath.startsWith("/yoid/opportunities"),
        icon: iconCheckmark,
      },
      {
        title: "My Skills",
        description: "Skills gained through opportunities",
        url: "/yoid/skills",
        badgeCount: null,
        selected: router.asPath.startsWith("/yoid/skills"),
        icon: iconTools,
      },
      {
        title: "Wallet",
        description: "Digital credentials",
        url: "/yoid/credentials",
        badgeCount: null,
        selected: router.asPath.startsWith("/yoid/credentials"),
        icon: iconCredential,
      },
      {
        title: "Personal Info",
        description: "My personal data",
        url: "/yoid/settings",
        badgeCount: null,
        selected: router.asPath.startsWith("/yoid/settings"),
        icon: iconSmiley,
      },
      {
        title: "Open Digital CV",
        description: "My opportunities submitted for verification",
        url: "/yoid/cv",
        badgeCount: null,
        selected: router.asPath.startsWith("/yoid/cv"),
        icon: iconShare,
      },
    ]);
  }, [router.asPath, setTabItems]);

  return (
    <MainLayout>
      <>
        <PageBackground />

        <div className="container z-10 py-4">
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
              <div className="absolute left-[30px] top-[30px]  max-w-[335px] p-4 ">
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

          <div className="flex flex-col gap-5 md:flex-row">
            {/* MENU NAVIGATION: MEDIUM DISPLAY */}
            <div className="hidden md:block">
              <ul className="menu w-64 gap-2 rounded-lg bg-gray-light">
                {/* TABS */}
                {tabItems.map((tabItem, index) => (
                  <li
                    key={`MenuNavigation_${index}`}
                    // className="md:rounded-bl-none md:rounded-br-lg md:rounded-tl-none md:rounded-tr-lg"
                  >
                    <Link
                      href={tabItem.url}
                      key={index}
                      className={`hover:bg-gray ${
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
            <div className="flex flex-grow flex-col">
              {/* DROPDOWN NAVIGATION: SMALL DISPLAY */}
              <div className="visible flex flex-none items-center justify-center pb-4 md:hidden">
                <select
                  className="select max-w-lg"
                  onChange={handleChange}
                  value={router.asPath}
                  title="Select a page"
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

              {/* CHILDREN */}
              <div className="flex items-center justify-center">{children}</div>
            </div>
          </div>
        </div>
      </>
    </MainLayout>
  );
};

export default YoIDTabbedLayout;
