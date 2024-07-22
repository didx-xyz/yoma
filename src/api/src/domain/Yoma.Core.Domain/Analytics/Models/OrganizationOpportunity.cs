using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationOpportunity
  {
    public TimeIntervalSummary Engagements { get; set; }

    public OpportunityCompletion Completion { get; set; }

    public OpportunityConversionRatio ConversionRate { get; set; }

    public OpportunityReward Reward { get; set; }

    public OpportunityEngaged Engaged { get; set; }
  }
}
