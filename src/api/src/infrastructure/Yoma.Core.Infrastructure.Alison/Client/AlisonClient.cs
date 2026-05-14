using FluentValidation;
using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.PartnerSync.Validators;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Helpers;
using Yoma.Core.Infrastructure.Alison.Models;

namespace Yoma.Core.Infrastructure.Alison.Client
{
  public sealed partial class AlisonClient : ISyncProviderClientPull<Opportunity>
  {
    #region Class Variables
    private const string EmbeddedResourceSuffix_Courses = ".Resources.courses.sample.json";
    private const string QueryParameter_Page = "page";
    private const string QueryParameter_PerPage = "per_page";
    private const string Header_Authorization = "Authorization";
    private const string Header_Authorization_Value_Prefix = "Bearer";
    private const string Path_Categories = "categories";
    private const string Alison_Web_BaseUrl = "https://alison.com";
    private const int PageSize_Maximum = 100;
    private const int Title_MaxLength = 150;
    private const int Summary_MaxLength = 150;

    private static AlisonAccessTokenResponse _accessToken = null!;
    private static AlisonResponse<AlisonCategory>? _categoriesPayload;

    // Yoma category name -> Alison category codes.
    // If unresolved, default to Other.
    private static readonly Dictionary<string, string[]> Categories_Map = new(StringComparer.OrdinalIgnoreCase)
    {
      { "Technology and Digitization", ["it", "network-and-security", "software-development", "software-tools", "it-management", "software-engineering", "it/administration", "it/aws", "it/ccna", "it/comptia", "it/computer-networking", "it/data-security", "it/devops", "it/microsoft", "it/security", "it/server"] },
      { "AI, Data and Analytics", ["data-science", "databases"] },
      { "Career and Personal Development", ["language", "education", "personal-development"] },
      { "Health and Care", ["health", "mental-health", "health-care", "nursing", "caregiving", "nutrition", "pharmacology", "personal-development/health", "personal-development/mental-health", "personal-development/depression", "personal-development/anxiety", "personal-development/diet", "fitness", "health-and-safety", "business/health-and-safety", "engineering/health-and-safety", "management/health-and-safety", "management/nursing"] },
      { "Business and Entrepreneurship", ["business", "marketing", "engineering", "management", "entrepreneurship", "finance", "economics", "law", "accounting", "e-commerce", "sales", "digital-marketing", "marketing/social-media", "marketing/sales", "marketing/retail"] },
      { "Environment and Climate", ["education/climate-change", "engineering/renewable-energy"] },
      { "Tourism and Hospitality", ["tourism-and-hospitality", "language/travel"] },
      { "Creative Industry and Arts", ["media-and-journalism", "music", "photography", "literature", "education/music-theory"] },
      { "Agriculture", ["agriculture", "farming"] }
    };

    // Yoma difficulty name -> Alison course levels.
    // Unknown or omitted values default to Any Level.
    private static readonly Dictionary<string, string[]> Difficulty_Map = new(StringComparer.OrdinalIgnoreCase)
    {
      { "Beginner", ["Beginner", "Beginner Level"] },
      { "Intermediate", ["Intermediate", "Intermediate Level"] },
      { "Advanced", ["Advanced", "Advanced Level", "Expert", "Expert Level"] },
      { "Any Level", ["Any Level", "Any Levels", "All Level", "All Levels", "All", "Any"] }
    };

    // Yoma time interval name -> Alison duration unit values.
    // Unknown or omitted values default to Hour / 1.
    private static readonly Dictionary<string, string[]> CommitmentInterval_Map = new(StringComparer.OrdinalIgnoreCase)
    {
      { TimeIntervalOption.Minute.ToString(), ["min", "mins", "minute", "minutes"] },
      { TimeIntervalOption.Hour.ToString(), ["hr", "hrs", "hour", "hours"] },
      { TimeIntervalOption.Day.ToString(), ["day", "days"] },
      { TimeIntervalOption.Week.ToString(), ["week", "weeks"] },
      { TimeIntervalOption.Month.ToString(), ["month", "months"] }
    };

