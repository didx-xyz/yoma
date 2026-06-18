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

  const badgeClassName =
    "badge badge-sm inline-flex items-center gap-1 whitespace-nowrap bg-orange-light text-orange leading-none";
  const wrapperClassName = showToolTips
    ? "tooltip tooltip-secondary inline-flex cursor-help before:text-[0.6875rem]"
    : "inline-flex";

  return (
    <>
      {amount === 0 && (
        <span
          className={wrapperClassName}
          {...(showToolTips && { "data-tip": "ZLTO reward depleted" })}
        >
          <span className={badgeClassName}>
            <Image
              src={iconZlto}
              alt="Icon Zlto"
              width={16}
              className="h-4 w-4 shrink-0"
              sizes="100vw"
              priority={true}
            />
            <span>Depleted</span>
          </span>
        </span>
      )}
      {amount > 0 && (
        <span
          className={wrapperClassName}
          {...(showToolTips && { "data-tip": "ZLTO reward amount" })}
        >
          <span className={badgeClassName}>
            <Image
              src={iconZlto}
              alt="Icon Zlto"
              width={16}
              className="h-4 w-4 shrink-0"
              sizes="100vw"
              priority={true}
            />
            <span>{amount}</span>
          </span>
        </span>
      )}
    </>
  );
};

export default ZltoRewardBadge;
