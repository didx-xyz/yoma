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
      <div className="join">
        <div className="join-item inline-flex items-center justify-center bg-[#653A72] text-white">
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
          className="join-item input-md w-[300px] bg-[#653A72] py-5 text-sm text-white placeholder-white focus:outline-0  md:w-[600px]"
          value={searchInputValue ?? ""}
          onChange={(e) => setSearchInputValue(e.target.value)}
          onFocus={(e) => (e.target.placeholder = "")}
          onBlur={(e) => (e.target.placeholder = placeholder ?? "Search...")}
          onInput={handleInput}
          //       onInput={(e: React.ChangeEvent<HTMLInputElement>) => {

          //         if (e.target.value === "") {
          //           console.log("Input cleared");
          //           // Handle input cleared event here
          //           //setSearchInputValue(null);

          //           //submit the form
          //           if (onSearch) onSearch(e.target.value);
          //         }
          //         else{
          //            // Clear any existing timeouts
          // clearTimeout(timeoutId);

          // // Set a new timeout
          // timeoutId = setTimeout(function() {
          //     // Submit the form
          //     myForm.submit();
          // }, 2000); // 2000 milliseconds = 2 seconds
          //         }
          //       }}
        />
      </div>
    </form>
  );
};
