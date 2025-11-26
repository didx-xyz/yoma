import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { ReferralLink } from "~/api/models/referrals";

interface ReferrerProgressCardProps {
  links: ReferralLink[];
  onClick: () => void;
  tabIndex: number;
}

export const ReferrerProgressCard: React.FC<ReferrerProgressCardProps> = ({
  links,
  onClick,
  tabIndex,
}) => {
  const displayLinks = links.slice(0, 5);
  const totalLinks = links.length;
  const hasMore = totalLinks > 5;

  return (
    <div className="flex flex-col gap-2 rounded-lg border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-white p-4 shadow-md">
      <div className="flex items-center gap-2">
        <span className="text-lg">📊</span>
        <span className="font-bold text-orange-900">My Referral Links</span>
      </div>

      <p className="text-xs text-gray-600">Your active referral links:</p>
      <div className="flex flex-col gap-2">
        {displayLinks.map((link) => (
          <div
            key={link.id}
            className="font-family-nunito flex items-center justify-between gap-2 rounded-md border border-orange-200 bg-white p-3"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium text-gray-800">
                  {link.name}
                </span>
                <div className="flex flex-shrink-0 items-center gap-1">
                  {link.completionTotal !== null &&
                    link.completionTotal > 0 && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        {link.completionTotal} completed
                      </span>
                    )}
                  {link.pendingTotal !== null && link.pendingTotal > 0 && (
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                      {link.pendingTotal} pending
                    </span>
                  )}
                </div>
              </div>
              <span className="truncate text-xs text-gray-500">
                {link.programName}
              </span>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <p className="text-center text-xs text-gray-500">
          +{totalLinks - 5} more link{totalLinks - 5 > 1 ? "s" : ""}
        </p>
      )}

      <Link
        href="/yoid/referrals"
        className="btn btn-warning btn-sm mt-2 gap-2 text-white"
        onClick={onClick}
        tabIndex={tabIndex}
      >
        Track Progress
        <FaArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
};
