using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.PartnerSharing.Models
{
  public class OpportunityRequestUpsert
  {
    public string? ExternalId { get; set; }

    public Opportunity.Models.Opportunity Opportunity { get; set; } = null!;

    public Organization Organization { get; set; } = null!;

    public Organization OrganizationYoma { get; set; } = null!;

    public bool ShareContactInfo { get; set; }

    public bool ShareAddressInfo { get; set; }
  }
}
