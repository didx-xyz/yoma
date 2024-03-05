import { useCallback, useEffect, useState } from "react";
import { IoMdOptions } from "react-icons/io";

interface InputProps {
  defaultValue?: string | null;
  placeholder?: string | null;
  onSearch?: (query: string) => void;
  openFilter: (filterFullWindowVisible: boolean) => void;
}

export const SearchInputLarge: React.FC<InputProps> = ({
  defaultValue,
  placeholder,
  onSearch,
  openFilter,
}) => {
  const [searchInputValue, setSearchInputValue] = useState(defaultValue);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // hack: reset searchInputValue when defaultValue changes
  // the initialValue on the useState ain't working
  useEffect(() => {
    setSearchInputValue(defaultValue);
  }, [defaultValue, setSearchInputValue]);

  const doSubmit = useCallback(
    (searchInputValue: string | undefined | null) => {
      const searchValue = searchInputValue?.trim() ?? "";

      if (onSearch) onSearch(searchValue);
    },
    [onSearch],
  );

  const handleSubmit = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault(); // 👈️ prevent page refresh

      doSubmit(searchInputValue);
    },
    [doSubmit, searchInputValue],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (timeoutId) clearTimeout(timeoutId);

      if (e.target.value === "") {
        doSubmit(null);
      } else if (e.target.value.length > 2) {
        const newTimeoutId = setTimeout(() => {
          doSubmit(e.target.value);
        }, 2000); // 2000 milliseconds = 2 seconds

        setTimeoutId(newTimeoutId);
      }
    },
    [timeoutId, doSubmit],
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="join my-4 md:my-0">
        <button
          type="button"
          className="btn btn-primary join-item inline-flex rounded-l-full md:hidden"
          onClick={() => openFilter(true)}
        >
          <IoMdOptions className="h-5 w-5" />
        </button>

        <input
          type="search"
          placeholder={placeholder ?? "Search..."}
          className="input-md min-w-[250px] bg-[#653A72] py-5 text-sm text-white placeholder-white focus:outline-0 md:w-[600px] md:rounded-bl-full md:rounded-tl-full md:!pl-8"
          value={searchInputValue ?? ""}
          onChange={(e) => setSearchInputValue(e.target.value)}
          onFocus={(e) => (e.target.placeholder = "")}
          onBlur={(e) => (e.target.placeholder = placeholder ?? "Search...")}
          onInput={handleInput}
        />
        <button
          className="btn btn-primary join-item inline-flex rounded-r-full"
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
