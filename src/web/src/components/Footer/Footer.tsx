import Image from "next/image";
import Link from "next/link";
import logoPicDark from "public/images/logo-dark.webp";
import { SocialMediaLinks } from "./SocialMediaLinks";

export const Footer: React.FC<{
  showSocialMediaLinks?: boolean;
  tabIndex?: number;
  size?: "small" | "large";
}> = ({ showSocialMediaLinks, tabIndex, size = "large" }) => {
  const forceSmall = size === "small";

  return (
    <footer
      className={`flex w-full flex-col gap-4 overflow-x-hidden p-4 ${forceSmall ? "" : "md:flex-row md:items-center md:gap-8 md:p-2 md:px-4"}`}
    >
      {/* LINKS */}
      <div className="flex flex-col gap-2 text-xs md:text-sm">
        <div className="flex flex-wrap gap-1">
          <span className="notranslate">© 2026 Yoma.</span>
          <span>All Rights Reserved</span>
        </div>
        <div className={`flex flex-row gap-2 ${forceSmall ? "" : "md:gap-6"}`}>
          <Link
            className="text-green font-semibold hover:underline"
            href="/terms"
            tabIndex={tabIndex}
          >
            Terms and conditions
          </Link>
          <Link
            className="notranslate text-green font-semibold hover:underline"
            href="mailto:help@yoma.world"
            tabIndex={tabIndex}
          >
            help@yoma.world
          </Link>
        </div>
      </div>

      {/* SOCIAL LINKS & LOGO */}
      <div
        className={`flex flex-row items-center justify-between ${forceSmall ? "" : "md:flex-1"}`}
      >
        {showSocialMediaLinks && (
          <div>
            <SocialMediaLinks />
          </div>
        )}
        <div className="flex-shrink-0">
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
      </div>
    </footer>
  );
};
