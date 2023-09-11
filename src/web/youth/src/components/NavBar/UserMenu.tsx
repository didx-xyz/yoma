import { useAtomValue } from "jotai";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { IoMdPerson } from "react-icons/io";
import ReactModal from "react-modal";
import { shimmer, toBase64 } from "~/lib/image";
import { navbarColorAtom } from "~/lib/store";

export const UserMenu: React.FC = () => {
  const navbarColor = useAtomValue(navbarColorAtom);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
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
          <IoMdPerson className="text-gray-400 absolute -left-1 h-12 w-12 animate-in slide-in-from-top-4" />
          {/* )} */}

          {/* EXISTING IMAGE */}
          {session?.user?.photoURL && (
            <>
              <Image
                src={session?.user?.photoURL}
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
        className={`${navbarColor} fixed left-0 right-0 top-16 flex-grow animate-in fade-in md:left-auto md:right-0 md:top-[66px] md:w-64`}
        portalClassName={"fixed z-50"}
        overlayClassName="fixed inset-0"
      >
        <div className="flex flex-col">
          <Link
            href="/user/settings"
            className="px-7 py-3 text-white hover:brightness-50"
          >
            User settings
          </Link>

          <Link
            href="/partner"
            className="px-7 py-3 text-white hover:brightness-50"
          >
            Register Organisation
          </Link>

          <div className="divider m-0" />

          {/* render all the organisations for the user via session.user.adminsOf */}
          {session?.user?.adminsOf?.map((organisation) => (
            <Link
              key={organisation.id}
              href={`/organisations/${organisation.id}`}
              className="px-7 py-3 text-white hover:brightness-50"
            >
              {organisation.name}
            </Link>
          ))}

          <div className="divider m-0" />

          <button
            className="px-7 py-3 text-left text-white hover:brightness-50"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </ReactModal>
    </>
  );
};
