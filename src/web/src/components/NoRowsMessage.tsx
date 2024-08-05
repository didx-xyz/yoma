import React from "react";

const NoRowsMessage: React.FC<{
  icon?: string | null;
  title?: string | null;
  description?: string | null;
  className?: string | null;
}> = ({ icon = "🚀", title, description, className }) => {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center rounded-xl bg-white p-4 text-center ${className}`}
    >
      <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-white p-4 shadow-lg">
        {icon}
      </div>

      <div className="max-w-sm text-xs md:text-sm">
        <div className="my-2 font-semibold text-black">
          {title ?? "No rows found..."}
        </div>

        <div
          className="text-gray-dark"
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
