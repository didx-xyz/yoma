import { useCallback, useEffect, useState } from "react";
import { IoMdOptions } from "react-icons/io";

export const SearchInputLarge: React.FC<{
  defaultValue?: string | null;
  placeholder?: string | null;
  onSearch?: (query: string) => void;
  openFilter?: (filterFullWindowVisible: boolean) => void;
  maxWidth?: number;
}> = ({ defaultValue, placeholder, onSearch, openFilter, maxWidth = 600 }) => {
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

  // hack: reset searchInputValue when defaultValue changes
  // the initialValue on the useState ain't working
  useEffect(() => {
    setSearchInputValue(defaultValue);
  }, [defaultValue, setSearchInputValue]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="join my-4 md:my-0">
        {openFilter && (
          <button
            type="button"
            className="bg-theme btn join-item inline-flex rounded-l-full border-0 brightness-90 hover:brightness-95 md:hidden"
            onClick={() => openFilter(true)}
          >
            <IoMdOptions className="h-5 w-5" />
          </button>
        )}

        <input
          type="search"
          placeholder={placeholder ?? "Search..."}
          className={`bg-theme md:w-[${maxWidth}px] input-md min-w-[250px] py-5 text-sm text-white placeholder-white brightness-90 focus:outline-0 md:rounded-bl-full md:rounded-tl-full md:!pl-8 ${
            openFilter ? "" : "rounded-bl-3xl rounded-tl-3xl"
          }`}
          value={searchInputValue ?? ""}
          onChange={handleChange}
          onFocus={(e) => (e.target.placeholder = "")}
          onBlur={(e) => (e.target.placeholder = placeholder ?? "Search...")}
        />
        <button
          className="bg-theme btn btn-primary join-item inline-flex rounded-r-full border-0 brightness-90 hover:brightness-95"
          onClick={() => onSearch}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-1 h-6 w-6"
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
        </button>
      </div>
    </form>
  );
};
