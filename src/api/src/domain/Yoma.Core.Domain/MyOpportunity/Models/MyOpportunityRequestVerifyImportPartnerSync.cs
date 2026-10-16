using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public sealed class MyOpportunityRequestVerifyImportPartnerSync : IHashableObject
  {
    public Guid OpportunityId { get; set; }

    public Guid UserId { get; set; }

    public DateTimeOffset? DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public MyOpportunityRequestVerifyCommitmentInterval? CommitmentInterval { get; set; }

    public bool Completed { get; set; }

    public decimal? PercentComplete { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }

    /// <summary>
    /// Optional business location for Entrepreneurship, or participant location for other types.
    /// Participation capture requires On-site/Hybrid without Worldwide; business location is independent of availability.
    /// Region/city require a specific country. Missing business location stays null; other eligible types use the youth profile.
    /// </summary>
    public Guid? CountryId { get; set; }

    public string? Region { get; set; }

    public string? City { get; set; }

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
