using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public sealed class OpportunitySearchFilterCommitmentInterval : IHashableObject
  {
    /// <summary>
    /// List of Id's representing commitment interval criteria available for selection (dropdown)
    /// Filter on available / configured intervals, such as 10 minutes, 100 hours, or 1 day
    /// Refer to <see cref="OpportunityService.ListOpportunitySearchCriteriaCommitmentIntervalOptions"/> for details
    /// </summary>
    public List<string>? Options { get; set; }

    /// <summary>
    /// Represents a specific commitment interval with its ID and maximum count value, adjustable via a slider
    /// Filter on the specified commitment interval and range, starting from 1 up to the count
    /// </summary>
    public OpportunitySearchFilterCommitmentIntervalItem? Interval { get; set; }

    [JsonIgnore]
    /// <summary>
    /// Internal list of parsed commitment interval items used during querying for the selected options.
    /// </summary>
    internal List<OpportunitySearchFilterCommitmentIntervalItem>? OptionsParsed { get; set; }

    public void NormalizeForHashing()
    {
      SanitizeCollections();

      Options = Options?.OrderBy(o => o, StringComparer.Ordinal).ToList();
    }

    public void SanitizeCollections()
    {
      Options = Options?.Distinct(StringComparer.Ordinal).ToList();
      if (Options?.Count == 0) Options = null;
    }
  }

  public sealed class OpportunitySearchFilterCommitmentIntervalItem
  {
    public Guid Id { get; set; }

    public short Count { get; set; }

  }
}
