namespace Yoma.Core.Domain.PartnerSync.Models
{
  public sealed class SyncItem<TItem> where TItem : class, new()
  {
    public string ExternalId { get; set; } = null!;

    public bool? Deleted { get; set; }

    public TItem Item { get; set; } = null!;
  }

  public sealed class SyncResultPull<TItem> where TItem : class, new()
  {
    public int? TotalCount { get; set; }

    public List<SyncItem<TItem>> Items { get; set; } = null!;
  }
}
