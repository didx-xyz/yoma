namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreAccessControlRuleEvaluationItem
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public List<StoreAccessControlRuleEvaluationItemReason> Reasons { get; set; } = null!;
  }
}
