import React from "react";

/**
 * The ONE badge on the discovery surface — four badges, three intents, one set of metrics
 * (height, radius, tracking, weight). Before this they were four hand-rolled spans that had
 * drifted in size and, worse, in meaning: amber carried both "not available yet" (SOON) and
 * "consent required" (OPT-IN), so the colour said nothing.
 *
 * | Badge            | Intent        | Reads as                                  |
 * | ---------------- | ------------- | ----------------------------------------- |
 * | SOON             | availability  | exists, cannot be used yet                |
 * | OPT-IN           | consent       | you choose to switch this on              |
 * | FROM THIS TYPE   | provenance    | present because of the selected type      |
 * | FROM PREFERENCES | provenance    | value inherited from your saved preset    |
 *
 * Amber is now reserved for availability alone.
 */
export type BadgeIntent = "availability" | "consent" | "provenance";

const TONES: Record<BadgeIntent, string> = {
  availability: "bg-yellow-light text-yellow",
  consent: "bg-gray-light text-gray-dark",
  provenance: "bg-purple-tint text-purple",
};

export const Badge: React.FC<{
  intent: BadgeIntent;
  children: React.ReactNode;
  /** Native tooltip — used where the badge is the only room for the explanation. */
  title?: string;
}> = ({ intent, children, title }) => (
  <span
    title={title}
    className={`inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[10px] font-bold tracking-wide whitespace-nowrap ${TONES[intent]}`}
  >
    {children}
  </span>
);