    private readonly ILogger<AlisonClient> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly AppSettings _appSettings;
    private readonly AlisonOptions _options;
    private readonly IOpportunityTypeService _opportunityTypeService;
    private readonly IOpportunityCategoryService _opportunityCategoryService;
    private readonly ICountryService _countryService;
    private readonly ILanguageService _languageService;
    private readonly ISkillService _skillService;
    private readonly IOpportunityDifficultyService _opportunityDifficultyService;
    private readonly ITimeIntervalService _timeIntervalService;
    private readonly IEngagementTypeService _engagementTypeService;
    private readonly SyncFilterPullValidator _syncFilterPullValidator;
    #endregion

    #region Constructor
    public AlisonClient(
      ILogger<AlisonClient> logger,
      IEnvironmentProvider environmentProvider,
      AppSettings appSettings,
      AlisonOptions options,
      IOpportunityTypeService opportunityTypeService,
      IOpportunityCategoryService opportunityCategoryService,
      ICountryService countryService,
      ILanguageService languageService,
      ISkillService skillService,
      IOpportunityDifficultyService opportunityDifficultyService,
      ITimeIntervalService timeIntervalService,
      IEngagementTypeService engagementTypeService,
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
      _skillService = skillService ?? throw new ArgumentNullException(nameof(skillService));
      _opportunityDifficultyService = opportunityDifficultyService ?? throw new ArgumentNullException(nameof(opportunityDifficultyService));
      _timeIntervalService = timeIntervalService ?? throw new ArgumentNullException(nameof(timeIntervalService));
      _engagementTypeService = engagementTypeService ?? throw new ArgumentNullException(nameof(engagementTypeService));
      _syncFilterPullValidator = syncFilterPullValidator ?? throw new ArgumentNullException(nameof(syncFilterPullValidator));
    }
    #endregion

    #region Public Members
    public async Task<SyncResultPull<Opportunity>> List(SyncFilterPull filter)
    {
      ArgumentNullException.ThrowIfNull(filter);

      _syncFilterPullValidator.ValidateAndThrow(filter);

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug(
          "Starting Alison opportunity pull for environment '{environment}' with pageNumber '{pageNumber}' and pageSize '{pageSize}'",
          _environmentProvider.Environment, filter.PageNumber, filter.PageSize);

      return !_appSettings.PartnerSyncEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment)
        ? ListFromEmbeddedResource()
        : await ListFromApi(filter);
    }
    #endregion

    #region Private Members
    private SyncResultPull<Opportunity> ListFromEmbeddedResource()
    {
      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation(
          "Partner synchronization from external partners disabled for environment '{environment}'. Using local .NET embedded resources",
          _environmentProvider.Environment);

      var response = LoadEmbeddedCourses();

      var items = response.Data
        .Select(ToSyncItem)
        .ToList();

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Mapped Alison embedded sample payload to sync result with '{count}' opportunities", items.Count);

      return new SyncResultPull<Opportunity>
      {
        TotalCount = items.Count,
        Items = items
      };
    }

    private async Task<SyncResultPull<Opportunity>> ListFromApi(SyncFilterPull filter)
    {
      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug(
          "Alison live API path reached for environment '{environment}'. Requesting courses",
          _environmentProvider.Environment);

      var response = await GetCourses(filter);

      if (!response.Total.HasValue)
        throw new InvalidOperationException("Alison course response did not contain pagination total");

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug(
          "Loaded Alison course payload with item count '{count}' and total '{total}'",
          response.Data.Count, response.Total.Value);

      var items = response.Data
        .Select(ToSyncItem)
        .ToList();

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Mapped Alison live payload to sync result with '{count}' opportunities", items.Count);

      return new SyncResultPull<Opportunity>
      {
        TotalCount = response.Total.Value,
        Items = items
      };
    }

    private async Task<KeyValuePair<string, string>> GetAuthHeader()
    {
      if (_accessToken != null && _accessToken.DateExpire > DateTimeOffset.UtcNow)
        return new KeyValuePair<string, string>(Header_Authorization, $"{Header_Authorization_Value_Prefix} {_accessToken.AccessToken}");

      _accessToken = await GetAccessToken();

      return new KeyValuePair<string, string>(Header_Authorization, $"{Header_Authorization_Value_Prefix} {_accessToken.AccessToken}");
    }

