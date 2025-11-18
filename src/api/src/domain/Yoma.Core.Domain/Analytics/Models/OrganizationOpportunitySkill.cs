using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationOpportunitySkill
  {
    public TimeIntervalSummary Items { get; set; } = null!;

    public OpportunitySkillTopCompleted TopCompleted { get; set; } = null!;
  }
}
