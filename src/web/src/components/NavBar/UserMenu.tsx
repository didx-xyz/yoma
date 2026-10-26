import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  IoCheckmarkCircle,
  IoClose,
  IoConstructOutline,
  IoInformationCircleOutline,
  IoOptionsOutline,
  IoPersonOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import { searchCredentials } from "~/api/services/credentials";
import { searchMyOpportunitiesSummary } from "~/api/services/myOpportunities";
import { UserSkillType } from "~/api/models/user";
import { getUserSkills } from "~/api/services/user";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";
import { CUSTOM_FIELDS_ENABLED, MAXINT32 } from "~/lib/constants";
import { PILL_CLASS, PILL_IDLE_CLASS, PILL_TOUCH_CLASS } from "~/lib/pill";
import {
  activeNavigationRoleViewAtom,
  currentOrganisationLogoAtom,
  RoleView,
  userProfileAtom,
} from "~/lib/store";
import { fetchClientEnv } from "~/lib/utils";
import { AvatarImage } from "../AvatarImage";
import Suspense from "../Common/Suspense";
import NoRowsMessage from "../NoRowsMessage";
import {
  DetailDisclosure,
  TONE,
} from "../Opportunity/TabbedDetails/DetailDisclosure";
import { PageBackground } from "../PageBackground";
import { SignOutButton } from "../SignOutButton";
import { UserInitialsAvatar } from "../User/UserInitialsAvatar";
import { OpportunitiesBody } from "../YoID/OpportunitiesBody";
import { PassportCard, passportRows } from "../YoID/PassportCard";
import {
  isPlainClick,
  SectionLink,
  SKILLS_LINK_CLASS,
} from "../YoID/SectionLink";
import { SkillsCard } from "../YoID/SkillsCard";
import { WalletCard } from "../YoID/WalletCard";
import { YoIdModal } from "../YoID/YoIdModal";
import { TileBodySkeleton } from "../YoID/YoIDSkeletons";
import type { YoIDSectionId } from "../YoID/yoidSections";
import {
  opportunitiesPreview,
  passportPreview,
  skillsPreview,
  walletPreview,
  YOID_TABS,
} from "../YoID/yoidTabs";

/**
 * The drawer's sections in the overview's order and tones. Open by default: the two the youth
 * checks at a glance (balance, progress); closed: the two that lead to a list (Jason,
 * 2026-10-22).
 */
const SECTIONS: { id: YoIDSectionId; toneClass: string }[] = [
  { id: "wallet", toneClass: TONE.gold },
  { id: "passport", toneClass: TONE.lilac },
  { id: "opportunities", toneClass: TONE.blue },
  { id: "skills", toneClass: TONE.green },
];

/** The banner's pills: discovery's idle pill, centred and filling its grid cell. */
const DRAWER_PILL_CLASS = `${PILL_CLASS} ${PILL_TOUCH_CLASS} ${PILL_IDLE_CLASS} justify-center`;

