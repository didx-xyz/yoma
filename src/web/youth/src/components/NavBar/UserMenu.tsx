import { useAtomValue } from "jotai";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { IoMdImage, IoMdPerson } from "react-icons/io";
import ReactModal from "react-modal";
import { shimmer, toBase64 } from "~/lib/image";
import { userProfileAtom } from "~/lib/store";

export const UserMenu: React.FC = () => {
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const userProfile = useAtomValue(userProfileAtom);
  const { data: session } = useSession();

  const handleLogout = () => {
    signOut(); // eslint-disable-line @typescript-eslint/no-floating-promises
  };

  return (
    <>
      {/* USER ICON BUTTON */}
      <button
        type="button"
        aria-label="User Menu"
        className="text-center text-white"
        onClick={() => setUserMenuVisible(!userMenuVisible)}
      >
        {/* USER/COMPANY IMAGE */}
        <div className="relative h-11 w-11 cursor-pointer overflow-hidden rounded-full border-2 hover:border-white">
          {/* NO IMAGE */}
          {/* {!userCompanyImageUrl && ( */}
          <IoMdPerson className="text-gray-dark-400 absolute -left-1 h-12 w-12 animate-in slide-in-from-top-4" />
          {/* )} */}

          {/* EXISTING IMAGE */}
          {userProfile?.photoURL && (
            <>
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
            </>
          )}
        </div>
      </button>

      {/* MODAL USER MENU */}
      <ReactModal
        isOpen={userMenuVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setUserMenuVisible(false);
        }}
        className={`fixed left-0 right-0 top-16 flex-grow rounded-lg bg-white animate-in fade-in md:left-auto md:right-2 md:top-[66px] md:w-64`}
        portalClassName={"fixed z-50"}
        overlayClassName="fixed inset-0"
      >
        <div className="flex flex-col">
          <Link
            href="/user/settings"
            className="px-7 py-3 text-gray-dark hover:brightness-50"
          >
            User settings
          </Link>

          {session?.user.roles.includes("Admin") && (
            <Link
              href="/admin"
              className="px-7 py-3 text-gray-dark hover:brightness-50"
            >
              Admin
            </Link>
          )}

          <div className="divider m-0" />

          {/* organisations */}
          {userProfile?.adminsOf && (
            <>
              <div className="flex flex-row items-center justify-center p-2">
                {/* <h5 className="flex-grow text-white">Organisations</h5> */}
                <Link
                  href="/organisations"
                  className="flex-grow px-5 text-gray-dark hover:brightness-50"
                >
                  Organisations
                </Link>
                <Link
                  href={`/organisations`}
                  className="text-xs text-green hover:brightness-50"
                >
                  View all...
                </Link>{" "}
              </div>
              {userProfile?.adminsOf?.map((organisation) => (
                <Link
                  key={organisation.id}
                  href={`/organisations/${organisation.id}`}
                  className="px-7 py-3 text-gray-dark hover:brightness-50"
                >
                  <div className="rounded-lgx bg-emerald-400x p-2x flex flex-row items-center gap-4 text-sm">
                    {!organisation.logoURL && (
                      <IoMdImage className="text-gray-dark-400 h-6 w-6 animate-in slide-in-from-top-4" />
                    )}

                    {organisation.logoURL && (
                      <Image
                        src={organisation.logoURL}
                        alt={`${organisation.name} logo`}
                        width={24}
                        height={24}
                      />
                    )}
                    {organisation.name}
                  </div>
                </Link>
              ))}
            </>
          )}

          <div className="divider m-0" />

          <button
            className="px-7 py-3 text-left text-gray-dark hover:brightness-50"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </ReactModal>
    </>
  );
};
