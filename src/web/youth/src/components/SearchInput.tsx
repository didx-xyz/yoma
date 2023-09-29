import { useState } from "react";
import { IoMdSearch } from "react-icons/io";

interface InputProps {
  defaultValue?: string | null;
  placeholder?: string | null;
  onSearch?: (query: string) => void;
}

export const SearchInput: React.FC<InputProps> = ({
  defaultValue,
  placeholder,
  onSearch,
}) => {
  const [searchInputValue, setSearchInputValue] = useState(defaultValue);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault(); // 👈️ prevent page refresh

    // trim whitespace
    const searchValue = searchInputValue?.trim() ?? "";

    if (onSearch) onSearch(searchValue);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="search flex">
        <input
          type="search"
          className="input input-bordered input-sm w-full rounded-br-none rounded-tr-none text-sm"
          placeholder={placeholder ?? "Search..."}
          autoComplete="off"
          value={searchInputValue ?? ""}
          onChange={(e) => setSearchInputValue(e.target.value)}
          onFocus={(e) => (e.target.placeholder = "")}
          onBlur={(e) => (e.target.placeholder = placeholder ?? "Search...")}
        />

        <button
          type="submit"
          aria-label="Search"
          className="btn-search btn btn-sm rounded-bl-none rounded-tl-none border-gray"
          onSubmit={handleSubmit}
        >
          <IoMdSearch className="icon-search h-6 w-6" />
        </button>
      </div>
    </form>
  );
};
