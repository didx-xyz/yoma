import Link from "next/link";
import { useMemo } from "react";
import { IoInformationCircleOutline, IoOpenOutline } from "react-icons/io5";
import { IoIosCheckmarkCircle } from "react-icons/io";
import {
  type ProgramPathwayInfo,
  type ProgramPathwayProgress,
} from "~/api/models/referrals";

interface ReferralTasksCardProps {
  model: ProgramPathwayInfo | null;
  progressModel?: ProgramPathwayProgress | null;
}

export const ReferralTasksCard = ({
  model,
  progressModel,
}: ReferralTasksCardProps) => {
  const stepGroups = useMemo(() => {
    if (progressModel?.steps?.length) {
      return [...progressModel.steps]
        .sort((a, b) => (a.orderDisplay ?? 0) - (b.orderDisplay ?? 0))
        .map((step) => {
          const tasks = (step.tasks ?? []).map((task) => ({
            id: task.id,
            title: task.opportunity?.title || "Opportunity",
            description: "Short description of opportunity",
            opportunityId: task.opportunity?.id || null,
            //opportunityTitle: task.opportunity?.title || null,
            completed: Boolean(task.completed),
            completedAt: task.dateCompleted ?? null,
          }));

          return {
            stepId: step.id,
            stepOrderDisplay: step.orderDisplay ?? Number.MAX_SAFE_INTEGER,
            stepRule: step.rule ?? null,
            stepOrderMode: step.orderMode ?? null,
            completed:
              tasks.length > 0 && tasks.every((task) => task.completed),
            tasks,
          };
        });
    }

    const sourceSteps = model?.steps ?? [];
    if (sourceSteps.length === 0) return [];

    return [...sourceSteps]
      .sort((a, b) => (a.orderDisplay ?? 0) - (b.orderDisplay ?? 0))
      .map((step) => {
        const tasks = (step.tasks ?? []).map((task) => ({
          id: task.id,
          title: task.opportunity?.title || "Opportunity",
          description: "Short description of opportunity",
          opportunityId: task.opportunity?.id || null,
          completed: task.completed ?? false,
          completedAt: null,
        }));

        return {
          stepId: step.id,
          stepOrderDisplay: step.orderDisplay ?? Number.MAX_SAFE_INTEGER,
          stepRule: step.rule ?? null,
          stepOrderMode: step.orderMode ?? null,
          completed: tasks.length > 0 && tasks.every((task) => task.completed),
          tasks,
        };
      });
  }, [model?.steps, progressModel?.steps]);

  const getStepInstruction = (
    stepIndex: number,
    previousStepCompleted: boolean,
    stepRule: string | null,
    stepOrderMode: string | null,
    taskCount: number,
    isCompleted: boolean,
  ) => {
    if (stepIndex > 0 && previousStepCompleted && !isCompleted) {
      return taskCount === 1
        ? "Complete this task next"
        : "Complete these tasks next";
    }

    if (isCompleted) {
      return taskCount === 1
        ? "You completed this task"
        : "You completed these tasks";
    }

    if (taskCount === 1) {
      return "Complete this task";
    }

    const ruleText =
      stepRule?.toLowerCase() === "any"
        ? "Complete any task"
        : "Complete these tasks";

    const orderText =
      stepOrderMode?.toLowerCase() === "anyorder" ? "in any order" : "in order";

    const baseInstruction = `${ruleText} ${orderText}`;

    if (stepIndex === 0) {
      return baseInstruction;
    }

    return stepOrderMode?.toLowerCase() === "anyorder"
      ? `Or ${baseInstruction.charAt(0).toLowerCase()}${baseInstruction.slice(1)}`
      : `Then ${baseInstruction.charAt(0).toLowerCase()}${baseInstruction.slice(1)}`;
  };

  return (
    <div className="px-0 py-0">
      <div>
        <div className="space-y-3">
          {stepGroups.length > 0 ? (
            stepGroups.map((step, stepIndex) => (
              <div key={step.stepId} className="space-y-3">
                <div className="space-y-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
                  <div>
                    <p className="text-lg font-semibold text-black">
                      {(() => {
                        return getStepInstruction(
                          stepIndex,
                          stepIndex > 0
                            ? (stepGroups[stepIndex - 1]?.completed ?? false)
                            : false,
                          step.stepRule,
                          step.stepOrderMode,
                          step.tasks.length,
                          step.completed,
                        );
                      })()}
                    </p>
                  </div>

                  {!step.completed && (
                    <div className="bg-base-200 mt-3 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
                      <IoInformationCircleOutline className="text-green h-5 w-5 shrink-0" />
                      <span className="text-gray-dark">
                        Click a task below →{" "}
                        <span className="font-semibold text-black">
                          Go to the Opportunity
                        </span>
                        &nbsp;→ complete it → upload proof via
                        <span className="font-semibold text-black">
                          {" "}
                          Upload your completion files
                        </span>
                      </span>
                    </div>
                  )}

                  {step.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 md:flex-row md:items-center"
                    >
                      {/* TODO: add org logo & title */}
                      <div className="flex w-full min-w-0 flex-col pr-3">
                        <p
                          className={`truncate text-base font-semibold ${task.completed ? "text-gray-500 line-through" : "text-black"}`}
                        >
                          {task.title}
                        </p>
                        <p
                          className={`truncate text-sm ${task.completed ? "text-gray-500 line-through" : "text-gray-dark"}`}
                        >
                          {task.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-center">
                        {task.completed ? (
                          <div className="text-green inline-flex w-[160px] items-center justify-start gap-2">
                            <span className="bg-green/10 text-green inline-flex h-9 w-9 items-center justify-center rounded-full">
                              <IoIosCheckmarkCircle className="h-6 w-6" />
                            </span>
                            <span className="text-xs leading-tight font-semibold">
                              {task.completedAt ? (
                                <>
                                  <span className="block">Completed on</span>
                                  <span className="block">
                                    {new Date(
                                      task.completedAt,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                </>
                              ) : (
                                "Completed"
                              )}
                            </span>
                          </div>
                        ) : task.opportunityId ? (
                          <Link
                            href={`/opportunities/${task.opportunityId}`}
                            className="btn btn-sm bg-green hover:bg-green-dark h-9 w-[160px] rounded-full border-0 px-5 text-white normal-case"
                          >
                            <IoOpenOutline className="h-4 w-4" />
                            Open
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled={true}
                            className="btn btn-sm h-9 w-[160px] rounded-full border-0 px-5 text-white normal-case"
                          >
                            Open
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* NB: divider text removed due to confusion */}
                {/* {stepIndex < stepGroups.length - 1 && (
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-gray-300" />
                    <span className="text-lg font-semibold text-black">
                      {step.completed ? "What's next?" : stepDividerLabel}
                    </span>
                    <div className="h-px flex-1 bg-gray-300" />
                  </div>
                )} */}
              </div>
            ))
          ) : (
            <div className="text-gray-dark rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
              No pathway tasks configured for this programme yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
