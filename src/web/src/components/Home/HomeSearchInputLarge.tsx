import { useCallback, useEffect, useState } from "react";

export const HomeSearchInputLarge: React.FC<{
  defaultValue?: string | null;
  onSearch?: (query: string) => void;
  openFilter?: (filterFullWindowVisible: boolean) => void;
  maxWidth?: number;
  inputClassName?: string;
  buttonClassName?: string;
}> = ({
  defaultValue,
  onSearch,
  openFilter,
  maxWidth = 0, // The default maxWidth is set to 0, which means it will be auto
  inputClassName,
  buttonClassName,
}) => {
  const [searchInputValue, setSearchInputValue] = useState(defaultValue);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [isInputActive, setIsInputActive] = useState(false);
  const placeholderSentences = [
    "What are you looking for?",
    "Search Opportunities...",
    "Discover new skills...",
  ];

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

  useEffect(() => {
    if (!isInputActive) {
      const interval = setInterval(() => {
        setFade(false);
        setTimeout(() => {
          setPlaceholderIndex(
            (prevIndex) => (prevIndex + 1) % placeholderSentences.length,
          );
          setFade(true);
        }, 500);
      }, 3500); // Change placeholder every 3.5 seconds

      return () => clearInterval(interval);
    }
  }, [placeholderSentences.length, isInputActive]);

  const currentPlaceholder = isInputActive
    ? ""
    : placeholderSentences[placeholderIndex];

  // Convert maxWidth to a string with px for inline style
  const maxWidthStyle = maxWidth === 0 ? "auto" : `${maxWidth}px`;

  return (
    <form onSubmit={handleSubmit} className="flex w-full grow">
      <div className="join w-full overflow-hidden rounded-l-full rounded-r-full border-none bg-white/10 shadow-lg lg:my-0">
        <input
          type="search"
          placeholder={currentPlaceholder}
          className={`${inputClassName} input-lg w-full rounded-tl-3xl rounded-bl-3xl border-none bg-transparent px-8 text-white placeholder-white duration-500 placeholder:text-[14px] placeholder:font-bold placeholder:!transition-opacity focus:outline-none md:placeholder:text-[16px] lg:w-full ${
            openFilter
              ? "rounded-tl-none rounded-bl-none"
              : "rounded-tl-3xl rounded-bl-3xl"
          } ${fade ? "opacity-100" : "opacity-0"}`}
          style={{ maxWidth: maxWidthStyle }}
          value={searchInputValue ?? ""}
          onFocus={() => setIsInputActive(true)}
          onBlur={(e) => {
            setIsInputActive(false);
            e.target.placeholder =
              searchInputValue?.trim() === "" ? currentPlaceholder || "" : "";
          }}
          onChange={(e) => {
            setSearchInputValue(e.target.value);
            if (e.target.value.trim() !== "") {
              setIsInputActive(true);
            } else {
              setIsInputActive(false);
            }
          }}
          maxLength={50}
        />
        <button
          className={`${buttonClassName} join-item border-green bg-green hover:bg-purple inline-flex items-center justify-center rounded-r-full border p-4 text-white disabled:brightness-75`}
          type="submit"
          disabled={
            searchInputValue === null ||
            searchInputValue === undefined ||
            searchInputValue.length < 3 ||
            searchInputValue.length > 50
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
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
