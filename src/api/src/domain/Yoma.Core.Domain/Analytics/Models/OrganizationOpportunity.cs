using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationOpportunity
  {
    public TimeIntervalSummary Engagements { get; set; } = null!;

    public OpportunityCompletion Completion { get; set; } = null!;

    public OpportunityConversionRatio ConversionRate { get; set; } = null!;

    public OpportunityReward Reward { get; set; } = null!;

    public OpportunityEngaged Engaged { get; set; } = null!;
  }
}
