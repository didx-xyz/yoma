using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.PartnerSync.Validators;
using Yoma.Core.Infrastructure.IXO.PartnerSync.Interfaces;
using Yoma.Core.Infrastructure.IXO.PartnerSync.Models;

namespace Yoma.Core.Infrastructure.IXO.PartnerSync.Client
{
  public sealed partial class IXOClient :
    ISyncProviderClientPullEntity<Domain.Opportunity.Models.Opportunity>,
    ISyncProviderClientPullVerification,
    ISyncProviderClientUserAuthentication
  {
    #region Class Variables
    private static readonly Dictionary<Guid, string[]> CategoryMappings = new()
    {
      // Career and Personal Development
      { new Guid("89f4ab46-0767-494f-a18c-3037f698133a"), ["Education", "Social impact"] },
      // Business and Entrepreneurship
      { new Guid("c76786fd-fca9-4633-85b3-11e53486d708"), ["Green entrepreneurship"] },
      // Environment and Climate
      { new Guid("d0d322ab-d1d7-44b6-94e8-7b85246aa42e"), ["Circular economy", "Environment & Climate"] },
      // Technology and Digitization
      { new Guid("fa564c1c-591a-4a6d-8294-20165da8866b"), ["Digital services"] }
    };

    private readonly ILogger<IXOClient> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly AppSettings _appSettings;
    private readonly IXOPartnerSyncOptions _options;
    private readonly IRepositoryBatched<Opportunity> _opportunityRepository;
    private readonly IOpportunityTypeService _opportunityTypeService;
    private readonly IOpportunityCategoryService _opportunityCategoryService;
    private readonly ICountryService _countryService;
    private readonly ILanguageService _languageService;
    private readonly ISkillService _skillService;
    private readonly IOpportunityDifficultyService _opportunityDifficultyService;
    private readonly ITimeIntervalService _timeIntervalService;
    private readonly IEngagementTypeService _engagementTypeService;
    private readonly IIXOAuthService _ixoAuthService;
    private readonly SyncFilterPullEntityValidator _syncFilterPullEntityValidator;
    private readonly SyncFilterPullVerificationValidator _syncFilterPullVerificationValidator;
    #endregion

    #region Constructor
    public IXOClient(
      ILogger<IXOClient> logger,
      IEnvironmentProvider environmentProvider,
      IOptions<AppSettings> appSettings,
      IOptions<IXOPartnerSyncOptions> options,
      IRepositoryBatched<Opportunity> opportunityRepository,
      IOpportunityTypeService opportunityTypeService,
      IOpportunityCategoryService opportunityCategoryService,
      ICountryService countryService,
      ILanguageService languageService,
      ISkillService skillService,
      IOpportunityDifficultyService opportunityDifficultyService,
      ITimeIntervalService timeIntervalService,
      IEngagementTypeService engagementTypeService,
      IIXOAuthService ixoAuthService,
      SyncFilterPullEntityValidator syncFilterPullEntityValidator,
      SyncFilterPullVerificationValidator syncFilterPullVerificationValidator)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _environmentProvider = environmentProvider ?? throw new ArgumentNullException(nameof(environmentProvider));
      _appSettings = appSettings.Value ?? throw new ArgumentNullException(nameof(appSettings));
      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
      _opportunityRepository = opportunityRepository ?? throw new ArgumentNullException(nameof(opportunityRepository));
      _opportunityTypeService = opportunityTypeService ?? throw new ArgumentNullException(nameof(opportunityTypeService));
      _opportunityCategoryService = opportunityCategoryService ?? throw new ArgumentNullException(nameof(opportunityCategoryService));
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
      _languageService = languageService ?? throw new ArgumentNullException(nameof(languageService));
      _skillService = skillService ?? throw new ArgumentNullException(nameof(skillService));
      _opportunityDifficultyService = opportunityDifficultyService ?? throw new ArgumentNullException(nameof(opportunityDifficultyService));
      _timeIntervalService = timeIntervalService ?? throw new ArgumentNullException(nameof(timeIntervalService));
      _engagementTypeService = engagementTypeService ?? throw new ArgumentNullException(nameof(engagementTypeService));
      _ixoAuthService = ixoAuthService ?? throw new ArgumentNullException(nameof(ixoAuthService));
      _syncFilterPullEntityValidator = syncFilterPullEntityValidator ?? throw new ArgumentNullException(nameof(syncFilterPullEntityValidator));
      _syncFilterPullVerificationValidator = syncFilterPullVerificationValidator ?? throw new ArgumentNullException(nameof(syncFilterPullVerificationValidator));
    }
    #endregion

    #region Public Members
    public Task<SyncResultPullEntity<Domain.Opportunity.Models.Opportunity>> List(SyncFilterPullEntity filter)
    {
      ArgumentNullException.ThrowIfNull(filter);
      _syncFilterPullEntityValidator.ValidateAndThrow(filter);

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug(
          "Listing IXO opportunity sync items from local catalogue: environment '{environment}', page number '{pageNumber}', page size '{pageSize}'",
          _environmentProvider.Environment, filter.PageNumber, filter.PageSize);

      IQueryable<Opportunity> query = _opportunityRepository.Query().OrderBy(o => o.ExternalId);
      var result = new SyncResultPullEntity<Domain.Opportunity.Models.Opportunity>();

      if (filter.PaginationEnabled)
      {
        result.TotalCount = query.Count();
        query = query
          .Skip((filter.PageNumber!.Value - 1) * filter.PageSize!.Value)
          .Take(filter.PageSize.Value);
      }

      result.Items = [.. query.ToList().Select(ToSyncItem)];

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Mapped IXO local catalogue to opportunity sync result with '{count}' items", result.Items.Count);

      return Task.FromResult(result);
    }

    public async Task<SyncResultPullVerification> List(SyncFilterPullVerification filter)
    {
      ArgumentNullException.ThrowIfNull(filter);
      _syncFilterPullVerificationValidator.ValidateAndThrow(filter);

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug(
          "Listing IXO verification sync items for environment '{environment}' from '{dateStart}' to '{dateEnd}', page number '{pageNumber}', page size '{pageSize}'",
          _environmentProvider.Environment, filter.DateStart, filter.DateEnd, filter.PageNumber, filter.PageSize);

      if (!_appSettings.PartnerSyncEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
        return ListVerificationsFromEmbeddedResource(filter);

      return await ListVerificationsFromApi(filter);
    }

    public async Task<SyncResultUserAuthentication> Authenticate(SyncRequestUserAuthentication request)
    {
      ArgumentNullException.ThrowIfNull(request);
      ValidateUserAccessRequest(request);

      if (!_appSettings.PartnerSyncEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
      {
        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation(
            "Partner synchronization from external partners disabled for environment '{environment}'. Returning default IXO navigation URL for Yoma user '{userId}'",
            _environmentProvider.Environment, request.UserId);

        return new SyncResultUserAuthentication
        {
          URL = request.EntitySyncInfo.URL!,
          UserSyncInfo = new SyncInfoUserPartner
          {
            Partner = SyncPartner.IXO,
            ExternalId = request.UserSyncInfo?.ExternalId ?? $"mock-ixo-user-{request.UserId}",
            DateLastRedirect = DateTimeOffset.UtcNow
          }
        };
      }

      return await AuthenticateFromApi(request);
    }
    #endregion
  }
}
