import { useCallback, useEffect, useState } from "react";
import { IoMdOptions } from "react-icons/io";

export const SearchInputLarge: React.FC<{
  defaultValue?: string | null;
  placeholder?: string | null;
  onSearch?: (query: string) => void;
  openFilter?: (filterFullWindowVisible: boolean) => void;
  maxWidth?: number;
}> = ({
  defaultValue,
  placeholder,
  onSearch,
  openFilter,
  maxWidth = 0, // The default maxWidth is set to 0, which means it will be auto
}) => {
  const [searchInputValue, setSearchInputValue] = useState(defaultValue);

  const handleSubmit = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault(); // Prevent page refresh

      // Trim whitespace
      const searchValue = searchInputValue?.trim() ?? "";
      if (onSearch) onSearch(searchValue);
    },
    [searchInputValue, onSearch],
  );

  useEffect(() => {
    setSearchInputValue(defaultValue);
  }, [defaultValue]);

  // Convert maxWidth to a string with px for inline style
  const maxWidthStyle = maxWidth == 0 ? "auto" : `${maxWidth}px`;

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-grow">
      <div className="join my-4 w-full overflow-hidden rounded-3xl lg:my-0">
        {openFilter && (
          <button
            type="button"
            className="bg-theme btn join-item inline-flex items-center justify-center rounded-l-full border-none p-3 text-white brightness-[1.12] hover:brightness-95 lg:hidden"
            onClick={() => openFilter(true)}
          >
            <IoMdOptions className="h-5 w-5" />
          </button>
        )}
        <input
          type="search"
          placeholder={placeholder ?? "Search..."}
          className={`bg-theme input-md w-full rounded-bl-3xl rounded-tl-3xl text-sm text-white placeholder-white brightness-90 focus:outline-none md:!pl-8 lg:w-full ${
            openFilter
              ? "rounded-bl-none rounded-tl-none"
              : "rounded-bl-3xl rounded-tl-3xl"
          }`}
          style={{ maxWidth: maxWidthStyle }}
          value={searchInputValue ?? ""}
          onChange={(e) => setSearchInputValue(e.target.value)}
          onFocus={(e) => (e.target.placeholder = "")}
          onBlur={(e) => (e.target.placeholder = placeholder ?? "Search...")}
          maxLength={50}
        />
        <button
          className="bg-theme btn btn-primary join-item inline-flex items-center justify-center rounded-r-full border-none p-3 text-white brightness-[1.12] hover:brightness-95 disabled:brightness-75"
          type="submit"
          disabled={
            !!searchInputValue &&
            !(searchInputValue.length >= 3 && searchInputValue.length <= 50)
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </form>
  );
};
