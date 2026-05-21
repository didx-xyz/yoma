namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public sealed class MyOpportunityResponseVerifyImportPartnerSync
  {
    public bool Processed { get; set; }

    public bool Skipped { get; set; }

    public string? SkipReason { get; set; }
  }
}
