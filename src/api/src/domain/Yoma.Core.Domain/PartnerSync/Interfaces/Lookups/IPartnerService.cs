namespace Yoma.Core.Domain.PartnerSync.Interfaces.Lookups
{
  public interface IPartnerService
  {
    Models.Lookups.Partner GetByName(string name);

    Models.Lookups.Partner? GetByNameOrNull(string name);

    Models.Lookups.Partner GetById(Guid id);

    Models.Lookups.Partner? GetByIdOrNull(Guid id);

    List<Models.Lookups.Partner> ListPull(SyncAction? action = null, EntityType? entityType = null);

    List<Models.Lookups.Partner> ListPush(SyncAction? action = null, EntityType? entityType = null, Guid? entityId = null);
  }
}
