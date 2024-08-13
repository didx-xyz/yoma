using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.PartnerSharing.Models
{
  public class OpportunityRequestUpsert
  {
    public string? ExternalId { get; set; }

    public Opportunity.Models.Opportunity Opportunity { get; set; }

    public Organization Organization { get; set; }

    public Organization OrganizationYoma { get; set; }

    public bool ShareContactInfo { get; set; }

    public bool ShareAddressDetails { get; set; }
  }
}
