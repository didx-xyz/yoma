import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import stamp1 from "public/images/stamp-1.png";
import stamp2 from "public/images/stamp-2.png";
import worldMap from "public/images/world-map.png";
import { useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import {
  IoIosCheckmarkCircle,
  IoIosInformationCircleOutline,
  IoMdClose,
} from "react-icons/io";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { searchCredentials } from "~/api/services/credentials";
import { searchMyOpportunitiesSummary } from "~/api/services/myOpportunities";
import { getUserSkills } from "~/api/services/user";
import { MAXINT32 } from "~/lib/constants";
import {
  RoleView,
  activeNavigationRoleViewAtom,
  currentOrganisationLogoAtom,
  userProfileAtom,
} from "~/lib/store";
import { AvatarImage } from "../AvatarImage";
import { Header } from "../Common/Header";
import Suspense from "../Common/Suspense";
import { LineChart } from "../YoID/LineChart";
import { OpportunitiesSummary } from "../YoID/OpportunitiesSummary";
import { PassportCard } from "../YoID/PassportCard";
import { SkillsCard } from "../YoID/SkillsCard";
import { WalletCard } from "../YoID/WalletCard";
import { YoIdModal } from "../YoID/YoIdModal";
import { SignOutButton } from "../SignOutButton";
export const UserMenu: React.FC = () => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const onToggle = () => setDrawerOpen(!isDrawerOpen);
  const userProfile = useAtomValue(userProfileAtom);
  const activeRoleView = useAtomValue(activeNavigationRoleViewAtom);
  const currentOrganisationLogo = useAtomValue(currentOrganisationLogoAtom);
  const { data: session } = useSession();
  const [yoIdModalVisible, setYoIdModalVisible] = useState(false);
  const [isCollapsedPassport, setCollapsedPassport] = useState(true);
  const toggleCollapsePassport = () =>
    setCollapsedPassport(!isCollapsedPassport);

  //#region YoID Dashboard
  const [graphView, setGraphView] = useState(false);
  const {
    data: skills,
    error: skillsError,
    isLoading: skillsIsLoading,
  } = useQuery({
    queryKey: ["User", "Skills"],
    queryFn: () => getUserSkills(),
    enabled: isDrawerOpen,
  });

  const {
    data: myOpportunitiesSummary,
    error: myOpportunitiesSummaryError,
    isLoading: myOpportunitiesSummaryIsLoading,
  } = useQuery({
    queryKey: ["MyOpportunities", "Summary"],
    queryFn: () => searchMyOpportunitiesSummary(),
    enabled: isDrawerOpen,
  });

  const {
    data: credentials,
    error: credentialsError,
    isLoading: credentialsIsLoading,
  } = useQuery<{ schemaType: string; totalCount: number | null }[]>({
    queryKey: ["Credentials", "TotalCounts"],
    queryFn: (): Promise<{ schemaType: string; totalCount: number | null }[]> =>
      Promise.all([
        searchCredentials({
          pageNumber: MAXINT32,
          pageSize: 1,
          schemaType: "Opportunity",
        }),
        searchCredentials({
          pageNumber: MAXINT32,
          pageSize: 1,
          schemaType: "YoID",
        }),
      ]).then(([opportunityResult, yoidResult]) => {
        const combinedResults = [
          {
            schemaType: "Opportunity",
            totalCount: opportunityResult.totalCount,
          },
          { schemaType: "YoID", totalCount: yoidResult.totalCount },
        ];

        return combinedResults;
      }),
    enabled: isDrawerOpen && !isCollapsedPassport,
  });
  //#endregion

  return (
    <>
      <YoIdModal
        isOpen={yoIdModalVisible}
        onClose={() => setYoIdModalVisible(false)}
      />

      <div className="drawer-end">
        <input
          id="userMenu-drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={isDrawerOpen}
          onChange={onToggle}
          tabIndex={-1}
        />
        <div className="drawer-content flex flex-col">
          <label
            htmlFor="userMenu-drawer"
            className="rounded-md hover:cursor-pointer"
            tabIndex={isDrawerOpen ? -1 : 0}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onToggle();
              }
            }}
            title="Open user menu"
          >
            {/* BUTTON */}
            {/* USER/ADMIN, SHOW USER IMAGE */}
            {(activeRoleView == RoleView.User ||
              activeRoleView == RoleView.Admin) && (
              <>
                <div className="rounded-full hover:outline hover:outline-2 hover:outline-white">
                  <AvatarImage
                    icon={userProfile?.photoURL ?? null}
                    alt="User Logo"
                    size={44}
                  />
                </div>
              </>
            )}

            {/* ORG ADMIN, SHOW COMPANY LOGO */}
            {activeRoleView == RoleView.OrgAdmin && (
              <>
                <div className="rounded-full hover:outline hover:outline-2 hover:outline-white">
                  <AvatarImage
                    icon={currentOrganisationLogo ?? null}
                    alt="Org Logo"
                    size={44}
                  />
                </div>
              </>
            )}
          </label>
        </div>

        <div className="drawer-side">
          <label htmlFor="userMenu-drawer" className="drawer-overlay"></label>
          {/* MENU ITEMS */}
          <div className="h-screen max-w-[20rem] overflow-y-auto rounded-bl-lg rounded-br-none rounded-tl-lg rounded-tr-none bg-[#FFF5E7]">
            <div className="flex h-full select-none flex-col gap-2 p-4 [-webkit-user-drag:none] [user-drag:none]">
              {/* USER (YOID) */}
              <div className="flex h-full flex-col items-center gap-1 p-2 text-gray-dark">
                {/* BACKGROUND IMAGES */}

                {/* WORLD MAP */}
                <Image
                  src={worldMap}
                  alt="Worldmap"
                  width={400}
                  sizes="100vw"
                  priority={true}
                  className="user-select-none pointer-events-none absolute top-10 z-0 h-auto px-4 opacity-70"
                />
                {/* STAMP 2 */}
                <Image
                  src={stamp2}
                  alt="Stamp2"
                  width={161}
                  sizes="100vw"
                  priority={true}
                  className="user-select-none pointer-events-none absolute left-32 top-56 -z-10 h-auto -rotate-6 opacity-50"
                />
                {/* STAMP 1 */}
                <Image
                  src={stamp1}
                  alt="Stamp1"
                  width={135}
                  sizes="100vw"
                  priority={true}
                  className="user-select-none pointer-events-none absolute inset-x-2 left-32 top-[500px] -z-10 h-auto -rotate-3 opacity-50"
                />

                <div className="relative z-10 mr-2 mt-6 overflow-hidden rounded-full shadow">
                  <AvatarImage
                    icon={userProfile?.photoURL}
                    alt="User logo"
                    size={80}
                  />
                </div>
                <div className="w-[200px] truncate text-center text-sm font-semibold text-black md:text-base">
                  {session?.user?.name ?? "Settings"}
                </div>
                {userProfile?.emailConfirmed && userProfile?.yoIDOnboarded && (
                  <div className="-mt-1 flex flex-row items-center">
                    <div className="mr-1 text-xs text-gray-dark">Verified</div>
                    <IoIosCheckmarkCircle className="h-6 w-6 text-success" />
                  </div>
                )}

                {/* CLOSE BUTTON */}
                <label
                  htmlFor="userMenu-drawer"
                  className="drawer-close btn btn-sm absolute right-2 top-2 !rounded-full border-none text-black shadow-none hover:bg-orange"
                  aria-label="close sidebar"
                  tabIndex={isDrawerOpen ? 0 : -1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onToggle();
                    }
                  }}
                  title="Close"
                >
                  <IoMdClose className="h-5 w-5" tabIndex={-1} />
                </label>

                {/* BUTTONS */}
                <div className="z-10 mt-2 flex w-full flex-row items-center gap-2">
                  <Link
                    href="/user/profile"
                    className="btn btn-warning btn-sm w-1/2 text-sm text-white"
                    onClick={() => setDrawerOpen(false)}
                    tabIndex={isDrawerOpen ? 0 : -1}
                    title="Edit your profile"
                  >
                    Profile
                  </Link>

                  <Link
                    href="/user/settings"
                    className="btn btn-warning btn-sm w-1/2 text-sm text-white"
                    onClick={() => setDrawerOpen(false)}
                    tabIndex={isDrawerOpen ? 0 : -1}
                    title="Change your settings"
                  >
                    Settings
                  </Link>
                </div>
              </div>

              <div className="divider my-2 !bg-gray" />

              {/* YoID Dashboard components */}
              <div className="flex flex-row gap-2">
                <span className="font-bold tracking-wider text-black">
                  My Yo-ID
                </span>
                {/* TOOLTIP */}
                <button
                  type="button"
                  className="rounded-md"
                  onClick={() => setYoIdModalVisible(true)}
                  tabIndex={isDrawerOpen ? 0 : -1}
                  title="What is Yo-ID?"
                >
                  <IoIosInformationCircleOutline className="h-5 w-5" />
                </button>
              </div>
              <div className="flex w-full flex-wrap items-center justify-center gap-5 pb-4">
                {/* WALLET */}
                <div className="flex w-full flex-col gap-2">
                  <Header
                    title="💸 Wallet"
                    url="/yoid/wallet"
                    className="text-xs font-bold text-black md:text-sm"
                    tabIndex={isDrawerOpen ? 0 : -1}
                    onClick={() => setDrawerOpen(false)}
                  />
                  <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
                    <Suspense isLoading={!userProfile}>
                      <WalletCard userProfile={userProfile!} />
                    </Suspense>
                  </div>
                </div>

                {/* OPPORTUNITIES */}
                <div className="relative flex w-full flex-col gap-2">
                  <Header
                    title="🏆 Opportunities"
                    url="/yoid/opportunities/completed"
                    className="text-xs font-bold text-black md:text-sm"
                    tabIndex={isDrawerOpen ? 0 : -1}
                    onClick={() => setDrawerOpen(false)}
                  />
                  <button
                    onClick={() => setGraphView(!graphView)}
                    className="absolute left-[7.5rem] flex sm:left-[8.5rem] lg:left-[9rem]"
                    tabIndex={isDrawerOpen ? 0 : -1}
                  >
                    {graphView ? "📋" : "📈"}&nbsp;
                    <span className="my-auto text-xs text-gray-dark underline">
                      {graphView ? "View Summary" : "View Graph"}
                    </span>
                  </button>

                  <div className="flex h-full w-full flex-col items-center gap-4 rounded-lg bg-white p-4 shadow">
                    <Suspense
                      isLoading={myOpportunitiesSummaryIsLoading}
                      error={myOpportunitiesSummaryError}
                    >
                      {graphView ? (
                        <div className="max-w-xs">
                          <LineChart
                            data={myOpportunitiesSummary!}
                            forceSmall={true}
                          />
                        </div>
                      ) : (
                        <OpportunitiesSummary
                          data={myOpportunitiesSummary}
                          onClick={() => setDrawerOpen(false)}
                        />
                      )}
                    </Suspense>
                  </div>
                </div>

                {/* SKILLS */}
                <div className="flex w-full flex-col gap-2">
                  <Header
                    title="⚡ Skills"
                    url="/yoid/skills"
                    className="text-xs font-bold text-black md:text-sm"
                    tabIndex={isDrawerOpen ? 0 : -1}
                    onClick={() => setDrawerOpen(false)}
                  />
                  <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
                    <div className="flex flex-wrap gap-1 overflow-y-auto">
                      <Suspense isLoading={skillsIsLoading} error={skillsError}>
                        <SkillsCard data={skills!} />
                      </Suspense>
                    </div>
                  </div>
                </div>

                {/* PASSPORT */}
                <div className="flex w-full flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={toggleCollapsePassport}
                      className="flex h-[24px] w-full flex-row items-center gap-2 text-xs text-gray-dark md:text-sm"
                      tabIndex={isDrawerOpen ? 0 : -1}
                    >
                      <span className="w-full truncate text-start text-xs font-bold tracking-wider text-black md:text-sm">
                        🌐 Passport
                      </span>

                      {isCollapsedPassport ? (
                        <MdKeyboardArrowDown className="h-6 w-6" />
                      ) : (
                        <MdKeyboardArrowUp className="h-6 w-6" />
                      )}
                    </button>
                  </div>

                  {!isCollapsedPassport && (
                    <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
                      <Suspense
                        isLoading={credentialsIsLoading}
                        error={credentialsError}
                      >
                        <PassportCard data={credentials!} />
                      </Suspense>
                    </div>
                  )}

                  {/* open passport button */}
                  <Link
                    className="btn btn-sm gap-2 border-0 border-none bg-orange px-4 text-white shadow-lg hover:bg-orange hover:brightness-95 disabled:!cursor-wait disabled:brightness-95"
                    onClick={() => setDrawerOpen(false)}
                    href={`/yoid/passport`}
                    tabIndex={isDrawerOpen ? 0 : -1}
                  >
                    Open Passport
                    <FaArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="flex w-full flex-col gap-2">
                  <div className="divider my-4 !bg-gray" />
                  <SignOutButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
