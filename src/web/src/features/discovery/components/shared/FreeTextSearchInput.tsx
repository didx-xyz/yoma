import React, { useState } from "react";
import { IoCloseCircleOutline, IoSearchOutline } from "react-icons/io5";

/**
 * The free-text (block 1) search input, shared by the filter panel and the Search-segment
 * popover: large rounded field with an explicit search button and — while it holds text — a
 * clear button. Commits on Enter, on the search button, and on blur; clearing commits `null`
 * immediately so the count and results react without a second step. The buttons preventDefault
 * on mousedown so clicking them doesn't blur-commit the draft first.
 */
export const FreeTextSearchInput: React.FC<{
  /** The committed value (usually `state.filters.q`) the draft starts from. */
  initial: string | null;
  onCommit: (q: string | null) => void;
  onFocusChange?: (focused: boolean) => void;
  autoFocus?: boolean;
}> = ({ initial, onCommit, onFocusChange, autoFocus = false }) => {
  const [draft, setDraft] = useState(initial ?? "");

  const commit = (value: string): void => {
    const q = value.trim() === "" ? null : value.trim();
    if (q !== initial) onCommit(q);
  };
  const keepFocus = (e: React.MouseEvent): void => e.preventDefault();

  return (
    <label className="input input-bordered flex h-11 w-full items-center gap-2 rounded-full">
      <IoSearchOutline className="text-gray-dark h-5 w-5 shrink-0" />
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => {
          onFocusChange?.(false);
          commit(draft);
        }}
        onKeyDown={(e) => e.key === "Enter" && commit(draft)}
        placeholder="Search titles, summaries and keywords…"
        className="min-w-0 grow"
        aria-label="Search opportunities"
        autoFocus={autoFocus}
      />
      {draft !== "" && (
        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={() => {
            setDraft("");
            commit("");
          }}
          aria-label="Clear search"
          className="text-gray-dark flex h-8 w-8 shrink-0 items-center justify-center hover:text-black"
        >
          <IoCloseCircleOutline className="h-5 w-5" />
        </button>
      )}
      <button
        type="button"
        onMouseDown={keepFocus}
        onClick={() => commit(draft)}
        aria-label="Search"
        className="bg-purple hover:bg-purple-shade -mr-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
      >
        <IoSearchOutline className="h-4 w-4" />
      </button>
    </label>
  );
};
