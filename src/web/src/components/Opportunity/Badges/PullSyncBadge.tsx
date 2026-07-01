import {
  type OpportunityInfo,
  type SyncInfoEntity,
} from "~/api/models/opportunity";

interface PullSyncBadgeProps {
  opportunity?: Pick<OpportunityInfo, "syncedInfo"> | null;
  syncInfo?: SyncInfoEntity | null;
  className?: string;
}

const PullSyncBadge: React.FC<PullSyncBadgeProps> = ({
  opportunity,
  syncInfo,
  className,
}) => {
  const resolvedSyncInfo = syncInfo ?? opportunity?.syncedInfo ?? null;

  if (resolvedSyncInfo?.syncType !== "Pull") return null;

  const tip = resolvedSyncInfo.partners?.length
    ? `Managed by ${resolvedSyncInfo.partners.map((p) => p.partner).join(", ")}`
    : "Externally managed";

  return (
    <div
      className={`tooltip tooltip-top tooltip-secondary w-fit ${className ?? ""}`.trim()}
      data-tip={tip}
    >
      <span className="badge border-none bg-[#E7E8F5] text-[10px] text-[#5F65B9] select-none">
        🔁 Externally managed
      </span>
    </div>
  );
};

export default PullSyncBadge;
