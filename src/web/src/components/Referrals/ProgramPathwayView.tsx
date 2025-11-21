import React from "react";
import {
  PathwayOrderMode,
  PathwayCompletionRule,
  type ProgramPathwayInfo,
} from "~/api/models/referrals";
import {
  StepInstructionHeader,
  StepNumberBadge,
  TaskInstructionHeader,
  PathwayTasksList,
  PathwayWarning,
  StepWarning,
  StepDivider,
} from "./InstructionHeaders";
import { PathwayHeader } from "./PathwayComponents";

export interface ProgramPathwayViewProps {
  pathway: ProgramPathwayInfo;
  className?: string;
  isAdmin?: boolean;
  opportunityDataMap?: Record<string, any>; // Opportunity or OpportunityInfo
}

export const ProgramPathwayView: React.FC<ProgramPathwayViewProps> = ({
  pathway,
  className = "rounded-lg border border-gray-200 bg-gray-50 p-4",
  isAdmin = false,
  opportunityDataMap,
}) => {
  return (
    <div className={`flex w-full flex-col gap-2 ${className}`}>
      {/* Pathway Header */}
      <PathwayHeader name={pathway.name} description={pathway.description} />

      {/* Non-Completable Pathway Warning */}
      {!pathway.isCompletable && <PathwayWarning />}

      {pathway.steps && pathway.steps.length > 0 ? (
        <div className="w-full space-y-6 rounded-lg border border-gray-200 bg-white p-4">
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
                />

                {pathway.steps?.map((step, stepIndex) => {
                  return (
                    <div key={step.id} className="w-full space-y-3">
                      {/* Step Header */}
                      <div className="flex items-start gap-3">
                        {/* Step Number Badge */}
                        <div className="flex-shrink-0">
                          <StepNumberBadge
                            stepIndex={stepIndex}
                            isCompleted={step.completed ?? false}
                            isSequential={showNumberedSteps}
                            totalSteps={pathway.steps?.length ?? 0}
                            color="blue"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold break-words text-gray-900">
                            {step.name}
                          </h4>
                          {step.description && (
                            <p className="mt-1 text-xs break-words text-gray-600">
                              {step.description}
                            </p>
                          )}

                          {/* Non-Completable Step Warning */}
                          {!step.isCompletable && <StepWarning />}
                        </div>
                      </div>

                      {/* Tasks Section */}
                      {step.tasks && step.tasks.length > 0 && (
                        <div className="mt-2 w-full space-y-3 pl-9">
                          {/* Task Instruction Header */}
                          <TaskInstructionHeader
                            tasksLength={step.tasks.length}
                            rule={step.rule}
                            orderMode={step.orderMode}
                          />

                          {/* Tasks List */}
                          <PathwayTasksList
                            tasks={step.tasks as any}
                            rule={step.rule}
                            orderMode={step.orderMode}
                            isAdmin={isAdmin}
                            opportunityDataMap={opportunityDataMap}
                          />
                        </div>
                      )}

                      {/* Divider between steps */}
                      {stepIndex < (pathway.steps?.length ?? 0) - 1 && (
                        <StepDivider
                          isSequential={showNumberedSteps}
                          rule={pathway.rule}
                        />
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
