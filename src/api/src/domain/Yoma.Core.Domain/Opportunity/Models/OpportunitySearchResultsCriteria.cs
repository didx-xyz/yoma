namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunitySearchResultsCriteria
  {
    public int? TotalCount { get; set; }

    public List<OpportunityItem> Items { get; set; }
  }
}
