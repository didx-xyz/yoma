import Link from "next/link";
import type { OpportunityInfo } from "~/api/models/opportunity";
import ZltoRewardBadge from "./Badges/ZltoRewardBadge";

interface InputProps {
  data: OpportunityInfo;
  preview?: boolean;
  [key: string]: any;
}

const fmtDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

const OpportunityMetaTextRow: React.FC<{ data: OpportunityInfo }> = ({
  data,
}) => {
  const items: string[] = [];
  // Effort
  if (data.commitmentIntervalCount && data.commitmentInterval) {
    const s = data.commitmentIntervalCount > 1 ? "s" : "";
    items.push(
      `${data.commitmentIntervalCount} ${data.commitmentInterval}${s} effort`,
    );
  }
  // Status + relevant date
  if (data.status === "Active") {
    if (new Date(data.dateStart) > new Date()) {
      items.push(`Starts ${fmtDate(data.dateStart)}`); // Upcoming
    } else {
      items.push(
        data.dateEnd ? `Ends ${fmtDate(data.dateEnd)}` : "Ongoing", // Ongoing
      );
    }
  }

  // Spots left
  if (data.participantLimit != null && !data.participantLimitReached) {
    const left = Math.max(
      data.participantLimit - (data.participantCountCompleted ?? 0),
      0,
    );
    items.push(`${left} spot${left === 1 ? "" : "s"} left`);
  }

  // // Engagement type
  // if (data.engagementType && typeof data.engagementType === "string") {
  //   items.push(data.engagementType);
  // }

  if (items.length === 0) return null;

  return (
    <div className="text-gray-dark flex min-w-0 flex-wrap text-xs">
      {items.map((item, i) => (
        <span key={i} className="whitespace-nowrap">
          {i > 0 && <span className="mx-1 opacity-40">/</span>}
          {item}
        </span>
      ))}
    </div>
  );
};

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
        <div className="flex flex-row items-center justify-between">
          <span className="bg-purple font-family-nunito flex h-5 items-center rounded-md px-2 text-xs font-bold tracking-wide text-white uppercase">
            Job{engagementType ? ` · ${engagementType}` : ""}
          </span>

          {data?.zltoRewardEstimate != null && (
            <ZltoRewardBadge amount={data.zltoRewardEstimate} />
          )}
        </div>

        {/* TITLE */}
        <div className="font-family-nunito flex items-center text-base leading-tight font-bold text-black">
          <span className="line-clamp-1 text-ellipsis" title={data.title}>
            {data.title}
          </span>
        </div>

        {/* ORGANISATION + COUNTRIES */}
        <div className="text-gray-dark flex min-w-0 text-sm">
          <span
            className="max-w-[50%] truncate font-semibold text-black"
            title={data.organizationName}
          >
            {data.organizationName}
          </span>
          {countries && (
            <span className="truncate" title={countries}>
              {" "}
              · {countries}
            </span>
          )}
        </div>

        <OpportunityMetaTextRow data={data} />

        {/* SKILLS */}
        {visibleSkills.length > 0 && (
          <div className="flex flex-row flex-nowrap gap-2 pt-2">
            {visibleSkills.map((skill, i) => (
              <span
                key={skill.id}
                className={`bg-gray-light text-gray-dark h-6 max-w-18 items-center rounded-md px-2 text-xs font-medium ${
                  i >= 2 ? "hidden sm:flex" : "flex"
                }`}
                title={skill.name}
              >
                <span className="truncate">{skill.name}</span>
              </span>
            ))}
            {remainingSkills > 0 && (
              <span
                className="bg-gray-light text-gray-dark flex h-6 max-w-12 items-center rounded-md px-2 text-xs font-medium"
                title={`${remainingSkills} more skill${remainingSkills > 1 ? "s" : ""}`}
              >
                <span className="truncate">+{remainingSkills}</span>
              </span>
            )}
          </div>
        )}

        {/* APPLY BUTTON */}
        <Link
          href={`/opportunities/${data.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-purple hover:bg-purple-shade mt-auto flex h-10 w-full shrink-0 flex-row items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white duration-300"
          title="Apply for this job opportunity"
        >
          <span>Apply now →</span>
        </Link>
      </div>
    );
  };

  return (
    <div className="flex h-56 w-80 flex-col rounded-2xl bg-white p-4 max-[370px]:w-64 max-[370px]:p-3">
      {renderContent()}
    </div>
  );
};

export { OpportunityPublicSmallComponentV2 };
