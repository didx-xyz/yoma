import Link from "next/link";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { AvatarImage } from "../AvatarImage";
import ZltoRewardBadge from "./Badges/ZltoRewardBadge";

interface InputProps {
  data: OpportunityInfo;
  preview?: boolean;
  /**
   * "job" renders the dedicated, finalised job card (used by the top Jobs
   * carousel). Any other value (default) renders the type-themed card — so a
   * job that appears inside another carousel/grid looks like the other types.
   */
  variant?: "default" | "job";
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

  if (items.length === 0) return null;

  // Single-line, full-width, truncates with an ellipsis (matches the other rows).
  return (
    <div className="text-gray-dark min-w-0 truncate text-xs font-semibold">
      {items.map((item, i) => (
        <span key={i} className="whitespace-nowrap">
          {i > 0 && <span className="mx-1 opacity-40">/</span>}
          {item}
        </span>
      ))}
    </div>
  );
};

// Organisation name + (optional) countries row.
// Single-line, full-width, truncates with an ellipsis (matches the other rows).
const OpportunityOrgCountriesRow: React.FC<{ data: OpportunityInfo }> = ({
  data,
}) => {
  const countries =
    data.countries
      ?.map((c) => c.name)
      .filter(Boolean)
      .join(", ") ?? null;

  return (
    <div className="text-gray-dark min-w-0 truncate text-sm">
      <span
        className="inline-block max-w-[70%] truncate align-bottom font-semibold text-black"
        title={data.organizationName}
      >
        {data.organizationName}
      </span>
      {countries && <span title={countries}> · {countries}</span>}
    </div>
  );
};

// Skill badges row. Shows up to `maxSkills` badges (the 3rd only from `sm` up)
// followed by a "+N" overflow badge. Renders nothing when there are no skills.
const OpportunitySkillsRow: React.FC<{
  data: OpportunityInfo;
  maxSkills?: number;
}> = ({ data, maxSkills = 3 }) => {
  const skills = data.skills ?? [];
  const visibleSkills = skills.slice(0, maxSkills);
  const remainingSkills = skills.length - visibleSkills.length;

  if (visibleSkills.length === 0) return null;

  return (
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
  );
};

// Description (summary preferred), clamped to 2 lines. Always reserves 2 line
// heights so cards stay aligned. Renders nothing when there's no text.
const OpportunityDescriptionRow: React.FC<{ data: OpportunityInfo }> = ({
  data,
}) => {
  const text = data.summary ?? data.description;
  if (!text) return null;

  return (
    <p className="text-gray-dark line-clamp-2 min-h-[2lh] text-sm" title={text}>
      {text}
    </p>
  );
};

// Type/engagement badge (e.g. "Job · Full-time"). The engagement type is
// appended when present. Colour is supplied by the caller via className.
const OpportunityTypeBadge: React.FC<{
  data: OpportunityInfo;
  label: string;
  className?: string;
}> = ({ data, label, className = "" }) => {
  const engagementType =
    typeof data.engagementType === "string" ? data.engagementType : null;

  return (
    <span
      className={`font-family-nunito flex h-5 items-center rounded-md px-2 text-xs font-bold tracking-wide uppercase ${className}`}
    >
      {label}
      {engagementType ? ` · ${engagementType}` : ""}
    </span>
  );
};

const JobCard: React.FC<{ data: OpportunityInfo }> = ({ data }) => {
  return (
    <div className="flex h-70 w-80 flex-col rounded-2xl bg-white p-4 max-[370px]:w-64 max-[370px]:p-3">
      <div className="items-between flex h-full flex-col gap-2">
        {/* TOP: badge + title + org (left column) and logo (right column) */}
        <div className="flex flex-row items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {/* ENGAGEMENT TYPE BADGE */}
            <div className="justify-betweenxxx flex flex-row items-center gap-2">
              <OpportunityTypeBadge
                data={data}
                label="Job"
                className="bg-purple text-white"
              />

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
          </div>

          <AvatarImage
            icon={data?.organizationLogoURL ?? null}
            alt="Company Logo"
            size={50}
          />
        </div>

        <OpportunityOrgCountriesRow data={data} />

        <OpportunityDescriptionRow data={data} />

        <OpportunityMetaTextRow data={data} />

        <OpportunitySkillsRow data={data} />

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
    </div>
  );
};

// ---------------------------------------------------------------------------
// NON-JOB CARDS — per-type rendering modes (logo bubble + badge + title +
// meta + CTA). Each type has its own colour theme.
// ---------------------------------------------------------------------------
interface TypeConfig {
  label: string; // badge label
  badgeClassName: string; // tinted badge background/text
  bubbleClassName: string; // gradient behind the org logo
  ctaText: string; // call-to-action label
  ctaTitle: string; // call-to-action title attr
  ctaClassName: string; // call-to-action background/hover
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  Job: {
    label: "Job",
    badgeClassName: "bg-purple text-white",
    bubbleClassName: "bg-gradient-to-br from-purple-tint to-purple-light/40",
    ctaText: "Apply now →",
    ctaTitle: "Apply for this job opportunity",
    ctaClassName: "bg-purple hover:bg-purple-shade text-white",
  },
  Learning: {
    label: "Learning",
    badgeClassName: "bg-green text-white",
    bubbleClassName: "bg-gradient-to-br from-green-light to-green-dark/30",
    ctaText: "Start learning →",
    ctaTitle: "Start this learning opportunity",
    ctaClassName: "bg-green hover:bg-green-dark text-white",
  },
  Event: {
    label: "Event",
    badgeClassName: "bg-blue text-white",
    bubbleClassName: "bg-gradient-to-br from-blue-light to-blue/30",
    ctaText: "View event →",
    ctaTitle: "View this event",
    ctaClassName: "bg-blue hover:bg-blue-dark text-white",
  },

