import Image from "next/image";
import Link from "next/link";
import type { OpportunityInfo } from "~/api/models/opportunity";
import iconClock from "public/images/icon-clock.svg";
import iconUser from "public/images/icon-user.svg";
import iconZlto from "public/images/icon-zlto.svg";
import Moment from "react-moment";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import {
  IoMdCalendar,
  IoMdPlay,
  IoMdCloudUpload,
  IoMdWarning,
} from "react-icons/io";
import { AvatarImage } from "../AvatarImage";
interface InputProps {
  data: OpportunityInfo;
  preview?: boolean;
  [key: string]: any;
}

const OpportunityPublicSmallComponent: React.FC<InputProps> = ({
  data,
  preview,
}) => {
  const renderContent = () => {
    return (
      <>
        <div className="flex flex-row">
          <div className="flex flex-row">
            <div className="flex w-3/5 flex-grow flex-col">
              <h1 className="h-[32px] max-w-[180px] overflow-hidden text-ellipsis text-xs font-medium text-gray-dark md:max-w-[160px] xl:max-w-[200px]">
                {data.organizationName}
              </h1>
              <h2 className="mt-1 line-clamp-2 h-[45px] max-w-[180px] overflow-hidden text-ellipsis text-[18px] font-semibold leading-tight md:mt-4 md:max-w-[210px] xl:mt-1">
                {data.title}
              </h2>
            </div>
            <div className="absolute right-4 top-3">
              <AvatarImage
                icon={data?.organizationLogoURL ?? null}
                alt="Company Logo"
                size={50}
              />
            </div>
          </div>
        </div>
        <div className="mb-auto mt-0 flex max-w-[280px] flex-row md:mt-2 xl:mt-0">
          <p className="text-[rgba(84, 88, 89, 1)] line-clamp-4 text-ellipsis text-sm font-light">
            {data.summary ?? data.description}
          </p>
        </div>

        {/* DATES */}
        {data.status == "Active" && data.dateEnd && (
          <div className="flex flex-row items-center text-sm text-gray-dark">
            <span className="mr-2 font-bold">Ends:</span>
            <span className="text-xs tracking-widest text-black">
              <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                {data.dateEnd}
              </Moment>
            </span>
          </div>
        )}

        {/* BADGES */}
        <div className="flex flex-row flex-wrap gap-2 overflow-hidden whitespace-normal pt-2 text-green-dark md:flex-nowrap md:whitespace-nowrap">
          <div className="badge bg-green-light text-green">
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
            <div className="badge bg-green-light text-green">
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
            <div className="badge bg-[#FEF4D9] text-[#F6B700]">
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
                <div className="badge bg-yellow-tint text-yellow">
                  <IoMdCalendar className="h-4 w-4" />
                  <Moment
                    format={DATE_FORMAT_HUMAN}
                    utc={true}
                    className="ml-1"
                  >
                    {data.dateStart}
                  </Moment>
                </div>
              )}
              {new Date(data.dateStart) < new Date() && (
                <div className="badge bg-purple-tint text-purple-shade">
                  <IoMdPlay />
                  <span className="ml-1">Ongoing</span>
                </div>
              )}
            </>
          )}
          {data.status == "Expired" && (
            <>
              {data.verificationEnabled &&
                data.verificationMethod === "Manual" && (
                  <>
                    {data?.participantLimit != null &&
                      data.participantLimitReached && (
                        <div className="badge bg-red-200 text-red-400">
                          <IoMdWarning className="h-4 w-4" />
                          <span className="ml-1">Limit Reached</span>
                        </div>
                      )}
                    {!data.participantLimitReached && (
                      <div className="badge bg-red-100 text-error">
                        <IoMdCloudUpload className="h-4 w-4" />
                        <span className="ml-1">Upload Only</span>
                      </div>
                    )}
                  </>
                )}
              {!data.verificationEnabled &&
                data.verificationMethod !== "Manual" && (
                  <div className="badge bg-red-100 text-error">
                    <IoMdWarning className="h-4 w-4" />
                    <span className="ml-1">Expired</span>
                  </div>
                )}
            </>
          )}
        </div>
      </>
    );
  };

  return preview ? (
    <div className="relative flex h-[19.2rem] w-[88vw] flex-col gap-1 overflow-hidden rounded-lg bg-white p-4 shadow-2xl md:w-[15rem] xl:w-[19.2rem]">
      {renderContent()}
    </div>
  ) : (
    <Link
      href={`/opportunities/${data.id}`}
      className="relative flex h-[19.2rem] w-[88vw] flex-col gap-1 overflow-hidden rounded-lg bg-white p-4 shadow-sm md:w-[15rem] xl:w-[19.2rem]"
    >
      {renderContent()}
    </Link>
  );
};

export { OpportunityPublicSmallComponent };
