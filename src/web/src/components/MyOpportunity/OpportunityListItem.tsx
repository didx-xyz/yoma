import Image from "next/image";
import Link from "next/link";
import { shimmer, toBase64 } from "src/lib/image";
import type { MyOpportunityInfo } from "~/api/models/myOpportunity";
import iconRocket from "public/images/icon-rocket.svg";
import iconClock from "public/images/icon-clock.svg";
import iconUser from "public/images/icon-user.svg";
import iconZlto from "public/images/icon-zlto.svg";
import Moment from "react-moment";
import { DATETIME_FORMAT_HUMAN } from "~/lib/constants";

interface InputProps {
  data: MyOpportunityInfo;
  //onClick?: (certificate: OpportunityInfo) => void;
  [key: string]: any;
}

const OpportunityListItem: React.FC<InputProps> = ({
  data,
  //onClick,
}) => {
  // // 🔔 click handler: use callback parameter
  // const handleClick = useCallback(() => {
  //   if (!onClick) return;
  //   onClick(data);
  // }, [data, onClick]);

  return (
    <div
      //href={`/opportunities/${data.id}`}
      //onClick={handleClick}
      className="flex max-h-[250px] flex-col gap-1 rounded-lg border-[1px] border-gray bg-white px-5 py-2"
    >
      <div className="flex flex-row gap-2  overflow-hidden text-ellipsis">
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
              width: "60px",
              height: "60px",
            }}
          />
        )}

        <div className="flex flex-grow flex-col items-center justify-center gap-1">
          <h1 className="w-full overflow-hidden text-ellipsis text-xs font-medium text-gray-dark">
            {data.organizationName}
          </h1>
          <h2 className="line-clamp-3 w-full overflow-hidden text-ellipsis whitespace-nowrap text-[18px] font-semibold leading-tight">
            {data.opportunityTitle}
          </h2>
        </div>
      </div>

      <div className="flex h-full max-h-[60px] flex-row">
        <p className="text-[rgba(84, 88, 89, 1)] line-clamp-4 text-sm font-light">
          {data.opportunityDescription}
        </p>
      </div>

      <div className="mt-2 flex flex-col gap-4">
        {/* SKILLS */}
        <div className="flex flex-row">
          <h4 className="line-clamp-4 text-sm font-bold">Skills developed</h4>
        </div>
        <div className="flex flex-row gap-2">
          <div className="rozunded-md badge bg-green-light text-[12px] font-semibold text-green">
            TODO 1
          </div>
          <div className="badge rounded-md bg-green-light text-[12px] font-semibold text-green">
            TODO 2
          </div>
          <div className="badge rounded-md bg-green-light text-[12px] font-semibold text-green">
            TODO 2
          </div>
        </div>

        {/* DATE */}
        <div className="flex flex-row">
          <h4 className="line-clamp-4 text-sm font-thin">
            <Moment format={DATETIME_FORMAT_HUMAN}>
              {new Date(data.dateCompleted!)}
            </Moment>
          </h4>
        </div>
      </div>
    </div>
  );
};

export { OpportunityListItem };