  "Micro-task": {
    label: "Task",
    badgeClassName: "bg-yellow text-white",
    bubbleClassName: "bg-gradient-to-br from-yellow-light to-yellow/30",
    ctaText: "View task →",
    ctaTitle: "View this micro-task",
    ctaClassName: "bg-yellow/90 hover:bg-yellow/60 text-white",
  },
  Other: {
    label: "Other",
    badgeClassName: "bg-gray-dark text-white",
    bubbleClassName: "bg-gradient-to-br from-gray-light to-gray/60",
    ctaText: "View →",
    ctaTitle: "View this opportunity",
    ctaClassName: "bg-gray-dark hover:bg-black text-white",
  },
};

const getTypeConfig = (type: string | undefined): TypeConfig => {
  if (type && TYPE_CONFIG[type]) return TYPE_CONFIG[type]!;
  // Fallback for unknown types: behave like a generic opportunity.
  return {
    label: type ?? "Opportunity",
    badgeClassName: "bg-purple-tint text-purple",
    bubbleClassName: "bg-gradient-to-br from-purple-tint to-purple-light/40",
    ctaText: "View →",
    ctaTitle: "View this opportunity",
    ctaClassName: "bg-purple hover:bg-purple-shade text-white",
  };
};

const DefaultCard: React.FC<{ data: OpportunityInfo }> = ({ data }) => {
  const config = getTypeConfig(data.type);

  return (
    <div className="flex h-94 w-80 flex-col rounded-2xl bg-white p-3 max-[370px]:w-64">
      {/* ORG LOGO BUBBLE */}
      {/* <div
        className={`h-32x flex h-24 shrink-0 items-center justify-center rounded-xl ${config.bubbleClassName}`}
      >
        <AvatarImage
          icon={data?.organizationLogoURL ?? null}
          alt={data.organizationName ?? "Organisation logo"}
          size={64}
        />
      </div> */}

      {/* ORG LOGO BUBBLE */}
      <div
        className={`relative flex h-24 shrink-0 items-center justify-center rounded-xl ${config.bubbleClassName}`}
      >
        {/* TYPE (top-left) + ZLTO (top-right) badges overlaid on the bubble */}
        {/* <div className="absolute inset-x-0 top-0 flex flex-row items-center justify-between p-2">
          <OpportunityTypeBadge
            data={data}
            label={config.label}
            className={config.badgeClassName}
          />

          {data?.zltoRewardEstimate != null && (
            <ZltoRewardBadge amount={data.zltoRewardEstimate} />
          )}
        </div> */}

        <AvatarImage
          icon={data?.organizationLogoURL ?? null}
          alt={data.organizationName ?? "Organisation logo"}
          size={64}
        />

        {/* SKILLS overlaid bottom-left on the bubble */}
        {/* <div className="absolute inset-x-0 bottom-0 p-2">
          <OpportunitySkillsRow data={data} />
        </div> */}
      </div>

      {/* CONTENT */}
      <div className="flex flex-1 flex-col gap-2 pt-3">
        {/* TYPE BADGE */}
        <div className="flex flex-row items-center justify-between">
          <OpportunityTypeBadge
            data={data}
            label={config.label}
            className={config.badgeClassName}
          />

          {data?.zltoRewardEstimate != null && (
            <ZltoRewardBadge amount={data.zltoRewardEstimate} />
          )}
        </div>

        {/* TITLE*/}
        <div className="font-family-nunito text-base leading-tight font-bold text-black">
          <span className="line-clamp-1 text-ellipsis" title={data.title}>
            {data.title}
          </span>
        </div>

        <OpportunityOrgCountriesRow data={data} />

        <OpportunityDescriptionRow data={data} />

        <OpportunityMetaTextRow data={data} />

        <OpportunitySkillsRow data={data} />

        {/* CTA BUTTON */}
        <Link
          href={`/opportunities/${data.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-auto flex h-10 w-full shrink-0 flex-row items-center justify-center gap-2 rounded-lg text-sm font-semibold duration-300 ${config.ctaClassName}`}
          title={config.ctaTitle}
        >
          <span>{config.ctaText}</span>
        </Link>
      </div>
    </div>
  );
};

// V2 of OpportunityPublicSmallComponent.
// The dedicated Jobs carousel opts into the finalised JobCard via variant="job".
// Everywhere else (other carousels, search grid) every type — including jobs —
// renders with the type-themed DefaultCard.
const OpportunityPublicSmallComponentV2: React.FC<InputProps> = ({
  data,
  variant = "default",
}) => {
  if (variant === "job") return <JobCard data={data} />;
  return <DefaultCard data={data} />;
};

export { OpportunityPublicSmallComponentV2 };
