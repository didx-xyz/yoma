using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Transactions;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.EmailProvider;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Domain.EmailProvider.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.IdentityProvider.Extensions;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Helpers;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Events;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Validators;
using Yoma.Core.Domain.PartnerSharing.Interfaces;

namespace Yoma.Core.Domain.Opportunity.Services
{
  public class OpportunityService : IOpportunityService
  {
    #region Class Variables
    private readonly ILogger<OpportunityService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private readonly IOpportunityStatusService _opportunityStatusService;
    private readonly IOpportunityCategoryService _opportunityCategoryService;
    private readonly ICountryService _countryService;
    private readonly IOrganizationService _organizationService;
    private readonly IOrganizationStatusService _organizationStatusService;
    private readonly IOpportunityTypeService _opportunityTypeService;
    private readonly ILanguageService _languageService;
    private readonly ISkillService _skillService;
    private readonly IOpportunityDifficultyService _opportunityDifficultyService;
    private readonly IEngagementTypeService _engagementTypeService;
    private readonly IOpportunityVerificationTypeService _opportunityVerificationTypeService;
    private readonly ITimeIntervalService _timeIntervalService;
    private readonly IBlobService _blobService;
    private readonly IUserService _userService;
    private readonly IEmailURLFactory _emailURLFactory;
    private readonly IEmailPreferenceFilterService _emailPreferenceFilterService;
    private readonly IEmailProviderClient _emailProviderClient;
    private readonly IIdentityProviderClient _identityProviderClient;
    private readonly ISharingInfoService _sharingInfoService;

    private readonly OpportunityRequestValidatorCreate _opportunityRequestValidatorCreate;
    private readonly OpportunityRequestValidatorUpdate _opportunityRequestValidatorUpdate;
    private readonly OpportunitySearchFilterValidator _opportunitySearchFilterValidator;
    private readonly OpportunitySearchFilterCriteriaValidator _opportunitySearchFilterCriteriaValidator;

    private readonly IMediator _mediator;

    private readonly IRepositoryBatchedValueContainsWithNavigation<Models.Opportunity> _opportunityRepository;
    private readonly IRepository<OpportunityCategory> _opportunityCategoryRepository;
    private readonly IRepository<OpportunityCountry> _opportunityCountryRepository;
    private readonly IRepository<OpportunityLanguage> _opportunityLanguageRepository;
    private readonly IRepository<OpportunitySkill> _opportunitySkillRepository;
    private readonly IRepository<OpportunityVerificationType> _opportunityVerificationTypeRepository;

    private readonly IExecutionStrategyService _executionStrategyService;

    public const string Keywords_Separator = ",";
    public const int Keywords_CombinedMaxLength = 500;
    private static readonly Status[] Statuses_Updatable = [Status.Active, Status.Inactive];
    private static readonly Status[] Statuses_Activatable = [Status.Inactive];
    private static readonly Status[] Statuses_CanDelete = [Status.Active, Status.Inactive];
    private static readonly Status[] Statuses_DeActivatable = [Status.Active, Status.Expired];
    #endregion

    #region Constructor
    public OpportunityService(ILogger<OpportunityService> logger,
        IOptions<AppSettings> appSettings,
        IHttpContextAccessor httpContextAccessor,
        IOpportunityStatusService opportunityStatusService,
        IOpportunityCategoryService opportunityCategoryService,
        ICountryService countryService,
        IOrganizationService organizationService,
        IOrganizationStatusService organizationStatusService,
        IOpportunityTypeService opportunityTypeService,
        ILanguageService languageService,
        ISkillService skillService,
        IOpportunityDifficultyService opportunityDifficultyService,
        IEngagementTypeService engagementTypeService,
        IOpportunityVerificationTypeService opportunityVerificationTypeService,
        ITimeIntervalService timeIntervalService,
        IBlobService blobService,
        IUserService userService,
        IEmailURLFactory emailURLFactory,
        IEmailPreferenceFilterService emailPreferenceFilterService,
        IEmailProviderClientFactory emailProviderClientFactory,
        IIdentityProviderClientFactory identityProviderClientFactory,
        ISharingInfoService sharingInfoService,
        OpportunityRequestValidatorCreate opportunityRequestValidatorCreate,
        OpportunityRequestValidatorUpdate opportunityRequestValidatorUpdate,
        OpportunitySearchFilterValidator opportunitySearchFilterValidator,
        OpportunitySearchFilterCriteriaValidator opportunitySearchFilterCriteriaValidator,
        IMediator mediator,
        IRepositoryBatchedValueContainsWithNavigation<Models.Opportunity> opportunityRepository,
        IRepository<OpportunityCategory> opportunityCategoryRepository,
        IRepository<OpportunityCountry> opportunityCountryRepository,
        IRepository<OpportunityLanguage> opportunityLanguageRepository,
        IRepository<OpportunitySkill> opportunitySkillRepository,
        IRepository<OpportunityVerificationType> opportunityVerificationTypeRepository,
        IExecutionStrategyService executionStrategyService)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _httpContextAccessor = httpContextAccessor;

      _opportunityStatusService = opportunityStatusService;
      _opportunityCategoryService = opportunityCategoryService;
      _countryService = countryService;
      _organizationService = organizationService;
      _organizationStatusService = organizationStatusService;
      _opportunityTypeService = opportunityTypeService;
      _languageService = languageService;
      _skillService = skillService;
      _opportunityDifficultyService = opportunityDifficultyService;
      _engagementTypeService = engagementTypeService;
      _opportunityVerificationTypeService = opportunityVerificationTypeService;
      _timeIntervalService = timeIntervalService;
      _blobService = blobService;
      _userService = userService;
      _emailURLFactory = emailURLFactory;
      _emailPreferenceFilterService = emailPreferenceFilterService;
      _emailProviderClient = emailProviderClientFactory.CreateClient();
      _identityProviderClient = identityProviderClientFactory.CreateClient();
      _sharingInfoService = sharingInfoService;

      _opportunityRequestValidatorCreate = opportunityRequestValidatorCreate;
      _opportunityRequestValidatorUpdate = opportunityRequestValidatorUpdate;
      _opportunitySearchFilterValidator = opportunitySearchFilterValidator;
      _opportunitySearchFilterCriteriaValidator = opportunitySearchFilterCriteriaValidator;

      _mediator = mediator;

      _opportunityRepository = opportunityRepository;
      _opportunityCategoryRepository = opportunityCategoryRepository;
      _opportunityCountryRepository = opportunityCountryRepository;
      _opportunityLanguageRepository = opportunityLanguageRepository;
      _opportunitySkillRepository = opportunitySkillRepository;
      _opportunityVerificationTypeRepository = opportunityVerificationTypeRepository;
      _executionStrategyService = executionStrategyService;
    }
    #endregion

    #region Public Members
    public Models.Opportunity GetById(Guid id, bool includeChildItems, bool includeComputed, bool ensureOrganizationAuthorization)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = GetByIdOrNull(id, includeChildItems, includeComputed, ensureOrganizationAuthorization)
          ?? throw new EntityNotFoundException($"{nameof(Models.Opportunity)} with id '{id}' does not exist");

