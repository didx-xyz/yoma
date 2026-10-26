import React, { useEffect, useRef } from "react";
import ScrollableContainer from "~/components/Carousel/ScrollableContainer";

/**
 * Scrolls a pill's line sideways so the pill sits in its centre: sideways only, so it never fights
 * a vertical scroll that is running. Nothing happens while the line fits.
 */
export const centrePillInRow = (pill: HTMLElement): void => {
  const line = pill.parentElement;
  if (!line || line.scrollWidth <= line.clientWidth) return;
  const pillBox = pill.getBoundingClientRect();
  const lineBox = line.getBoundingClientRect();
  line.scrollLeft +=
    pillBox.left - lineBox.left - (lineBox.width - pillBox.width) / 2;
};

/**
 * A row of pills (`lib/pill.ts`) on one line that scrolls sideways when it does not fit, with an
 * edge fade in the colour behind it. `className` adds to the line, e.g. `md:flex-wrap` to wrap
 * from `md` or `justify-center-safe` to centre it while it fits.
 *
 * On mount the current pill (`aria-current="page"` or `aria-pressed="true"`) is centred in the
 * line (`centrePillInRow`), so a youth on a phone lands seeing where they are.
 */
export const PillRow: React.FC<{
  children: React.ReactNode;
  /** The `from-*` colour of the surface behind the row. */
  shadowFromClassName: string;
  className?: string;
}> = ({ children, shadowFromClassName, className = "" }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pill = rootRef.current?.querySelector<HTMLElement>(
      '[aria-current="page"], [aria-pressed="true"]',
    );
    if (pill) centrePillInRow(pill);
  }, []);

  return (
    <div ref={rootRef} className="min-w-0">
      <ScrollableContainer
        className={`flex gap-2 overflow-x-auto pb-1 ${className}`}
        containerClassName=""
        showShadows
        shadowFromClassName={shadowFromClassName}
      >
        {children}
      </ScrollableContainer>
    </div>
  );
};
