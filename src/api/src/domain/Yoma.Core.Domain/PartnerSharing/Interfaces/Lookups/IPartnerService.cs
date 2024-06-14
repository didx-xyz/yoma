namespace Yoma.Core.Domain.PartnerSharing.Interfaces.Lookups
{
  public interface IPartnerService
  {
    Models.Lookups.Partner GetByName(string name);

    Models.Lookups.Partner? GetByNameOrNull(string name);

    Models.Lookups.Partner GetById(Guid id);

    Models.Lookups.Partner? GetByIdOrNull(Guid id);

    List<Models.Lookups.Partner> List();

    List<Models.Lookups.Partner> ListForScheduling(ProcessingAction action, EntityType entityType, Guid entityId);
  }
}
