import React from "react";
import { useDiscovery } from "../../state/DiscoveryContext";
import { Message } from "../shared/Message";

/**
 * Block 5 — "What kind of opportunity?". Always open, single-select, drives block 6: choosing a
 * type reveals its own filters, and changing it clears the previous type's clauses (handled in
 * the reducer, not here). State carries the enum `name`; the label shows `displayName`.
 */
export const TypeRow: React.FC = () => {
  const { state, dispatch, lookups } = useDiscovery();

  return (
    <section>
      <h3 className="pb-2 text-sm font-semibold tracking-normal">
        What kind of opportunity?
      </h3>
      <div className="flex flex-wrap gap-2">
        {lookups.types.map((type) => {
          const active = state.filters.type === type.name;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() =>
                dispatch({ kind: "setType", type: active ? null : type.name })
              }
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
      <Message className="mt-2">Choosing one reveals its own filters.</Message>
    </section>
  );
};
