import Link from "next/link";
import { LogoImage } from "../NavBar/LogoImage";

export const Footer: React.FC = () => {
  return (
    <footer className="flex w-full place-items-center p-2 px-4 align-middle">
      <div className="flex-grow pl-4">
        {/* LINKS */}
        <div className="grid w-full grid-cols-3 text-xs md:flex md:gap-8 md:text-sm">
          <div className="col-span-3 md:col-span-1">
            © 2023 Yoma. All Rights Reserved
          </div>
          <Link className="text-green hover:underline" href="/terms">
            Terms and Conditions
          </Link>
          <Link
            className="text-green hover:underline"
            href="mailto:help@yoma.world"
          >
            help@yoma.world
          </Link>
        </div>
      </div>
      <div className="flex-none">
        {/* LOGO */}
        <div className="z-40 mr-6 cursor-pointer text-white">
          <LogoImage dark={true} />
        </div>
      </div>
    </footer>
  );
};
