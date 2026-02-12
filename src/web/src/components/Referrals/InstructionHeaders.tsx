import React from "react";
import {
  PathwayOrderMode,
  PathwayCompletionRule,
  type ProgramPathwayTaskProgress,
} from "~/api/models/referrals";
import type { OpportunityInfo } from "~/api/models/opportunity";
import PathwayTaskOpportunity from "./PathwayTaskOpportunity";
import Link from "next/link";
import { IoArrowForward } from "react-icons/io5";

// Reusable Warning Components
export const PathwayWarning: React.FC = () => (
  <div className="flex items-start gap-2 rounded-lg border-2 border-red-300 bg-red-50 p-3">
    <span className="text-lg">🚫</span>
    <div className="flex-1">
      <p className="text-xs font-semibold text-red-900">
        Pathway Currently Unavailable
      </p>
      <p className="mt-1 text-[10px] text-red-800">
        Some tasks in this pathway cannot be completed at this time. This may be
        because opportunities have not started yet, are not published, or have
        other restrictions such as the countries. Check the individual task
        warnings below for more details.
      </p>
    </div>
  </div>
);

export const StepWarning: React.FC = () => (
  <div className="mt-2 flex items-start gap-2 rounded-lg border-2 border-red-300 bg-red-50 p-2">
    <span className="text-sm">🚫</span>
    <div className="flex-1">
      <p className="text-[10px] font-semibold text-red-900">
        Step Not Available
      </p>
      <p className="mt-0.5 text-[10px] text-red-800">
        Some tasks in this step cannot be completed yet.
      </p>
    </div>
  </div>
);

export interface TaskWarningProps {
  reason?: string;
}

export const TaskWarning: React.FC<TaskWarningProps> = ({ reason }) => (
  <div className="flex items-start gap-2 rounded-lg border-2 border-yellow-300 bg-yellow-50 p-2">
    <span className="text-sm">⚠️</span>
    <div className="flex-1">
      <p className="text-[10px] font-semibold text-yellow-900">
        Task Currently Unavailable
      </p>
      <p className="mt-0.5 text-[10px] text-yellow-800">
        {reason ||
          "This opportunity is no longer available or has been removed."}
      </p>
    </div>
  </div>
);

export interface StepDividerProps {
  isSequential: boolean;
  rule: string;
}

export const StepDivider: React.FC<StepDividerProps> = ({
  isSequential,
  rule,
}) => (
  <div className="my-4 flex items-center gap-3">
    {isSequential ? (
      <>
        <div className="h-0.5 flex-1 bg-gray-200" />
        <span className="text-xs font-semibold text-blue-600">THEN</span>
        <div className="h-0.5 flex-1 bg-gray-200" />
      </>
    ) : (
      <>
        <div className="h-0.5 flex-1 bg-gray-200" />
        <span className="text-xs font-semibold text-blue-600">
          {rule === PathwayCompletionRule.Any ? "OR" : "AND"}
        </span>
        <div className="h-0.5 flex-1 bg-gray-200" />
      </>
    )}
  </div>
);

// Reusable Progress Display Component
const ProgressDisplay: React.FC<{
  completed: number;
  total: number;
  percentComplete: number;
  isCompleted: boolean;
  color?: "blue" | "green" | "white";
}> = ({ completed, total, percentComplete, isCompleted, color = "blue" }) => (
  <div className="flex items-center gap-2">
    <span className={`text-[10px] font-semibold text-${color}-700`}>
      {completed} / {total} ({percentComplete}%)
    </span>
    {isCompleted && <span className="badge badge-success badge-xs">✓</span>}
  </div>
);

// Reusable Step Number Badge Component
export interface StepNumberBadgeProps {
  stepIndex: number;
  isCompleted: boolean;
  isSequential: boolean;
  totalSteps: number;
  color?: "blue" | "purple" | "white";
}

