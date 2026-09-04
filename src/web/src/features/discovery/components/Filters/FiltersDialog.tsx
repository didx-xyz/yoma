import React from "react";
import { IoClose } from "react-icons/io5";
import { useDiscovery } from "../../state/DiscoveryContext";
import { CountFooter } from "../shared/CountFooter";
import { FilterPanelBlocks } from "./FilterPanelBlocks";

/**
 * Desktop container — a centred 820px dialog that scrolls internally with the sticky footer.
 * Chrome only: the blocks come from `<FilterPanelBlocks>` and are identical to the mobile sheet's.
 */
export const FiltersDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onEditPreferences: () => void;
}> = ({ open, onClose, onEditPreferences }) => {
  const { count, counting, dispatch, chips } = useDiscovery();
  if (!open) return null;

  return (
    <dialog
      open
      className="bg-overlay fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 p-0 md:p-4"
      aria-label="Filters"
    >
      {/* Full-screen below md (the sheet normally serves there); centred 820px dialog on md+. */}
      <div className="shadow-custom flex h-full max-h-full w-full flex-col bg-white md:h-auto md:max-h-[90vh] md:max-w-205 md:rounded-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <h2 className="flex items-center gap-2 text-base font-bold tracking-normal md:text-lg">
            Filters
            {chips.length > 0 && (
              <span className="bg-green flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold text-white">
                {chips.length}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="hover:bg-gray-light flex h-11 w-11 items-center justify-center rounded-full"
          >
            <IoClose className="h-5 w-5" />
          </button>
        </div>
        <div className="grow overflow-y-auto px-6 py-2">
          <FilterPanelBlocks onEditPreferences={onEditPreferences} />
        </div>
        <CountFooter
          count={count}
          counting={counting}
          onClearAll={() => dispatch({ kind: "clearAll" })}
          onShowResults={onClose}
        />
      </div>
    </dialog>
  );
};
