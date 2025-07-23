import React from "react";
import { AvatarImage } from "../AvatarImage";

const SocialPreview: React.FC<{
  name: string | null | undefined;
  description: string | null | undefined;
  logoURL: string | null | undefined;
  organizationName: string | null | undefined;
}> = ({ name, description, logoURL, organizationName }) => {
  // Function to remove markdown characters from text
  const stripMarkdown = (text: string | null | undefined): string => {
    if (!text) return "";
    return text
      .replace(/[#*_~`]/g, "") // Remove common markdown characters
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Convert links to plain text
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1") // Convert images to alt text
      .trim();
  };

  return (
    <div className="border-gray flex w-full flex-col rounded-lg border-2 border-dotted p-4">
      <div className="flex gap-4">
        <AvatarImage
          icon={logoURL ?? null}
          alt={`${organizationName} Logo`}
          size={60}
        />

        <div className="flex max-w-[200px] flex-col gap-1 sm:max-w-[480px] md:max-w-[420px]">
          <h4 className="overflow-hidden text-sm leading-7 font-semibold text-ellipsis whitespace-nowrap text-black md:text-xl md:leading-8">
            {name}
          </h4>
          <h6 className="text-gray-dark overflow-hidden text-xs text-ellipsis whitespace-nowrap">
            {stripMarkdown(description)}
          </h6>
        </div>
      </div>
    </div>
  );
};

export default SocialPreview;