export const StepNumberBadge: React.FC<StepNumberBadgeProps> = ({
  stepIndex,
  isCompleted,
  isSequential,
  totalSteps,
  color = "blue",
}) => {
  const colorClasses = {
    blue: {
      completed: "bg-blue-500 text-white",
      border: "border-blue-400",
      bg: "bg-white",
      text: "text-blue-600",
    },
    purple: {
      completed: "bg-purple-500 text-white",
      border: "border-purple-400",
      bg: "bg-white",
      text: "text-purple-600",
    },
    white: {
      completed: "bg-gray-500 text-white",
      border: "border-gray-400",
      bg: "bg-white",
      text: "text-gray-600",
    },
  };

  const colors = colorClasses[color];

  if (isCompleted) {
    return (
      <div
        className={`tooltip flex h-6 w-6 items-center justify-center rounded-full ${colors.completed}`}
        data-tip="You completed this step"
      >
        <span className="text-xs font-bold">✓</span>
      </div>
    );
  }

  // Show exclamation mark for single step or non-sequential
  if (totalSteps === 1 || !isSequential) {
    return (
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${colors.border} ${colors.bg} text-base font-bold ${colors.text}`}
      >
        !
      </div>
    );
  }

  // Show step number for sequential multi-step
  return (
    <div
      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${colors.border} ${colors.bg} text-sm font-semibold ${colors.text}`}
    >
      {stepIndex + 1}
    </div>
  );
};

// Step Instruction Header Component
export interface StepInstructionHeaderProps {
  stepsLength: number;
  rule: string;
  orderMode: string;
  completed?: number;
  total?: number;
  percentComplete?: number;
  isCompleted?: boolean;
}

export const StepInstructionHeader: React.FC<StepInstructionHeaderProps> = ({
  stepsLength,
  rule,
  orderMode,
  completed,
  total,
  percentComplete,
  isCompleted,
}) => {
  // For single step, show simple message
  if (stepsLength === 1) {
    return (
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div className="flex flex-col justify-between gap-2 md:flex-row">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isCompleted ? "bg-blue-500 text-white" : "border-2 border-blue-400 bg-white text-blue-600"}`}
            >
              {isCompleted ? "✓" : "!"}
            </span>
            {isCompleted ? (
              <p className="text-xs font-medium text-blue-900">
                Well done! You completed this step
              </p>
            ) : (
              <p className="text-xs font-medium text-blue-900">
                Complete this step
              </p>
            )}
          </div>
          {/* Step Progress (optional) */}
          {completed !== undefined &&
            total !== undefined &&
            percentComplete !== undefined &&
            isCompleted !== undefined && (
              <ProgressDisplay
                completed={completed}
                total={total}
                percentComplete={percentComplete}
                isCompleted={isCompleted}
                color="blue"
              />
            )}
        </div>
      </div>
    );
  }

  // For multiple steps, show detailed instruction
  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isCompleted ? "bg-blue-500 text-white" : "border-2 border-blue-400 bg-white text-blue-600"}`}
          >
            {isCompleted ? "✓" : "!"}
          </span>

          {isCompleted ? (
            <p className="text-xs font-medium text-blue-900">
              Well done! You completed{" "}
              <span className="font-bold">{completed ?? stepsLength}</span>{" "}
              {stepsLength === 1 ? "step" : "steps"}
            </p>
          ) : (
            <p className="text-xs font-medium text-blue-900">
              Complete{" "}
              <span className="font-bold">
                {rule === PathwayCompletionRule.All ? "ALL" : "ANY ONE"}
              </span>{" "}
              of these {stepsLength} steps
              {rule === PathwayCompletionRule.All &&
              orderMode === PathwayOrderMode.Sequential ? (
                <>
                  {" "}
                  in <span className="font-bold">ORDER</span> (one after
                  another)
                </>
              ) : rule === PathwayCompletionRule.All &&
                orderMode === PathwayOrderMode.AnyOrder ? (
                <>
                  {" "}
                  in <span className="font-bold">ANY ORDER</span> you prefer
                </>
              ) : (
                ""
              )}
            </p>
          )}
        </div>
        {/* Step Progress (optional) */}
        {completed !== undefined &&
          total !== undefined &&
          percentComplete !== undefined &&
          isCompleted !== undefined && (
            <ProgressDisplay
              completed={completed}
              total={total}
              percentComplete={percentComplete}
              isCompleted={isCompleted}
              color="blue"
            />
          )}
      </div>
    </div>
  );
};

// Task Instruction Header Component
export interface TaskInstructionHeaderProps {
  tasksLength: number;
  rule: string;
  orderMode: string;
  completed?: number;
  total?: number;
  percentComplete?: number;
  isCompleted?: boolean;
  color?: "green" | "orange" | "blue" | "white";
  variant?: "default" | "compact";
  hideIcon?: boolean;
}

