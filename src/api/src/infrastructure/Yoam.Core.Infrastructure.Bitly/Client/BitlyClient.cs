using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.ShortLinkProvider.Interfaces;
using Yoma.Core.Infrastructure.Bitly.Models;

namespace Yoma.Core.Infrastructure.Bitly.Client
{
  public class BitlyClient : IShortLinkProviderClient
  {
    #region Class Variables
    private readonly ILogger<BitlyClient> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly BitlyOptions _options;
    #endregion

    #region Constructor
    public BitlyClient(ILogger<BitlyClient> logger,
        IEnvironmentProvider environmentProvider,
        BitlyOptions options)
    {
      _logger = logger;
      _environmentProvider = environmentProvider;
      _options = options;
    }
    #endregion

    #region Public Members
    #endregion
  }
}
