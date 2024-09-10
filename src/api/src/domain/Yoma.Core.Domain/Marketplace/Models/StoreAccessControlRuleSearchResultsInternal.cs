namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreAccessControlRuleSearchResultsInternal
  {
    public int? TotalCount { get; set; }

    public List<StoreAccessControlRule> Items { get; set; }
  }
}
