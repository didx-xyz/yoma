import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import { IoArrowForward } from "react-icons/io5";
import { OPPORTUNITIES_SEARCH_URL } from "~/lib/constants";

/** The usual next step from an empty Yo-ID card or list: the opportunity search. */
export const FIND_OPPORTUNITIES = {
  href: OPPORTUNITIES_SEARCH_URL,
  label: "Find opportunities",
};

interface Common {
  title: string;
  description: string;
  action?: { href: string; label: string };
  /** Called when the action is followed (the user-menu drawer closes on a plain click). */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  tabIndex?: number;
}

/**
 * "Nothing here yet", for the Yo-ID section cards (`card`) and the Yo-ID list pages (`page`): a
 * short title saying what's missing, one line on what fills it, and the next step (Jason,
 * 2026-10-26: informative, short). A page shows the section's icon on its tint; a card shows
 * none — the card's own header already carries it (Jason, same day: no nested icons).
 */
export const EmptyState: React.FC<
  Common &
    (
      | { variant?: "card" }
      | {
          variant: "page";
          icon: ReactNode;
          /** The tint behind the icon (`TONE.*`): the section's own. */
          toneClass: string;
        }
    )
> = (props) => {
  const { title, description, action, onClick, tabIndex } = props;
  const link = action && (
    <Link
      href={action.href}
      onClick={onClick}
      tabIndex={tabIndex}
      className="text-green inline-flex items-center gap-1 text-sm font-semibold hover:underline"
    >
      {action.label}
      <IoArrowForward aria-hidden className="h-3.5 w-3.5" />
    </Link>
  );

  if (props.variant === "page")
    return (
      <div className="shadow-custom flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-10 text-center">
        <span
          aria-hidden
          className={`flex h-14 w-14 items-center justify-center rounded-full [&>svg]:h-7 [&>svg]:w-7 ${props.toneClass}`}
        >
          {props.icon}
        </span>
        <h2 className="font-nunito text-lg font-black text-black">{title}</h2>
        <p className="text-gray-dark max-w-md text-sm">{description}</p>
        {link}
      </div>
    );

  return (
    <div className="border-gray flex flex-col items-start gap-0.5 rounded-xl border border-dashed p-3">
      <p className="text-sm font-bold text-black">{title}</p>
      <p className="text-gray-dark text-xs md:text-sm">{description}</p>
      {link}
    </div>
  );
};
