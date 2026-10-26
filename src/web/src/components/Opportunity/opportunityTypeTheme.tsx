import { TimeIntervalOption } from "~/api/models/common";
import type { OpportunityInfo } from "~/api/models/opportunity";

// ---------------------------------------------------------------------------
// Shared per-opportunity-type copy (labels, CTA text) + small presentational pieces.
// Used by the opportunity cards, rows and the details page so they share one source of truth.
// Type COLOURS are not here: every surface takes them from `~/lib/typeColours.ts`
// (`typeBadgeClass`, `typeBandClass`), the one palette (YOM-1283, 2026-10-21).
// ---------------------------------------------------------------------------

export interface TypeConfig {
  /** The type's name, on the badge too — Other reads "Other", as the discovery card's chip does (2026-10-21). */
  label: string;
  ctaText: string; // call-to-action label
  ctaTitle: string; // call-to-action title attr
  gotoExternalLinkButtonText: string; //  "go to oppoortunity" button text
}

export const TYPE_CONFIG: Record<string, TypeConfig> = {
  Job: {
    label: "Job",
    ctaText: "Apply now →",
    ctaTitle: "Apply for this job opportunity",
    gotoExternalLinkButtonText: "Apply now",
  },
  Learning: {
    label: "Learning",
    ctaText: "Start learning →",
    ctaTitle: "Start this learning opportunity",
    gotoExternalLinkButtonText: "Start learning",
  },
  Event: {
    label: "Event",
    ctaText: "View event →",
    ctaTitle: "View this event",
    gotoExternalLinkButtonText: "View event",
  },
  ImpactAction: {
    label: "Impact Action",
    ctaText: "View impact action →",
    ctaTitle: "View this impact action",
    gotoExternalLinkButtonText: "View impact action",
  },
  Entrepreneurship: {
    label: "Entrepreneurship",
    ctaText: "View programme →",
    ctaTitle: "View this entrepreneurship programme",
    gotoExternalLinkButtonText: "Go to programme",
  },
  Other: {
    label: "Other",
    ctaText: "View opportunity →",
    ctaTitle: "View this opportunity",
    gotoExternalLinkButtonText: "Go to opportunity",
  },
};

export const getTypeConfig = (type: string | undefined): TypeConfig => {
  if (type && TYPE_CONFIG[type]) return TYPE_CONFIG[type]!;
  // Fallback for unknown types: behave like a generic opportunity.
  return {
    label: type ?? "Opportunity",
    ctaText: "View →",
    ctaTitle: "View this opportunity",
    gotoExternalLinkButtonText: "Go to opportunity",
  };
};

// Per-engagement-type display config. Lets us override the raw value's label
// (e.g. show "On-site" instead of the enum name "OnSite").
export interface EngagementConfig {
  label: string; // display label for the engagement type
}

export const ENGAGEMENT_CONFIG: Record<string, EngagementConfig> = {
  Remote: { label: "Remote" },
  OnSite: { label: "On-site" },
  Hybrid: { label: "Hybrid" },
};

// Returns the display config for an engagement type, or null when there isn't
// one. Unknown values fall back to showing the raw value as the label.
export const getEngagementConfig = (
  engagementType: string | null | undefined,
): EngagementConfig | null => {
  if (!engagementType) return null;
  return ENGAGEMENT_CONFIG[engagementType] ?? { label: engagementType };
};

export interface CommitmentDisplayData {
  commitmentInterval: TimeIntervalOption | null | string;
  commitmentIntervalCount: number | null;
  commitmentIntervalDescription?: string | null;
  opportunityCommitmentIntervalDescription?: string | null;
  commitmentIntervalTotalHours?: number | null;
}

export const fmtDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

const getCommitmentIntervalLabel = (
  commitmentInterval: CommitmentDisplayData["commitmentInterval"],
): string | null => {
  if (typeof commitmentInterval === "string") return commitmentInterval;
  if (typeof commitmentInterval === "number") {
    return TimeIntervalOption[commitmentInterval] ?? null;
  }

  return null;
};

