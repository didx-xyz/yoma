import { useAtomValue } from "jotai";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { IoMdMenu } from "react-icons/io";
import type { TabItem } from "~/api/models/common";
import {
  RoleView,
  activeNavigationRoleViewAtom,
  currentOrganisationIdAtom,
} from "~/lib/store";
import { SignInButton } from "../SignInButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LogoImage } from "./LogoImage";
import { UserMenu } from "./UserMenu";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";

const navBarLinksUser: TabItem[] = [
  {
    title: "Home",
    description: "Home",
    url: "/",
    badgeCount: null,
    selected: false,
    iconImage: null,
  },
  {
    title: "Opportunities",
    description: "Opportunities",
    url: "/opportunities",
    badgeCount: null,
    selected: false,
    iconImage: null,
  },
  {
    title: "Marketplace",
    description: "Marketplace",
    url: "/marketplace",
    badgeCount: null,
    selected: false,
    iconImage: null,
  },
];

const navBarLinksAdmin: TabItem[] = [
  {
    title: "Home",
    description: "Home",
    url: `/`,
    badgeCount: null,
    selected: false,
    iconImage: null,
  },
  {
    title: "Organisations",
    description: "Organisations",
    url: "/organisations",
    badgeCount: null,
    selected: false,
    iconImage: null,
  },
  {
    title: "Opportunities",
    description: "Opportunities",
    url: "/admin/opportunities",
    badgeCount: null,
    selected: false,
    iconImage: null,
  },
  {
    title: "Links",
    description: "Links",
    url: "/admin/links",
    badgeCount: null,
    selected: false,
    iconImage: null,
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
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const toggle = () => setDrawerOpen(!isDrawerOpen);
  const activeRoleView = useAtomValue(activeNavigationRoleViewAtom);
  const currentOrganisationId = useAtomValue(currentOrganisationIdAtom);
  const { data: session } = useSession();

  // 👇 prevent scrolling on the page when the dialogs are open
  useDisableBodyScroll(isDrawerOpen);

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
          iconImage: null,
        },
        {
          title: "Overview",
          description: "Overview",
          url: `/organisations/${currentOrganisationId}`,
          badgeCount: null,
          selected: false,
          iconImage: null,
        },
        {
          title: "Opportunities",
          description: "Opportunities",
          url: `/organisations/${currentOrganisationId}/opportunities`,
          badgeCount: null,
          selected: false,
          iconImage: null,
        },
        {
          title: "Verifications",
          description: "Verifications",
          url: `/organisations/${currentOrganisationId}/verifications?verificationStatus=Pending`,
          badgeCount: null,
          selected: false,
          iconImage: null,
        },
        {
          title: "Links",
          description: "Links",
          url: `/organisations/${currentOrganisationId}/links`,
          badgeCount: null,
          selected: false,
          iconImage: null,
        },
        {
          title: "Settings",
          description: "Settings",
          url: `/organisations/${currentOrganisationId}/edit`,
          badgeCount: null,
          selected: false,
          iconImage: null,
        },
      ];
    } else {
      return navBarLinksUser;
    }
  }, [activeRoleView, currentOrganisationId]);

  return (
    <div className="fixed left-0 right-0 top-0 z-40">
      <div className={`bg-theme navbar z-40`}>
        <div className="flex w-full justify-between md:flex md:justify-between md:px-4">
          <div className="flex items-center justify-start">
            {/* SIDE MENU (MOBILE) */}
            <div className="drawer lg:hidden">
              <input
                id="nav-drawer"
                type="checkbox"
                className="drawer-toggle"
                checked={isDrawerOpen}
                onChange={toggle}
              />
              <div className="drawer-content">
                <label
                  htmlFor="nav-drawer"
                  className="btn-primaryx drawer-buttonx btnx text-white hover:cursor-pointer"
                >
                  {/* BUTTON */}
                  <IoMdMenu className="h-8 w-8" />
                </label>
              </div>
              <div className="drawer-side">
                <label
                  htmlFor="nav-drawer"
                  aria-label="close sidebar"
                  className="drawer-overlay"
                ></label>
                <div className="h-screen w-80 overflow-y-auto rounded-lg bg-white">
                  <ul className="menu p-0">
                    {currentNavbarLinks.map((link, index) => (
                      <>
                        <li>
                          <Link
                            href={link.url!}
                            key={index}
                            className="text-whitex px-7 py-3 hover:brightness-50"
                            onClick={() => setDrawerOpen(false)}
                            id={`lnkNavbarMenuModal_${link.title}`}
                          >
                            {link.title}
                          </Link>
                        </li>
                        <div className="divider m-0 mx-4 !bg-gray" />
                      </>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* LOGO */}
            <LogoImage />
          </div>

          {/* TOP MENU (DESKTOP) */}
          <ul className="absolute left-0 right-0 top-5 mx-auto hidden w-fit items-center justify-center gap-12 md:flex">
            {currentNavbarLinks.map((link, index) => (
              <li
                key={index}
                tabIndex={index}
                className="hover:repeat-infinitez hover:animate-pulse"
              >
                <Link
                  href={link.url!}
                  tabIndex={index}
                  className="group text-white transition duration-300"
                  id={`lnkNavbarMenu_${link.title}`}
                >
                  {link.title}
                  <span className="block h-0.5 max-w-0 bg-gray-light transition-all duration-500 group-hover:max-w-full"></span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-end">
            <LanguageSwitcher />

            {!session && <SignInButton></SignInButton>}
            {session && <UserMenu />}
          </div>
        </div>
      </div>
    </div>
  );
};
