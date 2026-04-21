using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Interfaces
{
  public interface IProcessingLogHelperService
  {
    ProcessingLog? GetByEntityLatest(SyncType syncType, EntityType entityType, Guid entityId);

    ProcessingLog? GetByEntityLatest(SyncType syncType, Guid partnerId, EntityType entityType, string entityExternalId);
  }
}
