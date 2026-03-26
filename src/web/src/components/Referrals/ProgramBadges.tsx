import {
  IoAlertCircleOutline,
  IoGitNetwork,
  IoInformationCircleOutline,
  IoPersonCircle,
  IoTimeOutline,
  IoWalletOutline,
  IoWarningOutline,
} from "react-icons/io5";
import React from "react";
import { ProgramStatus, type ProgramInfo } from "~/api/models/referrals";

interface ProgramBadgesProps {
  program: ProgramInfo | undefined;
  showToolTips?: boolean;
  mode?: "compact" | "large";
  showPathway?: boolean;
  showBadges?: {
    status?: boolean;
    requirements?: boolean;
    limit?: boolean;
    rewards?: boolean;
    rewardsReferrer?: boolean;
    rewardsReferee?: boolean;
  };
}

const ProgramBadges: React.FC<ProgramBadgesProps> = ({
  program,
  mode = "compact",
  showPathway = false,
  showBadges,
}) => {
  if (!program) return null;

  const referrerReward = program.zltoRewardReferrerEstimate || 0;
  const refereeReward = program.zltoRewardRefereeEstimate || 0;
  const pathwayRequired = !!program.pathwayRequired;
  const proofRequired = !!program.proofOfPersonhoodRequired;

  const statusName =
    typeof program.status === "number"
      ? ProgramStatus[program.status]
      : `${program.status}`;

  const normalizedStatus = (statusName || "").toLowerCase();
  const showStatusBadge =
    normalizedStatus.length > 0 && normalizedStatus !== "active";

  const statusLabel =
    statusName === "LimitReached"
      ? "Limit reached"
      : statusName === "UnCompletable"
        ? "Uncompletable"
        : statusName;

  const resolvedShowBadges = {
    status: showBadges?.status ?? true,
    requirements: showBadges?.requirements ?? true,
    limit: showBadges?.limit ?? true,
    rewards: showBadges?.rewards ?? true,
    rewardsReferrer: showBadges?.rewardsReferrer ?? true,
    rewardsReferee: showBadges?.rewardsReferee ?? true,
  };

  void showPathway;

  const requirementBadgeClass =
    mode === "large"
      ? "badge badge-md bg-green/15 border border-green-200 text-green-800 gap-1"
      : "badge badge-sm bg-green/15 border border-green-200 text-green-800 gap-1";

  const rewardBadgeClass =
    mode === "large"
      ? "badge badge-md bg-amber-100 border border-amber-200 text-amber-800 gap-1"
      : "badge badge-sm bg-amber-100 border border-amber-200 text-amber-800 gap-1";

  const containerClass =
    mode === "large"
      ? "mt-3 mb-1 flex flex-wrap gap-2"
      : "mt-3 mb-2 flex flex-wrap gap-1.5";

  const statusBadgeSizeClass =
    mode === "large" ? "badge badge-md" : "badge badge-sm";

  const statusBadgeStyleClass =
    normalizedStatus === "inactive" ||
    normalizedStatus === "limitreached" ||
    normalizedStatus === "uncompletable"
      ? "border border-orange-200 bg-orange-100 text-orange-800"
      : normalizedStatus === "expired" || normalizedStatus === "deleted"
        ? "border border-red-200 bg-red-100 text-red-800"
        : "border border-gray-300 bg-gray-100 text-gray-700";

  const StatusIcon =
    normalizedStatus === "inactive"
      ? IoInformationCircleOutline
      : normalizedStatus === "limitreached"
        ? IoWarningOutline
        : normalizedStatus === "uncompletable"
          ? IoAlertCircleOutline
          : normalizedStatus === "expired"
            ? IoTimeOutline
            : normalizedStatus === "deleted"
              ? IoAlertCircleOutline
              : IoInformationCircleOutline;

  return (
    <div className={containerClass}>
      {resolvedShowBadges.status && showStatusBadge ? (
        <span
          className={`${statusBadgeSizeClass} ${statusBadgeStyleClass} gap-1`}
        >
          <StatusIcon className="h-4 w-4" />
          {statusLabel}
        </span>
      ) : null}

      {resolvedShowBadges.requirements && pathwayRequired ? (
        <div
          className="tooltipx tooltip-secondary cursor-helpx before:text-[0.6875rem]"
          data-tip="Referees must complete pathway tasks to qualify for rewards."
        >
          <span className={requirementBadgeClass}>
            <IoGitNetwork className="h-4 w-4" />
            Pathway required
          </span>
        </div>
      ) : null}

      {resolvedShowBadges.requirements && proofRequired ? (
        <div
          className="tooltipx tooltip-secondary cursor-helpx before:text-[0.6875rem]"
          data-tip="Referees must verify proof of personhood before rewards can be earned."
        >
          <span className={requirementBadgeClass}>
            <IoPersonCircle className="h-4 w-4" />
            Proof of personhood required
          </span>
        </div>
      ) : null}

      {resolvedShowBadges.rewards &&
      resolvedShowBadges.rewardsReferrer &&
      referrerReward > 0 ? (
        <div
          className="tooltipx tooltip-secondary cursor-helpx before:text-[0.6875rem]"
          data-tip="You receive this ZLTO amount when your referral completes all requirements."
        >
          <span className={rewardBadgeClass}>
            <IoWalletOutline className="h-4 w-4" />
            {referrerReward} ZLTO
          </span>
        </div>
      ) : null}

      {resolvedShowBadges.rewards &&
      resolvedShowBadges.rewardsReferee &&
      refereeReward > 0 ? (
        <div
          className="tooltipx tooltip-secondary cursor-help before:text-[0.6875rem]"
          data-tip="You receive this ZLTO amount when you complete the programme requirements."
        >
          <span className={rewardBadgeClass}>
            <IoWalletOutline className="h-4 w-4" />
            {refereeReward} ZLTO
          </span>
        </div>
      ) : null}
    </div>
  );
};

export default ProgramBadges;
