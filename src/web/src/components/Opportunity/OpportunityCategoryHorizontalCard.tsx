import { useCallback } from "react";
import type { OpportunityCategory } from "~/api/models/opportunity";
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

  return (
    <button
      onClick={handleClick}
      className={`group border-gray flex aspect-square cursor-pointer flex-col items-center rounded-lg bg-white px-1 py-2 shadow-md transition-colors duration-200 select-none hover:bg-gray-50`}
    >
      <div className="flex flex-col gap-2 md:gap-2">
        <div className="flex items-center justify-center">
          <AvatarImage
            icon={data.imageURL ?? null}
            alt="Organization Logo"
            size={31}
          />
        </div>

        <div className="flex grow flex-col gap-1">
          <h1 className="min-h-8x line-clamp-2 w-[112px] text-center text-xs leading-tight font-semibold whitespace-normal text-black">
            {data.name}
          </h1>

          <h6 className="text-gray-dark font-boldx text-center text-[10px]">
            {data.count} available
          </h6>
        </div>
      </div>
    </button>
  );
};

export { OpportunityCategoryHorizontalCard };
