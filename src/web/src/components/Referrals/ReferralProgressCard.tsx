import { FaSignal } from "react-icons/fa6";
import { type ReferralLinkUsageInfo } from "~/api/models/referrals";

export const ReferralProgressCard: React.FC<{
  usage: ReferralLinkUsageInfo;
}> = ({ usage }) => {
  return (
    <div className="bg-purple-dark flex items-start gap-3 rounded-lg p-3 text-white">
      <div className="rounded-md bg-white/20 p-2 text-white">
        <FaSignal className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between text-sm font-semibold">
          <span>Progress</span>
          <span>{usage.percentComplete ?? 0}%</span>
        </div>
        <p className="mb-2 text-xs text-white/90">
          Keep going, you&apos;re on track!
        </p>
        <div className="h-2 w-full rounded-full bg-white/30">
          <div
            className="bg-orange h-2 rounded-full transition-all duration-700"
            style={{ width: `${usage.percentComplete ?? 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};