      return result;
    }

    public Models.Opportunity? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed, bool ensureOrganizationAuthorization)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = _opportunityRepository.Query(includeChildItems).SingleOrDefault(o => o.Id == id);
      if (result == null) return null;

      if (ensureOrganizationAuthorization)
        _organizationService.IsAdmin(result.OrganizationId, true);

      if (includeComputed)
      {
        result.SetPublished();
        result.OrganizationLogoURL = GetBlobObjectURL(result.OrganizationLogoStorageType, result.OrganizationLogoKey);
        result.ZltoRewardBalance = result.ZltoRewardPool.HasValue ? result.ZltoRewardPool - (result.ZltoRewardCumulative ?? default) : null;
        result.YomaRewardBalance = result.YomaRewardPool.HasValue ? result.YomaRewardPool - (result.YomaRewardCumulative ?? default) : null;
      }

      return result;
    }

    public Models.Opportunity? GetByTitleOrNull(string title, bool includeChildItems, bool includeComputed)
    {
      if (string.IsNullOrWhiteSpace(title))
        throw new ArgumentNullException(nameof(title));
      title = title.Trim();

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      var result = _opportunityRepository.Query(includeChildItems).SingleOrDefault(o => o.Title.ToLower() == title.ToLower());
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      if (result == null) return null;

      if (includeComputed)
      {
        result.SetPublished();
        result.OrganizationLogoURL = GetBlobObjectURL(result.OrganizationLogoStorageType, result.OrganizationLogoKey);
        result.ZltoRewardBalance = result.ZltoRewardPool.HasValue ? result.ZltoRewardPool - (result.ZltoRewardCumulative ?? default) : null;
        result.YomaRewardBalance = result.YomaRewardPool.HasValue ? result.YomaRewardPool - (result.YomaRewardCumulative ?? default) : null;
      }

      return result;
    }

    public List<Models.Opportunity> Contains(string value, bool includeChildItems, bool includeComputed)
    {
      if (string.IsNullOrWhiteSpace(value))
        throw new ArgumentNullException(nameof(value));
      value = value.Trim();

      var results = _opportunityRepository.Contains(_opportunityRepository.Query(includeChildItems), value).ToList();

      if (includeComputed)
        results.ForEach(o =>
        {
          o.SetPublished();
          o.OrganizationLogoURL = GetBlobObjectURL(o.OrganizationLogoStorageType, o.OrganizationLogoKey);
          o.ZltoRewardBalance = o.ZltoRewardPool.HasValue ? o.ZltoRewardPool - (o.ZltoRewardCumulative ?? default) : null;
          o.YomaRewardBalance = o.YomaRewardPool.HasValue ? o.YomaRewardPool - (o.YomaRewardCumulative ?? default) : null;
        });

      return results;
    }

    public OpportunitySearchResultsCriteria SearchCriteriaOpportunities(OpportunitySearchFilterCriteria filter, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _opportunitySearchFilterCriteriaValidator.ValidateAndThrow(filter);

      var query = _opportunityRepository.Query();

      if (filter.Organization.HasValue)
      {
        if (ensureOrganizationAuthorization)
          _organizationService.IsAdmin(filter.Organization.Value, true);

        query = query.Where(o => o.OrganizationId == filter.Organization.Value);
      }
      else
      {
        if (!HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
          throw new ValidationException($"Organization required for '{Constants.Role_OrganizationAdmin}' role only");
      }

      if (!string.IsNullOrEmpty(filter.TitleContains))
        query = _opportunityRepository.Contains(query, filter.TitleContains);

      if (filter.Opportunities != null && filter.Opportunities.Count != 0)
      {
        filter.Opportunities = filter.Opportunities.Distinct().ToList();
        query = query.Where(o => filter.Opportunities.Contains(o.Id));
      }

      if (filter.Published.HasValue)
      {
        var statusActiveId = _opportunityStatusService.GetByName(Status.Active.ToString()).Id;
        var statusOrganizationActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;
        query = query.Where(o => o.StatusId == statusActiveId && o.OrganizationStatusId == statusOrganizationActiveId);
      }

      if (filter.VerificationMethod.HasValue)
        query = query.Where(o => o.VerificationEnabled && o.VerificationMethodValue == filter.VerificationMethod.ToString());

      var results = new OpportunitySearchResultsCriteria();
      query = query.OrderBy(o => o.Title).ThenBy(o => o.Id); //ensure deterministic sorting / consistent pagination results

      if (filter.PaginationEnabled)
      {
        results.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }
      results.Items = query.ToList().Select(o => o.ToOpportunitySearchCriteria()).ToList();

      return results;
    }

    public List<Models.Lookups.OpportunityCategory> ListOpportunitySearchCriteriaCategoriesAdmin(Guid? organizationId, bool ensureOrganizationAuthorization)
    {
      var org = SearchCriteriaAdminValidateRequest(organizationId, ensureOrganizationAuthorization);

      var query = _opportunityCategoryRepository.Query();

      if (org != null)
        query = query.Where(o => o.OrganizationId == org.Id);

      var categoryIds = query.Select(o => o.CategoryId).Distinct().ToList();

      var results = _opportunityCategoryService.List()
        .Where(o => categoryIds.Contains(o.Id))
        .OrderBy(o => o.Name == Category.Other.ToString()) //  Move "Other" to the end
        .ThenBy(o => o.Name).ToList();

      foreach (var item in results)
      {
        var filter = new OpportunitySearchFilterAdmin
        {
          Organizations = org == null ? null : [org.Id],
          Categories = [item.Id],
          TotalCountOnly = true
        };

        item.Count = Search(filter, false).TotalCount;
      }

      return results;
    }

    public List<Models.Lookups.OpportunityCategory> ListOpportunitySearchCriteriaCategories(List<PublishedState>? publishedStates)
    {
      publishedStates = publishedStates == null || publishedStates.Count == 0 ?
            [PublishedState.NotStarted, PublishedState.Active] : publishedStates;

      var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;
      var query = _opportunityCategoryRepository.Query().Where(o => o.OrganizationStatusId == organizationStatusActiveId);

      var statusActiveId = _opportunityStatusService.GetByName(Status.Active.ToString()).Id;
      var statusExpiredId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;

      var predicate = PredicateBuilder.False<OpportunityCategory>();
      foreach (var state in publishedStates)
      {
        switch (state)
        {
          case PublishedState.NotStarted:
            predicate = predicate.Or(o => o.OpportunityStatusId == statusActiveId && o.OpportunityDateStart > DateTimeOffset.UtcNow);

            break;

          case PublishedState.Active:
            predicate = predicate.Or(o => o.OpportunityStatusId == statusActiveId && o.OpportunityDateStart <= DateTimeOffset.UtcNow);
            break;

          case PublishedState.Expired:
            predicate = predicate.Or(o => o.OpportunityStatusId == statusExpiredId);
            break;
        }
      }

      query = query.Where(predicate);

      var categoryIds = query.Select(o => o.CategoryId).Distinct().ToList();

      var results = _opportunityCategoryService.List()
        .Where(o => categoryIds.Contains(o.Id))
        .OrderBy(o => o.Name == Category.Other.ToString()) //  Move "Other" to the end
        .ThenBy(o => o.Name).ToList();

      foreach (var item in results)
      {
        var filter = new OpportunitySearchFilterAdmin
        {
          Categories = [item.Id],
          PublishedStates = publishedStates,
          TotalCountOnly = true
        };

        item.Count = Search(filter, false).TotalCount;
      }

      return results;
    }

    public List<Domain.Lookups.Models.Country> ListOpportunitySearchCriteriaCountriesAdmin(Guid? organizationId, bool ensureOrganizationAuthorization)
    {
      var org = SearchCriteriaAdminValidateRequest(organizationId, ensureOrganizationAuthorization);

      var query = _opportunityCountryRepository.Query();

      if (org != null)
        query = query.Where(o => o.OrganizationId == org.Id);

      var countryIds = query.Select(o => o.CountryId).Distinct().ToList();

      return [.. _countryService.List().Where(o => countryIds.Contains(o.Id))
                .OrderBy(o => o.CodeAlpha2 != Country.Worldwide.ToDescription()).ThenBy(o => o.Name)]; //ensure Worldwide appears first
    }

    public List<Domain.Lookups.Models.Country> ListOpportunitySearchCriteriaCountries(List<PublishedState>? publishedStates)
    {
      publishedStates = publishedStates == null || publishedStates.Count == 0 ?
              [PublishedState.NotStarted, PublishedState.Active] : publishedStates;

      var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;
      var query = _opportunityCountryRepository.Query().Where(o => o.OrganizationStatusId == organizationStatusActiveId);

      var statusActiveId = _opportunityStatusService.GetByName(Status.Active.ToString()).Id;
      var statusExpiredId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;

      Guid? userCountryId = null;
      if (HttpContextAccessorHelper.UserContextAvailable(_httpContextAccessor))
      {
        var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
        userCountryId = user.CountryId;
      }

      var predicate = PredicateBuilder.False<OpportunityCountry>();
      foreach (var state in publishedStates)
      {
        switch (state)
        {
          case PublishedState.NotStarted:
            predicate = predicate.Or(o => o.OpportunityStatusId == statusActiveId && o.OpportunityDateStart > DateTimeOffset.UtcNow);
            break;

          case PublishedState.Active:
            predicate = predicate.Or(o => o.OpportunityStatusId == statusActiveId && o.OpportunityDateStart <= DateTimeOffset.UtcNow);
            break;

          case PublishedState.Expired:
            predicate = predicate.Or(o => o.OpportunityStatusId == statusExpiredId);
            break;
        }
      }

      query = query.Where(predicate);

      var countryOpportunities = query
        .GroupBy(o => o.CountryId)
        .Select(g => new { CountryId = g.Key, OpportunityCount = g.Count() })
        .ToList();

      var countries = _countryService.List()
        .Where(o => countryOpportunities.Select(co => co.CountryId).Contains(o.Id))
        .ToList();

      var results = countries
        .OrderByDescending(c => c.CodeAlpha2 == Country.Worldwide.ToDescription()) //ensure Worldwide appears first
        .ThenByDescending(c => userCountryId != null && c.Id == userCountryId) //followed by the user's country if available and has one or more opportunities mapped
        .ThenByDescending(c => countryOpportunities.FirstOrDefault(co => co.CountryId == c.Id)?.OpportunityCount ?? 0) //followed by the remaining countries with opportunities, ordered by opportunity counts descending
        .ThenBy(o => o.Name) //lastly alphabetically by name
        .ToList();

      return results;
    }

    public List<Domain.Lookups.Models.Language> ListOpportunitySearchCriteriaLanguagesAdmin(Guid? organizationId, bool ensureOrganizationAuthorization)
    {
      var org = SearchCriteriaAdminValidateRequest(organizationId, ensureOrganizationAuthorization);

      var query = _opportunityLanguageRepository.Query();

      if (org != null)
        query = query.Where(o => o.OrganizationId == org.Id);

      var languageIds = query.Select(o => o.LanguageId).Distinct().ToList();

      return [.. _languageService.List().Where(o => languageIds.Contains(o.Id)).OrderBy(o => o.Name)];
    }

    public List<Domain.Lookups.Models.Language> ListOpportunitySearchCriteriaLanguages(List<PublishedState>? publishedStates, string? languageCodeAlpha2Site)
    {
      publishedStates = publishedStates == null || publishedStates.Count == 0 ?
             [PublishedState.NotStarted, PublishedState.Active] : publishedStates;

      var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;
      var query = _opportunityLanguageRepository.Query().Where(o => o.OrganizationStatusId == organizationStatusActiveId);

      var statusActiveId = _opportunityStatusService.GetByName(Status.Active.ToString()).Id;
      var statusExpiredId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;

      var languageSiteId = string.IsNullOrEmpty(languageCodeAlpha2Site) ? null : (Guid?)_languageService.GetByCodeAplha2(languageCodeAlpha2Site).Id;

      var predicate = PredicateBuilder.False<OpportunityLanguage>();
      foreach (var state in publishedStates)
      {
        switch (state)
        {
          case PublishedState.NotStarted:
            predicate = predicate.Or(o => o.OpportunityStatusId == statusActiveId && o.OpportunityDateStart > DateTimeOffset.UtcNow);

            break;

          case PublishedState.Active:
            predicate = predicate.Or(o => o.OpportunityStatusId == statusActiveId && o.OpportunityDateStart <= DateTimeOffset.UtcNow);
            break;

          case PublishedState.Expired:
            predicate = predicate.Or(o => o.OpportunityStatusId == statusExpiredId);
            break;
        }
      }

      query = query.Where(predicate);

      var languageOpportunities = query
        .GroupBy(o => o.LanguageId)
        .Select(g => new { LanguageId = g.Key, OpportunityCount = g.Count() })
        .ToList();

      var languages = _languageService.List()
        .Where(o => languageOpportunities.Select(lo => lo.LanguageId).Contains(o.Id))
        .ToList();

      var results = languages
        .OrderByDescending(l => languageSiteId != null && l.Id == languageSiteId)
        .ThenByDescending(l => languageOpportunities.FirstOrDefault(lo => lo.LanguageId == l.Id)?.OpportunityCount ?? 0)
        .ThenBy(l => l.Name)
        .ToList();

      return results;
    }

    public List<OrganizationInfo> ListOpportunitySearchCriteriaOrganizationsAdmin()
    {
      var organizationIds = _opportunityRepository.Query().Select(o => o.OrganizationId).Distinct().ToList();

      var filter = new OrganizationSearchFilter
      {
        Organizations = organizationIds,
        InternalUse = true
      };

      return _organizationService.Search(filter, false).Items;
    }

    public List<OrganizationInfo> ListOpportunitySearchCriteriaOrganizations(List<PublishedState>? publishedStates)
    {
      publishedStates = publishedStates == null || publishedStates.Count == 0 ?
          [PublishedState.NotStarted, PublishedState.Active] : publishedStates;

      var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;
      var query = _opportunityRepository.Query().Where(o => o.OrganizationStatusId == organizationStatusActiveId);

      var statusActiveId = _opportunityStatusService.GetByName(Status.Active.ToString()).Id;
      var statusExpiredId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;

      var predicate = PredicateBuilder.False<Models.Opportunity>();
      foreach (var state in publishedStates)
      {
        switch (state)
        {
          case PublishedState.NotStarted:
            predicate = predicate.Or(o => o.StatusId == statusActiveId && o.DateStart > DateTimeOffset.UtcNow);

            break;

          case PublishedState.Active:
            predicate = predicate.Or(o => o.StatusId == statusActiveId && o.DateStart <= DateTimeOffset.UtcNow);
            break;

          case PublishedState.Expired:
            predicate = predicate.Or(o => o.StatusId == statusExpiredId);
            break;
        }
      }

      query = query.Where(predicate);

      var organizationOpportunities = query
        .GroupBy(o => o.OrganizationId)
        .Select(g => new { OrganizationId = g.Key, OpportunityCount = g.Count() })
        .ToList();

      var organizationIds = organizationOpportunities.Select(oo => oo.OrganizationId).ToList();

      var filter = new OrganizationSearchFilter
      {
        Organizations = organizationIds,
        Statuses = [OrganizationStatus.Active],
        InternalUse = true
      };

      var organizations = _organizationService.Search(filter, false).Items;

      var results = organizations
        .OrderByDescending(o => organizationOpportunities.FirstOrDefault(oo => oo.OrganizationId == o.Id)?.OpportunityCount ?? 0)
        .ThenBy(o => o.Name)
        .ToList();

      return results;
    }

    public List<OpportunitySearchCriteriaCommitmentIntervalOption> ListOpportunitySearchCriteriaCommitmentIntervalOptions(List<PublishedState>? publishedStates)
    {
      publishedStates = publishedStates == null || publishedStates.Count == 0 ?
         [PublishedState.NotStarted, PublishedState.Active] : publishedStates;

      var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;
      var query = _opportunityRepository.Query().Where(o => o.OrganizationStatusId == organizationStatusActiveId);

      var statusActiveId = _opportunityStatusService.GetByName(Status.Active.ToString()).Id;
      var statusExpiredId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;

      var predicate = PredicateBuilder.False<Models.Opportunity>();
      foreach (var state in publishedStates)
      {
        switch (state)
        {
          case PublishedState.NotStarted:
            predicate = predicate.Or(o => o.StatusId == statusActiveId && o.DateStart > DateTimeOffset.UtcNow);

            break;

          case PublishedState.Active:
            predicate = predicate.Or(o => o.StatusId == statusActiveId && o.DateStart <= DateTimeOffset.UtcNow);
            break;

          case PublishedState.Expired:
            predicate = predicate.Or(o => o.StatusId == statusExpiredId);
            break;
        }
      }

      query = query.Where(predicate);

      var queryResults = query
        .Select(item => new
        {
          Id = item.CommitmentIntervalId,
          Count = item.CommitmentIntervalCount,
          Interval = item.CommitmentInterval
        })
        .GroupBy(item => new { item.Count, item.Id })
        .Select(group => group.First())
        .ToList();

      var results = queryResults
        .Select(item =>
        {
          return new OpportunitySearchCriteriaCommitmentIntervalOption
          {
            Id = $"{item.Count}|{item.Id}",
            Name = $"{item.Count} {item.Interval}{(item.Count > 1 ? "s" : string.Empty)}",
            Order = item.Interval switch
            {
              TimeIntervalOption.Minute => 1,
              TimeIntervalOption.Hour => 2,
              TimeIntervalOption.Day => 3,
              TimeIntervalOption.Week => 4,
              TimeIntervalOption.Month => 5,
              _ => throw new InvalidOperationException($"{nameof(TimeIntervalOption)} of '{item.Interval}' not supported"),
            },
            Count = item.Count
          };
        })
        .OrderBy(o => o.Order)
        .ThenBy(o => o.Count)
        .ToList();

      return results;
    }

    public List<OpportunitySearchCriteriaZltoRewardRange> ListOpportunitySearchCriteriaZltoRewardRanges(List<PublishedState>? publishedStates)
    {
      publishedStates = publishedStates == null || publishedStates.Count == 0 ?
          [PublishedState.NotStarted, PublishedState.Active] : publishedStates;

      var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;
      var query = _opportunityRepository.Query().Where(o => o.ZltoReward.HasValue && o.OrganizationStatusId == organizationStatusActiveId);

      var statusActiveId = _opportunityStatusService.GetByName(Status.Active.ToString()).Id;
      var statusExpiredId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;

      var predicate = PredicateBuilder.False<Models.Opportunity>();
      foreach (var state in publishedStates)
      {
        switch (state)
        {
          case PublishedState.NotStarted:
            predicate = predicate.Or(o => o.StatusId == statusActiveId && o.DateStart > DateTimeOffset.UtcNow);

            break;

          case PublishedState.Active:
            predicate = predicate.Or(o => o.StatusId == statusActiveId && o.DateStart <= DateTimeOffset.UtcNow);
            break;

          case PublishedState.Expired:
            predicate = predicate.Or(o => o.StatusId == statusExpiredId);
            break;
        }
      }

      query = query.Where(predicate);

      var minValue = query.Min(o => o.ZltoReward);
      var maxValue = query.Max(o => o.ZltoReward);
      var increment = new decimal(50);

      var roundedMinValue = Math.Floor((minValue ?? 0) / increment) * increment;
      var roundedMaxValue = Math.Ceiling((maxValue ?? 0) / increment) * increment;

      var results = new List<OpportunitySearchCriteriaZltoRewardRange>();
      for (decimal i = roundedMinValue; i < roundedMaxValue; i += increment)
      {
        var from = i;
        var to = Math.Min(i + increment, roundedMaxValue);
        var id = $"{from}|{to}";
        var description = $"Z{from} - Z{to}";

        results.Add(new OpportunitySearchCriteriaZltoRewardRange
        {
          Id = id,
          Name = description
        });
      }

      return results;
    }

    public OpportunitySearchResults Search(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      ParseOpportunitySearchFilterCommitmentInterval(filter);
      ParseOpportunitySearchFilterZltoReward(filter);

      _opportunitySearchFilterValidator.ValidateAndThrow(filter);

      var query = _opportunityRepository.Query(true);

      //date range
      if (filter.StartDate.HasValue)
      {
        filter.StartDate = filter.StartDate.Value.RemoveTime();
        query = query.Where(o => o.DateStart >= filter.StartDate.Value);
      }

      if (filter.EndDate.HasValue)
      {
        filter.EndDate = filter.EndDate.Value.ToEndOfDay();
        query = query.Where(o => o.DateEnd <= filter.EndDate.Value);
      }

      //organizations
      if (ensureOrganizationAuthorization && !HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
      {
        if (filter.Organizations != null && filter.Organizations.Count != 0)
        {
          filter.Organizations = filter.Organizations.Distinct().ToList();
          _organizationService.IsAdminsOf(filter.Organizations, true);
        }
        else
          filter.Organizations = _organizationService.ListAdminsOf(false).Select(o => o.Id).ToList();
      }

      if (filter.Organizations != null && filter.Organizations.Count != 0)
        query = query.Where(o => filter.Organizations.Contains(o.OrganizationId));

      //types
      if (filter.Types != null && filter.Types.Count != 0)
      {
        filter.Types = filter.Types.Distinct().ToList();
        query = query.Where(o => filter.Types.Contains(o.TypeId));
      }

      //categories
      if (filter.Categories != null && filter.Categories.Count != 0)
      {
        filter.Categories = filter.Categories.Distinct().ToList();
        query = query.Where(opportunity => _opportunityCategoryRepository.Query().Any(
            opportunityCategory => filter.Categories.Contains(opportunityCategory.CategoryId) && opportunityCategory.OpportunityId == opportunity.Id));
      }

      //languages
      if (filter.Languages != null && filter.Languages.Count != 0)
      {
        filter.Languages = filter.Languages.Distinct().ToList();
        query = query.Where(opportunity => _opportunityLanguageRepository.Query().Any(
           opportunityLanguage => filter.Languages.Contains(opportunityLanguage.LanguageId) && opportunityLanguage.OpportunityId == opportunity.Id));
      }

      //countries
      if (filter.Countries != null && filter.Countries.Count != 0)
      {
        filter.Countries = filter.Countries.Distinct().ToList();
        query = query.Where(opportunity => _opportunityCountryRepository.Query().Any(
          opportunityCountry => filter.Countries.Contains(opportunityCountry.CountryId) && opportunityCountry.OpportunityId == opportunity.Id));
      }

      if (filter.PublishedStates != null)
      {
        var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;
        query = query.Where(o => o.OrganizationStatusId == organizationStatusActiveId);

        var statusActiveId = _opportunityStatusService.GetByName(Status.Active.ToString()).Id;
        var statusExpiredId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;

        var predicate = PredicateBuilder.False<Models.Opportunity>();
        foreach (var state in filter.PublishedStates)
        {
          switch (state)
          {
            case PublishedState.NotStarted:
              predicate = predicate.Or(o => o.StatusId == statusActiveId && o.DateStart > DateTimeOffset.UtcNow);

              break;

            case PublishedState.Active:
              predicate = predicate.Or(o => o.StatusId == statusActiveId && o.DateStart <= DateTimeOffset.UtcNow);
              break;

            case PublishedState.Expired:
              predicate = predicate.Or(o => o.StatusId == statusExpiredId);
              break;
          }
        }

        query = query.Where(predicate);
      }

      //engagementTypes
      if (filter.EngagementTypes != null && filter.EngagementTypes.Count != 0)
      {
        filter.EngagementTypes = filter.EngagementTypes.Distinct().ToList();
        query = query.Where(o => !o.EngagementTypeId.HasValue || filter.EngagementTypes.Contains(o.EngagementTypeId.Value)); ///always included of not explicitly defined
      }

      //statuses
      if (filter.Statuses != null && filter.Statuses.Count != 0)
      {
        filter.Statuses = filter.Statuses.Distinct().ToList();
        var statusIds = filter.Statuses.Select(o => _opportunityStatusService.GetByName(o.ToString()).Id).ToList();
        query = query.Where(o => statusIds.Contains(o.StatusId));
      }

      //opportunities (explicit internal filter; if specified and empty, no results will be returned)
      if (filter.Opportunities != null)
      {
        filter.Opportunities = filter.Opportunities.Distinct().ToList();
        query = query.Where(o => filter.Opportunities.Contains(o.Id));
      }

      //commitmentInterval
      if (filter.CommitmentInterval != null)
      {
        //options
        if (filter.CommitmentInterval.OptionsParsed != null && filter.CommitmentInterval.OptionsParsed.Count != 0)
        {
          var intervalIds = filter.CommitmentInterval.OptionsParsed.Select(item => item.Id).Distinct().ToList();
          var intervalCounts = filter.CommitmentInterval.OptionsParsed.Select(item => item.Count).Distinct().ToList();
          query = query.Where(o => intervalIds.Contains(o.CommitmentIntervalId) && intervalCounts.Contains(o.CommitmentIntervalCount));
        }

        //Interval
        if (filter.CommitmentInterval.Interval != null)
        {
          var filterIntervalName = _timeIntervalService.GetById(filter.CommitmentInterval.Interval.Id).Name;
          var filterCountInMinutes = TimeIntervalHelper.ConvertToMinutes(filterIntervalName, filter.CommitmentInterval.Interval.Count);

          var minuteIntervalId = _timeIntervalService.GetByName(TimeIntervalOption.Minute.ToString()).Id;
          var hourIntervalId = _timeIntervalService.GetByName(TimeIntervalOption.Hour.ToString()).Id;
          var dayIntervalId = _timeIntervalService.GetByName(TimeIntervalOption.Day.ToString()).Id;
          var weekIntervalId = _timeIntervalService.GetByName(TimeIntervalOption.Week.ToString()).Id;
          var monthIntervalId = _timeIntervalService.GetByName(TimeIntervalOption.Month.ToString()).Id;

          query = query.Where(o =>
              (o.CommitmentIntervalId == minuteIntervalId && o.CommitmentIntervalCount <= filterCountInMinutes) ||
              (o.CommitmentIntervalId == hourIntervalId && (long)o.CommitmentIntervalCount * 60 <= filterCountInMinutes) ||
              (o.CommitmentIntervalId == dayIntervalId && (long)o.CommitmentIntervalCount * 60 * 24 <= filterCountInMinutes) ||
              (o.CommitmentIntervalId == weekIntervalId && (long)o.CommitmentIntervalCount * 60 * 24 * 7 <= filterCountInMinutes) ||
              (o.CommitmentIntervalId == monthIntervalId && (long)o.CommitmentIntervalCount * 60 * 24 * 30 <= filterCountInMinutes)
          );
        }
      }

      //zltoReward
      if (filter.ZltoReward != null)
      {
        //ranges
        if (filter.ZltoReward.RangesParsed != null && filter.ZltoReward.RangesParsed.Count != 0)
        {
          var distinctItems = filter.ZltoReward.RangesParsed
             .Select(item => new { item.From, item.To })
             .Distinct()
             .ToList();

          query = query.Where(o => o.ZltoReward.HasValue);

          var predicate = PredicateBuilder.False<Models.Opportunity>();
          foreach (var item in distinctItems)
            predicate = predicate.Or(o => o.ZltoReward >= item.From && o.ZltoReward <= item.To);

          query = query.Where(predicate);
        }

        //hasReward: when true, only opportunities with zlto rewards are included; otherwise, both rewarded and non-rewarded opportunities are included
        if (filter.ZltoReward.HasReward == true)
          query = query.Where(o => o.ZltoReward > 0);
      }

      //featured
      if (filter.Featured == true)
        query = query.Where(o => o.Featured == true);

      //shareWithPartners
      if (filter.ShareWithPartners == true)
        query = query.Where(o => o.ShareWithPartners == true);

      //valueContains (includes organizations, types, categories, opportunities and skills)
      if (!string.IsNullOrEmpty(filter.ValueContains))
      {
        var predicate = PredicateBuilder.False<Models.Opportunity>();

        //organizations
        var matchedOrganizationIds = _organizationService.Contains(filter.ValueContains, false, false).Select(o => o.Id).Distinct().ToList();
        predicate = predicate.Or(o => matchedOrganizationIds.Contains(o.OrganizationId));

        //types
        var matchedTypeIds = _opportunityTypeService.Contains(filter.ValueContains).Select(o => o.Id).Distinct().ToList();
        predicate = predicate.Or(o => matchedTypeIds.Contains(o.TypeId));

        //categories
        var matchedCategoryIds = _opportunityCategoryService.Contains(filter.ValueContains).Select(o => o.Id).Distinct().ToList();
        predicate = predicate.Or(opportunity => _opportunityCategoryRepository.Query().Any(
           opportunityCategory => matchedCategoryIds.Contains(opportunityCategory.CategoryId) && opportunityCategory.OpportunityId == opportunity.Id));

        //opportunities
        predicate = _opportunityRepository.Contains(predicate, filter.ValueContains);

        //skills
        var matchedSkillIds = _skillService.Contains(filter.ValueContains).Select(o => o.Id).Distinct().ToList();
        predicate = predicate.Or(opportunity => _opportunitySkillRepository.Query().Any(
           opportunitySkill => matchedSkillIds.Contains(opportunitySkill.SkillId) && opportunitySkill.OpportunityId == opportunity.Id));

        query = query.Where(predicate);
      }

      var result = new OpportunitySearchResults();

      if (filter.TotalCountOnly)
      {
        result.TotalCount = query.Count();
        return result;
      }

      if (filter.OrderInstructions == null || filter.OrderInstructions.Count == 0)
        throw new ArgumentOutOfRangeException(nameof(filter), $"{filter.OrderInstructions} are required");
      query = query.ApplyFiltersAndOrdering(filter.OrderInstructions);

      //pagination
      if (filter.PaginationEnabled)
      {
        result.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      result.Items = [.. query];
      result.Items.ForEach(o =>
      {
        o.SetPublished();
        o.OrganizationLogoURL = GetBlobObjectURL(o.OrganizationLogoStorageType, o.OrganizationLogoKey);
        o.ZltoRewardBalance = o.ZltoRewardPool.HasValue ? o.ZltoRewardPool - (o.ZltoRewardCumulative ?? default) : null;
        o.YomaRewardBalance = o.YomaRewardPool.HasValue ? o.YomaRewardPool - (o.YomaRewardCumulative ?? default) : null;
      });

      return result;
    }

    public async Task<Models.Opportunity> Create(OpportunityRequestCreate request, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      request.URL = request.URL?.EnsureHttpsScheme();

      await _opportunityRequestValidatorCreate.ValidateAndThrowAsync(request);

      request.DateStart = request.DateStart.RemoveTime();
      if (request.DateEnd.HasValue) request.DateEnd = request.DateEnd.Value.ToEndOfDay();

      if (ensureOrganizationAuthorization)
        _organizationService.IsAdmin(request.OrganizationId, true);

      if (request.DateStart < DateTimeOffset.UtcNow.RemoveTime())
        throw new ValidationException("The start date cannot be in the past, it can be today or later");

      var existingByTitle = GetByTitleOrNull(request.Title, false, false);
      if (existingByTitle != null)
        throw new ValidationException($"{nameof(Models.Opportunity)} with the specified name '{request.Title}' already exists");

      var status = request.PostAsActive ? Status.Active : Status.Inactive;
      if (request.DateEnd.HasValue && request.DateEnd.Value <= DateTimeOffset.UtcNow)
      {
        if (request.PostAsActive)
          throw new ValidationException($"{nameof(Models.Opportunity)} has already ended and can not be posted as active");
        status = Status.Expired;
      }

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      var organization = _organizationService.GetById(request.OrganizationId, false, true, false);

      if (organization.Status != OrganizationStatus.Active)
        throw new ValidationException($"An opportunity cannot be created as the associated organization '{organization.Name}' is not currently active (pending approval)");

      var result = new Models.Opportunity
      {
        Title = request.Title.NormalizeTrim(),
        Description = request.Description,
        TypeId = request.TypeId,
        Type = _opportunityTypeService.GetById(request.TypeId).Name,
        OrganizationId = request.OrganizationId,
        OrganizationName = organization.Name,
        OrganizationLogoId = organization.LogoId,
        OrganizationLogoStorageType = organization.LogoStorageType,
        OrganizationLogoKey = organization.LogoKey,
        OrganizationLogoURL = organization.LogoURL,
        OrganizationStatusId = organization.StatusId,
        OrganizationStatus = organization.Status,
        Summary = request.Summary,
        Instructions = request.Instructions,
        URL = request.URL,
        ZltoReward = request.ZltoReward,
        YomaReward = request.YomaReward,
        ZltoRewardPool = request.ZltoRewardPool,
        YomaRewardPool = request.YomaRewardPool,
        ZltoRewardBalance = request.ZltoRewardPool.HasValue ? request.ZltoRewardPool : null,
        YomaRewardBalance = request.YomaRewardPool.HasValue ? request.YomaRewardPool : null,
        VerificationEnabled = request.VerificationEnabled,
        VerificationMethodValue = request.VerificationMethod?.ToString(),
        VerificationMethod = request.VerificationMethod,
        DifficultyId = request.DifficultyId,
        Difficulty = _opportunityDifficultyService.GetById(request.DifficultyId).Name,
        CommitmentIntervalId = request.CommitmentIntervalId,
        CommitmentInterval = Enum.Parse<TimeIntervalOption>(_timeIntervalService.GetById(request.CommitmentIntervalId).Name, true),
        CommitmentIntervalCount = request.CommitmentIntervalCount,
        CommitmentIntervalDescription = $"{request.CommitmentIntervalCount} {_timeIntervalService.GetById(request.CommitmentIntervalId).Name}{(request.CommitmentIntervalCount > 1 ? "s" : string.Empty)}",
        ParticipantLimit = request.ParticipantLimit,
        KeywordsFlatten = request.Keywords == null ? null : string.Join(Keywords_Separator, request.Keywords),
        Keywords = request.Keywords,
        DateStart = request.DateStart,
        DateEnd = !request.DateEnd.HasValue ? null : request.DateEnd.Value,
        CredentialIssuanceEnabled = request.CredentialIssuanceEnabled,
        SSISchemaName = request.SSISchemaName,
        EngagementTypeId = request.EngagementTypeId,
        EngagementType = request.EngagementTypeId.HasValue ? Enum.Parse<EngagementTypeOption>(_engagementTypeService.GetById(request.EngagementTypeId.Value).Name, true) : null,
        ShareWithPartners = request.ShareWithPartners.HasValue ? request.ShareWithPartners : null,
        StatusId = _opportunityStatusService.GetByName(status.ToString()).Id,
        Status = status,
        CreatedByUserId = user.Id,
        ModifiedByUserId = user.Id
      };

      if (result.DateEnd.HasValue)
      {
        var commitmentIntervalInDays = result.TimeIntervalToDays();
        var dateEndMin = result.DateStart.AddDays(commitmentIntervalInDays - 1); //count today as the 1st day
        if (dateEndMin > result.DateEnd.Value)
          throw new ValidationException($"The end date for the opportunity must be on or after {dateEndMin.Date}, based on the specified start date and commitment interval");
      }

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await _opportunityRepository.Create(result);

        // categories
        result = await AssignCategories(result, request.Categories);

        // countries
        result = await AssignCountries(result, request.Countries);

        // languages
        result = await AssignLanguages(result, request.Languages);

        // skills (optional)
        result = await AssignSkills(result, request.Skills);

        // verification types (optional)
        result = await AssignVerificationTypes(result, request.VerificationTypes);

        scope.Complete();
      });

      result.SetPublished();

      //sent when activated irrespective of organization status (sent to admin)
      if (result.Status == Status.Active) await SendEmail(result, EmailType.Opportunity_Posted_Admin);

      await _mediator.Publish(new OpportunityEvent(EventType.Create, result));

      return result;
    }

    public async Task<Models.Opportunity> Update(OpportunityRequestUpdate request, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      request.URL = request.URL?.EnsureHttpsScheme();

      await _opportunityRequestValidatorUpdate.ValidateAndThrowAsync(request);

      request.DateStart = request.DateStart.RemoveTime();
      if (request.DateEnd.HasValue) request.DateEnd = request.DateEnd.Value.ToEndOfDay();

      if (ensureOrganizationAuthorization)
        _organizationService.IsAdmin(request.OrganizationId, true);

      var result = GetById(request.Id, true, true, false);
      var resultCurrent = ObjectHelper.DeepCopy(result);

      AssertUpdatable(result);

      if (!result.DateStart.Equals(request.DateStart) && request.DateStart < DateTimeOffset.UtcNow.RemoveTime())
        throw new ValidationException("The start date cannot be in the past. The start date has been updated and must be today or later");

      var existingByTitle = GetByTitleOrNull(request.Title, false, false);
      if (existingByTitle != null && result.Id != existingByTitle.Id)
        throw new ValidationException($"{nameof(Models.Opportunity)} with the specified name '{request.Title}' already exists");

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      var organization = _organizationService.GetById(request.OrganizationId, false, true, false);

      if (organization.Status != OrganizationStatus.Active)
        throw new ValidationException($"The opportunity cannot be updated as the associated organization '{organization.Name}' is not currently active (pending approval)");

      //by default, status remains unchanged, except for immediate expiration based on DateEnd (status updated via UpdateStatus)
      if (request.DateEnd.HasValue && request.DateEnd.Value <= DateTimeOffset.UtcNow)
      {
        result.StatusId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;
        result.Status = Status.Expired;
      }

      if (request.ZltoRewardPool.HasValue && result.ZltoRewardCumulative.HasValue && request.ZltoRewardPool < result.ZltoRewardCumulative)
        throw new ValidationException($"The Zlto reward pool cannot be less than the cumulative Zlto rewards ({result.ZltoRewardCumulative:D0}) already allocated to participants");

      if (request.YomaRewardPool.HasValue && result.YomaRewardCumulative.HasValue && request.YomaRewardPool < result.YomaRewardCumulative)
        throw new ValidationException($"The Yoma reward pool cannot be less than the cumulative Yoma rewards ({result.YomaRewardCumulative:D2}) already allocated to participants");

      result.Title = request.Title.NormalizeTrim();
      result.Description = request.Description;
      result.TypeId = request.TypeId;
      result.Type = _opportunityTypeService.GetById(request.TypeId).Name;
      result.OrganizationId = request.OrganizationId;
      result.OrganizationName = organization.Name;
      result.OrganizationLogoId = organization.LogoId;
      result.OrganizationLogoURL = organization.LogoURL;
      result.Summary = request.Summary;
      result.Instructions = request.Instructions;
      result.URL = request.URL;
      result.ZltoReward = request.ZltoReward;
      result.YomaReward = request.YomaReward;
      result.ZltoRewardPool = request.ZltoRewardPool;
      result.YomaRewardPool = request.YomaRewardPool;
      result.ZltoRewardBalance = result.ZltoRewardPool.HasValue ? result.ZltoRewardPool - (result.ZltoRewardCumulative ?? default) : null;
      result.YomaRewardBalance = result.YomaRewardPool.HasValue ? result.YomaRewardPool - (result.YomaRewardCumulative ?? default) : null;
      result.VerificationEnabled = request.VerificationEnabled;
      result.VerificationMethod = request.VerificationMethod;
      result.DifficultyId = request.DifficultyId;
      result.Difficulty = _opportunityDifficultyService.GetById(request.DifficultyId).Name;
      result.CommitmentIntervalId = request.CommitmentIntervalId;
      result.CommitmentInterval = Enum.Parse<TimeIntervalOption>(_timeIntervalService.GetById(request.CommitmentIntervalId).Name, true);
      result.CommitmentIntervalCount = request.CommitmentIntervalCount;
      result.CommitmentIntervalDescription = $"{request.CommitmentIntervalCount} {_timeIntervalService.GetById(request.CommitmentIntervalId).Name}{(request.CommitmentIntervalCount > 1 ? "s" : string.Empty)}";
      result.ParticipantLimit = request.ParticipantLimit;
      result.KeywordsFlatten = request.Keywords == null ? null : string.Join(Keywords_Separator, request.Keywords);
      result.Keywords = request.Keywords;
      result.DateStart = request.DateStart;
      result.DateEnd = !request.DateEnd.HasValue ? null : request.DateEnd.Value;
      result.CredentialIssuanceEnabled = request.CredentialIssuanceEnabled;
      result.SSISchemaName = request.SSISchemaName;
      result.EngagementTypeId = request.EngagementTypeId;
      result.EngagementType = request.EngagementTypeId.HasValue ? Enum.Parse<EngagementTypeOption>(_engagementTypeService.GetById(request.EngagementTypeId.Value).Name, true) : null;
      result.ShareWithPartners = request.ShareWithPartners.HasValue ? request.ShareWithPartners : result.ShareWithPartners;
      result.ModifiedByUserId = user.Id;

      if (result.DateEnd.HasValue)
      {
        var commitmentIntervalInDays = result.TimeIntervalToDays();
        var dateEndMin = result.DateStart.AddDays(commitmentIntervalInDays - 1); //count today as the 1st day
        if (dateEndMin > result.DateEnd.Value)
          throw new ValidationException($"The end date for the opportunity must be on or after {dateEndMin.Date}, based on the specified start date and commitment interval");
      }

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        await AssertUpdatablePartnerSharing(request, resultCurrent); //check will abort sharing if possible and needs to be rolled back if the update fails

        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await _opportunityRepository.Update(result);

        // categories
        result = await RemoveCategories(result, result.Categories?.Where(o => !request.Categories.Contains(o.Id)).Select(o => o.Id).ToList());
        result = await AssignCategories(result, request.Categories);

        // countries
        result = await RemoveCountries(result, result.Countries?.Where(o => !request.Countries.Contains(o.Id)).Select(o => o.Id).ToList());
        result = await AssignCountries(result, request.Countries);

        // languages
        result = await RemoveLanguages(result, result.Languages?.Where(o => !request.Languages.Contains(o.Id)).Select(o => o.Id).ToList());
        result = await AssignLanguages(result, request.Languages);

        // skills (optional)
        result = await RemoveSkills(result, result.Skills?.Where(o => !request.Skills.Contains(o.Id)).Select(o => o.Id).ToList());
        result = await AssignSkills(result, request.Skills);

        // verification types (optional)
        result = await RemoveVerificationTypes(result, result.VerificationTypes?.Select(o => o.Type).Except(request.VerificationTypes?.Select(o => o.Type) ?? []).ToList());
        result = await AssignVerificationTypes(result, request.VerificationTypes);

        scope.Complete();
      });
      result.SetPublished();

      await _mediator.Publish(new OpportunityEvent(EventType.Update, result));

      return result;
    }

    public async Task<OpportunityAllocateRewardResponse> AllocateRewards(Guid id, bool ensureOrganizationAuthorization)
    {
      var opportunity = GetById(id, false, true, ensureOrganizationAuthorization);

      //can complete, provided published (and started) or expired (action prior to expiration)
      var canComplete = opportunity.Published && opportunity.DateStart <= DateTimeOffset.UtcNow;
      if (!canComplete) canComplete = opportunity.Status == Status.Expired;

      if (!canComplete)
      {
        var reasons = new List<string>();

        if (!opportunity.Published)
          reasons.Add("it has not been published");

        if (opportunity.Status != Status.Active)
          reasons.Add($"its status is '{opportunity.Status}'");

        if (opportunity.DateStart > DateTimeOffset.UtcNow)
          reasons.Add($"it has not yet started (start date: {opportunity.DateStart:yyyy-MM-dd})");

        var reasonText = string.Join(", ", reasons);

        throw new ValidationException($"Opportunity '{opportunity.Title}' rewards can no longer be allocated, because {reasonText}. Please check these conditions and try again");
      }

      var count = (opportunity.ParticipantCount ?? 0) + 1;
      if (opportunity.ParticipantLimit.HasValue && count > opportunity.ParticipantLimit.Value)
        throw new ValidationException($"The number of participants cannot exceed the limit. The current count is '{opportunity.ParticipantCount ?? 0}', and the limit is '{opportunity.ParticipantLimit.Value}'. Please edit the opportunity to increase or remove the limit, or reject the verification request");

      var organization = _organizationService.GetById(opportunity.OrganizationId, false, false, false);
      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsernameSystem, false, false);

      var result = new OpportunityAllocateRewardResponse
      {
        ZltoReward = opportunity.ZltoReward,
        YomaReward = opportunity.YomaReward
      };

      // zlto reward
      (result.ZltoReward, result.ZltoRewardReduced, result.ZltoRewardPoolDepleted) =
        ProcessRewardAllocation(result.ZltoReward, organization.ZltoRewardPool, organization.ZltoRewardCumulative, null, null);

      (result.ZltoReward, result.ZltoRewardReduced, result.ZltoRewardPoolDepleted) =
       ProcessRewardAllocation(result.ZltoReward, opportunity.ZltoRewardPool, opportunity.ZltoRewardCumulative, result.ZltoRewardReduced, result.ZltoRewardPoolDepleted);

      // yoma reward
      (result.YomaReward, result.YomaRewardReduced, result.YomaRewardPoolDepleted) =
        ProcessRewardAllocation(result.YomaReward, organization.YomaRewardPool, organization.YomaRewardCumulative, null, null);

      (result.YomaReward, result.YomaRewardReduced, result.YomaRewardPoolDepleted) =
        ProcessRewardAllocation(result.YomaReward, opportunity.YomaRewardPool, opportunity.YomaRewardCumulative, result.YomaRewardReduced, result.YomaRewardPoolDepleted);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

        opportunity.ParticipantCount = count;
        opportunity.ModifiedByUserId = user.Id;

        // update rewardCumulative, treating null as 0 for the addition
        await _organizationService.AllocateRewards(organization, result.ZltoReward, result.YomaReward);

        if (result.ZltoReward.HasValue)
          opportunity.ZltoRewardCumulative = (opportunity.ZltoRewardCumulative ?? default) + result.ZltoReward.Value;

        if (result.YomaReward.HasValue)
          opportunity.YomaRewardCumulative = (opportunity.YomaRewardCumulative ?? default) + result.YomaReward.Value;

        await _opportunityRepository.Update(opportunity);

        scope.Complete();
      });

      opportunity.ZltoRewardBalance = opportunity.ZltoRewardPool.HasValue ? opportunity.ZltoRewardPool - (opportunity.ZltoRewardCumulative ?? default) : null;
      opportunity.YomaRewardBalance = opportunity.YomaRewardPool.HasValue ? opportunity.YomaRewardPool - (opportunity.YomaRewardCumulative ?? default) : null;

      await _mediator.Publish(new OpportunityEvent(EventType.Update, opportunity));

      return result;
    }

    //administrative action only
    public async Task<Models.Opportunity> UpdateFeatured(Guid id, bool featured)
    {
      var result = GetById(id, true, true, false);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      AssertUpdatable(result);

      result.Featured = featured;
      result.ModifiedByUserId = user.Id;

      result = await _opportunityRepository.Update(result);

      await _mediator.Publish(new OpportunityEvent(EventType.Update, result));

      return result;
    }

    public async Task<Models.Opportunity> UpdateStatus(Guid id, Status status, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      EventType? eventType = null;
      switch (status)
      {
        case Status.Active:
          if (result.Status == Status.Active) return result;
          if (!Statuses_Activatable.Contains(result.Status))
            throw new ValidationException($"{nameof(Models.Opportunity)} can not be activated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_Activatable)}'");

          //ensure DateEnd was updated for re-activation of previously expired opportunities
          if (result.DateEnd.HasValue && result.DateEnd.Value <= DateTimeOffset.UtcNow)
            throw new ValidationException($"The {nameof(Models.Opportunity)} '{result.Title}' cannot be activated because its end date ('{result.DateEnd:yyyy-MM-dd}') is in the past. Please update the {nameof(Models.Opportunity).ToLower()} before proceeding with activation.");

          eventType = EventType.Update;
          break;

        case Status.Inactive:
          if (result.Status == Status.Inactive) return result;
          if (!Statuses_DeActivatable.Contains(result.Status))
            throw new ValidationException($"{nameof(Models.Opportunity)} can not be deactivated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_DeActivatable)}'");

          eventType = EventType.Update;
          break;

        case Status.Deleted:
          if (result.Status == Status.Deleted) return result;
          if (!Statuses_CanDelete.Contains(result.Status))
            throw new ValidationException($"{nameof(Models.Opportunity)} can not be deleted (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_CanDelete)}'");

          eventType = EventType.Delete;
          break;

        default:
          throw new ArgumentOutOfRangeException(nameof(status), $"{nameof(Status)} of '{status}' not supported");
      }

      var statusId = _opportunityStatusService.GetByName(status.ToString()).Id;

      result.StatusId = statusId;
      result.Status = status;
      result.ModifiedByUserId = user.Id;

      result = await _opportunityRepository.Update(result);

      result.SetPublished();

      //sent when activated irrespective of organization status (sent to admin)
      if (status == Status.Active) await SendEmail(result, EmailType.Opportunity_Posted_Admin);

      await _mediator.Publish(new OpportunityEvent(eventType.Value, result));

      return result;
    }

    public async Task<Models.Opportunity> AssignCategories(Guid id, List<Guid> categoryIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      AssertUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await AssignCategories(result, categoryIds);
        result.ModifiedByUserId = user.Id;
        result = await _opportunityRepository.Update(result);
        scope.Complete();
      });

      await _mediator.Publish(new OpportunityEvent(EventType.Update, result));

      return result;
    }

    public async Task<Models.Opportunity> RemoveCategories(Guid id, List<Guid> categoryIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (categoryIds == null || categoryIds.Count == 0)
        throw new ArgumentNullException(nameof(categoryIds));

      AssertUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await RemoveCategories(result, categoryIds);
        result.ModifiedByUserId = user.Id;
        result = await _opportunityRepository.Update(result);
        scope.Complete();
      });

      await _mediator.Publish(new OpportunityEvent(EventType.Update, result));

      return result;
    }

    public async Task<Models.Opportunity> AssignCountries(Guid id, List<Guid> countryIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      AssertUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await AssignCountries(result, countryIds);
        result.ModifiedByUserId = user.Id;
        result = await _opportunityRepository.Update(result);
        scope.Complete();
      });

      await _mediator.Publish(new OpportunityEvent(EventType.Update, result));

      return result;
    }

    public async Task<Models.Opportunity> RemoveCountries(Guid id, List<Guid> countryIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (countryIds == null || countryIds.Count == 0)
        throw new ArgumentNullException(nameof(countryIds));

      AssertUpdatable(result);

      result = await RemoveCountries(result, countryIds);

      await _mediator.Publish(new OpportunityEvent(EventType.Update, result));

      return result;
    }

    public async Task<Models.Opportunity> AssignLanguages(Guid id, List<Guid> languageIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      AssertUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await AssignLanguages(result, languageIds);
        result.ModifiedByUserId = user.Id;
        result = await _opportunityRepository.Update(result);
        scope.Complete();
      });

      await _mediator.Publish(new OpportunityEvent(EventType.Update, result));

      return result;
    }

    public async Task<Models.Opportunity> RemoveLanguages(Guid id, List<Guid> languageIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (languageIds == null || languageIds.Count == 0)
        throw new ArgumentNullException(nameof(languageIds));

      AssertUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await RemoveLanguages(result, languageIds);
        result.ModifiedByUserId = user.Id;
        result = await _opportunityRepository.Update(result);
        scope.Complete();
      });

      await _mediator.Publish(new OpportunityEvent(EventType.Update, result));

      return result;
    }

    public async Task<Models.Opportunity> AssignSkills(Guid id, List<Guid> skillIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (skillIds == null || skillIds.Count == 0)
        throw new ArgumentNullException(nameof(skillIds));

      AssertUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await AssignSkills(result, skillIds);
        result.ModifiedByUserId = user.Id;
        result = await _opportunityRepository.Update(result);
        scope.Complete();
      });

      await _mediator.Publish(new OpportunityEvent(EventType.Update, result));

      return result;
    }

    public async Task<Models.Opportunity> RemoveSkills(Guid id, List<Guid> skillIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (skillIds == null || skillIds.Count == 0)
        throw new ArgumentNullException(nameof(skillIds));

      AssertUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await RemoveSkills(result, skillIds);
        result.ModifiedByUserId = user.Id;
        result = await _opportunityRepository.Update(result);
        scope.Complete();
      });

      await _mediator.Publish(new OpportunityEvent(EventType.Update, result));

      return result;
    }

    public async Task<Models.Opportunity> AssignVerificationTypes(Guid id, List<OpportunityRequestVerificationType> verificationTypes, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (verificationTypes == null || verificationTypes.Count == 0)
        throw new ArgumentNullException(nameof(verificationTypes));

      AssertUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await AssignVerificationTypes(result, verificationTypes);
        result.ModifiedByUserId = user.Id;
        result = await _opportunityRepository.Update(result);
        scope.Complete();
      });

      await _mediator.Publish(new OpportunityEvent(EventType.Update, result));

      return result;
    }

    public async Task<Models.Opportunity> RemoveVerificationTypes(Guid id, List<VerificationType> verificationTypes, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (verificationTypes == null || verificationTypes.Count == 0)
        throw new ArgumentNullException(nameof(verificationTypes));

      AssertUpdatable(result);

      if (result.VerificationEnabled && (result.VerificationTypes == null || result.VerificationTypes.All(o => verificationTypes.Contains(o.Type))))
        throw new ValidationException("One or more verification types are required when verification is supported. Removal will result in no associated verification types");

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await RemoveVerificationTypes(result, verificationTypes);
        result.ModifiedByUserId = user.Id;
        result = await _opportunityRepository.Update(result);
        scope.Complete();
      });

      await _mediator.Publish(new OpportunityEvent(EventType.Update, result));

      return result;
    }
    #endregion

    #region Private Members
    private static (decimal? Reward, bool? RewardReduced, bool? RewardPoolDepleted) ProcessRewardAllocation(decimal? reward, decimal? rewardPool, decimal? rewardCumulative, bool? rewardReduced, bool? rewardPoolDepleted)
    {
      if (!reward.HasValue) return (reward, rewardReduced, rewardPoolDepleted);

      // process reward if the current level has a pool and the higher level has not been depleted
      if (rewardPool.HasValue && rewardPoolDepleted != true) // executes when rewardPoolDepleted is null or false, preserving higher-level depletion if already marked as true
      {
        // calculate the remainder of rewardPool - rewardCumulative, treating null as 0
        var remainder = rewardPool.Value - (rewardCumulative ?? default);

        // if remainder >= reward, reward stays the same; otherwise, it becomes the remainder
        var rewardOriginal = reward;
        reward = Math.Max(Math.Min(remainder, reward.Value), default);

        // set flag indicating if the pool has been depleted
        rewardPoolDepleted = remainder <= default(decimal);

        // set flag indicating if the reward was reduced; only set if null or false, preserving the higher-level reduction if already marked as true
        if (rewardReduced != true) rewardReduced = reward < rewardOriginal;
      }

      return (reward, rewardReduced, rewardPoolDepleted);
    }

    private static void AssertUpdatable(Models.Opportunity opportunity)
    {
      if (!Statuses_Updatable.Contains(opportunity.Status))
        throw new ValidationException($"{nameof(Models.Opportunity)} can no longer be updated (current status '{opportunity.Status}'). Required state '{string.Join(" / ", Statuses_Updatable)}'");
    }

    private async Task AssertUpdatablePartnerSharing(OpportunityRequestUpdate request, Models.Opportunity opportunityCurrent)
    {
      var reasons = new List<string>();

      if (opportunityCurrent.ShareWithPartners == true && request.ShareWithPartners != true)
        reasons.Add("Option to share with partners cannot be disabled after it has been enabled");

      if (opportunityCurrent.DateEnd.HasValue && !request.DateEnd.HasValue)
        reasons.Add("End date cannot be removed once it has been set");

      if (opportunityCurrent.TypeId != request.TypeId)
        reasons.Add("Type cannot be changed");

      if (reasons.Count == 0) return;

      var shared = await _sharingInfoService.IsShared(PartnerSharing.EntityType.Opportunity, opportunityCurrent.Id, true);
      if (!shared) return;

      var reasonText = string.Join("; ", reasons);

      throw new ValidationException($"The {nameof(Models.Opportunity)} has already been shared and cannot be updated for the following reasons: {reasonText}");
    }

    private async Task SendEmail(Models.Opportunity opportunity, EmailType type)
    {
      try
      {
        List<EmailRecipient>? recipients = null;
        switch (type)
        {
          case EmailType.Opportunity_Posted_Admin:
            var superAdmins = await _identityProviderClient.ListByRole(Constants.Role_Admin);
            recipients = superAdmins?.Select(o => new EmailRecipient { Email = o.Email, DisplayName = o.ToDisplayName() }).ToList();

            break;

          default:
            throw new ArgumentOutOfRangeException(nameof(type), $"Type of '{type}' not supported");
        }

        recipients = _emailPreferenceFilterService.FilterRecipients(type, recipients);
        if (recipients == null || recipients.Count == 0) return;

        var data = new EmailOpportunityAnnounced
        {
          Opportunities = [new()
          {
            Title = opportunity.Title,
            DateStart = opportunity.DateStart,
            DateEnd = opportunity.DateEnd,
            URL = _emailURLFactory.OpportunityAnnouncedItemURL(type, opportunity.Id, opportunity.OrganizationId),
            ZltoReward = opportunity.ZltoReward,
            YomaReward = opportunity.YomaReward
          }]
        };

        await _emailProviderClient.Send(type, recipients, data);

        _logger.LogInformation("Successfully send email");
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to send email");
      }
    }

    private Organization? SearchCriteriaAdminValidateRequest(Guid? organizationId, bool ensureOrganizationAuthorization)
    {
      if (!organizationId.HasValue)
      {
        if (!HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
          throw new ValidationException($"Organization required for '{Constants.Role_OrganizationAdmin}' role only");

        return null;
      }

      if (organizationId.Value == Guid.Empty)
        throw new ArgumentNullException(nameof(organizationId));

      return _organizationService.GetById(organizationId.Value, false, false, ensureOrganizationAuthorization);
    }

    private static void ParseOpportunitySearchFilterCommitmentInterval(OpportunitySearchFilterAdmin filter)
    {
      if (filter.CommitmentInterval == null || filter.CommitmentInterval.Options == null || filter.CommitmentInterval.Options.Count == 0)
        return;
      filter.CommitmentInterval.Options = filter.CommitmentInterval.Options.Distinct().ToList();

      filter.CommitmentInterval.OptionsParsed = [];

      foreach (var item in filter.CommitmentInterval.Options)
      {
        var parts = item?.Split('|');
        if (parts?.Length != 2 || !short.TryParse(parts[0], out var count) || !Guid.TryParse(parts[1], out var id))
          throw new ArgumentException($"Commitment interval id of '{item}' does not match the expected format", nameof(filter));

        filter.CommitmentInterval.OptionsParsed.Add(new OpportunitySearchFilterCommitmentIntervalItem { Id = id, Count = count });
      }
    }

    private static void ParseOpportunitySearchFilterZltoReward(OpportunitySearchFilterAdmin filter)
    {
      if (filter.ZltoReward == null || filter.ZltoReward.Ranges == null || filter.ZltoReward.Ranges.Count == 0)
        return;
      filter.ZltoReward.Ranges = filter.ZltoReward.Ranges.Distinct().ToList();

      filter.ZltoReward.RangesParsed = [];

      foreach (var item in filter.ZltoReward.Ranges)
      {
        var parts = item?.Split('|');
        if (parts?.Length != 2 || !decimal.TryParse(parts[0], out var from) || !decimal.TryParse(parts[1], out var to))
          throw new ArgumentException($"Commitment interval id of '{item}' does not match the expected format", nameof(filter));

        filter.ZltoReward.RangesParsed.Add(new OpportunitySearchFilterZltoRewardRange { From = from, To = to });
      }
    }

    private string? GetBlobObjectURL(StorageType? storageType, string? key)
    {
      if (!storageType.HasValue || string.IsNullOrEmpty(key)) return null;
      return _blobService.GetURL(storageType.Value, key);
    }

    private async Task<Models.Opportunity> AssignCountries(Models.Opportunity opportunity, List<Guid> countryIds)
    {
      if (countryIds == null || countryIds.Count == 0)
        throw new ArgumentNullException(nameof(countryIds));

      countryIds = countryIds.Distinct().ToList();

      var results = new List<Domain.Lookups.Models.Country>();

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
        foreach (var countryId in countryIds)
        {
          var country = _countryService.GetById(countryId);
          results.Add(country);

          var item = _opportunityCountryRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.CountryId == country.Id);

          if (item != null) continue;
          item = new OpportunityCountry
          {
            OpportunityId = opportunity.Id,
            CountryId = country.Id
          };

          await _opportunityCountryRepository.Create(item);

          opportunity.Countries ??= [];
          opportunity.Countries.Add(new Domain.Lookups.Models.Country { Id = country.Id, Name = country.Name, CodeAlpha2 = country.CodeAlpha2, CodeAlpha3 = country.CodeAlpha3, CodeNumeric = country.CodeNumeric });
        }

        scope.Complete();
      });

      return opportunity;
    }

    private async Task<Models.Opportunity> RemoveCountries(Models.Opportunity opportunity, List<Guid>? countryIds)
    {
      if (countryIds == null || countryIds.Count == 0) return opportunity;

      countryIds = countryIds.Distinct().ToList();

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
        foreach (var countryId in countryIds)
        {
          var country = _countryService.GetById(countryId);

          var item = _opportunityCountryRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.CountryId == country.Id);
          if (item == null) continue;

          await _opportunityCountryRepository.Delete(item);

          opportunity.Countries?.Remove(opportunity.Countries.Single(o => o.Id == country.Id));
        }

        scope.Complete();
      });

      return opportunity;
    }

    private async Task<Models.Opportunity> AssignCategories(Models.Opportunity opportunity, List<Guid> categoryIds)
    {
      if (categoryIds == null || categoryIds.Count == 0)
        throw new ArgumentNullException(nameof(categoryIds));

      categoryIds = categoryIds.Distinct().ToList();

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
        foreach (var categoryId in categoryIds)
        {
          var category = _opportunityCategoryService.GetById(categoryId);

          var item = _opportunityCategoryRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.CategoryId == category.Id);
          if (item != null) continue;

          item = new OpportunityCategory
          {
            OpportunityId = opportunity.Id,
            CategoryId = category.Id
          };

          await _opportunityCategoryRepository.Create(item);

          opportunity.Categories ??= [];
          opportunity.Categories.Add(new Models.Lookups.OpportunityCategory { Id = category.Id, Name = category.Name, ImageURL = category.ImageURL });
        }

        scope.Complete();
      });

      return opportunity;
    }

    private async Task<Models.Opportunity> RemoveCategories(Models.Opportunity opportunity, List<Guid>? categoryIds)
    {
      if (categoryIds == null || categoryIds.Count == 0) return opportunity;

      categoryIds = categoryIds.Distinct().ToList();

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
        foreach (var categoryId in categoryIds)
        {
          var category = _opportunityCategoryService.GetById(categoryId);

          var item = _opportunityCategoryRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.CategoryId == category.Id);
          if (item == null) continue;

          await _opportunityCategoryRepository.Delete(item);

          opportunity.Categories?.Remove(opportunity.Categories.Single(o => o.Id == category.Id));
        }

        scope.Complete();
      });

      return opportunity;
    }

    private async Task<Models.Opportunity> AssignLanguages(Models.Opportunity opportunity, List<Guid> languageIds)
    {
      if (languageIds == null || languageIds.Count == 0)
        throw new ArgumentNullException(nameof(languageIds));

      languageIds = languageIds.Distinct().ToList();

      var results = new List<Domain.Lookups.Models.Language>();

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
        foreach (var languageId in languageIds)
        {
          var language = _languageService.GetById(languageId);
          results.Add(language);

          var item = _opportunityLanguageRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.LanguageId == language.Id);
          if (item != null) continue;

          item = new OpportunityLanguage
          {
            OpportunityId = opportunity.Id,
            LanguageId = language.Id
          };

          await _opportunityLanguageRepository.Create(item);

          opportunity.Languages ??= [];
          opportunity.Languages.Add(new Domain.Lookups.Models.Language { Id = language.Id, Name = language.Name, CodeAlpha2 = language.CodeAlpha2 });
        }

        scope.Complete();
      });

      return opportunity;
    }

    private async Task<Models.Opportunity> RemoveLanguages(Models.Opportunity opportunity, List<Guid>? languageIds)
    {
      if (languageIds == null || languageIds.Count == 0) return opportunity;

      languageIds = languageIds.Distinct().ToList();

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
        foreach (var languageId in languageIds)
        {
          var language = _languageService.GetById(languageId);

          var item = _opportunityLanguageRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.LanguageId == language.Id);
          if (item == null) continue;

          await _opportunityLanguageRepository.Delete(item);

          opportunity.Languages?.Remove(opportunity.Languages.Single(o => o.Id == language.Id));
        }

        scope.Complete();
      });

      return opportunity;
    }

    private async Task<Models.Opportunity> AssignSkills(Models.Opportunity opportunity, List<Guid>? skillIds)
    {
      if (skillIds == null || skillIds.Count == 0) return opportunity; //skills are optional

      skillIds = skillIds.Distinct().ToList();

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
        foreach (var skillId in skillIds)
        {
          var skill = _skillService.GetById(skillId);

          var item = _opportunitySkillRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.SkillId == skill.Id);
          if (item != null) continue;

          item = new OpportunitySkill
          {
            OpportunityId = opportunity.Id,
            SkillId = skill.Id
          };

          await _opportunitySkillRepository.Create(item);

          opportunity.Skills ??= [];
          opportunity.Skills.Add(new Domain.Lookups.Models.Skill { Id = skill.Id, Name = skill.Name, InfoURL = skill.InfoURL });
        }

        scope.Complete();
      });

      return opportunity;
    }

    private async Task<Models.Opportunity> RemoveSkills(Models.Opportunity opportunity, List<Guid>? skillIds)
    {
      if (skillIds == null || skillIds.Count == 0) return opportunity;

      skillIds = skillIds.Distinct().ToList();

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
        foreach (var skillId in skillIds)
        {
          var skill = _skillService.GetById(skillId);

          var item = _opportunitySkillRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.SkillId == skill.Id);
          if (item == null) continue;

          await _opportunitySkillRepository.Delete(item);

          opportunity.Skills?.Remove(opportunity.Skills.Single(o => o.Id == skill.Id));
        }

        scope.Complete();
      });

      return opportunity;
    }

    private async Task<Models.Opportunity> AssignVerificationTypes(Models.Opportunity opportunity, List<OpportunityRequestVerificationType>? verificationTypes)
    {
      if (verificationTypes == null || verificationTypes.Count == 0) return opportunity; //verification types is optional

      var results = new List<Models.Lookups.OpportunityVerificationType>();

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
        foreach (var type in verificationTypes)
        {
          var verificationType = _opportunityVerificationTypeService.GetByType(type.Type);
          results.Add(verificationType);

          var desc = type.Description?.Trim();
          if (string.IsNullOrEmpty(desc)) desc = null;

          var item = _opportunityVerificationTypeRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.VerificationTypeId == verificationType.Id);
          if (item != null)
          {
            //update (custom specified) or remove (defaults to lookup description)
            item.Description = desc;
            await _opportunityVerificationTypeRepository.Update(item);

            continue;
          }

          item = new OpportunityVerificationType
          {
            OpportunityId = opportunity.Id,
            VerificationTypeId = verificationType.Id,
            Description = desc
          };

          await _opportunityVerificationTypeRepository.Create(item);

          opportunity.VerificationTypes ??= [];
          opportunity.VerificationTypes.Add(new Models.Lookups.OpportunityVerificationType
          {
            Id = verificationType.Id,
            Type = verificationType.Type,
            DisplayName = verificationType.DisplayName,
            Description = item.Description ?? verificationType.Description
          });
        }

        scope.Complete();
      });

      return opportunity;
    }

    private async Task<Models.Opportunity> RemoveVerificationTypes(Models.Opportunity opportunity, List<VerificationType>? verificationTypes)
    {
      if (verificationTypes == null || verificationTypes.Count == 0) return opportunity;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
        foreach (var type in verificationTypes)
        {
          var verificationType = _opportunityVerificationTypeService.GetByType(type);

          var item = _opportunityVerificationTypeRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.VerificationTypeId == verificationType.Id);
          if (item == null) continue;

          await _opportunityVerificationTypeRepository.Delete(item);

          opportunity.VerificationTypes?.Remove(opportunity.VerificationTypes.Single(o => o.Id == verificationType.Id));
        }

        scope.Complete();
      });

      return opportunity;
    }
    #endregion
  }
}
