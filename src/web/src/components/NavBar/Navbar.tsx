import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { IoMdMenu } from "react-icons/io";
import ReactModal from "react-modal";
import { LogoImage } from "./LogoImage";
import { SignInButton } from "./SignInButton";
import { UserMenu } from "./UserMenu";
import { useAtomValue } from "jotai";
import {
  RoleView,
  activeRoleViewAtom,
  currentOrganisationIdAtom,
  navbarColorAtom,
} from "~/lib/store";

export const Navbar: React.FC = () => {
  const navbarColor = useAtomValue(navbarColorAtom);
  const [menuVisible, setMenuVisible] = useState(false);
  const activeRoleView = useAtomValue(activeRoleViewAtom);
  const currentOrganisationId = useAtomValue(currentOrganisationIdAtom);
  const { data: session } = useSession();

  return (
    <div id="topNav" className="fixed left-0 right-0 top-0 z-40">
      <div className={`${navbarColor} navbar z-40`}>
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
            className={`${navbarColor} fixed left-0 right-0 top-16 flex-grow items-center animate-in fade-in`}
            portalClassName={"fixed z-50"}
            overlayClassName="fixed inset-0"
          >
            {/* USER: NO CURRENT ORGANISATION, SHOW USER LINKS */}
            {(activeRoleView == RoleView.User || !currentOrganisationId) &&
              activeRoleView != RoleView.Admin && (
                <div className="flex flex-col">
                  <Link
                    href="/"
                    className="px-7 py-3 text-white hover:brightness-50"
                    onClick={() => setMenuVisible(false)}
                  >
                    Home
                  </Link>
                  <Link
                    href="/about"
                    className="px-7 py-3 text-white hover:brightness-50"
                    onClick={() => setMenuVisible(false)}
                  >
                    About
                  </Link>
                  <Link
                    href="/opportunities"
                    className="px-7 py-3 text-white hover:brightness-50"
                    onClick={() => setMenuVisible(false)}
                  >
                    Opportunities
                  </Link>
                  <Link
                    href="/jobs"
                    className="px-7 py-3 text-white hover:brightness-50"
                    onClick={() => setMenuVisible(false)}
                  >
                    Jobs
                  </Link>
                  <Link
                    href="/marketplace"
                    className="px-7 py-3 text-white hover:brightness-50"
                    onClick={() => setMenuVisible(false)}
                  >
                    Marketplace
                  </Link>
                </div>
              )}

            {/* ORG ADMIN: CURRENT ORGANISATION, SHOW ORGANISATION LINKS */}
            {activeRoleView == RoleView.OrgAdmin && currentOrganisationId && (
              <div className="flex flex-col">
                <Link
                  href="/"
                  className="px-7 py-3 text-white hover:brightness-50"
                  onClick={() => setMenuVisible(false)}
                >
                  Home
                </Link>
                <Link
                  href={`/organisations/${currentOrganisationId}/opportunities`}
                  className="px-7 py-3 text-white hover:brightness-50"
                  onClick={() => setMenuVisible(false)}
                >
                  Opportunities
                </Link>

                <Link
                  href={`/organisations/${currentOrganisationId}/verifications`}
                  className="px-7 py-3 text-white hover:brightness-50"
                  onClick={() => setMenuVisible(false)}
                >
                  Verifications
                </Link>
              </div>
            )}

            {/* ADMIN: SHOW ADMIN LINKS */}
            {activeRoleView == RoleView.Admin && (
              <div className="flex flex-col">
                <Link
                  href="/admin"
                  className="px-7 py-3 text-white hover:brightness-50"
                  onClick={() => setMenuVisible(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/organisations"
                  className="px-7 py-3 text-white hover:brightness-50"
                  onClick={() => setMenuVisible(false)}
                >
                  Organisations
                </Link>
                <Link
                  href="/admin/opportunities"
                  className="px-7 py-3 text-white hover:brightness-50"
                  onClick={() => setMenuVisible(false)}
                >
                  Opportunities
                </Link>
                <Link
                  href="/admin/schemas"
                  className="px-7 py-3 text-white hover:brightness-50"
                  onClick={() => setMenuVisible(false)}
                >
                  Schemas
                </Link>
                <Link
                  href="/admin/connections"
                  className="px-7 py-3 text-white hover:brightness-50"
                  onClick={() => setMenuVisible(false)}
                >
                  Connections
                </Link>
              </div>
            )}
          </ReactModal>
          <div className="ml-8">
            <LogoImage />
          </div>

          {/* USER: NO CURRENT ORGANISATION, SHOW USER LINKS */}
          {(activeRoleView == RoleView.User || !currentOrganisationId) &&
            activeRoleView != RoleView.Admin && (
              <ul className="hidden w-full flex-row items-center justify-center gap-16 p-0 lg:flex">
                <li tabIndex={0}>
                  <Link href="/" className="text-white hover:brightness-50">
                    Home
                  </Link>
                </li>
                <li tabIndex={1}>
                  <Link
                    href="/about"
                    className="text-white hover:brightness-50"
                  >
                    About
                  </Link>
                </li>
                <li tabIndex={2}>
                  <Link
                    href="/opportunities"
                    className="text-white hover:brightness-50"
                  >
                    Opportunities
                  </Link>
                </li>
                <li tabIndex={3}>
                  <Link href="/jobs" className="text-white hover:brightness-50">
                    Jobs
                  </Link>
                </li>
                <li tabIndex={4}>
                  <Link
                    href="/marketplace"
                    className="text-white hover:brightness-50"
                  >
                    Marketplace
                  </Link>
                </li>
              </ul>
            )}
          {/* ORG ADMIN: CURRENT ORGANISATION, SHOW ORGANISATION LINKS */}
          {activeRoleView == RoleView.OrgAdmin && currentOrganisationId && (
            <ul className="hidden w-full flex-row items-center justify-center gap-16 p-0 lg:flex">
              <li tabIndex={0}>
                <Link href="/" className="text-white hover:brightness-50">
                  Home
                </Link>
              </li>
              <li tabIndex={1}>
                <Link
                  href={`/organisations/${currentOrganisationId}/opportunities`}
                  className="text-white hover:brightness-50"
                >
                  Opportunities
                </Link>
              </li>
              <li tabIndex={2}>
                <Link
                  href={`/organisations/${currentOrganisationId}/verifications`}
                  className="text-white hover:brightness-50"
                >
                  Verifications
                </Link>
              </li>
            </ul>
          )}
          {/* ADMIN: SHOW ADMIN LINKS */}
          {activeRoleView == RoleView.Admin && (
            <ul className="hidden w-full flex-row items-center justify-center gap-16 p-0 lg:flex">
              <li tabIndex={0}>
                <Link href="/admin" className="text-white hover:brightness-50">
                  Dashboard
                </Link>
              </li>
              <li tabIndex={1}>
                <Link
                  href="/organisations"
                  className="text-white hover:brightness-50"
                >
                  Organisations
                </Link>
              </li>
              <li tabIndex={2}>
                <Link
                  href="/admin/opportunities"
                  className="text-white hover:brightness-50"
                >
                  Opportunities
                </Link>
              </li>
              <li tabIndex={3}>
                <Link
                  href="/admin/schemas"
                  className="text-white hover:brightness-50"
                >
                  Schemas
                </Link>
              </li>
              <li tabIndex={4}>
                <Link
                  href="/admin/connections"
                  className="text-white hover:brightness-50"
                >
                  Connections
                </Link>
              </li>
            </ul>
          )}
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
