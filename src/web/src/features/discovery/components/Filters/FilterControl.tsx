import React, { useState } from "react";
import { IoCloseCircleOutline, IoSearchOutline } from "react-icons/io5";
import type { FilterSectionDef } from "../../registry/filterSections";
import { Message } from "../shared/Message";
import type { SectionModel, SectionOption } from "./useSectionModel";

/**
 * The ONE kind→control switch. Every section on every breakpoint renders through here; a new
 * control kind is a new case, never a new component tree. Zero-count options grey out with the
 * count still visible — never hidden.
 */
const VISIBLE_BEFORE_SHOW_ALL = 8;

const OptionChip: React.FC<{
  option: SectionOption;
  active: boolean;
  onToggle: () => void;
}> = ({ option, active, onToggle }) => {
  const zero = option.count === 0;
  let variant = "border-gray hover:border-green bg-white text-black";
  if (active) variant = "border-green bg-green text-white";
  else if (zero) variant = "border-gray text-gray-dark bg-white opacity-50";
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={zero}
      // 44px on touch, the compact pill from md up.
      className={`flex min-h-11 items-center rounded-full border px-3 text-xs md:min-h-9 ${variant}`}
    >
      {option.label}
      {option.count !== null && (
        <span
          className={`ml-1 text-xs ${active ? "text-green-light" : "text-gray-dark"}`}
        >
          {option.count}
        </span>
      )}
    </button>
  );
};

const ChipSet: React.FC<{ model: SectionModel; filterText?: string }> = ({
  model,
  filterText,
}) => {
  const [showAll, setShowAll] = useState(false);
  const options = filterText
    ? model.options.filter((o) =>
        o.label.toLowerCase().includes(filterText.toLowerCase()),
      )
    : model.options;
  const visible = showAll ? options : options.slice(0, VISIBLE_BEFORE_SHOW_ALL);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((option) => (
        <OptionChip
          key={option.id}
          option={option}
          active={model.selected.includes(option.id)}
          onToggle={() => model.toggle(option.id)}
        />
      ))}
      {!showAll && options.length > VISIBLE_BEFORE_SHOW_ALL && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-green text-xs font-semibold underline"
        >
          Show all {options.length}
        </button>
      )}
    </div>
  );
};

const Searchable: React.FC<{
  model: SectionModel;
  placeholder: string;
  /** Popover home renders the big rounded input (like block 1); sections keep the compact one. */
  large?: boolean;
}> = ({ model, placeholder, large = false }) => {
  const [text, setText] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <label
        className={`input input-bordered flex w-full items-center gap-2 ${
          large ? "h-11 rounded-full" : "h-11 md:h-10"
        }`}
      >
        <IoSearchOutline
          className={`text-gray-dark ${large ? "h-5 w-5" : "h-4 w-4"}`}
        />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 grow"
        />
        {text !== "" && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setText("")}
            aria-label="Clear search"
            className="text-gray-dark flex h-8 w-8 shrink-0 items-center justify-center hover:text-black"
          >
            <IoCloseCircleOutline className="h-4 w-4" />
          </button>
        )}
      </label>
      <ChipSet model={model} filterText={text} />
    </div>
  );
};

export const FilterControl: React.FC<{
  section: FilterSectionDef;
  model: SectionModel;
  /** True in the standalone popover home — search inputs render large there. */
  largeSearch?: boolean;
  /** Retry the lookup behind this section (only used by the `failed` state). */
  onRetry?: () => void;
}> = ({ section, model, largeSearch = false, onRetry }) => {
  if (section.binding === null) return <Message>{section.pendingNote}</Message>;

  // The lookup's state is reported HERE, in the section it feeds — never as a banner over the
  // results: one dead facet behind "More filters" must not put a red bar across a working page.
  // `unavailable` is a 404 — this API build does not serve the facet, a fact about the
  // environment rather than a fault. `failed` is a fault, and offers the retry.
  if (model.status === "unavailable")
    return <Message>Not available from this API yet.</Message>;
  if (model.status === "failed")
    return (
      <Message kind="error">
        Couldn&apos;t load these options.{" "}
        <button
          type="button"
          onClick={onRetry}
          className="font-semibold underline"
        >
          Retry
        </button>
      </Message>
    );

  switch (section.control) {
    case "chips":
    case "range":
      return <ChipSet model={model} />;
    case "country":
      return (
        <Searchable
          model={model}
          placeholder="Search countries…"
          large={largeSearch}
        />
      );
    case "lookupSearch":
      return (
        <Searchable
          model={model}
          placeholder={`Search ${section.label.toLowerCase()}…`}
          large={largeSearch}
        />
      );
    case "gate":
      return <ChipSet model={model} />;
  }
};
