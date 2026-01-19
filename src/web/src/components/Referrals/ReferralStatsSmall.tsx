import React from "react";
import {
  IoCheckmarkCircle,
  IoPeople,
  IoTime,
  IoWalletOutline,
} from "react-icons/io5";
import {
  getCompletedDesc,
  getPendingDesc,
  getTotalReferralsDesc,
  getZltoDesc,
} from "./referralStatsDescriptions";

interface ReferralStatsSmallProps {
  totalReferrals: number;
  completed: number;
  pending: number;
  zltoEarned: number;
  showDescriptions?: boolean;
}

export const ReferralStatsSmall: React.FC<ReferralStatsSmallProps> = ({
  totalReferrals,
  completed,
  pending,
  zltoEarned,
  showDescriptions = false,
}) => {
  const totalDesc = getTotalReferralsDesc(totalReferrals || 0);
  const completedDesc = getCompletedDesc(completed || 0);
  const pendingDesc = getPendingDesc(pending || 0);
  const zltoDesc = getZltoDesc(zltoEarned || 0);

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      <div className="flex flex-col gap-1 rounded-md bg-white px-3 py-2 md:px-4 md:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IoPeople className="h-4 w-4 text-blue-600 opacity-70 md:h-5 md:w-5" />
            <div className="text-base-content/70 text-[10px] md:text-xs">
              Total
            </div>
          </div>
          <div className="text-base-content text-sm font-semibold md:text-base">
            {(totalReferrals || 0).toLocaleString("en-US")}
          </div>
        </div>
        {showDescriptions ? (
          <div className="text-base-content/60 line-clamp-2 text-[10px] leading-snug md:text-xs">
            {totalDesc}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1 rounded-md bg-white px-3 py-2 md:px-4 md:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IoCheckmarkCircle className="text-success h-4 w-4 opacity-70 md:h-5 md:w-5" />
            <div className="text-base-content/70 text-[10px] md:text-xs">
              Completed
            </div>
          </div>
          <div className="text-base-content text-sm font-semibold md:text-base">
            {(completed || 0).toLocaleString("en-US")}
          </div>
        </div>
        {showDescriptions ? (
          <div className="text-base-content/60 line-clamp-2 text-[10px] leading-snug md:text-xs">
            {completedDesc}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1 rounded-md bg-white px-3 py-2 md:px-4 md:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IoTime className="text-warning h-4 w-4 opacity-70 md:h-5 md:w-5" />
            <div className="text-base-content/70 text-[10px] md:text-xs">
              Pending
            </div>
          </div>
          <div className="text-base-content text-sm font-semibold md:text-base">
            {(pending || 0).toLocaleString("en-US")}
          </div>
        </div>
        {showDescriptions ? (
          <div className="text-base-content/60 line-clamp-2 text-[10px] leading-snug md:text-xs">
            {pendingDesc}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1 rounded-md bg-white px-3 py-2 md:px-4 md:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IoWalletOutline className="h-4 w-4 text-amber-600 opacity-70 md:h-5 md:w-5" />
            <div className="text-base-content/70 text-[10px] md:text-xs">
              ZLTO
            </div>
          </div>
          <div className="text-base-content text-sm font-semibold md:text-base">
            {(zltoEarned || 0).toLocaleString("en-US")}
          </div>
        </div>
        {showDescriptions ? (
          <div className="text-base-content/60 line-clamp-2 text-[10px] leading-snug md:text-xs">
            {zltoDesc}
          </div>
        ) : null}
      </div>
    </div>
  );
};
