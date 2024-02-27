namespace Yoma.Core.Domain.Analytics.Models
{
    public class OrganizationOpportunity
    {
        public TimeIntervalSummary Viewed { get; set; }

        public TimeIntervalSummary Completed { get; set; }

        public OpporunityCompletion Completion { get; set; }

        public OpportunityConversionRate ConversionRate { get; set; }

        public OpportunityReward Reward { get; set; }

        public TimeIntervalSummary Published { get; set; }

        public TimeIntervalSummary Unpublished { get; set; }

        public TimeIntervalSummary Expired { get; set; }

        public TimeIntervalSummary Pending { get; set; }
    }
}
