using FluentValidation;
using Newtonsoft.Json;
using System.Transactions;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Marketplace.Interfaces;
using Yoma.Core.Domain.Marketplace.Interfaces.Lookups;
using Yoma.Core.Domain.Marketplace.Models;
using Yoma.Core.Domain.Marketplace.Validators;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Interfaces;

namespace Yoma.Core.Domain.Marketplace.Services
{
  public class StoreAccessControlRuleService : IStoreAccessControlRuleService
  {
    #region Class Variables
    private readonly IStoreAccessControlRuleStatusService _storeAccessControlRuleStatusService;
    private readonly IOrganizationService _organizationService;
    private readonly ICountryService _countryService;
    private readonly IGenderService _genderService;
    private readonly IOpportunityService _opportunityService;
    private readonly StoreAccessControlRuleSearchFilterValidator _storeAccessControlRuleSearchFilterValidator;
    private readonly StoreAccessControlRuleRequestValidatorUpdate _storeAccessControlRuleRequestValidatorUpdate;
    private readonly StoreAccessControlRuleRequestValidatorCreate _storeAccessControlRuleRequestValidatorCreate;
    private readonly IRepositoryBatchedValueContainsWithNavigation<StoreAccessControlRule> _storeAccessControlRuleRepistory;
    private readonly IRepository<StoreAccessControlRuleOpportunity> _storeAccessControlRuleOpportunityRepository;
    private readonly IExecutionStrategyService _executionStrategyService;

    private static readonly StoreAccessControlRuleStatus[] Statuses_Updatable = [StoreAccessControlRuleStatus.Active, StoreAccessControlRuleStatus.Inactive];
    private static readonly StoreAccessControlRuleStatus[] Statuses_Activatable = [StoreAccessControlRuleStatus.Inactive];
    private static readonly StoreAccessControlRuleStatus[] Statuses_CanDelete = [StoreAccessControlRuleStatus.Active, StoreAccessControlRuleStatus.Inactive];
    private static readonly StoreAccessControlRuleStatus[] Statuses_DeActivatable = [StoreAccessControlRuleStatus.Active];
    #endregion

    #region Constructor
    public StoreAccessControlRuleService(
      IStoreAccessControlRuleStatusService storeAccessControlRuleStatusService,
      IOrganizationService organizationService,
      ICountryService countryService,
      IGenderService genderService,
      IOpportunityService opportunityService,
      StoreAccessControlRuleSearchFilterValidator storeAccessControlRuleSearchFilterValidator,
      StoreAccessControlRuleRequestValidatorUpdate storeAccessControlRuleRequestValidatorUpdate,
      StoreAccessControlRuleRequestValidatorCreate storeAccessControlRuleRequestValidatorCreate,
      IRepositoryBatchedValueContainsWithNavigation<StoreAccessControlRule> storeAccessControlRuleRepistory,
      IRepository<StoreAccessControlRuleOpportunity> storeAccessControlRuleOpportunityRepository,
      IExecutionStrategyService executionStrategyService)
    {
      _storeAccessControlRuleStatusService = storeAccessControlRuleStatusService;
      _organizationService = organizationService;
      _countryService = countryService;
      _genderService = genderService;
      _opportunityService = opportunityService;
      _storeAccessControlRuleSearchFilterValidator = storeAccessControlRuleSearchFilterValidator;
      _storeAccessControlRuleRequestValidatorUpdate = storeAccessControlRuleRequestValidatorUpdate;
      _storeAccessControlRuleRequestValidatorCreate = storeAccessControlRuleRequestValidatorCreate;
      _storeAccessControlRuleRepistory = storeAccessControlRuleRepistory;
      _storeAccessControlRuleOpportunityRepository = storeAccessControlRuleOpportunityRepository;
      _executionStrategyService = executionStrategyService;
    }
    #endregion

    #region Public Members
    public StoreAccessControlRule GetById(Guid id, bool includeChildItems)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = GetByIdOrNull(id, includeChildItems)
          ?? throw new EntityNotFoundException($"{nameof(StoreAccessControlRule)} with id '{id}' does not exist");

