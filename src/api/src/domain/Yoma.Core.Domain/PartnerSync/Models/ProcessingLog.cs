namespace Yoma.Core.Domain.PartnerSync.Models
{
  public class ProcessingLog
  {
    public Guid Id { get; set; }

    public string EntityType { get; set; } = null!;

    public Guid? OpportunityId { get; set; }

    public Guid? MyOpportunityId { get; set; }

    public Guid PartnerId { get; set; }

    public Core.SyncPartner Partner { get; set; }

    public string SyncType { get; set; } = null!;

    public string Action { get; set; } = null!;

    public Guid StatusId { get; set; }

    public ProcessingStatus Status { get; set; }

    public string? EntityExternalId { get; set; }

    /// <summary>
    /// SHA-256 hash of the effective sync payload processed for this log entry.
    /// Stored for create/update actions and used to skip update processing when the effective payload has not changed.
    /// </summary>
    public string? PayloadHash { get; set; }

    public string? ErrorReason { get; set; }

    public byte? RetryCount { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
