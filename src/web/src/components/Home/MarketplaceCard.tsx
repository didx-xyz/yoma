import React from "react";
import { RoundedImage } from "../RoundedImage";
import type { StaticImageData } from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import Image from "next/image";

const MarketplaceCard: React.FC<{
  title: string;
  organisation: string;
  zlto: number;
  image: StaticImageData;
}> = ({ title, organisation, zlto, image }) => {
  return (
    <div className="h-[140px] w-[270px] overflow-hidden rounded-lg bg-white p-4 shadow-lg">
      <div className="flex">
        <div className="flex flex-grow flex-col">
          <p className="text-xs text-gray-dark">{organisation}</p>
          <h2 className="h-[42px] overflow-hidden text-ellipsis text-sm font-bold leading-tight">
            {title}
          </h2>
        </div>
        <div className="flex">
          <RoundedImage
            icon={image}
            alt="Organisation logo"
            containerSize={40}
            imageSize={40}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        {/* BADGES */}
        <div className="badge h-6 whitespace-nowrap rounded-md border-none bg-yellow-light text-yellow">
          <Image
            src={iconZlto}
            alt="Icon Zlto"
            width={18}
            className="h-auto"
            sizes="100vw"
            priority={true}
          />
          <span className="ml-1 text-xs">{zlto}</span>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceCard;
