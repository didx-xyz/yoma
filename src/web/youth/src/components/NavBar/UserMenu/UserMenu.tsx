import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { IoMdPerson } from "react-icons/io";
import ReactModal from "react-modal";
import styles from "./UserMenu.module.scss";

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
        className="btn-hover-grow btn btn-square w-[100px] gap-2 border-none bg-transparent hover:border-none hover:bg-transparent"
        onClick={() => setUserMenuVisible(!userMenuVisible)}
      >
        {/* USER/COMPANY IMAGE */}
        <div className="gl-border-dark gl-border-hover-white relative h-11 w-11 cursor-pointer overflow-hidden rounded-full border-2 hover:border-white">
          {/* NO IMAGE */}
          {/* {!userCompanyImageUrl && ( */}
          <IoMdPerson className="animate-in slide-in-from-top-4 absolute -left-1 h-12 w-12 text-gray-400" />
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

        {/* ALERT BADGE */}
        {/* {alertCount !== null && alertCount > 0 && (
          <div className="badge badge-primary relative -left-4 -top-3">
            {alertCount}
          </div>
        )} */}
      </button>

      {/* MODAL USER MENU */}
      <ReactModal
        isOpen={userMenuVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setUserMenuVisible(false);
        }}
        className={
          "fadeIn fixed left-0 right-0 top-16 flex-grow items-center rounded-none bg-white md:left-auto md:right-6 md:top-20 md:w-56 md:rounded-2xl"
        }
        portalClassName={"fixed z-50"}
        overlayClassName="fixed inset-0 bg-transparent"
      >
        <div>
          <Link href="/user/profile">
            <button
              className={`${styles.userMenuLink} rounded-l-2xl rounded-r-2xl rounded-bl-none rounded-br-none`}
            >
              Account settings
            </button>
          </Link>

          <Link href="/user/rewards">
            <button className={`${styles.userMenuLink} rounded-none`}>
              My rewards
            </button>
          </Link>

          {/* <Link href="/user/saved">
                <a>
                  <button className={`${styles.userMenuLink} rounded-none`}>
                    Saved
                  </button>
                </a>
              </Link> */}

          {/* <Link href="/user/notifications">
              <button className={`${styles.userMenuLink} rounded-none`}>
                Inbox
                {alertCount !== null && alertCount > 0 && (
                  <div className="badge badge-primary relative left-4">
                    {alertCount}
                  </div>
                )}
              </button>
          </Link> */}

          <Link href="/user/emailSettings">
            <button className={`${styles.userMenuLink} rounded-none`}>
              Email settings
            </button>
          </Link>

          {/* {userRoles?.find((x) => x.name === "Seller") && (
            <Link href="/seller/overview">
              <a>
                <button className="gl-border-dark-button rounded-none">
                  Seller Dashboard
                </button>
              </a>
            </Link>
          )}

          {userRoles?.find((x) => x.name === "Administrator") && (
            <Link href="/admin/users">
              <a>
                <button className="gl-border-dark-button rounded-none">
                  Administration
                </button>
              </a>
            </Link>
          )} */}

          <div className="divider m-0" />

          <button
            className={`${styles.userMenuLink} rounded-none rounded-bl-2xl rounded-br-2xl`}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </ReactModal>
    </>
  );
};
