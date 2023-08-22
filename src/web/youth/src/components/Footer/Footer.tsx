import Link from "next/link";
// import { LogoImage } from "./LogoImage";

export const Footer: React.FC = () => {
  return (
    <footer className="flex w-full place-items-center px-4 pt-2 align-middle">
      <div className="flex-grow">
        {/* LOGO */}
        <div className="  z-40 mr-6 cursor-pointer text-white">{/* <LogoImage /> */}</div>
      </div>
      <div className="flex-none">
        {/* LINKS */}
        <div className="flex space-x-5 text-xs md:space-x-10 md:text-sm">
          <Link className="hover:underline" href="/about">
            About
          </Link>
          <Link className="hover:underline" href="/terms">
            Terms of Service
          </Link>
          <Link className="hover:underline" href="mailto:info@wadappt.io">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
};
