import React, { useState } from "react";
import { IoCloseCircleOutline, IoSearchOutline } from "react-icons/io5";
import type { FilterSectionDef } from "../../registry/filterSections";
import { Message } from "../shared/Message";
import type { SectionModel, SectionOption } from "./useSectionModel";
import { WhereControl } from "./WhereControl";

/**
 * The ONE kind→control switch. Every section on every breakpoint renders through here; a new
 * control kind is a new case, never a new component tree. Zero-count options grey out with the
 * count still visible — never hidden. "Show all N" is data-driven from the option count, so a
 * lookup that grows (ten categories to sixteen) changes nothing here.
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
  // A selected option is never hidden behind "Show all N": pick Kenya from a search, clear the
  // search, and Kenya must still be on screen (and deselectable) — otherwise the chips say one
  // country while the search, the segment and the Where section say two. Selected options past
  // the cut keep their lookup order, so nothing jumps under the cursor when it is picked.
  const visible = showAll
    ? options
    : options.filter(
        (o, i) => i < VISIBLE_BEFORE_SHOW_ALL || model.selected.includes(o.id),
      );
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
      {!showAll && options.length > visible.length && (
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

const SearchInput: React.FC<{
  text: string;
  onChange: (text: string) => void;
  placeholder: string;
  large: boolean;
}> = ({ text, onChange, placeholder, large }) => (
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
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="min-w-0 grow"
    />
    {text !== "" && (
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange("")}
        aria-label="Clear search"
        className="text-gray-dark flex h-8 w-8 shrink-0 items-center justify-center hover:text-black"
      >
        <IoCloseCircleOutline className="h-4 w-4" />
      </button>
    )}
  </label>
);

const Searchable: React.FC<{
  model: SectionModel;
  placeholder: string;
  /** Popover home renders the big rounded input (like block 1); sections keep the compact one. */
  large?: boolean;
}> = ({ model, placeholder, large = false }) => {
  const [text, setText] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <SearchInput
        text={text}
        onChange={setText}
        placeholder={placeholder}
        large={large}
      />
      <ChipSet model={model} filterText={text} />
    </div>
  );
};

/**
 * One free-text value — the Provider control (2026-09-29, the Provider field). Committed on
 * Enter or blur, never per keystroke, so the count does not refetch on every letter; clearing
 * commits at once. Remounted on the committed value (`key`), so removing its chip empties it.
 */
const TextFilter: React.FC<{
  value: string | null;
  onCommit: (value: string | null) => void;
  placeholder: string;
  large: boolean;
}> = ({ value, onCommit, placeholder, large }) => {
  const [text, setText] = useState(value ?? "");
  const commit = (next: string): void => {
    const trimmed = next.trim() === "" ? null : next.trim();
    if (trimmed !== value) onCommit(trimmed);
  };
  return (
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
        onBlur={() => commit(text)}
        onKeyDown={(e) => e.key === "Enter" && commit(text)}
        placeholder={placeholder}
        className="min-w-0 grow"
      />
      {text !== "" && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setText("");
            commit("");
          }}
          aria-label="Clear"
          className="text-gray-dark flex h-8 w-8 shrink-0 items-center justify-center hover:text-black"
        >
          <IoCloseCircleOutline className="h-4 w-4" />
        </button>
      )}
    </label>
  );
};

/**
 * Paid and rewards: Paid or rewarded / Unpaid (`incentivized`) above the ZLTO reward chips —
 * two facets, one section. When the section model withholds the ZLTO options (Type includes
 * Job) its notice takes their place; the Paid half stays, since a Job can pay.
 */
const Rewards: React.FC<{ model: SectionModel }> = ({ model }) => (
  <div className="flex flex-col gap-3">
    {model.secondary && (
      <div className="flex flex-col gap-2">
        <span className="text-gray-dark text-[11px] font-semibold tracking-wide uppercase">
          Paid
        </span>
        <ChipSet model={model.secondary} />
      </div>
    )}
    <div className="flex flex-col gap-2">
      <span className="text-gray-dark text-[11px] font-semibold tracking-wide uppercase">
        ZLTO reward
      </span>
      {model.notice ? (
        <Message>{model.notice}</Message>
      ) : (
        <ChipSet model={model} />
      )}
    </div>
  </div>
);

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
      // The facet lists carry only values published opportunities use, so a new facet (SDGs,
      // accommodations) is empty until opportunities are tagged — say so, not a blank panel.
      return model.options.length === 0 && model.status === "ok" ? (
        <Message>No opportunities list any of these yet.</Message>
      ) : (
        <ChipSet model={model} />
      );
    case "location":
      return (
        <div className="flex flex-col gap-4">
          <Searchable
            model={model}
            placeholder="Search countries…"
            large={largeSearch}
          />
          <WhereControl />
        </div>
      );
    case "lookupSearch":
      return (
        <Searchable
          model={model}
          placeholder={`Search ${section.label.toLowerCase()}…`}
          large={largeSearch}
        />
      );
    case "text":
      return model.text ? (
        <TextFilter
          key={model.text.value ?? ""}
          value={model.text.value}
          onCommit={model.text.commit}
          placeholder={`Type a ${section.label.toLowerCase()} name…`}
          large={largeSearch}
        />
      ) : null;
    case "rewards":
      return <Rewards model={model} />;
  }
};