    private async Task<AlisonAccessTokenResponse> GetAccessToken()
    {
      var request = new AlisonAccessTokenRequest
      {
        ClientId = _options.ClientId,
        ClientSecret = _options.ClientSecret
      };

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Requesting Alison access token");

      var response = await _options.BaseUrl
        .AppendPathSegment(_options.AccessTokenPath)
        .PostJsonAsync(request)
        .EnsureSuccessStatusCodeAsync()
        .ReceiveJson<AlisonAccessTokenResponse>();

      if (string.IsNullOrWhiteSpace(response.AccessToken))
        throw new InvalidOperationException("Alison access token response did not contain an access token");

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Successfully acquired Alison access token with token type '{tokenType}'", response.TokenType);

      return response;
    }

    private async Task<AlisonResponse<AlisonCategory>> GetCategories()
    {
      if (_categoriesPayload != null)
        return _categoriesPayload;

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Requesting Alison categories payload from '{path}'", Path_Categories);

      var pageNumber = 1;
      var categories = new List<AlisonCategory>();
      int? total = null;

      while (true)
      {
        var response = await _options.BaseUrl
          .AppendPathSegment(Path_Categories)
          .SetQueryParam(QueryParameter_Page, pageNumber)
          .SetQueryParam(QueryParameter_PerPage, PageSize_Maximum)
          .WithAuthHeader(await GetAuthHeader())
          .GetAsync()
          .EnsureSuccessStatusCodeAsync()
          .ReceiveJson<AlisonResponse<AlisonCategory>>();

        total ??= response.Total;

        categories.AddRange(response.Data);

        if (_logger.IsEnabled(LogLevel.Debug))
          _logger.LogDebug(
            "Loaded Alison categories page '{page}' with '{count}' items. Total loaded '{totalLoaded}'",
            pageNumber, response.Data.Count, categories.Count);

        if (response.Data.Count < PageSize_Maximum)
          break;

        if (total.HasValue && categories.Count >= total.Value)
          break;

        pageNumber++;
      }

      _categoriesPayload = new AlisonResponse<AlisonCategory>
      {
        Data = categories,
        Meta = new AlisonPaginationMeta
        {
          CurrentPage = 1,
          PerPage = PageSize_Maximum,
          Total = total ?? categories.Count,
          LastPage = total.HasValue
            ? (int)Math.Ceiling(total.Value / (double)PageSize_Maximum)
            : null
        }
      };

      return _categoriesPayload;
    }

    private async Task<AlisonResponse<AlisonCourse>> GetCourses(SyncFilterPull filter)
    {
      ArgumentNullException.ThrowIfNull(filter);

      var requestedPageNumber = filter.PageNumber!.Value;
      var requestedPageSize = filter.PageSize!.Value;

      var alisonPageSize = Math.Min(requestedPageSize, PageSize_Maximum);
      var requestedStartIndex = (requestedPageNumber - 1) * requestedPageSize;

      var alisonPageNumber = requestedStartIndex / alisonPageSize + 1;
      var alisonPageOffset = requestedStartIndex % alisonPageSize;

      var courses = new List<AlisonCourse>();
      int? total = null;

      while (courses.Count < requestedPageSize)
      {
        var response = await GetCoursesPage(alisonPageNumber, alisonPageSize);

        total ??= response.Total;

        if (!total.HasValue)
          throw new InvalidOperationException("Alison course response did not contain pagination total");

        var pageItems = response.Data.AsEnumerable();

        if (alisonPageOffset > 0)
        {
          pageItems = pageItems.Skip(alisonPageOffset);
          alisonPageOffset = 0;
        }

        courses.AddRange(pageItems.Take(requestedPageSize - courses.Count));

        if (_logger.IsEnabled(LogLevel.Debug))
          _logger.LogDebug(
            "Loaded Alison courses page '{page}' with pageSize '{pageSize}' and '{count}' items. Total collected for requested page '{totalCollected}'",
            alisonPageNumber, alisonPageSize, response.Data.Count, courses.Count);

        if (courses.Count >= requestedPageSize)
          break;

        if (response.Data.Count < alisonPageSize)
          break;

        if (alisonPageNumber * alisonPageSize >= total.Value)
          break;

        alisonPageNumber++;
      }

      return new AlisonResponse<AlisonCourse>
      {
        Data = courses,
        Meta = new AlisonPaginationMeta
        {
          CurrentPage = requestedPageNumber,
          PerPage = requestedPageSize,
          Total = total,
          From = courses.Count == 0 ? null : requestedStartIndex + 1,
          To = courses.Count == 0 ? null : requestedStartIndex + courses.Count,
          LastPage = total.HasValue
            ? (int)Math.Ceiling(total.Value / (double)requestedPageSize)
            : null
        }
      };
    }

