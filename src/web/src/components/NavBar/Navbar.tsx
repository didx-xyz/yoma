import { useAtomValue } from "jotai";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import logoPicDark from "public/images/logo-dark.webp";
import logoPicLight from "public/images/logo-light.webp";
import { useMemo, useState } from "react";
import { IoMdClose, IoMdMenu, IoMdSettings } from "react-icons/io";
import type { TabItem } from "~/api/models/common";
import type { OrganizationInfo } from "~/api/models/user";
import {
  RoleView,
  activeNavigationRoleViewAtom,
  currentOrganisationIdAtom,
  userProfileAtom,
} from "~/lib/store";
import { AvatarImage } from "../AvatarImage";
import { Footer } from "../Footer/Footer";
import { SocialMediaLinks } from "../Footer/SocialMediaLinks";
import { SignInButton } from "../SignInButton";
import { SignOutButton } from "../SignOutButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserMenu } from "./UserMenu";
import { ROLE_ADMIN } from "~/lib/constants";
import { FaChevronUp, FaChevronDown } from "react-icons/fa";

const navBarLinksUser: TabItem[] = [
  {
    title: "Home",
    description: "Home",
    url: "/",
    badgeCount: null,
    selected: false,
    iconImage: "🏠",
  },
  {
    title: "Opportunities",
    description: "Opportunities",
    url: "/opportunities",
    badgeCount: null,
    selected: false,
    iconImage: "🏆",
  },
  {
    title: "Marketplace",
    description: "Marketplace",
    url: "/marketplace",
    badgeCount: null,
    selected: false,
    iconImage: "🛒",
  },
];

const navBarLinksAdmin: TabItem[] = [
  {
    title: "Home",
    description: "Home",
    url: `/`,
    badgeCount: null,
    selected: false,
    iconImage: "🏠",
  },
  {
    title: "Organisations",
    description: "Organisations",
    url: "/organisations",
    badgeCount: null,
    selected: false,
    iconImage: "🏢",
  },
  {
    title: "Opportunities",
    description: "Opportunities",
    url: "/admin/opportunities",
    badgeCount: null,
    selected: false,
    iconImage: "🏆",
  },
  {
    title: "Links",
    description: "Links",
    url: "/admin/links",
    badgeCount: null,
    selected: false,
    iconImage: "🔗",
  },
  {
    title: "Marketplace Store Rules",
    description: "Marketplace Store Rules",
    url: "/admin/stores",
    badgeCount: null,
    selected: false,
    iconImage: "🛒",
  },
  // {
  //   title: "Schemas",
  //   description: "Schemas",
  //   url: "/admin/schemas",
  //   badgeCount: null,
  //   selected: false,
  //   iconImage: null,
  // },
  // {
  //   title: "Connections",
  //   description: "Connections",
  //   url: "/admin/connections",
  //   badgeCount: null,
  //   selected: false,
  //   iconImage: null,
  // },
];

