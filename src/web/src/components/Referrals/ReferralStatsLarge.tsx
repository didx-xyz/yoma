import { IoCheckmarkCircle, IoGift, IoPeople, IoTime } from "react-icons/io5";

interface ReferralStatsLargeProps {
  totalReferrals: number;
  completed: number;
  pending: number;
  zltoEarned: number;
}

export const ReferralStatsLarge: React.FC<ReferralStatsLargeProps> = ({
  totalReferrals,
  completed,
  pending,
  zltoEarned,
}) => {
  return (
    <div>
      <div className="grid grid-cols-2 gap-1">
        <div className="min-w-0">
          <div className="text-gray-dark trunate mt-1 text-xs md:text-sm">
            Total Referrals
          </div>
          <div className="flex items-center gap-1 font-bold text-black">
            <IoPeople className="mr-1 text-base text-blue-700" />
            <span className="font-family-nunito truncate text-lg">
              {(totalReferrals || 0).toLocaleString("en-US")}
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-gray-dark trunate mt-1 text-xs md:text-sm">
            Completed
          </div>
          <div className="flex items-center gap-1 font-bold text-black">
            <IoCheckmarkCircle className="mr-1 text-base text-green-700" />
            <span className="font-family-nunito truncate text-lg">
              {(completed || 0).toLocaleString("en-US")}
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-gray-dark trunate mt-1 text-xs md:text-sm">
            Pending
          </div>
          <div className="flex items-center gap-1 font-bold text-black">
            <IoTime className="mr-1 text-base text-orange-700" />
            <span className="font-family-nunito truncate text-lg">
              {(pending || 0).toLocaleString("en-US")}
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-gray-dark trunate mt-1 text-xs md:text-sm">
            ZLTO Earned
          </div>
          <div className="flex items-center gap-1 font-bold text-black">
            <IoGift className="mr-1 text-base text-yellow-700" />
            <span className="font-family-nunito truncate text-lg">
              {(zltoEarned || 0).toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
