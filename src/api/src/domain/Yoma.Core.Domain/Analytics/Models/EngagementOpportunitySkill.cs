using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Analytics.Models
{
  public class EngagementOpportunitySkill
  {
    public TimeIntervalSummary Items { get; set; } = null!;

    public OpportunitySkillTopCompleted TopCompleted { get; set; } = null!;
  }
}
