namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreAccessControlRuleOpportunity
  {
    public Guid Id { get; set; }

    public Guid StoreAccessControlRuleId { get; set; }

    public Guid OpportunityId { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
