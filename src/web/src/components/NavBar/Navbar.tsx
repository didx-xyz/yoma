import { useSession } from "next-auth/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { IoMdMenu } from "react-icons/io";
import ReactModal from "react-modal";
import { LogoImage } from "./LogoImage";
import { SignInButton } from "./SignInButton";
import { UserMenu } from "./UserMenu";
import { useAtomValue } from "jotai";
import {
  RoleView,
  activeNavigationRoleViewAtom,
  currentOrganisationIdAtom,
} from "~/lib/store";
import type { TabItem } from "~/api/models/common";

const navBarLinksUser: TabItem[] = [
  {
    title: "Home",
    description: "Home",
    url: "/",
    badgeCount: null,
    selected: false,
    icon: null,
  },
  {
    title: "Opportunities",
    description: "Opportunities",
    url: "/opportunities",
    badgeCount: null,
    selected: false,
    icon: null,
  },
  {
    title: "Jobs",
    description: "Jobs",
    url: "/jobs",
    badgeCount: null,
    selected: false,
    icon: null,
  },
  {
    title: "Marketplace",
    description: "Marketplace",
    url: "/marketplace",
    badgeCount: null,
    selected: false,
    icon: null,
  },
];

const navBarLinksAdmin: TabItem[] = [
  {
    title: "Dashboard",
    description: "Dashboard",
    url: "/admin",
    badgeCount: null,
    selected: false,
    icon: null,
  },
  {
    title: "Organisations",
    description: "Organisations",
    url: "/organisations",
    badgeCount: null,
    selected: false,
    icon: null,
  },
  {
    title: "Opportunities",
    description: "Opportunities",
    url: "/admin/opportunities",
    badgeCount: null,
    selected: false,
    icon: null,
  },
  {
    title: "Schemas",
    description: "Schemas",
    url: "/admin/schemas",
    badgeCount: null,
    selected: false,
    icon: null,
  },
  {
    title: "Connections",
    description: "Connections",
    url: "/admin/connections",
    badgeCount: null,
    selected: false,
    icon: null,
  },
];

export const Navbar: React.FC = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const activeRoleView = useAtomValue(activeNavigationRoleViewAtom);
  const currentOrganisationId = useAtomValue(currentOrganisationIdAtom);
  const { data: session } = useSession();

  const currentNavbarLinks = useMemo<TabItem[]>(() => {
    if (activeRoleView == RoleView.Admin) {
      return navBarLinksAdmin;
    } else if (activeRoleView == RoleView.OrgAdmin && currentOrganisationId) {
      return [
        {
          title: "Home",
          description: "Home",
          url: `/organisations/${currentOrganisationId}`,
          badgeCount: null,
          selected: false,
          icon: null,
        },
        {
          title: "Opportunities",
          description: "Opportunities",
          url: `/organisations/${currentOrganisationId}/opportunities`,
          badgeCount: null,
          selected: false,
          icon: null,
        },
        {
          title: "Verifications",
          description: "Verifications",
          url: `/organisations/${currentOrganisationId}/verifications`,
          badgeCount: null,
          selected: false,
          icon: null,
        },
        {
          title: "Settings",
          description: "Settings",
          url: `/organisations/${currentOrganisationId}/edit`,
          badgeCount: null,
          selected: false,
          icon: null,
        },
      ];
    } else {
      return navBarLinksUser;
    }
  }, [activeRoleView, currentOrganisationId]);

  return (
    <div className="fixed left-0 right-0 top-0 z-40">
      <div className={`bg-theme navbar z-40`}>
        <div className="navbar-start w-full">
          <button
            type="button"
            aria-label="Navigation Menu"
            className="ml-1 text-white  lg:hidden"
            onClick={() => setMenuVisible(!menuVisible)}
          >
            <IoMdMenu className="h-8 w-8" />
          </button>
          <ReactModal
            isOpen={menuVisible}
            shouldCloseOnOverlayClick={true}
            onRequestClose={() => {
              setMenuVisible(false);
            }}
            className="bg-theme fixed left-0 right-0 top-16 flex-grow items-center animate-in fade-in"
            portalClassName={"fixed z-50"}
            overlayClassName="fixed inset-0"
          >
            <div className="flex flex-col">
              {currentNavbarLinks.map((link, index) => (
                <Link
                  href={link.url}
                  key={index}
                  className="px-7 py-3 text-white hover:brightness-50"
                  onClick={() => setMenuVisible(false)}
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </ReactModal>
          <div className="ml-8">
            <LogoImage />
          </div>

          <ul className="hidden w-full flex-row items-center justify-center gap-16 p-0 lg:flex">
            {currentNavbarLinks.map((link, index) => (
              <li key={index} tabIndex={index}>
                <Link
                  href={link.url}
                  tabIndex={index}
                  className="text-white hover:brightness-50"
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="navbar-end w-[150px] justify-center">
          <div>
            {!session && <SignInButton></SignInButton>}
            {session && <UserMenu />}
          </div>
        </div>
      </div>
    </div>
  );
};
