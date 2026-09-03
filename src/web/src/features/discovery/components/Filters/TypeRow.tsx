import React from "react";
import { IoShapesOutline } from "react-icons/io5";
import { useDiscovery } from "../../state/DiscoveryContext";
import { Message } from "../shared/Message";

/**
 * Block 5 — "What type of opportunity?". Always open (no collapse chrome), but dressed like the
 * universal sections — same icon-and-label header, same divider — so the panel reads as one
 * list. Multi-select, and it drives block 6: every selected type reveals its own filters, and
 * deselecting one clears the type-scoped clauses (handled in the reducer, not here).
 * Provenance-aware like every other control: selection shows the EFFECTIVE types, and
 * deselecting the inherited one skips the Goal preference for this search — the same semantics
 * as removing its chip. State carries the enum `name`; the label shows `displayName`.
 */
export const TypeRow: React.FC<{
  /** The popover supplies its own question title — skip the section header and divider. */
  hideHeader?: boolean;
}> = ({ hideHeader = false }) => {
  const {
    state,
    dispatch,
    lookups,
    effectiveFilters,
    fragments,
    skipPreference,
  } = useDiscovery();

  const toggle = (name: string): void => {
    if (state.filters.types.includes(name)) {
      dispatch({ kind: "toggleType", name });
      return;
    }
    const inherited =
      effectiveFilters.types.includes(name) &&
      fragments.goal?.types?.includes(name);
    if (inherited) skipPreference("goal");
    else dispatch({ kind: "toggleType", name });
  };

  return (
    <section className={hideHeader ? "" : "border-gray border-b py-1"}>
      {!hideHeader && (
        <div className="flex min-h-11 w-full items-center gap-3 py-2">
          <IoShapesOutline className="text-gray-dark h-4 w-4 shrink-0" />
          <h3 className="text-sm font-semibold tracking-normal">
            What type of opportunity?
          </h3>
        </div>
      )}
      <div className="flex flex-col gap-2 pb-3">
        <div className="flex flex-wrap gap-2">
          {lookups.types.map((type) => {
            const active = effectiveFilters.types.includes(type.name);
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => toggle(type.name)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "border-purple bg-purple text-white"
                    : "border-gray hover:border-purple bg-white text-black"
                }`}
              >
                {type.displayName}
              </button>
            );
          })}
        </div>
        <Message>Pick one or more — each type adds its own filters.</Message>
      </div>
    </section>
  );
};
