import Image from "next/image";
import Link from "next/link";
import { shimmer, toBase64 } from "src/lib/image";
import type { OpportunityInfo } from "~/api/models/opportunity";
import iconRocket from "public/images/icon-rocket.svg";
import iconClock from "public/images/icon-clock.svg";
import iconUser from "public/images/icon-user.svg";
import iconZlto from "public/images/icon-zlto.svg";
import iconAction from "public/images/icon-action.svg";
import Moment from "react-moment";
import { DATETIME_FORMAT_HUMAN } from "~/lib/constants";

interface InputProps {
  data: OpportunityInfo;
  showGreenTopBorder?: boolean;
  //onClick?: (certificate: OpportunityInfo) => void;
  [key: string]: any;
}

const OpportunityPublicSmallComponent: React.FC<InputProps> = ({
  data,
  showGreenTopBorder,
  //onClick,
}) => {
  // // 🔔 click handler: use callback parameter
  // const handleClick = useCallback(() => {
  //   if (!onClick) return;
  //   onClick(data);
  // }, [data, onClick]);

  return (
    <Link
      href={`/opportunities/${data.id}`}
      target="_blank"
      //onClick={handleClick}
      className="relative flex aspect-square min-w-[300px] transform-gpu flex-col gap-1 rounded-lg bg-white p-5 transition-transform hover:scale-105"
    >
      <div className="flex flex-row">
        <div className="flex flex-row">
          <div className="flex w-3/5 flex-grow flex-col">
            <h1 className="max-w-[220px] overflow-hidden text-ellipsis text-xs font-medium text-gray-dark">
              {data.organizationName}
            </h1>
            <h2 className="line-clamp-3 max-h-[80px] max-w-[220px] overflow-hidden text-ellipsis text-[18px] font-semibold leading-tight">
              {data.title}
            </h2>
          </div>
          <div className="absolute right-1 top-1">
            {!data.organizationLogoURL && (
              <Image
                src={iconRocket}
                alt="Icon Rocket"
                width={80}
                height={80}
                sizes="100vw"
                priority={true}
                placeholder="blur"
                blurDataURL={`data:image/svg+xml;base64,${toBase64(
                  shimmer(288, 182),
                )}`}
                style={{
                  borderTopLeftRadius:
                    showGreenTopBorder === true ? "none" : "8px",
                  borderTopRightRadius:
                    showGreenTopBorder === true ? "none" : "8px",
                  width: "80px",
                  height: "80px",
                }}
              />
            )}
            {data.organizationLogoURL && (
              <Image
                src={data.organizationLogoURL}
                alt="Organization Logo"
                width={60}
                height={60}
                sizes="100vw"
                priority={true}
                placeholder="blur"
                blurDataURL={`data:image/svg+xml;base64,${toBase64(
                  shimmer(288, 182),
                )}`}
                style={{
                  borderTopLeftRadius:
                    showGreenTopBorder === true ? "none" : "8px",
                  borderTopRightRadius:
                    showGreenTopBorder === true ? "none" : "8px",
                  width: "60px",
                  height: "60px",
                }}
              />
            )}
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
                  <Moment format={DATETIME_FORMAT_HUMAN}>
                    {new Date(data.dateStart)}
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
                  <Moment format={DATETIME_FORMAT_HUMAN}>
                    {new Date(data.dateEnd)}
                  </Moment>
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* BADGES */}
      <div className="absolutex bottom-5x flex flex-row gap-1 whitespace-nowrap pt-2 text-xs font-normal text-green-dark">
        <div className="badge rounded-md bg-green-light text-xs font-semibold text-green">
          <Image
            src={iconClock}
            alt="Icon Clock"
            width={17}
            height={17}
            sizes="100vw"
            priority={true}
            style={{ width: "17px", height: "17px" }}
            className="mr-1"
          />
          {`${data?.commitmentIntervalCount} ${data?.commitmentInterval}`}
        </div>

        {(data?.participantCountTotal ?? 0) > 0 && (
          <div className="badge rounded-md bg-green-light text-xs font-semibold text-green">
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
          <div className="badge rounded-md bg-[#FEF4D9] font-semibold text-[#F6B700]">
            <Image
              src={iconZlto}
              alt="Icon Zlto"
              width={16}
              height={16}
              sizes="100vw"
              priority={true}
              style={{ width: "16px", height: "16px" }}
            />
            <span className="ml-1 text-xs font-semibold">
              {Math.ceil(data?.zltoReward)}
            </span>
          </div>
        )}

        {data.status == "Active" && (
          <div className="badge rounded-md bg-purple-light text-purple">
            <Image
              src={iconAction}
              alt="Icon Action"
              width={18}
              height={18}
              sizes="100vw"
              priority={true}
              style={{ width: "18px", height: "18px" }}
            />
            <span className="ml-1 text-xs font-semibold">Ongoing</span>
          </div>
        )}
        {data.status == "Expired" && (
          <div className="badge rounded-md bg-green-light text-xs font-semibold text-yellow">
            Expired
          </div>
        )}
      </div>
    </Link>
  );
};

export { OpportunityPublicSmallComponent };
