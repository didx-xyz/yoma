using Yoma.Core.Domain.ActionLink.Models;

namespace Yoma.Core.Domain.ActionLink.Interfaces
{
  public interface ILinkService
  {
    Task<LinkInfo> Create(LinkRequestCreate request, bool ensureOrganizationAuthorization);
  }
}
