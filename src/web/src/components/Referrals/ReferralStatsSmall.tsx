import { IoCheckmarkCircle, IoGift, IoPeople, IoTime } from "react-icons/io5";

interface ReferralStatsSmallProps {
  totalReferrals: number;
  completed: number;
  pending: number;
  zltoEarned: number;
}

export const ReferralStatsSmall: React.FC<ReferralStatsSmallProps> = ({
  totalReferrals,
  completed,
  pending,
  zltoEarned,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Total */}
      <div className="flex min-w-0 items-center gap-2 font-bold text-blue-700">
        <span className="badge gap-1 truncate bg-blue-50 text-blue-700">
          <IoPeople />
          {(totalReferrals || 0).toLocaleString("en-US")}
        </span>
        <div className="min-w-0 flex-1 truncate text-[10px] font-normal text-gray-500">
          Total
        </div>
      </div>

      {/* Completed */}
      <div className="flex min-w-0 items-center gap-2 font-bold text-green-700">
        <span className="badge gap-1 truncate bg-green-50 text-green-700">
          <IoCheckmarkCircle />
          {(completed || 0).toLocaleString("en-US")}
        </span>
        <div className="min-w-0 flex-1 truncate text-[10px] font-normal text-gray-500">
          Completed
        </div>
      </div>

      {/* Pending */}
      <div className="flex min-w-0 items-center gap-2 font-bold text-orange-700">
        <span className="badge gap-1 truncate bg-orange-50 text-orange-700">
          <IoTime />
          {(pending || 0).toLocaleString("en-US")}
        </span>
        <div className="min-w-0 flex-1 truncate text-[10px] font-normal text-gray-500">
          Pending
        </div>
      </div>

      {/* ZLTO Earned */}
      <div className="flex min-w-0 items-center gap-2 font-bold text-yellow-700">
        <span className="badge gap-1 truncate bg-yellow-50 text-yellow-700">
          <IoGift />
          {(zltoEarned || 0).toLocaleString("en-US")}
        </span>
        <div className="min-w-0 flex-1 truncate text-[10px] font-normal text-gray-500">
          ZLTO Earned
        </div>
      </div>
    </div>
  );
};
