import React, { type ReactNode } from "react";

const NoRowsMessage: React.FC<{
  icon?: string | ReactNode | null;
  title?: string | null;
  subTitle?: string | null;
  description?: string | null;
  className?: string | null;
  classNameIcon?: string | null;
}> = ({
  icon = "⚠️",
  title,
  subTitle,
  description,
  className,
  classNameIcon = "text-xl",
}) => {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center rounded-xl bg-white p-4 text-center ${className}`}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-white p-2 shadow-lg ${classNameIcon}`}
      >
        {icon}
      </div>

      <div className="mt-1">
        <div className="my-2 text-black md:text-sm">
          <div className="text-sm font-semibold md:text-lg">
            {title ?? "No rows found..."}
          </div>

          {subTitle && (
            <div className="text-gray-dark mt-1 text-xs md:text-sm">
              {subTitle}
            </div>
          )}
        </div>

        <div
          className="text-gray-dark text-xs md:text-sm"
          dangerouslySetInnerHTML={{
            __html:
              description ??
              "There are no rows to display at the moment. Please check back later.",
          }}
        ></div>
      </div>
    </div>
  );
};

export default NoRowsMessage;
