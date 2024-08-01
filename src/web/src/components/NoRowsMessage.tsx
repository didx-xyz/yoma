import React from "react";

const NoRowsMessage: React.FC<{
  icon?: string | null;
  title?: string | null;
  description?: string | null;
}> = ({ icon = "🚀", title, description }) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-white p-4 text-center">
      <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-white p-4 shadow-lg">
        {icon}
      </div>

      <div className="max-w-sm">
        <div className="my-2 font-semibold text-black">
          {title ?? "No rows found"}
        </div>

        <div
          className="text-sm text-gray-dark"
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
