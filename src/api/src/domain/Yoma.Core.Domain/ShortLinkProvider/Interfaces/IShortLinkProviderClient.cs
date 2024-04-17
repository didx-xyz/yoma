
using Yoma.Core.Domain.ShortLinkProvider.Models;

namespace Yoma.Core.Domain.ShortLinkProvider.Interfaces
{
  public interface IShortLinkProviderClient
  {
    Task<ShortLinkResponse> CreateShortLink(ShortLinkRequest request);
  }
}