export const Navbar: React.FC = () => {
  const router = useRouter();
  const activeRoleView = useAtomValue(activeNavigationRoleViewAtom);
  const currentOrganisationId = useAtomValue(currentOrganisationIdAtom);
  const { data: session } = useSession();
  const userProfile = useAtomValue(userProfileAtom);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isAdmin = session?.user?.roles.includes(ROLE_ADMIN);

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
    if (activeRoleView == RoleView.Admin) {
      return navBarLinksAdmin;
    } else if (activeRoleView == RoleView.OrgAdmin && currentOrganisationId) {
      return [
        {
          title: "Home",
          description: "Home",
          url: `/`,
          badgeCount: null,
          selected: false,
          iconImage: "🏠",
        },
        {
          title: "Overview",
          description: "Overview",
          url: `/organisations/dashboard?organisations=${currentOrganisationId}`,
          badgeCount: null,
          selected: false,
          iconImage: "📊",
        },
        {
          title: "Opportunities",
          description: "Opportunities",
          url: `/organisations/${currentOrganisationId}/opportunities`,
          badgeCount: null,
          selected: false,
          iconImage: "🏆",
        },
        {
          title: "Submissions",
          description: "Submissions",
          url: `/organisations/${currentOrganisationId}/verifications?verificationStatus=Pending`,
          badgeCount: null,
          selected: false,
          iconImage: "✅",
        },
        {
          title: "Links",
          description: "Links",
          url: `/organisations/${currentOrganisationId}/links`,
          badgeCount: null,
          selected: false,
          iconImage: "🔗",
        },
        // {
        //   title: "Marketplace Store Rules",
        //   description: "Marketplace Store Rules",
        //   url: `/organisations/${currentOrganisationId}/stores`,
        //   badgeCount: null,
        //   selected: false,
        //   iconImage: "🛒",
        // },
        {
          title: "Settings",
          description: "Settings",
          url: `/organisations/${currentOrganisationId}/edit`,
          badgeCount: null,
          selected: false,
          iconImage: "⚙️",
        },
      ];
    } else {
      return navBarLinksUser;
    }
  }, [activeRoleView, currentOrganisationId]);

  const renderOrganisationMenuItem = (organisation: OrganizationInfo) => {
    if (organisation.status == "Deleted") return null;

    return (
      <li
        key={`userMenu_orgs_${organisation.id}`}
        className="btn btn-sm items-start !rounded-md border-none bg-white p-0 py-4 text-sm text-gray-dark shadow-none hover:bg-gray-light"
      >
        <Link
          href={
            organisation.status == "Active"
              ? `/organisations/dashboard?organisations=${organisation.id}`
              : `/organisations/${organisation.id}/edit`
          }
          onClick={() => setDrawerOpen(false)}
          id={`userMenu_orgs_${organisation.name}`} // e2e
          className="w-full py-0"
          tabIndex={isDrawerOpen ? 0 : -1}
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
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
                    className="tooltip tooltip-left tooltip-secondary mr-2 h-2 w-2 rounded-full bg-success"
                    data-tip="Active"
                  ></span>
                </>
              )}
              {organisation.status == "Inactive" && (
                <span
                  className="tooltip tooltip-left tooltip-secondary mr-2 h-2 w-2 rounded-full bg-warning"
                  data-tip="Pending"
                ></span>
              )}
              {organisation.status == "Declined" && (
                <span
                  className="tooltip tooltip-left tooltip-secondary mr-2 h-2 w-2 rounded-full bg-error"
                  data-tip="Declined"
                ></span>
              )}
            </div>

            {/* SETTING BUTTON */}
            <div className="flex items-center">
              <button
                key={organisation.id}
                className="tooltip tooltip-left tooltip-secondary rounded-full bg-white p-1 text-gray-dark shadow duration-300 hover:bg-gray-dark hover:text-gray-light"
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
    <div className="fixed left-0 right-0 top-0 z-40">
      <div className={`bg-theme navbar z-40`}>
        <div className="flex w-full justify-between md:flex md:justify-between">
          {/* hover menu */}
          <div
            className="absolute left-0 top-1/5 h-[100vh] w-[2px] bg-transparent"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          ></div>

          {/* LEFT MENU */}
          <div className="flex items-center justify-start gap-1">
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
                  className="bg-theme btn drawer w-auto !rounded-md border-none px-1 text-white shadow-none duration-0 hover:brightness-95 md:px-3"
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
                <div className="min-h-screen max-w-[20rem] overflow-y-auto rounded-bl-none rounded-br-lg rounded-tl-none rounded-tr-lg bg-white p-4">
                  <div className="flex h-full touch-none select-none flex-col gap-2 [-webkit-user-drag:none] [user-drag:none]">
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
                        className="drawer-close btn btn-sm !rounded-full border-none text-gray-dark shadow-md hover:bg-gray"
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

                    <div className="divider my-2 grow-0 !bg-gray" />

                    <ul className="menu grow p-0">
                      {currentNavbarLinks.map((link, index) => (
                        <li
                          key={`lnkNavbarMenuModal_${index}`}
                          className="btn btn-sm items-start !rounded-md border-none bg-white p-0 py-4 text-sm text-gray-dark shadow-none hover:bg-gray-light"
                        >
                          <Link
                            href={link.url!}
                            onClick={() => setDrawerOpen(false)}
                            id={`lnkNavbarMenuModal_${link.title}`}
                            className="w-full py-0"
                            tabIndex={isDrawerOpen ? 0 : -1}
                          >
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                              {link.iconImage}
                            </span>
                            <span>{link.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>

                    <div className="divider my-2 grow-0 !bg-gray" />

                    <LanguageSwitcher
                      className="ml-1 bg-transparent !py-1 px-3 hover:bg-gray-light"
                      classNameIcon="text-gray-dark !h-5 !w-5"
                      classNameSelect="text-gray-dark text-sm"
                      tabIndex={isDrawerOpen ? 0 : -1}
                    />

                    <div className="divider my-2 grow-0 !bg-gray" />

                    {(userProfile?.adminsOf?.length ?? 0) > 0 && (
                      <>
                        <div
                          className="h-full max-h-[120px] overflow-x-hidden overflow-y-scroll"
                          id="organisations"
                        >
                          <ul className="menu grow p-0">
                            <li
                              key="userMenu_orgs_all"
                              className="btn btn-sm items-start !rounded-md border-none bg-white p-0 py-4 text-sm text-gray-dark shadow-none hover:bg-gray-light"
                            >
                              <Link
                                href="/organisations"
                                onClick={() => setDrawerOpen(false)}
                                id="userMenu_orgs_all"
                                tabIndex={isDrawerOpen ? 0 : -1}
                                className="w-full py-0"
                              >
                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
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
                        <div className="divider my-2 grow-0 !bg-gray" />
                      </>
                    )}

                    {(activeRoleView == RoleView.Admin || isAdmin) && (
                      <>
                        <ul className="menu grow p-0">
                          <li
                            key="userMenu_admin"
                            className="btn btn-sm items-start !rounded-md border-none bg-white p-0 py-4 text-sm text-gray-dark shadow-none hover:bg-gray-light"
                          >
                            <button
                              onClick={toggleAdminMenu}
                              id="userMenu_admin"
                              tabIndex={isDrawerOpen ? 0 : -1}
                              className="flex w-full items-center py-0"
                            >
                              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
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
                        </ul>
                        {isAdminMenuOpen && (
                          <ul className="menu grow p-0">
                            <li
                              key="userMenu_admin_overview"
                              className="btn btn-sm items-start !rounded-md border-none bg-white p-0 py-4 text-sm text-gray-dark shadow-none hover:bg-gray-light"
                            >
                              <Link
                                href="/organisations/dashboard"
                                onClick={() => setDrawerOpen(false)}
                                id="userMenu_admin_overview"
                                tabIndex={isDrawerOpen ? 0 : -1}
                                className="flex w-full items-center" // Make the Link fill the li
                              >
                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                                  📈
                                </span>
                                <span>Overview</span>
                              </Link>
                            </li>
                          </ul>
                        )}

                        <div className="divider my-2 grow-0 !bg-gray" />
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

                    <div className="divider my-2 grow-0 !bg-gray" />

                    <SocialMediaLinks tabIndex={isDrawerOpen ? 0 : -1} />

                    <div className="grow-0">
                      <Footer tabIndex={isDrawerOpen ? 0 : -1} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LOGO */}
            <Link
              href="/"
              className="bg-theme btn gap-2 !rounded-md border-none px-2 text-white shadow-none hover:brightness-95 md:px-2"
              tabIndex={isDrawerOpen ? -1 : 0}
              title="Home"
            >
              <Image
                src={logoPicLight}
                alt="Logo"
                width={85}
                className="h-auto"
                tabIndex={-1}
              />
            </Link>
          </div>

          {/* CENTER MENU (DESKTOP) */}
          {/* <ul className="mx-auto hidden w-fit items-center justify-center lg:flex">
          {currentNavbarLinks.map((link, index) => (
            <li
              key={index}
              tabIndex={index}
              className="bg-theme group btn !rounded-md border-none p-2 px-4 text-base text-white shadow-none duration-0 hover:brightness-95"
            >
              <Link
                href={link.url!}
                tabIndex={index}
                id={`lnkNavbarMenu_${link.title}`}
              >
                <span className="mr-2">{link.iconImage}</span>
                <span>{link.title}</span>
                <span className="block h-0.5 max-w-0 bg-gray-light transition-all duration-500 group-hover:max-w-full"></span>
              </Link>
            </li>
          ))}
        </ul> */}

          {/* RIGHT MENU */}
          <div className="flex items-center justify-end gap-2 md:gap-4">
            <LanguageSwitcher
              className="bg-theme hover:brightness-95 md:px-3"
              classNameIcon="text-white"
              classNameSelect="text-white mobile-select"
              tabIndex={isDrawerOpen ? -1 : 0}
            />
            {!session && <SignInButton tabIndex={isDrawerOpen ? -1 : 0} />}
            {session && <UserMenu />}
          </div>
        </div>
      </div>
    </div>
  );
};
