using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public sealed class OpportunitySearchOrdering
  {
    public OpportunitySearchOrderField Field { get; set; }

    public FilterSortOrder Direction { get; set; }
  }
}
