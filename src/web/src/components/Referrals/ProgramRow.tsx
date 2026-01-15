import React from "react";
import type { ProgramInfo } from "~/api/models/referrals";
import { ProgramImage } from "./ProgramImage";

interface ProgramRowProps {
  program: ProgramInfo;
  onClick?: () => void;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const ProgramRow: React.FC<ProgramRowProps> = ({
  program,
  onClick,
  action,
  className = "",
  children,
}) => {
  return (
    <div
      className={`border-base-300 bg-base-100 overflow-visible rounded-lg border ${className}`}
    >
      <div className="flex items-start gap-3 p-4">
        <button
          type="button"
          onClick={onClick}
          className={`flex min-w-0 flex-1 items-start gap-3 bg-transparent p-0 text-left ${
            onClick ? "cursor-pointer" : "cursor-default"
          }`}
        >
          <div className="flex-shrink-0">
            <ProgramImage
              imageURL={program.imageURL}
              name={program.name}
              size={40}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-family-nunito text-base-content block min-w-0 overflow-hidden text-xs font-semibold text-ellipsis whitespace-nowrap md:text-sm">
              {program.name}
            </div>
            {program.description ? (
              <div className="mt-1 line-clamp-2 text-[10px] text-gray-500 md:text-xs">
                {program.description}
              </div>
            ) : null}
          </div>
        </button>

        {action ? <div className="flex-shrink-0">{action}</div> : null}
      </div>

      {children ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
};
