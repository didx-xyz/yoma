import Image from "next/image";
import Link from "next/link";
import type { Opportunity } from "~/api/models/opportunity";
import PublicBadges from "./Badges/PublicBadges";

interface OpportunityPublicSmallRowProps {
  opportunity: Opportunity;
  isCompleted?: boolean;
  showBadges?: boolean;
  variant?: "default" | "compact";
}

const OpportunityPublicSmallRow: React.FC<OpportunityPublicSmallRowProps> = ({
  opportunity,
  isCompleted = false,
  showBadges = true,
  variant = "default",
}) => {
  const isCompact = variant === "compact";

  const containerClassName = isCompact
    ? "group flex flex-col gap-1 rounded-lg bg-transparent p-0 transition-colors hover:bg-base-200/60 "
    : "group flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md";

  const titleClassName = isCompact
    ? `mb-1 line-clamp-2 text-xs font-semibold font-nunito break-words text-base-content group-hover:text-blue-600 md:text-sm ${
        isCompleted ? "line-through opacity-60" : ""
      }`
    : `mb-1 line-clamp-2 text-sm font-semibold font-nunito break-words text-gray-700 group-hover:text-blue-600 ${
        isCompleted ? "line-through opacity-60" : ""
      }`;

  const descriptionClassName = isCompact
    ? `mb-2 line-clamp-2 text-[10px] leading-relaxed text-base-content/60 md:text-xs ${
        isCompleted ? "line-through opacity-60" : ""
      }`
    : `mb-2 line-clamp-2 text-xs leading-relaxed text-gray-600 ${
        isCompleted ? "line-through opacity-60" : ""
      }`;

  const logoSize = isCompact ? 40 : 48;
  const placeholderClassName = isCompact
    ? "flex h-10 w-10 items-center justify-center rounded-lg bg-base-200"
    : "flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-gray-100";

  return (
    <Link
      href={`/opportunities/${opportunity.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={containerClassName}
    >
      <div className="flex items-start gap-3">
        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Title */}
          <h4 className={titleClassName}>{opportunity.title}</h4>

          {/* Description */}
          {(opportunity.summary || opportunity.description) && (
            <p className={descriptionClassName}>
              {opportunity.summary || opportunity.description}
            </p>
          )}

          {/* Badges */}
          {showBadges && (
            <div className="mt-auto">
              <PublicBadges opportunity={opportunity as any} />
            </div>
          )}
        </div>

        {/* Organization Logo */}
        <div className="flex-shrink-0">
          {opportunity.organizationLogoURL ? (
            <Image
              src={opportunity.organizationLogoURL}
              alt={opportunity.organizationName || "Organization"}
              width={logoSize}
              height={logoSize}
              className={`rounded-lg border object-cover ${
                isCompact ? "border-transparent" : "border-gray-200"
              }`}
            />
          ) : (
            <div className={placeholderClassName}>
              <span
                className={`font-bold ${
                  isCompact
                    ? "text-base-content/40 text-base"
                    : "text-lg text-gray-400"
                }`}
              >
                {opportunity.organizationName?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default OpportunityPublicSmallRow;
