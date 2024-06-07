using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public abstract class OpportunitySearchFilterBase : PaginationFilter
  {
    public List<Guid>? Types { get; set; }

    public List<Guid>? Categories { get; set; }

    public List<Guid>? Languages { get; set; }

    public List<Guid>? Countries { get; set; }

    public List<Guid>? Organizations { get; set; }

    public List<Guid>? EngagementTypes { get; set; }

    public bool? Featured { get; set; }

    /// <summary>
    /// Includes organizations (name), opportunities (title, keywords, description), opportunity types (name), opportunity categories (name) and skills (name) matched on search text
    /// </summary>
    public string? ValueContains { get; set; }

    /// <summary>
    /// Optionally defines the published states to filter opportunities. Results are always associated with an active organization. By default published opportunities are included,
    /// thus active opportunities, irrespective of whether they started (includes both NotStarted and Active states). This default behavior is overridable
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
    internal List<FilterOrdering<Opportunity>>? OrderInstructions { get; set; }
        = [new() { OrderBy = e => e.DateCreated, SortOrder = Core.FilterSortOrder.Descending }, new() { OrderBy = e => e.Id, SortOrder = Core.FilterSortOrder.Ascending }]; //ensure deterministic sorting / consistent pagination results
  }
}