export const TaskInstructionHeader: React.FC<TaskInstructionHeaderProps> = ({
  tasksLength,
  rule,
  orderMode,
  completed,
  total,
  percentComplete,
  isCompleted,
  color = "green",
  variant = "default",
  hideIcon = false,
}) => {
  const isCompact = variant === "compact";

  const hasSequentialTasks =
    rule !== PathwayCompletionRule.Any &&
    orderMode === PathwayOrderMode.Sequential;

  const colorClasses = {
    green: {
      border: "border-green-200",
      bg: "bg-green-50",
      iconBorder: "border-green-400",
      iconBg: "bg-white",
      iconText: "text-green-600",
      text: "text-green-900",
    },
    orange: {
      border: "border-orange-200",
      bg: "bg-orange-50",
      iconBorder: "border-orange-500",
      iconBg: "bg-white",
      iconText: "text-orange-600",
      text: "text-orange-900",
    },
    blue: {
      border: "border-blue-200",
      bg: "bg-blue-50",
      iconBorder: "border-blue-500",
      iconBg: "bg-white",
      iconText: "text-blue-600",
      text: "text-blue-900",
    },
    white: {
      border: "border-gray-200",
      bg: "bg-white",
      iconBorder: "border-gray-400",
      iconBg: "bg-white",
      iconText: "text-gray-600",
      text: "text-gray-900",
    },
  };

  const colors = colorClasses[color];

  const containerClassName = isCompact
    ? "mb-2"
    : `mb-4 rounded-lg border ${colors.border} ${colors.bg} p-3`;

  const textClassName = isCompact ? "text-base-content/60" : colors.text;

  const completedIconClassByColor: Record<
    NonNullable<TaskInstructionHeaderProps["color"]>,
    string
  > = {
    green: "bg-green-500 text-white",
    orange: "bg-orange-500 text-white",
    blue: "bg-blue-500 text-white",
    white: "bg-gray-500 text-white",
  };

  const compactIconBorderByColor: Record<
    NonNullable<TaskInstructionHeaderProps["color"]>,
    string
  > = {
    green: "border-green-200 text-green-700",
    orange: "border-orange-200 text-orange-700",
    blue: "border-blue-200 text-blue-700",
    white: "border-base-300 text-base-content/70",
  };

  const compactIconClassName = `border ${compactIconBorderByColor[color]} bg-base-100`;
  const completedIconClassName = completedIconClassByColor[color];

  // For single task, show simple message
  if (tasksLength === 1) {
    return (
      <div className={containerClassName}>
        <div className="flex items-center gap-2">
          {!hideIcon && (
            <span
              className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isCompleted
                  ? completedIconClassName
                  : isCompact
                    ? compactIconClassName
                    : `border-2 ${colors.iconBorder} ${colors.iconBg} ${colors.iconText}`
              }`}
            >
              {isCompleted ? "✓" : "!"}
            </span>
          )}
          <p
            className={`${
              isCompact ? "text-[10px] md:text-xs" : "text-xs"
            } font-medium ${textClassName}`}
          >
            {isCompleted ? "Task completed" : "Complete this task"}
          </p>
        </div>
      </div>
    );
  }

  // For multiple tasks, show detailed instruction
  return (
    <div className={containerClassName}>
      <div className="flex flex-col justify-between gap-2 md:flex-row">
        <div className="flex items-center gap-2">
          {!hideIcon && (
            <span
              className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isCompleted
                  ? completedIconClassName
                  : isCompact
                    ? compactIconClassName
                    : `border-2 ${colors.iconBorder} ${colors.iconBg} ${colors.iconText}`
              }`}
            >
              {isCompleted ? "✓" : "!"}
            </span>
          )}
          {isCompleted ? (
            <p
              className={`${
                isCompact ? "text-[10px] md:text-xs" : "text-xs"
              } font-medium ${textClassName}`}
            >
              You completed{" "}
              <span className="font-bold">{completed ?? tasksLength}</span>{" "}
              {tasksLength === 1 ? "task" : "tasks"}
            </p>
          ) : isCompact ? (
            <p
              className={`text-[10px] font-medium md:text-xs ${textClassName}`}
            >
              Complete these tasks
              {rule === PathwayCompletionRule.Any
                ? " (choose one)"
                : hasSequentialTasks
                  ? " (in order)"
                  : ""}
              .
            </p>
          ) : (
            <p className={`text-xs font-medium ${textClassName}`}>
              Complete{" "}
              <span className="font-bold">
                {rule === PathwayCompletionRule.Any ? "ANY ONE" : "ALL"}
              </span>{" "}
              of these {tasksLength} tasks
              {rule === PathwayCompletionRule.All && hasSequentialTasks ? (
                <>
                  {" "}
                  in <span className="font-bold">ORDER</span>
                </>
              ) : rule === PathwayCompletionRule.All ? (
                <>
                  {" "}
                  in <span className="font-bold">ANY ORDER</span>
                </>
              ) : (
                ""
              )}
            </p>
          )}
        </div>
        {/* Progress Display (optional) */}
        {!isCompact &&
          completed !== undefined &&
          total !== undefined &&
          percentComplete !== undefined &&
          isCompleted !== undefined && (
            <ProgressDisplay
              completed={completed}
              total={total}
              percentComplete={percentComplete}
              isCompleted={isCompleted}
              color={color === "orange" ? "blue" : color}
            />
          )}
      </div>
    </div>
  );
};

