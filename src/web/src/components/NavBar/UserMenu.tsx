import { useAtomValue, useSetAtom } from "jotai";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useState } from "react";
import {
  IoMdAdd,
  IoMdCheckmark,
  IoMdClose,
  IoMdPerson,
  IoMdPower,
  IoMdSearch,
  IoMdSettings,
} from "react-icons/io";
import ReactModal from "react-modal";
import { type OrganizationInfo } from "~/api/models/user";
import {
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
    }); // eslint-disable-line @typescript-eslint/no-floating-promises
  }, [setUserProfile]);

  const renderOrganisationMenuItem = (organisation: OrganizationInfo) => {
    return (
      <li
        key={`userMenu_orgs_${organisation.id}`}
        className="flex flex-row flex-nowrap hover:bg-gray-light"
      >
        {/* ORGANISATION LINK */}
        <Link
          key={organisation.id}
          href={
            organisation.status == "Active"
              ? `/organisations/${organisation.id}`
              : `/organisations/${organisation.id}/edit`
          }
          className="text-gray-dark"
          onClick={() => setUserMenuVisible(false)}
          id={`userMenu_orgs_${organisation.name}`} // e2e
        >
          <AvatarImage
            icon={organisation?.logoURL ?? null}
            alt={`${organisation.name} logo`}
            size={44}
          />

          <div className="flex flex-col gap-1">
            <div className="w-[325px] overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[150px]">
              {organisation.name}
            </div>
            <div className="flex flex-row items-center">
              {organisation.status == "Active" && (
                <>
                  <IoMdCheckmark className="h-4 w-4 text-info" />
                  <div className="text-xs text-info">{organisation.status}</div>
                </>
              )}
              {organisation.status == "Inactive" && (
                <>
                  <IoMdClose className="h-4 w-4 text-warning" />
                  <div className="text-xs text-warning">Pending</div>
                </>
              )}
              {organisation.status == "Declined" && (
                <>
                  <IoMdClose className="h-4 w-4 text-error" />
                  <div className="text-xs text-error">
                    {organisation.status}
                  </div>
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
            className="rounded-full p-1 text-gray-dark shadow hover:bg-gray-dark hover:text-gray-light"
            onClick={() => setUserMenuVisible(false)}
          >
            <IoMdSettings className="h-6 w-6" />
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
        className={`fixed left-0 right-0 top-16 flex-grow rounded-lg bg-white animate-in fade-in md:left-auto md:right-2 md:top-[66px] md:w-80`}
        portalClassName={"fixed z-50"}
        overlayClassName="fixed inset-0"
      >
        <ul className="menu rounded-box">
          {/* USER (YOID) */}
          <li className="md:max-w-[300px]">
            <Link
              href="/yoid/opportunities/completed"
              className="text-gray-dark hover:bg-gray-light"
              onClick={() => setUserMenuVisible(false)}
            >
              <div className="relative h-11 w-11 cursor-pointer overflow-hidden rounded-full shadow">
                <AvatarImage
                  icon={userProfile?.photoURL}
                  alt="User logo"
                  size={44}
                />
              </div>

              <div className="flex h-10 items-center overflow-hidden text-ellipsis">
                {session?.user?.name ?? "Settings"}
              </div>
            </Link>
          </li>

          {/* ORGANISATIONS */}
          {(userProfile?.adminsOf?.length ?? 0) > 0 && (
            <>
              <div className="flex items-center py-2 pl-4 text-base font-semibold text-gray-dark">
                My organisations
              </div>

              <div
                className="max-h-[200px] overflow-y-scroll"
                id="organisations"
              >
                {userProfile?.adminsOf?.map((organisation) =>
                  renderOrganisationMenuItem(organisation),
                )}
              </div>
              <div className="divider m-0" />

              <li>
                <Link
                  href="/organisations"
                  className="text-gray-dark hover:bg-gray-light"
                  onClick={() => setUserMenuVisible(false)}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow">
                    <IoMdSearch className="h-6 w-6 text-gray-dark" />
                  </div>
                  View all organisations
                </Link>
              </li>

              <li>
                <Link
                  href="/organisations/register"
                  className="text-gray-dark hover:bg-gray-light"
                  onClick={() => setUserMenuVisible(false)}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow">
                    <IoMdAdd className="h-6 w-6 text-gray-dark" />
                  </div>
                  Create new organisation
                </Link>
              </li>
            </>
          )}
          {(activeRoleView == RoleView.Admin || isAdmin) && (
            <>
              <div className="divider m-0" />
              <li className="md:max-w-[300px]">
                <Link
                  href="/organisations"
                  className="text-gray-dark hover:bg-gray-light"
                  onClick={() => setUserMenuVisible(false)}
                  id={`userMenu_admin`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow">
                    <IoMdSettings className="h-6 w-6 text-gray-dark" />
                  </div>
                  Admin
                </Link>
              </li>
            </>
          )}
          <div className="divider m-0" />
          <li className="md:max-w-[300px]">
            <button
              className="text-left text-gray-dark hover:bg-gray-light"
              onClick={handleLogout}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow">
                <IoMdPower className="h-6 w-6 text-gray-dark" />
              </div>
              Sign out
            </button>
          </li>
        </ul>
      </ReactModal>
    </>
  );
};
