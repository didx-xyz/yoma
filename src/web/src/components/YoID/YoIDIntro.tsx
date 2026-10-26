import type { ReactNode } from "react";
import { IoInformationCircleOutline } from "react-icons/io5";

/**
 * The one-paragraph note under a Yo-ID subpage's breadcrumb saying what the page holds and what
 * to do there (Jason, 2026-10-21): its own white card, like the wallet card, with the wallet's
 * green info icon, body text in black and room for links. Links inside use `INTRO_LINK_CLASS`.
 */
export const INTRO_LINK_CLASS = "text-green font-semibold underline";

export const YoIDIntro: React.FC<{ children: ReactNode }> = ({ children }) => (
  <p className="shadow-custom flex items-start gap-3 rounded-xl bg-white p-4 text-sm text-black">
    <IoInformationCircleOutline
      aria-hidden
      className="text-green mt-px h-5 w-5 shrink-0"
    />
    <span className="min-w-0">{children}</span>
  </p>
);
