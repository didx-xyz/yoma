import Link from "next/link";
import { useState } from "react";
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
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="flex h-full flex-col gap-3 text-xs text-black md:text-sm">
      <div className="overflow-hidden rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 shadow-md">
        {/* Header */}
        <div className="border-b border-green-100 bg-gradient-to-r from-green-50 to-transparent p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500 shadow-lg">
              <IoGift className="h-6 w-6 text-white" />
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
        <div className="p-4">
          <Link
            href="/yoid/referrals"
            className="btn btn-success w-full gap-2 rounded-lg text-white normal-case shadow-md transition-all hover:scale-105 hover:shadow-lg"
            onClick={onClick}
            tabIndex={tabIndex}
          >
            <span className="font-semibold">Track Progress</span>
            <FaArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
