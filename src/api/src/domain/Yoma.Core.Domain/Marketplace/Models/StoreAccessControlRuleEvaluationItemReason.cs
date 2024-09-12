namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreAccessControlRuleEvaluationItemReason
  {
    public string Reason { get; set; }

    public List<StoreAccessControlRuleEvaluationItemReasonLink>? Links { get; set; }
  }
}
