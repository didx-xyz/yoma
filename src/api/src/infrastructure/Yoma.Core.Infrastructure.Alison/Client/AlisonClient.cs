using System.Net;
using System.Text.Json;
using FluentValidation;
using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.PartnerSync.Validators;
using Yoma.Core.Infrastructure.Alison.Models;

namespace Yoma.Core.Infrastructure.Alison.Client
{
  /*
   * Reasonable Alison mapping assumptions until live API credentials and payloads are available:
   * - Type: mapped to Learning.
   * - Categories: tries exact lookup by Alison category name; falls back to Other when no Yoma lookup matches.
   * - Country: defaults to Worldwide because the current modeled data suggests publisher location, not delivery geography.
   * - Language: tries code lookup first, then name lookup, and falls back to English.
   *
   * Caveats / follow-up once live Alison access is available:
   * 1. Category names may not line up with Yoma lookup names.
   *    - Exact-name matching is safe for now.
   *    - We may later need an explicit Alison-to-Yoma translation map.
   * 2. Country is still an educated guess.
   *    - Worldwide is the safest default for now.
   *    - Do not infer course availability from publisher location unless the live API confirms that behavior.
   */
  public sealed class AlisonClient : ISyncProviderClientPull<Opportunity>
  {
    #region Class Variables
    private const string EmbeddedResourceSuffix_Courses = ".Resources.courses.sample.json";
    private const string QueryParameter_Page = "page";
    private const string QueryParameter_PerPage = "per_page";
    private const string Header_Authorization = "Authorization";
    private const string BearerScheme = "Bearer";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
      PropertyNameCaseInsensitive = true
    };

    private readonly ILogger<AlisonClient> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly AppSettings _appSettings;
    private readonly AlisonOptions _options;
    private readonly IOpportunityTypeService _opportunityTypeService;
    private readonly IOpportunityCategoryService _opportunityCategoryService;
    private readonly ICountryService _countryService;
    private readonly ILanguageService _languageService;
    private readonly SyncFilterPullValidator _syncFilterPullValidator;
    #endregion

