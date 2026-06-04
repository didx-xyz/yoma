using Yoma.Core.Domain.Opportunity;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public sealed class MyOpportunityVerificationOptions
  {
    public VerificationMethod? RequiredVerificationMethod { get; init; }
    public string? RequiredVerificationMethodMessageOverride { get; init; }
    public DateTimeOffset? DateCompleted { get; init; }
    public string? Comment { get; init; }

    public bool OverridePending { get; set; }
    public bool PartnerSyncedVerification { get; init; }
    public bool InstantVerification { get; init; }
    public bool ImportedVerification { get; init; }

    // These flows are sent for verification and finalized in the same process.
    public bool AutoFinalizedVerification => PartnerSyncedVerification || InstantVerification || ImportedVerification;
    public bool ImportedOrPartnerSyncedVerification => ImportedVerification || PartnerSyncedVerification;

    public bool EnqueueOutcomes { get; init; }
    public bool MutateBlobStorage { get; init; }
    public bool SendNotification { get; init; }
    public bool PublishEvents { get; init; }
  }
}
