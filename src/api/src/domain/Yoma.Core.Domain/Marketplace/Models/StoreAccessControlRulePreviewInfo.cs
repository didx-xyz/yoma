namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreAccessControlRulePreviewInfo
  {
    public int UserCount { get; set; }

    public int UserCountTotal { get; set; }

    public List<StoreAccessControlRulePreviewItemInfo> RulesRelated { get; set; }
  }
}
