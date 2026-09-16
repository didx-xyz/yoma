import type { ReactNode } from "react";

/**
 * A tinted panel with an icon beside it: the shape this flow uses for something said *about* the
 * screen rather than by it — what happens next, why a step is paused, why a link would not open.
 *
 * Distinct from `CashOutMessage`, which is the screen's own point (round badge, heading, centred).
 * A note sits alongside the content, reads left-aligned, and never carries the primary action.
 *
 * `tone` is the only variable, and **none of these is an error**: `info` for what is simply true,
 * `warning` for something that did not work and can be tried again. No red anywhere — nothing here
 * is the youth's fault and nothing here means their Zlto is gone.
 */

const TONES = {
  info: "bg-blue-light text-blue-dark",
  warning: "bg-orange-light text-orange",
} as const;

export const CashOutNote: React.FC<{
  icon: ReactNode;
  tone?: keyof typeof TONES;
  title?: string;
  children: ReactNode;
  /** `alert` for something that just failed, so a screen reader hears it without being asked */
  role?: "alert";
}> = ({ icon, tone = "info", title, children, role }) => (
  <div
    role={role}
    className={`flex flex-row items-start gap-3 rounded-lg px-4 py-3 ${TONES[tone]}`}
  >
    <span className="mt-0.5 shrink-0" aria-hidden="true">
      {icon}
    </span>

    {/* The text goes back to black: the tone colours the panel and its icon, not the reading. */}
    <div className="flex flex-col gap-1 text-black">
      {title && <span className="text-sm font-bold">{title}</span>}
      <div className="text-sm leading-6">{children}</div>
    </div>
  </div>
);