export const UserMenu: React.FC = () => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const onToggle = () => setDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setDrawerOpen(false);
  // a link in the drawer: close it on a plain click, and let a new-tab click through untouched
  const closeOnFollow = (e: React.MouseEvent): void => {
    if (isPlainClick(e)) closeDrawer();
  };
  const userProfile = useAtomValue(userProfileAtom);
  const activeRoleView = useAtomValue(activeNavigationRoleViewAtom);
  const currentOrganisationLogo = useAtomValue(currentOrganisationLogoAtom);
  const [yoIdModalVisible, setYoIdModalVisible] = useState(false);
  const displayName =
    userProfile?.displayName ??
    [userProfile?.firstName, userProfile?.surname].filter(Boolean).join(" ");
  const verified =
    !!userProfile?.emailConfirmed && !!userProfile?.yoIDOnboarded;
  const [open, setOpen] = useState<Record<YoIDSectionId, boolean>>({
    wallet: true,
    passport: false,
    opportunities: true,
    skills: false,
  });
  const toggle = (id: YoIDSectionId): void =>
    setOpen((current) => ({ ...current, [id]: !current[id] }));
  // links and buttons leave the tab order while the drawer is closed
  const tabIndex = isDrawerOpen ? 0 : -1;

  // 👇 prevent scrolling on the page when the menu is open
  useDisableBodyScroll(isDrawerOpen);

  // Fetch passport_enabled from client environment
  const [passport_enabled, setPassportEnabled] = useState<boolean>(false);

  // Load passport enabled setting
  useEffect(() => {
    const loadPassportSetting = async () => {
      const clientEnv = await fetchClientEnv();
      setPassportEnabled(clientEnv.NEXT_PUBLIC_PASSPORT_ENABLED === "true");
    };
    loadPassportSetting();
  }, []);

  //#region YoID Dashboard
  const {
    data: skills,
    error: skillsError,
    isLoading: skillsIsLoading,
  } = useQuery({
    queryKey: ["User", "Skills", UserSkillType.Verified],
    queryFn: () => getUserSkills(UserSkillType.Verified),
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
    // the closed row's family counts need the totals as soon as the drawer opens
    enabled: isDrawerOpen && passport_enabled,
  });

  //#endregion

  return (
    <>
      <YoIdModal
        isOpen={yoIdModalVisible}
        onClose={() => setYoIdModalVisible(false)}
      />

      <div className="drawer drawer-end h-full">
        <input
          id="userMenu-drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={isDrawerOpen}
          onChange={onToggle}
          tabIndex={-1}
        />
        <div className="drawer-content flex h-full flex-col">
          <label
            htmlFor="userMenu-drawer"
            className="flex h-full items-center rounded-md hover:cursor-pointer"
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
                {userProfile && (
                  <div className="rounded-full outline outline-white hover:brightness-90">
                    <UserInitialsAvatar
                      displayName={displayName}
                      photoURL={userProfile?.photoURL}
                      size={44}
                      alt="User Logo"
                    />
                  </div>
                )}
              </>
            )}

            {/* ORG ADMIN, SHOW COMPANY LOGO */}
            {activeRoleView == RoleView.OrgAdmin && (
              <>
                <div className="rounded-full hover:outline hover:outline-white">
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

        <div className="drawer-side z-50">
          <label htmlFor="userMenu-drawer" className="drawer-overlay"></label>
          {/* MENU ITEMS — the Yo-ID pages' language: the hero band, then the overview's
              expandable sections (Jason, 2026-10-22) */}
          <div className="bg-gray-light h-screen w-[22rem] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-tl-lg rounded-bl-lg">
            <div className="flex min-h-full flex-col select-none [-webkit-user-drag:none] [user-drag:none]">
              {/* BANNER — the hero's greeting one size down, under a small avatar, with the
                  verified mark beside it (Jason, 2026-10-22). Purple whatever the page's theme
                  (`bg-theme` follows `data-theme`, white on the home page) */}
              <PageBackground className="bg-purple! px-5 pt-5 pb-4">
                <div className="relative flex w-full flex-col gap-3">
                  {/* the 44 px targets sit in the band's padding (the hero's `-m-2.5`), over the
                      avatar row's corner */}
                  <div className="absolute -top-2.5 -right-3 flex items-center">
                    <button
                      type="button"
                      aria-label="What is Yo-ID?"
                      title="What is Yo-ID?"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10"
                      onClick={() => setYoIdModalVisible(true)}
                      tabIndex={tabIndex}
                    >
                      <IoInformationCircleOutline
                        aria-hidden
                        className="h-5 w-5"
                      />
                    </button>
                    <label
                      htmlFor="userMenu-drawer"
                      aria-label="Close"
                      title="Close"
                      className="drawer-close inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-white hover:bg-white/10"
                      tabIndex={tabIndex}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onToggle();
                        }
                      }}
                    >
                      <IoClose aria-hidden className="h-6 w-6" />
                    </label>
                  </div>

                  {/* IDENTITY — the previous design's stacked block, kept (Jason, 2026-10-22):
                      the 80px picture, the name under it, then "Verified" with its check */}
                  <div className="flex flex-col items-center gap-1">
                    {userProfile && (
                      <div className="overflow-hidden rounded-full shadow outline-2 outline-white">
                        <UserInitialsAvatar
                          displayName={displayName}
                          photoURL={userProfile.photoURL}
                          size={80}
                          alt=""
                        />
                      </div>
                    )}
                    <p className="mt-1 w-full max-w-[200px] truncate text-center text-sm font-semibold text-white md:text-base">
                      {displayName || "Settings"}
                    </p>
                    {verified && (
                      <p className="flex items-center gap-1 text-xs text-white/80">
                        Verified
                        <IoCheckmarkCircle
                          aria-hidden
                          className="text-green-dark h-5 w-5"
                        />
                      </p>
                    )}
                  </div>

                  {/* the hero's chip row, centred: Profile and Settings share a row, My
                      preferences takes the next (Jason, 2026-10-22) */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/user/profile"
                      className={`${DRAWER_PILL_CLASS}`}
                      onClick={closeOnFollow}
                      tabIndex={tabIndex}
                      title="Edit your profile"
                    >
                      <IoPersonOutline aria-hidden className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      href="/user/settings"
                      className={`${DRAWER_PILL_CLASS}`}
                      onClick={closeOnFollow}
                      tabIndex={tabIndex}
                      title="Change your settings"
                    >
                      <IoSettingsOutline aria-hidden className="h-4 w-4" />
                      Settings
                    </Link>
                    {/* Discovery preferences (YOM-1261): re-entry into the personalization
                        wizard — ?personalize=1 opens it on arrival and is then stripped from the
                        URL. Hidden with the framework: /opportunities/discover 404s when it is
                        off, so leaving this would put a dead link in the user menu. */}
                    {CUSTOM_FIELDS_ENABLED && (
                      <Link
                        href="/opportunities/discover?personalize=1"
                        className={`${DRAWER_PILL_CLASS} col-span-2`}
                        onClick={closeOnFollow}
                        tabIndex={tabIndex}
                        title="Edit my preferences"
                      >
                        <IoOptionsOutline aria-hidden className="h-4 w-4" />
                        My preferences
                      </Link>
                    )}
                  </div>
                </div>
              </PageBackground>

              {/* SECTIONS — the overview's disclosures; the body loses the desktop indent
                  (`bodyClassName`), which would leave 258 px for content in a 352 px panel */}
              <div className="flex grow flex-col gap-3 p-4">
                {SECTIONS.map(({ id, toneClass }) => {
                  const tab = YOID_TABS[id];
                  const Icon = tab.icon;
                  const common = {
                    id: `drawer-${id}`,
                    icon: <Icon aria-hidden className="h-5 w-5" />,
                    toneClass,
                    title: tab.label,
                    note: tab.blurb,
                    open: open[id],
                    onToggle: () => toggle(id),
                    bodyClassName: "px-5 pb-4",
                  };
                  return (
                    <React.Fragment key={id}>
                      {id === "wallet" && (
                        <DetailDisclosure
                          {...common}
                          preview={walletPreview(userProfile)}
                        >
                          <Suspense
                            isLoading={!userProfile}
                            loader={<TileBodySkeleton />}
                          >
                            <WalletCard
                              userProfile={userProfile!}
                              link={
                                <SectionLink
                                  id={id}
                                  onFollow={closeDrawer}
                                  tabIndex={tabIndex}
                                />
                              }
                            />
                          </Suspense>
                        </DetailDisclosure>
                      )}
                      {id === "passport" && (
                        <DetailDisclosure
                          {...common}
                          count={credentials?.reduce(
                            (sum, c) => sum + (c.totalCount ?? 0),
                            0,
                          )}
                          preview={
                            passport_enabled
                              ? passportPreview(
                                  credentials && passportRows(credentials),
                                )
                              : "Update in progress"
                          }
                        >
                          {passport_enabled ? (
                            <Suspense
                              isLoading={credentialsIsLoading}
                              error={credentialsError}
                              loader={<TileBodySkeleton />}
                            >
                              <PassportCard
                                data={credentials!}
                                onClick={closeOnFollow}
                              />
                            </Suspense>
                          ) : (
                            <NoRowsMessage
                              title={"Update in Progress"}
                              description={
                                "Credentials will begin displaying again soon. Thanks for your patience."
                              }
                              icon={
                                <IoConstructOutline
                                  aria-hidden
                                  className="text-green h-5 w-5"
                                />
                              }
                            />
                          )}
                          <SectionLink
                            id={id}
                            onFollow={closeDrawer}
                            tabIndex={tabIndex}
                          />
                        </DetailDisclosure>
                      )}
                      {id === "opportunities" && (
                        <DetailDisclosure
                          {...common}
                          preview={opportunitiesPreview(userProfile)}
                        >
                          {/* three circles: four in a row would be 56 px each at 258 px */}
                          <OpportunitiesBody
                            summary={myOpportunitiesSummary}
                            isLoading={myOpportunitiesSummaryIsLoading}
                            error={myOpportunitiesSummaryError}
                            forceSmall
                            onFollow={closeDrawer}
                            tabIndex={tabIndex}
                          />
                        </DetailDisclosure>
                      )}
                      {id === "skills" && (
                        <DetailDisclosure
                          {...common}
                          count={skills?.length}
                          preview={skillsPreview(skills)}
                        >
                          <Suspense
                            isLoading={skillsIsLoading}
                            error={skillsError}
                            loader={<TileBodySkeleton />}
                          >
                            <SkillsCard data={skills!} />
                          </Suspense>
                          {/* the chips are dense: a touch more room than the other links */}
                          <SectionLink
                            id={id}
                            onFollow={closeDrawer}
                            tabIndex={tabIndex}
                            className={SKILLS_LINK_CLASS}
                          />
                        </DetailDisclosure>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* FOOT */}
                <div className="mt-auto flex flex-col gap-3 pt-2">
                  <SignOutButton
                    className="!btn-sm w-full"
                    tabIndex={tabIndex}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
