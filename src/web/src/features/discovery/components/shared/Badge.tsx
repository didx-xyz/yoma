import React from "react";

/**
 * The ONE badge on the discovery surface — three badges, two intents, one set of metrics
 * (height, radius, tracking, weight). Before this they were hand-rolled spans that had drifted
 * in size and, worse, in meaning.
 *
 * | Badge            | Intent        | Reads as                                  |
 * | ---------------- | ------------- | ----------------------------------------- |
 * | OPT-IN           | consent       | you choose to switch this on              |
 * | FROM THIS TYPE   | provenance    | present because of the selected type      |
 * | FROM PREFERENCES | provenance    | value inherited from your saved preset    |
 *
 * The amber `availability` intent (SOON) went with the quick-search coming-soon state on
 * 2026-09-22: a facet that cannot filter yet is either a pending note inside its section or not
 * drawn at all — never a badge.
 */
export type BadgeIntent = "consent" | "provenance";

const TONES: Record<BadgeIntent, string> = {
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
