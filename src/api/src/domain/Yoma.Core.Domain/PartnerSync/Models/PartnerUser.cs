using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.PartnerSync.Models
{
  /// <summary>
  /// Represents a Yoma user that has been linked/authenticated with an external sync partner.
  /// 
  /// The stored username, email, phone number and external id represent the values known/used for the partner linkage.
  /// These values may differ from the latest Yoma user profile values if the user updates their profile after linking.
  /// </summary>
  public sealed class PartnerUser
  {
    public Guid Id { get; set; }

    public Guid PartnerId { get; set; }

    public SyncPartner Partner { get; set; }

    public Guid UserId { get; set; }

    public string Username { get; set; } = null!;

    public string? Email { get; set; }

    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Partner-side user identifier, when provided by the partner.
    /// </summary>
    public string? ExternalId { get; set; }

    /// <summary>
    /// Date the user was first linked/confirmed with the partner.
    /// </summary>
    public DateTimeOffset DateLinked => DateCreated;

    /// <summary>
    /// Date Yoma last redirected the user to the partner through a partner-authenticated flow.
    /// </summary>
    public DateTimeOffset? DateLastRedirect { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
