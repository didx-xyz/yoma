import { useMemo, type ReactNode } from "react";
import { IoTimeOutline, IoTrophyOutline } from "react-icons/io5";
import type {
  Program,
  ProgramInfo,
  ProgramPathwayInfo,
  ProgramPathwayProgress,
} from "~/api/models/referrals";
import { ReferralInfoCard } from "~/components/Referrals/ReferralInfoCard";
import { ReferralMainColumns } from "~/components/Referrals/ReferralMainColumns";
import { ReferralProgressCard } from "~/components/Referrals/ReferralProgressCard";
import { ReferralStatCard } from "~/components/Referrals/ReferralStatCard";
import { ReferralTasksCard } from "~/components/Referrals/ReferralTasksCard";
import { ReferralTopCard } from "~/components/Referrals/ReferralTopCard";

interface ReferralProgramPagePreviewProps {
  program: Program | ProgramInfo;
  imagePreviewUrl?: string | null;
  referrerDisplayName?: string;
  showProofOfPersonhoodAction?: boolean;
  proofOfPersonhoodAction?: ReactNode;
  progressModel?: ProgramPathwayProgress | null;
  percentComplete?: number;
  timeRemainingDescription?: string;
}

const toPathwayInfo = (
  pathway: Program["pathway"] | ProgramInfo["pathway"],
): ProgramPathwayInfo | null => {
  if (!pathway) return null;

  return {
    id: pathway.id,
    name: pathway.name,
    description: pathway.description ?? null,
    rule: pathway.rule,
    orderMode: pathway.orderMode,
    isCompletable: (pathway as any).isCompletable ?? true,
    steps:
      pathway.steps?.map((step) => ({
        id: step.id,
        name: step.name,
        description: step.description ?? null,
        rule: step.rule,
        orderMode: step.orderMode,
        order: step.order,
        orderDisplay: step.orderDisplay,
        completed: (step as any).completed ?? false,
        isCompletable: (step as any).isCompletable ?? true,
        tasks:
          step.tasks?.map((task) => ({
            id: task.id,
            entityType: task.entityType,
            opportunity: task.opportunity,
            order: task.order,
            orderDisplay: task.orderDisplay,
            completed: (task as any).completed ?? false,
            isCompletable: (task as any).isCompletable ?? true,
            nonCompletableReason: (task as any).nonCompletableReason ?? null,
          })) ?? [],
      })) ?? [],
  };
};

const toProgramInfo = (
  program: Program | ProgramInfo,
  imagePreviewUrl?: string | null,
): ProgramInfo => ({
  id: program.id,
  name: program.name,
  description: program.description,
  imageURL: imagePreviewUrl || program.imageURL,
  completionWindowInDays: program.completionWindowInDays,
  completionLimitReferee: program.completionLimitReferee,
  completionLimit: program.completionLimit,
  completionTotal: program.completionTotal,
  completionBalance: program.completionBalance,
  zltoRewardReferrer: program.zltoRewardReferrer,
  zltoRewardReferee: program.zltoRewardReferee,
  zltoRewardCumulative: program.zltoRewardCumulative,
  proofOfPersonhoodRequired: program.proofOfPersonhoodRequired,
  pathwayRequired: program.pathwayRequired,
  status: program.status,
  isDefault: program.isDefault,
  dateStart: program.dateStart,
  dateEnd: program.dateEnd,
  pathway: toPathwayInfo(program.pathway),
});

export const ReferralProgramPagePreview: React.FC<
  ReferralProgramPagePreviewProps
> = ({
  program,
  imagePreviewUrl,
  referrerDisplayName = "Referrer",
  showProofOfPersonhoodAction = false,
  proofOfPersonhoodAction,
  progressModel,
  percentComplete = 0,
  timeRemainingDescription = "No time limit",
}) => {
  const displayProgram = useMemo(
    () => toProgramInfo(program, imagePreviewUrl),
    [program, imagePreviewUrl],
  );

  return (
    <>
      <ReferralTopCard
        program={displayProgram}
        rewardsReferrer={false}
        rewardsReferee={true}
      />

      <ReferralMainColumns
        left={
          <>
            <ReferralInfoCard>
              <p>
                Welcome to Yoma! You were referred by{" "}
                <strong>{referrerDisplayName}</strong>.
                {(displayProgram.zltoRewardReferee || 0) > 0 ? (
                  <>
                    {" "}
                    Complete the below pathway and get the opportunity to win{" "}
                    <strong>{displayProgram.zltoRewardReferee}</strong> Zlto.
                  </>
                ) : (
                  <> Complete the below pathway to complete this programme.</>
                )}
              </p>

              <p>{displayProgram.description}</p>
            </ReferralInfoCard>

            {showProofOfPersonhoodAction && proofOfPersonhoodAction}

            <ReferralTasksCard
              model={displayProgram.pathway}
              progressModel={progressModel}
            />
          </>
        }
        right={
          <div className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow">
            <ReferralProgressCard percentComplete={percentComplete} />

            <ReferralStatCard
              icon={<IoTrophyOutline className="h-5 w-5" />}
              header="Reward"
              description={
                (displayProgram.zltoRewardReferee || 0) > 0
                  ? `${displayProgram.zltoRewardReferee} Zlto`
                  : "No reward"
              }
            />

            <ReferralStatCard
              icon={<IoTimeOutline className="h-5 w-5" />}
              header="Time remaining"
              description={timeRemainingDescription}
            />
          </div>
        }
      />
    </>
  );
};
