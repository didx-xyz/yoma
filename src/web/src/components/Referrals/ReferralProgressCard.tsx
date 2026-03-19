import { FaSignal } from "react-icons/fa6";
import { type ReferralLinkUsageInfo } from "~/api/models/referrals";

interface ReferralProgressCardProps {
  usage: ReferralLinkUsageInfo;
}

export const ReferralProgressCard = ({ usage }: ReferralProgressCardProps) => {
  const percentComplete = usage.percentComplete ?? 0;
  const progressMessage = usage.dateCompleted
    ? "well done, you have completed this! welcome to YOMA!"
    : "Keep going, you're on track!";

  return (
    <div className="bg-purple-dark flex items-start gap-3 rounded-lg p-3 text-white">
      <div className="rounded-md bg-white/20 p-2 text-white">
        <FaSignal className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between text-sm font-semibold">
          <span>Progress</span>
          <span>{percentComplete}%</span>
        </div>
        <p className="mb-2 text-xs text-white/90">{progressMessage}</p>
        <div className="h-2 w-full rounded-full bg-white/30">
          <div
            className="bg-orange h-2 rounded-full transition-all duration-700"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>
    </div>
  );
};
