using Yoma.Core.Domain.PartnerSharing.Models;

namespace Yoma.Core.Domain.PartnerSharing.Interfaces
{
  public interface IProcessingLogHelperService
  {
    ProcessingLog? GetByEntity(EntityType entityType, Guid entityId);
  }
}
