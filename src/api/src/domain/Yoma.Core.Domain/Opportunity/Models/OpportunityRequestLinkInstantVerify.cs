namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunityRequestLinkInstantVerify
  {
    public string? Name { get; set; }

    public string? Description { get; set; }

    public int? ParticipantLimit { get; set; }

    public List<string>? DistributionList { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public bool? IncludeQRCode { get; set; }
  }
}
