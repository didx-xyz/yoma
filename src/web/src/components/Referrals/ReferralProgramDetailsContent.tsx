import { type ReactNode, useMemo } from "react";
import { IoTimeOutline, IoTrophyOutline } from "react-icons/io5";
import type {
  Program,
  ProgramInfo,
  ProgramPathwayInfo,
} from "~/api/models/referrals";
import { ReferralInfoCard } from "~/components/Referrals/ReferralInfoCard";
import { ReferralMainColumns } from "~/components/Referrals/ReferralMainColumns";
import { ReferralStatCard } from "~/components/Referrals/ReferralStatCard";
import { ReferralTasksCard } from "~/components/Referrals/ReferralTasksCard";
import { ReferralTopCard } from "~/components/Referrals/ReferralTopCard";
import { Editor } from "../RichText/Editor";

interface ReferralProgramDetailsContentProps {
  program: Program | ProgramInfo;
  cta?: ReactNode;
  preview?: boolean;
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

const toProgramInfo = (program: Program | ProgramInfo): ProgramInfo => ({
  id: program.id,
  name: program.name,
  summary: program.summary,
  description: program.description,
  imageURL: program.imageURL,
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

export const ReferralProgramDetailsContent: React.FC<
  ReferralProgramDetailsContentProps
> = ({ program, cta, preview = false }) => {
  const displayProgram = useMemo(() => toProgramInfo(program), [program]);

  return (
    <>
      <ReferralTopCard
        program={displayProgram}
        title={program.name}
        subTitle={program.summary ?? program.description}
        rewardsReferrer={true}
        rewardsReferee={false}
        cta={cta}
      />

      <ReferralMainColumns
        left={
          <>
            <ReferralInfoCard>
              <div className="-mx-3 -my-5">
                <Editor
                  value={
                    displayProgram.description ?? displayProgram.summary ?? ""
                  }
                  readonly={true}
                />
              </div>
            </ReferralInfoCard>

            {displayProgram.pathwayRequired && (
              <ReferralTasksCard
                model={displayProgram.pathway}
                preview={preview}
              />
            )}
          </>
        }
        right={
          <div className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow">
            <ReferralStatCard
              icon={<IoTrophyOutline className="h-5 w-5" />}
              header="Reward"
              description={
                (displayProgram.zltoRewardReferrer || 0) > 0
                  ? `${displayProgram.zltoRewardReferrer} Zlto`
                  : "No reward"
              }
              className="bg-purple-dark [&_.referral-stat-card-description]:text-white [&_.referral-stat-card-header]:text-white [&_.referral-stat-card-icon-wrap]:bg-white/20 [&_.referral-stat-card-icon-wrap]:text-white"
            />

            <ReferralStatCard
              icon={<IoTimeOutline className="h-5 w-5" />}
              header="Time requirement"
              description={
                displayProgram.completionWindowInDays
                  ? `${displayProgram.completionWindowInDays} day${displayProgram.completionWindowInDays === 1 ? "" : "s"}`
                  : "No time limit"
              }
            />
          </div>
        }
      />
    </>
  );
};
