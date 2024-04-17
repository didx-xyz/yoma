using Flurl;
using Flurl.Http;
using System.Net;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.ShortLinkProvider;
using Yoma.Core.Domain.ShortLinkProvider.Interfaces;
using Yoma.Core.Domain.ShortLinkProvider.Models;
using Yoma.Core.Infrastructure.Bitly.Models;

namespace Yoma.Core.Infrastructure.Bitly.Client
{
  public class BitlyClient : IShortLinkProviderClient
  {
    #region Class Variables
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly BitlyOptions _options;

    private const string Header_Authorization = "Authorization";
    private const string Header_Authorization_Value_Prefix = "Bearer";

    private readonly static string[] Common_Words = ["a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent", "as", "at",
      "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can", "cant", "cannot",
      "could", "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during", "each", "few",
      "for", "from", "further", "had", "hadnt", "has", "hasnt", "have", "havent", "having", "he", "hed", "hell", "hes",
      "her", "here", "heres", "hers", "herself", "him", "himself", "his", "how", "hows", "i", "id", "ill", "im", "ive",
      "if", "in", "into", "is", "isnt", "it", "its", "its", "itself", "lets", "me", "more", "most", "mustnt", "my",
      "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours",
      "ourselves", "out", "over", "own", "same", "shant", "she", "shed", "shell", "shes", "should", "shouldnt", "so",
      "some", "such", "than", "that", "thats", "the", "their", "theirs", "them", "themselves", "then", "there",
      "theres", "these", "they", "theyd", "theyll", "theyre", "theyve", "this", "those", "through", "to", "too",
      "under", "until", "up", "very", "was", "wasnt", "we", "wed", "well", "were", "weve", "werent", "what", "whats",
      "when", "whens", "where", "wheres", "which", "while", "who", "whos", "whom", "why", "whys", "will", "with", "wont",
      "would", "wouldnt", "you", "youd", "youll", "youre", "youve", "your", "yours", "yourself", "yourselves"];
    #endregion

    #region Constructor
    public BitlyClient(IEnvironmentProvider environmentProvider,
        BitlyOptions options)
    {
      _environmentProvider = environmentProvider;
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

      request.Tags = (request.Tags ?? []).Where(tag => !string.IsNullOrWhiteSpace(tag)).Select(tag => tag.Trim())
        .Append(_environmentProvider.Environment.ToString())
        .Distinct(StringComparer.InvariantCultureIgnoreCase)
        .ToList();

      var environmentPrefix = _environmentProvider.Environment != Domain.Core.Environment.Production ? $"{_environmentProvider.Environment}: " : string.Empty;
      var requestCreate = new BitLinkRequestCreate
      {
        LongURL = request.URL,
        GroupId = _options.GroupId,
        Title = request.Title,
        Tags = request.Tags,
        Domain = request.Type switch
        {
          ShortLinkType.Generic or ShortLinkType.CustomBackHalf => _options.GenericDomain,
          ShortLinkType.CustomDomain or ShortLinkType.CustomDomainAndBackHalf => _options.CustomDomain,
          _ => throw new ArgumentOutOfRangeException(nameof(request), request.Type, "Invalid type"),
        }
      };

      var response = await _options.BaseUrl
        .AppendPathSegment($"v4/bitlinks")
        .WithAuthHeader(GetAuthHeader())
        .PostJsonAsync(requestCreate)
        .EnsureSuccessStatusCodeAsync([HttpStatusCode.Created])
        .ReceiveJson<BitLinkResponse>();

      return await UpdateCustomBackHalve(response, request.Type, request.Title);
    }
    #endregion

    #region Private Members
    private KeyValuePair<string, string> GetAuthHeader()
    {
      return new KeyValuePair<string, string>(Header_Authorization, $"{Header_Authorization_Value_Prefix} {_options.ApiKey}");
    }

    private async Task<ShortLinkResponse> UpdateCustomBackHalve(BitLinkResponse bitLink, ShortLinkType type, string title)
    {
      var result = new ShortLinkResponse
      {
        Id = bitLink.Id,
        Link = bitLink.Link
      };

      switch (type)
      {
        case ShortLinkType.CustomBackHalf:
        case ShortLinkType.CustomDomainAndBackHalf:
          var requestPatch = new BitLinkRequestPAtchCustomBack
          {
            Id = bitLink.Id,
            CustomLink = await GenerateNewUriRelativeWithCustomBackHalf(result.Link, title)

          };

          var response = await _options.BaseUrl
            .AppendPathSegment($"v4/custom_bitlinks")
            .WithAuthHeader(GetAuthHeader())
            .PostJsonAsync(requestPatch)
            .EnsureSuccessStatusCodeAsync()
            .ReceiveJson<BitLinkResponseCustomBack>();

          result.Id = response.BitLink.Id;
          result.Link = response.CustomBitLink;
          return result;

        default:
          return result;
      }
    }

    private async Task<string> GenerateNewUriRelativeWithCustomBackHalf(string url, string title)
    {
      var titleWords = title.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries).ToList();
      var filteredWords = titleWords.Except(Common_Words).Distinct().Select(word => word.TitleCase()).ToList();
      var titleSquashed = filteredWords.Aggregate(string.Empty, (acc, word) => (acc.Length + word.Length <= 50) ? acc + word : acc);

      var newUriRelative = ReplaceLastSegmentAndRemoveScheme(url, titleSquashed);
      var result = newUriRelative;

      var suffix = 1;
      var maxAttempts = 10;
      do
      {
        try
        {
          var resp = await _options.BaseUrl
           .AppendPathSegment($"v4/bitlinks/{result}")
           .WithAuthHeader(GetAuthHeader())
           .GetAsync()
           .EnsureSuccessStatusCodeAsync();
        }
        catch (HttpClientException ex)
        {
          if (ex.StatusCode == HttpStatusCode.NotFound) break;
        }

        if (suffix >= maxAttempts)
          throw new InvalidOperationException("Maximum attempts reached, unique URL cannot be generated");

        result = $"{newUriRelative}_{suffix}";
        suffix++;

      } while (true);

      return result;
    }

    private static string ReplaceLastSegmentAndRemoveScheme(string url, string newLastSegment)
    {
      var uri = new Uri(url, UriKind.RelativeOrAbsolute);
      var segments = uri.AbsolutePath.Trim('/').Split('/');
      segments[^1] = newLastSegment;
      var newPath = string.Join("/", segments);
      var port = uri.IsDefaultPort ? "" : $":{uri.Port}";
      return $"{uri.Host}{port}/{newPath}" + (string.IsNullOrEmpty(uri.Query) ? "" : $"{uri.Query}");
    }
    #endregion
  }
}
