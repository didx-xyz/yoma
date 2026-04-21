using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.PartnerSync.Models
{
  public sealed class SyncRequestPush<TEntity>
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
