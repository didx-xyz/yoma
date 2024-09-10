using FluentValidation;
using Newtonsoft.Json;
using System.Transactions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Marketplace.Interfaces;
using Yoma.Core.Domain.Marketplace.Interfaces.Lookups;
using Yoma.Core.Domain.Marketplace.Models;
using Yoma.Core.Domain.Marketplace.Validators;
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
    private readonly StoreAccessControlRuleRequestValidatorUpdate _storeAccessControlRuleRequestValidatorUpdate;
    private readonly StoreAccessControlRuleRequestValidatorCreate _storeAccessControlRuleRequestValidatorCreate;
    private readonly IRepositoryBatchedValueContainsWithNavigation<StoreAccessControlRule> _storeAccessControlRuleRepistory;
    private readonly IRepository<StoreAccessControlRuleOpportunity> _storeAccessControlRuleOpportunityRepository;
    private readonly IExecutionStrategyService _executionStrategyService;

    private static readonly StoreAccessControlRuleStatus[] Statuses_Updatable = [StoreAccessControlRuleStatus.Active, StoreAccessControlRuleStatus.Inactive];
    #endregion

    #region Constructor
    public StoreAccessControlRuleService(
      IStoreAccessControlRuleStatusService storeAccessControlRuleStatusService,
      IOrganizationService organizationService,
      ICountryService countryService,
      IGenderService genderService,
      IOpportunityService opportunityService,
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
      _storeAccessControlRuleRequestValidatorUpdate = storeAccessControlRuleRequestValidatorUpdate;
      _storeAccessControlRuleRequestValidatorCreate = storeAccessControlRuleRequestValidatorCreate;
      _storeAccessControlRuleRepistory = storeAccessControlRuleRepistory;
      _storeAccessControlRuleOpportunityRepository = storeAccessControlRuleOpportunityRepository;
      _executionStrategyService = executionStrategyService;
    }
    #endregion

    #region Public Members
    public StoreAccessControlRule GetById(Guid id)
    {
      throw new NotImplementedException();
    }

    public StoreAccessControlRuleSearchResultsInternal Search(StoreAccessControlRuleSearchFilter filter)
    {
      throw new NotImplementedException();
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

        await AssignOpportunities(request.Opportunities, request, result, organization);

        scope.Complete();
      });

      return result;
    }

    public async Task<StoreAccessControlRule> Update(StoreAccessControlRuleRequestUpdate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _storeAccessControlRuleRequestValidatorUpdate.ValidateAndThrowAsync(request);
      var result = GetById(request.Id);

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

            result.Opportunities?.Remove(opportunity);
          }

        await AssignOpportunities(opportunitiesToAdd, request, result, organization);

        scope.Complete();
      });

      if (result.Opportunities?.Count == 0) result.Opportunities = null;

      return result;
    }

    public Task<StoreAccessControlRule> UpdateStatus(Guid id, StoreAccessControlRuleStatus status)
    {
      throw new NotImplementedException();
    }
    #endregion

    #region Private Members
    private async Task AssignOpportunities(List<Guid>? opportunities, StoreAccessControlRuleRequestBase request, StoreAccessControlRule result, Organization organization)
    {
      if (opportunities == null || opportunities.Count == 0) return;

      result.Opportunities ??= [];

      foreach (var item in opportunities)
      {
        var opportunity = _opportunityService.GetByIdOrNull(item, false, true, false) ?? throw new ValidationException("The specified opportunity does not exist.");
        if (opportunity.OrganizationId != organization.Id)
          throw new ValidationException($"Opportunity '{opportunity.Title}' does not belong to the specified organization.");

        if (!opportunity.Published)
          throw new ValidationException($"Opportunity '{opportunity.Title}' is not published.");

        if (!opportunity.VerificationEnabled)
          throw new ValidationException($"Opportunity '{opportunity.Title}' does not have verification enabled.");

        var ruleOpportunity = new StoreAccessControlRuleOpportunity
        {
          StoreAccessControlRuleId = result.Id,
          OpportunityId = opportunity.Id
        };

        await _storeAccessControlRuleOpportunityRepository.Create(ruleOpportunity);

        result.Opportunities.Add(opportunity.ToOpportunityItem());
      }
    }
    #endregion
  }
}
