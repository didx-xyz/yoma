import Image from "next/image";
import { useCallback } from "react";
import { shimmer, toBase64 } from "src/lib/image";
import type { OpportunityCategory } from "~/api/models/opportunity";
import iconRocket from "public/images/icon-rocket.svg";

interface InputProps {
  data: OpportunityCategory;
  selected?: boolean;
  onClick?: (item: OpportunityCategory) => void;
  [key: string]: any;
}

const OpportunityCategoryHorizontalCard: React.FC<InputProps> = ({
  data,
  selected,
  onClick,
}) => {
  // 🔔 click handler: use callback parameter
  const handleClick = useCallback(() => {
    if (!onClick) return;
    onClick(data);
  }, [data, onClick]);

  return (
    <button
      onClick={handleClick}
      className={`flex h-[120px] aspect-square flex-col items-center rounded-lg p-2 mb-4 shadow-lg ${
        selected ? "bg-gray" : "bg-white"
      }`}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-center">
          {!data.imageURL && (
            <Image
              src={iconRocket}
              alt="Icon Rocket"
              width={31}
              height={31}
              sizes="100vw"
              priority={true}
              placeholder="blur"
              blurDataURL={`data:image/svg+xml;base64,${toBase64(
                shimmer(288, 182),
              )}`}
              style={{
                width: "31px",
                height: "31px",
              }}
            />
          )}
          {data.imageURL && (
            <Image
              src={data.imageURL}
              alt="Organization Logo"
              width={31}
              height={31}
              sizes="100vw"
              priority={true}
              placeholder="blur"
              blurDataURL={`data:image/svg+xml;base64,${toBase64(
                shimmer(288, 182),
              )}`}
              style={{
                width: "31px",
                height: "31px",
              }}
            />
          )}
        </div>

        <div className="flex flex-grow flex-col">
          <div className="flex flex-grow flex-col gap-1">
            <h1 className="h-12 overflow-hidden text-ellipsis text-center text-xs font-semibold text-black">
              {data.name}
            </h1>
            <h6 className="text-center text-xs text-gray-dark">
              {data.count} available
            </h6>
          </div>
        </div>
      </div>
    </button>
  );
};

export { OpportunityCategoryHorizontalCard };
