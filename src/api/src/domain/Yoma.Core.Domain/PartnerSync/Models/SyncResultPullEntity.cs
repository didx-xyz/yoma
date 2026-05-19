namespace Yoma.Core.Domain.PartnerSync.Models
{
  /// <summary>
  /// Result returned when pulling partner-managed entity records.
  /// 
  /// The entity type is supplied by the partner sync configuration / processing context
  /// and applies to all items in the result.
  /// </summary>
  public sealed class SyncResultPullEntity<TItem> where TItem : class, new()
  {
    public int? TotalCount { get; set; }

    public List<SyncItemEntity<TItem>> Items { get; set; } = null!;
  }

  public sealed class SyncItemEntity<TItem> where TItem : class, new()
  {
    /// <summary>
    /// Partner-side external identifier for the entity being synchronized.
    /// </summary>
    public string ExternalId { get; set; } = null!;

    public bool? Deleted { get; set; }

    public TItem Item { get; set; } = null!;
  }
}
