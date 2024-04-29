using Yoma.Core.Domain.ActionLink.Models;

namespace Yoma.Core.Domain.ActionLink.Interfaces
{
  public interface ILinkService
  {
    Link GetById(Guid id);

    void AssertActive(Guid id);

    LinkSearchResult Search(LinkSearchFilter filter);

    Task<Link> Create(LinkRequestCreate request, bool ensureOrganizationAuthorization);

    Task<Link> LogUsage(Guid id);

    Task<Link> UpdateStatus(Guid id, LinkStatus status);
  }
}
