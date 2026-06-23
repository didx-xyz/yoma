using FluentValidation;
using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Globalization;
using System.Net;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.PartnerSync.Validators;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Helpers;
using Yoma.Core.Infrastructure.Alison.Extensions;
using Yoma.Core.Infrastructure.Alison.Interfaces;
using Yoma.Core.Infrastructure.Alison.Models;

namespace Yoma.Core.Infrastructure.Alison.Client
{
  public sealed partial class AlisonClient :
    ISyncProviderClientPullEntity<Domain.Opportunity.Models.Opportunity>,
    ISyncProviderClientPullVerification,
    ISyncProviderClientUserAuthentication
  {
    #region Class Variables
    // Yoma category id -> Alison category codes.
    // If unresolved, default to Other.
    private static readonly Dictionary<Guid, string[]> Categories_Map = new()
    {
      // Agriculture
      { new Guid("2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950"), ["agriculture", "farming"] },
      // Career and Personal Development
      { new Guid("89f4ab46-0767-494f-a18c-3037f698133a"), ["language", "education", "personal-development"] },
      // Business and Entrepreneurship
      { new Guid("c76786fd-fca9-4633-85b3-11e53486d708"), ["business", "marketing", "engineering", "management", "entrepreneurship", "finance", "economics", "law", "accounting", "e-commerce", "sales", "digital-marketing", "marketing/social-media", "marketing/sales", "marketing/retail"] },
      // Environment and Climate
      { new Guid("d0d322ab-d1d7-44b6-94e8-7b85246aa42e"), ["education/climate-change", "engineering/renewable-energy"] },
      // Technology and Digitization
      { new Guid("fa564c1c-591a-4a6d-8294-20165da8866b"), ["it", "network-and-security", "software-development", "software-tools", "it-management", "software-engineering", "it/administration", "it/aws", "it/ccna", "it/comptia", "it/computer-networking", "it/data-security", "it/devops", "it/microsoft", "it/security", "it/server"] },
      // Tourism and Hospitality
      { new Guid("f36051c9-9057-4765-bc2f-9dee82ef60d6"), ["tourism-and-hospitality", "language/travel"] },
      // AI, Data and Analytics
      { new Guid("1dc39a5d-e049-4cfe-b708-855fce97b86e"), ["data-science", "databases"] },
      // Creative Industry and Arts
      { new Guid("7afb66ad-164e-46a3-933f-a0bac1ca1923"), ["media-and-journalism", "music", "photography", "literature", "education/music-theory"] },
      // Health and Care
      { new Guid("6e6a5f23-6d2e-4f45-8b4d-5d9c9a6b1e71"), ["health", "mental-health", "health-care", "nursing", "caregiving", "nutrition", "pharmacology", "personal-development/health", "personal-development/mental-health", "personal-development/depression", "personal-development/anxiety", "personal-development/diet", "fitness", "health-and-safety", "business/health-and-safety", "engineering/health-and-safety", "management/health-and-safety", "management/nursing"] }
    };

    // Yoma difficulty id -> Alison course levels.
    // Unknown or omitted values default to Any Level.
    private static readonly Dictionary<Guid, string[]> Difficulty_Map = new()
    {
      // Beginner
      { new Guid("e33ae372-c63f-459d-983f-4527355fd0c4"), ["Beginner", "Beginner Level"] },
      // Intermediate
      { new Guid("e84efa58-f0ff-41f4-a2db-12c33f5e306c"), ["Intermediate", "Intermediate Level"] },
      // Advanced
      { new Guid("833e1f02-31b9-455e-8f4f-ce6a6c4a9aa7"), ["Advanced", "Advanced Level", "Expert", "Expert Level"] }
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
    private readonly IRepositoryBatched<Opportunity> _opportunityRepository;
    private readonly IOpportunityTypeService _opportunityTypeService;
    private readonly IOpportunityCategoryService _opportunityCategoryService;
    private readonly ICountryService _countryService;
    private readonly ILanguageService _languageService;
    private readonly ISkillService _skillService;
    private readonly IOpportunityDifficultyService _opportunityDifficultyService;
    private readonly ITimeIntervalService _timeIntervalService;
    private readonly IEngagementTypeService _engagementTypeService;
    private readonly IAlisonAuthService _alisonAuthService;
    private readonly SyncFilterPullEntityValidator _syncFilterPullEntityValidator;
    private readonly SyncFilterPullVerificationValidator _syncFilterPullVerificationValidator;
    #endregion

    #region Constructor
    public AlisonClient(
      ILogger<AlisonClient> logger,
      IEnvironmentProvider environmentProvider,
      AppSettings appSettings,
      AlisonOptions options,
      IRepositoryBatched<Opportunity> opportunityRepository,
      IOpportunityTypeService opportunityTypeService,
      IOpportunityCategoryService opportunityCategoryService,
      ICountryService countryService,
      ILanguageService languageService,
      ISkillService skillService,
      IOpportunityDifficultyService opportunityDifficultyService,
      ITimeIntervalService timeIntervalService,
      IEngagementTypeService engagementTypeService,
      IAlisonAuthService alisonAuthService,
      SyncFilterPullEntityValidator syncFilterPullEntityValidator,
      SyncFilterPullVerificationValidator syncFilterPullVerificationValidator)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _environmentProvider = environmentProvider ?? throw new ArgumentNullException(nameof(environmentProvider));
      _appSettings = appSettings ?? throw new ArgumentNullException(nameof(appSettings));
      _options = options ?? throw new ArgumentNullException(nameof(options));
      _opportunityRepository = opportunityRepository ?? throw new ArgumentNullException(nameof(opportunityRepository));
      _opportunityTypeService = opportunityTypeService ?? throw new ArgumentNullException(nameof(opportunityTypeService));
      _opportunityCategoryService = opportunityCategoryService ?? throw new ArgumentNullException(nameof(opportunityCategoryService));
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
      _languageService = languageService ?? throw new ArgumentNullException(nameof(languageService));
      _skillService = skillService ?? throw new ArgumentNullException(nameof(skillService));
      _opportunityDifficultyService = opportunityDifficultyService ?? throw new ArgumentNullException(nameof(opportunityDifficultyService));
      _timeIntervalService = timeIntervalService ?? throw new ArgumentNullException(nameof(timeIntervalService));
      _engagementTypeService = engagementTypeService ?? throw new ArgumentNullException(nameof(engagementTypeService));
      _alisonAuthService = alisonAuthService ?? throw new ArgumentNullException(nameof(alisonAuthService));
      _syncFilterPullEntityValidator = syncFilterPullEntityValidator ?? throw new ArgumentNullException(nameof(syncFilterPullEntityValidator));
      _syncFilterPullVerificationValidator = syncFilterPullVerificationValidator ?? throw new ArgumentNullException(nameof(syncFilterPullVerificationValidator));
    }
    #endregion

    #region Public Members
    public async Task<SyncResultUserAuthentication> Authenticate(SyncRequestUserAuthentication request)
    {
      ArgumentNullException.ThrowIfNull(request);

      ValidateAndNormalizeUserAuthenticationRequest(request);

      if (!_appSettings.PartnerSyncEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
      {
        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation(
            "Partner synchronization from external partners disabled for environment '{environment}'. Returning default Alison navigation URL for Yoma user '{userId}'",
            _environmentProvider.Environment, request.UserId);

        return AuthenticationMock(request);
      }

      // Alison supports email-based user authentication only.
      // When no real email is available, fall back to the default external URL.
      if (string.IsNullOrEmpty(request.Email))
      {
        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation(
            "Skipping Alison user authentication for Yoma user '{userId}' because Alison requires a real email address. The default partner navigation URL will be used",
            request.UserId);

        return new SyncResultUserAuthentication { URL = request.EntitySyncInfo.URL! };
      }

      return !string.IsNullOrEmpty(request.UserSyncInfo?.ExternalId) ? await LoginExistingUser(request) : await RegisterOrLoginUser(request);
    }

    public Task<SyncResultPullEntity<Domain.Opportunity.Models.Opportunity>> List(SyncFilterPullEntity filter)
    {
      ArgumentNullException.ThrowIfNull(filter);

      _syncFilterPullEntityValidator.ValidateAndThrow(filter);

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug(
          "Listing Alison opportunity sync items from local catalogue cache: environment '{environment}', page number '{pageNumber}', page size '{pageSize}'",
          _environmentProvider.Environment, filter.PageNumber, filter.PageSize);

      return Task.FromResult(ListFromStore(filter));
    }

    public async Task<SyncResultPullVerification> List(SyncFilterPullVerification filter)
    {
      ArgumentNullException.ThrowIfNull(filter);

      _syncFilterPullVerificationValidator.ValidateAndThrow(filter);

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug(
          "Listing Alison completed course verification sync items for environment '{environment}' from '{dateStart}' to '{dateEnd}', page number '{pageNumber}', page size '{pageSize}'",
          _environmentProvider.Environment, filter.DateStart, filter.DateEnd, filter.PageNumber, filter.PageSize);

      return !_appSettings.PartnerSyncEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment)
        ? ListCompletedCoursesFromEmbeddedResource(filter)
        : await ListCompletedCoursesFromApi(filter);
    }
    #endregion

    #region Private Members
    /// <summary>
    /// Validates that the user-authentication request belongs to Alison and
    /// normalizes request values in place for downstream processing.
    /// </summary>
    private static void ValidateAndNormalizeUserAuthenticationRequest(SyncRequestUserAuthentication request)
    {
      ArgumentNullException.ThrowIfNull(request);
      ArgumentNullException.ThrowIfNull(request.EntitySyncInfo);

      if (request.EntitySyncInfo.Partner != SyncPartner.Alison)
        throw new InvalidOperationException($"Partner '{request.EntitySyncInfo.Partner}' not supported by Alison user authentication");

      request.EntitySyncInfo.ExternalId = request.EntitySyncInfo.ExternalId?.Trim();
      if (string.IsNullOrEmpty(request.EntitySyncInfo.ExternalId))
        throw new InvalidOperationException("Alison course external id is required for user authentication");

      request.EntitySyncInfo.URL = request.EntitySyncInfo.URL?.Trim();
      if (string.IsNullOrEmpty(request.EntitySyncInfo.URL))
        throw new InvalidOperationException("Default Alison navigation URL is required for user authentication");

      request.Email = request.Email?.Trim();
      request.FirstName = request.FirstName?.Trim();
      request.Surname = request.Surname?.Trim();
      request.UserSyncInfo?.ExternalId = request.UserSyncInfo.ExternalId?.Trim();
    }

    /// <summary>
    /// Returns a local/dev-safe authentication result without calling Alison.
    ///
    /// This is used when partner synchronization from external providers is disabled for the
    /// current environment. The default Alison course URL is preserved, while mock user sync
    /// info is returned so the domain redirect/update flow can still be exercised locally.
    /// </summary>
    private static SyncResultUserAuthentication AuthenticationMock(SyncRequestUserAuthentication request)
    {
      var externalId = request.UserSyncInfo?.ExternalId ?? $"mock-alison-user-{request.UserId}";

      return new SyncResultUserAuthentication
      {
        URL = request.EntitySyncInfo.URL!,
        UserSyncInfo = new SyncInfoUserPartner
        {
          Partner = SyncPartner.Alison,
          ExternalId = externalId,
          DateLastRedirect = DateTimeOffset.UtcNow
        }
      };
    }

    /// <summary>
    /// Logs in an already-linked Alison user and returns an authenticated Alison course URL.
    /// </summary>
    private async Task<SyncResultUserAuthentication> LoginExistingUser(SyncRequestUserAuthentication request)
    {
      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation(
          "Existing Alison user sync info found for Yoma user '{userId}'. Attempting Alison login",
          request.UserId);

      var (_, Authentication) = await Authenticate(
        request,
        UserAuthenticationRequestType.Login);

      return Authentication ?? throw new InvalidOperationException("Alison login authentication result expected");
    }

    /// <summary>
    /// Registers a Yoma user with Alison and returns an authenticated Alison course URL.
    ///
    /// Alison can return 422 when the user already exists on their side but Yoma does not yet
    /// have stored Alison user sync info. In that case, fallback to login and persist the
    /// returned Alison user id through the normal domain user-sync-info update flow.
    /// </summary>
    private async Task<SyncResultUserAuthentication> RegisterOrLoginUser(
      SyncRequestUserAuthentication request)
    {
      var (StatusCode, Authentication) = await Authenticate(
        request,
        UserAuthenticationRequestType.Register,
        [HttpStatusCode.UnprocessableEntity]);

      if (StatusCode != HttpStatusCode.UnprocessableEntity)
        return Authentication ?? throw new InvalidOperationException("Alison register authentication result expected");

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation(
          "Alison user registration returned 422 for Yoma user '{userId}'. Attempting Alison login",
          request.UserId);

      var loginResult = await Authenticate(
        request,
        UserAuthenticationRequestType.Login);

      return loginResult.Authentication ?? throw new InvalidOperationException("Alison login authentication result expected");
    }

    /// <summary>
    /// Executes the Alison user register/login request and maps a successful response to
    /// Yoma's provider user-authentication result.
    ///
    /// A 422 response is only allowed when explicitly supplied as an additional success status.
    /// This lets the registration flow treat "already exists" as a controlled login fallback
    /// without weakening normal login error handling.
    /// </summary>
    private async Task<(HttpStatusCode StatusCode, SyncResultUserAuthentication? Authentication)> Authenticate(
      SyncRequestUserAuthentication request,
      UserAuthenticationRequestType requestType,
      List<HttpStatusCode>? additionalSuccessStatusCodes = null)
    {
      var path = ResolveUserAuthenticationPath(requestType);

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Executing Alison user '{requestType}' for Yoma user '{userId}'", requestType, request.UserId);

      var response = await _options.BaseUrl
        .AppendPathSegment(path)
        .WithAuthHeader(await _alisonAuthService.GetAuthHeader())
        .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds))
        .PostJsonAsync(request.ToUserAuthenticationRequest(requestType))
        .EnsureSuccessStatusCodeAsync(additionalSuccessStatusCodes);

