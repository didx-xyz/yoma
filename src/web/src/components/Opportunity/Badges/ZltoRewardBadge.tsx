import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import React from "react";

const ZltoRewardBadge: React.FC<{
  amount: number | null;
  showToolTips?: boolean;
}> = ({ amount, showToolTips = false }) => {
  if (amount == null) {
    return null;
  }

  return (
    <>
      {amount === 0 && (
        <div
          className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
          {...(showToolTips && { "data-tip": "ZLTO reward depleted" })}
        >
          <span className="badge badge-sm bg-orange-light text-orange whitespace-nowrap">
            <Image
              src={iconZlto}
              alt="Icon Zlto"
              width={16}
              className="h-auto"
              sizes="100vw"
              priority={true}
            />
            <span className="ml-1">Depleted</span>
          </span>
        </div>
      )}
      {amount > 0 && (
        <div
          className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
          {...(showToolTips && { "data-tip": "ZLTO reward amount" })}
        >
          <span className="badge badge-sm bg-orange-light text-orange whitespace-nowrap">
            <Image
              src={iconZlto}
              alt="Icon Zlto"
              width={16}
              className="h-auto"
              sizes="100vw"
              priority={true}
            />
            <span className="ml-1">{amount}</span>
          </span>
        </div>
      )}
    </>
  );
};

export default ZltoRewardBadge;
