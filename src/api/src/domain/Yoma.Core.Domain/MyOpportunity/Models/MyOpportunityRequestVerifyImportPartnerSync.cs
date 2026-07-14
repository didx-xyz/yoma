using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public sealed class MyOpportunityRequestVerifyImportPartnerSync : IHashableObject
  {
    public Guid OpportunityId { get; set; }

    public string? Username => UserEmail ?? UserPhoneNumber;

    public string? UserEmail { get; set; }

    public string? UserPhoneNumber { get; set; }

    public DateTimeOffset? DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public MyOpportunityRequestVerifyCommitmentInterval? CommitmentInterval { get; set; }

    public bool Completed { get; set; }

    public decimal? PercentComplete { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }

    public List<CustomFieldValueRequest>? CustomFields { get; set; }

    public void NormalizeForHashing()
    {
      SanitizeCollections();

      CustomFields.NormalizeForHashing();
    }

    public void SanitizeCollections()
    {
      // Preserve duplicate keys so validation can reject ambiguous values.
      if (CustomFields?.Count == 0) CustomFields = null;
    }
  }
}
