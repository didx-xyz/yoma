using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.ShortLinkProvider.Interfaces;
using Yoma.Core.Infrastructure.Bitly.Models;

namespace Yoma.Core.Infrastructure.Bitly.Client
{
  public class BitlyClientFactory : IShortLinkProviderClientFactory
  {
    #region Class Variables
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly BitlyOptions _options;
    #endregion

    #region Constructor
    public BitlyClientFactory(IEnvironmentProvider environmentProvider,
        IOptions<BitlyOptions> options)
    {
      _environmentProvider = environmentProvider;
      _options = options.Value;
    }
    #endregion

    #region Public Members
    public IShortLinkProviderClient CreateClient()
    {
      return new BitlyClient(_environmentProvider, _options);
    }
    #endregion
  }
}
