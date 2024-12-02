import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import React from "react";
import type { OpportunityInfo } from "~/api/models/opportunity";

interface ZltoRewardBadgeProps {
  opportunity: OpportunityInfo;
}

const ZltoRewardBadge: React.FC<ZltoRewardBadgeProps> = ({ opportunity }) => {
  if (opportunity?.zltoReward == null) {
    return null;
  }

  return (
    <>
      {opportunity.zltoReward === 0 && (
        <div className="badge bg-orange-light text-orange">
          <Image
            src={iconZlto}
            alt="Icon Zlto"
            width={16}
            className="h-auto"
            sizes="100vw"
            priority={true}
          />
          <span className="ml-1">Depleted</span>
        </div>
      )}
      {opportunity.zltoReward > 0 && (
        <div className="badge bg-orange-light text-orange">
          <Image
            src={iconZlto}
            alt="Icon Zlto"
            width={16}
            className="h-auto"
            sizes="100vw"
            priority={true}
          />
          <span className="ml-1">{opportunity.zltoReward}</span>
        </div>
      )}
    </>
  );
};

export default ZltoRewardBadge;
