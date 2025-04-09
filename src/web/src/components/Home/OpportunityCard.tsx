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
    <div className="h-[200px] w-[270px] overflow-hidden rounded-lg bg-white p-4 shadow-lg">
      <div className="flex">
        <div className="flex grow flex-col">
          <p className="text-gray-dark text-xs">{organisation}</p>
          <h2 className="h-[42px] overflow-hidden text-sm leading-tight font-bold text-ellipsis">
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

      <p className="text-gray-dark mt-2 h-[70px] text-xs text-ellipsis">
        {description}
      </p>

      <div className="flex items-center justify-between">
        {/* BADGES */}
        <div className="text-green-dark my-2 flex flex-row gap-2 text-xs font-bold">
          <div className="badge bg-green-light text-green h-6 rounded-md border-none px-2 whitespace-nowrap">
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
          <div className="badge bg-purple-soft text-purple-shade h-6 rounded-md border-none text-xs font-semibold">
            <IoMdPlay />
            <span className="ml-1">Started</span>
          </div>
          <div className="badge bg-yellow-light text-yellow h-6 rounded-md border-none whitespace-nowrap">
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
