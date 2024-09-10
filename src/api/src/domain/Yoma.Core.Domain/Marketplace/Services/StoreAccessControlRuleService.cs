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
    private readonly IMarketplaceService _marketplaceService;
    private readonly IGenderService _genderService;
    private readonly IOpportunityService _opportunityService;

    private readonly StoreAccessControlRuleRequestValidatorUpdate _storeAccessControlRuleRequestValidatorUpdate;
    private readonly StoreAccessControlRuleRequestValidatorCreate _storeAccessControlRuleRequestValidatorCreate;

    private readonly IRepositoryBatchedValueContainsWithNavigation<StoreAccessControlRule> _storeAccessControlRuleRepistory;
    private readonly IRepository<StoreAccessControlRuleOpportunity> _storeAccessControlRuleOpportunityRepository;

    private readonly IExecutionStrategyService _executionStrategyService;
    #endregion

    #region Constructor
    public StoreAccessControlRuleService(
      IStoreAccessControlRuleStatusService storeAccessControlRuleStatusService,
      IOrganizationService organizationService,
      ICountryService countryService,
      IMarketplaceService marketplaceService,
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
      _marketplaceService = marketplaceService;
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
    public StoreAccessControlRuleInfo GetById(Guid id)
    {
      throw new NotImplementedException();
    }

    public List<OrganizationInfo> ListSearchCriteriaOrganizations()
    {
      throw new NotImplementedException();
    }

    public List<StoreInfo> ListSearchCriteriaStores(Guid? organizationId)
    {
      throw new NotImplementedException();
    }

    public StoreAccessControlRuleSearchResults Search(StoreAccessControlRuleSearchFilter filter)
    {
      throw new NotImplementedException();
    }

    public async Task<StoreAccessControlRuleInfo> Create(StoreAccessControlRuleRequestCreate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _storeAccessControlRuleRequestValidatorCreate.ValidateAndThrowAsync(request);

      var status = request.PostAsActive ? StoreAccessControlRuleStatus.Active : StoreAccessControlRuleStatus.Inactive;

      var organization = _organizationService.GetById(request.OrganizationId, false, false, false);
      if (organization.Status != Entity.OrganizationStatus.Active)
        throw new ValidationException("The selected organization is not active");

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      var itemExisting = _storeAccessControlRuleRepistory.Query().Where(o => o.OrganizationId == organization.Id && o.Name.ToLower() == request.Name.ToLower()).SingleOrDefault();
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      if (itemExisting != null)
        throw new ValidationException($"A store access control rule with the name '{request.Name}' already exists for the selected organization");

      var country = _countryService.GetByCodeAplha2(request.StoreCountryCodeAlpha2);

      var gender = request.GenderId.HasValue ? _genderService.GetById(request.GenderId.Value) : null;

      var result = new StoreAccessControlRule
      {
        Id = Guid.NewGuid(),
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

        if (request.Opportunities != null)
        {
          result.Opportunities = [];

          foreach (var item in request.Opportunities)
          {
            var opportunity = _opportunityService.GetById(item, false, true, false);

            if (opportunity.OrganizationId != request.OrganizationId)
              throw new ValidationException($"Opportunity '{opportunity.Title}' does not belong to the specified organization");

            if (!opportunity.Published || !opportunity.VerificationEnabled)
              throw new ValidationException($"Opportunity '{opportunity.Title}' is either not published or does not have verification enabled");

            var ruleOpportunity = new StoreAccessControlRuleOpportunity
            {
              StoreAccessControlRuleId = result.Id,
              OpportunityId = opportunity.Id
            };

            ruleOpportunity = await _storeAccessControlRuleOpportunityRepository.Create(ruleOpportunity);

            result.Opportunities.Add(opportunity.ToOpportunityItem());
          }
        }

        scope.Complete();
      });

      return await ToInfo(result);
    }

    public Task<StoreAccessControlRuleInfo> Update(StoreAccessControlRuleRequestUpdate request)
    {
      throw new NotImplementedException();
    }

    public Task<StoreAccessControlRuleInfo> UpdateStatus(Guid id, StoreAccessControlRuleStatus status)
    {
      throw new NotImplementedException();
    }
    #endregion


    #region Private Members
    private async Task<StoreAccessControlRuleInfo> ToInfo(StoreAccessControlRule item)
    {
      var storeSearchResults = await _marketplaceService.SearchStores(new StoreSearchFilter { CountryCodeAlpha2 = item.StoreCountryCodeAlpha2 });
      var store = storeSearchResults.Items.SingleOrDefault(o => o.Id == item.StoreId);

      var result = new StoreAccessControlRuleInfo
      {
        Id = item.Id,
        Name = item.Name,
        Description = item.Description,
        OrganizationId = item.OrganizationId,
        OrganizationName = item.OrganizationName,
        Store = new StoreInfo
        {
          Id = item.StoreId,
          Name = store?.Name ?? "Unknown",
          CountryId = item.StoreCountryId,
          CountryName = item.StoreCountryName,
          CountryCodeAlpha2 = item.StoreCountryCodeAlpha2,
        },
        AgeFrom = item.AgeFrom,
        AgeTo = item.AgeTo,
        GenderId = item.GenderId,
        Gender = item.Gender,
        OpportunityOption = item.OpportunityOption,
        StatusId = item.StatusId,
        Status = item.Status,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified,
        Opportunities = item.Opportunities
      };

      if (item.StoreItemCategories == null) return result;

      var storeItemCategorySearchResults = store == null ? null : await _marketplaceService.SearchStoreItemCategories(new Models.StoreItemCategorySearchFilter { StoreId = store.Id });

      result.StoreItemCategories = item.StoreItemCategories.Select(item =>
      {
        var storeItemCategory = storeItemCategorySearchResults?.Items.SingleOrDefault(x => x.Id == item);

        return new StoreItemCategoryInfo
        {
          Id = item,
          Name = storeItemCategory?.Name ?? "Unknown"
        };
      }).ToList();

      return result;
    }
    #endregion
  }
}
