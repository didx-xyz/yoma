import { ProgramPathwayProgressComponent } from "./ProgramPathwayProgress";
import type { ProgramPathwayProgress } from "~/api/models/referrals";
import type { Opportunity } from "~/api/models/opportunity";
import {
  PathwayOrderMode,
  PathwayCompletionRule,
} from "~/api/models/referrals";

export const PathwayPreview: React.FC = () => {
  // Mock opportunities for preview
  const mockOpportunities: Record<string, Opportunity> = {
    "verify-id": {
      id: "verify-id",
      title: "Complete Identity Verification",
      description:
        "Verify your identity using Yoma's secure verification system to unlock opportunities and earn rewards.",
      type: "Task",
      organizationId: "yoma",
      organizationName: "Yoma",
      organizationLogoURL: null,
      summary: "Quick identity verification process",
      yomaInfoURL: null,
      yomaOrganizationURL: null,
      published: true,
      featured: false,
      zltoReward: 10,
      zltoRewardPool: null,
      zltoRewardCumulative: null,
    } as any,
    "digital-skills": {
      id: "digital-skills",
      title: "Digital Skills Course",
      description:
        "Learn essential digital skills including computer literacy, internet safety, and online communication.",
      type: "Learning",
      organizationId: "digital-academy",
      organizationName: "Digital Academy",
      organizationLogoURL: null,
      summary: "Master digital basics in 2 hours",
      yomaInfoURL: null,
      yomaOrganizationURL: null,
      published: true,
      featured: true,
      zltoReward: 25,
      zltoRewardPool: null,
      zltoRewardCumulative: null,
    } as any,
    "cv-workshop": {
      id: "cv-workshop",
      title: "CV Writing Workshop",
      description:
        "Create a professional CV that stands out. Learn formatting, content structure, and how to highlight your achievements.",
      type: "Learning",
      organizationId: "career-hub",
      organizationName: "Career Hub",
      organizationLogoURL: null,
      summary: "Build your professional CV",
      yomaInfoURL: null,
      yomaOrganizationURL: null,
      published: true,
      featured: false,
      zltoReward: 20,
      zltoRewardPool: null,
      zltoRewardCumulative: null,
    } as any,
    "community-task": {
      id: "community-task",
      title: "Community Service Project",
      description:
        "Give back to your community by participating in a local service project. Options include environmental cleanup, tutoring, or helping at community centers.",
      type: "Task",
      organizationId: "community-org",
      organizationName: "Community Connect",
      organizationLogoURL: null,
      summary: "Make a difference in your community",
      yomaInfoURL: null,
      yomaOrganizationURL: null,
      published: true,
      featured: true,
      zltoReward: 30,
      zltoRewardPool: null,
      zltoRewardCumulative: null,
    } as any,
    reflection: {
      id: "reflection",
      title: "Reflection & Feedback",
      description:
        "Share your learning journey and provide feedback on your experience. Help us improve while reflecting on your growth.",
      type: "Task",
      organizationId: "yoma",
      organizationName: "Yoma",
      organizationLogoURL: null,
      summary: "Reflect on your journey",
      yomaInfoURL: null,
      yomaOrganizationURL: null,
      published: true,
      featured: false,
      zltoReward: 15,
      zltoRewardPool: null,
      zltoRewardCumulative: null,
    } as any,
  };

  // Mock pathway data for preview
  const mockPathway: ProgramPathwayProgress = {
    id: "preview-pathway",
    name: "Youth Onboarding Journey",
    description:
      "Complete this pathway to get verified and start earning opportunities",
    rule: PathwayCompletionRule.All,
    orderMode: PathwayOrderMode.Sequential,
    stepsCompleted: 1,
    stepsTotal: 3,
    percentComplete: 33,
    completed: false,
    isCompletable: true,
    steps: [
      {
        id: "step-1",
        name: "Get Verified",
        description: "Verify your identity to unlock opportunities",
        rule: PathwayCompletionRule.All,
        orderMode: PathwayOrderMode.Sequential,
        tasksCompleted: 1,
        tasksTotal: 1,
        percentComplete: 100,
        completed: true,
        isCompletable: true,
        tasks: [
          {
            id: "task-1",
            entityType: "Opportunity" as any,
            order: 1,
            orderDisplay: 1,
            completed: true,
            dateCompleted: new Date().toISOString(),
            opportunity: {
              id: "verify-id",
              title: "✓ Complete Identity Verification",
            },
          },
        ],
      },
      {
        id: "step-2",
        name: "Learn & Grow",
        description:
          "Complete any ONE learning opportunity to build your skills",
        rule: PathwayCompletionRule.Any,
        orderMode: PathwayOrderMode.AnyOrder,
        tasksCompleted: 0,
        tasksTotal: 2,
        percentComplete: 0,
        completed: false,
        isCompletable: true,
        tasks: [
          {
            id: "task-2",
            entityType: "Opportunity" as any,
            order: null,
            orderDisplay: 1,
            completed: false,
            dateCompleted: null,
            opportunity: {
              id: "digital-skills",
              title: "Digital Skills Course",
            },
          },
          {
            id: "task-3",
            entityType: "Opportunity" as any,
            order: null,
            orderDisplay: 2,
            completed: false,
            dateCompleted: null,
            opportunity: {
              id: "cv-workshop",
              title: "CV Writing Workshop",
            },
          },
        ],
      },
      {
        id: "step-3",
        name: "Take Action",
        description: "Apply your skills by completing these tasks in order",
        rule: PathwayCompletionRule.All,
        orderMode: PathwayOrderMode.Sequential,
        tasksCompleted: 0,
        tasksTotal: 2,
        percentComplete: 0,
        completed: false,
        isCompletable: true,
        tasks: [
          {
            id: "task-4",
            entityType: "Opportunity" as any,
            order: 1,
            orderDisplay: 1,
            completed: false,
            dateCompleted: null,
            opportunity: {
              id: "community-task",
              title: "Community Service Project",
            },
          },
          {
            id: "task-5",
            entityType: "Opportunity" as any,
            order: 2,
            orderDisplay: 2,
            completed: false,
            dateCompleted: null,
            opportunity: {
              id: "reflection",
              title: "Reflection & Feedback",
            },
          },
        ],
      },
    ],
  } as any;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-start gap-2">
        <span className="text-2xl">👀</span>
        <div>
          <h4 className="text-sm font-bold text-gray-900">
            Example User Journey
          </h4>
          <p className="text-xs text-gray-600">
            This is what your friend might see when they use your referral link
          </p>
        </div>
      </div>
      <div className="text-sm">
        <ProgramPathwayProgressComponent
          pathway={mockPathway}
          mockOpportunities={mockOpportunities}
        />
      </div>
    </div>
  );
};
