using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.PartnerSync.Models
{
  /// <summary>
  /// Request used when pushing partner-managed entity records.
  /// 
  /// The entity type is supplied by the partner sync configuration / processing context
  /// and is therefore not repeated on the request.
  /// </summary>
  public sealed class SyncRequestPushEntity<TEntity>
    where TEntity : class, new()
  {
    public string? ExternalId { get; set; }

    public TEntity Item { get; set; } = null!;

    public Organization Organization { get; set; } = null!;

    public Organization OrganizationYoma { get; set; } = null!;

    public bool ShareContactInfo { get; set; }

    public bool ShareAddressInfo { get; set; }
  }
}
