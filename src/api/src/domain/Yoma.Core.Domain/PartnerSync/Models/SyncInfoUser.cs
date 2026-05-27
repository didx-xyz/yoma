using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.PartnerSync.Models
{
  /// <summary>
  /// Current partner synchronization state for a user, when applicable.
  ///
  /// A user may be linked/authenticated with multiple partners.
  /// </summary>
  public sealed class SyncInfoUser
  {
    public List<SyncInfoUserPartner> Partners { get; set; } = [];
  }

  /// <summary>
  /// Partner-specific synchronization information for a user.
  /// </summary>
  public sealed class SyncInfoUserPartner
  {
    public SyncPartner Partner { get; set; }

    /// <summary>
    /// Partner-side user identifier, when provided by the partner.
    /// </summary>
    public string? ExternalId { get; set; }

    /// <summary>
    /// Date Yoma last redirected the user to the partner through a partner-authenticated flow.
    /// </summary>
    public DateTimeOffset? DateLastRedirect { get; set; }
  }
}
