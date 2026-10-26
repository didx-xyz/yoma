import React from "react";
import { IoSearchOutline } from "react-icons/io5";
import { PillList } from "./PillList";

/**
 * The lookup-search blocks' shell (skills, languages): the rounded search field over one
 * wrapping row of pills — the picks first (`pinned`, never cut), then what the search offers
 * behind "Show all N" (`PillList`). Each block decides what the pills are; the shell only lays
 * them out.
 */
export const SearchShell: React.FC<{
  text: string;
  onChange: (text: string) => void;
  placeholder: string;
  pills: React.ReactElement[];
  pinned: number;
  /** The pills once "Show all" is open, when their order differs (`PillList`). */
  expanded?: React.ReactElement[];
}> = ({ text, onChange, placeholder, pills, pinned, expanded }) => (
  <div className="flex flex-col gap-3">
    <label className="input input-bordered flex h-11 items-center gap-2 rounded-full">
      <IoSearchOutline className="text-gray-dark h-4 w-4" />
      <input
        type="text"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="grow"
      />
    </label>
    <PillList pills={pills} pinned={(i) => i < pinned} expanded={expanded} />
  </div>
);
