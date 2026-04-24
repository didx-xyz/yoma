using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Interfaces
{
  public interface IProcessingHelperService
  {
    ProcessingLog? GetByEntityLatest(Core.SyncType syncType, EntityType entityType, Guid entityId);

    ProcessingLog? GetByEntityLatest(Core.SyncType syncType, Guid partnerId, EntityType entityType, string entityExternalId);
  }
}
