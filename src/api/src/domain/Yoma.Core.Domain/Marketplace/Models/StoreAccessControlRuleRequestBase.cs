using Newtonsoft.Json;

namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreAccessControlRuleRequestBase
  {
    public string Name { get; set; }

    public string? Description { get; set; }

    public Guid OrganizationId { get; set; }

    public string StoreCountryCodeAlpha2 { get; set; }

    public string StoreId { get; set; }

    public List<string>? StoreItemCategories { get; set; }

    public int? AgeFrom { get; set; }

    public int? AgeTo { get; set; }

    public Guid? GenderId { get; set; }

    public List<Guid>? Opportunities { get; set; }

    public StoreAccessControlRuleOpportunityCondition? OpportunityOption { get; set; }

    [JsonIgnore]
    internal bool RequestValidationHandled { get; set; } = false;
  }
}
