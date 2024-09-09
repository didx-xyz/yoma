namespace Yoma.Core.Domain.Marketplace
{
  public enum TransactionStatus
  {
    Reserved,
    Released,
    Sold
  }

  public enum StoreAccessControlRuleOpportunityCondition
  {
    All,
    Any
  }

  public enum StoreAccessControlRuleStatus
  {
    Active,
    Inactive,
    Deleted
  }
}
