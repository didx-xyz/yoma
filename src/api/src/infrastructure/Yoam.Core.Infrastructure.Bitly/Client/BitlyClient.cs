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
    public string CreateShortLink(string title, string url, string? titleUrl)
    {
      ArgumentException.ThrowIfNullOrEmpty(title, nameof(title));

      if (!Uri.IsWellFormedUriString(url, UriKind.Absolute))
        throw new ArgumentException("Invalid URL", nameof(url));

      var request = new BitLinksRequest
      {
        LongURL = url,
        GroupId = _options.GroupId,
        Title = title,
        Tags = _options.Tags
      };

      switch (_options.ShortLinkType)
      {
        case ShortLinkType.Generic:
          break;

        case ShortLinkType.CustomDomain:
          request.Domain = _options.DomainCustom;
          break;

        case ShortLinkType.CustomBackHalf:
          break;

        case ShortLinkType.CustomDomainAndBackHalf:
          request.Domain = _options.DomainCustom;
          break;
      }

      return string.Empty;
    }
    #endregion
  }
}
