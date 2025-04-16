import { useCallback, useEffect, useState } from "react";
import { IoMdOptions } from "react-icons/io";

export const OppSearchInputLarge: React.FC<{
  defaultValue?: string | null;
  placeholder?: string | null;
  onSearch?: (query: string) => void;
  openFilter?: (filterFullWindowVisible: boolean) => void;
  maxWidth?: number;
  inputClassName?: string;
  buttonClassName?: string;
}> = ({
  defaultValue,
  placeholder,
  onSearch,
  openFilter,
  maxWidth = 0, // The default maxWidth is set to 0, which means it will be auto
  inputClassName = "",
  buttonClassName = "",
}) => {
  const [searchInputValue, setSearchInputValue] = useState(defaultValue);

  const handleSubmit = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();

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
    <form
      onSubmit={handleSubmit}
      className="flex w-full grow"
      autoComplete="off"
      spellCheck="false"
    >
      <div className="join w-full overflow-hidden rounded-3xl shadow-lg lg:my-0">
        {openFilter && (
          <button
            type="button"
            className={`${buttonClassName} join-item border-orange bg-orange hover:bg-purple hover:text-orange inline-flex cursor-pointer items-center justify-center rounded-l-full border p-4 text-black`}
            onClick={() => openFilter(true)}
          >
            <IoMdOptions className="h-4 w-4 md:h-6 md:w-6" />
          </button>
        )}

        <input
          type="search"
          placeholder={placeholder ?? "Search..."}
          className={`${inputClassName} input-lg join-item md:!px-8x w-full bg-white/10 px-4 text-white placeholder-white placeholder:font-bold focus:outline-none`}
          style={{ maxWidth: maxWidthStyle }}
          value={searchInputValue ?? ""}
          onChange={(e) => setSearchInputValue(e.target.value)}
          onFocus={(e) => (e.target.placeholder = "")}
          onBlur={(e) => (e.target.placeholder = placeholder ?? "Search...")}
          maxLength={50}
          autoComplete="off"
          spellCheck="false"
        />

        <button
          className={`${buttonClassName} join-item border-orange bg-orange hover:bg-purple hover:text-orange inline-flex cursor-pointer items-center justify-center rounded-r-full border p-4 text-black disabled:brightness-75`}
          type="submit"
          disabled={
            searchInputValue === null ||
            searchInputValue === undefined ||
            searchInputValue.length < 3
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 md:h-7 md:w-7"
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
