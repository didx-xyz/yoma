namespace Yoma.Core.Domain.PartnerSync.Models
{
  public sealed class SyncInfo
  {
    /// <summary>
    /// Synchronization state grouped by synchronization type.
    /// Each type can be associated with one or more partners.
    /// </summary>
    public List<SyncInfoType> Types { get; set; } = null!;

    /// <summary>
    /// Indicates whether the opportunity is locked for editing and status changes, except administrative delete.
    /// This applies when the opportunity is managed through pull synchronization.
    /// </summary>
    public bool Locked => Types.Any(o => o.SyncType == Core.SyncType.Pull) == true;
  }

  public sealed class SyncInfoType
  {
    public Core.SyncType SyncType { get; set; }

    public List<Core.SyncPartner> Partners { get; set; } = [];
  }
}
