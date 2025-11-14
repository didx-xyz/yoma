import type { Opportunity } from "~/api/models/opportunity";
import {
  PathwayCompletionRule,
  PathwayOrderMode,
  type ProgramPathwayProgress,
} from "~/api/models/referrals";
import {
  PathwayTasksList,
  StepInstructionHeader,
  StepNumberBadge,
  TaskInstructionHeader,
} from "./InstructionHeaders";
import { FaRoad } from "react-icons/fa";

// Reusable Progress Display Component
const ProgressDisplay: React.FC<{
  completed: number;
  total: number;
  percentComplete: number;
  isCompleted: boolean;
  color?: "blue" | "green";
}> = ({ completed, total, percentComplete, isCompleted, color = "blue" }) => (
  <div className="flex items-center gap-2">
    <span className={`text-[10px] font-semibold text-${color}-700`}>
      {completed} / {total} ({percentComplete}%)
    </span>
    {isCompleted && <span className="badge badge-success badge-xs">✓</span>}
  </div>
);

export interface ProgramPathwayProgressComponentProps {
  pathway: ProgramPathwayProgress;
  mockOpportunities?: Record<string, Opportunity>;
}

export const ProgramPathwayProgressComponent: React.FC<
  ProgramPathwayProgressComponentProps
> = ({ pathway, mockOpportunities }) => {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      {/* Pathway Header */}
      <h3 className="flex min-w-0 items-center gap-2 text-base font-semibold text-gray-900">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white">
          <FaRoad className="h-3 w-3" />
        </span>
        <span className="max-w-full min-w-0 truncate overflow-hidden">
          {pathway.name}
        </span>
      </h3>
      {pathway.description && (
        <p className="mt-1 max-w-full min-w-0 truncate overflow-hidden text-xs text-gray-600">
          {pathway.description}
        </p>
      )}

      {/* Non-Completable Pathway Warning */}
      {!pathway.isCompletable && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border-2 border-red-300 bg-red-50 p-3">
          <span className="text-lg">🚫</span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-red-900">
              Pathway Currently Unavailable
            </p>
            <p className="mt-1 text-[10px] text-red-800">
              Some tasks in this pathway cannot be completed at this time. This
              may be because opportunities have not started yet, are not
              published, or have other restrictions. Check the individual task
              warnings below for more details.
            </p>
          </div>
        </div>
      )}

      {pathway.steps && pathway.steps.length > 0 ? (
        <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-4">
          {/* Check if pathway has sequential order mode */}
          {(() => {
            const showNumberedSteps =
              pathway.rule !== PathwayCompletionRule.Any &&
              pathway.orderMode === PathwayOrderMode.Sequential;

            return (
              <>
                {/* Step Instruction Header */}
                <StepInstructionHeader
                  stepsLength={pathway.steps.length}
                  rule={pathway.rule}
                  orderMode={pathway.orderMode}
                  completed={pathway.stepsCompleted ?? 0}
                  total={pathway.stepsTotal ?? 0}
                  percentComplete={pathway.percentComplete ?? 0}
                  isCompleted={pathway.completed ?? false}
                />

                {pathway.steps?.map((step, stepIndex) => {
                  const hasSequentialTasks =
                    step.rule !== PathwayCompletionRule.Any &&
                    step.orderMode === PathwayOrderMode.Sequential;

                  return (
                    <div key={step.id} className="space-y-3">
                      {/* Step Header */}
                      <div className="flex items-start gap-3">
                        {/* Step Number Badge */}
                        <div className="flex-shrink-0">
                          <StepNumberBadge
                            stepIndex={stepIndex}
                            isCompleted={step.completed ?? false}
                            isSequential={showNumberedSteps}
                            totalSteps={pathway.steps.length}
                            color="blue"
                          />
                        </div>

                        <div className="flex-1">
                          <h4 className="text-sm font-semibold break-words text-gray-900">
                            {step.name}
                          </h4>
                          {step.description && (
                            <p className="mt-1 text-xs text-gray-600">
                              {step.description}
                            </p>
                          )}

                          {/* Non-Completable Step Warning */}
                          {!step.isCompletable && (
                            <div className="mt-2 flex items-start gap-2 rounded-lg border-2 border-red-300 bg-red-50 p-2">
                              <span className="text-sm">🚫</span>
                              <div className="flex-1">
                                <p className="text-[10px] font-semibold text-red-900">
                                  Step Not Available
                                </p>
                                <p className="mt-0.5 text-[10px] text-red-800">
                                  Some tasks in this step cannot be completed
                                  yet.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Tasks Section */}
                      {step.tasks && step.tasks.length > 0 && (
                        <div className="mt-2 ml-8 space-y-3">
                          {/* Task Instruction Header */}
                          <TaskInstructionHeader
                            tasksLength={step.tasks.length}
                            rule={step.rule}
                            orderMode={step.orderMode}
                            completed={
                              step.tasks.length === 1
                                ? step.tasks[0]?.completed
                                  ? 1
                                  : 0
                                : step.tasksCompleted
                            }
                            total={
                              step.tasks.length === 1 ? 1 : step.tasksTotal
                            }
                            percentComplete={
                              step.tasks.length === 1
                                ? step.tasks[0]?.completed
                                  ? 100
                                  : 0
                                : step.percentComplete
                            }
                            isCompleted={
                              step.tasks.length === 1
                                ? (step.tasks[0]?.completed ?? false)
                                : step.completed
                            }
                            color="green"
                          />

                          {/* Tasks List */}
                          <PathwayTasksList
                            tasks={step.tasks}
                            rule={step.rule}
                            orderMode={step.orderMode}
                            mockOpportunities={mockOpportunities}
                          />
                        </div>
                      )}

                      {/* Divider between steps */}
                      {stepIndex < pathway.steps.length - 1 && (
                        <div className="my-4 flex items-center gap-3">
                          {showNumberedSteps ? (
                            <>
                              <div className="h-0.5 flex-1 bg-gray-200" />
                              <span className="text-xs font-semibold text-blue-600">
                                THEN
                              </span>
                              <div className="h-0.5 flex-1 bg-gray-200" />
                            </>
                          ) : (
                            <>
                              <div className="h-0.5 flex-1 bg-gray-200" />
                              <span className="text-xs font-semibold text-blue-600">
                                {pathway.rule === PathwayCompletionRule.Any
                                  ? "OR"
                                  : "AND"}
                              </span>
                              <div className="h-0.5 flex-1 bg-gray-200" />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      ) : (
        <p className="text-xs text-gray-500">
          No steps configured for this pathway.
        </p>
      )}
    </div>
  );
};