// Reusable Task Display Component
export interface PathwayTaskDisplayProps {
  task: ProgramPathwayTaskProgress;
  taskIndex: number;
  isSequential: boolean;
  isAnyRule: boolean;
  opportunityData?: OpportunityInfo; // Optional opportunity data to avoid fetching
  showActionButton?: boolean;
  showBullets?: boolean;
  showBadges?: boolean;
  color?: "green" | "orange" | "white";
  totalTasks?: number;
  isAdmin?: boolean;
  opportunityVariant?: "default" | "compact";
}

export const PathwayTaskDisplay: React.FC<PathwayTaskDisplayProps> = ({
  task,
  taskIndex,
  isSequential,
  isAnyRule,
  opportunityData,
  showActionButton = false,
  showBullets = true,
  showBadges = true,
  color = "green",
  totalTasks = 1,
  isAdmin = false,
  opportunityVariant = "default",
}) => {
  const isCompact = opportunityVariant === "compact";

  const badgeClasses =
    color === "orange"
      ? "border-orange-400 bg-orange-500"
      : color === "white"
        ? "border-gray-400 bg-white"
        : "border-green-400 bg-white";
  const badgeTextColor =
    color === "orange"
      ? "text-white"
      : color === "white"
        ? "text-gray-600"
        : "text-green-600";
  const buttonClass =
    color === "orange"
      ? "btn-warning"
      : color === "white"
        ? "btn-ghost"
        : "btn-secondary";

  const bulletSizeClass = isCompact ? "h-5 w-5" : "h-6 w-6";
  const bulletTextClass = isCompact ? "text-[10px]" : "text-xs";
  const bulletNumberTextClass = isCompact ? "text-[10px]" : "text-sm";
  const taskContentClassName = isCompact
    ? "min-w-0 flex-1"
    : "mb-4 min-w-0 flex-1";

  const canUseProvidedOpportunity = (opportunity: unknown): boolean => {
    if (!opportunity || typeof opportunity !== "object") return false;
    const o = opportunity as any;

    // OpportunityItem only has {id,title}. We need richer fields to render logo/description.
    return (
      typeof o.description === "string" ||
      typeof o.summary === "string" ||
      typeof o.organizationName === "string" ||
      typeof o.organizationLogoURL === "string"
    );
  };

  const providedOpportunity = canUseProvidedOpportunity(opportunityData)
    ? opportunityData
    : undefined;

  return (
    <div className={isCompact ? "flex gap-2" : "flex gap-3"}>
      {/* Task Number/Bullet */}
      {showBullets && (
        <div className="flex-shrink-0">
          {task.completed ? (
            <div
              className={`tooltip flex ${bulletSizeClass} items-center justify-center rounded-full bg-green-500 text-white`}
              data-tip="You completed this task"
            >
              <span className={`${bulletTextClass} font-bold`}>✓</span>
            </div>
          ) : totalTasks === 1 || (!isAnyRule && !isSequential) || isAnyRule ? (
            <div
              className={`flex ${bulletSizeClass} items-center justify-center rounded-full border-2 ${badgeClasses} text-base font-bold ${badgeTextColor}`}
            >
              !
            </div>
          ) : (
            <div
              className={`flex ${bulletSizeClass} items-center justify-center rounded-full border-2 ${badgeClasses} ${bulletNumberTextClass} font-semibold ${badgeTextColor}`}
            >
              {taskIndex + 1}
            </div>
          )}
        </div>
      )}

      {/* Task Content */}
      <div className={taskContentClassName}>
        {task.opportunity?.id ? (
          <>
            <PathwayTaskOpportunity
              opportunityId={task.opportunity.id}
              opportunity={providedOpportunity as any}
              isCompletableOverride={task.isCompletable}
              nonCompletableReasonOverride={task.nonCompletableReason}
              isCompleted={task.completed ?? false}
              isAdmin={isAdmin}
              showBadges={showBadges}
              opportunityVariant={opportunityVariant}
            />
            {/* Action Button */}
            {showActionButton && (
              <div className="mt-3 flex justify-end">
                <Link
                  href={`/opportunities/${task.opportunity.id}`}
                  target="_blank"
                  className={`btn ${buttonClass} btn-sm gap-2`}
                >
                  View Opportunity
                  <IoArrowForward className="h-4 w-4" />
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] text-yellow-700 md:text-xs">
              <span>⚠️</span>
              <span className="font-medium">
                This opportunity is unavailable right now.
              </span>
            </div>
            <p className="text-[10px] text-gray-500">
              We&apos;re working on it. Please check back later.
            </p>
            {task.id && (
              <div className="mt-1 text-[10px] text-gray-400">
                Task ID: {task.id}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable Tasks List Component
export interface PathwayTasksListProps {
  tasks: ProgramPathwayTaskProgress[];
  rule: string;
  orderMode: string;
  opportunityDataMap?: Record<string, OpportunityInfo>; // Optional map of opportunity data by ID
  showActionButtons?: boolean;
  showBullets?: boolean;
  showBadges?: boolean;
  showTaskConnectors?: boolean;
  color?: "green" | "orange" | "white";
  isAdmin?: boolean;
  opportunityVariant?: "default" | "compact";
  className?: string;
}

export const PathwayTasksList: React.FC<PathwayTasksListProps> = ({
  tasks,
  rule,
  orderMode,
  opportunityDataMap,
  showActionButtons = false,
  showBullets = true,
  showBadges = true,
  showTaskConnectors = true,
  color = "green",
  isAdmin = false,
  opportunityVariant = "default",
  className,
}) => {
  const isCompact = opportunityVariant === "compact";

  const hasSequentialTasks =
    rule !== PathwayCompletionRule.Any &&
    orderMode === PathwayOrderMode.Sequential;
  const isAnyRule = rule === PathwayCompletionRule.Any;

  const connectorColor =
    color === "orange"
      ? "orange-400"
      : color === "white"
        ? "gray-400"
        : "green-400";

  const connectorTextColor = color === "white" ? "text-gray-600" : "text-white";

  return (
    <div
      className={
        className ?? (isCompact ? "divide-base-200 divide-y" : "space-y-0")
      }
    >
      {tasks.map((task, taskIndex) => (
        <div key={task.id}>
          <PathwayTaskDisplay
            task={task}
            taskIndex={taskIndex}
            isSequential={hasSequentialTasks}
            isAnyRule={isAnyRule}
            opportunityData={
              task.opportunity?.id
                ? opportunityDataMap?.[task.opportunity.id]
                : undefined
            }
            showActionButton={showActionButtons}
            showBullets={showBullets}
            showBadges={showBadges}
            color={color}
            totalTasks={tasks.length}
            isAdmin={isAdmin}
            opportunityVariant={opportunityVariant}
          />

          {/* AND/OR indicator between tasks */}
          {showTaskConnectors && taskIndex < tasks.length - 1 && (
            <div
              className={
                isCompact
                  ? "mb-2 flex justify-center"
                  : "mb-4 flex justify-center"
              }
            >
              <div
                className={`badge badge-xs border-${connectorColor} bg-${connectorColor} px-2 py-1 text-[10px] font-bold ${connectorTextColor}`}
              >
                {isAnyRule ? "OR" : hasSequentialTasks ? "THEN" : "AND"}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
