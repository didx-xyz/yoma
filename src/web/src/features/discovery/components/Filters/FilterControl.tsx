import React, { useState } from "react";
import {
  IoClose,
  IoCloseCircleOutline,
  IoSearchOutline,
} from "react-icons/io5";
import type {
  FilterSectionDef,
  ReservedInput,
} from "../../registry/filterSections";
import { Message } from "../shared/Message";
import type { SectionModel, SectionOption } from "./useSectionModel";

/**
 * The ONE kind→control switch. Every section on every breakpoint renders through here; a new
 * control kind is a new case, never a new component tree. Zero-count options grey out with the
 * count still visible — never hidden. "Show all N" is data-driven from the option count, so a
 * lookup that grows (ten categories to sixteen) changes nothing here.
 */
const VISIBLE_BEFORE_SHOW_ALL = 8;
const TYPEAHEAD_SUGGESTIONS = 8;

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
 * Free text with suggestions — the Provider control (2026-09-22). Nothing is listed until the
 * youth types; then up to eight names matching ANYWHERE in the text appear, and picking one adds
 * it as a removable chip above the input. The full organisation list is never drawn: partners
 * number in the hundreds and a wall of chips is not a type-ahead.
 */
const Typeahead: React.FC<{
  model: SectionModel;
  placeholder: string;
  large?: boolean;
}> = ({ model, placeholder, large = false }) => {
  const [text, setText] = useState("");
  const needle = text.trim().toLowerCase();
  const suggestions =
    needle === ""
      ? []
      : model.options
          .filter(
            (o) =>
              !model.selected.includes(o.id) &&
              o.label.toLowerCase().includes(needle),
          )
          .slice(0, TYPEAHEAD_SUGGESTIONS);
  const chosen = model.selected
    .map((id) => model.options.find((o) => o.id === id))
    .filter((o): o is SectionOption => !!o);

  return (
    <div className="flex flex-col gap-3">
      {chosen.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chosen.map((option) => (
            <span
              key={option.id}
              className="bg-green-light text-green inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-xs"
            >
              {option.label}
              <button
                type="button"
                onClick={() => model.toggle(option.id)}
                aria-label={`Remove ${option.label}`}
                className="-mr-2 flex h-9 w-9 items-center justify-center"
              >
                <IoClose className="h-4 w-4" />
              </button>
            </span>
          ))}
        </div>
      )}
      <SearchInput
        text={text}
        onChange={setText}
        placeholder={placeholder}
        large={large}
      />
      {needle !== "" &&
        (suggestions.length > 0 ? (
          <ul className="border-gray divide-gray flex flex-col divide-y rounded-xl border">
            {suggestions.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => {
                    model.toggle(option.id);
                    setText("");
                  }}
                  className="hover:bg-gray-light flex min-h-11 w-full items-center px-3 text-left text-sm"
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-dark text-xs">No providers match.</p>
        ))}
    </div>
  );
};

/** Disabled inputs holding the place of facets that arrive with a later API. */
const ReservedInputs: React.FC<{ inputs: ReservedInput[]; note: string }> = ({
  inputs,
  note,
}) => (
  <div className="flex flex-col gap-2">
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {inputs.map((input) => (
        <label key={input.label} className="flex flex-col gap-1">
          <span className="text-gray-dark text-[11px] font-semibold tracking-wide uppercase">
            {input.label}
          </span>
          <input
            type="text"
            disabled
            aria-disabled
            placeholder={input.placeholder}
            title={note}
            className="input input-bordered h-10 w-full disabled:opacity-60"
          />
        </label>
      ))}
    </div>
    <Message>{note}</Message>
  </div>
);

/**
 * Paid and rewards: the Paid half is drawn inert (no Is Paid field on the API yet) above the ZLTO
 * half, which filters today. When the section model withholds the ZLTO options (Type includes
 * Job) its notice takes their place.
 */
const Rewards: React.FC<{
  model: SectionModel;
  pendingNote: string | null;
}> = ({ model, pendingNote }) => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-col gap-2">
      <span className="text-gray-dark text-[11px] font-semibold tracking-wide uppercase">
        Paid
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {["Paid", "Not paid"].map((label) => (
          <button
            key={label}
            type="button"
            disabled
            aria-disabled
            className="border-gray text-gray-dark flex min-h-11 items-center rounded-full border bg-white px-3 text-xs opacity-50 md:min-h-9"
          >
            {label}
          </button>
        ))}
      </div>
      {pendingNote && <Message>{pendingNote}</Message>}
    </div>
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
      return <ChipSet model={model} />;
    case "country":
      return (
        <div className="flex flex-col gap-3">
          <Searchable
            model={model}
            placeholder="Search countries…"
            large={largeSearch}
          />
          {section.reserved && (
            <ReservedInputs
              inputs={section.reserved.inputs}
              note={section.reserved.note}
            />
          )}
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
    case "typeahead":
      return (
        <Typeahead
          model={model}
          placeholder={`Type a ${section.label.toLowerCase()} name…`}
          large={largeSearch}
        />
      );
    case "rewards":
      return <Rewards model={model} pendingNote={section.pendingNote} />;
    case "gate":
      return <ChipSet model={model} />;
  }
};
