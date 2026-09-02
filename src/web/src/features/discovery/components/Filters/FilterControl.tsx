import React, { useState } from "react";
import { IoSearchOutline } from "react-icons/io5";
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
      className={`rounded-full border px-3 py-1.5 text-xs ${variant}`}
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

const Searchable: React.FC<{ model: SectionModel; placeholder: string }> = ({
  model,
  placeholder,
}) => {
  const [text, setText] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <label className="input input-bordered flex h-10 items-center gap-2">
        <IoSearchOutline className="text-gray-dark h-4 w-4" />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="grow"
        />
      </label>
      <ChipSet model={model} filterText={text} />
    </div>
  );
};

export const FilterControl: React.FC<{
  section: FilterSectionDef;
  model: SectionModel;
}> = ({ section, model }) => {
  if (section.binding === null) return <Message>{section.pendingNote}</Message>;

  switch (section.control) {
    case "chips":
    case "range":
      return <ChipSet model={model} />;
    case "country":
      return <Searchable model={model} placeholder="Search countries…" />;
    case "lookupSearch":
      return (
        <Searchable
          model={model}
          placeholder={`Search ${section.label.toLowerCase()}…`}
        />
      );
    case "gate":
      return <ChipSet model={model} />;
  }
};
