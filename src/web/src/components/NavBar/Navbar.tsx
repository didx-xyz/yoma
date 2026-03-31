import { useAtomValue } from "jotai";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import logoPicDark from "public/images/logo-dark.webp";
import logoPicLight from "public/images/logo-light.webp";
import { useEffect, useMemo, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { IoMdClose, IoMdMenu, IoMdSettings } from "react-icons/io";
import type { TabItem } from "~/api/models/common";
import type { OrganizationInfo } from "~/api/models/user";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";
import { ROLE_ADMIN } from "~/lib/constants";
import {
  RoleView,
  activeNavigationRoleViewAtom,
  currentOrganisationIdAtom,
  firstActionableRefereeReferralUrlAtom,
  userProfileAtom,
} from "~/lib/store";
import { fetchClientEnv } from "~/lib/utils";
import { AvatarImage } from "../AvatarImage";
import ScrollableContainer from "../Carousel/ScrollableContainer";
import { Footer } from "../Footer/Footer";
import { SignInButton } from "../SignInButton";
import { SignOutButton } from "../SignOutButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserMenu } from "./UserMenu";

const getNavBarLinksUser = (
  referralsEnabled: boolean,
  firstActionableRefereeReferralUrl: string | null,
): TabItem[] => {
  const links: TabItem[] = [
    {
      title: "Home",
      description: "Home",
      url: "/",
      badgeCount: null,
      selected: false,
    },
    {
      title: "About Us",
      description: "About Us",
      url: "/about",
      badgeCount: null,
      selected: false,
    },
    {
      title: "Opportunities",
      description: "Opportunities",
      url: "/opportunities",
      badgeCount: null,
      selected: false,
    },
    {
      title: "Marketplace",
      description: "Marketplace",
      url: "/marketplace",
      badgeCount: null,
      selected: false,
    },
  ];

  // Feature flag: keep referral pages deployed, but hide user entry points when disabled.
  if (referralsEnabled) {
    links.push({
      title: "Refer a friend",
      description: "Referrals",
      url: "/referrals",
      badgeCount: null,
      selected: false,
      iconImage: "❤️",
    });
  }

  if (referralsEnabled && firstActionableRefereeReferralUrl) {
    links.push({
      title: "New to Yoma?",
      description: "New to Yoma",
      url: firstActionableRefereeReferralUrl,
      badgeCount: null,
      selected: false,
      iconImage: "⭐",
      itemClassName: "!bg-purple !text-white hover:!bg-purple-dark",
      orderSideBar: 1,
    });
  }

  return links;
};

const navBarLinksAdmin: TabItem[] = [
  {
    title: "Home",
    description: "Home",
    url: `/`,
    badgeCount: null,
    selected: false,
  },
  {
    title: "Organisations",
    description: "Organisations",
    url: "/organisations",
    badgeCount: null,
    selected: false,
  },
  {
    title: "Opportunities",
    description: "Opportunities",
    url: "/admin/opportunities",
    badgeCount: null,
    selected: false,
  },
  {
    title: "Links",
    description: "Links",
    url: "/admin/links",
    badgeCount: null,
    selected: false,
  },
  {
    title: "Marketplace Rules",
    description: "Marketplace Store Rules",
    url: "/admin/stores",
    badgeCount: null,
    selected: false,
  },
  {
    title: "Referrals",
    description: "Referrals",
    url: "/admin/referrals",
    badgeCount: null,
    selected: false,
  },
];

export const Navbar: React.FC<{ theme: string }> = (theme) => {
  const router = useRouter();
  const activeRoleView = useAtomValue(activeNavigationRoleViewAtom);
  const currentOrganisationId = useAtomValue(currentOrganisationIdAtom);
  const firstActionableRefereeReferralUrl = useAtomValue(
    firstActionableRefereeReferralUrlAtom,
  );
  const { data: session } = useSession();
  const userProfile = useAtomValue(userProfileAtom);
  const [referralsEnabled, setReferralsEnabled] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isAdmin = session?.user?.roles.includes(ROLE_ADMIN);

  useEffect(() => {
    let isMounted = true;

    // Runtime client env lets the same image behave differently in stage vs prod.
    const loadReferralSetting = async () => {
      const clientEnv = await fetchClientEnv();
      if (!isMounted) return;
      setReferralsEnabled(clientEnv.NEXT_PUBLIC_REFERRALS_ENABLED === "true");
    };

    loadReferralSetting();

    return () => {
      isMounted = false;
    };
  }, []);

  // 👇 prevent scrolling on the page when the menu is open
  useDisableBodyScroll(isDrawerOpen);

  // open/close drawer
  const onToggle = () => {
    setDrawerOpen(!isDrawerOpen);
  };

  // hover menu
  const handleMouseEnter = () => {
    setIsHovered(true);
    setDrawerOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isDrawerOpen) {
      setIsHovered(false);
    }
  };

  const currentNavbarLinks = useMemo<TabItem[]>(() => {
    let links: TabItem[] = [];

    if (activeRoleView == RoleView.Admin) {
      // Admin referral management stays available even when the public referral experience is disabled.
      links = navBarLinksAdmin;
    } else if (activeRoleView == RoleView.OrgAdmin && currentOrganisationId) {
      links = [
        {
          title: "Home",
          description: "Home",
          url: `/`,
          badgeCount: null,
          selected: false,
        },
        {
          title: "Overview",
          description: "Overview",
          url: `/organisations/dashboard?organisations=${currentOrganisationId}`,
          badgeCount: null,
          selected: false,
        },
        {
          title: "Opportunities",
          description: "Opportunities",
          url: `/organisations/${currentOrganisationId}/opportunities`,
          badgeCount: null,
          selected: false,
        },
        {
          title: "Submissions",
          description: "Submissions",
          url: `/organisations/${currentOrganisationId}/verifications?verificationStatus=Pending`,
          badgeCount: null,
          selected: false,
        },
        {
          title: "Links",
          description: "Links",
          url: `/organisations/${currentOrganisationId}/links`,
          badgeCount: null,
          selected: false,
        },
        {
          title: "Settings",
          description: "Settings",
          url: `/organisations/${currentOrganisationId}/edit`,
          badgeCount: null,
          selected: false,
        },
      ];
    } else {
      // Get user links with conditional referee link
      links = getNavBarLinksUser(
        referralsEnabled,
        firstActionableRefereeReferralUrl,
      );
    }

    // Set selected property based on current route
    return links.map((link) => ({
      ...link,
      selected:
        router.pathname === link.url ||
        (link.url !== "/" && router.pathname.startsWith(link.url!)),
    }));
  }, [
    activeRoleView,
    currentOrganisationId,
    firstActionableRefereeReferralUrl,
    referralsEnabled,
    router.pathname,
  ]);

  const desktopNavbarLinks = useMemo<TabItem[]>(() => {
    return currentNavbarLinks
      .map((link, index) => ({ link, index }))
      .sort((a, b) => {
        const aOrder = a.link.orderDesktop;
        const bOrder = b.link.orderDesktop;

        if (aOrder == null && bOrder == null) return a.index - b.index;
        if (aOrder == null) return 1;
        if (bOrder == null) return -1;
        return aOrder - bOrder;
      })
      .map((item) => item.link);
  }, [currentNavbarLinks]);

  const sideBarNavbarLinks = useMemo<TabItem[]>(() => {
    return currentNavbarLinks
      .map((link, index) => ({ link, index }))
      .sort((a, b) => {
        const aOrder = a.link.orderSideBar;
        const bOrder = b.link.orderSideBar;

        if (aOrder == null && bOrder == null) return a.index - b.index;
        if (aOrder == null) return 1;
        if (bOrder == null) return -1;
        return aOrder - bOrder;
      })
      .map((item) => item.link);
  }, [currentNavbarLinks]);

  const renderOrganisationMenuItem = (organisation: OrganizationInfo) => {
    if (organisation.status == "Deleted") return null;

    return (
      <li
        key={`userMenu_orgs_${organisation.id}`}
        className="btn btn-sm text-gray-dark items-start !rounded-md border-none bg-white text-sm shadow-none"
      >
        <Link
          href={
            organisation.status == "Active"
              ? `/organisations/dashboard?organisations=${organisation.id}`
              : `/organisations/${organisation.id}/edit`
          }
          onClick={() => setDrawerOpen(false)}
          id={`userMenu_orgs_${organisation.name}`} // e2e
          className="w-full"
          tabIndex={isDrawerOpen ? 0 : -1}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center">
            <AvatarImage
              icon={organisation?.logoURL ?? null}
              alt={`${organisation.name} logo`}
              size={20}
            />
          </span>
          <div className="flex flex-row items-center">
            <div className="w-[170px] truncate text-sm">
              {organisation.name}
            </div>
            <div className="flex flex-row items-center">
              {organisation.status == "Active" && (
                <>
                  <span
                    className="tooltip tooltip-left tooltip-secondary bg-success mr-2 h-2 w-2 rounded-full"
                    data-tip="Active"
                  ></span>
                </>
              )}
              {organisation.status == "Inactive" && (
                <span
                  className="tooltip tooltip-left tooltip-secondary bg-warning mr-2 h-2 w-2 rounded-full"
                  data-tip="Pending"
                ></span>
              )}
              {organisation.status == "Declined" && (
                <span
                  className="tooltip tooltip-left tooltip-secondary bg-error mr-2 h-2 w-2 rounded-full"
                  data-tip="Declined"
                ></span>
              )}
            </div>

            {/* SETTING BUTTON */}
            <div className="flex items-center">
              <button
                key={organisation.id}
                className="tooltip tooltip-left tooltip-secondary text-gray-dark hover:bg-gray-dark hover:text-gray-light rounded-full bg-white p-1 shadow duration-300"
                onClick={(e) => {
                  e.preventDefault();
                  setDrawerOpen(false);
                  router.push(`/organisations/${organisation.id}/edit`);
                }}
                data-tip="Settings"
                tabIndex={isDrawerOpen ? 0 : -1}
              >
                <IoMdSettings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Link>
      </li>
    );
  };

  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  const toggleAdminMenu = () => {
    setIsAdminMenuOpen(!isAdminMenuOpen);
  };

  return (
    <div className="fixed top-0 right-0 left-0 z-40 shadow-xs">
      <div className={`bg-theme navbar z-40 h-20 min-h-0 !p-0`}>
        <div className="flex h-full w-full items-stretch">
          {/* HOVER MENU */}
          <div
            className="absolute top-1/5 left-0 h-[100vh] w-[2px] bg-transparent"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          ></div>

          {/* LEFT MENU */}
          <div className="flex h-full flex-shrink-0 items-stretch justify-start gap-1">
            {/* LEFT DRAWER */}
            <div
              className={`drawer ${isHovered || isDrawerOpen ? "open" : ""}`}
            >
              <input
                id="nav-drawer"
                type="checkbox"
                className="drawer-toggle"
                checked={isDrawerOpen}
                onChange={onToggle}
                tabIndex={-1}
              />
              <div className="drawer-content">
                <label
                  htmlFor="nav-drawer"
                  className="bg-theme drawer flex h-full w-auto cursor-pointer items-center border-none px-4 text-white shadow-none duration-0 hover:brightness-95"
                  tabIndex={isDrawerOpen ? -1 : 0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onToggle();
                    }
                  }}
                  title="Open main menu"
                >
                  <IoMdMenu className="h-8 w-8" />
                </label>
              </div>
              <div className="drawer-side">
                {isDrawerOpen && (
                  <label
                    htmlFor="nav-drawer"
                    aria-label="close sidebar"
                    className="drawer-overlay"
                  ></label>
                )}
                <div className="min-h-screen max-w-[20rem] overflow-y-auto rounded-tl-none rounded-tr-lg rounded-br-lg rounded-bl-none bg-white p-4">
                  <div className="flex h-full touch-none flex-col gap-2 select-none [-webkit-user-drag:none] [user-drag:none]">
                    <div className="flex grow-0 flex-row items-center justify-center">
                      <div className="grow">
                        <Image
                          src={logoPicDark}
                          alt="Logo"
                          width={85}
                          className="h-auto"
                          sizes="100vw"
                          priority={true}
                          tabIndex={-1}
                        />
                      </div>
                      <label
                        htmlFor="nav-drawer"
                        className="drawer-close btn btn-sm btn-circle text-gray-dark hover:bg-gray !rounded-full border-none shadow-md"
                        aria-label="close sidebar"
                        tabIndex={isDrawerOpen ? 0 : -1}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            onToggle();
                          }
                        }}
                        title="Close"
                      >
                        <IoMdClose className="h-5 w-5" />
                      </label>
                    </div>

                    <div className="divider !bg-gray my-2 grow-0" />

                    <ul className="menu w-full p-0">
                      {sideBarNavbarLinks.map((link, index) => (
                        <li
                          key={`lnkNavbarMenuModal_${index}`}
                          className={`text-gray-dark font-family-nunito mt-1 flex flex-col gap-2 rounded-md text-sm font-semibold tracking-normal ${link.itemClassName ?? ""}`}
                        >
                          <Link
                            href={link.url!}
                            onClick={(e) => {
                              setDrawerOpen(false);
                              if (link.onClick) {
                                e.preventDefault();
                                link.onClick();
                              }
                            }}
                            id={`lnkNavbarMenuModal_${link.title}`}
                            tabIndex={isDrawerOpen ? 0 : -1}
                            className="w-full"
                          >
                            <span>{link.title}</span>
                            {link.iconImage && (
                              <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 p-4 text-sm shadow-md">
                                {link.iconImage}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>

                    <div className="divider !bg-gray my-2 grow-0" />

                    <LanguageSwitcher
                      className="hover:bg-gray font-family-nunito ml-1 bg-transparent px-3 !py-1"
                      classNameIcon="text-gray-dark !h-5 !w-5"
                      classNameSelect="text-gray-dark font-family-nunito text-sm font-semibold tracking-normal"
                      tabIndex={isDrawerOpen ? 0 : -1}
                    />

                    <div className="divider !bg-gray my-2 grow-0" />

                    {(userProfile?.adminsOf?.length ?? 0) > 0 && (
                      <>
                        <div
                          className="h-full max-h-[140px] overflow-x-hidden overflow-y-scroll py-2"
                          id="organisations"
                        >
                          <ul className="menu -m-2 w-full p-0">
                            <li
                              key="userMenu_orgs_all"
                              className="btn btn-sm text-gray-dark font-family-nunito items-start !rounded-md border-none bg-white text-sm font-semibold tracking-normal shadow-none"
                            >
                              <Link
                                href="/organisations"
                                onClick={() => setDrawerOpen(false)}
                                id="userMenu_orgs_all"
                                tabIndex={isDrawerOpen ? 0 : -1}
                                className="w-full"
                              >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                                  🏢
                                </span>
                                <span>My organisations</span>
                              </Link>
                            </li>

                            {userProfile?.adminsOf?.map((organisation) =>
                              renderOrganisationMenuItem(organisation),
                            )}
                          </ul>
                        </div>
                        <div className="divider !bg-gray my-2 grow-0" />
                      </>
                    )}

                    {(activeRoleView == RoleView.Admin || isAdmin) && (
                      <>
                        <ul className="menu -m-2 w-full p-0">
                          <li
                            key="userMenu_admin"
                            className="btn btn-sm text-gray-dark font-family-nunito items-start !rounded-md border-none bg-white text-sm font-semibold tracking-normal shadow-none"
                          >
                            <button
                              onClick={toggleAdminMenu}
                              id="userMenu_admin"
                              tabIndex={isDrawerOpen ? 0 : -1}
                              className="flex w-full items-center"
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                                🛠️
                              </span>
                              <span>Administration</span>
                              <span className="ml-auto">
                                {isAdminMenuOpen ? (
                                  <FaChevronUp />
                                ) : (
                                  <FaChevronDown />
                                )}
                              </span>
                            </button>
                          </li>

                          {isAdminMenuOpen && (
                            <li
                              key="userMenu_admin_overview"
                              className="btn btn-sm text-gray-dark font-family-nunito items-start !rounded-md border-none bg-white text-sm font-semibold tracking-normal shadow-none"
                            >
                              <Link
                                href="/organisations/dashboard"
                                onClick={() => setDrawerOpen(false)}
                                id="userMenu_admin_overview"
                                tabIndex={isDrawerOpen ? 0 : -1}
                                className="w-full"
                              >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                                  📈
                                </span>
                                <span>Overview</span>
                              </Link>
                            </li>
                          )}
                        </ul>

                        <div className="divider !bg-gray my-2 grow-0" />
                      </>
                    )}

                    {!session && (
                      <SignInButton
                        className="!btn-sm"
                        tabIndex={isDrawerOpen ? 0 : -1}
                      />
                    )}

                    {session && (
                      <SignOutButton
                        className="!btn-sm"
                        tabIndex={isDrawerOpen ? 0 : -1}
                      />
                    )}

                    <div className="divider !bg-gray my-2 grow-0" />

                    <div className="grow-0">
                      <Footer
                        tabIndex={isDrawerOpen ? 0 : -1}
                        size="small"
                        showSocialMediaLinks={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LOGO */}
            <Link
              href="/"
              className="bg-theme btn flex h-full items-center gap-2 !rounded-none border-none px-2 text-white shadow-none hover:brightness-95 md:px-2"
              tabIndex={isDrawerOpen ? -1 : 0}
              title="Home"
            >
              {theme.theme === "white" ? (
                <Image
                  src={logoPicDark}
                  alt="Logo"
                  width={85}
                  className="h-auto"
                  tabIndex={-1}
                />
              ) : (
                <Image
                  src={logoPicLight}
                  alt="Logo"
                  width={85}
                  className="h-auto"
                  tabIndex={-1}
                />
              )}
            </Link>
          </div>

          {/* CENTER MENU (DESKTOP) */}
          <div className="hidden h-full min-w-0 flex-1 sm:block">
            <ScrollableContainer
              className="flex h-full items-stretch overflow-x-auto overflow-y-visible"
              showShadows={true}
              scrollToEndOnChange={true}
            >
              <ul className="mx-auto flex h-full w-max items-stretch object-contain">
                {desktopNavbarLinks.map((link, index) => (
                  <li
                    key={index}
                    className="relative flex h-full flex-shrink-0 items-stretch"
                  >
                    <Link
                      href={link.url!}
                      onClick={(e) => {
                        if (link.onClick) {
                          e.preventDefault();
                          link.onClick();
                        }
                      }}
                      tabIndex={index}
                      id={`lnkNavbarMenu_${link.title}`}
                      className={`bg-theme group font-nunito text-md flex h-full flex-shrink-0 items-center justify-center self-stretch !rounded-none border-none px-4 font-semibold text-white shadow-none duration-0 hover:brightness-95 ${link.itemClassName ?? ""}`}
                      draggable={false}
                    >
                      <span
                      //className={link.selected ? "font-bold" : ""}
                      >
                        {link.title}
                      </span>
                      {link.iconImage && (
                        <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 p-4 text-sm shadow-md">
                          {link.iconImage}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </ScrollableContainer>
          </div>

          {/* RIGHT MENU */}
          <div className="ml-auto flex h-full flex-shrink-0 items-stretch justify-end md:mr-2 md:gap-4">
            <LanguageSwitcher
              className="bg-theme font-nunito rounded-none px-3 text-current hover:brightness-95"
              classNameIcon="!h-5 !w-5 !text-current"
              classNameSelect="text-md mobile-select !text-current"
              tabIndex={isDrawerOpen ? -1 : 0}
            />
            {!session && (
              <div className="bg-theme flex h-full items-center px-2 hover:bg-black/10 md:px-3">
                <SignInButton tabIndex={isDrawerOpen ? -1 : 0} />
              </div>
            )}
            {session && (
              <div className="bg-theme flex h-full items-center px-2 hover:bg-black/10 md:px-3">
                <UserMenu />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
