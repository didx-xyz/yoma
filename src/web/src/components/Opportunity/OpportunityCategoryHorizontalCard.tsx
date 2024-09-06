import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import type { OpportunityCategory } from "~/api/models/opportunity";
import { screenWidthAtom } from "~/lib/store";
import { AvatarImage } from "../AvatarImage";

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
  const screenWidth = useAtomValue(screenWidthAtom);
  const [iconSize, setIconSize] = useState(31);

  useEffect(() => {
    if (screenWidth < 1024) {
      setIconSize(40);
    } else {
      setIconSize(31);
    }
  }, [screenWidth, setIconSize]);

  return (
    <button
      onClick={handleClick}
      className={`group flex aspect-square flex-col items-center rounded-lg border-gray px-1 py-2 duration-0`}
    >
      <div className="flex flex-col gap-2 md:gap-1">
        <div className="flex items-center justify-center">
          <AvatarImage
            icon={data.imageURL ?? null}
            alt="Organization Logo"
            size={iconSize}
          />
        </div>

        <div className="flex flex-grow flex-col">
          <div className="flex flex-grow flex-col">
            <h1 className="h-8 w-[94px] whitespace-normal text-center text-[11px] font-semibold leading-tight text-black">
              {data.name}
            </h1>

            <h6 className="text-center text-[9px] font-bold leading-tight text-orange">
              <strong>{data.count}</strong> available
            </h6>

            {/* selected line */}
            <span
              className={`mt-1 block h-0.5 max-w-0 bg-green transition-all duration-500 ${
                selected ? "max-w-full" : "group-hover:max-w-full"
              }`}
            ></span>
          </div>
        </div>
      </div>
    </button>
  );
};

export { OpportunityCategoryHorizontalCard };
