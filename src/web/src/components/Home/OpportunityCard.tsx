import React, { ReactElement } from "react";
import { RoundedImage } from "../RoundedImage";
import { StaticImageData } from "next/image";
import iconClock from "public/images/icon-clock.svg";
import iconUser from "public/images/icon-user.svg";
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
  // width: number;
  // height: number;
}> = ({
  title,
  organisation,
  description,
  hours,
  ongoing,
  reward,
  students,
  image,
  // width,
  // height,
}) => {
  return (
    <div
      className="h-[200px] w-[250px] overflow-hidden rounded-lg bg-white p-4 shadow-lg"
      //className="overflow-hidden rounded-lg bg-white p-4 shadow-lg"
      //style={{ width: width, height: height }}
    >
      <div className="flex">
        <div className="flex flex-grow flex-col">
          <p className="text-xs text-gray-dark">{organisation}</p>
          <h2 className="max-h-[42px] overflow-hidden text-ellipsis text-sm font-bold leading-tight">
            {title}
          </h2>
        </div>
        <div className="flex">
          <RoundedImage
            icon={image}
            alt="Organisation logo"
            containerWidth={40}
            containerHeight={40}
            imageWidth={40}
            imageHeight={40}
          />
        </div>
      </div>

      <p className="mt-2 h-[90px] overflow-hidden text-ellipsis text-xs text-gray-dark">
        {description}
      </p>

      <div className="flex items-center justify-between">
        {/* BADGES */}
        <div className="my-2 flex flex-row gap-1 text-xs font-bold text-green-dark">
          <div className="badge h-6 whitespace-nowrap rounded-md border-none bg-green-light text-green">
            <Image
              src={iconClock}
              alt="Icon Clock"
              width={20}
              height={20}
              sizes="100vw"
              priority={true}
              style={{ width: "20px", height: "20px" }}
            />

            <span className="ml-1 text-xs">{`${hours} hour${
              hours > 1 ? "s" : ""
            }`}</span>
          </div>
          <div className="badge h-6 whitespace-nowrap rounded-md border-none bg-green-light text-green">
            <Image
              src={iconUser}
              alt="Icon User"
              width={18}
              height={18}
              sizes="100vw"
              priority={true}
              style={{ width: "18px", height: "18px" }}
            />
            <span className="ml-1 text-xs">{students}</span>
          </div>
          <div className="badge h-6 rounded-md border-none bg-purple-soft text-xs font-semibold text-purple-shade">
            <IoMdPlay />
            <span className="ml-1">Started</span>
          </div>
          <div className="badge h-6 whitespace-nowrap rounded-md border-none bg-yellow-light text-yellow">
            <Image
              src={iconZlto}
              alt="Icon Zlto"
              width={18}
              height={18}
              sizes="100vw"
              priority={true}
              style={{ width: "18px", height: "18px" }}
            />
            <span className="ml-1 text-xs">{reward}</span>
          </div>
        </div>
        {/* {ongoing ? (
          <span className="bg-green-200 text-green-700 mr-2 inline-block rounded-full px-3 py-1 text-sm font-semibold">
            Ongoing
          </span>
        ) : null} */}

        {/* Add your own logic to display star icons based on the rating */}
        {/* <div>{rating} ⭐</div> */}

        {/* Add your own logic to format the student count, e.g., "500" to "500 students" */}
        {/* <div>{students} 👥</div> */}
      </div>
    </div>
  );
};

export default OpportunityCard;
