import { useAtomValue } from "jotai";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import logoPicDark from "public/images/logo-dark.webp";
import logoPicLight from "public/images/logo-light.webp";
import { useMemo, useState } from "react";
import { IoMdClose, IoMdMenu } from "react-icons/io";
import type { TabItem } from "~/api/models/common";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";
import {
  RoleView,
  activeNavigationRoleViewAtom,
  currentOrganisationIdAtom,
} from "~/lib/store";
import { SignInButton } from "../SignInButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserMenu } from "./UserMenu";
import { Footer } from "../Footer/Footer";
import { SignOutButton } from "../SignOutButton";

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
          iconImage: "🏠",
        },
        {
          title: "Overview",
          description: "Overview",
          url: `/organisations/${currentOrganisationId}`,
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
          title: "Verifications",
          description: "Verifications",
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

  return (
    <div className="fixed left-0 right-0 top-0 z-40">
      <div className={`bg-theme navbar z-40`}>
        <div className="flex w-full justify-between md:flex md:justify-between">
          {/* LEFT MENU */}
          <div className="flex items-center justify-start">
            {/* LEFT DRAWER (MOBILE) */}
            <div className="drawer w-auto lg:hidden">
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
                  className="bg-theme btn !rounded-md border-none px-1 text-white shadow-none duration-0 hover:brightness-95 md:px-3"
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
                <div className="min-h-screen max-w-[20rem] overflow-y-auto rounded-bl-none rounded-br-lg rounded-tl-none rounded-tr-lg bg-white p-4">
                  <div className="flex h-full flex-col gap-2">
                    {/* HEADER */}
                    <div className="flex grow-0 flex-row items-center justify-center">
                      <div className="grow">
                        {/* LOGO */}
                        <Image
                          src={logoPicDark}
                          alt="Logo"
                          priority={false}
                          width={85}
                          height={41}
                        />
                      </div>
                      {/* CLOSE BUTTON */}
                      <label
                        htmlFor="nav-drawer"
                        className="drawer-close btn btn-sm !rounded-md border-none text-gray-dark shadow-md hover:bg-gray"
                        aria-label="close sidebar"
                      >
                        <IoMdClose className="h-5 w-5" />
                      </label>
                    </div>

                    <div className="divider my-2 grow-0 !bg-gray" />

                    {/* MENU */}
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
                      classNameIcon="text-gray-dark ml-1x !h-5 !w-5"
                      classNameSelect="text-gray-dark text-sm"
                    />

                    {!session && <SignInButton className="!btn-sm" />}

                    {session && <SignOutButton className="!btn-sm" />}

                    <div className="divider my-2 grow-0 !bg-gray" />

                    {/* FOOTER */}
                    <div className="grow-0">
                      <Footer />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LOGO */}
            <Link
              href="/"
              className="bg-theme btn gap-2 !rounded-md border-none px-2 text-white shadow-none duration-0 animate-in animate-out hover:brightness-95 md:px-2"
            >
              <Image
                src={logoPicLight}
                alt="Logo"
                priority={true}
                width={85}
                height={41}
              />
            </Link>
          </div>

          {/* CENTER MENU (DESKTOP) */}
          <ul className="mx-auto hidden w-fit items-center justify-center lg:flex">
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
          </ul>

          {/* RIGHT MENU */}
          <div className="flex items-center justify-end gap-2 md:gap-4">
            <LanguageSwitcher
              className="bg-theme hover:brightness-95 md:px-3"
              classNameIcon="text-white"
              classNameSelect="text-white mobile-select"
            />

            {!session && <SignInButton />}
            {session && <UserMenu />}
          </div>
        </div>
      </div>
    </div>
  );
};
