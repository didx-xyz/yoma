import { IoWarning, IoInformationCircle } from "react-icons/io5";
import {
  PathwayCompletionRule,
  type PathwayOrderMode,
  type ProgramPathwayStepInfo,
} from "~/api/models/referrals";

// PathwayHeader Component
interface PathwayHeaderProps {
  name: string;
  description?: string | null;
}

export const PathwayHeader: React.FC<PathwayHeaderProps> = ({
  name,
  description,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
      {description && <p className="text-sm text-gray-600">{description}</p>}
    </div>
  );
};

// NonCompletableWarning Component
interface NonCompletableWarningProps {
  type: "pathway" | "step";
}

export const NonCompletableWarning: React.FC<NonCompletableWarningProps> = ({
  type,
}) => {
  return (
    <div className="flex items-start gap-3 rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4">
      <IoWarning className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-yellow-900">Not Completable</p>
        <p className="mt-1 text-xs text-yellow-800">
          This {type} cannot be marked as complete at this time. Please contact
          support if you believe this is an error.
        </p>
      </div>
    </div>
  );
};

// PathwayStepInfoDisplay Component
interface PathwayStepInfoDisplayProps {
  step: ProgramPathwayStepInfo;
  stepIndex: number;
  isSequential: boolean;
  totalSteps: number;
}

export const PathwayStepInfoDisplay: React.FC<PathwayStepInfoDisplayProps> = ({
  step,
  stepIndex,
  isSequential,
}) => {
  return (
    <div className="flex gap-4">
      {isSequential && (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          {stepIndex + 1}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between">
          <h4 className="text-base font-semibold text-gray-900">{step.name}</h4>
          {step.completed && (
            <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
              ✓ Complete
            </span>
          )}
        </div>
        {step.description && (
          <p className="text-sm text-gray-600">{step.description}</p>
        )}
        {!step.isCompletable && <NonCompletableWarning type="step" />}
      </div>
    </div>
  );
};

// StepDivider Component
interface StepDividerProps {
  isSequential: boolean;
  rule: PathwayCompletionRule | string;
}

export const StepDivider: React.FC<StepDividerProps> = ({
  isSequential,
  rule,
}) => {
  // Determine divider text based on rule
  const getDividerText = () => {
    if (rule === PathwayCompletionRule.Any || rule === "Any") {
      return "OR";
    }
    return isSequential ? "THEN" : "AND";
  };

  return (
    <div className="flex items-center gap-3">
      {isSequential && (
        <div className="ml-5 h-8 w-0.5 flex-shrink-0 bg-gray-300" />
      )}
      <div className="flex flex-1 items-center gap-3">
        <div className="h-px flex-1 bg-gray-300" />
        <span className="text-xs font-semibold text-gray-500">
          {getDividerText()}
        </span>
        <div className="h-px flex-1 bg-gray-300" />
      </div>
    </div>
  );
};
