namespace Yoma.Core.Domain.PartnerSharing.Interfaces
{
  public interface ISharingInfoService
  {
    Task<bool> IsShared(EntityType entityType, Guid entityId, bool abortIfPossible);
  }
}
