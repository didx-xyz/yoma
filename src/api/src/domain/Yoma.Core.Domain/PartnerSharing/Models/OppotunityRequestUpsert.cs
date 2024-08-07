namespace Yoma.Core.Domain.PartnerSharing.Models
{
  public class OpportunityRequestUpsert
  {
    public string? ExternalId { get; set; }

    public Opportunity.Models.Opportunity Opportunity { get; set; }

    public bool ShareContactInfo { get; set; }

    public bool ShareAddressDetails { get; set; }
  }
}
