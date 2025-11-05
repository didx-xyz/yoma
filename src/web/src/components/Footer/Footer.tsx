import Image from "next/image";
import Link from "next/link";
import logoPicDark from "public/images/logo-dark.webp";
import { SocialMediaLinks } from "./SocialMediaLinks";

export const Footer: React.FC<{
  showSocialMediaLinks?: boolean;
  tabIndex?: number;
  size?: "small" | "large";
}> = ({ showSocialMediaLinks, tabIndex, size = "large" }) => {
  const isMobileLayout = size === "small";

  return (
    <footer
      className={`flex w-full ${
        isMobileLayout
          ? "flex-col gap-4 p-2"
          : "flex-col gap-4 p-4 md:flex-row md:items-center md:gap-8 md:p-2 md:px-4"
      } overflow-x-hidden`}
    >
      {/* LEFT SECTION: LINKS */}
      <div
        className={`flex flex-col gap-2 ${isMobileLayout ? "text-xs" : "text-sm"}`}
      >
        <div className="flex flex-wrap gap-1">
          <span className="notranslate">© 2021 Yoma.</span>
          <span>All Rights Reserved</span>
        </div>
        <div
          className={`flex ${isMobileLayout ? "flex-row gap-2" : "flex-row gap-2 md:gap-6"}`}
        >
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

      {/* CENTER SECTION (DESKTOP): SOCIAL MEDIA ICONS */}
      {!isMobileLayout && showSocialMediaLinks && (
        <div className="hidden md:block">
          <SocialMediaLinks />
        </div>
      )}

      {/* MOBILE: SOCIAL MEDIA ICONS & LOGO IN ONE ROW */}
      <div
        className={`flex flex-row items-center justify-between ${isMobileLayout ? "" : "md:hidden"}`}
      >
        {showSocialMediaLinks && <SocialMediaLinks />}
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

      {/* RIGHT SECTION (DESKTOP): LOGO */}
      {!isMobileLayout && (
        <div className="hidden flex-shrink-0 md:ml-auto md:block">
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
      )}
    </footer>
  );
};
