import React from "react";
import { IoArrowUp } from "react-icons/io5";

/**
 * "Jump to top" under a long page: the discovery rails or pager (2026-10-08) and the
 * opportunity details page (2026-10-12). Smooth unless the youth prefers reduced motion.
 */
export const JumpToTop: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div className={`flex justify-center pt-2 ${className}`}>
    <button
      type="button"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
        })
      }
      className="text-green inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold hover:underline"
    >
      <IoArrowUp className="h-4 w-4" aria-hidden />
      Jump to top
    </button>
  </div>
);
