namespace Yoma.Core.Domain.Entity.Models
{
  public class UserPreferencesRequest
  {
    /// <summary>
    /// Optional single User Goal. Null clears it.
    /// </summary>
    public Guid? GoalId { get; set; }

    /// <summary>
    /// Maximum total time preferred per Opportunity. Supply with CommitmentIntervalCount, or leave both null.
    /// </summary>
    public Guid? CommitmentIntervalId { get; set; }

    /// <summary>
    /// Maximum total time preferred per Opportunity. Supply with CommitmentIntervalId, or leave both null.
    /// </summary>
    public short? CommitmentIntervalCount { get; set; }

    /// <summary>
    /// Complete preferred engagement selection. Null or empty clears it.
    /// </summary>
    public List<Guid>? EngagementTypes { get; set; }

    /// <summary>
    /// True prefers an incentive, false prefers none; null clears the preference.
    /// </summary>
    public bool? Incentivized { get; set; }

    /// <summary>
    /// Complete preferred Opportunity Category selection. Null or empty clears it.
    /// </summary>
    public List<Guid>? Categories { get; set; }

    /// <summary>
    /// Complete accessibility requirement selection. Null or empty clears it; never shared with providers by default.
    /// </summary>
    public List<Guid>? AccessibilityRequirements { get; set; }

    /// <summary>
    /// Required only when the Other accessibility option is selected.
    /// </summary>
    public string? AccessibilityRequirementOtherDescription { get; set; }

    /// <summary>
    /// Complete preferred Language selection. Null or empty clears it.
    /// </summary>
    public List<Guid>? Languages { get; set; }

    /// <summary>
    /// Complete self-attested skill selection. Null or empty clears it.
    /// Verified skills are never removed by this request.
    /// </summary>
    public List<Guid>? SkillsSelfAttested { get; set; }
  }
}
