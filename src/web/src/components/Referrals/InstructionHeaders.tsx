import React from "react";
import {
  PathwayOrderMode,
  PathwayCompletionRule,
  type ProgramPathwayTaskProgress,
} from "~/api/models/referrals";
import type { Opportunity } from "~/api/models/opportunity";
import RefereePathwayTaskOpportunity from "./RefereePathwayTaskOpportunity";
import Link from "next/link";
import { IoArrowForward } from "react-icons/io5";

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

// Reusable Step Number Badge Component
export interface StepNumberBadgeProps {
  stepIndex: number;
  isCompleted: boolean;
  isSequential: boolean;
  totalSteps: number;
  color?: "blue" | "purple";
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
  color?: "green" | "orange" | "blue";
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
}) => {
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
  };

  const colors = colorClasses[color];

  // For single task, show simple message
  if (tasksLength === 1) {
    return (
      <div
        className={`mb-4 rounded-lg border ${colors.border} ${colors.bg} p-3`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isCompleted ? `bg-${color}-500 text-white` : `border-2 ${colors.iconBorder} ${colors.iconBg} ${colors.iconText}`}`}
          >
            {isCompleted ? "✓" : "!"}
          </span>
          <p className={`text-xs font-medium ${colors.text}`}>
            {isCompleted ? "You completed this task" : "Complete this task"}
          </p>
        </div>
      </div>
    );
  }

  // For multiple tasks, show detailed instruction
  return (
    <div className={`mb-4 rounded-lg border ${colors.border} ${colors.bg} p-3`}>
      <div className="flex flex-col justify-between gap-2 md:flex-row">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isCompleted ? `bg-${color}-500 text-white` : `border-2 ${colors.iconBorder} ${colors.iconBg} ${colors.iconText}`}`}
          >
            {isCompleted ? "✓" : "!"}
          </span>
          {isCompleted ? (
            <p className={`text-xs font-medium ${colors.text}`}>
              You completed{" "}
              <span className="font-bold">{completed ?? tasksLength}</span>{" "}
              {tasksLength === 1 ? "task" : "tasks"}
            </p>
          ) : (
            <p className={`text-xs font-medium ${colors.text}`}>
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
        {completed !== undefined &&
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
  mockOpportunity?: Opportunity;
  showActionButton?: boolean;
  color?: "green" | "orange";
  totalTasks?: number;
}

export const PathwayTaskDisplay: React.FC<PathwayTaskDisplayProps> = ({
  task,
  taskIndex,
  isSequential,
  isAnyRule,
  mockOpportunity,
  showActionButton = false,
  color = "green",
  totalTasks = 1,
}) => {
  const badgeClasses =
    color === "orange"
      ? "border-orange-400 bg-orange-500"
      : "border-green-400 bg-white";
  const badgeTextColor = color === "orange" ? "text-white" : "text-green-600";
  const buttonClass = color === "orange" ? "btn-warning" : "btn-secondary";

  return (
    <div className="flex gap-3">
      {/* Task Number/Bullet */}
      <div className="flex-shrink-0">
        {task.completed ? (
          <div
            className="tooltip flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white"
            data-tip="You completed this task"
          >
            <span className="text-xs font-bold">✓</span>
          </div>
        ) : totalTasks === 1 || (!isAnyRule && !isSequential) || isAnyRule ? (
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${badgeClasses} text-base font-bold ${badgeTextColor}`}
          >
            !
          </div>
        ) : (
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${badgeClasses} text-sm font-semibold ${badgeTextColor}`}
          >
            {taskIndex + 1}
          </div>
        )}
      </div>

      {/* Task Content */}
      <div className="mb-4 min-w-0 flex-1">
        {task.opportunity?.id ? (
          <>
            <RefereePathwayTaskOpportunity
              opportunityId={task.opportunity.id}
              mockOpportunity={mockOpportunity}
              isCompleted={task.completed ?? false}
            />
            {/* Non-Completable Warning */}
            {!task.isCompletable && task.nonCompletableReason && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border-2 border-yellow-300 bg-yellow-50 p-3">
                <span className="text-base">⚠️</span>
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-yellow-900">
                    Task Currently Unavailable
                  </p>
                  <p className="mt-1 text-[10px] text-yellow-800">
                    {task.nonCompletableReason}
                  </p>
                </div>
              </div>
            )}
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
            <div className="flex items-center gap-2 text-xs text-yellow-700">
              <span>⚠️</span>
              <span className="font-medium">
                Opportunity configuration incomplete
              </span>
            </div>
            <p className="text-[10px] text-gray-500">
              The opportunity data for this task is not available. This may
              occur if the pathway was configured but the opportunity
              relationship hasn&apos;t been established by the API yet.
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
  mockOpportunities?: Record<string, Opportunity>;
  showActionButtons?: boolean;
  color?: "green" | "orange";
}

export const PathwayTasksList: React.FC<PathwayTasksListProps> = ({
  tasks,
  rule,
  orderMode,
  mockOpportunities,
  showActionButtons = false,
  color = "green",
}) => {
  const hasSequentialTasks =
    rule !== PathwayCompletionRule.Any &&
    orderMode === PathwayOrderMode.Sequential;
  const isAnyRule = rule === PathwayCompletionRule.Any;

  const connectorColor = color === "orange" ? "orange-400" : "green-400";

  return (
    <div className="space-y-0">
      {tasks.map((task, taskIndex) => (
        <div key={task.id}>
          <PathwayTaskDisplay
            task={task}
            taskIndex={taskIndex}
            isSequential={hasSequentialTasks}
            isAnyRule={isAnyRule}
            mockOpportunity={mockOpportunities?.[task.opportunity?.id || ""]}
            showActionButton={showActionButtons}
            color={color}
            totalTasks={tasks.length}
          />

          {/* AND/OR indicator between tasks */}
          {taskIndex < tasks.length - 1 && (
            <div className="mb-4 flex justify-center">
              <div
                className={`badge badge-xs border-${connectorColor} bg-${connectorColor} px-2 py-1 text-[10px] font-bold text-white`}
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
