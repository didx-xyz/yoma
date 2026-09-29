using Newtonsoft.Json;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public abstract class OpportunitySearchFilterBase : PaginationFilter, IHashableObject
  {
    /// <summary>
    /// Case-insensitive provider substring. Unspecified providers remain included.
    /// This is independent of the owning organisation filter.
    /// </summary>
    public string? Provider { get; set; }

    /// <summary>
    /// Match the incentive selection, also including opportunities where it is not specified.
    /// </summary>
    public bool? Incentivized { get; set; }

    public List<RewardType>? RewardTypes { get; set; }

    public AccessibilitySupport? AccessibilitySupport { get; set; }

    /// <summary>
    /// Case-insensitive substring of the Other accommodation description; requires Other in Accommodations.
    /// Selecting Other without text matches any Other accommodation. Missing descriptions are excluded
    /// when text is supplied. Combined with selected accommodations using AND; no user needs are disclosed.
    /// </summary>
    public string? AccommodationOtherDescription { get; set; }

    /// <summary>
    /// Match ALL selected accommodations. Unlike the other optional filters, missing
    /// accommodations are excluded: unknown support cannot satisfy an accessibility need.
    /// This is an explicit discovery filter, not disclosure of a user's needs to partners.
    /// </summary>
    public List<Guid>? Accommodations { get; set; }

    /// <summary>
    /// Match ANY selected group, including opportunities with no targeting specified.
    /// Targeting is informational and never an eligibility restriction.
    /// </summary>
    public List<Guid>? TargetedGroups { get; set; }

    /// <summary>
    /// Match ANY selected goal, including opportunities with no goals specified.
    /// </summary>
    public List<Guid>? SustainableDevelopmentGoals { get; set; }

    /// <summary>
    /// Optional age in whole years to compare with inclusive opportunity age bounds.
    /// Unspecified bounds remain unrestricted. This does not apply the user's profile automatically.
    /// </summary>
    public short? Age { get; set; }

    public List<Guid>? Types { get; set; }

    public List<Guid>? Categories { get; set; }

    public List<Guid>? Languages { get; set; }

    /// <summary>
    /// Match any selected country, applying its optional location criteria to the same country mapping.
    /// Country entries are independent alternatives; criteria are not combined across countries.
    /// </summary>
    public List<OpportunitySearchFilterCountry>? Countries { get; set; }

    public List<Guid>? Organizations { get; set; }

    public List<Guid>? EngagementTypes { get; set; }

    public bool? Featured { get; set; }

    public bool? ShareWithPartners { get; set; }

    /// <summary>
    /// Includes organizations (name), opportunities (title, keywords, description), opportunity types (name), opportunity categories (name) and skills (name) matched on search text
    /// </summary>
    public string? ValueContains { get; set; }

    /// <summary>
    /// Filters opportunities using configured custom field values.
    /// </summary>
    public List<CustomFieldFilter>? CustomFields { get; set; }

    /// <summary>
    /// Applies the authenticated user's saved presets when filtering opportunities.
    /// Exposed publicly by <see cref="OpportunitySearchFilter"/> only.
    /// </summary>
    [JsonIgnore]
    internal bool ApplyUserPresets { get; set; }

    /// <summary>
    /// Optionally filters opportunities by their published state. By default, results include opportunities that are published (both the opportunity and its organization are Active), 
    /// regardless of whether they have started (thus published states NotStarted and Active). This default behavior can be overridden
    /// </summary>
    [JsonIgnore]
    internal List<PublishedState>? PublishedStates { get; set; }

    /// <summary>
    /// Filtering based on commitment intervals
    /// This includes:
    /// - `IntervalOptions`: A list of Id's representing available commitment interval criteria (dropdown selection), such as 10 minutes, 100 hours, or 1 day
    /// - `Interval`: A specific commitment interval and range, starting from 1 up to the count (slider selection)
    /// </summary>
    [JsonIgnore]
    internal OpportunitySearchFilterCommitmentInterval? CommitmentInterval { get; set; }

    /// <summary>
    /// Filtering based on Zlto reward criteria
    /// This includes:
    /// - `Ranges`: A list of Ids representing available Zlto reward range criteria, such as 0-100, 100-500, or 500-1000
    /// - `HasReward`: A boolean indicating whether to filter for opportunities that offer a Zlto rewards
    /// </summary>
    [JsonIgnore]
    internal OpportunitySearchFilterZltoReward? ZltoReward { get; set; }

    /// <summary>
    /// Filter based on the supplied list of opportunities. Explicit internal filter; if specified and empty no results will be returned
    /// </summary>
    [JsonIgnore]
    internal List<Guid>? Opportunities { get; set; }

    [JsonIgnore]
    internal bool TotalCountOnly { get; set; }

    [JsonIgnore]
    internal bool ExcludeHidden { get; set; }

    [JsonIgnore]
    internal List<FilterOrdering<Opportunity>>? OrderInstructions { get; set; }
        = [new() { OrderBy = e => e.DateCreated, SortOrder = FilterSortOrder.Descending }, new() { OrderBy = e => e.Id, SortOrder = FilterSortOrder.Ascending }]; //ensure deterministic sorting / consistent pagination results

    public virtual void NormalizeForHashing()
    {
      SanitizeCollections();

      RewardTypes = RewardTypes?.OrderBy(o => o).ToList();
      Accommodations = Accommodations?.OrderBy(o => o).ToList();
      TargetedGroups = TargetedGroups?.OrderBy(o => o).ToList();
      SustainableDevelopmentGoals = SustainableDevelopmentGoals?.OrderBy(o => o).ToList();
      Types = Types?.OrderBy(o => o).ToList();
      Categories = Categories?.OrderBy(o => o).ToList();
      Languages = Languages?.OrderBy(o => o).ToList();
      Countries = Countries?.OrderBy(o => o?.CountryId).ToList();
      Organizations = Organizations?.OrderBy(o => o).ToList();
      EngagementTypes = EngagementTypes?.OrderBy(o => o).ToList();

      CustomFields = CustomFields.NormalizeForHashing();
    }

    public virtual void SanitizeCollections()
    {
      RewardTypes = RewardTypes?.Distinct().ToList();
      if (RewardTypes?.Count == 0) RewardTypes = null;
      Accommodations = Accommodations?.Distinct().ToList();
      if (Accommodations?.Count == 0) Accommodations = null;
      TargetedGroups = TargetedGroups?.Distinct().ToList();
      if (TargetedGroups?.Count == 0) TargetedGroups = null;
      SustainableDevelopmentGoals = SustainableDevelopmentGoals?.Distinct().ToList();
      if (SustainableDevelopmentGoals?.Count == 0) SustainableDevelopmentGoals = null;
      Types = Types?.Distinct().ToList();
      if (Types?.Count == 0) Types = null;

      Categories = Categories?.Distinct().ToList();
      if (Categories?.Count == 0) Categories = null;

      Languages = Languages?.Distinct().ToList();
      if (Languages?.Count == 0) Languages = null;

      // Preserve duplicate countries so validation rejects ambiguous location filters.
      if (Countries?.Count == 0) Countries = null;

      Organizations = Organizations?.Distinct().ToList();
      if (Organizations?.Count == 0) Organizations = null;

      EngagementTypes = EngagementTypes?.Distinct().ToList();
      if (EngagementTypes?.Count == 0) EngagementTypes = null;

      // Preserve duplicate keys so validation can reject the ambiguous filters instead of silently discarding values.
      if (CustomFields?.Count == 0) CustomFields = null;
    }
  }
}
