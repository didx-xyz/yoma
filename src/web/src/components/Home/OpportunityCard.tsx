import React from "react";
import { RoundedImage } from "../RoundedImage";
import type { StaticImageData } from "next/image";
import iconClock from "public/images/icon-clock.svg";
// import iconUser from "public/images/icon-user.svg";
import iconZlto from "public/images/icon-zlto.svg";
import Image from "next/image";
import { IoMdPlay } from "react-icons/io";

const OpportunityCard: React.FC<{
  title: string;
  organisation: string;
  description: string;
  hours: number;
  ongoing: boolean;
  reward: number;
  students: number;
  image: StaticImageData;
}> = ({ title, organisation, description, hours, reward, image }) => {
  return (
    <div className="h-[200px] w-[250px] overflow-hidden rounded-lg bg-white p-4 shadow-lg">
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

      <p className="mt-2 h-[70px] text-ellipsis text-xs text-gray-dark">
        {description}
      </p>

      <div className="flex items-center justify-between">
        {/* BADGES */}
        <div className="my-2 flex flex-row gap-2 text-xs font-bold text-green-dark">
          <div className="badge h-6 whitespace-nowrap rounded-md border-none bg-green-light px-2 text-green">
            <Image
              src={iconClock}
              alt="Icon Clock"
              width={20}
              className="ml-2 h-auto"
              sizes="100vw"
              priority={true}
            />

            <span className="mx-1 mr-2 text-xs">{`${hours} hour${
              hours > 1 ? "s" : ""
            }`}</span>
          </div>
          {/* <div className="badge h-6 whitespace-nowrap rounded-md border-none bg-green-light text-green">
            <Image
              src={iconUser}
              alt="Icon User"
              width={18}
              className="h-auto"
              sizes="100vw"
              priority={true}
            />
            <span className="ml-1 text-xs">{students}</span>
          </div> */}
          <div className="badge h-6 rounded-md border-none bg-purple-soft text-xs font-semibold text-purple-shade">
            <IoMdPlay />
            <span className="ml-1">Started</span>
          </div>
          <div className="badge h-6 whitespace-nowrap rounded-md border-none bg-yellow-light text-yellow">
            <Image
              src={iconZlto}
              alt="Icon Zlto"
              width={18}
              className="h-auto"
              sizes="100vw"
              priority={true}
            />
            <span className="ml-1 text-xs">{reward}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityCard;
