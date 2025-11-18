import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";

interface ReferrerProgressCardProps {
  programName: string;
  onClick: () => void;
  tabIndex: number;
}

export const ReferrerProgressCard: React.FC<ReferrerProgressCardProps> = ({
  programName,
  onClick,
  tabIndex,
}) => {
  return (
    <Link
      href="/yoid/referrals"
      className="flex flex-col gap-2 rounded-lg border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-white p-4 shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
      onClick={onClick}
      tabIndex={tabIndex}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">📊</span>
        <span className="font-bold text-orange-900">
          Track Referrer Progress
        </span>
      </div>
      <p className="text-xs text-gray-700">🔗 Active Links: {programName}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">View your referrals</span>
        <FaArrowRight className="h-3 w-3 text-orange-600" />
      </div>
    </Link>
  );
};