      return result;
    }

    public StoreAccessControlRule? GetByIdOrNull(Guid id, bool includeChildItems)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = _storeAccessControlRuleRepistory.Query(includeChildItems).SingleOrDefault(o => o.Id == id);
      if (result == null) return null;

      return result;
    }

    public List<OrganizationInfo> ListSearchCriteriaOrganizations()
    {
      var query = _storeAccessControlRuleRepistory.Query(false);

      var organizationIds = query.Select(o => o.OrganizationId).Distinct().ToList();

      var filter = new OrganizationSearchFilter
      {
        Organizations = organizationIds,
        InternalUse = true
      };

      var organizations = _organizationService.Search(filter, false).Items;

      return [.. organizations.OrderBy(o => o.Name)];
    }

    public List<StoreInfo> ListSearchCriteriaStores(Guid? organizationId)
    {
      var query = _storeAccessControlRuleRepistory.Query(false);

      if (organizationId.HasValue)
      {
        if (organizationId == Guid.Empty)
          throw new ArgumentNullException(nameof(organizationId));

        query = query.Where(o => o.OrganizationId == organizationId.Value);
      }

      var storeRules = query
        .GroupBy(o => o.StoreId)
        .Select(g => new
        {
          Id = g.Key,
          CountryId = g.First().StoreCountryId,
          CountryName = g.First().StoreCountryName,
          CountryCodeAlpha2 = g.First().StoreCountryCodeAlpha2
        }).ToList();

      //store parsed and name populated by info service
      return storeRules
        .Select(s => new StoreInfo
        {
          Id = s.Id,
          CountryId = s.CountryId,
          CountryName = s.CountryName,
          CountryCodeAlpha2 = s.CountryCodeAlpha2
        })
        .ToList();
    }

    public StoreAccessControlRuleSearchResultsInternal Search(StoreAccessControlRuleSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _storeAccessControlRuleSearchFilterValidator.ValidateAndThrow(filter);

      var query = _storeAccessControlRuleRepistory.Query(true);

      //nameContains
      if (!string.IsNullOrEmpty(filter.NameContains))
        query = _storeAccessControlRuleRepistory.Contains(query, filter.NameContains);

      //stores
      if (filter.Stores != null && filter.Stores.Count != 0)
      {
        filter.Stores = filter.Stores.Distinct().ToList();
        query = query.Where(rule => filter.Stores.Contains(rule.StoreId));
      }

      //organizations
      if (filter.Organizations != null && filter.Organizations.Count != 0)
      {
        filter.Organizations = filter.Organizations.Distinct().ToList();
        query = query.Where(rule => filter.Organizations.Contains(rule.OrganizationId));
      }

      //statuses
      if (filter.Statuses != null && filter.Statuses.Count != 0)
      {
        filter.Statuses = filter.Statuses.Distinct().ToList();
        var statusIds = filter.Statuses.Select(o => _storeAccessControlRuleStatusService.GetByName(o.ToString()).Id).ToList();
        query = query.Where(o => statusIds.Contains(o.StatusId));
      }

      query = query.OrderBy(o => o.Name).ThenBy(o => o.Id);

      var result = new StoreAccessControlRuleSearchResultsInternal();

      //pagination
      if (filter.PaginationEnabled)
      {
        result.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      result.Items = [.. query];
      return result;
    }

    public async Task<StoreAccessControlRule> Create(StoreAccessControlRuleRequestCreate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _storeAccessControlRuleRequestValidatorCreate.ValidateAndThrowAsync(request);

      var status = request.PostAsActive ? StoreAccessControlRuleStatus.Active : StoreAccessControlRuleStatus.Inactive;

      var organization = _organizationService.GetByIdOrNull(request.OrganizationId, false, false, false);
      if (organization == null || organization.Status != Entity.OrganizationStatus.Active)
        throw new ValidationException("The selected organization either does not exist or is inactive");

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      var itemExisting = _storeAccessControlRuleRepistory.Query().Where(o => o.OrganizationId == organization.Id && o.Name.ToLower() == request.Name.ToLower()).SingleOrDefault();
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      if (itemExisting != null)
        throw new ValidationException($"A store access control rule with the name '{request.Name}' already exists for the selected organization");

      //TODO: Duplicate rule validation

      var country = _countryService.GetByCodeAplha2(request.StoreCountryCodeAlpha2);

      var gender = request.GenderId.HasValue ? _genderService.GetById(request.GenderId.Value) : null;

      var result = new StoreAccessControlRule
      {
        Name = request.Name,
        Description = request.Description,
        OrganizationId = organization.Id,
        OrganizationName = organization.Name,
        StoreCountryId = country.Id,
        StoreCountryName = country.Name,
        StoreCountryCodeAlpha2 = country.CodeAlpha2,
        StoreId = request.StoreId,
        StoreItemCategoriesRaw = request.StoreItemCategories == null ? null : JsonConvert.SerializeObject(request.StoreItemCategories),
        StoreItemCategories = request.StoreItemCategories,
        AgeFrom = request.AgeFrom,
        AgeTo = request.AgeTo,
        GenderId = gender?.Id,
        Gender = gender?.Name,
        OpportunityOption = request.OpportunityOption,
        StatusId = _storeAccessControlRuleStatusService.GetByName(status.ToString()).Id,
        Status = StoreAccessControlRuleStatus.Active,
      };

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

        result = await _storeAccessControlRuleRepistory.Create(result);

        await AssignOpportunities(request.Opportunities, result, organization);

        scope.Complete();
      });

      return result;
    }

    public async Task<StoreAccessControlRule> Update(StoreAccessControlRuleRequestUpdate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _storeAccessControlRuleRequestValidatorUpdate.ValidateAndThrowAsync(request);

      var result = GetById(request.Id, true);

      if (!Statuses_Updatable.Contains(result.Status))
        throw new ValidationException($"Store access control rule can no longer be updated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_Updatable)}'");

      var organization = _organizationService.GetByIdOrNull(request.OrganizationId, false, false, false);
      if (organization == null || organization.Status != Entity.OrganizationStatus.Active)
        throw new ValidationException("The selected organization either does not exist or is inactive");

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      var existingRuleByName = _storeAccessControlRuleRepistory.Query()
          .Where(o => o.OrganizationId == organization.Id && o.Name.ToLower() == request.Name.ToLower())
          .SingleOrDefault();
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons

      if (existingRuleByName != null && existingRuleByName.Id != request.Id)
        throw new ValidationException($"A store access control rule with the name '{request.Name}' already exists for the selected organization.");

      //TODO: Duplicate rule validation

      var country = _countryService.GetByCodeAplha2(request.StoreCountryCodeAlpha2);

      var gender = request.GenderId.HasValue ? _genderService.GetById(request.GenderId.Value) : null;

      result.Name = request.Name;
      result.Description = request.Description;
      result.OrganizationId = organization.Id;
      result.OrganizationName = organization.Name;
      result.StoreCountryId = country.Id;
      result.StoreCountryName = country.Name;
      result.StoreCountryCodeAlpha2 = country.CodeAlpha2;
      result.StoreId = request.StoreId;
      result.StoreItemCategoriesRaw = request.StoreItemCategories == null ? null : JsonConvert.SerializeObject(request.StoreItemCategories);
      result.StoreItemCategories = request.StoreItemCategories;
      result.AgeFrom = request.AgeFrom;
      result.AgeTo = request.AgeTo;
      result.GenderId = gender?.Id;
      result.Gender = gender?.Name;
      result.OpportunityOption = request.OpportunityOption;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

        result = await _storeAccessControlRuleRepistory.Update(result);

        var opportunitiesToRemove = result.Opportunities?.Where(o => request.Opportunities != null && !request.Opportunities.Contains(o.Id)).ToList();
        var opportunitiesToAdd = request.Opportunities?.Where(o => result.Opportunities != null && !result.Opportunities.Any(i => i.Id == o)).ToList();

        if (opportunitiesToRemove != null && opportunitiesToRemove.Count > 0)
          foreach (var opportunity in opportunitiesToRemove)
          {
            var item = _storeAccessControlRuleOpportunityRepository.Query().SingleOrDefault(o => o.StoreAccessControlRuleId == result.Id && o.OpportunityId == opportunity.Id);
            if (item == null) continue;

            await _storeAccessControlRuleOpportunityRepository.Delete(item);

            result.Opportunities?.Remove(opportunity);
          }

        await AssignOpportunities(opportunitiesToAdd, result, organization);

        scope.Complete();
      });

      if (result.Opportunities?.Count == 0) result.Opportunities = null;

      return result;
    }

    public async Task<StoreAccessControlRule> UpdateStatus(Guid id, StoreAccessControlRuleStatus status)
    {
      var result = GetById(id, true);

      switch (status)
      {
        case StoreAccessControlRuleStatus.Active:
          if (result.Status == StoreAccessControlRuleStatus.Active) return result;
          if (!Statuses_Activatable.Contains(result.Status))
            throw new ValidationException($"{nameof(StoreAccessControlRule)} can not be activated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_Activatable)}'");
          break;

        case StoreAccessControlRuleStatus.Inactive:
          if (result.Status == StoreAccessControlRuleStatus.Inactive) return result;
          if (!Statuses_DeActivatable.Contains(result.Status))
            throw new ValidationException($"{nameof(StoreAccessControlRule)} can not be deactivated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_DeActivatable)}'");
          break;

        case StoreAccessControlRuleStatus.Deleted:
          if (result.Status == StoreAccessControlRuleStatus.Deleted) return result;
          if (!Statuses_CanDelete.Contains(result.Status))
            throw new ValidationException($"{nameof(StoreAccessControlRule)} can not be deleted (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_CanDelete)}'");
        break;

        default:
          throw new ArgumentOutOfRangeException(nameof(status), $"{nameof(Status)} of '{status}' not supported");
      }

      var statusId = _storeAccessControlRuleStatusService.GetByName(status.ToString()).Id;
      result.StatusId = statusId;
      result.Status = status;

      result = await _storeAccessControlRuleRepistory.Update(result);

      return result;
    }
    #endregion

    #region Private Members
    private async Task AssignOpportunities(List<Guid>? opportunities, StoreAccessControlRule result, Organization organization)
    {
      if (opportunities == null || opportunities.Count == 0) return;

      result.Opportunities ??= [];

      foreach (var opportunityId in opportunities)
      {
        var opportunity = _opportunityService.GetById(opportunityId, true, true, false);
        if (opportunity.OrganizationId != organization.Id)
          throw new ValidationException($"Opportunity '{opportunity.Title}' does not belong to the specified organization");

        if (!opportunity.Published)
          throw new ValidationException($"Opportunity '{opportunity.Title}' is not published");

        if (!opportunity.VerificationEnabled)
          throw new ValidationException($"Opportunity '{opportunity.Title}' does not have verification enabled");

        if (opportunity.Countries != null && !opportunity.Countries.Any(o => o.Id == result.StoreCountryId))
          throw new ValidationException($"Opportunity '{opportunity.Title}' is not available in the selected store country");

        var item = _storeAccessControlRuleOpportunityRepository.Query().SingleOrDefault(o => o.StoreAccessControlRuleId == result.Id && o.OpportunityId == opportunity.Id);
        if (item != null) continue;

        item = new StoreAccessControlRuleOpportunity
        {
          StoreAccessControlRuleId = result.Id,
          OpportunityId = opportunity.Id
        };

        await _storeAccessControlRuleOpportunityRepository.Create(item);

        result.Opportunities.Add(opportunity.ToOpportunityItem());
      }
    }
    #endregion
  }
}
