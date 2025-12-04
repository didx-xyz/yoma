import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import { useMemo } from "react";
import { IoIosCheckmarkCircle, IoMdClose } from "react-icons/io";
import Moment from "react-moment";
import type { Opportunity } from "~/api/models/opportunity";
import {
  PathwayCompletionRule,
  PathwayTaskEntityType,
  Program,
  ProgramPathwayInfo,
} from "~/api/models/referrals";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import { ProgramPathwayView } from "./ProgramPathwayView";
import { ProgramStatusBadge } from "./ProgramStatusBadge";

export enum ProgramInfoFilterOptions {
  PROGRAM_INFO = "programInfo",
  COMPLETION_REWARDS = "completionRewards",
  ZLTO_REWARDS = "zltoRewards",
  FEATURES = "features",
  PATHWAY = "pathway",
  AUDIT_INFO = "auditInfo",
}

interface AdminProgramInfoProps {
  program: Program;
  filterOptions?: ProgramInfoFilterOptions[];
  isExpanded?: boolean;
  imagePreviewUrl?: string | null;
  opportunityDataMap?: Record<string, Opportunity>;
}

export const AdminProgramInfo: React.FC<AdminProgramInfoProps> = ({
  program,
  filterOptions = [
    ProgramInfoFilterOptions.PROGRAM_INFO,
    ProgramInfoFilterOptions.COMPLETION_REWARDS,
    ProgramInfoFilterOptions.ZLTO_REWARDS,
    ProgramInfoFilterOptions.FEATURES,
    ProgramInfoFilterOptions.PATHWAY,
    ProgramInfoFilterOptions.AUDIT_INFO,
  ],
  opportunityDataMap,
}) => {
  // Map ProgramPathway to ProgramPathwayInfo for preview display
  const pathwayInfo = useMemo((): ProgramPathwayInfo | null => {
    if (!program.pathway) return null;

    const steps =
      program.pathway.steps?.map((step) => {
        const tasks =
          step.tasks?.map((task) => {
            const oppId = task.opportunity?.id || (task as any).entityId;
            const oppData = oppId ? opportunityDataMap?.[oppId] : null;

            return {
              id: task.id,
              entityType: task.entityType as PathwayTaskEntityType,
              opportunity: task.opportunity
                ? task.opportunity
                : oppId
                  ? {
                      id: oppId,
                      title: oppData?.title || "Selected Opportunity",
                    }
                  : null,
              order: task.order,
              orderDisplay: task.orderDisplay ?? 0,
              completed: null,
              isCompletable: oppData?.isCompletable ?? true,
              nonCompletableReason: oppData?.nonCompletableReason ?? null,
            };
          }) ?? [];

        // Step is completable if all its tasks are completable
        const stepIsCompletable = tasks.every((t) => t.isCompletable !== false);

        return {
          id: step.id,
          name: step.name,
          description: step.description ?? null,
          rule: step.rule as PathwayCompletionRule,
          orderMode: step.orderMode ?? null,
          order: step.order,
          orderDisplay: step.orderDisplay ?? null,
          completed: null,
          isCompletable: stepIsCompletable,
          tasks,
        };
      }) ?? [];

    // Pathway is completable if all steps are completable
    const pathwayIsCompletable = steps.every((s) => s.isCompletable !== false);

    return {
      id: program.pathway.id,
      name: program.pathway.name,
      description: program.pathway.description ?? null,
      rule: program.pathway.rule as PathwayCompletionRule,
      orderMode: program.pathway.orderMode ?? null,
      isCompletable: pathwayIsCompletable,
      steps,
    };
  }, [program.pathway, opportunityDataMap]);

  return (
    <div className="space-y-6">
      {/* Program Information */}
      {filterOptions?.includes(ProgramInfoFilterOptions.PROGRAM_INFO) && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            📄 Program Information
          </h2>
          <div className="overflow-x-auto">
            <div className="grid overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  Status
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.status ? (
                    <ProgramStatusBadge status={program.status} />
                  ) : (
                    "Not set"
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  Default Program
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.isDefault ? (
                    <IoIosCheckmarkCircle className="text-green inline h-5 w-5" />
                  ) : (
                    <IoMdClose className="text-gray-dark inline h-5 w-5" />
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  Start Date
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.dateStart ? (
                    <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                      {program.dateStart}
                    </Moment>
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  End Date
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.dateEnd ? (
                    <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                      {program.dateEnd}
                    </Moment>
                  ) : (
                    "No end date"
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Completion & Rewards */}
      {filterOptions?.includes(ProgramInfoFilterOptions.COMPLETION_REWARDS) && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            ⚙️ Completion & Rewards
          </h2>
          <div className="overflow-x-auto">
            <div className="grid overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  Completion Window
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.completionWindowInDays
                    ? `${program.completionWindowInDays} days`
                    : "Not set"}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  Referrer Cap
                  <div className="text-xs font-normal text-gray-500">
                    (Per referrer limit)
                  </div>
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.completionLimitReferee ?? "No limit"}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  Program Cap
                  <div className="text-xs font-normal text-gray-500">
                    (Total program limit)
                  </div>
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.completionLimit ?? "No limit"}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  Total Completions
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  <span className="badge bg-green-light text-green font-semibold">
                    {program?.completionTotal ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ZLTO Rewards */}
      {filterOptions?.includes(ProgramInfoFilterOptions.ZLTO_REWARDS) && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            💰 ZLTO Rewards
          </h2>
          <div className="overflow-x-auto">
            <div className="grid overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  Referee Reward
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.zltoRewardReferee ? (
                    <div className="flex items-center gap-1">
                      <Image
                        src={iconZlto}
                        alt="Zlto"
                        width={16}
                        height={16}
                        className="h-auto"
                      />
                      <span className="font-semibold">
                        {program.zltoRewardReferee}
                      </span>
                    </div>
                  ) : (
                    "Not set"
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  Referrer Reward
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.zltoRewardReferrer ? (
                    <div className="flex items-center gap-1">
                      <Image
                        src={iconZlto}
                        alt="Zlto"
                        width={16}
                        height={16}
                        className="h-auto"
                      />
                      <span className="font-semibold">
                        {program.zltoRewardReferrer}
                      </span>
                    </div>
                  ) : (
                    "Not set"
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  ZLTO Pool
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.zltoRewardPool ? (
                    <div className="flex items-center gap-1">
                      <Image
                        src={iconZlto}
                        alt="Zlto"
                        width={16}
                        height={16}
                        className="h-auto"
                      />
                      <span className="font-semibold">
                        {program.zltoRewardPool}
                      </span>
                    </div>
                  ) : (
                    "Not set"
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  ZLTO Cumulative
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.zltoRewardCumulative !== null &&
                  program?.zltoRewardCumulative !== undefined ? (
                    <div className="flex items-center gap-1">
                      <Image
                        src={iconZlto}
                        alt="Zlto"
                        width={16}
                        height={16}
                        className="h-auto"
                      />
                      <span className="font-semibold">
                        {program.zltoRewardCumulative}
                      </span>
                    </div>
                  ) : (
                    "0"
                  )}
                </div>
              </div>

              <div className="flex md:col-span-2">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  ZLTO Balance
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.zltoRewardBalance !== null &&
                  program?.zltoRewardBalance !== undefined ? (
                    <div className="flex items-center gap-1">
                      <Image
                        src={iconZlto}
                        alt="Zlto"
                        width={16}
                        height={16}
                        className="h-auto"
                      />
                      <span className="font-semibold text-blue-600">
                        {program.zltoRewardBalance}
                      </span>
                    </div>
                  ) : (
                    "Not tracked"
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      {filterOptions?.includes(ProgramInfoFilterOptions.FEATURES) && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            ✨ Features
          </h2>
          <div className="overflow-x-auto">
            <div className="grid overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  Default Program
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.isDefault ? (
                    <div className="flex items-center gap-2">
                      <IoIosCheckmarkCircle className="text-green h-5 w-5" />
                      <span>Default</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <IoMdClose className="text-gray-dark h-5 w-5" />
                      <span>Not default</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  Proof of Personhood
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.proofOfPersonhoodRequired ? (
                    <div className="flex items-center gap-2">
                      <IoIosCheckmarkCircle className="text-green h-5 w-5" />
                      <span>Required</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <IoMdClose className="text-gray-dark h-5 w-5" />
                      <span>Not required</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  Multiple Links
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.multipleLinksAllowed ? (
                    <div className="flex items-center gap-2">
                      <IoIosCheckmarkCircle className="text-green h-5 w-5" />
                      <span>Allowed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <IoMdClose className="text-gray-dark h-5 w-5" />
                      <span>Not allowed</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  Engagement Pathway
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.pathwayRequired ? (
                    <div className="flex items-center gap-2">
                      <IoIosCheckmarkCircle className="text-green h-5 w-5" />
                      <span>Required</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <IoMdClose className="text-gray-dark h-5 w-5" />
                      <span>Not required</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Engagement Pathway */}
      {filterOptions?.includes(ProgramInfoFilterOptions.PATHWAY) && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            🛤️ Engagement Pathway
          </h2>
          <div className="overflow-x-auto">
            {pathwayInfo ? (
              <ProgramPathwayView
                pathway={pathwayInfo}
                isAdmin={true}
                opportunityDataMap={opportunityDataMap}
              />
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">No pathway configured</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Audit Information - Optional */}
      {filterOptions?.includes(ProgramInfoFilterOptions.AUDIT_INFO) && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            📋 Audit Information
          </h2>
          <div className="overflow-x-auto">
            <div className="grid overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  Created
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.dateCreated ? (
                    <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                      {program.dateCreated}
                    </Moment>
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  Created By
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.createdByUserId ?? "N/A"}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  Last Modified
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.dateModified ? (
                    <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                      {program.dateModified}
                    </Moment>
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  Modified By
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                  {program?.modifiedByUserId ?? "N/A"}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
