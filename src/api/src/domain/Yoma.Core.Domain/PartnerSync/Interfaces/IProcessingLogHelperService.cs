using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Interfaces
{
  public interface IProcessingLogHelperService
  {
    ProcessingLog? GetByEntity(SyncType syncType, EntityType entityType, Guid entityId);
  }
}
