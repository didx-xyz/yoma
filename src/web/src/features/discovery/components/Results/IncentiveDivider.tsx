import React from "react";

/**
 * "Incentive not specified" — marks where the results change bucket under a Paid filter. The API
 * lists the explicit matches first and the opportunities that haven't specified an incentive
 * after, whatever the sort (2026-10-03), so without a mark an "Ending soonest" list visibly
 * restarts its dates halfway down. `DiscoveryResults` decides where it goes
 * (`incentiveSplitAt`); the grid spans it across every column, the list puts it between rows.
 *
 * Hairlines from `sm`; below it the text alone, centred. No icon and no motion of its own: it
 * fades with the results.
 */
export const IncentiveDivider: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div className={`flex items-center justify-center gap-3 py-2 ${className}`}>
    <span aria-hidden="true" className="bg-gray hidden h-px grow sm:block" />
    <div className="flex flex-col items-center text-center">
      <p className="text-xs font-semibold text-black">
        Incentive not specified
      </p>
      <p className="text-gray-dark text-xs">
        These come after the ones that match your Pay filter.
      </p>
    </div>
    <span aria-hidden="true" className="bg-gray hidden h-px grow sm:block" />
  </div>
);
