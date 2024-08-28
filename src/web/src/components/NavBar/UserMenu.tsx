import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { IoIosCheckmarkCircle, IoMdSettings } from "react-icons/io";
import { type OrganizationInfo } from "~/api/models/user";
import { searchCredentials } from "~/api/services/credentials";
import { searchMyOpportunitiesSummary } from "~/api/services/myOpportunities";
import { getUserSkills } from "~/api/services/user";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";
import { MAXINT32, ROLE_ADMIN } from "~/lib/constants";
import {
  RoleView,
  activeNavigationRoleViewAtom,
  currentOrganisationLogoAtom,
  userProfileAtom,
} from "~/lib/store";
import { AvatarImage } from "../AvatarImage";
import { Header } from "../Common/Header";
import Suspense from "../Common/Suspense";
import NoRowsMessage from "../NoRowsMessage";
import { LineChart } from "../YoID/LineChart";
import { OpportunitiesSummary } from "../YoID/OpportunitiesSummary";
import { PassportCard } from "../YoID/PassportCard";
import { SkillsCard } from "../YoID/SkillsCard";
import { WalletCard } from "../YoID/WalletCard";

export const UserMenu: React.FC = () => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const toggle = () => setDrawerOpen(!isDrawerOpen);
  const userProfile = useAtomValue(userProfileAtom);
  const activeRoleView = useAtomValue(activeNavigationRoleViewAtom);
  const currentOrganisationLogo = useAtomValue(currentOrganisationLogoAtom);
  const { data: session } = useSession();
  const isAdmin = session?.user?.roles.includes(ROLE_ADMIN);

  // 👇 prevent scrolling on the page when the dialogs are open
  useDisableBodyScroll(isDrawerOpen);

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
    enabled: isDrawerOpen,
  });
  //#endregion

  const renderOrganisationMenuItem = (organisation: OrganizationInfo) => {
    if (organisation.status == "Deleted") return null;

    return (
      <div className="flex flex-row items-center bg-white-shade px-4 py-2 hover:bg-gray">
        {/* ORGANISATION LINK */}
        <Link
          key={`userMenu_orgs_${organisation.id}`}
          href={
            organisation.status == "Active"
              ? `/organisations/${organisation.id}`
              : `/organisations/${organisation.id}/edit`
          }
          className="flex grow flex-row text-gray-dark hover:brightness-95"
          onClick={() => setDrawerOpen(false)}
          id={`userMenu_orgs_${organisation.name}`} // e2e
        >
          <AvatarImage
            icon={organisation?.logoURL ?? null}
            alt={`${organisation.name} logo`}
            size={44}
          />

          <div className="ml-2 flex flex-col">
            <div className="w-[190px] truncate text-sm text-black">
              {organisation.name}
            </div>
            <div className="flex flex-row items-center">
              {organisation.status == "Active" && (
                <>
                  <span className="mr-2 h-2 w-2 rounded-full bg-success"></span>
                  <div className="text-xs">{organisation.status}</div>
                </>
              )}
              {organisation.status == "Inactive" && (
                <>
                  <span className="mr-2 h-2 w-2 rounded-full bg-warning"></span>
                  <div className="text-xs">Pending</div>
                </>
              )}
              {organisation.status == "Declined" && (
                <>
                  <span className="mr-2 h-2 w-2 rounded-full bg-error"></span>
                  <div className="text-xs">{organisation.status}</div>
                </>
              )}
            </div>
          </div>
        </Link>

        {/* SETTING BUTTON */}
        <div className="flex items-center pl-2">
          <Link
            key={organisation.id}
            href={`/organisations/${organisation.id}/edit`}
            className="rounded-full bg-white p-1 text-gray-dark shadow duration-300 hover:bg-gray-dark hover:text-gray-light"
            onClick={() => setDrawerOpen(false)}
          >
            <IoMdSettings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="drawer-end">
      <input
        id="userMenu-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isDrawerOpen}
        onChange={toggle}
      />
      <div className="drawer-content flex flex-col">
        <label htmlFor="userMenu-drawer" className="hover:cursor-pointer">
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
        <div className="h-screen max-w-[20rem] overflow-y-auto rounded-bl-lg rounded-br-none rounded-tl-lg rounded-tr-none bg-white">
          <div className="flex h-full flex-col gap-2 p-4">
            {/* USER (YOID) */}
            <div className="flex flex-col items-center gap-1 p-2 text-gray-dark">
              <div className="relative mr-2 cursor-pointer overflow-hidden rounded-full shadow">
                <AvatarImage
                  icon={userProfile?.photoURL}
                  alt="User logo"
                  size={97}
                />
              </div>
              <div className="w-[200px] truncate text-center text-sm font-semibold text-black md:text-base">
                {session?.user?.name ?? "Settings"}
              </div>
              {userProfile?.emailConfirmed && userProfile?.yoIDOnboarded && (
                <div className="-mt-2 flex flex-row items-center">
                  <div className="mr-1 text-xs text-gray-dark">Verified</div>
                  <IoIosCheckmarkCircle className="h-6 w-6 text-success" />
                </div>
              )}
              {/* BUTTONS */}
              <div className="flex w-full flex-row items-center gap-2">
                <Link
                  href="/user/profile"
                  className="btn btn-warning btn-sm w-1/2 !rounded-md normal-case"
                >
                  Profile
                </Link>

                <Link
                  href="/user/settings"
                  className="btn btn-warning btn-sm w-1/2 !rounded-md normal-case"
                >
                  Settings
                </Link>
              </div>
            </div>

            <div className="divider my-2 !bg-gray" />

            {/* YoID Dashboard components */}

            <Header title="My Yo-ID" />

            <div className="flex w-full flex-wrap items-center justify-center gap-6">
              {/* WALLET */}
              <div className="flex w-full flex-col gap-2">
                <Header
                  title="💸 Wallet"
                  url="/yoid/wallet"
                  className="text-xs text-black md:text-sm"
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
                  className="text-xs text-black md:text-sm"
                />
                <button
                  onClick={() => setGraphView(!graphView)}
                  className="absolute left-[7.5rem] flex sm:left-[8.5rem] lg:left-[9rem]"
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
                      <OpportunitiesSummary data={myOpportunitiesSummary} />
                    )}
                  </Suspense>
                </div>
              </div>

              {/* PASSPORT */}
              <div className="flex w-full flex-col gap-2">
                <Header
                  title="🌐 Passport"
                  url="/yoid/passport"
                  className="text-xs text-black md:text-sm"
                />
                <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
                  <Suspense
                    isLoading={credentialsIsLoading}
                    error={credentialsError}
                  >
                    {!credentials?.length && (
                      <NoRowsMessage
                        icon="💳"
                        title={"No credentials."}
                        description={
                          "Complete opportunities to receive your credentials."
                        }
                      />
                    )}

                    {!!credentials?.length && (
                      <PassportCard data={credentials} />
                    )}
                  </Suspense>
                </div>
              </div>

              {/* SKILLS */}
              <div className="mb-8 flex w-full flex-col gap-2">
                <Header
                  title="⚡ Skills"
                  url="/yoid/skills"
                  className="text-xs text-black md:text-sm"
                />
                <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
                  <div className="flex flex-wrap gap-1 overflow-y-auto">
                    <Suspense isLoading={skillsIsLoading} error={skillsError}>
                      {!skills?.length && (
                        <NoRowsMessage
                          title={"No skills."}
                          description={
                            "Skills that you receive by completing opportunities will be diplayed here."
                          }
                        />
                      )}
                      {!!skills?.length && <SkillsCard data={skills} />}
                    </Suspense>
                  </div>
                </div>
              </div>
            </div>

            {/* YOID */}
            {/* <Link
              href="/yoid"
              className="flex flex-row items-center bg-white-shade px-4 py-2 text-gray-dark hover:bg-gray"
              onClick={() => setDrawerOpen(false)}
            >
              <div className="mr-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow">
                💳
              </div>
              <div className="flex flex-col">
                <div className="text-sm text-black">Yo-ID</div>
                <div className="text-xs text-gray-dark">
                  Opportunities, skills and ZLTO wallet.
                </div>
              </div>
            </Link> */}

            {/* <div className="divider m-0 !bg-gray" /> */}

            {/* PROFILE */}
            {/* <Link
              href="/user/profile"
              className="flex flex-row items-center bg-white-shade px-4 py-2 text-gray-dark hover:bg-gray"
              onClick={() => setDrawerOpen(false)}
            >
              <div className="mr-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow">
                🕶️
              </div>
              <div className="flex flex-col">
                <div className="text-sm text-black">Profile</div>
                <div className="text-xs text-gray-dark">
                  Personal info, picture and password.
                </div>
              </div>
            </Link> */}

            {/* <div className="divider m-0 !bg-gray" /> */}

            {/* USER (SETTINGS) */}
            {/* <Link
              href="/user/settings"
              className="flex flex-row items-center bg-white-shade px-4 py-2 text-gray-dark hover:bg-gray"
              onClick={() => setDrawerOpen(false)}
            >
              <div className="mr-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow">
                ⚙️
              </div>
              <div className="flex flex-col">
                <div className="text-sm text-black">Settings</div>
                <div className="text-xs text-gray-dark">
                  Notification and privacy settings.
                </div>
              </div>
            </Link> */}

            {/* <div className="divider m-0 !bg-gray" /> */}

            {/* ADMIN */}
            {/* {(activeRoleView == RoleView.Admin || isAdmin) && (
              <>
                <Link
                  href="/organisations"
                  className="flex flex-row items-center bg-white-shade px-4 py-2 text-gray-dark hover:bg-gray"
                  onClick={() => setDrawerOpen(false)}
                  id={`userMenu_admin`}
                >
                  <div className="mr-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg shadow">
                    🛠️
                  </div>
                  <div className="flex flex-col">
                    <div className="text-sm text-black">Administration</div>
                    <div className="text-xs text-gray-dark">
                      Manage all organisations.
                    </div>
                  </div>
                </Link>

                <div className="divider m-0 !bg-gray" />
              </>
            )} */}

            {/* ORGANISATIONS */}
            {/* <div
              className="h-full min-h-[60px] overflow-y-auto bg-white-shade"
              id="organisations"
            >
              {(userProfile?.adminsOf?.length ?? 0) > 0 && (
                <>
                  <Link
                    href="/organisations"
                    className="flex flex-row items-center bg-white-shade px-4 py-2 hover:bg-gray"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <div className="mr-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow">
                      🏢
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm text-black">Organisations</div>
                      <div className="text-xs text-gray-dark">
                        Manage your organisations.
                      </div>
                    </div>
                  </Link>

                  {userProfile?.adminsOf?.map((organisation) =>
                    renderOrganisationMenuItem(organisation),
                  )}
                  <div className="divider m-0 !bg-gray" />
                </>
              )}
            </div> */}

            {/* SIGN OUT */}
            {/* <div className="flex flex-row items-center bg-white-shade px-4 py-2">
              <SignOutButton className="grow" />
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};
