import Image from "next/image";
import Link from "next/link";
import { IoMdClock, IoMdPerson } from "react-icons/io";
import { shimmer, toBase64 } from "src/lib/image";
import type { OpportunityInfo } from "~/api/models/opportunity";
import iconRocket from "public/images/icon-rocket.svg";

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
      href={`/opportunities/opportunity/${data.id}`}
      //onClick={handleClick}
      className="flex h-[285px] min-w-[310px] flex-col rounded-lg bg-white p-3"
    >
      <div className="flex flex-row">
        <div className="flex flex-grow flex-row">
          <div className="flex flex-grow flex-col">
            <h1 className="max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-dark">
              {data.organizationName}
            </h1>
            <h2 className="max-h-[75px] max-w-[220px] overflow-hidden text-ellipsis text-base font-bold">
              {data.title}
            </h2>
          </div>
          <div className="flex flex-row items-start">
            {!data.organizationLogoURL && (
              <Image
                src={iconRocket}
                alt="Icon Rocket"
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

      <div className="flex max-w-[280px] flex-grow flex-row overflow-hidden text-ellipsis">
        {data.description}
      </div>

      <div className="flex flex-row items-end gap-1 overflow-hidden whitespace-nowrap pt-2 text-xs font-normal text-green-dark">
        <div className="badge bg-green-light">
          <IoMdClock className="mr-2 h-4 w-4" />
          {`${data?.commitmentIntervalCount} ${data?.commitmentInterval}`}
        </div>
        {(data?.participantCountTotal ?? 0) > 0 && (
          <div className="badge bg-green-light">
            <IoMdPerson className="mr-2 h-4 w-4" />
            {data?.participantCountTotal} enrolled
          </div>
        )}
        <div className="badge bg-green-light">Ongoing</div>
      </div>
    </Link>
  );
};

export { OpportunityPublicSmallComponent };
