import { useCallback, useEffect, useState } from "react";

interface InputProps {
  defaultValue?: string | null;
  placeholder?: string | null;
  onSearch?: (query: string) => void;
}

export const SearchInputLarge: React.FC<InputProps> = ({
  defaultValue,
  placeholder,
  onSearch,
}) => {
  const [searchInputValue, setSearchInputValue] = useState(defaultValue);

  // hack: reset searchInputValue when defaultValue changes
  // the initialValue on the useState ain't working
  useEffect(() => {
    setSearchInputValue(defaultValue);
  }, [defaultValue, setSearchInputValue]);

  const handleSubmit = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault(); // 👈️ prevent page refresh

      // trim whitespace
      const searchValue = searchInputValue?.trim() ?? "";

      if (onSearch) onSearch(searchValue);
    },
    [onSearch, searchInputValue],
  );

  return (
    <form onSubmit={handleSubmit} className="w-full md:max-w-[600px]">
      <div className="input-group">
        <div className="inline-flex items-center justify-center bg-[#653A72] text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="ml-5 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="search"
          placeholder={placeholder ?? "Search..."}
          className="input-sm w-full bg-[#653A72] py-5 text-sm text-white placeholder-white focus:outline-0"
          value={searchInputValue ?? ""}
          onChange={(e) => setSearchInputValue(e.target.value)}
          onFocus={(e) => (e.target.placeholder = "")}
          onBlur={(e) => (e.target.placeholder = placeholder ?? "Search...")}
        />
      </div>
      {/* <div className="search flex">
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
      </div> */}
    </form>
  );
};
