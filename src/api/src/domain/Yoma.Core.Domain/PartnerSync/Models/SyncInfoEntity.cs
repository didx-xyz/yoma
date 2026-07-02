using Newtonsoft.Json;
using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.PartnerSync.Models
{
  /// <summary>
  /// Shared synchronization state for an entity, when applicable.
  ///
  /// If no synchronization info is returned for an entity, the entity is not currently
  /// synchronized with any partner.
  /// </summary>
  public abstract class SyncInfoEntityBase
  {
    /// <summary>
    /// The synchronization type currently applied to the entity.
    /// Only one synchronization type may apply to an entity.
    /// </summary>
    public SyncType SyncType { get; set; }

    /// <summary>
    /// Indicates whether the entity is locked due to partner synchronization.
    ///
    /// Pull-synced entities are externally managed by the partner and are therefore locked
    /// for normal Yoma editing/status changes.
    /// </summary>
    public bool Locked => SyncType == SyncType.Pull;
  }

  /// <summary>
  /// Shared partner-specific synchronization information for an entity.
  /// </summary>
  public abstract class SyncInfoEntityPartnerBase
  {
    [JsonIgnore]
    internal Guid PartnerId { get; set; }

    /// <summary>
    /// The partner associated with the synchronization record.
    /// </summary>
    public SyncPartner Partner { get; set; }

    /// <summary>
    /// The Yoma entity type represented by the synchronization record.
    /// </summary>
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
  }

  /// <summary>
  /// Current partner synchronization state for an opportunity, when applicable.
  ///
  /// Opportunities support pull and push synchronization:
  /// - Pull: the external partner is the source of truth and the opportunity is locked.
  /// - Push: Yoma remains the source of truth and the opportunity may be shared with one
  ///   or more partners.
  /// </summary>
  public sealed class SyncInfoEntity : SyncInfoEntityBase
  {
    /// <summary>
    /// Partner-specific synchronization records for the opportunity.
    ///
    /// Pull-synced opportunities must have exactly one partner.
    /// Push-synced opportunities may have multiple partner records.
    /// </summary>
    public List<SyncInfoEntityPartner> Partners { get; set; } = [];
  }

  /// <summary>
  /// Partner-specific synchronization information for an opportunity.
  /// </summary>
  public sealed class SyncInfoEntityPartner : SyncInfoEntityPartnerBase
  {
    /// <summary>
    /// Navigation URL for the synchronized opportunity, when available.
    ///
    /// For normal sync metadata this is the static/default external URL owned by the
    /// opportunity, for example Opportunity.URL.
    ///
    /// The sync state service does not own entity URL resolution, so this value is supplied
    /// by the caller when the opportunity has an external URL available.
    ///
    /// Authenticated navigation flows may replace or enrich this value with a final
    /// partner-specific URL for the current user, for example when a partner requires
    /// registration, authentication, token handling, or redirect wrapping at navigation time.
    ///
    /// A null value means this synchronized partner item does not currently have a
    /// navigation URL.
    /// </summary>
    public string? URL { get; set; }
  }

  /// <summary>
  /// Current partner synchronization state for a MyOpportunity completion submission,
  /// when applicable.
  ///
  /// MyOpportunity synchronization is used for partner-provided opportunity
  /// verification/progress submissions. It is pull-only: the partner is the source of
  /// truth for the submission state, and Yoma records the resulting MyOpportunity item
  /// in ProcessingLog for tracking, payload hashing, retry handling, and UI locking.
  /// </summary>
  public sealed class SyncInfoMyOpportunity : SyncInfoEntityBase
  {
    /// <summary>
    /// Partner-specific synchronization records for the MyOpportunity completion submission.
    ///
    /// MyOpportunity synchronization is pull-only and must have exactly one partner.
    /// The list shape is retained for consistency with opportunity sync info, but the
    /// sync state service enforces the single-partner rule.
    /// </summary>
    public List<SyncInfoMyOpportunityPartner> Partners { get; set; } = [];
  }

  /// <summary>
  /// Partner-specific synchronization information for a MyOpportunity completion submission.
  /// </summary>
  public sealed class SyncInfoMyOpportunityPartner : SyncInfoEntityPartnerBase
  {
  }
}
