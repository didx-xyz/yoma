namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreAccessControlRuleResult
  {
    public bool Locked { get; set; }

    public List<string> Reason { get; set; }
  }
}
