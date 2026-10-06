import React, { useEffect, useRef } from "react";
import {
  IoArrowForward,
  IoBriefcaseOutline,
  IoClose,
  IoEllipsisHorizontal,
  IoHeartOutline,
  IoPeopleOutline,
  IoRocketOutline,
  IoSchoolOutline,
  IoSparklesOutline,
} from "react-icons/io5";
import { formatNumber } from "../../lib/format";
import { useCountUp } from "../../state/useCountUp";
import { useDiscovery } from "../../state/DiscoveryContext";
import { QuickSearchRow } from "../Discover/QuickSearchRow";
import { typeBadgeClass } from "../Results/typeBadge";

/** Type-tile icons by Opportunity Type enum name — presentation only, as `typeBadge.ts`. */
const TYPE_ICONS: Record<string, React.ElementType> = {
  Job: IoBriefcaseOutline,
  Learning: IoSchoolOutline,
  ImpactAction: IoHeartOutline,
  Event: IoPeopleOutline,
  Entrepreneurship: IoRocketOutline,
  Other: IoEllipsisHorizontal,
};

/**
 * The entrance (round 10): each item rises 8px and fades in — the left column 60ms apart, then
 * the right column's tiles and quick searches 40ms apart from 200ms. Nothing moves under reduced
 * motion: the classes are `motion-safe:` only, and the dialog itself just fades.
 */
const RISE_IN = "motion-safe:animate-rise-in";
const leftDelay = (i: number): React.CSSProperties => ({
  animationDelay: `${i * 60}ms`,
});
const rightDelay = (i: number): React.CSSProperties => ({
  animationDelay: `${200 + i * 40}ms`,
});
/** Get started's halo swells once, about 1.2s after the last entrance item lands. */
const HALO_DELAY = { animationDelay: "2100ms" };

/*
 * Height tiers from lg (round 10 follow-ups, F1): the step takes its content's height and must
 * not scroll on a desktop window down to 560px tall. T1 `lg:[@media(max-height:680px)]:` trims
 * whitespace (the scroller padding and the gaps); T2 `lg:[@media(max-height:600px)]:` trims sizes
 * (count, gold line, tip, Get started, panel padding, tiles). The ranges overlap and Tailwind does
 * not order two arbitrary media variants, so NO property is set by both tiers.
 */

/**
 * The count figure, counted up by `useCountUp`. Its own component so the tween's ~55 frames
 * re-render this paragraph only, not the whole step.
 */
const CountFigure: React.FC<{ count: number | null }> = ({ count }) => {
  const shown = useCountUp(count);
  return (
    <p className="font-nunito grid text-[64px] leading-none font-black tracking-[-0.045em] tabular-nums lg:text-[104px] lg:[@media(max-height:600px)]:text-[84px]">
      {count === null || shown === null ? (
        "…"
      ) : (
        <>
          {/* The final figure, invisible, holds the width: counting up never shifts the LIVE
              dot. */}
          <span className="invisible col-start-1 row-start-1">
            {formatNumber(count)}
          </span>
          <span className="col-start-1 row-start-1">{formatNumber(shown)}</span>
        </>
      )}
    </p>
  );
};

/**
 * The first-visit welcome — step 0 of the preferences dialog (round 7, artboard 7c, 2026-09-30;
 * re-laid out in round 10, 2026-10-02). Shown whenever the dialog opens and the wizard has never
 * been completed (no preferences saved; anonymous: none in the session) — "Browse on my own" and
 * the close button do not complete it.
 *
 * Left: the dialog's own live count (the same query as `LiveCountPanel` — no new request), counted
 * up once by `useCountUp`, Jason's welcome copy, Get started (→ step 1 of 6) and Browse on my own
 * (closes). Right, "Or jump straight in": type tiles and the shipped quick searches — each tap
 * applies that filter through the existing actions and closes the dialog. The category pills were
 * taken out on 2026-10-02 (Jason): expanding them scrolled the whole dialog. They stay in the
 * discovery header.
 *
 * Two columns from `lg`, the right one an inset panel; below `lg` one column above the pinned
 * buttons. From md the dialog takes the content's height; the content scrolls only on a window
 * shorter than that (on desktop, below about 500px). The tiles take the discovery cards' type
 * colours (`typeBadge.ts`), not the detail header's.
 *
 * Type tiles carry no counts and the quick searches none either: the API has no per-type count,
 * and a request per tile is exactly what the no-fan-out rule forbids.
 */
