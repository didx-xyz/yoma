namespace Yoma.Core.Domain.PartnerSync.Models
{
  /// <summary>
  /// Result returned by a partner verification pull.
  /// 
  /// The entity type is supplied by the partner sync configuration / processing context
  /// and applies to all items in the result.
  /// </summary>
  public sealed class SyncResultPullVerification
  {
    public int? TotalCount { get; set; }

    public List<SyncItemVerification> Items { get; set; } = [];
  }

  /// <summary>
  /// Represents a partner verification record for the configured entity type.
  /// 
  /// The entity type is supplied by the partner sync configuration / processing context.
  /// For opportunity verification sync, <see cref="EntityExternalId"/> refers to the partner-side opportunity identifier.
  /// </summary>
  public class SyncItemVerification
  {
    /// <summary>
    /// Partner-side user identifier.
    /// </summary>
    public string UserExternalId { get; set; } = null!;

    /// <summary>
    /// Partner-side entity identifier for the entity being verified.
    /// The entity type is implied by the sync context.
    /// </summary>
    public string EntityExternalId { get; set; } = null!;

    public string? Username => UserEmail ?? UserPhoneNumber;

    public string? UserEmail { get; set; }

    public string? UserPhoneNumber { get; set; } 

    public DateTimeOffset? DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public SyncItemVerificationCommitmentInterval? CommitmentInterval { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }
  }

  public sealed class SyncItemVerificationCommitmentInterval
  {
    public Guid Id { get; set; }

    public short Count { get; set; }
  }
}

