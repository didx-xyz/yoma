import { useAtomValue, useSetAtom } from "jotai";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import {
  IoMdAdd,
  IoMdCard,
  IoMdCheckmark,
  IoMdClose,
  IoMdImage,
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
import { shimmer, toBase64 } from "~/lib/image";
import {
  RoleView,
  activeNavigationRoleViewAtom,
  currentOrganisationLogoAtom,
  userProfileAtom,
} from "~/lib/store";

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
        className="flex flex-row hover:bg-gray-light"
      >
        <Link
          key={organisation.id}
          href={
            organisation.status == "Active"
              ? `/organisations/${organisation.id}`
              : `/organisations/${organisation.id}/edit`
          }
          className="flex-grow text-gray-dark"
          onClick={() => setUserMenuVisible(false)}
          id={`userMenu_orgs_${organisation.name}`} // e2e
        >
          {!organisation.logoURL && (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow">
              <IoMdImage className="h-6 w-6 text-gray-dark" />
            </div>
          )}
          {organisation.logoURL && (
            <div className="relative h-11 w-11 cursor-pointer overflow-hidden rounded-full shadow">
              <Image
                src={organisation.logoURL}
                alt={`${organisation.name} logo`}
                width={44}
                height={44}
                sizes="(max-width: 44px) 30vw, 50vw"
                priority={true}
                placeholder="blur"
                blurDataURL={`data:image/svg+xml;base64,${toBase64(
                  shimmer(44, 44),
                )}`}
                style={{
                  width: "100%",
                  height: "100%",
                  maxWidth: "44px",
                  maxHeight: "44px",
                }}
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <div className="flex w-[325px] items-center overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[170px]">
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
                  <div className="text-xs text-warning">
                    {organisation.status}
                  </div>
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

        <Link
          key={organisation.id}
          href={`/organisations/${organisation.id}/edit`}
          className="flex items-center p-2 text-gray-dark"
          onClick={() => setUserMenuVisible(false)}
        >
          <IoMdSettings className="h-6 w-6" />
        </Link>
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
            {/* NO IMAGE */}
            {!userProfile?.photoURL && (
              <div className="relative h-11 w-11 cursor-pointer overflow-hidden rounded-full border-2 shadow">
                <IoMdPerson className="absolute -left-1 h-12 w-12 text-white animate-in slide-in-from-top-4" />
              </div>
            )}

            {/* EXISTING IMAGE */}
            {userProfile?.photoURL && (
              <div className="relative h-11 w-11 cursor-pointer overflow-hidden rounded-full shadow hover:border-2">
                <Image
                  src={userProfile.photoURL}
                  alt="User Logo"
                  width={44}
                  height={44}
                  sizes="(max-width: 44px) 30vw, 50vw"
                  priority={true}
                  placeholder="blur"
                  blurDataURL={`data:image/svg+xml;base64,${toBase64(
                    shimmer(44, 44),
                  )}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    maxWidth: "44px",
                    maxHeight: "44px",
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* ORG ADMIN, SHOW COMPANY LOGO */}
        {activeRoleView == RoleView.OrgAdmin && (
          <>
            {/* NO IMAGE */}
            {!currentOrganisationLogo && (
              <div className="relative h-11 w-11 cursor-pointer overflow-hidden rounded-full border-2">
                <IoMdPerson className="absolute -left-1 h-12 w-12 text-white animate-in slide-in-from-top-4" />
              </div>
            )}

            {/* EXISTING IMAGE */}
            {currentOrganisationLogo && (
              <div className="relative h-11 w-11 cursor-pointer overflow-hidden rounded-full hover:border-2">
                <Image
                  src={currentOrganisationLogo}
                  alt="Company Logo"
                  width={44}
                  height={44}
                  sizes="(max-width: 44px) 30vw, 50vw"
                  priority={true}
                  placeholder="blur"
                  blurDataURL={`data:image/svg+xml;base64,${toBase64(
                    shimmer(44, 44),
                  )}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    maxWidth: "44px",
                    maxHeight: "44px",
                  }}
                />
              </div>
            )}
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
              {/* NO IMAGE */}
              {!userProfile?.photoURL && (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow">
                  <IoMdPerson className="h-6 w-6 text-gray-dark" />
                </div>
              )}

              {/* EXISTING IMAGE */}
              {userProfile?.photoURL && (
                <div className="relative h-11 w-11 cursor-pointer overflow-hidden rounded-full shadow">
                  <Image
                    src={userProfile.photoURL}
                    alt="User Logo"
                    width={44}
                    height={44}
                    sizes="(max-width: 44px) 30vw, 50vw"
                    priority={true}
                    placeholder="blur"
                    blurDataURL={`data:image/svg+xml;base64,${toBase64(
                      shimmer(44, 44),
                    )}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      maxWidth: "44px",
                      maxHeight: "44px",
                    }}
                  />
                </div>
              )}

              <div className="flex h-10 items-center overflow-hidden text-ellipsis">
                {session?.user?.name ?? "Settings"}
              </div>
            </Link>
          </li>

          {/* ORGANISATIONS */}
          {(userProfile?.adminsOf?.length ?? 0) > 0 && (
            <>
              <div className="flex flex-row items-center justify-center py-2 pl-4">
                <div className="w-full text-base font-semibold text-gray-dark">
                  Organisations
                </div>
                <div className="justify-end">
                  <Link href="/organisations" className="text-gray-dark">
                    <div className="flex items-center justify-center whitespace-nowrap rounded-full bg-white px-4 text-sm font-semibold text-orange shadow transition-transform duration-200 hover:scale-105">
                      <IoMdSearch className="h-5 w-5 text-gray-dark" />
                      View all
                    </div>
                  </Link>
                </div>
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
