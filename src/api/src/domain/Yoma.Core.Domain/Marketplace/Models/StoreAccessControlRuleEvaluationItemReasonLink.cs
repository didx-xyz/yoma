namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreAccessControlRuleEvaluationItemReasonLink
  {
    public bool RequirementMet { get; set; }

    public string Title { get; set; } = null!;

    public string URL { get; set; } = null!;
  }
}
