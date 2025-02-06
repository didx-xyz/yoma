import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import React from "react";

const ZltoRewardBadge: React.FC<{
  amount: number | null;
}> = ({ amount }) => {
  if (amount == null) {
    return null;
  }

  return (
    <>
      {amount === 0 && (
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
      {amount > 0 && (
        <div className="badge bg-orange-light text-orange">
          <Image
            src={iconZlto}
            alt="Icon Zlto"
            width={16}
            className="h-auto"
            sizes="100vw"
            priority={true}
          />
          <span className="ml-1">{amount}</span>
        </div>
      )}
    </>
  );
};

export default ZltoRewardBadge;
