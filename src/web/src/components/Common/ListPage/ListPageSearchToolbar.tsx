import type { ReactNode } from "react";
import { IoMdOptions } from "react-icons/io";
import { SearchInput } from "~/components/SearchInput";

/**
 * Shared styling for the toolbar buttons (Filters, and the page's Actions dropdown), so
 * the two always match in size and colour. Colour is theme-driven: blue on admin pages,
 * green on org-admin pages.
 * NB: `!rounded-lg` overrides the dropdown trigger's own `rounded-full`, which equal
 * specificity would otherwise decide by stylesheet order.
 */
export const LIST_PAGE_TOOLBAR_BUTTON_CLASSES =
  "bg-theme btn btn-sm !h-[38px] w-full items-center justify-center gap-1 !rounded-lg border-none tracking-wide text-white shadow-md brightness-[1.12] hover:brightness-95 md:w-40";

/**
 * Search row shared by the admin list pages: search input + "open filters" button, with an
 * optional actions slot (right). Pages with nothing to filter on omit `openFilter`, which
 * drops the Filters button rather than offering an empty dialog.
 */
export const ListPageSearchToolbar: React.FC<{
  defaultValue?: string | null;
  placeholder?: string | null;
  onSearch: (query: string) => void;
  /** omit to hide the Filters button (pages whose only filter is the status tab) */
  openFilter?: (visible: boolean) => void;
  /** number of applied filters, shown on the filter button */
  appliedFilterCount?: number;
  /** rendered to the right of the search row (e.g. an Actions dropdown) */
  children?: ReactNode;
}> = ({
  defaultValue,
  placeholder,
  onSearch,
  openFilter,
  appliedFilterCount = 0,
  children,
}) => {
  return (
    <div className="flex w-full grow flex-col items-center justify-between gap-4 sm:justify-end md:flex-row">
      <div className="flex w-full grow flex-row flex-wrap items-center gap-2">
        <SearchInput
          defaultValue={defaultValue}
          placeholder={placeholder}
          onSearch={onSearch}
        />

        {openFilter && (
          <button
            type="button"
            className={LIST_PAGE_TOOLBAR_BUTTON_CLASSES}
            onClick={() => openFilter(true)}
            id="btnOpenFilters" // e2e
          >
            <IoMdOptions className="h-5 w-5" />
            <span>
              {appliedFilterCount > 0
                ? `Filters (${appliedFilterCount})`
                : "Filters"}
            </span>
          </button>
        )}
      </div>

      {children}
    </div>
  );
};

export default ListPageSearchToolbar;
