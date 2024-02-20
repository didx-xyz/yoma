import { useState } from "react";
import { IoMdSearch } from "react-icons/io";

interface InputProps {
  defaultValue?: string | null;
  placeholder?: string | null;
  onSearch?: (query: string) => void;
  heightOverride?: string | null;
  className?: string | null;
}

export const SearchInput: React.FC<InputProps> = ({
  defaultValue,
  placeholder,
  onSearch,
  heightOverride,
  className,
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
      <div className="join">
        <input
          type="search"
          className={`input join-item input-sm w-full border-0 focus:outline-0 ${heightOverride}`}
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
          className={`btn-search btn join-item btn-sm border-0 bg-green-dark ${heightOverride} ${className}`}
          onSubmit={handleSubmit}
        >
          <IoMdSearch className="icon-search h-6 w-6 text-white" />
        </button>
      </div>
    </form>
  );
};
