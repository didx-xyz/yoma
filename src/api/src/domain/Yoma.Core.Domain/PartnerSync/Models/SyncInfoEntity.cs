using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.PartnerSync.Models
{
  /// <summary>
  /// Current partner synchronization state for an entity, when applicable.
  ///
  /// If no value is returned for this model, the entity is not currently synchronized with any partner.
  /// </summary>
  public sealed class SyncInfoEntity
  {
    /// <summary>
    /// The synchronization type currently applied to the entity.
    /// Only one synchronization type may apply to an entity.
    ///
    /// Pull:
    /// - The external partner is the source of truth
    /// - The entity is locked for editing and status changes
    /// - The entity cannot be shared with other partners through push synchronization
    ///
    /// Push:
    /// - Yoma remains the entity owner and source of truth
    /// - The entity remains editable in Yoma
    /// - Update restrictions may still apply after sharing, depending on partner-specific synchronization rules
    /// </summary>
    public SyncType SyncType { get; set; }

    /// <summary>
    /// Indicates whether the entity is locked due to partner synchronization.
    ///
    /// Pull-synced entities are externally managed by the partner and are therefore locked
    /// for normal Yoma editing/status changes.
    /// </summary>
    public bool Locked => SyncType == SyncType.Pull;

    /// <summary>
    /// Partner-specific synchronization records for the entity.
    /// </summary>
    public List<SyncInfoEntityPartner> Partners { get; set; } = [];
  }

  /// <summary>
  /// Partner-specific synchronization information for an entity.
  /// </summary>
  public sealed class SyncInfoEntityPartner
  {
    public SyncPartner Partner { get; set; }

    public EntityType EntityType { get; set; }

    /// <summary>
    /// Partner synchronization identifier for the entity, when available.
    ///
    /// This value is sourced from ProcessingLog.EntityExternalId and represents the
    /// partner-side/source identifier used during partner synchronization.
    ///
    /// For pull synchronization, this is the external identifier supplied by the partner
    /// for the imported entity.
    ///
    /// For push synchronization, this is the external identifier/reference returned by
    /// the partner after Yoma shared the entity.
    ///
    /// Partner-specific flows that require this value must validate it before use.
    /// </summary>
    public string? ExternalId { get; set; }

    /// <summary>
    /// Navigation URL for the synchronized entity, when available.
    ///
    /// For normal sync metadata this is the static/default external URL owned by the entity,
    /// for example Opportunity.URL.
    ///
    /// The sync state service does not own entity URL resolution, so this value is supplied
    /// by the caller when the entity has an external URL available.
    ///
    /// Authenticated navigation flows may replace or enrich this value with a final
    /// partner-specific URL for the current user, for example when a partner requires
    /// registration, authentication, token handling, or redirect wrapping at navigation time.
    ///
    /// A null value means this synchronized partner item does not currently have a navigation URL.
    /// Non-synchronized entities have no SyncInfoEntity value.
    /// </summary>
    public string? URL { get; set; }
  }
}
