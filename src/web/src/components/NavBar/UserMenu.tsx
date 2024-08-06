import { useAtomValue, useSetAtom } from "jotai";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useState } from "react";
import {
  IoMdPower,
  IoMdSearch,
  IoMdSettings,
  IoIosCheckmarkCircle,
  IoMdConstruct,
} from "react-icons/io";
import ReactModal from "react-modal";
import { type OrganizationInfo } from "~/api/models/user";
import {
  COOKIE_KEYCLOAK_SESSION,
  GA_ACTION_USER_LOGOUT,
  GA_CATEGORY_USER,
  ROLE_ADMIN,
} from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";
import {
  RoleView,
  activeNavigationRoleViewAtom,
  currentOrganisationLogoAtom,
  userProfileAtom,
} from "~/lib/store";
import { AvatarImage } from "../AvatarImage";
import { destroyCookie } from "nookies";

export const UserMenu: React.FC = () => {
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const userProfile = useAtomValue(userProfileAtom);
  const setUserProfile = useSetAtom(userProfileAtom);
  const activeRoleView = useAtomValue(activeNavigationRoleViewAtom);
  const currentOrganisationLogo = useAtomValue(currentOrganisationLogoAtom);
  const { data: session } = useSession();
  const isAdmin = session?.user?.roles.includes(ROLE_ADMIN);

  const handleLogout = useCallback(() => {
    setUserMenuVisible(false);

    // update atom
    setUserProfile(null);

    // 📊 GOOGLE ANALYTICS: track event
    trackGAEvent(GA_CATEGORY_USER, GA_ACTION_USER_LOGOUT, "User logged out");

    // signout from keycloak
    signOut({
      callbackUrl: `${window.location.origin}/`,
    }).then(() => {
      // delete the KEYCLOAK_SESSION cookie (prevents signing in again after signout)
      destroyCookie(null, COOKIE_KEYCLOAK_SESSION, {
        path: "/",
        maxAge: 0, // expire the cookie immediately
      });
    }); // eslint-disable-line @typescript-eslint/no-floating-promises
  }, [setUserProfile]);

  const renderOrganisationMenuItem = (organisation: OrganizationInfo) => {
    return (
      <li
        key={`userMenu_orgs_${organisation.id}`}
        className="flex flex-shrink flex-grow-0 flex-row flex-nowrap p-0 py-2"
      >
        {/* ORGANISATION LINK */}
        <Link
          key={organisation.id}
          href={
            organisation.status == "Active"
              ? `/organisations/${organisation.id}`
              : `/organisations/${organisation.id}/edit`
          }
          className="w-full text-gray-dark"
          onClick={() => setUserMenuVisible(false)}
          id={`userMenu_orgs_${organisation.name}`} // e2e
        >
          <AvatarImage
            icon={organisation?.logoURL ?? null}
            alt={`${organisation.name} logo`}
            size={44}
          />

          <div className="ml-2 flex flex-col gap-1">
            <div className="w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-black md:max-w-[230px]">
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
        <div className="flex items-center">
          <Link
            key={organisation.id}
            href={`/organisations/${organisation.id}/edit`}
            className="rounded-full bg-white p-1 text-gray-dark shadow duration-300 hover:bg-gray-dark hover:text-gray-light"
            onClick={() => setUserMenuVisible(false)}
          >
            <IoMdSettings className="h-4 w-4" />
          </Link>
        </div>
      </li>
    );
  };

  return (
    <>
      {/* USER ICON BUTTON */}
      <button
        type="button"
        aria-label="User Menu"
        className="text-center text-white"
        onClick={() => setUserMenuVisible(!userMenuVisible)}
        id="btnUserMenu"
      >
        {/* USER/ADMIN, SHOW USER IMAGE */}
        {(activeRoleView == RoleView.User ||
          activeRoleView == RoleView.Admin) && (
          <>
            <div className="rounded-full hover:outline hover:outline-2">
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
            <div className="rounded-full hover:outline hover:outline-2">
              <AvatarImage
                icon={currentOrganisationLogo ?? null}
                alt="Org Logo"
                size={44}
              />
            </div>
          </>
        )}
      </button>

      {/* MODAL USER MENU */}
      <ReactModal
        isOpen={userMenuVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setUserMenuVisible(false);
        }}
        className={`fixed left-0 right-0 top-16 -mt-1 flex-grow rounded-lg bg-white shadow-lg animate-in fade-in md:left-auto md:right-2 md:top-[60px] md:-mt-0 md:w-96`}
        portalClassName={"fixed z-50"}
        overlayClassName="fixed inset-0"
      >
        <ul className="menu items-center rounded-box p-0">
          {/* USER (YOID) */}
          <li className="z-30 w-full rounded-t-lg bg-white py-2 shadow-custom">
            <Link
              href="/yoid"
              className="!rounded-t-lg rounded-b-none text-gray-dark"
              onClick={() => setUserMenuVisible(false)}
            >
              <div className="relative mr-2 h-11 w-11 cursor-pointer overflow-hidden rounded-full shadow">
                <AvatarImage
                  icon={userProfile?.photoURL}
                  alt="User logo"
                  size={44}
                />
              </div>

              <div className="flex h-10 flex-col items-start gap-1 overflow-hidden text-ellipsis text-black">
                {session?.user?.name ?? "Settings"}
                <div className="text-xs text-gray-dark">View profile</div>
              </div>
              {userProfile?.emailConfirmed && userProfile?.yoIDOnboarded && (
                <span>
                  <IoIosCheckmarkCircle className="h-6 w-6 text-success" />
                </span>
              )}
            </Link>
          </li>

          {/* USER (SETTINGS) */}
          <div className="z-20 w-full bg-white-shade">
            <li className="w-full bg-white-shade py-2">
              <Link
                href="/yoid/settings"
                className="!rounded-t-lg rounded-b-none text-gray-dark"
                onClick={() => setUserMenuVisible(false)}
              >
                <div className="mr-2 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow">
                  <IoMdSettings className="h-6 w-6 text-gray-dark" />
                </div>
                Settings
              </Link>
            </li>{" "}
            <div className="divider m-0 mx-4 !bg-gray" />
          </div>

          {/* ORGANISATIONS */}
          {(userProfile?.adminsOf?.length ?? 0) > 0 && (
            <>
              <div
                className="max-h-[200px] w-full overflow-x-hidden overflow-y-scroll bg-white-shade p-0"
                id="organisations"
              >
                {userProfile?.adminsOf?.map((organisation) =>
                  renderOrganisationMenuItem(organisation),
                )}
              </div>

              <li className="w-full rounded-none bg-white-shade py-2 shadow-[0_-2px_15px_-3px_rgba(0,0,0,0.07),0_-10px_20px_-2px_rgba(0,0,0,0.04)]">
                <Link
                  href="/organisations"
                  className="hover:white w-full rounded-none bg-white-shade text-gray-dark"
                  onClick={() => setUserMenuVisible(false)}
                >
                  <div className="mr-2 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow">
                    <IoMdSearch className="h-6 w-6 text-gray-dark" />
                  </div>
                  View all organisations
                </Link>
              </li>
              <div className="z-20 w-full bg-white-shade">
                <div className="divider m-0 mx-4 !bg-gray" />
              </div>

              {/* <li>
                <Link
                  href="/organisations/register"
                  className="text-gray-dark hover:bg-white-shade"
                  onClick={() => setUserMenuVisible(false)}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow">
                    <IoMdAdd className="h-6 w-6 text-gray-dark" />
                  </div>
                  Create new organisation
                </Link>
              </li> */}
            </>
          )}

          {/* ADMIN */}
          {(activeRoleView == RoleView.Admin || isAdmin) && (
            <div className="z-20 w-full bg-white-shade">
              <li className="w-full bg-white-shade py-2">
                <Link
                  href="/organisations"
                  className="bg-white-shade text-gray-dark"
                  onClick={() => setUserMenuVisible(false)}
                  id={`userMenu_admin`}
                >
                  <div className="mr-2 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow">
                    <IoMdConstruct className="h-6 w-6 text-gray-dark" />
                  </div>
                  Admin
                </Link>
              </li>
              <div className="divider m-0 mx-4 !bg-gray" />
            </div>
          )}

          {/* SIGN OUT */}
          <div className="z-20 w-full !rounded-b-lg !bg-white-shade">
            <li className="w-full rounded-b-lg bg-white-shade py-2">
              <button
                className="text-left text-gray-dark"
                onClick={handleLogout}
              >
                <div className="mr-2 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow">
                  <IoMdPower className="h-6 w-6 text-gray-dark" />
                </div>
                Sign out
              </button>
            </li>
          </div>
        </ul>
      </ReactModal>
    </>
  );
};
