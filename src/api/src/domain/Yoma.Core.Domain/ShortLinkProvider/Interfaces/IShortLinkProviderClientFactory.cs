namespace Yoma.Core.Domain.ShortLinkProvider.Interfaces
{
  public interface IShortLinkProviderClientFactory
  {
    IShortLinkProviderClient CreateClient();
  }
}
