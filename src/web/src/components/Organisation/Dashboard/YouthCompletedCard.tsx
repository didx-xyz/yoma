import type { YouthInfo } from "~/api/models/organizationDashboard";
import { AvatarImage } from "~/components/AvatarImage";
import ZltoRewardBadge from "~/components/Opportunity/Badges/ZltoRewardBadge";

export const YouthCompletedCard: React.FC<{
  opportunity: YouthInfo;
  showOpportunityModal?: (opportunity: YouthInfo) => void;
}> = ({ opportunity, showOpportunityModal }) => {
  return (
    <div className="m-2 flex h-72 w-72 flex-col gap-2 rounded-lg bg-white px-2 py-4 text-xs shadow">
      <div className="mb-1 flex items-center gap-2 text-sm">
        <AvatarImage alt="Person Image" size={40} />
        <div className="line-clamp-2 flex h-10 w-full items-center whitespace-break-spaces text-sm font-semibold">
          {opportunity.displayName}
        </div>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="tracking-wider">Country:</div>
        <div className="badge bg-blue-light text-blue">
          {opportunity.country || "N/A"}
        </div>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="tracking-wider">Age:</div>
        <div className="badge">
          {opportunity.age !== null ? opportunity.age : "N/A"}
        </div>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="tracking-wider">Reward Total:</div>
        <ZltoRewardBadge amount={opportunity.zltoRewardTotal} />
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="tracking-wider">Yoma Reward Total:</div>
        <div className="badge">{opportunity.yomaRewardTotal}</div>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="tracking-wider">Opportunity Count:</div>
        <button
          type="button"
          className="badge bg-orange"
          onClick={() =>
            showOpportunityModal && showOpportunityModal(opportunity)
          }
        >
          {opportunity.opporunityCount}
        </button>
      </div>
    </div>
  );
};
