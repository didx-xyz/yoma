using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreAccessControlRule
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public string? Description { get; set; }

    public Guid OrganizationId { get; set; }

    public string OrganizationName { get; set; }

    public string StoreId { get; set; }

    public string StoreItemCategoriesRaw { get; set; }

    public List<string>? StoreItemCategories { get; set; }

    public int? AgeMin { get; set; }

    public int? AgeMax { get; set; }

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
