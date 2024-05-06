import React from "react";
import { AvatarImage } from "../AvatarImage";

const SocialPreview: React.FC<{
  name: string | null | undefined;
  description: string | null | undefined;
  logoURL: string | null | undefined;
  organizationName: string | null | undefined;
}> = ({ name, description, logoURL, organizationName }) => {
  return (
    <div className="flex w-full flex-col rounded-lg border-2 border-dotted border-gray p-4">
      <div className="flex gap-4">
        <AvatarImage
          icon={logoURL ?? null}
          alt={`${organizationName} Logo`}
          size={60}
        />

        <div className="flex max-w-[200px] flex-col gap-1 sm:max-w-[480px] md:max-w-[420px]">
          <h4 className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold leading-7 text-black md:text-xl md:leading-8">
            {name}
          </h4>
          <h6 className=" overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-dark">
            {description}
          </h6>
        </div>
      </div>
    </div>
  );
};

export default SocialPreview;
