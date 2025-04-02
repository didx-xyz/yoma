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

  return (
    <form onSubmit={handleSubmit} className="w-full md:w-auto">
      <div className="join w-full md:w-auto">
        <input
          type="search"
          className={`input input-xs join-item !h-[38px] w-full border-0 !pl-4 placeholder-[#858585] focus:outline-0 ${heightOverride}`}
          placeholder={placeholder ?? "Search..."}
          autoComplete="off"
          value={searchInputValue ?? ""}
          onChange={(e) => setSearchInputValue(e.target.value)}
          onFocus={(e) => (e.target.placeholder = "")}
          onBlur={(e) => (e.target.placeholder = placeholder ?? "Search...")}
          maxLength={50}
        />

        <button
          type="submit"
          aria-label="Search"
          className={`bg-theme justify-centerx !h-[38px] rounded-r-full border-0 p-3 text-white ${heightOverride} ${className}`}
          disabled={
            !!searchInputValue &&
            !(searchInputValue.length >= 3 && searchInputValue.length <= 50)
          }
        >
          <IoMdSearch className="-mt-1 h-6 w-6 text-white" />
        </button>
      </div>
    </form>
  );
};
