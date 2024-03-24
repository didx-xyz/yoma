using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Transactions;
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
using Yoma.Core.Domain.IdentityProvider.Helpers;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Validators;

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
    private readonly IOpportunityVerificationTypeService _opportunityVerificationTypeService;
    private readonly ITimeIntervalService _timeIntervalService;
    private readonly IBlobService _blobService;
    private readonly IUserService _userService;
    private readonly IEmailURLFactory _emailURLFactory;
    private readonly IEmailProviderClient _emailProviderClient;
    private readonly IIdentityProviderClient _identityProviderClient;

    private readonly OpportunityRequestValidatorCreate _opportunityRequestValidatorCreate;
    private readonly OpportunityRequestValidatorUpdate _opportunityRequestValidatorUpdate;
    private readonly OpportunitySearchFilterValidator _opportunitySearchFilterValidator;
    private readonly OpportunitySearchFilterCriteriaValidator _opportunitySearchFilterCriteriaValidator;

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
        IOpportunityVerificationTypeService opportunityVerificationTypeService,
        ITimeIntervalService timeIntervalService,
        IBlobService blobService,
        IUserService userService,
        IEmailURLFactory emailURLFactory,
        IEmailProviderClientFactory emailProviderClientFactory,
        IIdentityProviderClientFactory identityProviderClientFactory,
        OpportunityRequestValidatorCreate opportunityRequestValidatorCreate,
        OpportunityRequestValidatorUpdate opportunityRequestValidatorUpdate,
        OpportunitySearchFilterValidator opportunitySearchFilterValidator,
        OpportunitySearchFilterCriteriaValidator opportunitySearchFilterCriteriaValidator,
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
      _opportunityVerificationTypeService = opportunityVerificationTypeService;
      _timeIntervalService = timeIntervalService;
      _blobService = blobService;
      _userService = userService;
      _emailURLFactory = emailURLFactory;
      _emailProviderClient = emailProviderClientFactory.CreateClient();
      _identityProviderClient = identityProviderClientFactory.CreateClient();

      _opportunityRequestValidatorCreate = opportunityRequestValidatorCreate;
      _opportunityRequestValidatorUpdate = opportunityRequestValidatorUpdate;
      _opportunitySearchFilterValidator = opportunitySearchFilterValidator;
      _opportunitySearchFilterCriteriaValidator = opportunitySearchFilterCriteriaValidator;

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
        result.OrganizationLogoURL = GetBlobObjectURL(result.OrganizationLogoId);
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
        result.OrganizationLogoURL = GetBlobObjectURL(result.OrganizationLogoId);
      }

      return result;
    }

    public List<Models.Opportunity> Contains(string value, bool includeComputed)
    {
      if (string.IsNullOrWhiteSpace(value))
        throw new ArgumentNullException(nameof(value));
      value = value.Trim();

      var results = _opportunityRepository.Contains(_opportunityRepository.Query(), value).ToList();

      if (includeComputed)
        results.ForEach(o =>
        {
          o.SetPublished();
          o.OrganizationLogoURL = GetBlobObjectURL(o.OrganizationLogoId);
        });

      return results;
    }

    public OpportunitySearchResultsCriteria SearchCriteriaOpportunities(OpportunitySearchFilterCriteria filter, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(filter);

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

      var results = new OpportunitySearchResultsCriteria();
      query = query.OrderBy(o => o.Title);

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

      var results = _opportunityCategoryService.List().Where(o => categoryIds.Contains(o.Id)).OrderBy(o => o.Name).ToList();

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

      var results = _opportunityCategoryService.List().Where(o => categoryIds.Contains(o.Id)).OrderBy(o => o.Name).ToList();

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
                .OrderBy(o => o.CodeAlpha2 != Country.Worldwide.ToDescription()).ThenBy(o => o.Name)]; //esnure Worldwide appears first
    }

    public List<Domain.Lookups.Models.Country> ListOpportunitySearchCriteriaCountries(List<PublishedState>? publishedStates)
    {
      publishedStates = publishedStates == null || publishedStates.Count == 0 ?
              [PublishedState.NotStarted, PublishedState.Active] : publishedStates;

      var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;
      var query = _opportunityCountryRepository.Query().Where(o => o.OrganizationStatusId == organizationStatusActiveId);

      var statusActiveId = _opportunityStatusService.GetByName(Status.Active.ToString()).Id;
      var statusExpiredId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;

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

      var countryIds = query.Select(o => o.CountryId).Distinct().ToList();

      return [.. _countryService.List().Where(o => countryIds.Contains(o.Id))
                .OrderBy(o => o.CodeAlpha2 != Country.Worldwide.ToDescription()).ThenBy(o => o.Name)]; //esnure Worldwide appears first
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

    public List<Domain.Lookups.Models.Language> ListOpportunitySearchCriteriaLanguages(List<PublishedState>? publishedStates)
    {
      publishedStates = publishedStates == null || publishedStates.Count == 0 ?
             [PublishedState.NotStarted, PublishedState.Active] : publishedStates;

      var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;
      var query = _opportunityLanguageRepository.Query().Where(o => o.OrganizationStatusId == organizationStatusActiveId);

      var statusActiveId = _opportunityStatusService.GetByName(Status.Active.ToString()).Id;
      var statusExpiredId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;

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

      var languageIds = query.Select(o => o.LanguageId).Distinct().ToList();

      return [.. _languageService.List().Where(o => languageIds.Contains(o.Id)).OrderBy(o => o.Name)];
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

      var organizationIds = query.Select(o => o.OrganizationId).Distinct().ToList();

      var filter = new OrganizationSearchFilter
      {
        Organizations = organizationIds,
        Statuses = [Status.Active],
        InternalUse = true
      };

      return _organizationService.Search(filter, false).Items;
    }

    public List<OpportunitySearchCriteriaCommitmentInterval> ListOpportunitySearchCriteriaCommitmentInterval(List<PublishedState>? publishedStates)
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

      var results = query
              .Select(item => new OpportunitySearchCriteriaCommitmentInterval
              {
                Id = $"{item.CommitmentIntervalCount}|{item.CommitmentIntervalId}",
                Name = $"{item.CommitmentIntervalCount} {item.CommitmentInterval}{(item.CommitmentIntervalCount > 1 ? "s" : string.Empty)}",
              })
          .Distinct()
          .ToList();

      return [.. results.OrderBy(o => o.Name)];
    }

    public List<OpportunitySearchCriteriaZltoReward> ListOpportunitySearchCriteriaZltoReward(List<PublishedState>? publishedStates)
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

      var results = new List<OpportunitySearchCriteriaZltoReward>();
      for (decimal i = roundedMinValue; i < roundedMaxValue; i += increment)
      {
        var from = i;
        var to = Math.Min(i + increment, roundedMaxValue);
        var id = $"{from}|{to}";
        var description = $"Z{from} - Z{to}";

        results.Add(new OpportunitySearchCriteriaZltoReward
        {
          Id = id,
          Name = description
        });
      }

      return results;
    }

    public OpportunitySearchResults Search(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(filter);

      ParseOpportunitySearchFilterCommitmentIntervals(filter);
      ParseOpportunitySearchFilterZltoRewardRanges(filter);

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

      //organization (explicitly specified)
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

      //types (explicitly specified)
      if (filter.Types != null && filter.Types.Count != 0)
      {
        filter.Types = filter.Types.Distinct().ToList();
        query = query.Where(o => filter.Types.Contains(o.TypeId));
      }

      //categories (explicitly specified)
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

      //commitmentIntervals
      if (filter.CommitmentIntervalsParsed != null && filter.CommitmentIntervalsParsed.Count != 0)
      {
        var intervalIds = filter.CommitmentIntervalsParsed.Select(item => item.Id).Distinct().ToList();
        var intervalCounts = filter.CommitmentIntervalsParsed.Select(item => item.Count).Distinct().ToList();
        query = query.Where(o => intervalIds.Contains(o.CommitmentIntervalId) && intervalCounts.Contains(o.CommitmentIntervalCount));
      }

      //zltoRewardRanges
      if (filter.ZltoRewardRangesParsed != null && filter.ZltoRewardRangesParsed.Count != 0)
      {
        var distinctItems = filter.ZltoRewardRangesParsed
            .Select(item => new { item.From, item.To })
            .Distinct()
            .ToList();

        query = query.Where(o => o.ZltoReward.HasValue);

        var predicate = PredicateBuilder.False<Models.Opportunity>();
        foreach (var item in distinctItems)
          predicate = predicate.Or(o => o.ZltoReward >= item.From && o.ZltoReward <= item.To);

        query = query.Where(predicate);
      }

      //valueContains (includes organizations, types, categories, opportunities and skills)
      if (!string.IsNullOrEmpty(filter.ValueContains))
      {
        var predicate = PredicateBuilder.False<Models.Opportunity>();

        //organizations
        var matchedOrganizationIds = _organizationService.Contains(filter.ValueContains, false).Select(o => o.Id).Distinct().ToList();
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
        o.OrganizationLogoURL = GetBlobObjectURL(o.OrganizationLogoId);
      });

      return result;
    }

    public async Task<Models.Opportunity> Create(OpportunityRequestCreate request, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(request);

      request.URL = request.URL?.EnsureHttpsScheme();

      await _opportunityRequestValidatorCreate.ValidateAndThrowAsync(request);

      request.DateStart = request.DateStart.RemoveTime();
      if (request.DateEnd.HasValue) request.DateEnd = request.DateEnd.Value.ToEndOfDay();

      if (ensureOrganizationAuthorization)
        _organizationService.IsAdmin(request.OrganizationId, true);

      var existingByTitle = GetByTitleOrNull(request.Title, false, false);
      if (existingByTitle != null)
        throw new ValidationException($"{nameof(Models.Opportunity)} with the specified name '{request.Title}' already exists");

      var status = request.PostAsActive ? Status.Active : Status.Inactive;
      if (request.DateEnd.HasValue && request.DateEnd.Value <= DateTimeOffset.UtcNow)
      {
        if (request.PostAsActive)
          throw new ValidationException($"{nameof(Models.Opportunity)} with the specified name '{request.Title}' has already ended and can not be posted as active");
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
        OrganizationLogoURL = organization.LogoURL,
        Summary = request.Summary,
        Instructions = request.Instructions,
        URL = request.URL,
        ZltoReward = request.ZltoReward,
        YomaReward = request.YomaReward,
        ZltoRewardPool = request.ZltoRewardPool,
        YomaRewardPool = request.YomaRewardPool,
        VerificationEnabled = request.VerificationEnabled,
        VerificationMethod = request.VerificationMethod,
        DifficultyId = request.DifficultyId,
        Difficulty = _opportunityDifficultyService.GetById(request.DifficultyId).Name,
        CommitmentIntervalId = request.CommitmentIntervalId,
        CommitmentInterval = _timeIntervalService.GetById(request.CommitmentIntervalId).Name,
        CommitmentIntervalCount = request.CommitmentIntervalCount,
        CommitmentIntervalDescription = $"{request.CommitmentIntervalCount} {_timeIntervalService.GetById(request.CommitmentIntervalId).Name}{(request.CommitmentIntervalCount > 1 ? "s" : string.Empty)}",
        ParticipantLimit = request.ParticipantLimit,
        KeywordsFlatten = request.Keywords == null ? null : string.Join(Keywords_Separator, request.Keywords),
        Keywords = request.Keywords,
        DateStart = request.DateStart,
        DateEnd = !request.DateEnd.HasValue ? null : request.DateEnd.Value,
        CredentialIssuanceEnabled = request.CredentialIssuanceEnabled,
        SSISchemaName = request.SSISchemaName,
        StatusId = _opportunityStatusService.GetByName(status.ToString()).Id,
        Status = status,
        CreatedByUserId = user.Id,
        ModifiedByUserId = user.Id
      };

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

      if (result.Status == Status.Active) await SendEmail(result, EmailType.Opportunity_Posted_Admin);

      return result;
    }

    public async Task<Models.Opportunity> Update(OpportunityRequestUpdate request, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(request);

      request.URL = request.URL?.EnsureHttpsScheme();

      await _opportunityRequestValidatorUpdate.ValidateAndThrowAsync(request);

      request.DateStart = request.DateStart.RemoveTime();
      if (request.DateEnd.HasValue) request.DateEnd = request.DateEnd.Value.ToEndOfDay();

      if (ensureOrganizationAuthorization)
        _organizationService.IsAdmin(request.OrganizationId, true);

      var result = GetById(request.Id, true, true, false);

      ValidateUpdatable(result);

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
        result.Status = Status.Expired;
        result.StatusId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;
      }

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
      result.VerificationEnabled = request.VerificationEnabled;
      result.VerificationMethod = request.VerificationMethod;
      result.DifficultyId = request.DifficultyId;
      result.Difficulty = _opportunityDifficultyService.GetById(request.DifficultyId).Name;
      result.CommitmentIntervalId = request.CommitmentIntervalId;
      result.CommitmentInterval = _timeIntervalService.GetById(request.CommitmentIntervalId).Name;
      result.CommitmentIntervalCount = request.CommitmentIntervalCount;
      result.CommitmentIntervalDescription = $"{request.CommitmentIntervalCount} {_timeIntervalService.GetById(request.CommitmentIntervalId).Name}{(request.CommitmentIntervalCount > 1 ? "s" : string.Empty)}";
      result.ParticipantLimit = request.ParticipantLimit;
      result.KeywordsFlatten = request.Keywords == null ? null : string.Join(Keywords_Separator, request.Keywords);
      result.Keywords = request.Keywords;
      result.DateStart = request.DateStart;
      result.DateEnd = !request.DateEnd.HasValue ? null : request.DateEnd.Value;
      result.CredentialIssuanceEnabled = request.CredentialIssuanceEnabled;
      result.SSISchemaName = request.SSISchemaName;
      result.ModifiedByUserId = user.Id;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
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

      return result;
    }

    public async Task<(decimal? ZltoReward, decimal? YomaReward)> AllocateRewards(Guid id, Guid userId, bool ensureOrganizationAuthorization)
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

        throw new ValidationException($"Oportunity '{opportunity.Title}' rewards can no longer be allocated, because {reasonText}. Please check these conditions and try again");
      }

      var count = (opportunity.ParticipantCount ?? 0) + 1;
      if (opportunity.ParticipantLimit.HasValue && count > opportunity.ParticipantLimit.Value)
        throw new ValidationException($"Increment will exceed limit (current count '{opportunity.ParticipantCount ?? 0}' vs current limit '{opportunity.ParticipantLimit.Value}')");

      var user = _userService.GetById(userId, false, false);

      opportunity.ParticipantCount = count;

      var zltoReward = opportunity.ZltoReward;
      if (zltoReward.HasValue)
      {
        if (opportunity.ZltoRewardPool.HasValue)
        {
          // calculate the remainder of ZltoRewardPool - ZltoRewardCumulative, treating null as 0
          var remainder = opportunity.ZltoRewardPool.Value - (opportunity.ZltoRewardCumulative ?? 0);

          // if remainder >= zltoReward, zltoReward stays the same; otherwise, it becomes the remainder
          zltoReward = Math.Max(Math.Min(remainder, zltoReward.Value), 0);
        }

        // update ZltoRewardCumulative, treating null as 0 for the addition
        opportunity.ZltoRewardCumulative = (opportunity.ZltoRewardCumulative ?? 0) + zltoReward.Value;
      }

      var yomaReward = opportunity.YomaReward;
      if (yomaReward.HasValue)
      {
        if (opportunity.YomaRewardPool.HasValue)
        {
          // calculate the remainder of YomaRewardPool - YomaRewardCumulative, treating null as 0
          var remainder = opportunity.YomaRewardPool.Value - (opportunity.YomaRewardCumulative ?? 0);

          // if remainder >= yomaReward, yomaReward stays the same; otherwise, it becomes the remainder
          yomaReward = Math.Max(Math.Min(remainder, yomaReward.Value), 0);
        }

        // update YomaRewardCumulative, treating null as 0 for the addition
        opportunity.YomaRewardCumulative = (opportunity.YomaRewardCumulative ?? 0) + yomaReward.Value;
      }

      opportunity.ModifiedByUserId = user.Id;

      //modifiedBy preserved
      await _opportunityRepository.Update(opportunity);

      return (zltoReward, yomaReward);
    }

    public async Task<Models.Opportunity> UpdateStatus(Guid id, Status status, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      switch (status)
      {
        case Status.Active:
          if (result.Status == Status.Active) return result;
          if (!Statuses_Activatable.Contains(result.Status))
            throw new ValidationException($"{nameof(Models.Opportunity)} can not be activated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_Activatable)}'");

          //ensure DateEnd was updated for re-activation of previously expired opportunities
          if (result.DateEnd.HasValue && result.DateEnd <= DateTimeOffset.UtcNow)
            throw new ValidationException($"The {nameof(Models.Opportunity)} '{result.Title}' cannot be activated because its end date ('{result.DateEnd:yyyy-MM-dd}') is in the past. Please update the {nameof(Models.Opportunity).ToLower()} before proceeding with activation.");

          break;

        case Status.Inactive:
          if (result.Status == Status.Inactive) return result;
          if (!Statuses_DeActivatable.Contains(result.Status))
            throw new ValidationException($"{nameof(Models.Opportunity)} can not be deactivated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_DeActivatable)}'");
          break;

        case Status.Deleted:
          if (result.Status == Status.Deleted) return result;
          if (!Statuses_CanDelete.Contains(result.Status))
            throw new ValidationException($"{nameof(Models.Opportunity)} can not be deleted (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_CanDelete)}'");

          break;

        default:
          throw new ArgumentOutOfRangeException(nameof(status), $"{nameof(Status)} of '{status}' not supported");
      }

      var statusId = _opportunityStatusService.GetByName(status.ToString()).Id;

      result.StatusId = statusId;
      result.Status = status;
      result.ModifiedByUserId = user.Id;

      result = await _opportunityRepository.Update(result);

      if (status == Status.Active) await SendEmail(result, EmailType.Opportunity_Posted_Admin);

      return result;
    }

    public async Task<Models.Opportunity> AssignCategories(Guid id, List<Guid> categoryIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      ValidateUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await AssignCategories(result, categoryIds);
        result.ModifiedByUserId = user.Id;
        result = await _opportunityRepository.Update(result);
        scope.Complete();
      });

      return result;
    }

    public async Task<Models.Opportunity> RemoveCategories(Guid id, List<Guid> categoryIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (categoryIds == null || categoryIds.Count == 0)
        throw new ArgumentNullException(nameof(categoryIds));

      ValidateUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await RemoveCategories(result, categoryIds);
        result.ModifiedByUserId = user.Id;
        result = await _opportunityRepository.Update(result);
        scope.Complete();
      });

      return result;
    }

    public async Task<Models.Opportunity> AssignCountries(Guid id, List<Guid> countryIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      ValidateUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await AssignCountries(result, countryIds);
        result.ModifiedByUserId = user.Id;
        result = await _opportunityRepository.Update(result);
        scope.Complete();
      });

      return result;
    }

    public async Task<Models.Opportunity> RemoveCountries(Guid id, List<Guid> countryIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (countryIds == null || countryIds.Count == 0)
        throw new ArgumentNullException(nameof(countryIds));

      ValidateUpdatable(result);

      result = await RemoveCountries(result, countryIds);

      return result;
    }

    public async Task<Models.Opportunity> AssignLanguages(Guid id, List<Guid> languageIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      ValidateUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await AssignLanguages(result, languageIds);
        result.ModifiedByUserId = user.Id;
        result = await _opportunityRepository.Update(result);
        scope.Complete();
      });

      return result;
    }

    public async Task<Models.Opportunity> RemoveLanguages(Guid id, List<Guid> languageIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (languageIds == null || languageIds.Count == 0)
        throw new ArgumentNullException(nameof(languageIds));

      ValidateUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await RemoveLanguages(result, languageIds);
        result.ModifiedByUserId = user.Id;
        result = await _opportunityRepository.Update(result);
        scope.Complete();
      });

      return result;
    }

    public async Task<Models.Opportunity> AssignSkills(Guid id, List<Guid> skillIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (skillIds == null || skillIds.Count == 0)
        throw new ArgumentNullException(nameof(skillIds));

      ValidateUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await AssignSkills(result, skillIds);
        result.ModifiedByUserId = user.Id;
        result = await _opportunityRepository.Update(result);
        scope.Complete();
      });

      return result;
    }

    public async Task<Models.Opportunity> RemoveSkills(Guid id, List<Guid> skillIds, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (skillIds == null || skillIds.Count == 0)
        throw new ArgumentNullException(nameof(skillIds));

      ValidateUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await RemoveSkills(result, skillIds);
        result.ModifiedByUserId = user.Id;
        result = await _opportunityRepository.Update(result);
        scope.Complete();
      });

      return result;
    }

    public async Task<Models.Opportunity> AssignVerificationTypes(Guid id, List<OpportunityRequestVerificationType> verificationTypes, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (verificationTypes == null || verificationTypes.Count == 0)
        throw new ArgumentNullException(nameof(verificationTypes));

      ValidateUpdatable(result);

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await AssignVerificationTypes(result, verificationTypes);
        result.ModifiedByUserId = user.Id;
        result = await _opportunityRepository.Update(result);
        scope.Complete();
      });

      return result;
    }

    public async Task<Models.Opportunity> RemoveVerificationTypes(Guid id, List<VerificationType> verificationTypes, bool ensureOrganizationAuthorization)
    {
      var result = GetById(id, true, true, ensureOrganizationAuthorization);

      if (verificationTypes == null || verificationTypes.Count == 0)
        throw new ArgumentNullException(nameof(verificationTypes));

      ValidateUpdatable(result);

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

      return result;
    }
    #endregion

    #region Private Members
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

        if (recipients == null || recipients.Count == 0) return;

        var data = new EmailOpportunityPosted
        {
          Opportunities = [new()
          {
            Title = opportunity.Title,
            DateStart = opportunity.DateStart,
            DateEnd = opportunity.DateEnd,
            URL = _emailURLFactory.OpportunityPostedItemURL(type, opportunity.Id, opportunity.OrganizationId),
            ZltoReward = opportunity.ZltoReward,
            YomaReward = opportunity.YomaReward
          }]
        };

        await _emailProviderClient.Send(type, recipients, data);

        _logger.LogInformation("Successfully send '{emailType}' email", type);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to send '{emailType}' email", type);
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

    private static void ParseOpportunitySearchFilterCommitmentIntervals(OpportunitySearchFilterAdmin filter)
    {
      if (filter.CommitmentIntervals == null || filter.CommitmentIntervals.Count == 0)
        return;
      filter.CommitmentIntervals = filter.CommitmentIntervals.Distinct().ToList();

      filter.CommitmentIntervalsParsed = [];

      foreach (var item in filter.CommitmentIntervals)
      {
        var parts = item?.Split('|');
        if (parts?.Length != 2 || !short.TryParse(parts[0], out var count) || !Guid.TryParse(parts[1], out var id))
          throw new ArgumentException($"Commitment interval id of '{item}' does not match the expected format", nameof(filter));

        filter.CommitmentIntervalsParsed.Add(new OpportunitySearchFilterCommitmentInterval { Id = id, Count = count });
      }
    }

    private static void ParseOpportunitySearchFilterZltoRewardRanges(OpportunitySearchFilterAdmin filter)
    {
      if (filter.ZltoRewardRanges == null || filter.ZltoRewardRanges.Count == 0)
        return;
      filter.ZltoRewardRanges = filter.ZltoRewardRanges.Distinct().ToList();

      filter.ZltoRewardRangesParsed = [];

      foreach (var item in filter.ZltoRewardRanges)
      {
        var parts = item?.Split('|');
        if (parts?.Length != 2 || !decimal.TryParse(parts[0], out var from) || !decimal.TryParse(parts[1], out var to))
          throw new ArgumentException($"Commitment interval id of '{item}' does not match the expected format", nameof(filter));

        filter.ZltoRewardRangesParsed.Add(new OpportunitySearchFilterZltoReward { From = from, To = to });
      }
    }

    private string? GetBlobObjectURL(Guid? id)
    {
      if (!id.HasValue) return null;
      return _blobService.GetURL(id.Value);
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

    private static void ValidateUpdatable(Models.Opportunity opportunity)
    {
      if (!Statuses_Updatable.Contains(opportunity.Status))
        throw new ValidationException($"{nameof(Models.Opportunity)} can no longer be updated (current status '{opportunity.Status}'). Required state '{string.Join(" / ", Statuses_Updatable)}'");
    }

    #endregion
  }
}
