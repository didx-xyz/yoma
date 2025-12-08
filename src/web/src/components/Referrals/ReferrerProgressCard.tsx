import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { IoGift } from "react-icons/io5";

interface ReferrerProgressCardProps {
  onClick: () => void;
  tabIndex: number;
}

export const ReferrerProgressCard: React.FC<ReferrerProgressCardProps> = ({
  onClick,
  tabIndex,
}) => {
  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-xl bg-white p-4 shadow">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full shadow-lg">
            <IoGift className="text-green h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900">
              My Referral Links
            </h3>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-600">
          You have active referral links. Track your referrals and rewards.
        </p>
      </div>

      {/* Content */}
      <Link
        href="/yoid/referrals"
        className="btn btn-sm btn-success w-full gap-2 rounded-lg text-white normal-case shadow-md transition-all hover:scale-105 hover:shadow-lg"
        onClick={onClick}
        tabIndex={tabIndex}
      >
        <span className="font-semibold">Track Progress</span>
        <FaArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
};
