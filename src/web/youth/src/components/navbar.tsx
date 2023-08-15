import Link from "next/link";
import { useState } from "react";
import { IoMdMenu } from "react-icons/io";
import ReactModal from "react-modal";
// import { LogoImage } from "../LogoImage";
// import { CartComponent } from "./Cart";
// import { SearchComponent } from "./Search";
// import { SignInButton } from "./SignInButton";
// import { UserMenu } from "./UserMenu";
import { useSession } from "next-auth/react";
import styles from "~/styles/Navbar.module.scss";
import { SignInButton } from "./signInButton";
import { UserMenu } from "./userMenu";

export const Navbar: React.FC = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { data: session } = useSession();

  return (
    <div id="topNav" className="fixed left-0 right-0 top-0 z-40">
      <div className="bg-base-100x navbar z-40">
        <div className="navbar-start">
          {/* HAMBURGER MENU */}
          <button
            type="button"
            aria-label="Navigation Menu"
            className="btn-hover-grow btn btn-square w-[100px] gap-2 border-none bg-transparent hover:border-none hover:bg-transparent lg:hidden"
            onClick={() => setMenuVisible(!menuVisible)}
          >
            <IoMdMenu className="h-8 w-8" />
          </button>

          {/* MODAL MENU */}
          <ReactModal
            isOpen={menuVisible}
            shouldCloseOnOverlayClick={true}
            onRequestClose={() => {
              setMenuVisible(false);
            }}
            className={
              "fadeIn fixed left-0 right-0 top-16 flex-grow items-center rounded-none bg-white md:left-6 md:right-auto md:top-20 md:w-56 md:rounded-2xl"
            }
            portalClassName={"fixed z-50"}
            overlayClassName="fixed inset-0 bg-transparent"
          >
            <div>
              <Link href="/">
                <button
                  className={`${styles.borderDarkButton} rounded-l-2xl rounded-r-2xl rounded-bl-none rounded-br-none`}
                >
                  Home
                </button>
              </Link>

              <Link href="/opportunities">
                <button className={`${styles.borderDarkButton} rounded-none`}>
                  Opportunities
                </button>
              </Link>

              <Link href="/marketplace">
                <button
                  className={`${styles.borderDarkButton} rounded-none rounded-bl-2xl rounded-br-2xl`}
                >
                  Marketplace
                </button>
              </Link>

              <Link href="/faq">
                <button
                  className={`${styles.borderDarkButton} rounded-none rounded-bl-2xl rounded-br-2xl`}
                >
                  FAQ
                </button>
              </Link>

              <Link href="/howToYoma">
                <button
                  className={`${styles.borderDarkButton} rounded-none rounded-bl-2xl rounded-br-2xl`}
                >
                  How to Yoma
                </button>
              </Link>

              <Link href="/feedback">
                <button
                  className={`${styles.borderDarkButton} rounded-none rounded-bl-2xl rounded-br-2xl`}
                >
                  Feedback
                </button>
              </Link>

              <Link href="/localisation">
                <button
                  className={`${styles.borderDarkButton} rounded-none rounded-bl-2xl rounded-br-2xl`}
                >
                  Localisation
                </button>
              </Link>

              {/* {process.env.NEXT_PUBLIC_ALT_WEB_BASE_URI && (
                <Link href={process.env.NEXT_PUBLIC_ALT_WEB_BASE_URI}>
                  <a>
                    <button className="gl-border-dark-button rounded-none rounded-bl-2xl rounded-br-2xl">
                      {process.env.NEXT_PUBLIC_ALT_WEB_BASE_LABEL}
                    </button>
                  </a>
                </Link>
              )} */}
            </div>
          </ReactModal>

          {/* LOGO */}
          <div className="pr-4">{/* <LogoImage /> */}</div>

          {/* MENU ITEMS */}
          <ul className="plx-16 menu menu-horizontal hidden p-0 lg:flex">
            <li tabIndex={0}>
              <Link href="/" legacyBehavior>
                <a className={`${styles.topNavMenuItem}`}>Home</a>
              </Link>
            </li>
            <li tabIndex={1}>
              <Link href="/opportunities" legacyBehavior>
                <a className={`${styles.topNavMenuItem}`}>Opportunities</a>
              </Link>
            </li>
            <li tabIndex={2}>
              <Link href="/marketplace" legacyBehavior>
                <a className={`${styles.topNavMenuItem}`}>Marketplace</a>
              </Link>
            </li>
            <li tabIndex={4}>
              <Link href="/faq" legacyBehavior>
                <a className={`${styles.topNavMenuItem}`}>FAQ</a>
              </Link>
            </li>
            <li tabIndex={5}>
              <Link href="/howToYoma" legacyBehavior>
                <a className={`${styles.topNavMenuItem}`}>How to Yoma</a>
              </Link>
            </li>
            <li tabIndex={6}>
              <Link href="/feedback" legacyBehavior>
                <a className={`${styles.topNavMenuItem}`}>Feedback</a>
              </Link>
            </li>
            <li tabIndex={3}>
              <Link href="/localisation" legacyBehavior>
                <a className={`${styles.topNavMenuItem}`}>Localisation</a>
              </Link>
            </li>

            {/* {process.env.NEXT_PUBLIC_ALT_WEB_BASE_URI && (
              <li tabIndex={2}>
                <Link
                  href={process.env.NEXT_PUBLIC_ALT_WEB_BASE_URI}
                  legacyBehavior
                >
                  <a className={`${styles.topNavMenuItem}`}>
                    {process.env.NEXT_PUBLIC_ALT_WEB_BASE_LABEL}
                  </a>
                </Link>
              </li>
            )} */}
          </ul>
        </div>
        {/* <div
            className="navbar-center hidden md:flex"
          >
          </div> */}
        <div className="navbar-end gap-5">
          {/* SEARCH */}
          {/* <div className="absolute left-2 right-2 top-[4.5rem] md:static md:w-96">
            <SearchComponent />
          </div> */}

          {/* CART */}
          {/* <div>
            <CartComponent />
          </div> */}

          <div>
            {/* SIGN IN BUTTON */}
            {!session && <SignInButton></SignInButton>}

            {/* USER BUTTON */}
            {session && <UserMenu />}
          </div>
        </div>
      </div>
    </div>
  );
};
