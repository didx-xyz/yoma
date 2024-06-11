namespace Yoma.Core.Domain.ActionLink.Interfaces.Lookups
{
  public interface ILinkStatusService
  {
    Models.Lookups.LinkStatus GetByName(string name);

    Models.Lookups.LinkStatus? GetByNameOrNull(string name);

    Models.Lookups.LinkStatus GetById(Guid id);

    Models.Lookups.LinkStatus? GetByIdOrNull(Guid id);

    List<Models.Lookups.LinkStatus> List();
  }
}
