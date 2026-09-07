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
using Yoma.Core.Infrastructure.Umuzi.Interfaces;
using Yoma.Core.Infrastructure.Umuzi.Models;

namespace Yoma.Core.Infrastructure.Umuzi.Client
{
  /// <summary>
  /// Phase-one Umuzi integration: pull the shared opportunity catalogue and participant
  /// verifications, with a correlation-only redirect for signed-in Yoma users.
  /// </summary>
  /// <remarks>
  /// Umuzi agreed to sandbox these opportunities for Yoma, retain the supplied Yoma user id
  /// against the participant, and return only verifications for those Yoma-originated users.
  /// Full learner pre-authentication was explicitly deferred, not omitted accidentally.
  /// Phase two, subject to a separately agreed scope and API contract, may add account
  /// provisioning/linking and a short-lived auto-login hand-off with a stable Umuzi user id.
  /// Broader onboarding of Umuzi learners outside the shared catalogue is a separate capability.
  /// </remarks>
  public sealed partial class UmuziClient :
    ISyncProviderClientPullEntity<Domain.Opportunity.Models.Opportunity>,
    ISyncProviderClientPullVerification,
    ISyncProviderClientUserAuthentication
  {
    #region Class Variables
    private static readonly Dictionary<Guid, string[]> CategoryMappings = [];

    private readonly ILogger<UmuziClient> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly AppSettings _appSettings;
    private readonly UmuziOptions _options;
    private readonly IRepositoryBatched<Opportunity> _opportunityRepository;
    private readonly IOpportunityTypeService _opportunityTypeService;
    private readonly IOpportunityCategoryService _opportunityCategoryService;
    private readonly ICountryService _countryService;
    private readonly ILanguageService _languageService;
    private readonly ISkillService _skillService;
    private readonly IOpportunityDifficultyService _opportunityDifficultyService;
    private readonly ITimeIntervalService _timeIntervalService;
    private readonly IEngagementTypeService _engagementTypeService;
    private readonly IUmuziAuthService _umuziAuthService;
    private readonly SyncFilterPullEntityValidator _syncFilterPullEntityValidator;
    private readonly SyncFilterPullVerificationValidator _syncFilterPullVerificationValidator;
    #endregion

    #region Constructor
    public UmuziClient(
      ILogger<UmuziClient> logger,
      IEnvironmentProvider environmentProvider,
      IOptions<AppSettings> appSettings,
      IOptions<UmuziOptions> options,
      IRepositoryBatched<Opportunity> opportunityRepository,
      IOpportunityTypeService opportunityTypeService,
      IOpportunityCategoryService opportunityCategoryService,
      ICountryService countryService,
      ILanguageService languageService,
      ISkillService skillService,
      IOpportunityDifficultyService opportunityDifficultyService,
      ITimeIntervalService timeIntervalService,
      IEngagementTypeService engagementTypeService,
      IUmuziAuthService umuziAuthService,
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
      _umuziAuthService = umuziAuthService ?? throw new ArgumentNullException(nameof(umuziAuthService));
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
          "Listing Umuzi opportunity sync items from local catalogue: environment '{environment}', page number '{pageNumber}', page size '{pageSize}'",
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
        _logger.LogDebug("Mapped Umuzi local catalogue to opportunity sync result with '{count}' items", result.Items.Count);

      return Task.FromResult(result);
    }

    public async Task<SyncResultPullVerification> List(SyncFilterPullVerification filter)
    {
      ArgumentNullException.ThrowIfNull(filter);
      _syncFilterPullVerificationValidator.ValidateAndThrow(filter);

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug(
          "Listing Umuzi verification sync items for environment '{environment}' from '{dateStart}' to '{dateEnd}', page number '{pageNumber}', page size '{pageSize}'",
          _environmentProvider.Environment, filter.DateStart, filter.DateEnd, filter.PageNumber, filter.PageSize);

      if (!_appSettings.IsPartnerSyncEnabled(SyncPartner.Umuzi, _environmentProvider.Environment))
        return ListVerificationsFromEmbeddedResource(filter);

      return await ListVerificationsFromApi(filter);
    }

    /// <summary>
    /// Uses the existing authentication extension point to append the Yoma user id only.
    /// Does not create an Umuzi account, sign the learner in, or establish a partner-user link.
    /// </summary>
    /// <remarks>
    /// The query parameter is mutable correlation data, not proof of identity or origin.
    /// Phase one therefore depends on Umuzi's agreed sandboxed-participant controls.
    /// A future phase-two pre-authentication endpoint can replace this hand-off after its
    /// contract is agreed; no token or partner identity is fabricated in the meantime.
    /// </remarks>
    public Task<SyncResultUserAuthentication> Authenticate(SyncRequestUserAuthentication request)
    {
      ArgumentNullException.ThrowIfNull(request);
      ArgumentNullException.ThrowIfNull(request.EntitySyncInfo);
      if (request.EntitySyncInfo.Partner != SyncPartner.Umuzi || request.UserId == Guid.Empty)
        throw new InvalidOperationException("Umuzi navigation requires a valid Yoma user and Umuzi opportunity");
      if (!Uri.TryCreate(request.EntitySyncInfo.URL, UriKind.Absolute, out var uri) ||
          (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp))
        throw new InvalidOperationException("Umuzi navigation requires an absolute HTTP(S) URL");
      if (string.IsNullOrWhiteSpace(_options.UserIdQueryParameter))
        throw new InvalidOperationException("Umuzi user-id query parameter is required");

      // Phase one reuses the navigation extension point but does not authenticate or create
      // an account at Umuzi. Only the correlation id is shared. Umuzi must restrict these
      // opportunities to the agreed Yoma cohort; this query parameter is not proof of identity.
      // Do not invent a partner-user link: no partner user id is returned in this flow.
      var url = new Flurl.Url(uri.AbsoluteUri)
        .SetQueryParam(_options.UserIdQueryParameter.Trim(), request.UserId.ToString("D"));
      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("Prepared Umuzi correlation redirect for opportunity '{externalId}'", request.EntitySyncInfo.ExternalId);
      return Task.FromResult(new SyncResultUserAuthentication { URL = url.ToString() });
    }
    #endregion
  }
}
