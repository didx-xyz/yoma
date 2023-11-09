import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { IoMdMenu } from "react-icons/io";
import ReactModal from "react-modal";
import { LogoImage } from "./LogoImage";
import { SignInButton } from "./SignInButton";
import { UserMenu } from "./UserMenu";
import { useAtomValue } from "jotai";
import { navbarColorAtom } from "~/lib/store";

export const Navbar: React.FC = () => {
  const navbarColor = useAtomValue(navbarColorAtom);
  const [menuVisible, setMenuVisible] = useState(false);
  const { data: session } = useSession();

  return (
    <div id="topNav" className="fixed left-0 right-0 top-0 z-40">
      <div className={`${navbarColor} navbar z-40`}>
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
            className={`${navbarColor} fixed left-0 right-0 top-16 flex-grow items-center animate-in fade-in`}
            portalClassName={"fixed z-50"}
            overlayClassName="fixed inset-0"
          >
            <div className="flex flex-col">
              <Link
                href="/"
                className="px-7 py-3 text-white hover:brightness-50"
                onClick={() => setMenuVisible(false)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className="px-7 py-3 text-white hover:brightness-50"
                onClick={() => setMenuVisible(false)}
              >
                About
              </Link>
              <Link
                href="/opportunities"
                className="px-7 py-3 text-white hover:brightness-50"
                onClick={() => setMenuVisible(false)}
              >
                Opportunities
              </Link>
              <Link
                href="/jobs"
                className="px-7 py-3 text-white hover:brightness-50"
                onClick={() => setMenuVisible(false)}
              >
                Jobs
              </Link>
              <Link
                href="/marketplace"
                className="px-7 py-3 text-white hover:brightness-50"
                onClick={() => setMenuVisible(false)}
              >
                Marketplace
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
              <Link href="/about" className="text-white hover:brightness-50">
                About
              </Link>
            </li>
            <li tabIndex={2}>
              <Link
                href="/opportunities"
                className="text-white hover:brightness-50"
              >
                Opportunities
              </Link>
            </li>
            <li tabIndex={3}>
              <Link href="/jobs" className="text-white hover:brightness-50">
                Jobs
              </Link>
            </li>
            <li tabIndex={4}>
              <Link
                href="/marketplace"
                className="text-white hover:brightness-50"
              >
                Marketplace
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
