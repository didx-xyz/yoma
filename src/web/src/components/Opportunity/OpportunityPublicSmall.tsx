import Image from "next/image";
import Link from "next/link";
import type { OpportunityInfo } from "~/api/models/opportunity";
import iconRocket from "public/images/icon-rocket.webp";
import iconClock from "public/images/icon-clock.svg";
import iconUser from "public/images/icon-user.svg";
import iconZlto from "public/images/icon-zlto.svg";
import Moment from "react-moment";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import { RoundedImage } from "../RoundedImage";
import { IoMdPause, IoMdPlay, IoMdClose } from "react-icons/io";

interface InputProps {
  data: OpportunityInfo;
  [key: string]: any;
}

const OpportunityPublicSmallComponent: React.FC<InputProps> = ({ data }) => {
  return (
    <Link
      href={`/opportunities/${data.id}`}
      target="_blank"
      className="relative flex aspect-square min-w-[300px] transform-gpu flex-col gap-1 rounded-lg bg-white p-5 transition-transform hover:scale-105"
    >
      <div className="flex flex-row">
        <div className="flex flex-row">
          <div className="flex w-3/5 flex-grow flex-col">
            <h1 className="h-[32px] max-w-[220px] overflow-hidden text-ellipsis text-xs font-medium text-gray-dark">
              {data.organizationName}
            </h1>
            <h2 className="line-clamp-3 h-[70px] max-w-[220px] overflow-hidden text-ellipsis text-[18px] font-semibold leading-tight">
              {data.title}
            </h2>
          </div>
          <div className="absolute right-1 top-1">
            <RoundedImage
              icon={data?.organizationLogoURL ?? iconRocket}
              alt="Company Logo"
              imageWidth={40}
              imageHeight={40}
              containerWidth={50}
              containerHeight={50}
            />
          </div>
        </div>
      </div>
      <div className="flex max-w-[280px] flex-grow flex-row">
        <p className="text-[rgba(84, 88, 89, 1)] line-clamp-4 text-sm font-light">
          {data.description}
        </p>
      </div>

      {/* DATES */}
      {data.status == "Active" && (
        <div className="flex flex-col text-sm text-gray-dark">
          <div>
            {data.dateStart && (
              <>
                <span className="mr-2 font-bold">Starts:</span>
                <span className="text-xs tracking-widest text-black">
                  <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                    {data.dateStart}
                  </Moment>
                </span>
              </>
            )}
          </div>
          <div>
            {data.dateEnd && (
              <>
                <span className="mr-2 font-bold">Ends:</span>
                <span className="text-xs tracking-widest text-black">
                  <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                    {data.dateEnd}
                  </Moment>
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* BADGES */}
      <div className="bottom-5x flex flex-row gap-1 whitespace-nowrap pt-2 font-semibold text-green-dark">
        <div className="badge h-6 rounded-md border-none bg-green-light text-xs text-green">
          <Image
            src={iconClock}
            alt="Icon Clock"
            width={17}
            height={17}
            sizes="100vw"
            priority={true}
            style={{ width: "18px", height: "18px" }}
          />
          <span className="ml-1">{`${data.commitmentIntervalCount} ${
            data.commitmentInterval
          }${data.commitmentIntervalCount > 1 ? "s" : ""}`}</span>
        </div>

        {(data?.participantCountTotal ?? 0) > 0 && (
          <div className="badge h-6 rounded-md border-none bg-green-light text-xs text-green">
            <Image
              src={iconUser}
              alt="Icon User"
              width={16}
              height={16}
              sizes="100vw"
              priority={true}
              style={{ width: "16px", height: "16px" }}
              className="mr-1"
            />
            {data?.participantCountTotal}
          </div>
        )}

        {data.zltoReward && (
          <div className="badge h-6 rounded-md border-none bg-[#FEF4D9] text-xs text-[#F6B700]">
            <Image
              src={iconZlto}
              alt="Icon Zlto"
              width={16}
              height={16}
              sizes="100vw"
              priority={true}
              style={{ width: "16px", height: "16px" }}
            />
            <span className="ml-1">{Math.ceil(data?.zltoReward)}</span>
          </div>
        )}

        {data?.status == "Active" && (
          <>
            {new Date(data.dateStart) > new Date() && (
              <div className="badge h-6 rounded-md border-none bg-orange-light text-xs text-orange">
                <IoMdPause />
                <p className="ml-1">Not started</p>
              </div>
            )}
            {new Date(data.dateStart) < new Date() && (
              <div className="badge h-6 rounded-md border-none bg-purple-soft text-xs font-semibold text-purple-shade">
                <IoMdPlay />
                <span className="ml-1">Started</span>
              </div>
            )}
          </>
        )}
        {data.status == "Expired" && (
          <div className="badge h-6 rounded-md border-none bg-red-100 text-xs font-semibold text-error">
            <IoMdClose className="h-4 w-4" />
            <span className="ml-1">Expired</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export { OpportunityPublicSmallComponent };
