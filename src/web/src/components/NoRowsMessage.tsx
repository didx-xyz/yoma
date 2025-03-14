import React, { type ReactNode } from "react";

const NoRowsMessage: React.FC<{
  icon?: string | ReactNode | null;
  title?: string | null;
  description?: string | null;
  className?: string | null;
  classNameIcon?: string | null;
}> = ({
  icon = "⚠️",
  title,
  description,
  className,
  classNameIcon = "text-xl",
}) => {
  return (
    <div
      className={`flex h-full min-h-60 w-full flex-col items-center justify-center rounded-xl bg-white p-4 text-center ${className}`}
    >
      <div
        className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ${classNameIcon}`}
      >
        {icon}
      </div>

      <div className="max-w-lg">
        <div className="my-2 font-semibold text-black md:text-sm">
          <div className="text-sm md:text-lg">
            {title ?? "No rows found..."}
          </div>
        </div>

        <div
          className="text-xs text-gray-dark md:text-sm"
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