export const WelcomeStep: React.FC<{
  count: number | null;
  counting: boolean;
  onGetStarted: () => void;
  onBrowse: () => void;
  /** A jump-in tap: the filter is applied, the dialog closes. */
  onPicked: () => void;
  /**
   * Get started was pressed and step 1 follows in 100ms: the content fades out and nothing in
   * it can be pressed again (F2).
   */
  leaving?: boolean;
}> = ({
  count,
  counting,
  onGetStarted,
  onBrowse,
  onPicked,
  leaving = false,
}) => {
  const { state, dispatch, lookups } = useDiscovery();

  // F4: keyboard users start inside the welcome, not in the page behind it. Get started has
  // two homes (the left column from lg, the pinned footer below it); the displayed one takes
  // focus, once, when the welcome opens. Its ring shows only if the user got here by keyboard
  // (whatever had focus before showed a ring): left to itself, Chrome rings a dialog's
  // auto-focused button on a fresh page load, which mouse users would see too.
  const columnGetStarted = useRef<HTMLButtonElement>(null);
  const footerGetStarted = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    // Never pull focus out of a field the youth is typing in (the hero search, say): a text
    // field always matches :focus-visible, so Get started would ring and the next Space press it.
    if (
      previous instanceof HTMLElement &&
      (previous.isContentEditable ||
        previous.matches("input, textarea, select"))
    )
      return;
    // `focusVisible` postdates this TypeScript's DOM types; a browser without it ignores it
    const options: FocusOptions & { focusVisible?: boolean } = {
      preventScroll: true,
      focusVisible:
        previous instanceof HTMLElement &&
        previous !== document.body &&
        previous.matches(":focus-visible"),
    };
    [columnGetStarted.current, footerGetStarted.current]
      .find((button) => button?.offsetParent)
      ?.focus(options);
  }, []);

  const pickType = (name: string): void => {
    // Apply, never toggle off: a tile means "show me these".
    if (!state.filters.types.includes(name))
      dispatch({ kind: "toggleType", name });
    onPicked();
  };

  const actions = (getStartedRef: React.Ref<HTMLButtonElement>) => (
    <div
      className={`flex flex-wrap items-center gap-x-6 gap-y-3 ${RISE_IN}`}
      style={leftDelay(5)}
    >
      <button
        ref={getStartedRef}
        type="button"
        onClick={onGetStarted}
        className="btn bg-orange hover:bg-orange/90 text-purple motion-safe:animate-halo min-h-[54px] rounded-full border-none px-7 text-base font-semibold shadow-[0_0_0_6px_color-mix(in_srgb,var(--color-orange)_22%,transparent)] lg:[@media(max-height:600px)]:min-h-12"
        style={HALO_DELAY}
      >
        Get started <IoArrowForward className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onBrowse}
        className="text-sm font-semibold text-white underline underline-offset-4"
      >
        Browse on my own
      </button>
    </div>
  );

  // Two homes, one shown per breakpoint (as `actions`): the dialog's corner below lg, the right
  // panel's from lg.
  const closeButton = (position: string): React.ReactNode => (
    <button
      type="button"
      onClick={onBrowse}
      aria-label="Close personalization"
      className={`${position} h-11 w-11 items-center justify-center rounded-full hover:bg-white/10`}
    >
      <IoClose className="h-5 w-5" />
    </button>
  );

  return (
    // min-h-0 + grow, not h-full: from md the frame takes its content's height under a max-height,
    // and a percentage height would not resolve against that cap (F1)
    <div
      inert={leaving}
      className={`bg-purple relative flex min-h-0 w-full grow flex-col overflow-hidden text-white md:rounded-2xl ${
        leaving
          ? "animate-[fade-out_100ms_ease-in_both]"
          : "motion-safe:animate-welcome-in motion-reduce:animate-[fade-in_150ms_ease-out_both]"
      }`}
    >
      {/* Two soft orbs drifting behind the content — decorative; static under reduced motion */}
      <div
        aria-hidden
        className="bg-orange/[0.13] motion-safe:animate-drift pointer-events-none absolute -top-[120px] -right-[120px] z-0 h-[420px] w-[420px] rounded-full blur-3xl"
      />
      <div
        aria-hidden
        className="bg-green/[0.22] motion-safe:animate-drift pointer-events-none absolute -bottom-[120px] -left-[120px] z-0 h-[360px] w-[360px] rounded-full blur-3xl"
        style={{ animationDirection: "alternate-reverse" }}
      />

      {/* Below lg: pinned to the dialog, above the content layer */}
      {closeButton("absolute top-3 right-3 z-20 flex lg:hidden")}

      <div className="relative z-10 min-h-0 grow overflow-y-auto p-5 md:p-8 lg:pt-10 lg:pr-10 lg:pb-10 lg:pl-12 lg:[@media(max-height:680px)]:pt-8 lg:[@media(max-height:680px)]:pb-8">
        {/* The right column's 448px floor keeps three type tiles ≥128px wide, so no label
            truncates; at 1024 the left column gives way instead. min-h, not h: on a short
            window the grid grows past the box, so the bottom padding still clears Get started. */}
        <div className="flex flex-col gap-6 lg:grid lg:min-h-full lg:grid-cols-[minmax(0,500px)_minmax(448px,1fr)] lg:gap-9">
          {/* LEFT — the welcome; everything below the badge centres in the column */}
          <div className="flex flex-col gap-4 lg:[@media(max-height:680px)]:gap-3">
            <span
              className={`bg-orange/20 flex w-fit items-center gap-2 rounded-full py-1 pr-3 pl-1 text-[10px] font-bold tracking-widest uppercase ${RISE_IN}`}
              style={leftDelay(0)}
            >
              <span className="bg-orange text-purple rounded-full px-2 text-[10px] font-black">
                New
              </span>
              <span className="text-orange">Yoma search</span>
            </span>
            <div className="flex grow flex-col justify-center gap-4 lg:[@media(max-height:680px)]:gap-3">
              <div
                className={`transition duration-300 motion-reduce:transition-none ${
                  counting ? "opacity-70 blur-[3px]" : ""
                }`}
              >
                <div
                  className={`flex items-baseline gap-3 ${RISE_IN}`}
                  style={leftDelay(1)}
                >
                  <CountFigure count={count} />
                  {count !== null && (
                    <span className="text-green-dark inline-flex items-baseline gap-1.5 text-[11px] font-extrabold tracking-widest uppercase">
                      <span className="bg-green-dark ring-green-dark/25 h-2 w-2 shrink-0 rounded-full ring-4" />
                      Live
                    </span>
                  )}
                </div>
                <p
                  className={`text-orange font-nunito text-xl leading-tight font-black lg:text-[34px] lg:[@media(max-height:600px)]:text-[28px] ${RISE_IN}`}
                  style={leftDelay(2)}
                >
                  opportunities are waiting for you.
                </p>
              </div>
              <p
                className={`text-purple-soft text-sm md:text-base ${RISE_IN}`}
                style={leftDelay(3)}
              >
                Jobs, learning, impact actions, events and programmes to start a
                business — all in one place.
              </p>
              <div
                className={`flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 p-4 text-sm lg:[@media(max-height:600px)]:py-3 ${RISE_IN}`}
                style={leftDelay(4)}
              >
                <IoSparklesOutline className="text-orange mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  <span className="font-bold">Don&apos;t be overwhelmed!</span>{" "}
                  Tap &quot;Get started&quot; to choose your preferences and
                  narrow down your feed. Every step is optional.
                </p>
              </div>
              <div className="hidden lg:block">{actions(columnGetStarted)}</div>
            </div>
          </div>

          {/* RIGHT — or jump straight in; from lg an inset panel, its content centred like the
              left column's, with the × in its corner (it scrolls with the panel on a short
              window instead of floating over the tiles) */}
          <div className="flex min-w-0 flex-col gap-4 lg:relative lg:justify-center lg:rounded-[20px] lg:border lg:border-white/[0.12] lg:bg-white/[0.06] lg:p-6 lg:[@media(max-height:600px)]:p-5 lg:[@media(max-height:680px)]:gap-3">
            {closeButton("absolute top-3 right-3 z-10 hidden lg:flex")}
            <p className="flex items-center gap-3 pr-10 text-xs font-bold tracking-widest uppercase">
              Or jump straight in
              <span className="h-px grow bg-white/20" />
            </p>
            <div>
              <p className="text-purple-soft pb-2 text-[10px] font-bold tracking-widest uppercase md:text-xs">
                Pick a type
              </p>
              <div className="grid grid-cols-3 gap-2">
                {lookups.types.map((type, i) => {
                  const Icon = TYPE_ICONS[type.name] ?? IoEllipsisHorizontal;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => pickType(type.name)}
                      className={`hover:border-orange focus-visible:border-orange flex h-[66px] flex-col items-center justify-center gap-1.5 rounded-xl border border-white/[0.12] bg-white/[0.08] px-1 transition-[background-color,border-color,scale] duration-120 hover:bg-white/[0.14] focus-visible:bg-white/[0.14] active:scale-[0.98] active:duration-80 motion-reduce:transition-none motion-reduce:active:scale-100 max-[359px]:px-0.5 lg:h-[76px] lg:[@media(max-height:600px)]:h-[66px] ${RISE_IN}`}
                      style={rightDelay(i)}
                    >
                      {/* The inset ring keeps Job's purple square visible on the purple dialog */}
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-white/25 ring-inset lg:h-8 lg:w-8 ${typeBadgeClass(type.name)}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      {/* Below 360px a smaller, tighter label: "Entrepreneurship" fits its tile */}
                      <span className="font-nunito text-[11px] leading-tight font-bold whitespace-nowrap max-[359px]:text-[10px] max-[359px]:tracking-tight lg:text-[13px]">
                        {type.displayName || type.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-purple-soft pb-2 text-[10px] font-bold tracking-widest uppercase md:text-xs">
                Quick searches
              </p>
              {/* One entrance step for the row: its pills are QuickSearchRow's own buttons */}
              <div className={RISE_IN} style={rightDelay(lookups.types.length)}>
                <QuickSearchRow grid onPick={onPicked} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Below lg: the two buttons stick to the bottom */}
      <div className="relative z-10 border-t border-white/10 p-4 lg:hidden">
        {actions(footerGetStarted)}
      </div>
    </div>
  );
};
