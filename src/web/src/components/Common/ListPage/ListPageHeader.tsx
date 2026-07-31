import Image from "next/image";
import worldMap from "public/images/world-map.webp";
import type { ReactNode } from "react";

/**
 * Page shell for the admin list pages: a themed banner carrying the title, a one-line
 * description and the page chrome (status tabs, search toolbar, filter badges), followed by
 * the results in the usual centred column.
 *
 * Replaces PageBackground, which was absolutely positioned at top:0 *behind* the fixed
 * navbar, so every page had to guess a height for it (h-[14.3rem] md:h-[18.4rem] and
 * friends) and a matching top margin for its own content. Here the banner is in normal flow
 * and simply pads past the navbar, so nothing has to be kept in sync by hand.
 *
 * NB: MainLayout's <main> is `flex justify-center`, so a page must render ONE full-width
 * child — hence ListPageShell. Two in-flow children would lay out side by side.
 */

/** Same column on the banner and the body, so the title lines up with the results. */
const CONTAINER = "container mx-auto max-w-7xl px-2 md:px-4";

export const ListPageShell: React.FC<{ children: ReactNode }> = ({
  children,
}) => <div className="flex w-full flex-col">{children}</div>;

/**
 * The banner carries the title, the description and the status tabs — the tabs are white on
 * the theme colour and read as attached to it. The search toolbar and the filter badges sit
 * below in ListPageBody, on the page background.
 */
export const ListPageHeader: React.FC<{
  title: ReactNode;
  /** one line on what the page is for; plain text, nothing to open */
  description?: ReactNode;
  /** the status tab bar */
  children?: ReactNode;
}> = ({ title, description, children }) => (
  <div className="bg-theme relative isolate w-full overflow-hidden">
    {/* WORLD MAP — decorative, and the navbar above is the same colour, so the two read
        as one continuous banner */}
    <Image
      src={worldMap}
      alt=""
      aria-hidden={true}
      width={640}
      priority={true}
      className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-auto w-[32rem] max-w-none -translate-x-1/2 -translate-y-1/2 object-scale-down opacity-10 select-none md:w-[40rem]"
    />

    {/* pt clears the fixed h-20 navbar */}
    <div className={`${CONTAINER} flex flex-col gap-4 pt-24 pb-2`}>
      <div className="flex flex-col gap-1">
        <h3 className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-normal text-white md:text-3xl">
          {title}
        </h3>
        {description && (
          <p className="max-w-3xl text-sm text-white/80">{description}</p>
        )}
      </div>

      {children}
    </div>
  </div>
);

/**
 * Everything below the banner — the chrome and the results — in a column aligned with it.
 * Children are evenly spaced, so pages list the tabs, toolbar, badges and results as
 * siblings without wrapper divs.
 */
export const ListPageBody: React.FC<{
  className?: string;
  children: ReactNode;
}> = ({ className = "", children }) => (
  <div className={`${CONTAINER} flex flex-col gap-4 py-6 ${className}`}>
    {children}
  </div>
);

export default ListPageHeader;
