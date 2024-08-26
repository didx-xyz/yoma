import { useAtomValue } from "jotai";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { IoIosCheckmarkCircle, IoMdSettings } from "react-icons/io";
import { type OrganizationInfo } from "~/api/models/user";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";
import { ROLE_ADMIN } from "~/lib/constants";
import {
  RoleView,
  activeNavigationRoleViewAtom,
  currentOrganisationLogoAtom,
  userProfileAtom,
} from "~/lib/store";
import { AvatarImage } from "../AvatarImage";
import { SignOutButton } from "../SignOutButton";

export const UserMenu: React.FC = () => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const toggle = () => setDrawerOpen(!isDrawerOpen);
  const userProfile = useAtomValue(userProfileAtom);
  const activeRoleView = useAtomValue(activeNavigationRoleViewAtom);
  const currentOrganisationLogo = useAtomValue(currentOrganisationLogoAtom);
  const { data: session } = useSession();
  const isAdmin = session?.user?.roles.includes(ROLE_ADMIN);

  // 👇 prevent scrolling on the page when the dialogs are open
  useDisableBodyScroll(isDrawerOpen);

  const renderOrganisationMenuItem = (organisation: OrganizationInfo) => {
    if (organisation.status == "Deleted") return null;

    return (
      <div className="flex flex-row items-center bg-white-shade px-4 py-2 hover:bg-gray">
        {/* ORGANISATION LINK */}
        <Link
          key={`userMenu_orgs_${organisation.id}`}
          href={
            organisation.status == "Active"
              ? `/organisations/${organisation.id}`
              : `/organisations/${organisation.id}/edit`
          }
          className="flex grow flex-row text-gray-dark hover:brightness-95"
          onClick={() => setDrawerOpen(false)}
          id={`userMenu_orgs_${organisation.name}`} // e2e
        >
          <AvatarImage
            icon={organisation?.logoURL ?? null}
            alt={`${organisation.name} logo`}
            size={44}
          />

          <div className="ml-2 flex flex-col">
            <div className="w-[190px] truncate text-sm text-black">
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
        <div className="flex items-center pl-2">
          <Link
            key={organisation.id}
            href={`/organisations/${organisation.id}/edit`}
            className="rounded-full bg-white p-1 text-gray-dark shadow duration-300 hover:bg-gray-dark hover:text-gray-light"
            onClick={() => setDrawerOpen(false)}
          >
            <IoMdSettings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="drawer-end">
      <input
        id="userMenu-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isDrawerOpen}
        onChange={toggle}
      />
      <div className="drawer-content flex flex-col">
        <label htmlFor="userMenu-drawer" className="hover:cursor-pointer">
          {/* BUTTON */}
          {/* USER/ADMIN, SHOW USER IMAGE */}
          {(activeRoleView == RoleView.User ||
            activeRoleView == RoleView.Admin) && (
            <>
              <div className="rounded-full hover:outline hover:outline-2 hover:outline-white">
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
              <div className="rounded-full hover:outline hover:outline-2 hover:outline-white">
                <AvatarImage
                  icon={currentOrganisationLogo ?? null}
                  alt="Org Logo"
                  size={44}
                />
              </div>
            </>
          )}
        </label>
      </div>
      <div className="drawer-side">
        <label htmlFor="userMenu-drawer" className="drawer-overlay"></label>

        {/* MENU ITEMS */}
        <div className="h-screen max-w-[20rem] overflow-y-auto rounded-bl-lg rounded-br-none rounded-tl-lg rounded-tr-none bg-white">
          <div className="flex h-full flex-col">
            {/* USER (YOID) */}
            <Link
              href="/user/profile"
              className="flex flex-row items-center bg-white px-4 py-2 text-gray-dark shadow-custom hover:bg-gray"
              onClick={() => setDrawerOpen(false)}
            >
              <div className="relative mr-2 h-11 w-11 cursor-pointer overflow-hidden rounded-full shadow">
                <AvatarImage
                  icon={userProfile?.photoURL}
                  alt="User logo"
                  size={44}
                />
              </div>

              <div className="flex grow flex-col">
                <div className="w-[200px] truncate text-sm text-black">
                  {session?.user?.name ?? "Settings"}
                </div>
                {userProfile?.emailConfirmed && userProfile?.yoIDOnboarded && (
                  <div className="text-xs text-gray-dark">Verified</div>
                )}
              </div>
              {userProfile?.emailConfirmed && userProfile?.yoIDOnboarded && (
                <span>
                  <IoIosCheckmarkCircle className="h-6 w-6 text-success" />
                </span>
              )}
            </Link>

            <div className="divider m-0 !bg-gray" />

            {/* YOID */}
            <Link
              href="/yoid"
              className="flex flex-row items-center bg-white-shade px-4 py-2 text-gray-dark hover:bg-gray"
              onClick={() => setDrawerOpen(false)}
            >
              <div className="mr-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow">
                💳
              </div>
              <div className="flex flex-col">
                <div className="text-sm text-black">Yo-ID</div>
                <div className="text-xs text-gray-dark">
                  Opportunities, skills and ZLTO wallet.
                </div>
              </div>
            </Link>

            <div className="divider m-0 !bg-gray" />

            {/* PROFILE */}
            <Link
              href="/user/profile"
              className="flex flex-row items-center bg-white-shade px-4 py-2 text-gray-dark hover:bg-gray"
              onClick={() => setDrawerOpen(false)}
            >
              <div className="mr-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow">
                🕶️
              </div>
              <div className="flex flex-col">
                <div className="text-sm text-black">Profile</div>
                <div className="text-xs text-gray-dark">
                  Personal info, picture and password.
                </div>
              </div>
            </Link>

            <div className="divider m-0 !bg-gray" />

            {/* USER (SETTINGS) */}
            <Link
              href="/user/settings"
              className="flex flex-row items-center bg-white-shade px-4 py-2 text-gray-dark hover:bg-gray"
              onClick={() => setDrawerOpen(false)}
            >
              <div className="mr-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow">
                ⚙️
              </div>
              <div className="flex flex-col">
                <div className="text-sm text-black">Settings</div>
                <div className="text-xs text-gray-dark">
                  Notification and privacy settings.
                </div>
              </div>
            </Link>

            <div className="divider m-0 !bg-gray" />

            {/* ADMIN */}
            {(activeRoleView == RoleView.Admin || isAdmin) && (
              <>
                <Link
                  href="/organisations"
                  className="flex flex-row items-center bg-white-shade px-4 py-2 text-gray-dark hover:bg-gray"
                  onClick={() => setDrawerOpen(false)}
                  id={`userMenu_admin`}
                >
                  <div className="mr-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg shadow">
                    🛠️
                  </div>
                  <div className="flex flex-col">
                    <div className="text-sm text-black">Administration</div>
                    <div className="text-xs text-gray-dark">
                      Manage all organisations.
                    </div>
                  </div>
                </Link>

                <div className="divider m-0 !bg-gray" />
              </>
            )}

            {/* ORGANISATIONS */}
            <div
              className="h-full min-h-[60px] overflow-y-auto bg-white-shade"
              id="organisations"
            >
              {(userProfile?.adminsOf?.length ?? 0) > 0 && (
                <>
                  <Link
                    href="/organisations"
                    className="flex flex-row items-center bg-white-shade px-4 py-2 hover:bg-gray"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <div className="mr-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow">
                      🏢
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm text-black">Organisations</div>
                      <div className="text-xs text-gray-dark">
                        Manage your organisations.
                      </div>
                    </div>
                  </Link>

                  {userProfile?.adminsOf?.map((organisation) =>
                    renderOrganisationMenuItem(organisation),
                  )}
                  <div className="divider m-0 !bg-gray" />
                </>
              )}
            </div>

            {/* SIGN OUT */}
            <div className="flex flex-row items-center bg-white-shade px-4 py-2">
              <SignOutButton className="grow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
