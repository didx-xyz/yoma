using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Logging;
using System.Net;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.ShortLinkProvider.Interfaces;
using Yoma.Core.Domain.ShortLinkProvider.Models;
using Yoma.Core.Infrastructure.Bitly.Models;

namespace Yoma.Core.Infrastructure.Bitly.Client
{
  public class BitlyClient : IShortLinkProviderClient
  {
    #region Class Variables
    private readonly ILogger<BitlyClient> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly AppSettings _appSettings;
    private readonly BitlyOptions _options;

    private const string Header_Authorization = "Authorization";
    private const string Header_Authorization_Value_Prefix = "Bearer";
    #endregion

    #region Constructor
    public BitlyClient(ILogger<BitlyClient> logger,
      IEnvironmentProvider environmentProvider,
      AppSettings appSettings,
      BitlyOptions options)
    {
      _logger = logger;
      _environmentProvider = environmentProvider;
      _appSettings = appSettings;
      _options = options;
    }
    #endregion

    #region Public Members
    public async Task<ShortLinkResponse> CreateShortLink(ShortLinkRequest request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      if (string.IsNullOrWhiteSpace(request.Title))
        throw new ArgumentNullException(nameof(request), "Title is required");
      request.Title = request.Title.Trim().RemoveSpecialCharacters();

      if (string.IsNullOrWhiteSpace(request.URL))
        throw new ArgumentNullException(nameof(request), "URL is required");
      request.URL = request.URL.Trim();

      if (!Uri.IsWellFormedUriString(request.URL, UriKind.Absolute))
        throw new ArgumentException("Invalid URL", nameof(request));

      if (!_appSettings.ShortLinkProviderAsSourceEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
      {
        _logger.LogInformation("Used dummy short link for environment '{environment}'", _environmentProvider.Environment);
        return GenerateDummyShortLink();
      }

      var tags = (request.ExtraTags ?? []).Where(tag => !string.IsNullOrWhiteSpace(tag)).Select(tag => tag.Trim()).ToList();
      tags.Add(_environmentProvider.Environment.ToString());
      tags.Add("Yoma");
      tags.Add(request.Type.ToString());
      tags.Add(request.Action.ToString());
      tags = tags.Distinct(StringComparer.InvariantCultureIgnoreCase).ToList();

      var requestCreate = new BitLinkRequestCreate
      {
        LongURL = request.URL,
        Domain = _options.CustomDomain,
        GroupId = _options.GroupId,
        Title = request.Title,
        Tags = tags,
      };

      //idempotent 
      var response = await _options.BaseUrl
        .AppendPathSegment($"v4/bitlinks")
        .WithAuthHeader(GetAuthHeader())
        .PostJsonAsync(requestCreate)
        .EnsureSuccessStatusCodeAsync([HttpStatusCode.Created])
        .ReceiveJson<BitLinkResponse>();

      return new ShortLinkResponse
      {
        Id = response.Id,
        Link = response.Link
      };
    }
    #endregion

    #region Private Members
    private KeyValuePair<string, string> GetAuthHeader()
    {
      return new KeyValuePair<string, string>(Header_Authorization, $"{Header_Authorization_Value_Prefix} {_options.ApiKey}");
    }

    private ShortLinkResponse GenerateDummyShortLink()
    {
      var path = GenerateRandomPath(6);
      var urlRelative = $"{_options.CustomDomain}/{path}";

      return new ShortLinkResponse
      {
        Id = urlRelative,
        Link = $"https://{urlRelative}"
      };
    }

    private static string GenerateRandomPath(int length)
    {
      var random = new Random();

      var chars = Enumerable.Range('0', '9' - '0' + 1).Select(i => (char)i)
            .Concat(Enumerable.Range('A', 'Z' - 'A' + 1).Select(i => (char)i))
            .Concat(Enumerable.Range('a', 'z' - 'a' + 1).Select(i => (char)i))
            .ToArray();

      return new string(Enumerable.Repeat(chars, length).Select(s => s[random.Next(s.Length)]).ToArray());
    }
    #endregion
  }
}
