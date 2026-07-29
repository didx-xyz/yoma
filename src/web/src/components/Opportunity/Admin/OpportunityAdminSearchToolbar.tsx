import type { ReactNode } from "react";
import { IoMdOptions } from "react-icons/io";
import { SearchInput } from "~/components/SearchInput";

/**
 * Search row shared by the admin (all organisations) and org-admin opportunity search
 * pages: search input + "open filters" button, with an optional actions slot (right).
 */
export const OpportunityAdminSearchToolbar: React.FC<{
  defaultValue?: string | null;
  onSearch: (query: string) => void;
  openFilter: (visible: boolean) => void;
  /** number of applied filters, shown on the filter button */
  appliedFilterCount?: number;
  /** rendered to the right of the search row (e.g. an Actions dropdown) */
  children?: ReactNode;
}> = ({
  defaultValue,
  onSearch,
  openFilter,
  appliedFilterCount = 0,
  children,
}) => {
  return (
    <div className="flex w-full grow flex-col items-center justify-between gap-4 sm:justify-end md:flex-row">
      <div className="flex w-full grow flex-row flex-wrap items-center gap-2">
        <SearchInput defaultValue={defaultValue} onSearch={onSearch} />

        <button
          type="button"
          className="bg-theme btn btn-sm !h-[38px] w-full items-center justify-center gap-1 rounded-lg border-none tracking-wide text-white shadow-md brightness-[1.12] hover:brightness-95 md:w-40"
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
      </div>

      {children}
    </div>
  );
};

export default OpportunityAdminSearchToolbar;
