import React, { useState } from "react";
import { IoChevronDown, IoOptionsOutline } from "react-icons/io5";
import { CustomFieldFilters } from "~/components/Opportunity/CustomFieldFilters";
import { useOpportunityCustomFieldDefinitionsQuery } from "~/hooks/useOpportunityMutations";
import { useDiscovery } from "../../state/DiscoveryContext";
import { Message } from "../shared/Message";

/**
 * Block 5 — the type-conditional custom-field filters. Renders whatever the definitions endpoint
 * returns for the selected type, in the order returned (nothing sorted client-side, nothing keyed
 * to a specific field). The header matches the universal sections exactly (icon · label · summary
 * · badge · chevron); the FROM THIS TYPE badge alone marks that it appears and disappears with
 * the selected type. Clause editing reuses YOM-1260's `CustomFieldFilters` — the operator matrix
 * lives there, not here.
 */
export const TypeSpecificFilters: React.FC = () => {
  const { state, dispatch } = useDiscovery();
  // Collapsed by default, like every section — open only when clauses are already set.
  const [open, setOpen] = useState(() => state.filters.customFields.length > 0);
  const type = state.filters.type;

  // `types` binds the Type enum NAME — a GUID silently returns only generic definitions.
  const { data: definitions } = useOpportunityCustomFieldDefinitionsQuery(
    type ? [type] : null,
    { enabled: !!type },
  );

  if (!type || !definitions || definitions.length === 0) return null;

  const groups = [...new Set(definitions.map((d) => d.group ?? ""))].filter(
    Boolean,
  );
  const subGroups = [
    ...new Set(definitions.map((d) => d.subGroup ?? "")),
  ].filter(Boolean);
  const heading = groups.join(" · ") || `${type} details`;

  return (
    <section className="border-gray border-b py-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center gap-3 py-2 text-left"
      >
        <IoOptionsOutline className="text-gray-dark h-4 w-4 shrink-0" />
        {/* Title truncates on one line rather than wrapping; the badge never shrinks. */}
        <span className="min-w-0 truncate text-sm font-semibold whitespace-nowrap">
          {heading}
        </span>
        <span className="text-gray-dark hidden min-w-0 flex-1 truncate text-xs sm:block">
          {definitions.length} filters
          {subGroups.length > 0 && ` · ${subGroups.join(" · ")}`}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-2">
          <span className="bg-purple rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide whitespace-nowrap text-white">
            FROM THIS TYPE
          </span>
          <IoChevronDown
            className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 pb-3">
          <Message>
            These filters arrived with the {type} type. Change the type and they
            are replaced, not hidden.
          </Message>
          <CustomFieldFilters
            definitions={definitions}
            value={state.filters.customFields}
            onChange={(customFields) =>
              dispatch({ kind: "patchFilters", patch: { customFields } })
            }
          />
        </div>
      )}
    </section>
  );
};
