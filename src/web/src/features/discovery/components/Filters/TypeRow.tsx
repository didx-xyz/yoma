import React from "react";
import { IoShapesOutline } from "react-icons/io5";
import {
  TYPE_ROW_HINT,
  TYPE_ROW_QUESTION,
} from "../../registry/filterSections";
import { useDiscovery } from "../../state/DiscoveryContext";
import { Message } from "../shared/Message";
import { SectionHeader } from "./SectionHeader";

/**
 * Block 5 — the opportunity type. Always open (no collapse chrome), but dressed like the
 * universal sections — same header, same value column, same divider — so the panel reads as one
 * list of nouns: the header is "Type" and the QUESTION is its subtitle. (A header that asked
 * "What type of opportunity?" while its neighbours said "Where" and "How long" was the only one
 * speaking a different grammar; the question still titles the popover, where it is the only
 * label on screen.) Multi-select, and it drives block 6: every selected type reveals its own
 * filters, and deselecting one clears the type-scoped clauses (handled in the reducer, not
 * here). Provenance-aware like every other control: selection shows the EFFECTIVE types, and
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

  const selected = effectiveFilters.types
    .map((name) => lookups.types.find((t) => t.name === name)?.displayName)
    .filter((label): label is string => !!label);

  return (
    <section className={hideHeader ? "" : "border-gray border-b py-1"}>
      {!hideHeader && (
        <SectionHeader
          icon={IoShapesOutline}
          label="Type"
          value={selected.length > 0 ? selected.join(" · ") : "Any type"}
          subtitle={`${TYPE_ROW_QUESTION} ${TYPE_ROW_HINT}`}
          expanded={null}
        />
      )}
      <div className="flex flex-col gap-2 pb-3">
        {/* In the popover the question IS the title, so only the hint is left to say. */}
        {hideHeader && (
          <p className="text-gray-dark text-[13px] leading-snug">
            {TYPE_ROW_HINT}
          </p>
        )}
        {lookups.typesFailed ? (
          <Message kind="error">
            Couldn&apos;t load opportunity types.{" "}
            <button
              type="button"
              onClick={lookups.retry}
              className="font-semibold underline"
            >
              Retry
            </button>
          </Message>
        ) : (
          <div className="flex flex-wrap gap-2">
            {lookups.types.map((type) => {
              const active = effectiveFilters.types.includes(type.name);
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => toggle(type.name)}
                  className={`flex min-h-11 items-center rounded-full border px-3 text-xs font-semibold md:min-h-9 ${
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
        )}
      </div>
    </section>
  );
};
