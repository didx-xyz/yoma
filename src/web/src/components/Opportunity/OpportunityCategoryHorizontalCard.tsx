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
      className={`group border-gray flex aspect-square cursor-pointer flex-col items-center rounded-lg px-1 py-2 duration-0 select-none`}
    >
      <div className="flex flex-col gap-2 md:gap-1">
        <div className="flex items-center justify-center">
          <AvatarImage
            icon={data.imageURL ?? null}
            alt="Organization Logo"
            size={31}
          />
        </div>

        <div className="flex grow flex-col">
          <div className="flex grow flex-col">
            <h1 className="h-8 w-[94px] text-center text-[11px] leading-tight font-semibold whitespace-normal text-black md:text-[11.3px]">
              {data.name}
            </h1>

            <h6 className="text-orange text-center text-[9px] leading-tight font-bold md:text-[10px]">
              <strong>{data.count}</strong> available
            </h6>

            {/* selected line */}
            <span
              className={`bg-green mt-1 block h-0.5 max-w-0 transition-all duration-500 ${
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
