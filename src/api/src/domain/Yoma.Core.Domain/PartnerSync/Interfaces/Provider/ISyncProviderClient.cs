using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Interfaces.Provider
{
  /// <summary>
  /// Marker interface for partner sync provider clients.
  /// </summary>
  public interface ISyncProviderClient { }

  /// <summary>
  /// Provides partner-specific user authentication or linking support for external partner flows.
  /// </summary>
  public interface ISyncProviderClientUserAuthentication : ISyncProviderClient
  {
    /// <summary>
    /// Authenticates or links the supplied Yoma user with the external partner.
    /// </summary>
    Task<SyncResultUserAuthentication> Authenticate(SyncRequestUserAuthentication request);
  }

  /// <summary>
  /// Provider capability for pulling partner-managed entity records.
  /// 
  /// The entity type is supplied by the partner sync configuration / processing context
  /// and is therefore not repeated on the filter or result.
  /// </summary>
  public interface ISyncProviderClientPullEntity<TItem> : ISyncProviderClient
    where TItem : class, new()
  {
    Task<SyncResultPullEntity<TItem>> List(SyncFilterPullEntity filter);
  }

  /// <summary>
  /// Provider capability for pushing Yoma-managed entity records to a partner.
  /// 
  /// The entity type is supplied by the partner sync configuration / processing context
  /// and is therefore not repeated on the request.
  /// </summary>
  public interface ISyncProviderClientPushEntity<TItem> : ISyncProviderClient
    where TItem : class, new()
  {
    string ComputeUpdatePayloadHash(SyncRequestPushEntity<TItem> request);

    Task<string> Create(SyncRequestPushEntity<TItem> request);

    Task Update(SyncRequestPushEntity<TItem> request);

    Task Delete(string externalId);
  }

  /// <summary>
  /// Provider capability for pulling partner-managed verification records for a configured entity type.
  /// 
  /// The entity type is supplied by the partner sync configuration / processing context.
  /// For opportunity verification sync, the item entity external id refers to the partner-side opportunity identifier.
  /// </summary>
  public interface ISyncProviderClientPullVerification : ISyncProviderClient
  {
    Task<SyncResultPullVerification> List(SyncFilterPullVerification filter);
  }

  // Future extension:
  // If partner requirements later include pushing verification outcomes to external providers,
  // add a dedicated ISyncProviderClientPushVerification interface with its own request/result models.
  // Keep this separate from entity push because verification sync represents an outcome against
  // a configured entity type, not the entity record itself.
}
