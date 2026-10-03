using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public sealed class OpportunitySearchFilter : OpportunitySearchFilterBase
  {
    /// <summary>
    /// Optionally filters opportunities by their published state. By default, results include opportunities that are published (both the opportunity and its organization are Active), 
    /// regardless of whether they have started (thus published states NotStarted and Active). This default behavior can be overridden
    /// </summary>
    public new List<PublishedState>? PublishedStates { get; set; }

    /// <summary>
    /// Filter results by the most viewed / popular opportunities
    /// </summary>
    public bool? MostViewed { get; set; }

    /// <summary>
    /// Filter results by the most completed opportunities
    /// </summary>
    public bool? MostCompleted { get; set; }

    public override void NormalizeForHashing()
    {
      base.NormalizeForHashing();

      PublishedStates = PublishedStates?.OrderBy(o => o).ToList();
    }

    public override void SanitizeCollections()
    {
      base.SanitizeCollections();

      PublishedStates = PublishedStates?.Distinct().ToList();
      if (PublishedStates?.Count == 0) PublishedStates = null;

    }
  }
}
