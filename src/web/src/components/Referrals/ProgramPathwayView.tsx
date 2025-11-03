import {
  PathwayOrderMode,
  PathwayCompletionRule,
  type ProgramPathwayInfo,
} from "~/api/models/referrals";
import PathwayTaskOpportunityPublic from "./PathwayTaskOpportunityPublic";
import { IoList, IoCheckmarkCircle, IoCheckmark } from "react-icons/io5";

export interface ProgramPathwayViewProps {
  pathway: ProgramPathwayInfo;
  className?: string;
}

export const ProgramPathwayView: React.FC<ProgramPathwayViewProps> = ({
  pathway,
  className = "",
}) => {
  // Check if pathway has sequential order mode
  const showNumberedSteps =
    pathway.rule !== PathwayCompletionRule.Any &&
    pathway.orderMode === PathwayOrderMode.Sequential;

  return (
    <div className={className}>
      <div>
        <p className="mb-2 text-xs font-semibold text-blue-900">
          {pathway.name}
        </p>
        {pathway.description && (
          <p className="mb-3 text-xs text-blue-800">{pathway.description}</p>
        )}

        {pathway.steps && pathway.steps.length > 0 ? (
          <div className="space-y-2">
            {/* Step Instruction Header */}
            {pathway.steps.length > 1 ? (
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-400 bg-white text-xs font-bold text-blue-600">
                    !
                  </span>
                  <p className="text-xs font-medium text-blue-900">
                    Complete{" "}
                    <span className="font-bold">
                      {pathway.rule === PathwayCompletionRule.All
                        ? "ALL"
                        : "ANY ONE"}
                    </span>{" "}
                    of these {pathway.steps.length} steps
                    {pathway.rule === PathwayCompletionRule.All &&
                    pathway.orderMode === PathwayOrderMode.Sequential ? (
                      <>
                        {" "}
                        in <span className="font-bold">ORDER</span> (one after
                        another)
                      </>
                    ) : pathway.rule === PathwayCompletionRule.All &&
                      pathway.orderMode === PathwayOrderMode.AnyOrder ? (
                      <>
                        {" "}
                        in <span className="font-bold">ANY ORDER</span> you
                        prefer
                      </>
                    ) : (
                      ""
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-400 bg-white text-xs font-bold text-blue-600">
                    !
                  </span>
                  <p className="text-xs font-medium text-blue-900">
                    Complete this step
                  </p>
                </div>
              </div>
            )}

            {pathway.steps.map((step, stepIndex) => {
              const hasSequentialTasks =
                step.rule !== PathwayCompletionRule.Any &&
                step.orderMode === PathwayOrderMode.Sequential;

              return (
                <div key={step.id}>
                  <div className="rounded border border-blue-300 bg-white p-2">
                    <div className="flex items-start gap-2">
                      {/* Step Number/Icon */}
                      {showNumberedSteps ? (
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                          {stepIndex + 1}
                        </span>
                      ) : (
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-400 bg-white text-xs font-bold text-blue-600">
                          ?
                        </span>
                      )}

                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-900">
                          {step.name}
                        </p>
                        {step.description && (
                          <p className="mt-0.5 text-xs text-gray-600">
                            {step.description}
                          </p>
                        )}

                        {/* Tasks Section */}
                        {step.tasks && step.tasks.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {/* Task Instruction Header */}
                            {step.tasks.length === 1 ? (
                              <div className="rounded-lg border border-green-200 bg-green-50 p-2">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-green-400 bg-white text-xs font-bold text-green-600">
                                    ✓
                                  </span>
                                  <p className="text-xs font-medium text-green-900">
                                    Complete this task
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-lg border border-green-200 bg-green-50 p-2">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-green-400 bg-white text-xs font-bold text-green-600">
                                    ✓
                                  </span>
                                  <p className="text-xs font-medium text-green-900">
                                    Complete{" "}
                                    <span className="font-bold">
                                      {step.rule === PathwayCompletionRule.Any
                                        ? "ANY ONE"
                                        : "ALL"}
                                    </span>{" "}
                                    of these {step.tasks.length} tasks
                                    {step.rule === PathwayCompletionRule.All &&
                                    hasSequentialTasks ? (
                                      <span className="font-bold">
                                        {" "}
                                        in ORDER
                                      </span>
                                    ) : step.rule ===
                                      PathwayCompletionRule.All ? (
                                      <span className="font-bold">
                                        {" "}
                                        in ANY ORDER
                                      </span>
                                    ) : (
                                      ""
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Tasks List */}
                            <div className="space-y-2">
                              {step.tasks.map((task, taskIndex) => (
                                <div key={task.id}>
                                  <div className="flex gap-2">
                                    {/* Task Number/Bullet */}
                                    <div className="flex-shrink-0">
                                      {step.rule !==
                                        PathwayCompletionRule.Any &&
                                      hasSequentialTasks ? (
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-green-400 bg-white text-xs font-semibold text-green-600">
                                          {taskIndex + 1}
                                        </div>
                                      ) : (
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-green-400 bg-white text-xs font-bold text-green-600">
                                          ?
                                        </div>
                                      )}
                                    </div>

                                    {/* Task Content */}
                                    <div className="min-w-0 flex-1 rounded border border-gray-200 bg-gray-50 p-2">
                                      {task.opportunity?.id ? (
                                        <PathwayTaskOpportunityPublic
                                          opportunityId={task.opportunity.id}
                                        />
                                      ) : (
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-1 text-xs text-yellow-700">
                                            <span>⚠️</span>
                                            <span className="font-medium">
                                              Opportunity configuration
                                              incomplete
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-500">
                                            The opportunity data for this task
                                            is not available.
                                          </p>
                                          {task.id && (
                                            <div className="mt-0.5 text-xs text-gray-400">
                                              Task ID: {task.id}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* AND/OR/THEN indicator between tasks */}
                                  {taskIndex <
                                    (step.tasks?.length ?? 0) - 1 && (
                                    <div className="my-1.5 flex justify-center">
                                      <div className="rounded-full bg-green-400 px-2 py-0.5 text-xs font-bold text-white">
                                        {step.rule === PathwayCompletionRule.Any
                                          ? "OR"
                                          : hasSequentialTasks
                                            ? "THEN"
                                            : "AND"}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step Connector/Divider */}
                  {stepIndex < (pathway.steps?.length ?? 0) - 1 && (
                    <div className="my-2 flex items-center justify-center">
                      {showNumberedSteps ? (
                        <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">
                          THEN
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-400 px-2 py-0.5 text-xs font-bold text-white">
                          {pathway.rule === PathwayCompletionRule.Any
                            ? "OR"
                            : "AND"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-blue-700">
            No steps configured for this pathway.
          </p>
        )}
      </div>
    </div>
  );
};
