using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Entity.Models
{
  public class UserPreferences
  {
    public Guid UserId { get; set; }

    public Guid? GoalId { get; set; }

    public string? Goal { get; set; }

    /// <summary>
    /// Maximum total time preferred per Opportunity; null when not specified.
    /// </summary>
    public Guid? CommitmentIntervalId { get; set; }

    public Core.TimeIntervalOption? CommitmentInterval { get; set; }

    public short? CommitmentIntervalCount { get; set; }

    public List<EngagementType> EngagementTypes { get; set; } = [];

    /// <summary>
    /// True prefers opportunities with an incentive, false those without one; null means no preference.
    /// </summary>
    public bool? Incentivized { get; set; }

    public List<Opportunity.Models.Lookups.OpportunityCategory> Categories { get; set; } = [];

    public List<Accessibility> AccessibilityRequirements { get; set; } = [];

    public string? AccessibilityRequirementOtherDescription { get; set; }

    public List<Language> Languages { get; set; } = [];

    public List<Skill> SkillsSelfAttested { get; set; } = [];
  }
}
