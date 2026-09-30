import {
  IoAccessibilityOutline,
  IoEarthOutline,
  IoGiftOutline,
  IoPeopleCircleOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { RewardType, type OpportunityInfo } from "~/api/models/opportunity";
import DetailSection from "~/components/Common/DetailSection";
import {
  formatAccessibilitySupport,
  formatAgeRange,
  formatIncentivized,
  formatPartnerIncentive,
  formatRewardType,
  formatSustainableDevelopmentGoal,
} from "~/components/Opportunity/Admin/opportunityCoreFields";

const BADGE =
  "badge bg-green h-full min-h-6 rounded-md border-0 py-1 text-xs font-semibold text-white";

/**
 * The core metadata sections (YOM-1262): incentive, accessibility, age range, targeted groups
 * and SDGs. Shared by the org-admin info page and the public opportunity page (and so the
 * editor's preview), so a youth sees what the organisation captured. Each section renders only
 * when it has something to say; `showUnspecifiedIncentive` keeps the Incentive section on the
 * admin page when the question is still unanswered (legacy opportunities).
 */
export const OpportunityCoreDetails: React.FC<{
  opportunity: Pick<
    OpportunityInfo,
    | "incentivized"
    | "rewardType"
    | "partnerIncentiveAmount"
    | "partnerIncentiveCurrency"
    | "accessibilitySupport"
    | "accommodations"
    | "accommodationOtherDescription"
    | "ageFrom"
    | "ageTo"
    | "targetedGroups"
    | "sustainableDevelopmentGoals"
  >;
  showUnspecifiedIncentive?: boolean;
}> = ({ opportunity, showUnspecifiedIncentive = false }) => {
  const rewardTypeLabel =
    opportunity.rewardType !== RewardType.None
      ? formatRewardType(opportunity.rewardType)
      : null;
  const partnerIncentive =
    opportunity.rewardType === RewardType.PartnerIncentive
      ? formatPartnerIncentive(
          opportunity.partnerIncentiveAmount,
          opportunity.partnerIncentiveCurrency,
        )
      : null;
  const accessibilitySupportLabel = formatAccessibilitySupport(
    opportunity.accessibilitySupport,
  );
  const ageRange = formatAgeRange(opportunity.ageFrom, opportunity.ageTo);
  const accommodations = opportunity.accommodations ?? [];
  const targetedGroups = opportunity.targetedGroups ?? [];
  const goals = opportunity.sustainableDevelopmentGoals ?? [];

  return (
    <>
      {(showUnspecifiedIncentive || opportunity.incentivized != null) && (
        <DetailSection
          title="Incentive"
          icon={<IoGiftOutline className="text-green h-5 w-5" />}
        >
          <div className="my-2 flex flex-wrap gap-2">
            <div
              className={
                opportunity.incentivized == null
                  ? "badge bg-gray-light text-gray-dark h-full min-h-6 rounded-md border-0 py-1 text-xs font-semibold"
                  : BADGE
              }
            >
              {formatIncentivized(opportunity.incentivized)}
            </div>
            {rewardTypeLabel && <div className={BADGE}>{rewardTypeLabel}</div>}
            {partnerIncentive && (
              <div className={BADGE}>{partnerIncentive}</div>
            )}
          </div>
        </DetailSection>
      )}
      {(!!accessibilitySupportLabel || accommodations.length > 0) && (
        <DetailSection
          title="Accessibility"
          icon={<IoAccessibilityOutline className="text-green h-5 w-5" />}
        >
          <div className="my-2 flex flex-col gap-2">
            {accessibilitySupportLabel && (
              <div className="text-sm">
                {`Support: ${accessibilitySupportLabel}`}
              </div>
            )}
            {accommodations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {accommodations.map((item) => (
                  <div key={item.id} className={BADGE}>
                    {item.name}
                  </div>
                ))}
              </div>
            )}
            {!!opportunity.accommodationOtherDescription && (
              <div className="text-gray-dark text-sm">
                {opportunity.accommodationOtherDescription}
              </div>
            )}
          </div>
        </DetailSection>
      )}
      {!!ageRange && (
        <DetailSection
          title="Age range"
          icon={<IoPersonOutline className="text-green h-5 w-5" />}
        >
          <div className={`${BADGE} my-2`}>{ageRange}</div>
        </DetailSection>
      )}
      {targetedGroups.length > 0 && (
        <DetailSection
          title="Targeted groups"
          icon={<IoPeopleCircleOutline className="text-green h-5 w-5" />}
        >
          <div className="my-2 flex flex-wrap gap-2">
            {targetedGroups.map((item) => (
              <div key={item.id} className={BADGE}>
                {item.name}
              </div>
            ))}
          </div>
        </DetailSection>
      )}
      {goals.length > 0 && (
        <DetailSection
          title="Sustainable Development Goals"
          icon={<IoEarthOutline className="text-green h-5 w-5" />}
        >
          <div className="my-2 flex flex-wrap gap-2">
            {goals.map((item) => (
              <div key={item.id} className={BADGE}>
                {formatSustainableDevelopmentGoal(item)}
              </div>
            ))}
          </div>
        </DetailSection>
      )}
    </>
  );
};
