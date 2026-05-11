namespace Yoma.Core.Domain.PartnerSync.Models
{
  public sealed class SyncInfo
  {
    /// <summary>
    /// The synchronization type currently applied to the opportunity.
    /// Only one synchronization type may apply to an opportunity.
    ///
    /// Pull:
    /// - The external partner is the source of truth
    /// - The opportunity is locked for editing and status changes
    /// - The opportunity cannot be shared with other partners through push synchronization
    ///
    /// Push:
    /// - Yoma remains the opportunity owner and source of truth
    /// - The opportunity remains editable in Yoma
    /// - Update restrictions may still apply after sharing, depending on partner-specific synchronization rules
    /// </summary>
    public Core.SyncType SyncType { get; set; }

    /// <summary>
    /// The partners associated with the current synchronization type.
    ///
    /// Pull:
    /// - Exactly one partner
    /// - Represents the external source managing the opportunity
    ///
    /// Push:
    /// - One or more partners
    /// - Represents the partners the opportunity has been shared with
    /// </summary>
    public List<Core.SyncPartner> Partners { get; set; } = [];

    /// <summary>
    /// Indicates whether the opportunity is locked for editing and status changes.
    /// This applies when the opportunity is pull-synchronized (externally managed).
    /// </summary>
    public bool Locked => SyncType == Core.SyncType.Pull;
  }
}
