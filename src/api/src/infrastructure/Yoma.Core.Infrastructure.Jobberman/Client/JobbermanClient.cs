using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.PartnerSync.Validators;
using Yoma.Core.Infrastructure.Jobberman.Models;

namespace Yoma.Core.Infrastructure.Jobberman.Client
{
  public sealed class JobbermanClient : ISyncProviderClientPull<Domain.Opportunity.Models.Opportunity>
  {
    #region Class Variables
    private readonly ILogger<JobbermanClient> _logger;
    private readonly JobbermanOptions _options;
    private readonly IOpportunityTypeService _opportunityTypeService;
    private readonly IOpportunityCategoryService _opportunityCategoryService;
    private readonly ICountryService _countryService;
    private readonly ILanguageService _languageService;
    private readonly IRepositoryBatched<Opportunity> _opportunityRepository;

    private readonly SyncFilterPullValidator _syncFilterPullValidator;
    #endregion

    #region Constructor
    public JobbermanClient(
      ILogger<JobbermanClient> logger,
      IOptions<JobbermanOptions> options,
      IOpportunityTypeService opportunityTypeService,
      IOpportunityCategoryService opportunityCategoryService,
      ICountryService countryService,
      ILanguageService languageService,
      IRepositoryBatched<Opportunity> opportunityRepository,
      SyncFilterPullValidator syncFilterPullValidator)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
      _opportunityTypeService = opportunityTypeService ?? throw new ArgumentNullException(nameof(opportunityTypeService));
      _opportunityCategoryService = opportunityCategoryService ?? throw new ArgumentNullException(nameof(opportunityCategoryService));
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
      _languageService = languageService ?? throw new ArgumentNullException(nameof(languageService));
      _opportunityRepository = opportunityRepository ?? throw new ArgumentNullException(nameof(opportunityRepository));
      _syncFilterPullValidator = syncFilterPullValidator ?? throw new ArgumentNullException(nameof(syncFilterPullValidator));
    }
    #endregion

    #region Public Members
    public Task<SyncResultPull<Domain.Opportunity.Models.Opportunity>> List(SyncFilterPull filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      // Validates the pull sync pagination contract: pagination must be enabled,
      // and page number / page size must be set correctly.
      _syncFilterPullValidator.ValidateAndThrow(filter);

      // PartnerSyncEnabledEnvironmentsAsEnum is handled by the Jobberman feed background service.
      // When external partner sync is disabled for the current environment, the background service
      // syncs from local .NET embedded resources instead of the actual partner feeds.
      // This client only pages and returns the locally cached Jobberman opportunities as requested.

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation(
          "Listing Jobberman opportunities for pull sync: PaginationEnabled={PaginationEnabled}, PageNumber={PageNumber}, PageSize={PageSize}",
          filter.PaginationEnabled, filter.PageNumber, filter.PageSize);

      var query = _opportunityRepository.Query();
      query = query.OrderBy(o => o.ExternalId);

      var result = new SyncResultPull<Domain.Opportunity.Models.Opportunity>();

      if (filter.PaginationEnabled)
      {
        result.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      result.Items = [.. query.ToList().Select(ToOpportunity)];

      return Task.FromResult(result);
    }
    #endregion

    #region Private Members
    private SyncItem<Domain.Opportunity.Models.Opportunity> ToOpportunity(Opportunity item)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      var opportunityType = _opportunityTypeService.GetByName(Domain.Opportunity.Type.Job.ToString());

      var categoryName = string.IsNullOrEmpty(item.Category) ? Category.Other.ToString() : item.Category.Trim();
      var category = _opportunityCategoryService.GetByName(categoryName);

      var country = _countryService.GetByCodeAlpha2(item.CountryCodeAlpha2);

      //TODO: Confirm language mapping with Jobberman. Current RSS sample does not include this field.
      //Defaulting to English for now.
      var languageName = string.IsNullOrEmpty(item.Language) ? Language.English.ToString() : item.Language.Trim();
      var language = _languageService.GetByName(languageName);

      var feed = _options.Feeds.SingleOrDefault(o => string.Equals(o.CountryCodeAlpha2, item.CountryCodeAlpha2, StringComparison.OrdinalIgnoreCase))
        ?? throw new InvalidOperationException($"Jobberman feed configuration for country '{item.CountryCodeAlpha2}' not found");

      var opportunity = new Domain.Opportunity.Models.Opportunity
      {
        Title = item.Title,
        Description = string.IsNullOrEmpty(item.Description) ? item.Title : item.Description,
        TypeId = opportunityType.Id,
        Type = opportunityType.Name,
        OrganizationId = feed.OrganizationIdYoma,
        Summary = item.Title,
        URL = item.URL,
        VerificationEnabled = false,
        Status = item.Deleted == true ? Status.Deleted : Status.Active,
        Keywords = BuildKeywords(item, categoryName),

        //TODO: Confirm DateStart mapping with Jobberman. Current RSS sample does not include publish/created/posted date.
        //Defaulting to the cached row creation date for now because Yoma requires a non-null DateStart.
        DateStart = item.DateStart ?? item.DateCreated,
        DateEnd = item.DateEnd,

        Featured = false,
        Hidden = false,
        Published = true,
        Categories = [category],
        Countries = [country],
        Languages = [language]
        //ExternalId: Opportunity.ExternalId is used by CSV imports; pull synchronization must set the external identifier on the SyncItem
      };

      return new SyncItem<Domain.Opportunity.Models.Opportunity>
      {
        ExternalId = item.ExternalId,
        Deleted = item.Deleted == true,
        Item = opportunity
      };
    }

    private static List<string>? BuildKeywords(Opportunity item, string category)
    {
      var results = new[]
      {
        Domain.Opportunity.Type.Job.ToString(),
        item.WorkType,
        category
      }
      .Where(o => !string.IsNullOrEmpty(o))
      .Select(o => o!.Trim())
      .Distinct(StringComparer.OrdinalIgnoreCase)
      .ToList();

      return results.Count == 0 ? null : results;
    }
    #endregion
  }
}
