using Yoma.Core.Domain.ActionLink.Models;

namespace Yoma.Core.Domain.ActionLink.Interfaces
{
  public interface ILinkService
  {
    Task<Link> Create(LinkRequestCreate request, bool ensureOrganizationAuthorization);

    Task<Link> LogUsage(Guid id);
  }
}
