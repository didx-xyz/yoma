import { useSession } from "next-auth/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { IoMdMenu } from "react-icons/io";
import ReactModal from "react-modal";
import { LogoImage } from "./LogoImage";
import { UserMenu } from "./UserMenu";
import { useAtomValue } from "jotai";
import {
  RoleView,
  activeNavigationRoleViewAtom,
  currentOrganisationIdAtom,
} from "~/lib/store";
import type { TabItem } from "~/api/models/common";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SignInButton } from "../SignInButton";

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
          <div className="flex justify-start">
            <button
              type="button"
              aria-label="Navigation Menu"
              className="ml-1 text-white  lg:hidden"
              onClick={() => setMenuVisible(!menuVisible)}
              id="btnNavbarMenu"
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
                    href={link.url!}
                    key={index}
                    className="px-7 py-3 text-white hover:brightness-50"
                    onClick={() => setMenuVisible(false)}
                    id={`lnkNavbarMenuModal_${link.title}`}
                  >
                    {link.title}
                  </Link>
                ))}
              </div>
            </ReactModal>
            <LogoImage />
          </div>

          <ul className="absolute left-0 right-0 top-5 mx-auto hidden w-fit items-center justify-center gap-12 md:flex">
            {currentNavbarLinks.map((link, index) => (
              <li key={index} tabIndex={index}>
                <Link
                  href={link.url!}
                  tabIndex={index}
                  className="text-white hover:brightness-50"
                  id={`lnkNavbarMenu_${link.title}`}
                >
                  {link.title}
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
