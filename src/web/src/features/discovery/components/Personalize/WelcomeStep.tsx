import React from "react";
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
import { useDiscovery } from "../../state/DiscoveryContext";
import { QuickSearchRow } from "../Discover/QuickSearchRow";

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
 * The first-visit welcome — step 0 of the preferences dialog (round 7, artboard 7c, 2026-09-30).
 * Shown whenever the dialog opens and the wizard has never been completed (no preferences saved;
 * anonymous: none in the session) — "Browse on my own" and the close button do not complete it.
 *
 * Left: the dialog's own live count (the same query as `LiveCountPanel` — no new request), Jason's
 * welcome copy, Get started (→ step 1 of 6) and Browse on my own (closes). Right, "Or jump straight
 * in": type tiles and the shipped quick searches — each tap applies that filter through the
 * existing actions and closes the dialog. The category pills were taken out on 2026-10-02 (Jason):
 * expanding them scrolled the whole dialog. They stay in the discovery header.
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
}> = ({ count, counting, onGetStarted, onBrowse, onPicked }) => {
  const { state, dispatch, lookups } = useDiscovery();

  const pickType = (name: string): void => {
    // Apply, never toggle off: a tile means "show me these".
    if (!state.filters.types.includes(name))
      dispatch({ kind: "toggleType", name });
    onPicked();
  };

  const actions = (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <button
        type="button"
        onClick={onGetStarted}
        className="btn bg-orange hover:bg-orange/90 text-purple min-h-12 rounded-xl border-none px-6 text-base font-semibold"
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

  return (
    <div className="bg-purple relative flex h-full w-full flex-col overflow-hidden text-white md:rounded-2xl">
      <button
        type="button"
        onClick={onBrowse}
        aria-label="Close personalization"
        className="absolute top-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"
      >
        <IoClose className="h-5 w-5" />
      </button>

      <div className="min-h-0 grow overflow-y-auto p-5 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          {/* LEFT — the welcome */}
          <div className="flex flex-col gap-4 md:basis-1/2">
            <span className="bg-orange/20 text-orange w-fit rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase">
              Welcome to the new Yoma search
            </span>
            <div
              className={`transition duration-300 motion-reduce:transition-none ${
                counting ? "opacity-70 blur-[3px]" : ""
              }`}
            >
              <p className="text-5xl font-bold md:text-6xl">
                {count !== null ? formatNumber(count) : "…"}
              </p>
              <p className="text-orange text-xl font-bold md:text-2xl">
                opportunities we&apos;ve already found for you.
              </p>
            </div>
            <p className="text-purple-soft text-sm md:text-base">
              Everything from jobs and learning courses to making friends at
              social events. You can save your preferences or filter your
              results any time.
            </p>
            <div className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 p-4 text-sm">
              <IoSparklesOutline className="text-orange mt-0.5 h-5 w-5 shrink-0" />
              <p>
                <span className="font-bold">Don&apos;t be overwhelmed!</span>{" "}
                Click &quot;Get started&quot; to choose your preferences and
                narrow down your feed.
              </p>
            </div>
            <div className="hidden md:block">{actions}</div>
          </div>

          {/* RIGHT — or jump straight in */}
          <div className="flex min-w-0 flex-col gap-4 md:basis-1/2">
            <p className="flex items-center gap-3 pr-10 text-xs font-bold tracking-widest uppercase">
              Or jump straight in
              <span className="h-px grow bg-white/20" />
            </p>
            <div>
              <p className="text-purple-soft pb-2 text-[10px] font-bold tracking-widest uppercase md:text-xs">
                By type
              </p>
              {/* Mobile: one sideways row; desktop: tiles wrap */}
              <div
                className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible"
                // inline: the global unlayered `* { scrollbar-width: thin }` outranks utilities
                style={{ scrollbarWidth: "none" }}
              >
                {lookups.types.map((type) => {
                  const Icon = TYPE_ICONS[type.name] ?? IoEllipsisHorizontal;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => pickType(type.name)}
                      className="flex min-h-16 min-w-24 shrink-0 flex-col items-start justify-between gap-2 rounded-xl border border-white/20 bg-white/10 p-3 text-left text-sm font-semibold hover:bg-white/20"
                    >
                      <Icon className="text-orange h-5 w-5" />
                      {type.displayName || type.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-purple-soft pb-2 text-[10px] font-bold tracking-widest uppercase md:text-xs">
                Quick searches
              </p>
              <div className="md:hidden">
                <QuickSearchRow wrap={false} onPick={onPicked} />
              </div>
              <div className="hidden md:block">
                <QuickSearchRow onPick={onPicked} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: the two buttons stick to the bottom */}
      <div className="border-t border-white/10 p-4 md:hidden">{actions}</div>
    </div>
  );
};
