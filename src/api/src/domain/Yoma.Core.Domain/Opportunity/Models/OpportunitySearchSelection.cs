using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
  /// <summary>
  /// Reusable AND-ed criteria for the root search and each bounded OR branch.
  /// Paging, visibility and ordering are deliberately not branch-local controls.
  /// </summary>
  public class OpportunitySearchSelection
  {
    public SearchCriterion<string>? Provider { get; set; }

    public SearchCriterion<bool?>? Incentivized { get; set; }

    public SearchCriterion<List<RewardType>>? RewardTypes { get; set; }

    public SearchCriterion<AccessibilitySupport?>? AccessibilitySupport { get; set; }

    public SearchCriterion<string>? AccommodationOtherDescription { get; set; }

    /// <summary>
    /// All selected accommodations must be supported. An inclusive policy admits
    /// unknown lists, never explicit No or a non-empty incompatible list.
    /// </summary>
    public SearchCriterion<List<Guid>>? Accommodations { get; set; }

    public SearchCriterion<List<Guid>>? TargetedGroups { get; set; }

    public SearchCriterion<List<Guid>>? SustainableDevelopmentGoals { get; set; }

    public short? Age { get; set; }

    public SearchCriterion<List<Guid>>? Types { get; set; }

    public SearchCriterion<List<Guid>>? Categories { get; set; }

    public SearchCriterion<List<Guid>>? Languages { get; set; }

    /// <summary>
    /// Country entries are alternatives. Each entry's location restrictions apply
    /// to the same country mapping, not to different countries on an opportunity.
    /// </summary>
    public List<OpportunitySearchFilterCountry>? Countries { get; set; }

    public SearchCriterion<List<Guid>>? Organizations { get; set; }

    public SearchCriterion<List<Guid>>? EngagementTypes { get; set; }

    public SearchCriterion<List<Guid>>? Skills { get; set; }

    public SearchCriterion<OpportunitySearchFilterCommitmentInterval>? CommitmentInterval { get; set; }

    public SearchCriterion<OpportunitySearchFilterZltoReward>? ZltoReward { get; set; }

    public List<CustomFieldFilter>? CustomFields { get; set; }

    // Preserve unknown JSON on a branch so root-only controls cannot be silently ignored.
    [JsonExtensionData]
    internal IDictionary<string, JToken>? AdditionalMembers { get; set; }

    public virtual void SanitizeCollections()
    {
      RewardTypes = Normalize(RewardTypes);
      Accommodations = Normalize(Accommodations);
      TargetedGroups = Normalize(TargetedGroups);
      SustainableDevelopmentGoals = Normalize(SustainableDevelopmentGoals);
      Types = Normalize(Types);
      Categories = Normalize(Categories);
      Languages = Normalize(Languages);
      if (Countries?.Count == 0) Countries = null;
      Organizations = Normalize(Organizations);
      EngagementTypes = Normalize(EngagementTypes);
      Skills = Normalize(Skills);
      CommitmentInterval?.Value?.SanitizeCollections();
      ZltoReward?.Value?.SanitizeCollections();
      if (CustomFields?.Count == 0) CustomFields = null;
    }

    public virtual void NormalizeForHashing()
    {
      SanitizeCollections();

      Sort(RewardTypes);
      Sort(Accommodations);
      Sort(TargetedGroups);
      Sort(SustainableDevelopmentGoals);
      Sort(Types);
      Sort(Categories);
      Sort(Languages);
      Countries = Countries?.OrderBy(o => o?.CountryId).ToList();
      Sort(Organizations);
      Sort(EngagementTypes);
      Sort(Skills);
      CommitmentInterval?.Value?.NormalizeForHashing();
      ZltoReward?.Value?.NormalizeForHashing();
      CustomFields = CustomFields.NormalizeForHashing();
    }

    private static SearchCriterion<List<T>>? Normalize<T>(SearchCriterion<List<T>>? criterion)
    {
      if (criterion == null) return null;
      criterion.Value = criterion.Value?.Distinct().ToList();
      if (criterion.Value?.Count == 0) criterion.Value = null;
      return criterion.Value == null && !criterion.Unspecified.HasValue ? null : criterion;
    }

    private static void Sort<T>(SearchCriterion<List<T>>? criterion)
    {
      if (criterion?.Value != null) criterion.Value = [.. criterion.Value.OrderBy(o => o)];
    }
  }
}
