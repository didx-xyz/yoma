import React from "react";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { AvatarImage } from "../AvatarImage";
import ZltoRewardBadge from "./Badges/ZltoRewardBadge";
import {
  getTypeConfig,
  OpportunityEngagementTypeBadge,
  OpportunityMetaTextRow,
  OpportunityTypeBadge,
} from "./opportunityTypeTheme";

const SocialPreview: React.FC<{
  name: string | null | undefined;
  description: string | null | undefined;
  logoURL: string | null | undefined;
  organizationName: string | null | undefined;
  // when supplied, the type / engagement / reward badges and the meta line are shown
  opportunity?: OpportunityInfo | null;
}> = ({ name, description, logoURL, organizationName, opportunity }) => {
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
    <div className="border-gray flex w-full min-w-0 flex-col rounded-lg border-2 border-dotted p-4">
      <div className="flex min-w-0 gap-4">
        <AvatarImage
          icon={logoURL ?? null}
          alt={`${organizationName} Logo`}
          size={60}
        />

        <div className="flex min-w-0 flex-col gap-1 sm:max-w-[480px] md:max-w-[420px]">
          <h4 className="overflow-hidden text-sm leading-7 font-semibold text-ellipsis whitespace-nowrap text-black md:text-xl md:leading-8">
            {name}
          </h4>
          <h6 className="text-gray-dark overflow-hidden text-xs text-ellipsis whitespace-nowrap">
            {stripMarkdown(description)}
          </h6>
        </div>
      </div>

      {/* BADGES */}
      {opportunity && (
        <div className="mt-4 mb-2 flex min-w-0 flex-col gap-2 md:my-2">
          {/* single line: badges that don't fit truncate rather than wrapping */}
          <div className="flex min-w-0 flex-row flex-nowrap items-center gap-2 overflow-hidden">
            <OpportunityTypeBadge
              data={opportunity}
              className={getTypeConfig(opportunity.type).badgeClassName}
            />
            <OpportunityEngagementTypeBadge
              data={opportunity}
              className={"bg-gray-light text-gray-dark"}
            />
            {opportunity.zltoRewardEstimate != null && (
              <ZltoRewardBadge amount={opportunity.zltoRewardEstimate} />
            )}
          </div>
          <OpportunityMetaTextRow data={opportunity} />
        </div>
      )}
    </div>
  );
};

export default SocialPreview;
