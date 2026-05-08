using Newtonsoft.Json;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public sealed class OpportunitySearchFilterAdmin : OpportunitySearchFilterBase
  {
    public DateTimeOffset? StartDate { get; set; }

    public DateTimeOffset? EndDate { get; set; }

    public List<Status>? Statuses { get; set; }

    /// <summary>
    /// Indicates whether the query should be processed with fewer restrictions, bypassing pagination validation, ordering, 
    /// and expensive data processing (such as URL resolution).
    /// When set to <c>true</c>, pagination validation is skipped, ordering is not applied unless explicitly required, 
    /// and additional costly computations are avoided.
    /// However, if <c>PaginationEnabled</c> is <c>true</c>, pagination will still be applied, but unnecessary processing 
    /// will be minimized.
    /// </summary>
    [JsonIgnore]
    internal bool UnrestrictedQuery { get; set; } = false;

    public override void NormalizeForHashing()
    {
      base.NormalizeForHashing();

      Statuses = Statuses?.OrderBy(o => o).ToList();
    }

    public override void SanitizeCollections()
    {
      base.SanitizeCollections();

      Statuses = Statuses?.Distinct().ToList();
      if (Statuses?.Count == 0) Statuses = null;
    }
  }
}
