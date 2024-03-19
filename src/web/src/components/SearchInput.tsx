import { useCallback, useState } from "react";
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

  const handleSubmit = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault(); // prevent page refresh

      // trim whitespace
      const searchValue = searchInputValue?.trim() ?? "";

      if (onSearch) onSearch(searchValue);
    },
    [searchInputValue, onSearch],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInputValue(e.target.value);
      // submit
      setTimeout(() => {
        // trim whitespace
        const searchValue = e.target.value?.trim() ?? "";

        if (onSearch) onSearch(searchValue);
      }, 1000);
    },
    [onSearch],
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="join">
        <input
          type="search"
          className={`input join-item input-xs !h-[38px] w-full border-0 !pl-4 placeholder-[#858585] focus:outline-0 ${heightOverride}`}
          placeholder={placeholder ?? "Search..."}
          autoComplete="off"
          value={searchInputValue ?? ""}
          onChange={handleChange}
          onFocus={(e) => (e.target.placeholder = "")}
          onBlur={(e) => (e.target.placeholder = placeholder ?? "Search...")}
        />

        <button
          type="submit"
          aria-label="Search"
          className={`btn-search bg-theme btn join-item btn-sm !h-[38px] !rounded-r-lg border-0 text-sm brightness-105 hover:brightness-110 ${heightOverride} ${className}`}
        >
          <IoMdSearch className="icon-search h-6 w-6 text-white" />
        </button>
      </div>
    </form>
  );
};
