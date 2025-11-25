import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { ReferralLinkUsage } from "~/api/models/referrals";

interface RefereeProgressCardProps {
  programs: ReferralLinkUsage[];
  onClick: () => void;
  tabIndex: number;
}

export const RefereeProgressCard: React.FC<RefereeProgressCardProps> = ({
  programs,
  onClick,
  tabIndex,
}) => {
  const displayPrograms = programs.slice(0, 5);
  const totalPrograms = programs.length;
  const hasMore = totalPrograms > 5;

  return (
    <div className="flex flex-col gap-2 rounded-lg border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white p-4 shadow-md">
      <div className="flex items-center gap-2">
        <span className="text-lg">🎯</span>
        <span className="font-bold text-blue-900">My Referral Progress</span>
      </div>
      <p className="text-xs text-gray-600">Your active referral programs:</p>
      <div className="flex flex-col gap-2">
        {displayPrograms.map((program) => (
          <Link
            key={program.id}
            href={`/yoid/referee/${program.programId}`}
            className="font-family-nunito flex items-center justify-between gap-2 rounded-md border border-blue-200 bg-white p-3 transition-all hover:border-blue-400 hover:shadow-sm"
            onClick={onClick}
            tabIndex={tabIndex}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium text-gray-800">
                  {program.programName}
                </span>
              </div>
            </div>
            <FaArrowRight className="h-3 w-3 flex-shrink-0 text-blue-600" />
          </Link>
        ))}
      </div>
      {hasMore && (
        <p className="text-center text-xs text-gray-500">
          +{totalPrograms - 5} more program{totalPrograms - 5 > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
};