    private async Task<AlisonResponse<AlisonCourse>> GetCoursesPage(int pageNumber, int pageSize)
    {
      var request = await CreateCoursesRequest(pageNumber, pageSize);

      return await request
        .GetAsync()
        .EnsureSuccessStatusCodeAsync()
        .ReceiveJson<AlisonResponse<AlisonCourse>>();
    }

    private async Task<IFlurlRequest> CreateCoursesRequest(int pageNumber, int pageSize)
    {
      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug(
          "Requesting Alison courses from '{path}' with page '{page}' and perPage '{perPage}'",
          _options.CoursesPath, pageNumber, pageSize);

      return _options.BaseUrl
        .AppendPathSegment(_options.CoursesPath)
        .SetQueryParam(QueryParameter_Page, pageNumber)
        .SetQueryParam(QueryParameter_PerPage, pageSize)
        .WithAuthHeader(await GetAuthHeader());
    }

    private SyncItem<Opportunity> ToSyncItem(AlisonCourse course)
    {
      ArgumentNullException.ThrowIfNull(course);

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Mapping Alison course '{courseId}' with slug '{slug}' to opportunity sync item", course.Id, course.Slug);

      // Opportunity type:
      // Alison provides courses only, so all synced Alison opportunities are mapped as Learning.
      var opportunityType = _opportunityTypeService.GetByName(Domain.Opportunity.Type.Learning.ToString());

      // Categories:
      // Map Alison category codes to Yoma categories using the static partner-specific mapping.
      // Exact code matches are preferred; if unresolved, fall back to the root code before defaulting to Other.
      // This keeps Alison-specific category logic deterministic and version-controlled.
      var categories = GetCategories(course);

      // Countries:
      // Always include Worldwide because Alison courses appear globally accessible.
      // If publisher.location contains a specific resolvable country, also include it for publisher-country discoverability.
      // Skip "Global" / "Worldwide" because those are already represented by WW.
      // Ignore Alison publisher.country_id because it is Alison-specific and not mapped to Yoma/ISO country ids.
      var countries = GetCountries(course);

      // Languages:
      // Store Alison opportunity content in English where available, but map all course-level supported languages.
      // Source supported languages from course.Language and course.Translations[].Locale.
      // Do not use category/tag translation locales, because those only describe translated lookup labels.
      // Locale values are normalized before lookup, e.g. en-US/en-GB -> EN, pt-BR -> PT.
      // If no supported language can be resolved, fallback to English.
      var languages = GetLanguages(course);

      // Title / summary / description:
      // Use English course content where available; otherwise fallback to the first listed translation.
      // Title and summary are shaped to satisfy Yoma validation limits.
      // Summary is plain text only. Description supports HTML and keeps the richer Alison course body.
      // Description also appends selected Alison metadata such as publisher and course type.
      var publisherName = GetPublisherName(course);
      var title = GetTitle(course);
      var summary = GetSummary(course, title);
      var description = GetDescription(course, title, publisherName);

      // Dates:
      // DateStart = published_at -> created_at -> UtcNow.
      // DateEnd = null/open-ended unless Alison provides expiry/removal semantics.
      var dateStart = DateTimeHelper.TryParse(course.PublishedAt)
        ?? DateTimeHelper.TryParse(course.CreatedAt)
        ?? DateTimeOffset.UtcNow;

      // Keywords:
      // Used as additional search terms beyond title, summary, description and mapped lookups.
      // Keep keywords focused and deterministic.
      // Source priority:
      // - Publisher name
      // - Course type, e.g. certificate/diploma
      //
      // Must:
      // - remove blank values
      // - remove values containing OpportunityService.Keywords_Separator / comma
      // - distinct values
      // - keep combined keyword length <= OpportunityService.Keywords_CombinedMaxLength
      //
      // Alison tags are excluded from keywords because they represent potential skill/topic mappings.
      // Tags will be handled separately via Skills once we implement strict matching against Yoma skills.
      var keywords = GetKeywords(course, publisherName);

      // Skills:
      // Alison tags are treated as candidate skill names.
      // Resolve by strict best-effort name matching against Yoma skills via SkillService.
      // Do not pass raw Alison tag values directly, because Yoma validates every skill id.
      // Unmatched tags are ignored.
      var skills = GetSkills(course);

      // Difficulty:
      // Alison course_level is mapped to Yoma difficulty.
      // Unknown or omitted values default to Any Level to avoid incorrectly classifying the course as Beginner.
      var difficulty = GetDifficulty(course);

      // Commitment:
      // Alison duration_avg is mapped to Yoma commitment interval/count.
      // For ranges, use the upper bound rounded up, e.g. "1.5-3 hrs" -> Hour / 3.
      // Unknown or omitted values default to Hour / 1 because Learning opportunities require commitment.
      var (interval, count) = GetCommitment(course);

      // Engagement type:
      // Alison provides online courses only, so all synced Alison opportunities are mapped as Online.
      var engagementType = _engagementTypeService.GetByName(EngagementTypeOption.Online.ToString());

      return new SyncItem<Opportunity>
      {
        ExternalId = course.Id.ToString(),

        // TODO: Deletion:
        // Keep false for now.
        // Do not infer deletion from missing paged Alison results.
        // If Alison confirms deletion/unpublish means "no longer present in /courses",
        // we need an infra-based tracking table / last-seen sync state before we can safely delete.
        Deleted = false,

        Item = new Opportunity
        {
          Title = title,
          Description = description,
          TypeId = opportunityType.Id,
          Type = opportunityType.Name,
          Summary = summary,
          URL = ResolveCourseUrl(course),

          OrganizationId = _options.OrganizationIdYoma,
          OrganizationName = _options.OrganizationName,

          DateStart = dateStart,
          DateEnd = null,

          Status = Status.Active,

          // Automatic verification, no participant limit, no rewards.
          // Completion is imported from Alison and processed by Yoma.
          VerificationEnabled = true,
          VerificationMethod = VerificationMethod.Automatic,
          VerificationTypes = null,
          ParticipantLimit = null,

          ZltoReward = null,
          YomaReward = null,
          ZltoRewardPool = null,
          YomaRewardPool = null,

          CredentialIssuanceEnabled = true,
          SSISchemaName = SSISSchemaHelper.ToFullName(SchemaType.Opportunity, $"Default"),

          DifficultyId = difficulty.Id,

          CommitmentIntervalId = interval.Id,
          CommitmentIntervalCount = count,

          EngagementTypeId = engagementType.Id,

          Skills = skills,

          ShareWithPartners = false,
          Hidden = false,
          Featured = false,
          Published = true,

          Keywords = keywords,
          Categories = categories,
          Countries = countries,
          Languages = languages
        }
      };
    }

