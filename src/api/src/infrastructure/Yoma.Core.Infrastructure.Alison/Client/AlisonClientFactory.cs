using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Validators;
using Yoma.Core.Infrastructure.Alison.Interfaces;
using Yoma.Core.Infrastructure.Alison.Models;

namespace Yoma.Core.Infrastructure.Alison.Client
{
  public sealed class AlisonClientFactory :
    ISyncProviderClientFactory<ISyncProviderClientPullEntity<Domain.Opportunity.Models.OpportunityRequestCreate>>,
    ISyncProviderClientFactory<ISyncProviderClientPullVerification>,
    ISyncProviderClientFactory<ISyncProviderClientUserAuthentication>
  {
    #region Class Variables
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
    public AlisonClientFactory(
      ILogger<AlisonClient> logger,
      IEnvironmentProvider environmentProvider,
      IOptions<AppSettings> appSettings,
      IOptions<AlisonOptions> options,
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
      _alisonAuthService = alisonAuthService ?? throw new ArgumentNullException(nameof(alisonAuthService));
      _syncFilterPullEntityValidator = syncFilterPullEntityValidator ?? throw new ArgumentNullException(nameof(syncFilterPullEntityValidator));
      _syncFilterPullVerificationValidator = syncFilterPullVerificationValidator ?? throw new ArgumentNullException(nameof(syncFilterPullVerificationValidator));
    }
    #endregion

    #region Public Members
    ISyncProviderClientPullEntity<Domain.Opportunity.Models.OpportunityRequestCreate> ISyncProviderClientFactory<ISyncProviderClientPullEntity<Domain.Opportunity.Models.OpportunityRequestCreate>>.CreateClient()
    {
      return CreateClient();
    }

    ISyncProviderClientPullVerification ISyncProviderClientFactory<ISyncProviderClientPullVerification>.CreateClient()
    {
      return CreateClient();
    }

    ISyncProviderClientUserAuthentication ISyncProviderClientFactory<ISyncProviderClientUserAuthentication>.CreateClient()
    {
      return CreateClient();
    }
    #endregion

    #region Private Members
    private AlisonClient CreateClient()
    {
      return new AlisonClient(
        _logger,
        _environmentProvider,
        _appSettings,
        _options,
        _opportunityRepository,
        _opportunityTypeService,
        _opportunityCategoryService,
        _countryService,
        _languageService,
        _skillService,
        _opportunityDifficultyService,
        _timeIntervalService,
        _engagementTypeService,
        _alisonAuthService,
        _syncFilterPullEntityValidator,
        _syncFilterPullVerificationValidator);
    }
    #endregion
  }
}
