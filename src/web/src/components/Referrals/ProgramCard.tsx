import Image from "next/image";
import React from "react";
import { type Program, type ProgramInfo } from "~/api/models/referrals";

interface ProgramCardProps {
  data: ProgramInfo | Program;
  onClick?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({
  data,
  onClick,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex h-[15rem] w-64 flex-col overflow-hidden rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md ${onClick ? "cursor-grab" : ""} ${className || ""}`}
    >
      <div className="flex h-full flex-col">
        {/* Row 1: Title + ZLTO */}
        <div className="flex w-full flex-row items-start justify-between">
          <div className="line-clamp-2 pr-2 text-sm leading-tight text-black">
            {data.name}
          </div>
          {(data.zltoRewardReferrer ?? 0) > 0 && (
            <div className="badge badge-sm bg-orange-light text-orange flex-shrink-0 whitespace-nowrap">
              🚀 {data.zltoRewardReferrer} ZLTO
            </div>
          )}
        </div>

        {/* Row 2: Description */}
        <div className="mt-2 mb-4">
          <p className="text-[rgba(84, 88, 89, 1)] line-clamp-3 text-xs font-light text-ellipsis">
            {data.description}
          </p>
        </div>

        {/* Row 3: Image (wide aspect) */}
        <div className="bg-base-200 relative h-32 w-full overflow-hidden rounded-sm">
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
        </div>
      </div>
    </div>
  );
};
