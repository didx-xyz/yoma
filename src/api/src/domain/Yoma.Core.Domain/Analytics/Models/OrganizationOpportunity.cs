namespace Yoma.Core.Domain.Analytics.Models
{
    public class OrganizationOpportunity
    {
        public TimeIntervalSummary ViewedCompleted { get; set; }

        public OpportunityCompletion Completion { get; set; }

        public OpportunityConversionRate ConversionRate { get; set; }

        public OpportunityReward Reward { get; set; }

        public int SelectedCount { get; set; }
    }
}
