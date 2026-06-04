using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.PartnerSync.Models
{
  public sealed class PartnerSyncTrackingRequest
  {
    public Guid PartnerId { get; init; }

    public SyncType SyncType { get; init; }

    public EntityType EntityType { get; init; }

    public SyncScope SyncScope { get; init; }

    public DateTimeOffset DateStamp { get; init; }

    /// <summary>
    /// Total number of items processed by the sync run, including succeeded, skipped and failed items.
    /// Null means the run failed before normal item processing completed or counts were not captured.
    /// </summary>
    public int? ItemsProcessed { get; set; }

    /// <summary>
    /// Number of items successfully processed by the sync run.
    /// </summary>
    public int? ItemsSucceeded { get; set; }

    /// <summary>
    /// Number of items skipped by the sync run.
    /// </summary>
    public int? ItemsSkipped { get; set; }

    /// <summary>
    /// Number of items that failed during item-level processing.
    /// </summary>
    public int? ItemsFailed { get; set; }

    /// <summary>
    /// Number of items successfully created by the sync run.
    /// Skipped and failed items are not included.
    /// </summary>
    public int? ItemsCreated { get; set; }

    /// <summary>
    /// Number of items successfully updated by the sync run.
    /// Skipped and failed items are not included.
    /// </summary>
    public int? ItemsUpdated { get; set; }

    /// <summary>
    /// Number of items successfully deleted by the sync run.
    /// Skipped and failed items are not included.
    /// </summary>
    public int? ItemsDeleted { get; set; }

    /// <summary>
    /// Run-level failure reason when the sync run itself did not complete successfully.
    /// Item-level failures are counted by ItemsFailed and logged separately.
    /// </summary>
    public string? RunFailureReason { get; set; }
  }
}