    #region Constructor
    public AlisonClient(ILogger<AlisonClient> logger,
      IEnvironmentProvider environmentProvider,
      AppSettings appSettings,
      AlisonOptions options,
      IOpportunityTypeService opportunityTypeService,
      IOpportunityCategoryService opportunityCategoryService,
      ICountryService countryService,
      ILanguageService languageService,
      SyncFilterPullValidator syncFilterPullValidator)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _environmentProvider = environmentProvider ?? throw new ArgumentNullException(nameof(environmentProvider));
      _appSettings = appSettings ?? throw new ArgumentNullException(nameof(appSettings));
      _options = options ?? throw new ArgumentNullException(nameof(options));
      _opportunityTypeService = opportunityTypeService ?? throw new ArgumentNullException(nameof(opportunityTypeService));
      _opportunityCategoryService = opportunityCategoryService ?? throw new ArgumentNullException(nameof(opportunityCategoryService));
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
      _languageService = languageService ?? throw new ArgumentNullException(nameof(languageService));
      _syncFilterPullValidator = syncFilterPullValidator ?? throw new ArgumentNullException(nameof(syncFilterPullValidator));
    }
    #endregion

    #region Public Members
    public async Task<SyncResultPull<Opportunity>> List(SyncFilterPull filter)
    {
      ArgumentNullException.ThrowIfNull(filter);

      _syncFilterPullValidator.ValidateAndThrow(filter);

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Starting Alison opportunity pull for environment '{environment}' with pageNumber '{pageNumber}' and pageSize '{pageSize}'", _environmentProvider.Environment, filter.PageNumber, filter.PageSize);

      if (!_appSettings.PartnerSyncEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
      {
        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation("Partner synchronization from external partners disabled for environment '{environment}'. Using local .NET embedded resources", _environmentProvider.Environment);

        var response = LoadEmbeddedCourses();

        if (_logger.IsEnabled(LogLevel.Debug))
          _logger.LogDebug("Loaded Alison embedded sample payload with page '{page}', perPage '{perPage}', total '{total}' and item count '{count}'", response.Page, response.PerPage, response.Total, response.Data.Count);

        var items = response.Data
          .Skip((filter.PageNumber!.Value - 1) * filter.PageSize!.Value)
          .Take(filter.PageSize.Value)
          .Select(ToSyncItem)
          .ToList();

        if (_logger.IsEnabled(LogLevel.Debug))
          _logger.LogDebug("Mapped Alison embedded sample payload to temporary sync result with '{count}' opportunities", items.Count);

        var result = new SyncResultPull<Opportunity>
        {
          TotalCount = response.Total,
          Items = items
        };

        return result;
      }

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Alison live API path reached for environment '{environment}'. Acquiring access token and requesting courses", _environmentProvider.Environment);

      var token = await GetAccessToken();
      var responseLive = await GetCourses(filter, token);

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Loaded Alison live payload with page '{page}', perPage '{perPage}', total '{total}' and item count '{count}'", responseLive.Page, responseLive.PerPage, responseLive.Total, responseLive.Data.Count);

      var itemsLive = responseLive.Data
        .Select(ToSyncItem)
        .ToList();

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Mapped Alison live payload to sync result with '{count}' opportunities", itemsLive.Count);

      return new SyncResultPull<Opportunity>
      {
        TotalCount = responseLive.Total,
        Items = itemsLive
      };
    }
    #endregion

    #region Private Members
    private async Task<AlisonToken> GetAccessToken()
    {
      var request = new AlisonAccessTokenRequest
      {
        ClientId = _options.ClientId,
        ClientSecret = _options.ClientSecret,
        OrganizationId = _options.OrganizationId,
        OrganizationKey = _options.OrganizationKey
      };

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Requesting Alison access token using organization '{organizationId}'", _options.OrganizationId);

      var response = await _options.BaseUrl
        .AppendPathSegment(_options.AccessTokenPath)
        .PostJsonAsync(request)
        .EnsureSuccessStatusCodeAsync()
        .ReceiveJson<AlisonAccessTokenResponse>();

      if (string.IsNullOrWhiteSpace(response.AccessToken))
        throw new InvalidOperationException("Alison access token response did not contain an access token");

      var token = AlisonToken.Create(response.AccessToken, response.RefreshToken, response.TokenType, response.ExpiresIn);

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Successfully acquired Alison access token with token type '{tokenType}' and refresh token available '{refreshTokenAvailable}'", token.TokenType, !string.IsNullOrWhiteSpace(token.RefreshToken));

      return token;
    }

    private async Task<AlisonPagedResponse<AlisonCourse>> GetCourses(SyncFilterPull filter, AlisonToken token)
    {
      ArgumentNullException.ThrowIfNull(token);

      var request = CreateCoursesRequest(filter, token.AccessToken);

      try
      {
        return await request
          .GetAsync()
          .EnsureSuccessStatusCodeAsync()
          .ReceiveJson<AlisonPagedResponse<AlisonCourse>>();
      }
      catch (HttpClientException ex) when (TokenRefreshRequired(ex.StatusCode) && !string.IsNullOrWhiteSpace(token.RefreshToken))
      {
        if (_logger.IsEnabled(LogLevel.Warning))
          _logger.LogWarning("Alison course pull returned '{statusCode}'. Attempting refresh-token flow before retrying", ex.StatusCode);

        var refreshedToken = await RefreshAccessToken(token.RefreshToken!);

        return await CreateCoursesRequest(filter, refreshedToken.AccessToken)
          .GetAsync()
          .EnsureSuccessStatusCodeAsync()
          .ReceiveJson<AlisonPagedResponse<AlisonCourse>>();
      }
    }

    private async Task<AlisonToken> RefreshAccessToken(string refreshToken)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(refreshToken);

      var request = new AlisonRefreshTokenRequest
      {
        ClientId = _options.ClientId,
        ClientSecret = _options.ClientSecret,
        OrganizationId = _options.OrganizationId,
        OrganizationKey = _options.OrganizationKey,
        RefreshToken = refreshToken
      };

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Refreshing Alison access token using organization '{organizationId}'", _options.OrganizationId);

      var response = await _options.BaseUrl
        .AppendPathSegment(_options.RefreshTokenPath)
        .PostJsonAsync(request)
        .EnsureSuccessStatusCodeAsync()
        .ReceiveJson<AlisonRefreshTokenResponse>();

      if (string.IsNullOrWhiteSpace(response.AccessToken))
        throw new InvalidOperationException("Alison refresh-token response did not contain an access token");

      var token = AlisonToken.Create(response.AccessToken, response.RefreshToken ?? refreshToken, response.TokenType, response.ExpiresIn);

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Successfully refreshed Alison access token with token type '{tokenType}' and refresh token available '{refreshTokenAvailable}'", token.TokenType, !string.IsNullOrWhiteSpace(token.RefreshToken));

      return token;
    }

    private IFlurlRequest CreateCoursesRequest(SyncFilterPull filter, string accessToken)
    {
      ArgumentNullException.ThrowIfNull(filter);
      ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);

      var pageNumber = filter.PageNumber!.Value;
      var pageSize = filter.PageSize!.Value;

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Requesting Alison courses from '{path}' with page '{page}' and perPage '{perPage}'", _options.CoursesPath, pageNumber, pageSize);

      return _options.BaseUrl
        .AppendPathSegment(_options.CoursesPath)
        .SetQueryParam(QueryParameter_Page, pageNumber)
        .SetQueryParam(QueryParameter_PerPage, pageSize)
        .WithAuthHeader(new KeyValuePair<string, string>(Header_Authorization, $"{BearerScheme} {accessToken}"));
    }

    private SyncItem<Opportunity> ToSyncItem(AlisonCourse course)
    {
      ArgumentNullException.ThrowIfNull(course);

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Mapping Alison course '{courseId}' with slug '{slug}' to opportunity sync item", course.Id, course.Slug);

      var opportunityType = _opportunityTypeService.GetByName(Domain.Opportunity.Type.Learning.ToString());
      var categories = GetCategories(course);
      var country = GetCountry(course);
      var language = GetLanguage(course);

      var summaryParts = course.Categories
        .Select(item => item.Name)
        .Where(item => !string.IsNullOrWhiteSpace(item))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToList();

      if (!string.IsNullOrWhiteSpace(course.Type))
        summaryParts.Add(course.Type);

      if (!string.IsNullOrWhiteSpace(course.Language))
        summaryParts.Add(course.Language);

      var keywordSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

      foreach (var item in course.Tags.Select(item => item.Name))
      {
        if (!string.IsNullOrWhiteSpace(item))
          keywordSet.Add(item);
      }

      foreach (var item in course.Categories.Select(item => item.Name))
      {
        if (!string.IsNullOrWhiteSpace(item))
          keywordSet.Add(item);
      }

      if (!string.IsNullOrWhiteSpace(course.Language))
        keywordSet.Add(course.Language);

      if (!string.IsNullOrWhiteSpace(course.Type))
        keywordSet.Add(course.Type);

      var description = course.Modules.FirstOrDefault()?.Description;
      if (string.IsNullOrWhiteSpace(description))
        description = course.Name;

      var publisherName = course.Publishers
        .Select(item => item.Name)
        .FirstOrDefault(item => !string.IsNullOrWhiteSpace(item));

      return new SyncItem<Opportunity>
      {
        ExternalId = course.Id.ToString(),
        Deleted = false,
        Item = new Opportunity
        {
          Title = course.Name,
          Description = description,
          TypeId = opportunityType.Id,
          Type = opportunityType.Name,
          Summary = summaryParts.Count == 0 ? null : string.Join(" | ", summaryParts.Distinct(StringComparer.OrdinalIgnoreCase)),
          URL = string.IsNullOrWhiteSpace(course.Slug) ? $"{_options.BaseUrl.TrimEnd('/')}/courses/{course.Id}" : $"{_options.BaseUrl.TrimEnd('/')}/courses/{course.Slug}",
          OrganizationId = _options.OrganizationIdYoma,
          OrganizationName = string.IsNullOrWhiteSpace(publisherName) ? "Alison" : publisherName,
          DateStart = course.PublishedAt ?? course.CreatedAt ?? DateTimeOffset.UtcNow,
          DateEnd = null,
          Status = Domain.Opportunity.Status.Active,
          VerificationEnabled = false,
          Hidden = false,
          Featured = false,
          Published = true,
          Keywords = keywordSet.Count == 0 ? null : [.. keywordSet],
          Categories = categories,
          Countries = [country],
          Languages = [language]
        }
      };
    }

    private static AlisonPagedResponse<AlisonCourse> LoadEmbeddedCourses()
    {
      var assembly = typeof(AlisonClient).Assembly;

      var resourceName = assembly
        .GetManifestResourceNames()
        .SingleOrDefault(item => item.EndsWith(EmbeddedResourceSuffix_Courses, StringComparison.OrdinalIgnoreCase));

      if (string.IsNullOrWhiteSpace(resourceName))
        throw new InvalidOperationException($"Embedded Alison sample resource '{EmbeddedResourceSuffix_Courses}' not found");

      using var stream = assembly.GetManifestResourceStream(resourceName)
        ?? throw new InvalidOperationException($"Unable to open embedded Alison sample resource '{resourceName}'");

      using var reader = new StreamReader(stream);
      var json = reader.ReadToEnd();

      var result = JsonSerializer.Deserialize<AlisonPagedResponse<AlisonCourse>>(json, JsonOptions)
        ?? throw new InvalidOperationException("Failed to deserialize embedded Alison sample courses JSON");

      return result;
    }

    private List<Yoma.Core.Domain.Opportunity.Models.Lookups.OpportunityCategory> GetCategories(AlisonCourse course)
    {
      ArgumentNullException.ThrowIfNull(course);

      var categories = course.Categories
        .Select(item => item.Name)
        .Where(item => !string.IsNullOrWhiteSpace(item))
        .Select(item => _opportunityCategoryService.GetByNameOrNull(item!))
        .Where(item => item != null)
        .DistinctBy(item => item!.Id)
        .Select(item => item!)
        .ToList();

      if (categories.Count > 0)
        return categories;

      // Alison category names are an educated guess until live payloads can be inspected.
      return [_opportunityCategoryService.GetByName(Domain.Opportunity.Category.Other.ToString())];
    }

    private Yoma.Core.Domain.Lookups.Models.Country GetCountry(AlisonCourse course)
    {
      ArgumentNullException.ThrowIfNull(course);

      // Alison course payloads currently appear to expose publisher location rather than learner availability.
      // Until live API payloads confirm a delivery country, default Alison learning opportunities to Worldwide.
      return _countryService.GetByCodeAlpha2(Domain.Core.Country.Worldwide.ToDescription());
    }

    private Yoma.Core.Domain.Lookups.Models.Language GetLanguage(AlisonCourse course)
    {
      ArgumentNullException.ThrowIfNull(course);

      if (!string.IsNullOrWhiteSpace(course.Language))
      {
        var language = _languageService.GetByCodeAlpha2OrNull(course.Language)
          ?? _languageService.GetByNameOrNull(course.Language);

        if (language != null)
          return language;
      }

      // Alison language values are not yet confirmed against live API payloads.
      return _languageService.GetByName(Domain.Core.Language.English.ToString());
    }

    private static bool TokenRefreshRequired(HttpStatusCode statusCode)
    {
      return statusCode == HttpStatusCode.Unauthorized || statusCode == HttpStatusCode.Forbidden;
    }
    #endregion
  }
}
