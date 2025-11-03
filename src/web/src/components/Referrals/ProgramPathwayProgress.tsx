import {
  PathwayOrderMode,
  PathwayCompletionRule,
  type ProgramPathwayProgress,
} from "~/api/models/referrals";
import type { Opportunity } from "~/api/models/opportunity";
import PathwayTaskOpportunity from "./PathwayTaskOpportunity";

// Reusable Progress Display Component
const ProgressDisplay: React.FC<{
  completed: number;
  total: number;
  percentComplete: number;
  isCompleted: boolean;
  color?: "blue" | "green";
}> = ({ completed, total, percentComplete, isCompleted, color = "blue" }) => (
  <div className="flex items-center gap-2">
    <span className={`text-xs font-semibold text-${color}-700`}>
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
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      {/* Pathway Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{pathway.name}</h3>
        {pathway.description && (
          <p className="mt-1 text-sm text-gray-600">{pathway.description}</p>
        )}
      </div>

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
                {pathway.steps.length > 1 ? (
                  <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="flex flex-col items-center md:flex-row md:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-400 bg-white text-xs font-bold text-blue-600">
                          !
                        </span>
                        <p className="text-sm font-medium text-blue-900">
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
                              in <span className="font-bold">ORDER</span> (one
                              after another)
                            </>
                          ) : pathway.rule === PathwayCompletionRule.All &&
                            pathway.orderMode === PathwayOrderMode.AnyOrder ? (
                            <>
                              {" "}
                              in <span className="font-bold">
                                ANY ORDER
                              </span>{" "}
                              you prefer
                            </>
                          ) : (
                            ""
                          )}
                        </p>
                      </div>
                      {/* Step Progress */}
                      <ProgressDisplay
                        completed={pathway.stepsCompleted ?? 0}
                        total={pathway.stepsTotal ?? 0}
                        percentComplete={pathway.percentComplete ?? 0}
                        isCompleted={pathway.completed ?? false}
                        color="blue"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="flex flex-col justify-between gap-2 md:flex-row">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-400 bg-white text-xs font-bold text-blue-600">
                          !
                        </span>
                        <p className="text-sm font-medium text-blue-900">
                          Complete this step
                        </p>
                      </div>
                      {/* Step Progress */}
                      <ProgressDisplay
                        completed={pathway.stepsCompleted ?? 0}
                        total={pathway.stepsTotal ?? 0}
                        percentComplete={pathway.percentComplete ?? 0}
                        isCompleted={pathway.completed ?? false}
                        color="blue"
                      />
                    </div>
                  </div>
                )}

                {pathway.steps?.map((step, stepIndex) => {
                  const hasSequentialTasks =
                    step.rule !== PathwayCompletionRule.Any &&
                    step.orderMode === PathwayOrderMode.Sequential;

                  return (
                    <div key={step.id} className="space-y-3">
                      {/* Step Header */}
                      <div className="flex items-start gap-3">
                        {/* Step Number Badge - only show if multiple steps */}
                        <div className="flex-shrink-0">
                          {showNumberedSteps ? (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 font-bold text-white">
                              {stepIndex + 1}
                            </div>
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-400 bg-white text-lg font-bold text-blue-600">
                              ?
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h4 className="font-semibold break-words text-gray-900">
                            {step.name}
                          </h4>
                          {step.description && (
                            <p className="mt-1 text-sm text-gray-600">
                              {step.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Tasks Section */}
                      {step.tasks && step.tasks.length > 0 && (
                        <div className="mt-6 ml-11 space-y-3">
                          {/* Task Instruction Header */}
                          {step.tasks.length === 1 ? (
                            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
                              <div className="flex flex-col justify-between gap-2 md:flex-row">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-green-400 bg-white text-xs font-bold text-green-600">
                                    ✓
                                  </span>
                                  <p className="text-sm font-medium text-green-900">
                                    Complete this task
                                  </p>
                                </div>
                                {/* Task Progress */}
                                <ProgressDisplay
                                  completed={step.tasks[0]?.completed ? 1 : 0}
                                  total={1}
                                  percentComplete={
                                    step.tasks[0]?.completed ? 100 : 0
                                  }
                                  isCompleted={
                                    step.tasks[0]?.completed ?? false
                                  }
                                  color="green"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
                              <div className="flex flex-col justify-between gap-2 md:flex-row">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-green-400 bg-white text-xs font-bold text-green-600">
                                    ✓
                                  </span>
                                  <p className="text-sm font-medium text-green-900">
                                    Complete{" "}
                                    <span className="font-bold">
                                      {step.rule === PathwayCompletionRule.All
                                        ? "ALL"
                                        : "ANY ONE"}
                                    </span>{" "}
                                    of these {step.tasks.length} tasks
                                    {step.rule === PathwayCompletionRule.All &&
                                    hasSequentialTasks ? (
                                      <>
                                        {" "}
                                        in{" "}
                                        <span className="font-bold">ORDER</span>
                                      </>
                                    ) : step.rule ===
                                      PathwayCompletionRule.All ? (
                                      <>
                                        {" "}
                                        in{" "}
                                        <span className="font-bold">
                                          ANY ORDER
                                        </span>
                                      </>
                                    ) : (
                                      ""
                                    )}
                                  </p>
                                </div>
                                {/* Task Progress */}
                                <ProgressDisplay
                                  completed={step.tasksCompleted}
                                  total={step.tasksTotal}
                                  percentComplete={step.percentComplete}
                                  isCompleted={step.completed}
                                  color="green"
                                />
                              </div>
                            </div>
                          )}

                          {/* Tasks List */}
                          <div className="space-y-0">
                            {step.tasks.map((task, taskIndex) => (
                              <div key={task.id}>
                                <div className="flex gap-3">
                                  {/* Task Number/Bullet */}
                                  <div className="flex-shrink-0">
                                    {task.completed ? (
                                      <div
                                        className="tooltip flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white"
                                        data-tip="You completed this task"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                          className="h-5 w-5"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </div>
                                    ) : step.rule !==
                                        PathwayCompletionRule.Any &&
                                      hasSequentialTasks ? (
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-green-400 bg-white font-semibold text-green-600">
                                        {taskIndex + 1}
                                      </div>
                                    ) : (
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-green-400 bg-white text-lg font-bold text-green-600">
                                        ?
                                      </div>
                                    )}
                                  </div>

                                  {/* Task Content */}
                                  <div
                                    className={`mb-4 min-w-0 flex-1 rounded border border-gray-200 p-3 ${step.tasks.length === 1 ? "" : "ml-4"}`}
                                  >
                                    {task.opportunity?.id ? (
                                      <PathwayTaskOpportunity
                                        opportunityId={task.opportunity.id}
                                        mockOpportunity={
                                          mockOpportunities?.[
                                            task.opportunity.id
                                          ]
                                        }
                                      />
                                    ) : (
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-sm text-yellow-700">
                                          <span>⚠️</span>
                                          <span className="font-medium">
                                            Opportunity configuration incomplete
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                          The opportunity data for this task is
                                          not available. This may occur if the
                                          pathway was configured but the
                                          opportunity relationship hasn&apos;t
                                          been established by the API yet.
                                        </p>
                                        {task.id && (
                                          <div className="mt-1 text-xs text-gray-400">
                                            Task ID: {task.id}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* AND/OR indicator between tasks */}
                                {taskIndex < step.tasks.length - 1 && (
                                  <div className="mb-4 flex justify-center">
                                    <div className="badge badge-sm border-green-400 bg-green-400 px-3 py-2 font-bold text-white">
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

                      {/* Divider between steps */}
                      {stepIndex < pathway.steps.length - 1 && (
                        <div className="my-4 flex items-center gap-3">
                          {showNumberedSteps ? (
                            <>
                              <div className="h-0.5 flex-1 bg-gray-200" />
                              <span className="text-sm font-semibold text-blue-600">
                                THEN
                              </span>
                              <div className="h-0.5 flex-1 bg-gray-200" />
                            </>
                          ) : (
                            <>
                              <div className="h-0.5 flex-1 bg-gray-200" />
                              <span className="text-sm font-semibold text-blue-600">
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
        <p className="text-sm text-gray-500">
          No steps configured for this pathway.
        </p>
      )}
    </div>
  );
};
