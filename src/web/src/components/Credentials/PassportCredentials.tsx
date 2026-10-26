import React, { useEffect, useRef, useState } from "react";
import type { SSICredentialInfo } from "~/api/models/credential";
import { centrePillInRow, PillRow } from "~/components/Common/PillRow";
import { formatNumber } from "~/features/discovery/lib/format";
import { CARD_GRID_CLASS } from "~/lib/card";
import type { CredentialGroup } from "~/lib/credentials/credentialGroups";
import {
  PILL_CLASS,
  PILL_COUNT_CLASS,
  PILL_IDLE_CLASS,
  PILL_PRESSED_CLASS,
  PILL_TOUCH_CLASS,
} from "~/lib/pill";
import { typeBadgeClass, YOID_TYPE } from "~/lib/typeColours";
import { CredentialCard } from "./CredentialCard";
import { PAGER_SCROLL_MARGIN_CLASS } from "../YoID/usePagerScroll";

// ─────────────────────────────────────────────────────────────────────────────
// PassportCredentials (YOM-1283, 2026-10-20)
//
// The loaded passport by credential type: a chip per type after "All", then either one section
// per type (All) or every loaded credential of the picked type. A section shows one row of cards
// and links to its type's chip. No carousel: Jason asked for sections.
// ─────────────────────────────────────────────────────────────────────────────

/** All, or one group by its key. */
type Selection = "all" | { key: string };

/** A type's every card. */
const TYPE_GRID_CLASS = `${CARD_GRID_CLASS} pt-2`;
/**
 * An All section renders this many cards and hides, below 900 and 1200 px, the ones that would
 * start a second row of `CARD_GRID_CLASS`: one row of 2, 3 or 4 (stacked 2 below 600).
 */
const SECTION_CARDS = 4;
const SECTION_GRID_CLASS = `${TYPE_GRID_CLASS} max-[899px]:[&>*:nth-child(n+3)]:hidden max-[1199px]:[&>*:nth-child(n+4)]:hidden`;
/** The fewest cards a section hides at some width, so the fewest worth a "See all". */
const SEE_ALL_FROM = 3;

const sectionId = (key: string): string =>
  `passport-${key.replace(/[^\w-]/g, "-")}`;

