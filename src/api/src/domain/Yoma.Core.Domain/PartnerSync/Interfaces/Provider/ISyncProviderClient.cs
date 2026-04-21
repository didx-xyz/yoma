using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Interfaces.Provider
{
  public interface ISyncProviderClient { }

  public interface ISyncProviderClientPull<TItem> : ISyncProviderClient
    where TItem : class, new()
  {
    Task<SyncResultPull<TItem>> List(SyncFilterPull filter);
  }

  public interface ISyncProviderClientPush<TItem> : ISyncProviderClient
    where TItem : class, new()
  {
    Task<string> Create(SyncRequestPush<TItem> request);

    Task Update(SyncRequestPush<TItem> request);

    Task Delete(string externalId);
  }
}
