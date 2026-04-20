namespace Yoma.Core.Domain.PartnerSync.Interfaces.Lookups
{
  public interface IProcessingStatusService
  {
    Models.Lookups.ProcessingStatus GetByName(string name);

    Models.Lookups.ProcessingStatus? GetByNameOrNull(string name);

    Models.Lookups.ProcessingStatus GetById(Guid id);

    Models.Lookups.ProcessingStatus? GetByIdOrNull(Guid id);

    List<Models.Lookups.ProcessingStatus> List();
  }
}
