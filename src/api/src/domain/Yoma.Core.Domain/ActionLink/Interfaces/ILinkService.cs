using Yoma.Core.Domain.ActionLink.Models;

namespace Yoma.Core.Domain.ActionLink.Interfaces
{
  public interface ILinkService
  {
    LinkInfo GetById(Guid id, bool ensureOrganizationAuthorization, bool? includeQRCode);

    void AssertActive(Guid id);

    LinkSearchResult Search(LinkSearchFilter filter, bool ensureOrganizationAuthorization);

    Task<LinkInfo> Create(LinkRequestCreate request, bool publishedOrExpiredOnly, bool ensureOrganizationAuthorization);

    Task<LinkInfo> LogUsage(Guid id);

    Task<LinkInfo> UpdateStatus(Guid id, LinkStatus status, bool ensureOrganizationAuthorization);
  }
}
