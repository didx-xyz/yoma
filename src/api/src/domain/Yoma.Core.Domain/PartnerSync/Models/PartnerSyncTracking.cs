namespace Yoma.Core.Domain.PartnerSync.Models
{
  public class PartnerSyncTracking
  {
    public Guid Id { get; set; }

    public Guid PartnerId { get; set; }

    public string SyncType { get; set; } = null!;

    public string EntityType { get; set; } = null!;

    public string SyncScope { get; set; } = null!;

    public string Status { get; set; } = null!;

    public int? ItemsProcessed { get; set; }

    public int? ItemsSucceeded { get; set; }

    public int? ItemsSkipped { get; set; }

    public int? ItemsFailed { get; set; }

    public string? FailedReason { get; set; }

    public DateTimeOffset DateStamp { get; set; }
  }
}
