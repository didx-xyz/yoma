using Newtonsoft.Json;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunitySearchFilterZltoReward
  {
    /// <summary>
    /// List of Ids representing Zlto reward range criteria available for selection (dropdown)
    /// Filter by predefined reward ranges, such as 0-100, 100-500, or 500-1000
    /// Refer to <see cref="OpportunityService.ListOpportunitySearchCriteriaZltoRewardRanges"/> for details.
    /// </summary>
    public List<string>? Ranges { get; set; }

    /// <summary>
    /// When true, only opportunities with zlto rewards are included; otherwise, both rewarded and non-rewarded opportunities are included
    /// </summary>
    public bool? HasReward { get; set; }

    [JsonIgnore]
    /// <summary>
    /// Internal list of parsed Zlto reward ranges used during querying
    /// </summary>
    internal List<OpportunitySearchFilterZltoRewardRange>? RangesParsed { get; set; }
  }

  public class OpportunitySearchFilterZltoRewardRange
  {
    public decimal From { get; set; }

    public decimal To { get; set; }
  }
}
