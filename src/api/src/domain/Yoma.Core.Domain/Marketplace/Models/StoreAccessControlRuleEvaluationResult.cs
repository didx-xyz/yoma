namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreAccessControlRuleEvaluationResult
  {
    public bool Locked { get; set; }

    public List<StoreAccessControlRuleEvaluationItem>? Rules { get; set; }
  }
}