const deriveCommitmentTotalHours = (
  commitmentIntervalCount: number,
  commitmentIntervalLabel: string,
): number | null => {
  switch (commitmentIntervalLabel.toLowerCase()) {
    case "minute":
      return Math.ceil(commitmentIntervalCount / 60);
    case "hour":
      return commitmentIntervalCount;
    case "day":
      return commitmentIntervalCount * 24;
    case "week":
      return commitmentIntervalCount * 24 * 7;
    case "month":
      return commitmentIntervalCount * 24 * 30;
    default:
      return null;
  }
};

export const getCommitmentDisplay = (
  data: CommitmentDisplayData,
): {
  label: string;
  totalHours: number | null;
} | null => {
  const commitmentIntervalLabel = getCommitmentIntervalLabel(
    data.commitmentInterval,
  );
  let fallbackLabel: string | null = null;
  if (data.commitmentIntervalCount != null && commitmentIntervalLabel) {
    const pluralSuffix = data.commitmentIntervalCount === 1 ? "" : "s";
    fallbackLabel = `${data.commitmentIntervalCount} ${commitmentIntervalLabel}${pluralSuffix}`;
  }
  const label =
    fallbackLabel ??
    data.commitmentIntervalDescription ??
    data.opportunityCommitmentIntervalDescription ??
    null;

  if (!label) return null;

  return {
    label,
    totalHours:
      data.commitmentIntervalTotalHours ??
      (data.commitmentIntervalCount != null && commitmentIntervalLabel
        ? deriveCommitmentTotalHours(
            data.commitmentIntervalCount,
            commitmentIntervalLabel,
          )
        : null),
  };
};

// Join parts with a delimiter, skipping empty/falsy values (so the delimiter
// only appears between values that are actually present).
export const joinWithDelimiter = (
  parts: Array<string | null | undefined>,
  delimiter = " · ",
): string => parts.filter(Boolean).join(delimiter);

export const OpportunityTypeBadge: React.FC<{
  data: OpportunityInfo;
  className?: string;
}> = ({ data, className = "" }) => {
  const type = getTypeConfig(data.type).label;

  if (!type) return null;

  return (
    <span
      className={`badge badge-sm font-family-nunito text-xs font-bold tracking-wide uppercase ${className}`}
    >
      <span className="truncate">{type}</span>
    </span>
  );
};

export const OpportunityEngagementTypeBadge: React.FC<{
  data: OpportunityInfo;
  className?: string;
}> = ({ data, className = "" }) => {
  const engagementType = getEngagementConfig(
    typeof data.engagementType === "string" ? data.engagementType : null,
  )?.label;

  if (!engagementType) return null;

  return (
    <span
      className={`badge badge-sm font-family-nunito text-xs font-bold tracking-wide uppercase ${className}`}
    >
      <span className="truncate">{engagementType}</span>
    </span>
  );
};

export const OpportunityTitleRow: React.FC<{
  data: OpportunityInfo;
  lines?: number;
}> = ({ data, lines = 1 }) => {
  return (
    <div className="font-family-nunito text-base leading-tight font-bold text-black">
      <span className={`line-clamp-${lines} text-ellipsis`} title={data.title}>
        {data.title}
      </span>
    </div>
  );
};

// Organisation name + (optional) countries row.
// Single-line, full-width, truncates with an ellipsis.
export const OpportunityOrgCountriesRow: React.FC<{
  data: OpportunityInfo;
}> = ({ data }) => {
  const countries =
    data.countries
      ?.map((c) => c.name)
      .filter(Boolean)
      .join(", ") ?? null;

  return (
    <div className="text-gray-dark min-w-0 truncate text-sm">
      <span
        className="inline-block max-w-[60%] truncate align-bottom font-semibold text-black"
        title={data.organizationName}
      >
        {data.organizationName}
      </span>
      {countries && <span title={countries}> · {countries}</span>}
    </div>
  );
};

// Compact meta line: effort / status-date / spots left. Single-line, truncates.
export const OpportunityMetaTextRow: React.FC<{
  data: OpportunityInfo;
}> = ({ data }) => {
  const items: string[] = [];
  // Effort
  const commitmentDisplay = getCommitmentDisplay(data);
  if (commitmentDisplay?.totalHours != null) {
    const hourLabel = commitmentDisplay.totalHours === 1 ? "hour" : "hours";
    items.push(`${commitmentDisplay.totalHours} ${hourLabel} effort`);
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
