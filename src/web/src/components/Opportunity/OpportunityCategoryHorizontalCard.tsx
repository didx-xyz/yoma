import { useCallback, useState, useEffect } from "react";
import type { OpportunityCategory } from "~/api/models/opportunity";
import { AvatarImage } from "../AvatarImage";
import { screenWidthAtom } from "~/lib/store";
import { useAtomValue } from "jotai";

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
  const [iconSize, setIconSize] = useState(screenWidth);

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
      className={`mb-4 flex aspect-square h-[140px] flex-col items-center rounded-lg p-2 shadow-lg md:h-[145px] xl:h-[120px] ${
        selected ? "bg-gray" : "bg-white"
      }`}
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
