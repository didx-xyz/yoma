import Image from "next/image";
import Link from "next/link";
import logoPicDark from "public/images/logo-dark.webp";
import { SocialMediaLinks } from "./SocialMediaLinks";

export const Footer: React.FC<{
  showSocialMediaLinks?: boolean;
  tabIndex?: number;
}> = ({ showSocialMediaLinks, tabIndex }) => {
  return (
    <footer className="flex w-full items-center overflow-x-hidden p-2 px-4">
      <div className="flex grow flex-row gap-4">
        {/* LINKS */}
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex flex-wrap gap-1">
            <span className="notranslate">© 2023 Yoma.</span>
            <span>All Rights Reserved</span>
          </div>
          <div className="flex flex-row flex-wrap gap-1">
            <Link
              className="text-green hover:underline"
              href="/terms"
              tabIndex={tabIndex}
            >
              Terms and Conditions
            </Link>
            <Link
              className="notranslate text-green hover:underline"
              href="mailto:help@yoma.world"
              tabIndex={tabIndex}
            >
              help@yoma.world
            </Link>
          </div>
        </div>

        {showSocialMediaLinks && <SocialMediaLinks />}
      </div>
      <div className="flex-none">
        {/* LOGO */}
        <Link href="/" tabIndex={tabIndex} title="Go Home">
          <Image
            src={logoPicDark}
            alt="Logo"
            priority={false}
            width={85}
            className="h-auto"
            sizes="100vw"
            tabIndex={tabIndex}
          />
        </Link>
      </div>
    </footer>
  );
};