export const PassportCredentials: React.FC<{
  groups: CredentialGroup[];
  /** The wallet's credential count. */
  total: number;
  /**
   * Every credential is loaded, so a group's size is its type's count. Until then a group's
   * count reads "N+": the youth has at least that many.
   */
  complete: boolean;
  onOpen: (credential: SSICredentialInfo) => void;
  /**
   * The type chip to start on (the overview's and the drawer's family pills deep-link with
   * `?type=<key>`); a key not among the loaded groups starts on All.
   */
  initialKey?: string | null;
}> = ({ groups, total, complete, onOpen, initialKey }) => {
  const [selection, setSelection] = useState<Selection>(() =>
    initialKey && groups.some((group) => group.key === initialKey)
      ? { key: initialKey }
      : "all",
  );
  const rowRef = useRef<HTMLDivElement>(null);
  // Set by a youth's pick, so the effect below never runs for the first render.
  const reveal = useRef<"row" | "focus" | null>(null);

  const picked =
    selection === "all"
      ? undefined
      : groups.find((group) => group.key === selection.key);

  const pick = (next: Selection, then: "row" | "focus") => {
    reveal.current = then;
    setSelection(next);
  };

  // After a pick: bring the chip row back into view if it scrolled above the fold (its
  // `scroll-mt` clears the fixed navbar), and after "See all" move focus to the pressed chip,
  // centred in the row in case it sits off the row's sideways scroll on a phone.
  useEffect(() => {
    const row = rowRef.current;
    const then = reveal.current;
    reveal.current = null;
    if (!row || !then) return;
    if (
      row.getBoundingClientRect().top <
      parseFloat(getComputedStyle(row).scrollMarginTop)
    )
      row.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    const pressed = row.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (then === "focus" && pressed) {
      pressed.focus({ preventScroll: true });
      centrePillInRow(pressed);
    }
  }, [selection]);

  /**
   * A group's count: exact once `complete`, else "N+" ("at least N" to a screen reader). The
   * YoID group is always exact: a wallet holds one identity credential by contract.
   */
  const groupCount = (key: string, n: number) => {
    const exact = complete || key === YOID_TYPE;
    return (
      <span className={PILL_COUNT_CLASS}>
        {!exact && <span className="sr-only">at least </span>}
        {formatNumber(n)}
        {!exact && <span aria-hidden>+</span>}
      </span>
    );
  };

  const chip = (
    key: string,
    next: Selection,
    label: React.ReactNode,
    count: React.ReactNode,
  ) => {
    const pressed =
      next === "all"
        ? picked === undefined
        : picked !== undefined && picked.key === next.key;
    return (
      <button
        key={key}
        type="button"
        aria-pressed={pressed}
        onClick={() => pick(next, "row")}
        className={`${PILL_CLASS} ${PILL_TOUCH_CLASS} ${pressed ? PILL_PRESSED_CLASS : PILL_IDLE_CLASS}`}
      >
        {label}
        {count}
      </button>
    );
  };

  /** `oneRow`: an All section, capped to one row with a "See all"; else the type's every card. */
  const section = (group: CredentialGroup, oneRow: boolean) => {
    const id = sectionId(group.key);
    const count = group.credentials.length;
    return (
      <section key={id} aria-labelledby={`${id}-heading`}>
        <div className="flex items-start justify-between gap-3 pb-1">
          <h2
            id={`${id}-heading`}
            className="font-nunito flex min-w-0 items-start gap-2 text-base font-black tracking-normal md:text-lg"
          >
            <span
              aria-hidden
              className={`mt-1.5 h-3 w-3 shrink-0 rounded-full md:mt-2 ${typeBadgeClass(group.key)}`}
            />
            <span className="line-clamp-2">{group.label}</span>
            {groupCount(group.key, count)}
          </h2>
          {oneRow && count >= SEE_ALL_FROM && (
            <button
              type="button"
              onClick={() => pick({ key: group.key }, "focus")}
              className="text-green inline-flex min-h-11 shrink-0 items-center text-xs font-semibold whitespace-nowrap md:min-h-0 md:text-sm"
            >
              See all {complete && `${formatNumber(count)} `}→
            </button>
          )}
        </div>
        <div className={oneRow ? SECTION_GRID_CLASS : TYPE_GRID_CLASS}>
          {(oneRow
            ? group.credentials.slice(0, SECTION_CARDS)
            : group.credentials
          ).map((credential) => (
            <CredentialCard
              key={credential.id}
              credential={credential}
              typeKey={group.key}
              label={group.typeLabel}
              onOpen={onOpen}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <>
      {/* CHIPS — one view only with a single type, so none then */}
      {groups.length > 1 && (
        <div
          ref={rowRef}
          role="group"
          aria-label="Filter by credential type"
          className={PAGER_SCROLL_MARGIN_CLASS}
        >
          <PillRow
            shadowFromClassName="from-gray-light"
            className="md:flex-wrap"
          >
            {chip(
              "all",
              "all",
              "All",
              <span className={PILL_COUNT_CLASS}>{formatNumber(total)}</span>,
            )}
            {groups.map((group) =>
              chip(
                sectionId(group.key),
                { key: group.key },
                <>
                  <span
                    aria-hidden
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${typeBadgeClass(group.key)}`}
                  />
                  {group.label}
                </>,
                groupCount(group.key, group.credentials.length),
              ),
            )}
          </PillRow>
        </div>
      )}

      {/* CONTENT — keyed on the pick so it fades in afresh. A single type has no chips to see all
          of it from, so its section is uncapped. */}
      <div
        key={picked ? sectionId(picked.key) : "all"}
        className="flex flex-col gap-8 motion-safe:animate-[fade-in_150ms_ease-out] md:gap-10"
      >
        {picked
          ? section(picked, false)
          : groups.map((group) => section(group, groups.length > 1))}
      </div>
    </>
  );
};
