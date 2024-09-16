namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreAccessControlRuleSearchResults
  {
    public int? TotalCount { get; set; }

    public List<StoreAccessControlRule> Items { get; set; }
  }
}
