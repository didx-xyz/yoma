import Image from "next/image";
import React from "react";
import type { ProgramInfo } from "~/api/models/referrals";
import { NoImage } from "../Common/NoImage";

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
      className={`border-base-300 bg-base-100 overflow-visible rounded-lg border p-4 ${className}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <button
          type="button"
          onClick={onClick}
          className={`flex min-w-0 flex-1 items-start gap-3 bg-transparent p-0 text-left ${
            onClick ? "cursor-pointer" : "cursor-default"
          }`}
        >
          {program.imageURL ? (
            <Image
              src={program.imageURL}
              alt={program.name}
              width={48}
              height={48}
              className="shrink-0 rounded-lg border border-gray-200 bg-white object-cover shadow-md"
              style={{
                width: "48px",
                height: "48px",
                minWidth: "48px",
                minHeight: "48px",
              }}
            />
          ) : (
            <div
              className="shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-md"
              style={{ width: "48px", height: "48px" }}
            >
              <NoImage iconOnly />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="font-family-nunito text-base-content block min-w-0 overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap md:text-base">
              {program.name}
            </div>
            {program.description ? (
              <div className="line-clamp-2 text-xs text-gray-500 md:text-sm">
                {program.description}
              </div>
            ) : null}
          </div>
        </button>

        {action ? (
          <div className="hidden flex-shrink-0 self-start md:block">
            {action}
          </div>
        ) : null}
      </div>

      {children ? <div>{children}</div> : null}

      {action ? <div className="mt-3 md:hidden">{action}</div> : null}
    </div>
  );
};
