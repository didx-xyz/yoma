namespace Yoma.Core.Domain.Referral.Interfaces.Lookups
{
  public interface ILinkUsageStatusService
  {
    Models.Lookups.LinkUsageStatus GetByName(string name);

    Models.Lookups.LinkUsageStatus? GetByNameOrNull(string name);

    Models.Lookups.LinkUsageStatus GetById(Guid id);

    Models.Lookups.LinkUsageStatus? GetByIdOrNull(Guid id);

    List<Models.Lookups.LinkUsageStatus> List();
  }
}
