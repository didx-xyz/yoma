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
  /// Represents a partner verification/progress record for the configured entity type.
  ///
  /// The entity type is supplied by the partner sync configuration / processing context.
  /// <see cref="EntityExternalId"/> identifies the partner-side entity being verified
  /// (for example, a partner course/opportunity id).
  /// <see cref="UserExternalId"/> identifies the partner-side user.
  /// <see cref="ExternalId"/> is a derived verification/progress record key used by Yoma
  /// for sync tracking when the partner does not provide a native submission id.
  /// </summary>
  public class SyncItemVerification
  {
    /// <summary>
    /// Stable partner-side verification/completion submission key.
    /// Some partners do not provide a native submission id, so this is derived from
    /// the partner entity id and partner user id.
    /// </summary>
    public string ExternalId => $"{EntityExternalId}:{UserExternalId}";

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

    /// <summary>
    /// Partner-provided status for this verification/completion
    /// </summary>
    public SyncItemVerificationStatus Status { get; set; }

    /// <summary>
    /// Partner-provided verification/completion progress as a percentage from 0 to 100
    /// </summary>
    public decimal? PercentComplete { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }
  }

  public sealed class SyncItemVerificationCommitmentInterval
  {
    public Guid Id { get; set; }

    public short Count { get; set; }
  }
}

