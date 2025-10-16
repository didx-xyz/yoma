using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreAccessControlRuleInfo
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public Guid OrganizationId { get; set; }

    public string OrganizationName { get; set; } = null!;

    public StoreInfo Store { get; set; } = null!;

    public List<StoreItemCategoryInfo>? StoreItemCategories { get; set; }

    public int? AgeFrom { get; set; }

    public int? AgeTo { get; set; }

    public Guid? GenderId { get; set; }

    public string? Gender { get; set; }

    public StoreAccessControlRuleOpportunityCondition? OpportunityOption { get; set; }

    public Guid StatusId { get; set; }

    public StoreAccessControlRuleStatus Status { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public List<OpportunityItem>? Opportunities { get; set; }
  }
}
