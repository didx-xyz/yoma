import type {
  ProgramInfo,
  ReferralLinkUsageInfo,
} from "~/api/models/referrals";

// Helper type for next action
export interface NextActionInfo {
  label: string;
  link: string;
  description: string;
  step: {
    name: string;
    order: number;
    description?: string;
    rule: string;
    orderMode: string;
  };
  tasks: Array<{
    id: string;
    opportunityId: string | null;
    opportunityTitle: string;
    completed: boolean;
    isCompletable: boolean;
  }>;
}

// Helper function to determine next action - exported for use in parent
export function getNextAction(
  usage: ReferralLinkUsageInfo,
  program: ProgramInfo,
): NextActionInfo | null {
  // Only provide next action if pathway is required and not yet complete
  if (!program.pathwayRequired || !usage.pathway || usage.pathwayCompleted) {
    return null;
  }

  // Find the next incomplete step
  const nextStep = usage.pathway.steps.find((step) => !step.completed);
  if (!nextStep) {
    return null;
  }

  // Get all incomplete tasks from this step
  const incompleteTasks = nextStep.tasks
    .filter((task) => !task.completed)
    .map((task) => ({
      id: task.id,
      opportunityId: task.opportunity?.id || null,
      opportunityTitle: task.opportunity?.title || "Opportunity not available",
      completed: task.completed,
      isCompletable: task.isCompletable,
    }));

  if (incompleteTasks.length === 0) return null;

  return {
    label: "View Tasks",
    link: "#next-action",
    description: `Complete the tasks in "${nextStep.name}"`,
    step: {
      name: nextStep.name,
      order: nextStep.orderDisplay,
      description: nextStep.description || undefined,
      rule: nextStep.rule,
      orderMode: nextStep.orderMode,
    },
    tasks: incompleteTasks,
  };
}
