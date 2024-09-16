namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreAccessControlRulePreview
  {
    public int UserCount { get; set; }

    public int UserCountTotal { get; set; }

    public List<StoreAccessControlRulePreviewItem> RulesRelated { get; set; }
  }
}
