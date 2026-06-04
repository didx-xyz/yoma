import Link from "next/link";
import type { OpportunityInfo } from "~/api/models/opportunity";
import ZltoRewardBadge from "./Badges/ZltoRewardBadge";

interface InputProps {
  data: OpportunityInfo;
  preview?: boolean;
  [key: string]: any;
}

// V2 of OpportunityPublicSmallComponent — used exclusively for Job opportunities.
// Renders a job-styled card with an "Apply with YoID" call-to-action.
const OpportunityPublicSmallComponentV2: React.FC<InputProps> = ({ data }) => {
  const engagementType =
    typeof data.engagementType === "string" ? data.engagementType : null;

  const countries =
    data.countries
      ?.map((c) => c.name)
      .filter(Boolean)
      .join(", ") ?? null;

  // limit the number of skill badges shown
  const MAX_SKILLS = 3;
  const skills = data.skills ?? [];
  const visibleSkills = skills.slice(0, MAX_SKILLS);
  const remainingSkills = skills.length - visibleSkills.length;

  const renderContent = () => {
    return (
      <div className="items-between flex h-full flex-col gap-2">
        {/* ENGAGEMENT TYPE BADGE */}
        <div className="flex flex-row">
          <span className="bg-purple font-family-nunito flex h-6 items-center rounded-md px-3 text-xs font-bold tracking-wide text-white uppercase">
            Job{engagementType ? ` · ${engagementType}` : ""}
          </span>
        </div>

        {/* TITLE */}
        <div className="mt-1x font-family-nunito flex h-10 items-center overflow-hidden text-base leading-tight font-bold text-black">
          <span className="line-clamp-2 text-ellipsis">{data.title}</span>
        </div>

        {/* ORGANISATION + COUNTRIES */}
        <div className="text-gray-dark flex min-w-0 text-sm">
          <span className="max-w-[50%] truncate font-semibold text-black">
            {data.organizationName}
          </span>
          {countries && <span className="truncate"> · {countries}</span>}
        </div>

        {/* ZLTO REWARD ESTIMATE (salary not available yet) */}
        {data?.zltoRewardEstimate != null && (
          <div className="flex flex-row">
            <ZltoRewardBadge amount={data.zltoRewardEstimate} />
          </div>
        )}

        {/* SKILLS */}
        {visibleSkills.length > 0 && (
          <div className="flex flex-row flex-wrap gap-2 pt-2">
            {visibleSkills.map((skill) => (
              <span
                key={skill.id}
                className="bg-gray-light text-gray-dark flex h-6 items-center rounded-md px-2 text-xs font-medium"
              >
                {skill.name}
              </span>
            ))}
            {remainingSkills > 0 && (
              <span className="bg-gray-light text-gray-dark flex h-6 items-center rounded-md px-2 text-xs font-medium">
                +{remainingSkills}
              </span>
            )}
          </div>
        )}

        {/* APPLY BUTTON */}
        <Link
          href={`/opportunities/${data.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-purple hover:bg-purple-shade mt-auto flex h-12 w-full shrink-0 flex-row items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white duration-300"
        >
          <span>Apply now →</span>
        </Link>
      </div>
    );
  };

  return (
    <div className="flex h-80 w-72 flex-col rounded-2xl bg-white p-4 max-[374px]:h-72 max-[374px]:w-64 max-[374px]:p-3">
      {renderContent()}
    </div>
  );
};

export { OpportunityPublicSmallComponentV2 };
