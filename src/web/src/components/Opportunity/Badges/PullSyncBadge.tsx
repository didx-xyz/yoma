import { type OpportunityInfo } from "~/api/models/opportunity";

interface PullSyncBadgeProps {
  opportunity: OpportunityInfo;
}

const PullSyncBadge: React.FC<PullSyncBadgeProps> = ({ opportunity }) => {
  if (!opportunity || opportunity.syncedInfo?.syncType !== "Pull") return null;

  const tip = opportunity.syncedInfo?.partners?.length
    ? `Managed by ${opportunity.syncedInfo.partners.join(", ")}`
    : "Externally managed";

  return (
    <div
      className="tooltip tooltip-top tooltip-secondary mt-1 w-fit"
      data-tip={tip}
    >
      <span className="badge border-none bg-[#E7E8F5] text-[10px] text-[#5F65B9] select-none">
        🔁 Externally managed
      </span>
    </div>
  );
};

export default PullSyncBadge;