      var statusCode = (HttpStatusCode)response.StatusCode;

      if (statusCode == HttpStatusCode.UnprocessableEntity)
        return (statusCode, null);

      var json = await response.GetStringAsync();

      var responseParsed = JsonConvert.DeserializeObject<UserAuthenticationResponse>(json)
        ?? throw new InvalidOperationException($"Failed to deserialize Alison user {requestType} response");

      return (statusCode, responseParsed.ToSyncResultUserAuthentication(
        _options,
        request,
        request.EntitySyncInfo.ExternalId!,
        requestType));
    }

    private string ResolveUserAuthenticationPath(UserAuthenticationRequestType requestType)
    {
      var path = requestType switch
      {
        UserAuthenticationRequestType.Register => _options.UserRegisterPath,
        UserAuthenticationRequestType.Login => _options.UserLoginPath,
        _ => throw new InvalidOperationException($"Unsupported Alison user authentication request type '{requestType}'")
      };

      path = path?.Trim();

      if (string.IsNullOrWhiteSpace(path))
        throw new InvalidOperationException($"Alison user {requestType} path expected");

      return path;
    }

    private SyncResultPullEntity<Domain.Opportunity.Models.Opportunity> ListFromStore(SyncFilterPullEntity filter)
    {
      ArgumentNullException.ThrowIfNull(filter);

      var query = _opportunityRepository.Query();
      query = query.OrderBy(o => o.ExternalId);

      var result = new SyncResultPullEntity<Domain.Opportunity.Models.Opportunity>();

      if (filter.PaginationEnabled)
      {
        result.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber!.Value - 1) * filter.PageSize!.Value).Take(filter.PageSize.Value);
      }

      result.Items = [.. query.ToList().Select(ToSyncItem)];

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Mapped Alison local catalogue cache to sync result with '{count}' opportunities", result.Items.Count);

      return result;
    }

    private SyncItemEntity<Domain.Opportunity.Models.Opportunity> ToSyncItem(Opportunity item)
    {
      ArgumentNullException.ThrowIfNull(item);

      if (string.IsNullOrWhiteSpace(item.PayloadJson))
        throw new InvalidOperationException($"Alison opportunity cache item '{item.ExternalId}' has no payload JSON");

      var course = JsonConvert.DeserializeObject<Course>(item.PayloadJson)
        ?? throw new InvalidOperationException($"Failed to deserialize Alison course payload for cache item '{item.ExternalId}'");

      var result = ToSyncItem(course, item.Deleted == true);
      result.ExternalId = item.ExternalId;

      return result;
    }

    private SyncItemEntity<Domain.Opportunity.Models.Opportunity> ToSyncItem(Course course, bool deleted)
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
      // Summary is plain text only.
      // Description is converted from Alison HTML to Yoma markdown-style formatting.
      // Description also appends selected Alison metadata such as publisher and course type.
      var publisherName = GetPublisherName(course);
      var title = GetTitle(course);
      var summary = GetSummary(course, title);
      var description = GetDescription(course, title, publisherName);

      // Dates:
      // DateStart = published_at -> created_at -> UtcNow.
      // DateEnd = null/open-ended unless Alison provides expiry/removal semantics.
      var dateStart = course.PublishedAt ?? course.CreatedAt ?? DateTimeOffset.UtcNow;

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
      // Tags are handled separately via Skills using strict matching against Yoma skills.
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

      return new SyncItemEntity<Domain.Opportunity.Models.Opportunity>
      {
        ExternalId = course.Id.ToString(),
        Deleted = deleted,
        Item = new Domain.Opportunity.Models.Opportunity
        {
          Title = title,
          Description = description,
          TypeId = opportunityType.Id,
          Type = opportunityType.Name,
          Summary = summary,
          URL = course.ToCourseUrl(_options.WebBaseUrl),

          OrganizationId = _options.OrganizationIdYoma,
          OrganizationName = _options.OrganizationName,

          DateStart = dateStart,
          DateEnd = null,

          Status = deleted ? Status.Deleted : Status.Active,

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

    private List<Domain.Opportunity.Models.Lookups.OpportunityCategory> GetCategories(Course course)
    {
      ArgumentNullException.ThrowIfNull(course);

      var categories = course.Categories
        .Select(ResolveYomaCategory)
        .DistinctBy(item => item.Id)
        .ToList();

      return categories.Count > 0
        ? categories
        : [_opportunityCategoryService.GetByName(Domain.Opportunity.Category.Other.ToString())];
    }

    private Domain.Opportunity.Models.Lookups.OpportunityCategory ResolveYomaCategory(Models.Category category)
    {
      ArgumentNullException.ThrowIfNull(category);

      if (TryResolveYomaCategoryId(category.Code, out var categoryId))
        return _opportunityCategoryService.GetById(categoryId);

      return _opportunityCategoryService.GetByName(Domain.Opportunity.Category.Other.ToString());
    }

    private static bool TryResolveYomaCategoryId(string? code, out Guid categoryId)
    {
      categoryId = default;

      code = code?.NormalizeNullableValue();
      if (string.IsNullOrWhiteSpace(code)) return false;

      if (TryResolveYomaCategoryIdExact(code, out categoryId))
        return true;

      var rootCode = code
        .Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .FirstOrDefault();

      return TryResolveYomaCategoryIdExact(rootCode, out categoryId);
    }

    private static bool TryResolveYomaCategoryIdExact(string? code, out Guid categoryId)
    {
      categoryId = default;

      if (string.IsNullOrWhiteSpace(code)) return false;

      foreach (var mapping in Categories_Map)
      {
        if (mapping.Value.Any(item => string.Equals(item, code, StringComparison.OrdinalIgnoreCase)))
        {
          categoryId = mapping.Key;
          return true;
        }
      }

      return false;
    }

    private List<Domain.Lookups.Models.Country> GetCountries(Course course)
    {
      ArgumentNullException.ThrowIfNull(course);

      var result = new List<Domain.Lookups.Models.Country>
      {
        _countryService.GetByCodeAlpha2(Country.Worldwide.ToDescription())
      };

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

    private List<Domain.Lookups.Models.Language> GetLanguages(Course course)
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
        : [_languageService.GetByName(Language.English.ToString())];
    }

    private static IEnumerable<string> GetLanguageLocales(Course course)
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

    private static string GetTitle(Course course)
    {
      ArgumentNullException.ThrowIfNull(course);

      var translation = GetPreferredTranslation(course);

      var title = (translation?.Name).HtmlDecode()?.RemoveHtmlTags()
        ?? course.Name.HtmlDecode()?.RemoveHtmlTags();

      if (string.IsNullOrWhiteSpace(title))
        throw new InvalidOperationException($"Alison course title/name expected for course id '{course.Id}'");

      return title.TrimToLengthWithEllipsis(OpportunityService.Title_MaxLength);
    }

    private static string GetSummary(Course course, string title)
    {
      ArgumentNullException.ThrowIfNull(course);

      var translation = GetPreferredTranslation(course);

      var summary = (translation?.Headline).HtmlDecode()?.RemoveHtmlTags()
        ?? (translation?.Summary).HtmlDecode()?.RemoveHtmlTags()
        ?? title;

      return (summary ?? title).TrimToLengthWithEllipsis(OpportunityService.Summary_MaxLength);
    }

    private static string GetDescription(Course course, string title, string? publisherName)
    {
      ArgumentNullException.ThrowIfNull(course);

      var translation = GetPreferredTranslation(course);

      var description = (translation?.Summary).HtmlToMarkdown()
        ?? course.Modules.FirstOrDefault(module => !string.IsNullOrWhiteSpace(module.Description))?.Description.HtmlToMarkdown()
        ?? (translation?.Headline).HtmlToMarkdown()
        ?? title;

      var metadata = new List<string>();

      if (!string.IsNullOrWhiteSpace(publisherName))
        metadata.Add($"**Publisher:** {publisherName}");

      var courseType = course.Type.HtmlDecode()?.RemoveHtmlTags();
      if (!string.IsNullOrWhiteSpace(courseType))
        metadata.Add($"**Course type:** {courseType.TitleCase()}");

      if (metadata.Count > 0)
        description = $"{description}{StringExtensions.MarkdownParagraphBreak}{string.Join("\n", metadata)}";

      return description.NormalizeTrimMultiline();
    }

    private static string? GetPublisherName(Course course)
    {
      ArgumentNullException.ThrowIfNull(course);

      return course.Publishers
        .Select(item => item.Name.HtmlDecode()?.RemoveHtmlTags())
        .FirstOrDefault(item => !string.IsNullOrWhiteSpace(item));
    }

    private static CourseTranslation? GetPreferredTranslation(Course course)
    {
      ArgumentNullException.ThrowIfNull(course);

      // Prefer English as the canonical Yoma opportunity content source.
      // If English is not available, fallback to the first listed Alison translation.
      return course.Translations.FirstOrDefault(item =>
          string.Equals(NormalizeLanguageCodeAlpha2(item.Locale), "EN", StringComparison.OrdinalIgnoreCase))
        ?? course.Translations.FirstOrDefault();
    }

    private static List<string>? GetKeywords(Course course, string? publisherName)
    {
      ArgumentNullException.ThrowIfNull(course);

      var result = new List<string>();

      foreach (var keyword in GetKeywordCandidates(course, publisherName))
        AddKeyword(result, keyword);

      return result.Count == 0 ? null : result;
    }

    private static IEnumerable<string?> GetKeywordCandidates(Course course, string? publisherName)
    {
      yield return publisherName;
      yield return course.Type;
    }

    private static void AddKeyword(List<string> keywords, string? value)
    {
      value = value.HtmlDecode()?.RemoveHtmlTags();
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

    private List<Domain.Lookups.Models.Skill>? GetSkills(Course course)
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

    private Domain.Lookups.Models.Skill? ResolveSkill(Tag tag)
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

    private Domain.Opportunity.Models.Lookups.OpportunityDifficulty GetDifficulty(Course course)
    {
      ArgumentNullException.ThrowIfNull(course);

      var difficultyId = ResolveDifficultyIdOrNull(course.CourseLevel);

      return difficultyId.HasValue
        ? _opportunityDifficultyService.GetById(difficultyId.Value)
        : _opportunityDifficultyService.GetByName(Difficulty.AnyLevel.ToDescription());
    }

    private static Guid? ResolveDifficultyIdOrNull(string? courseLevel)
    {
      courseLevel = courseLevel?.NormalizeNullableValue();

      if (string.IsNullOrWhiteSpace(courseLevel))
        return null;

      foreach (var mapping in Difficulty_Map)
      {
        if (mapping.Value.Any(item => string.Equals(item, courseLevel, StringComparison.OrdinalIgnoreCase)))
          return mapping.Key;
      }

      return null;
    }

    private (Domain.Lookups.Models.TimeInterval Interval, short Count) GetCommitment(Course course)
    {
      ArgumentNullException.ThrowIfNull(course);

      return GetCommitment(course.DurationAvg);
    }

    private (Domain.Lookups.Models.TimeInterval Interval, short Count) GetCommitment(string? durationAvg)
    {
      var intervalName = ResolveCommitmentIntervalName(durationAvg);
      var interval = _timeIntervalService.GetByName(intervalName);
      var count = ResolveCommitmentIntervalCount(durationAvg);

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
      if (upperBound > short.MaxValue)
        return short.MaxValue;

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

    private SyncResultPullVerification ListCompletedCoursesFromEmbeddedResource(SyncFilterPullVerification filter)
    {
      ArgumentNullException.ThrowIfNull(filter);

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation(
          "Partner synchronization from external partners disabled for environment '{environment}'. Using local .NET embedded Alison completed courses resource",
          _environmentProvider.Environment);

      var completedCourses = LoadEmbeddedCompletedCourses();

      var dateEnd = filter.DateEnd ?? DateTimeOffset.UtcNow;

      // Embedded completed-course data is only used when partner sync is disabled.
      // Always return the embedded completed records so local/dev validation does not depend
      // on deployment time, scheduler timing, or checkpoint windows.
      var query = completedCourses
        .Where(item => item.CompletedAt.HasValue)
        .OrderBy(item => item.CompletedAt)
        .ThenBy(item => item.UserId)
        .ThenBy(item => item.CourseId)
        .ToList();

      var result = new SyncResultPullVerification
      {
        TotalCount = query.Count
      };

      if (filter.PaginationEnabled)
        query = [.. query.Skip((filter.PageNumber!.Value - 1) * filter.PageSize!.Value).Take(filter.PageSize.Value)];

      result.Items = [.. query.Select(ToSyncItem)];

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Mapped Alison embedded completed courses payload to verification sync result with '{count}' items", result.Items.Count);

      return result;
    }

    private async Task<SyncResultPullVerification> ListCompletedCoursesFromApi(SyncFilterPullVerification filter)
    {
      ArgumentNullException.ThrowIfNull(filter);

      var pageNumber = filter.PageNumber!.Value;
      var requestedPageSize = filter.PageSize!.Value;
      var providerPageSize = Math.Min(requestedPageSize, Constants.PageSize_Maximum);
      var hours = ResolveHours(filter.DateStart, filter.DateEnd);

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug(
          "Requesting Alison completed courses from '{path}' with page '{pageNumber}', perPage '{pageSize}', hours '{hours}'",
          _options.CompletedDataPath, pageNumber, providerPageSize, hours);

      var response = await GetCompletedCoursesPage(pageNumber, providerPageSize, hours);

      var result = new SyncResultPullVerification
      {
        TotalCount = response.Meta?.Total,
        Items = [.. response.Data.Select(ToSyncItem)]
      };

      if (!result.TotalCount.HasValue)
        throw new InvalidOperationException("Alison completed courses response did not contain pagination total");

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Mapped Alison completed courses API response to verification sync result with '{count}' items", result.Items.Count);

      return result;
    }

    private List<CompletedCourse> LoadEmbeddedCompletedCourses()
    {
      if (string.IsNullOrWhiteSpace(_options.CompletedCoursesEmbeddedResourceName))
        throw new InvalidOperationException("Alison completed courses embedded resource name is required");

      var assembly = typeof(AlisonClient).Assembly;
      var assemblyName = assembly.GetName().Name;

      var resourceName = $"{assemblyName}.{_options.CompletedCoursesEmbeddedResourceName.Trim()}";

      using var resourceStream = assembly.GetManifestResourceStream(resourceName)
        ?? throw new InvalidOperationException($"Embedded Alison completed courses sample resource '{resourceName}' not found. Ensure file is added to the project, marked as Embedded Resource, and compiled into the assembly");

      using var reader = new StreamReader(resourceStream);
      var json = reader.ReadToEnd();

      if (string.IsNullOrWhiteSpace(json))
        return [];

      var response = JsonConvert.DeserializeObject<Response<CompletedCourse>>(json)
        ?? throw new InvalidOperationException("Failed to deserialize embedded Alison completed courses sample JSON");

      return response.Data;
    }

    private async Task<Response<CompletedCourse>> GetCompletedCoursesPage(int pageNumber, int pageSize, int hours)
    {
      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug(
          "Requesting Alison completed courses from '{path}' with page '{page}' and perPage '{perPage}' and hours '{hours}'",
          _options.CompletedDataPath, pageNumber, pageSize, hours);

      return await _options.BaseUrl
        .AppendPathSegment(_options.CompletedDataPath)
        .SetQueryParam(Constants.QueryParameter_Page, pageNumber)
        .SetQueryParam(Constants.QueryParameter_PerPage, pageSize)
        .SetQueryParam(Constants.QueryParameter_Hours, hours)
        .WithAuthHeader(await _alisonAuthService.GetAuthHeader())
        .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds))
        .GetAsync()
        .EnsureSuccessStatusCodeAsync()
        .ReceiveJson<Response<CompletedCourse>>();
    }

    private SyncItemVerification ToSyncItem(CompletedCourse item)
    {
      ArgumentNullException.ThrowIfNull(item);

      if (item.UserId <= 0)
        throw new InvalidOperationException("Alison completed course user id expected");

      if (item.CourseId <= 0)
        throw new InvalidOperationException("Alison completed course id expected");

      var commitmentInterval = GetVerificationCommitmentInterval(item);
      var dateEnd = item.CompletedAt ?? item.LastAccess ?? item.UpdatedAt;
      var completed = string.Equals(item.CourseStatus?.Trim(), "Completed", StringComparison.OrdinalIgnoreCase);

      return new SyncItemVerification
      {
        UserExternalId = item.UserId.ToString(),
        EntityExternalId = item.CourseId.ToString(),
        UserEmail = item.Email,
        UserPhoneNumber = null,

        // Commitment is resolved in this order:
        // 1. duration_avg: preferred, aligns verification with the imported opportunity commitment.
        // 2. total_time_spent: fallback only, as Alison can return values that exceed the course estimate.
        // 3. first_access/enrollment/created dates: final fallback only when no commitment can be resolved.
        CommitmentInterval = commitmentInterval,
        DateStart = commitmentInterval == null ? item.FirstAccess ?? item.EnrollmentDate ?? item.CreatedAt : null,
        DateEnd = dateEnd,
        DateCompleted = completed ? item.CompletedAt ?? dateEnd : null,
        Completed = completed
      };
    }

    private SyncItemVerificationCommitmentInterval? GetVerificationCommitmentInterval(CompletedCourse item)
    {
      ArgumentNullException.ThrowIfNull(item);

      if (!string.IsNullOrWhiteSpace(item.DurationAvg))
      {
        var (interval, count) = GetCommitment(item.DurationAvg);

        return new SyncItemVerificationCommitmentInterval
        {
          Id = interval.Id,
          Count = count
        };
      }

      return GetVerificationCommitmentIntervalFromTotalTimeSpent(item.TotalTimeSpent);
    }

    private SyncItemVerificationCommitmentInterval? GetVerificationCommitmentIntervalFromTotalTimeSpent(string? totalTimeSpent)
    {
      totalTimeSpent = totalTimeSpent?.Trim();

      if (string.IsNullOrWhiteSpace(totalTimeSpent))
        return null;

      if (!TimeSpan.TryParse(totalTimeSpent, CultureInfo.InvariantCulture, out var value))
        return null;

      if (value <= TimeSpan.Zero)
        return null;

      var interval = _timeIntervalService.GetByName(TimeIntervalOption.Hour.ToString());
      var count = (short)Math.Clamp((int)Math.Ceiling(value.TotalHours), 1, short.MaxValue);

      return new SyncItemVerificationCommitmentInterval
      {
        Id = interval.Id,
        Count = count
      };
    }

    private static int ResolveHours(DateTimeOffset dateStart, DateTimeOffset? dateEnd)
    {
      var resolvedDateEnd = dateEnd ?? DateTimeOffset.UtcNow;
      var totalHours = (resolvedDateEnd - dateStart).TotalHours;

      return Math.Max(1, (int)Math.Ceiling(totalHours));
    }

    [System.Text.RegularExpressions.GeneratedRegex(@"\d+(\.\d+)?")]
    private static partial System.Text.RegularExpressions.Regex Regex_CommitmentIntervalCountValue();
    #endregion
  }
}
