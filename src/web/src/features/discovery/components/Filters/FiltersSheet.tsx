import React from "react";
import { IoClose } from "react-icons/io5";
import { useDiscovery } from "../../state/DiscoveryContext";
import { useDialogDismiss } from "../../state/useDialogDismiss";
import { CountFooter } from "../shared/CountFooter";
import { FilterPanelBlocks } from "./FilterPanelBlocks";

/**
 * Mobile container — search and filters are ONE full-screen sheet, with the sticky footer always
 * reachable. Chrome only: the blocks come from `<FilterPanelBlocks>` and are identical to the
 * desktop dialog's — same set, same order, denser controls.
 */
export const FiltersSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  onEditPreferences: () => void;
}> = ({ open, onClose, onEditPreferences }) => {
  const { count, counting, clearAll, chips, scrollToResults } = useDiscovery();
  useDialogDismiss(open, onClose);
  if (!open) return null;

  return (
    <dialog
      open
      className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none flex-col border-0 bg-white p-0"
      aria-label="Filters"
    >
      <div className="border-gray flex items-center gap-2 border-b px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close filters"
          className="bg-gray-light flex h-11 w-11 items-center justify-center rounded-full"
        >
          <IoClose className="h-5 w-5" />
        </button>
        {/* Same title as the desktop dialog — one surface, two containers. */}
        <h2 className="flex grow items-center justify-center gap-2 text-base font-bold tracking-normal">
          Filters
          {chips.length > 0 && (
            <span className="bg-green flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold text-white">
              {chips.length}
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={clearAll}
          className="text-purple min-h-11 text-sm font-semibold"
        >
          Clear
        </button>
      </div>
      <div className="grow overflow-y-auto px-4 py-3">
        <FilterPanelBlocks onEditPreferences={onEditPreferences} />
      </div>
      <CountFooter
        count={count}
        counting={counting}
        onClearAll={clearAll}
        onShowResults={() => {
          onClose();
          scrollToResults();
        }}
      />
    </dialog>
  );
};
