import Image from "next/image";
import Link from "next/link";
import { shimmer, toBase64 } from "src/lib/image";
import type { OpportunityInfo } from "~/api/models/opportunity";
import iconRocket from "public/images/icon-rocket.svg";
import iconClock from "public/images/icon-clock.svg";
import iconUser from "public/images/icon-user.svg";
import iconZlto from "public/images/icon-zlto.svg";

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
      //onClick={handleClick}
      className="flex aspect-square min-w-[300px] flex-col rounded-lg bg-white p-5 gap-1 hover:scale-105 transition relative"
    >
      <div className="flex flex-row">
        <div className="flex flex-row">
          <div className="flex flex-grow flex-col w-3/5">
            <h1 className="max-w-[220px] overflow-hidden text-ellipsis text-xs font-medium text-gray-dark">
              {data.organizationName}
            </h1>
            <h2 className="max-h-[80px] max-w-[220px] overflow-hidden text-ellipsis text-[18px] leading-tight font-semibold line-clamp-3">
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

      <div className="flex max-w-[280px] flex-row">
        <p className="line-clamp-4 text-sm font-light text-[rgba(84, 88, 89, 1)]">
        {data.description}
        </p>
      </div>

      {/* BADGES */}
      <div className="absolute bottom-5 flex flex-row gap-1 whitespace-nowrap pt-2 text-xs font-normal text-green-dark">
        <div className="badge rounded-md bg-green-light text-[12px] text-green font-semibold">
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
        <div className="badge rounded-md bg-green-light text-[12px] text-green font-semibold">Ongoing</div>
        {(data?.participantCountTotal ?? 0) > 0 && (
          <div className="badge rounded-md bg-green-light text-[12px] text-green font-semibold">
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
         <div className="badge rounded-md bg-[#FEF4D9] text-[#F6B700] font-semibold">
          <Image
            src={iconZlto}
            alt="Icon Zlto"
            width={16}
            height={16}
            sizes="100vw"
            priority={true}
            style={{ width: "16px", height: "16px" }}
          />
          <span className="ml-1 text-[12px] font-semibold">{Math.ceil(data?.zltoReward)}</span>
        </div>
        )}
      </div>
    </Link>
  );
};

export { OpportunityPublicSmallComponent };
