import React from "react";
import iconImage from "public/images/icon-rocket.webp";
import Image from "next/image";

const NoRowsMessage: React.FC<{
  title?: string | null;
  description?: string | null;
}> = ({ title, description }) => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1">
      {/* eslint-disable */}
      <Image
        src={iconImage}
        alt="Logo"
        priority={true}
        width={0}
        height={0}
        sizes="100vw"
        style={{ width: "100%", height: "auto", maxWidth: "100px" }}
      />
      {/* eslint-enable */}

      <h2 className="text-gray-900 mb-2 text-lg font-medium">
        {title ?? "No rows found"}
      </h2>
      <p className="text-gray-500 text-center">
        {description ??
          "There are no rows to display at the moment. Please check back later."}
      </p>
    </div>
  );
};

export default NoRowsMessage;
