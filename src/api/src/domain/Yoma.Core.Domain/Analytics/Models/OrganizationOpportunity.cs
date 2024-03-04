namespace Yoma.Core.Domain.Analytics.Models
{
    public class OrganizationOpportunity
    {
        public TimeIntervalSummary ViewedCompleted { get; set; } 

        public OpporunityCompletion Completion { get; set; }

        public OpportunityConversionRate ConversionRate { get; set; }

        public TimeIntervalSummary Active { get; set; }

        public TimeIntervalSummary PendingVerification { get; set; }

        public OpportunityReward Reward { get; set; }
    }
}
