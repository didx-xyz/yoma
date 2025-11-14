import React from "react";
import {
  PathwayOrderMode,
  PathwayCompletionRule,
  type ProgramPathwayInfo,
} from "~/api/models/referrals";
import { StepInstructionHeader } from "./InstructionHeaders";
import {
  PathwayHeader,
  NonCompletableWarning,
  PathwayStepInfoDisplay,
  StepDivider,
} from "./PathwayComponents";

export interface ProgramPathwayViewProps {
  pathway: ProgramPathwayInfo;
  className?: string;
}

export const ProgramPathwayView: React.FC<ProgramPathwayViewProps> = ({
  pathway,
  className = "",
}) => {
  return (
    <div
      className={`flex min-w-0 flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 ${className}`}
    >
      {/* Pathway Header */}
      <PathwayHeader name={pathway.name} description={pathway.description} />

      {/* Non-Completable Pathway Warning */}
      {!pathway.isCompletable && <NonCompletableWarning type="pathway" />}

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
                />

                {pathway.steps?.map((step, stepIndex) => (
                  <React.Fragment key={step.id}>
                    <PathwayStepInfoDisplay
                      step={step}
                      stepIndex={stepIndex}
                      isSequential={showNumberedSteps}
                      totalSteps={pathway.steps?.length ?? 0}
                    />

                    {/* Divider between steps */}
                    {stepIndex < (pathway.steps?.length ?? 0) - 1 && (
                      <StepDivider
                        isSequential={showNumberedSteps}
                        rule={pathway.rule}
                      />
                    )}
                  </React.Fragment>
                ))}
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