    private static AlisonResponse<AlisonCourse> LoadEmbeddedCourses()
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

      return JsonConvert.DeserializeObject<AlisonResponse<AlisonCourse>>(json)
        ?? throw new InvalidOperationException("Failed to deserialize embedded Alison sample courses JSON");
    }

    private List<Domain.Opportunity.Models.Lookups.OpportunityCategory> GetCategories(AlisonCourse course)
    {
      ArgumentNullException.ThrowIfNull(course);

      var categories = course.Categories
        .Select(ResolveYomaCategory)
        .DistinctBy(item => item.Id)
        .ToList();

      return categories.Count > 0
        ? categories
        : [_opportunityCategoryService.GetByName(Category.Other.ToString())];
    }

    private Domain.Opportunity.Models.Lookups.OpportunityCategory ResolveYomaCategory(AlisonCategory category)
    {
      ArgumentNullException.ThrowIfNull(category);

      if (TryResolveYomaCategoryName(category.Code, out var categoryName))
        return _opportunityCategoryService.GetByName(categoryName);

      return _opportunityCategoryService.GetByName(Category.Other.ToString());
    }

    private static bool TryResolveYomaCategoryName(string? code, out string categoryName)
    {
      categoryName = string.Empty;

      code = code?.NormalizeNullableValue();
      if (string.IsNullOrWhiteSpace(code)) return false;

      if (TryResolveYomaCategoryNameExact(code, out categoryName))
        return true;

      var rootCode = code
        .Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .FirstOrDefault();

      return TryResolveYomaCategoryNameExact(rootCode, out categoryName);
    }

    private static bool TryResolveYomaCategoryNameExact(string? code, out string categoryName)
    {
      categoryName = string.Empty;

      if (string.IsNullOrWhiteSpace(code)) return false;

      foreach (var mapping in Categories_Map)
      {
        if (mapping.Value.Any(item => string.Equals(item, code, StringComparison.OrdinalIgnoreCase)))
        {
          categoryName = mapping.Key;
          return true;
        }
      }

      return false;
    }

    private List<Domain.Lookups.Models.Country> GetCountries(AlisonCourse course)
    {
      ArgumentNullException.ThrowIfNull(course);

      var result = new List<Domain.Lookups.Models.Country>
      {
        _countryService.GetByCodeAlpha2(Country.Worldwide.ToDescription())
      };

      // Countries:
      // Always include Worldwide because Alison courses appear globally accessible.
      // If publisher.location contains a specific country, also include it as an additional country.
      // Skip "Global" / "Worldwide" because that is already represented by WW.
      // Ignore Alison publisher.country_id because it is Alison-specific and not mapped to Yoma/ISO country ids.
      foreach (var publisher in course.Publishers)
      {
        var countryName = ResolvePublisherCountryName(publisher.Location);
        if (string.IsNullOrWhiteSpace(countryName)) continue;

        var country = _countryService.GetByNameOrNull(countryName);
        if (country == null) continue;

        result.Add(country);
      }

      return [.. result.DistinctBy(item => item.Id)];
    }

    private static string? ResolvePublisherCountryName(string? location)
    {
      location = location?.NormalizeNullableValue();
      if (string.IsNullOrWhiteSpace(location)) return null;

      if (location.Equals("Global", StringComparison.OrdinalIgnoreCase) ||
          location.Equals(Country.Worldwide.ToString(), StringComparison.OrdinalIgnoreCase))
        return null;

      // Examples:
      // "India" -> "India"
      // "Cork, Ireland" -> "Ireland"
      // "Galway, Ireland" -> "Ireland"
      var parts = location.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
      var result = parts.LastOrDefault()?.NormalizeNullableValue();

      if (string.IsNullOrWhiteSpace(result)) return null;

      if (result.Equals("Global", StringComparison.OrdinalIgnoreCase) ||
          result.Equals(Country.Worldwide.ToString(), StringComparison.OrdinalIgnoreCase))
        return null;

      return result;
    }

    private List<Domain.Lookups.Models.Language> GetLanguages(AlisonCourse course)
    {
      ArgumentNullException.ThrowIfNull(course);

      var results = new List<Domain.Lookups.Models.Language>();

      foreach (var locale in GetLanguageLocales(course))
      {
        var language = ResolveLanguage(locale);
        if (language != null)
          results.Add(language);
      }

      results = [.. results.DistinctBy(item => item.Id)];

      return results.Count > 0
        ? results
        : [_languageService.GetByName(Domain.Core.Language.English.ToString())];
    }


    private static IEnumerable<string> GetLanguageLocales(AlisonCourse course)
    {
      if (!string.IsNullOrWhiteSpace(course.Language))
        yield return course.Language;

      foreach (var locale in course.Translations
        .Select(item => item.Locale)
        .Where(item => !string.IsNullOrWhiteSpace(item)))
      {
        yield return locale!;
      }
    }

    private Domain.Lookups.Models.Language? ResolveLanguage(string? locale)
    {
      var codeAlpha2 = NormalizeLanguageCodeAlpha2(locale);
      if (string.IsNullOrWhiteSpace(codeAlpha2)) return null;

      return _languageService.GetByCodeAlpha2OrNull(codeAlpha2);
    }

    private static string? NormalizeLanguageCodeAlpha2(string? locale)
    {
      if (string.IsNullOrWhiteSpace(locale)) return null;

      var value = locale.Trim();

      // Examples:
      // en    -> EN
      // en-US -> EN
      // en_GB -> EN
      // pt-BR -> PT
      var codeAlpha2 = value
        .Split(['-', '_'], StringSplitOptions.RemoveEmptyEntries)
        .FirstOrDefault();

      return string.IsNullOrWhiteSpace(codeAlpha2)
        ? null
        : codeAlpha2.ToUpperInvariant();
    }

    private static string ResolveCourseUrl(AlisonCourse course)
    {
      ArgumentNullException.ThrowIfNull(course);

      if (!string.IsNullOrWhiteSpace(course.Url))
        return course.Url;

      return !string.IsNullOrWhiteSpace(course.Slug)
        ? $"{Alison_Web_BaseUrl}/course/{course.Slug}"
        : $"{Alison_Web_BaseUrl}/courses/{course.Id}";
    }

    private static string GetTitle(AlisonCourse course)
    {
      ArgumentNullException.ThrowIfNull(course);

      var translation = GetPreferredTranslation(course);

      var title = (translation?.Name).HtmlDecode()
        ?? course.Name.HtmlDecode();

      if (string.IsNullOrWhiteSpace(title))
        throw new InvalidOperationException($"Alison course title/name expected for course id '{course.Id}'");

      return title.TrimToLengthWithEllipsis(Title_MaxLength);
    }

    private static string GetSummary(AlisonCourse course, string title)
    {
      ArgumentNullException.ThrowIfNull(course);

      var translation = GetPreferredTranslation(course);

      var summary = (translation?.Headline).HtmlDecode()
        ?? (translation?.Summary).RemoveHtmlTags()?.HtmlDecode()
        ?? title.HtmlDecode();

      return (summary ?? title).TrimToLengthWithEllipsis(Summary_MaxLength);
    }

    private static string GetDescription(AlisonCourse course, string title, string? publisherName)
    {
      ArgumentNullException.ThrowIfNull(course);

      var translation = GetPreferredTranslation(course);

      var description = (translation?.Summary).HtmlDecode()
        ?? (translation?.Headline).HtmlDecode()
        ?? course.Modules.FirstOrDefault(module => !string.IsNullOrWhiteSpace(module.Description))?.Description.HtmlDecode()
        ?? title;

      var metadata = new List<string>();

      if (!string.IsNullOrWhiteSpace(publisherName))
        metadata.Add($"<strong>Publisher:</strong> {System.Net.WebUtility.HtmlEncode(publisherName)}");

      if (!string.IsNullOrWhiteSpace(course.Type))
        metadata.Add($"<strong>Course type:</strong> {System.Net.WebUtility.HtmlEncode(course.Type)}");

      if (metadata.Count > 0)
        description = $"{description}<br /><br />{string.Join("<br />", metadata)}";

      return description;
    }

    private static string? GetPublisherName(AlisonCourse course)
    {
      ArgumentNullException.ThrowIfNull(course);

      return course.Publishers
        .Select(item => item.Name.HtmlDecode())
        .FirstOrDefault(item => !string.IsNullOrWhiteSpace(item));
    }

    private static AlisonCourseTranslation? GetPreferredTranslation(AlisonCourse course)
    {
      ArgumentNullException.ThrowIfNull(course);

      // Prefer English as the canonical Yoma opportunity content source.
      // If English is not available, fallback to the first listed Alison translation.
      return course.Translations.FirstOrDefault(item =>
          string.Equals(NormalizeLanguageCodeAlpha2(item.Locale), "EN", StringComparison.OrdinalIgnoreCase))
        ?? course.Translations.FirstOrDefault();
    }

    private static List<string>? GetKeywords(AlisonCourse course, string? publisherName)
    {
      ArgumentNullException.ThrowIfNull(course);

      var result = new List<string>();

      foreach (var keyword in GetKeywordCandidates(course, publisherName))
        AddKeyword(result, keyword);

      return result.Count == 0 ? null : result;
    }

    private static IEnumerable<string?> GetKeywordCandidates(AlisonCourse course, string? publisherName)
    {
      yield return publisherName;
      yield return course.Type;
    }

    private static void AddKeyword(List<string> keywords, string? value)
    {
      value = value.HtmlDecode();
      if (string.IsNullOrWhiteSpace(value)) return;

      if (value.Contains(OpportunityService.Keywords_Separator, StringComparison.Ordinal))
        return;

      if (keywords.Any(item => string.Equals(item, value, StringComparison.OrdinalIgnoreCase)))
        return;

      var currentLength = keywords.Count == 0
        ? 0
        : string.Join(OpportunityService.Keywords_Separator, keywords).Length;

      var projectedLength = currentLength + value.Length;
      if (keywords.Count > 0)
        projectedLength += OpportunityService.Keywords_Separator.Length;

      if (projectedLength > OpportunityService.Keywords_CombinedMaxLength)
        return;

      keywords.Add(value);
    }

    private List<Domain.Lookups.Models.Skill>? GetSkills(AlisonCourse course)
    {
      ArgumentNullException.ThrowIfNull(course);

      var result = new List<Domain.Lookups.Models.Skill>();

      foreach (var tag in course.Tags)
      {
        var skill = ResolveSkill(tag);
        if (skill != null)
          result.Add(skill);
      }

      result = [.. result.DistinctBy(item => item.Id)];

      return result.Count == 0 ? null : result;
    }

    private Domain.Lookups.Models.Skill? ResolveSkill(AlisonTag tag)
    {
      ArgumentNullException.ThrowIfNull(tag);

      var name = tag.GetName();
      if (!string.IsNullOrWhiteSpace(name))
      {
        var skill = _skillService.GetByNameNormalizedOrNull(name);
        if (skill != null)
          return skill;
      }

      var slug = tag.GetSlug();
      if (!string.IsNullOrWhiteSpace(slug))
      {
        var skill = _skillService.GetByNameNormalizedOrNull(slug);
        if (skill != null)
          return skill;
      }

      return null;
    }

    private Domain.Opportunity.Models.Lookups.OpportunityDifficulty GetDifficulty(AlisonCourse course)
    {
      ArgumentNullException.ThrowIfNull(course);

      var difficultyName = ResolveDifficultyName(course.CourseLevel);

      return _opportunityDifficultyService.GetByName(difficultyName);
    }

    private static string ResolveDifficultyName(string? courseLevel)
    {
      courseLevel = courseLevel?.NormalizeNullableValue();

      if (!string.IsNullOrWhiteSpace(courseLevel))
      {
        foreach (var mapping in Difficulty_Map)
        {
          if (mapping.Value.Any(item => string.Equals(item, courseLevel, StringComparison.OrdinalIgnoreCase)))
            return mapping.Key;
        }
      }

      return Difficulty.AnyLevel.ToDescription();
    }

    private (Domain.Lookups.Models.TimeInterval Interval, short Count) GetCommitment(AlisonCourse course)
    {
      ArgumentNullException.ThrowIfNull(course);

      var intervalName = ResolveCommitmentIntervalName(course.DurationAvg);
      var interval = _timeIntervalService.GetByName(intervalName);
      var count = ResolveCommitmentIntervalCount(course.DurationAvg);

      return (interval, count);
    }

    private static string ResolveCommitmentIntervalName(string? duration)
    {
      duration = duration?.NormalizeNullableValue();

      if (!string.IsNullOrWhiteSpace(duration))
      {
        foreach (var mapping in CommitmentInterval_Map)
        {
          if (mapping.Value.Any(unit => ContainsDurationUnit(duration, unit)))
            return mapping.Key;
        }
      }

      return TimeIntervalOption.Hour.ToString();
    }

    private static short ResolveCommitmentIntervalCount(string? duration)
    {
      duration = duration?.NormalizeNullableValue();
      if (string.IsNullOrWhiteSpace(duration)) return 1;

      var values = Regex_CommitmentIntervalCountValue().Matches(duration)
        .Select(match => decimal.TryParse(match.Value, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out var value)
          ? value
          : default(decimal?))
        .Where(value => value.HasValue)
        .Select(value => value!.Value)
        .ToList();

      if (values.Count == 0) return 1;

      var upperBound = values.Max();
      var result = (short)Math.Ceiling(upperBound);

      return result > 0 ? result : (short)1;
    }

    private static bool ContainsDurationUnit(string duration, string unit)
    {
      return System.Text.RegularExpressions.Regex.IsMatch(
        duration,
        $@"(^|[^a-zA-Z]){System.Text.RegularExpressions.Regex.Escape(unit)}([^a-zA-Z]|$)",
        System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    }

    [System.Text.RegularExpressions.GeneratedRegex(@"\d+(\.\d+)?")]
    private static partial System.Text.RegularExpressions.Regex Regex_CommitmentIntervalCountValue();
    #endregion
  }
}
