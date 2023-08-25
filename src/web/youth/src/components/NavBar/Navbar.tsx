import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { IoMdMenu } from "react-icons/io";
import ReactModal from "react-modal";
import { LogoImage } from "./LogoImage";
import { SignInButton } from "./SignInButton";
import { UserMenu } from "./UserMenu";

export const Navbar: React.FC = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { data: session } = useSession();

  return (
    <div id="topNav" className="fixed left-0 right-0 top-0 z-40">
      <div className="navbar z-40 bg-purple">
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
            className={
              "fixed left-0 right-0 top-16 flex-grow items-center bg-purple animate-in fade-in"
            }
            portalClassName={"fixed z-50"}
            overlayClassName="fixed inset-0"
          >
            <div className="flex flex-col">
              <Link
                href="/"
                className="px-7 py-3 text-white hover:brightness-50"
              >
                Home
              </Link>

              <Link
                href="/opportunities"
                className="px-7 py-3 text-white hover:brightness-50"
              >
                Opportunities
              </Link>

              <Link
                href="/marketplace"
                className="px-7 py-3 text-white hover:brightness-50"
              >
                Marketplace
              </Link>

              <Link
                href="/faq"
                className="px-7 py-3 text-white hover:brightness-50"
              >
                FAQ
              </Link>

              <Link
                href="/howToYoma"
                className="px-7 py-3 text-white hover:brightness-50"
              >
                How to Yoma
              </Link>

              <Link
                href="/feedback"
                className="px-7 py-3 text-white hover:brightness-50"
              >
                Feedback
              </Link>

              <Link
                href="/localisation"
                className="px-7 py-3 text-white hover:brightness-50"
              >
                Localisation
              </Link>
            </div>
          </ReactModal>
          <div className="ml-8">
            <LogoImage />
          </div>
          <ul className="hidden w-full flex-row items-center justify-center gap-16 p-0 lg:flex">
            <li tabIndex={0}>
              <Link href="/" className="text-white hover:brightness-50">
                Home
              </Link>
            </li>
            <li tabIndex={1}>
              <Link
                href="/opportunities"
                className="text-white hover:brightness-50"
              >
                Opportunities
              </Link>
            </li>
            <li tabIndex={2}>
              <Link
                href="/marketplace"
                className="text-white hover:brightness-50"
              >
                Marketplace
              </Link>
            </li>
            <li tabIndex={3}>
              <Link href="/faq" className="text-white hover:brightness-50">
                FAQ
              </Link>
            </li>
            <li tabIndex={3}>
              <Link
                href="/howToYoma"
                className="text-white hover:brightness-50"
              >
                How to Yoma
              </Link>
            </li>
            <li tabIndex={3}>
              <Link href="/feedback" className="text-white hover:brightness-50">
                Feedback
              </Link>
            </li>
            <li tabIndex={3}>
              <Link
                href="/localisation"
                className="text-white hover:brightness-50"
              >
                Localisation
              </Link>
            </li>
          </ul>
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
