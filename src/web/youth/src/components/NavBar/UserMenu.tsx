import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { IoMdPerson } from "react-icons/io";
import ReactModal from "react-modal";

export const UserMenu: React.FC = () => {
  const [userMenuVisible, setUserMenuVisible] = useState(false);

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
          {/* {userCompanyImageUrl && (
            <>
              <Image
                src={userCompanyImageUrl}
                alt="User Logo"
                width={44}
                height={44}
                sizes="(max-width: 44px) 30vw, 50vw"
                priority={true}
                placeholder="blur"
                blurDataURL={`data:image/svg+xml;base64,${toBase64(
                  shimmer(44, 44)
                )}`}
                style={{
                  width: "100%",
                  height: "100%",
                  maxWidth: "44px",
                  maxHeight: "44px",
                }}
              />
            </>
          )} */}
        </div>
      </button>

      {/* MODAL USER MENU */}
      <ReactModal
        isOpen={userMenuVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setUserMenuVisible(false);
        }}
        className={
          "fixed left-0 right-0 top-16 flex-grow bg-purple animate-in fade-in md:left-auto md:right-0 md:top-[66px] md:w-64"
        }
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
            href="/organisation/settings"
            className="px-7 py-3 text-white hover:brightness-50"
          >
            Organisation settings
          </Link>

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
