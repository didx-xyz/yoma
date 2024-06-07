namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunitySearchFilter : OpportunitySearchFilterBase
  {
    /// <summary>
    /// Optionally defines the published states to filter opportunities. Results are always associated with an active organization. By default active (published) opportunities are included,
    /// irrespective of whether they started (includes both NotStarted and Active states). This default behavior is overridable
    /// </summary>
    public new List<PublishedState>? PublishedStates { get; set; }

    /// <summary>
    /// Filtering based on commitment intervals
    /// This includes:
    /// - `IntervalOptions`: A list of Id's representing available commitment interval criteria (dropdown selection), such as 10 minutes, 100 hours, or 1 day
    /// - `Interval`: A specific commitment interval and range, starting from 1 up to the count (slider selection)
    /// </summary>
    public new OpportunitySearchFilterCommitmentInterval? CommitmentInterval { get; set; }

    /// <summary>
    /// Filtering based on Zlto reward criteria
    /// This includes:
    /// - `Ranges`: A list of Ids representing available Zlto reward range criteria, such as 0-100, 100-500, or 500-1000
    /// - `HasReward`: A boolean indicating whether to filter for opportunities that offer a Zlto rewards
    /// </summary>
    public new OpportunitySearchFilterZltoReward? ZltoReward { get; set; }

    /// <summary>
    /// Filter results by the most viewed / popular opportunities
    /// </summary>
    public bool? MostViewed { get; set; }

    /// <summary>
    /// Filter results by the most completed opportunities
    /// </summary>
    public bool? MostCompleted { get; set; }
  }
}
