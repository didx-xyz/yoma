using Yoma.Core.Domain.ActionLink.Models;

namespace Yoma.Core.Domain.ActionLink.Interfaces
{
  public interface ILinkService
  {
    LinkInfo GetById(Guid id, bool ensureOrganizationAuthorization, bool? includeQRCode);

    void AssertActive(Guid id);

    LinkSearchResult Search(LinkSearchFilter filter, bool ensureOrganizationAuthorization);

    Task<LinkInfo> GetOrCreateShare(LinkRequestCreateShare request, bool publishedOrExpiredOnly, bool ensureOrganizationAuthorization);

    Task<LinkInfo> CreateVerify(LinkRequestCreateVerify request, bool publishedOrExpiredOnly, bool ensureOrganizationAuthorization);

    Task<LinkInfo> LogUsage(Guid id);

    Task<LinkInfo> UpdateStatus(Guid id, LinkRequestUpdateStatus request, bool ensureOrganizationAuthorization);
  }
}
