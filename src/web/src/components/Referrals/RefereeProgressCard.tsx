import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { ReferralLinkUsage } from "~/api/models/referrals";

interface RefereeProgressCardProps {
  programs: ReferralLinkUsage[];
  onClick: () => void;
  totalCount?: number;
  onLoadMore?: () => void;
  loading?: boolean;
}

export const RefereeProgressCard: React.FC<RefereeProgressCardProps> = ({
  programs,
  onClick,
  totalCount = 0,
  onLoadMore,
  loading = false,
}) => {
  const hasMore = programs.length < totalCount;

  return (
    <div className="flex flex-col gap-2 rounded-lg border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white p-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <span className="font-bold text-blue-900">My Referrals</span>
        </div>
      </div>
      <p className="text-xs text-gray-600">
        You have {totalCount} pending referrals:
      </p>
      <div className="flex flex-col gap-2">
        {programs.map((program) => (
          <Link
            key={program.id}
            href={`/yoid/referee/${program.programId}`}
            className="font-family-nunito flex items-center justify-between gap-2 rounded-md border border-blue-200 bg-white p-2 transition-all hover:border-blue-400 hover:shadow-sm"
            onClick={onClick}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-xs font-medium text-gray-800">
                  {program.programName}
                </span>
              </div>
            </div>
            <FaArrowRight className="h-3 w-3 flex-shrink-0 text-blue-600" />
          </Link>
        ))}
        {hasMore && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLoadMore?.();
            }}
            disabled={loading}
            className="mt-1 self-center text-xs text-blue-600 hover:underline disabled:text-gray-400"
          >
            {loading ? "Loading..." : "Load more..."}
          </button>
        )}
      </div>
    </div>
  );
};
