import React from "react";
import iconImage from "public/images/icon-rocket.webp";
import { RoundedImage } from "./RoundedImage";

const NoRowsMessage: React.FC<{
  title?: string | null;
  description?: string | null;
}> = ({ title, description }) => {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <RoundedImage
        icon={iconImage}
        alt="Icon Rocket"
        imageWidth={28}
        imageHeight={28}
      />

      <h2 className="text-gray-900 mb-2 mt-4 text-lg font-medium">
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
