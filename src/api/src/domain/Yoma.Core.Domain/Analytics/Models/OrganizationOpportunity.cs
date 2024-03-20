namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationOpportunity
  {
    public TimeIntervalSummary ViewedCompleted { get; set; }

    public OpportunityCompletion Completion { get; set; }

    public OpportunityConversionRatio ConversionRate { get; set; }

    public OpportunityReward Reward { get; set; }

    public OpportunitySelected Selected { get; set; }
  }
}
