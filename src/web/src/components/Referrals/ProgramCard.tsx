import Image from "next/image";
import React from "react";
import { type Program, type ProgramInfo } from "~/api/models/referrals";

interface ProgramCardProps {
  data: ProgramInfo | Program;
  zltoReward: number | null;
  onClick?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({
  data,
  zltoReward,
  onClick,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex h-[15rem] w-64 flex-col overflow-hidden rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md ${onClick ? "cursor-grab" : ""} ${className || ""}`}
    >
      <div className="flex h-full flex-col">
        {/* Row 1: Title */}
        <div className="flex w-full flex-row items-start justify-between">
          <div className="line-clamp-2 pr-2 text-sm leading-tight text-black">
            {data.name}
          </div>
        </div>

        {/* Row 2: Description */}
        <div className="mt-2 mb-4">
          <p className="text-[rgba(84, 88, 89, 1)] line-clamp-3 text-xs font-light text-ellipsis">
            {data.description}
          </p>
        </div>

        {/* Row 3: Image (wide aspect) */}
        <div className="bg-base-200 relative mt-auto h-32 w-full overflow-hidden rounded-sm">
          {data.imageURL ? (
            <Image
              src={data.imageURL}
              alt={data.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="bg-orange h-full w-full opacity-70"></div>
          )}
          {(zltoReward ?? 0) > 0 && (
            <div className="badge badge-sm text-orange absolute right-1 bottom-1 flex-shrink-0 bg-white/95 whitespace-nowrap shadow-lg backdrop-blur-sm">
              🚀 {zltoReward} ZLTO
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
