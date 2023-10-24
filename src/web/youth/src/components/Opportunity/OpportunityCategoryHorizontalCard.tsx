import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import { shimmer, toBase64 } from "src/lib/image";
import type { OpportunityCategory } from "~/api/models/opportunity";
import iconRocket from "public/images/icon-rocket.svg";

interface InputProps {
  data: OpportunityCategory;
  showGreenTopBorder?: boolean;
  onClick?: (certificate: OpportunityCategory) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const OpportunityCategoryHorizontalCard: React.FC<InputProps> = ({
  data,
  showGreenTopBorder,
  onClick,
}) => {
  // 🔔 click handler: use callback parameter
  const handleClick = useCallback(() => {
    if (!onClick) return;
    onClick(data);
  }, [data, onClick]);

  return (
    <Link
      href={`/opportunities/opportunity/${data.id}`}
      onClick={handleClick}
      className="flex h-[140px] w-[140px] flex-col rounded-lg bg-white p-2"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-center">
          {!data.imageURL && (
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
          {data.imageURL && (
            <Image
              src={data.imageURL}
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

        <div className="flex flex-grow flex-row">
          <div className="flex flex-grow flex-col gap-1">
            <h1 className="h-10 overflow-hidden text-ellipsis text-center text-sm font-semibold text-black">
              {data.name}
            </h1>
            <h6 className="text-center text-sm text-gray-dark">43 available</h6>
          </div>
        </div>
      </div>
    </Link>
  );
};

export { OpportunityCategoryHorizontalCard };
